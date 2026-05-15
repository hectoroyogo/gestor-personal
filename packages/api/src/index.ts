import {
  type AccountInput,
  type AccountUpdateInput,
  type BudgetInput,
  type BudgetUpdateInput,
  type CategoryInput,
  type CategoryUpdateInput,
  type HabitInput,
  type HabitLogInput,
  type HabitUpdateInput,
  type SavingsGoalInput,
  type SavingsGoalUpdateInput,
  type TaskInput,
  type TaskUpdateInput,
  type TransactionInput,
  type TransactionUpdateInput,
  calculateHabitStreak,
  normalizeDateOnly
} from "@gestor/core";
import { Prisma, prisma } from "@gestor/db";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
  }
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function currentMonthRange(referenceDate = new Date()) {
  const monthStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));
  const monthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`;

  return { monthStart, monthEnd, monthKey };
}

async function getCurrentMonthSummary(userId: string) {
  const { monthStart, monthEnd, monthKey } = currentMonthRange();
  const transactionSums = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      occurredAt: {
        gte: monthStart,
        lt: monthEnd
      }
    },
    _sum: {
      amount: true
    }
  });

  const summary = transactionSums.reduce(
    (acc, entry) => {
      if (entry.type === "income") {
        acc.income += Number(entry._sum.amount ?? 0);
      }

      if (entry.type === "expense") {
        acc.expense += Number(entry._sum.amount ?? 0);
      }

      return acc;
    },
    { income: 0, expense: 0 }
  );

  return {
    monthKey,
    monthly: {
      [monthKey]: summary
    }
  };
}

function mapTask<T extends {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: Date | null;
}>(task: T) {
  return {
    ...task,
    dueDate: toIsoDate(task.dueDate)
  };
}

function mapHabit<T extends {
  id: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  targetCount: number;
  createdAt: Date;
  logs: Array<{ id: string; date: Date }>;
}>(habit: T) {
  return {
    ...habit,
    createdAt: habit.createdAt.toISOString(),
    streak: calculateHabitStreak(habit.logs.map((log) => log.date)),
    completions: habit.logs.length,
    logs: habit.logs.map((log) => ({
      ...log,
      date: log.date.toISOString()
    }))
  };
}

function mapCategory<T extends {
  id: string;
  name: string;
  kind: "income" | "expense" | "savings";
  color: string;
}>(category: T) {
  return category;
}

function mapBudget<T extends {
  id: string;
  month: string;
  limitAmount: Prisma.Decimal;
  category: {
    id: string;
    name: string;
    kind: "income" | "expense" | "savings";
    color: string;
  };
}>(budget: T) {
  return {
    ...budget,
    limitAmount: Number(budget.limitAmount),
    category: mapCategory(budget.category)
  };
}

function mapSavingsGoal<T extends {
  id: string;
  name: string;
  targetAmount: Prisma.Decimal;
  currentAmount: Prisma.Decimal;
  targetDate?: Date | null;
}>(goal: T) {
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    targetDate: toIsoDate(goal.targetDate)
  };
}

function mapTransaction<T extends {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: "income" | "expense" | "transfer";
  description: string;
  amount: Prisma.Decimal;
  occurredAt: Date;
  account: {
    id: string;
    name: string;
    currency: string;
    initialBalance: Prisma.Decimal;
  };
  category: {
    id: string;
    name: string;
    kind: "income" | "expense" | "savings";
    color: string;
  } | null;
}>(entry: T) {
  return {
    ...entry,
    amount: Number(entry.amount),
    occurredAt: entry.occurredAt.toISOString(),
    account: {
      ...entry.account,
      initialBalance: Number(entry.account.initialBalance)
    },
    category: entry.category ? mapCategory(entry.category) : null
  };
}

export async function getDashboard(userId: string) {
  const [tasks, habits, finance] = await Promise.all([
    listTasks(userId),
    listHabitsForScreen(userId),
    getFinanceScreen(userId)
  ]);

  return {
    tasks,
    habits,
    ...finance
  };
}

export async function getDashboardOverview(userId: string) {
  const [taskCounts, openTasks, habits, accounts, savingsGoals, savingsTotals, monthSummary] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        _all: true
      }
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: {
          not: "done"
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      take: 4
    }),
    prisma.habit.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        logs: {
          select: { date: true },
          orderBy: { date: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    listAccounts(userId),
    prisma.savingsGoal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true
      },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.savingsGoal.aggregate({
      where: { userId },
      _sum: {
        targetAmount: true,
        currentAmount: true
      }
    }),
    getCurrentMonthSummary(userId)
  ]);

  const completedTasks = taskCounts.find((entry) => entry.status === "done")?._count._all ?? 0;
  const activeTasks = taskCounts.reduce(
    (total, entry) => total + (entry.status === "done" ? 0 : entry._count._all),
    0
  );
  const topHabits = habits.slice(0, 4).map((habit) => ({
    id: habit.id,
    name: habit.name,
    streak: calculateHabitStreak(habit.logs.map((log) => log.date))
  }));
  const bestHabit = habits.reduce(
    (best, habit) => {
      const streak = calculateHabitStreak(habit.logs.map((log) => log.date));
      return streak > best.streak ? { id: habit.id, name: habit.name, streak } : best;
    },
    { id: "", name: "Sin hábitos aún", streak: 0 }
  );
  const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalSavings = Number(savingsTotals._sum.currentAmount ?? 0);
  const targetSavings = Number(savingsTotals._sum.targetAmount ?? 0);

  return {
    taskStats: {
      active: activeTasks,
      completed: completedTasks
    },
    openTasks: openTasks.map(mapTask),
    topHabits,
    bestHabit,
    balance,
    monthly: monthSummary.monthly,
    currentMonthKey: monthSummary.monthKey,
    savingsGoals: savingsGoals.map(mapSavingsGoal),
    savingsProgress: targetSavings > 0 ? Math.min(100, Math.round((totalSavings / targetSavings) * 100)) : 0
  };
}

export async function listTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  });

  return tasks.map(mapTask);
}

export async function createTask(userId: string, input: TaskInput) {
  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null
    }
  });
}

export async function updateTask(userId: string, taskId: string, input: TaskUpdateInput) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate
    }
  });
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  await prisma.task.delete({
    where: { id: taskId }
  });
}

export async function listHabits(userId: string) {
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 60
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return habits.map(mapHabit);
}

export async function listHabitsForScreen(userId: string) {
  const habits = await prisma.habit.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      frequency: true,
      targetCount: true,
      createdAt: true,
      logs: {
        select: {
          id: true,
          date: true
        },
        orderBy: { date: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return habits.map(mapHabit);
}

export async function createHabit(userId: string, input: HabitInput) {
  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      frequency: input.frequency,
      targetCount: input.targetCount
    }
  });
}

export async function updateHabit(userId: string, habitId: string, input: HabitUpdateInput) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId }
  });

  if (!habit) {
    throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
  }

  return prisma.habit.update({
    where: { id: habitId },
    data: {
      name: input.name,
      description: input.description,
      frequency: input.frequency,
      targetCount: input.targetCount
    }
  });
}

export async function deleteHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId }
  });

  if (!habit) {
    throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
  }

  await prisma.habit.delete({
    where: { id: habitId }
  });
}

export async function logHabit(userId: string, input: HabitLogInput) {
  const habit = await prisma.habit.findFirst({
    where: { id: input.habitId, userId }
  });

  if (!habit) {
    throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
  }

  return prisma.habitLog.upsert({
    where: {
      habitId_date: {
        habitId: input.habitId,
        date: normalizeDateOnly(input.date)
      }
    },
    update: {},
    create: {
      habitId: input.habitId,
      userId,
      date: normalizeDateOnly(input.date)
    }
  });
}

export async function deleteHabitLog(userId: string, input: HabitLogInput) {
  const habit = await prisma.habit.findFirst({
    where: { id: input.habitId, userId }
  });

  if (!habit) {
    throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
  }

  await prisma.habitLog.deleteMany({
    where: {
      habitId: input.habitId,
      userId,
      date: normalizeDateOnly(input.date)
    }
  });
}

export async function listAccounts(userId: string) {
  const [accounts, transactionGroups] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        currency: true,
        initialBalance: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.transaction.groupBy({
      by: ["accountId", "type"],
      where: { userId },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })
  ]);

  const transactionStats = transactionGroups.reduce<Record<string, { balanceDelta: number; count: number }>>((acc, entry) => {
    const current = acc[entry.accountId] ?? { balanceDelta: 0, count: 0 };
    const amount = Number(entry._sum.amount ?? 0);
    current.balanceDelta += entry.type === "income" ? amount : entry.type === "expense" ? -amount : 0;
    current.count += entry._count._all;
    acc[entry.accountId] = current;
    return acc;
  }, {});

  return accounts.map((account) => {
    const stats = transactionStats[account.id] ?? { balanceDelta: 0, count: 0 };

    return {
      ...account,
      initialBalance: Number(account.initialBalance),
      balance: Number(account.initialBalance) + stats.balanceDelta,
      transactionCount: stats.count
    };
  });
}

export async function createAccount(userId: string, input: AccountInput) {
  return prisma.account.create({
    data: {
      userId,
      name: input.name,
      currency: input.currency,
      initialBalance: decimal(input.initialBalance)
    }
  });
}

export async function updateAccount(userId: string, accountId: string, input: AccountUpdateInput) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  return prisma.account.update({
    where: { id: accountId },
    data: {
      name: input.name,
      currency: input.currency,
      initialBalance: input.initialBalance === undefined ? undefined : decimal(input.initialBalance)
    }
  });
}

export async function deleteAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  await prisma.account.delete({
    where: { id: accountId }
  });
}

export async function listCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { name: "asc" }]
  });

  return categories.map(mapCategory);
}

export async function createCategory(userId: string, input: CategoryInput) {
  return prisma.category.create({
    data: {
      userId,
      name: input.name,
      kind: input.kind,
      color: input.color
    }
  });
}

export async function updateCategory(userId: string, categoryId: string, input: CategoryUpdateInput) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId }
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      kind: input.kind,
      color: input.color
    }
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId }
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  await prisma.category.delete({
    where: { id: categoryId }
  });
}

export async function listTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
      account: true
    },
    orderBy: { occurredAt: "desc" }
  });

  return transactions.map(mapTransaction);
}

export async function createTransaction(userId: string, input: TransactionInput) {
  await assertTransactionRelations(userId, input.accountId, input.categoryId);

  return prisma.transaction.create({
    data: {
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      type: input.type,
      description: input.description,
      amount: decimal(input.amount),
      occurredAt: input.occurredAt
    }
  });
}

async function assertTransactionRelations(userId: string, accountId?: string, categoryId?: string | null) {
  if (accountId) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
  }
}

export async function updateTransaction(userId: string, transactionId: string, input: TransactionUpdateInput) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId }
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
  }

  await assertTransactionRelations(userId, input.accountId, input.categoryId);

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      description: input.description,
      amount: input.amount === undefined ? undefined : decimal(input.amount),
      occurredAt: input.occurredAt
    }
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId }
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
  }

  await prisma.transaction.delete({
    where: { id: transactionId }
  });
}

export async function listBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { month: "desc" }
  });

  return budgets.map(mapBudget);
}

export async function createBudget(userId: string, input: BudgetInput) {
  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      userId
    }
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId: input.categoryId,
        month: input.month
      }
    },
    update: {
      limitAmount: decimal(input.limitAmount)
    },
    create: {
      userId,
      categoryId: input.categoryId,
      month: input.month,
      limitAmount: decimal(input.limitAmount)
    }
  });
}

export async function updateBudget(userId: string, budgetId: string, input: BudgetUpdateInput) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId }
  });

  if (!budget) {
    throw new AppError("Budget not found", 404, "BUDGET_NOT_FOUND");
  }

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        userId
      }
    });

    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
  }

  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      categoryId: input.categoryId,
      month: input.month,
      limitAmount: input.limitAmount === undefined ? undefined : decimal(input.limitAmount)
    }
  });
}

export async function deleteBudget(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId }
  });

  if (!budget) {
    throw new AppError("Budget not found", 404, "BUDGET_NOT_FOUND");
  }

  await prisma.budget.delete({
    where: { id: budgetId }
  });
}

export async function listSavingsGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return goals.map(mapSavingsGoal);
}

export async function getFinanceScreen(userId: string) {
  const [accounts, categories, budgets, savingsGoals, latestTransactions, monthSummary] = await Promise.all([
    listAccounts(userId),
    listCategories(userId),
    listBudgets(userId),
    listSavingsGoals(userId),
    prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        accountId: true,
        categoryId: true,
        type: true,
        description: true,
        amount: true,
        occurredAt: true,
        account: {
          select: {
            id: true,
            name: true,
            currency: true,
            initialBalance: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            kind: true,
            color: true
          }
        }
      },
      orderBy: { occurredAt: "desc" },
      take: 8
    }),
    getCurrentMonthSummary(userId)
  ]);

  return {
    accounts,
    categories,
    budgets: budgets.slice(0, 5),
    savingsGoals,
    latestTransactions: latestTransactions.map(mapTransaction),
    monthly: monthSummary.monthly,
    currentMonthKey: monthSummary.monthKey
  };
}

export async function createSavingsGoal(userId: string, input: SavingsGoalInput) {
  return prisma.savingsGoal.create({
    data: {
      userId,
      name: input.name,
      targetAmount: decimal(input.targetAmount),
      currentAmount: decimal(input.currentAmount),
      targetDate: input.targetDate ?? null
    }
  });
}

export async function updateSavingsGoal(userId: string, goalId: string, input: SavingsGoalUpdateInput) {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId }
  });

  if (!goal) {
    throw new AppError("Savings goal not found", 404, "SAVINGS_GOAL_NOT_FOUND");
  }

  return prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      name: input.name,
      targetAmount: input.targetAmount === undefined ? undefined : decimal(input.targetAmount),
      currentAmount: input.currentAmount === undefined ? undefined : decimal(input.currentAmount),
      targetDate: input.targetDate
    }
  });
}

export async function deleteSavingsGoal(userId: string, goalId: string) {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId }
  });

  if (!goal) {
    throw new AppError("Savings goal not found", 404, "SAVINGS_GOAL_NOT_FOUND");
  }

  await prisma.savingsGoal.delete({
    where: { id: goalId }
  });
}
