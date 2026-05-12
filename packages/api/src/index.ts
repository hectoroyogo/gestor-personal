import {
  type AccountInput,
  type BudgetInput,
  type CategoryInput,
  type HabitInput,
  type HabitLogInput,
  type SavingsGoalInput,
  type TaskInput,
  type TaskUpdateInput,
  type TransactionInput,
  calculateHabitStreak,
  normalizeDateOnly,
  summarizeTransactionsByMonth
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

export async function getDashboard(userId: string) {
  const [tasks, habits, transactions, savingsGoals] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }]
    }),
    prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 31
        }
      }
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 50
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const monthly = summarizeTransactionsByMonth(
    transactions.map((entry) => ({
      amount: Number(entry.amount),
      type: entry.type,
      occurredAt: entry.occurredAt
    }))
  );

  const habitSummary = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    description: habit.description,
    streak: calculateHabitStreak(habit.logs.map((log) => log.date)),
    completions: habit.logs.length,
    targetCount: habit.targetCount
  }));

  return {
    tasks,
    habits: habitSummary,
    savingsGoals: savingsGoals.map((goal) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    })),
    latestTransactions: transactions.slice(0, 8).map((entry) => ({
      ...entry,
      amount: Number(entry.amount)
    })),
    monthly
  };
}

export async function listTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  });
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

  return habits.map((habit) => ({
    ...habit,
    streak: calculateHabitStreak(habit.logs.map((log) => log.date))
  }));
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

export async function listAccounts(userId: string) {
  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    }),
    prisma.transaction.findMany({
      where: { userId }
    })
  ]);

  return accounts.map((account) => {
    const balance = transactions
      .filter((entry) => entry.accountId === account.id)
      .reduce((sum, entry) => {
        const amount = Number(entry.amount);
        if (entry.type === "income") return sum + amount;
        if (entry.type === "expense") return sum - amount;
        return sum;
      }, Number(account.initialBalance));

    return {
      ...account,
      initialBalance: Number(account.initialBalance),
      balance
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

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { name: "asc" }]
  });
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

export async function listTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
      account: true
    },
    orderBy: { occurredAt: "desc" }
  });

  return transactions.map((entry) => ({
    ...entry,
    amount: Number(entry.amount),
    account: {
      ...entry.account,
      initialBalance: Number(entry.account.initialBalance)
    }
  }));
}

export async function createTransaction(userId: string, input: TransactionInput) {
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId }
  });

  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userId }
    });

    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
  }

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

export async function listBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { month: "desc" }
  });

  return budgets.map((budget) => ({
    ...budget,
    limitAmount: Number(budget.limitAmount)
  }));
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

export async function listSavingsGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return goals.map((goal) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount)
  }));
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
