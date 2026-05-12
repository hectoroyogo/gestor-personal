import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export const habitFrequencySchema = z.enum(["daily", "weekly"]);
export const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);
export const categoryKindSchema = z.enum(["income", "expense", "savings"]);

export const registerInputSchema = z.object({
  email: z.email().max(255),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128)
});

export const loginInputSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128)
});

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  dueDate: z.coerce.date().optional().nullable()
});

export const taskUpdateInputSchema = taskInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one task field is required"
);

export const habitInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional().nullable(),
  frequency: habitFrequencySchema.default("daily"),
  targetCount: z.number().int().min(1).max(31).default(1)
});

export const habitLogInputSchema = z.object({
  habitId: z.string().cuid(),
  date: z.coerce.date()
});

export const accountInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  currency: z.string().trim().length(3).toUpperCase().default("EUR"),
  initialBalance: z.number().finite().default(0)
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: categoryKindSchema,
  color: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/).default("#2563eb")
});

export const transactionInputSchema = z.object({
  accountId: z.string().cuid(),
  categoryId: z.string().cuid().optional().nullable(),
  type: transactionTypeSchema,
  description: z.string().trim().min(1).max(180),
  amount: z.number().finite().positive(),
  occurredAt: z.coerce.date()
});

export const budgetInputSchema = z.object({
  categoryId: z.string().cuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  limitAmount: z.number().finite().positive()
});

export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: z.number().finite().positive(),
  currentAmount: z.number().finite().min(0).default(0),
  targetDate: z.coerce.date().optional().nullable()
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateInputSchema>;
export type HabitInput = z.infer<typeof habitInputSchema>;
export type HabitLogInput = z.infer<typeof habitLogInputSchema>;
export type AccountInput = z.infer<typeof accountInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalInputSchema>;

export type DashboardMetric = {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger";
  hint: string;
};

export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizeDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function calculateHabitStreak(logDates: Date[], referenceDate = new Date()): number {
  const normalized = new Set(
    logDates.map((date) => normalizeDateOnly(date).toISOString())
  );

  let streak = 0;
  const cursor = normalizeDateOnly(referenceDate);

  while (normalized.has(cursor.toISOString())) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function summarizeTransactionsByMonth(
  entries: Array<{ amount: number; type: "income" | "expense" | "transfer"; occurredAt: Date }>
) {
  return entries.reduce<Record<string, { income: number; expense: number }>>((acc, entry) => {
    const key = toMonthKey(entry.occurredAt);
    if (!acc[key]) {
      acc[key] = { income: 0, expense: 0 };
    }

    if (entry.type === "income") {
      acc[key].income += entry.amount;
    }

    if (entry.type === "expense") {
      acc[key].expense += entry.amount;
    }

    return acc;
  }, {});
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}
