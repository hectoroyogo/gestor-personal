"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, normalizeDateOnly } from "@gestor/core";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type HabitFrequency = "daily" | "weekly";
type TransactionType = "income" | "expense" | "transfer";
type CategoryKind = "income" | "expense" | "savings";

type RequestMethod = "POST" | "PATCH" | "DELETE";

export type TaskActionData = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | string | null;
};

export type HabitActionData = {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  targetCount: number;
  streak: number;
  logs: Array<{ id: string; date: Date | string }>;
};

export type AccountActionData = {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  balance: number;
};

export type CategoryActionData = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
};

export type BudgetActionData = {
  id: string;
  month: string;
  limitAmount: number;
  category: CategoryActionData;
};

export type TransactionActionData = {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  description: string;
  amount: number;
  occurredAt: Date | string;
  account?: Omit<AccountActionData, "balance"> & { balance?: number };
  category?: CategoryActionData | null;
};

export type SavingsGoalActionData = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date | string | null;
};

const priorityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta"
} as const;

const statusLabels = {
  todo: "Pendiente",
  in_progress: "En curso",
  done: "Completada"
} as const;

const typeLabels = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia"
} as const;

async function requestJson<T = unknown>(path: string, method: RequestMethod, payload?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(body?.error?.message ?? "No se pudo guardar el cambio");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function useRefreshAfterMutation() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function run(action: () => Promise<void>) {
    setError(null);
    setIsSaving(true);

    try {
      await action();
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar el cambio");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    error,
    isBusy: isSaving || isPending,
    run
  };
}

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function formNumber(form: FormData, key: string) {
  return Number(form.get(key));
}

function dateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function weekDates() {
  const today = normalizeDateOnly(new Date());
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date;
  });
}

export function CreateTaskForm() {
  const mutation = useRefreshAfterMutation();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const dueDate = formString(form, "dueDate");

    await mutation.run(async () => {
      await requestJson("/api/tasks", "POST", {
        title: formString(form, "title"),
        description: formString(form, "description") || null,
        priority: formString(form, "priority"),
        status: formString(form, "status"),
        dueDate: dueDate || null
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm taskCreateForm" onSubmit={onSubmit}>
      <input className="glassInput" name="title" type="text" placeholder="Nueva tarea" required maxLength={160} />
      <input className="glassInput" name="description" type="text" placeholder="Descripción" maxLength={2000} />
      <input className="glassInput" name="dueDate" type="date" aria-label="Fecha límite" />
      <select className="glassSelect" name="priority" defaultValue="medium" aria-label="Prioridad">
        <option value="high">Alta</option>
        <option value="medium">Media</option>
        <option value="low">Baja</option>
      </select>
      <select className="glassSelect" name="status" defaultValue="todo" aria-label="Estado">
        <option value="todo">Pendiente</option>
        <option value="in_progress">En curso</option>
        <option value="done">Completada</option>
      </select>
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function TaskEditorRow({ task }: { task: TaskActionData }) {
  const mutation = useRefreshAfterMutation();
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dueDate = formString(form, "dueDate");

    await mutation.run(async () => {
      await requestJson(`/api/tasks/${task.id}`, "PATCH", {
        title: formString(form, "title"),
        description: formString(form, "description") || null,
        status: formString(form, "status"),
        priority: formString(form, "priority"),
        dueDate: dueDate || null
      });
      setIsEditing(false);
    });
  }

  async function updateStatus(status: TaskStatus) {
    await mutation.run(async () => {
      await requestJson(`/api/tasks/${task.id}`, "PATCH", { status });
    });
  }

  async function deleteTask() {
    if (!window.confirm("¿Eliminar esta tarea?")) return;

    await mutation.run(async () => {
      await requestJson(`/api/tasks/${task.id}`, "DELETE");
    });
  }

  if (isEditing) {
    return (
      <form className="todoItem editItem" onSubmit={onSubmit}>
        <input className="glassInput" name="title" defaultValue={task.title} required maxLength={160} />
        <input className="glassInput" name="description" defaultValue={task.description ?? ""} maxLength={2000} />
        <input className="glassInput" name="dueDate" type="date" defaultValue={dateInputValue(task.dueDate)} />
        <select className="glassSelect" name="priority" defaultValue={task.priority}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select className="glassSelect" name="status" defaultValue={task.status}>
          <option value="todo">Pendiente</option>
          <option value="in_progress">En curso</option>
          <option value="done">Completada</option>
        </select>
        <div className="rowActions">
          <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
            Guardar
          </button>
          <button className="btn" type="button" onClick={() => setIsEditing(false)}>
            Cancelar
          </button>
        </div>
        {mutation.error ? <p className="formError">{mutation.error}</p> : null}
      </form>
    );
  }

  return (
    <div className={`todoItem${task.status === "done" ? " done" : ""}`}>
      <button
        className={`todoCheckbox${task.status === "done" ? " checked" : ""}`}
        type="button"
        onClick={() => updateStatus(task.status === "done" ? "todo" : "done")}
        disabled={mutation.isBusy}
        aria-label={task.status === "done" ? "Marcar como pendiente" : "Marcar como completada"}
      />
      <div className="todoContent">
        <strong>{task.title}</strong>
        <span>{task.description ?? "Sin descripción"}</span>
      </div>
      <div className="itemBadges">
        <span className={`badge badge-${task.priority}`}>{priorityLabels[task.priority]}</span>
        <span className={`badge status-${task.status}`}>{statusLabels[task.status]}</span>
      </div>
      <div className="rowActions">
        <button className="btn compactBtn" type="button" onClick={() => updateStatus("in_progress")} disabled={mutation.isBusy}>
          En curso
        </button>
        <button className="btn compactBtn" type="button" onClick={() => setIsEditing(true)}>
          Editar
        </button>
        <button className="btn compactBtn dangerBtn" type="button" onClick={deleteTask} disabled={mutation.isBusy}>
          Eliminar
        </button>
      </div>
      {mutation.error ? <span className="inlineError">{mutation.error}</span> : null}
    </div>
  );
}

export function CreateHabitForm() {
  const mutation = useRefreshAfterMutation();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    await mutation.run(async () => {
      await requestJson("/api/habits", "POST", {
        name: formString(form, "name"),
        description: formString(form, "description") || null,
        frequency: formString(form, "frequency"),
        targetCount: formNumber(form, "targetCount")
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm habitCreateForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" type="text" placeholder="Nuevo hábito" required maxLength={120} />
      <input className="glassInput" name="description" type="text" placeholder="Descripción" maxLength={400} />
      <select className="glassSelect" name="frequency" defaultValue="daily" aria-label="Frecuencia">
        <option value="daily">Diario</option>
        <option value="weekly">Semanal</option>
      </select>
      <input className="glassInput amountInput" name="targetCount" type="number" min="1" max="31" defaultValue="1" />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function HabitEditorRow({ habit }: { habit: HabitActionData }) {
  const mutation = useRefreshAfterMutation();
  const [isEditing, setIsEditing] = useState(false);
  const loggedDates = new Set(habit.logs.map((log) => dateInputValue(log.date)));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await mutation.run(async () => {
      await requestJson(`/api/habits/${habit.id}`, "PATCH", {
        name: formString(form, "name"),
        description: formString(form, "description") || null,
        frequency: formString(form, "frequency"),
        targetCount: formNumber(form, "targetCount")
      });
      setIsEditing(false);
    });
  }

  async function toggleLog(date: Date) {
    const key = dateInputValue(date);
    const method: RequestMethod = loggedDates.has(key) ? "DELETE" : "POST";

    await mutation.run(async () => {
      await requestJson("/api/habit-logs", method, {
        habitId: habit.id,
        date: key
      });
    });
  }

  async function deleteHabit() {
    if (!window.confirm("¿Eliminar este hábito y sus registros?")) return;

    await mutation.run(async () => {
      await requestJson(`/api/habits/${habit.id}`, "DELETE");
    });
  }

  if (isEditing) {
    return (
      <form className="habitRow expanded editItem" onSubmit={onSubmit}>
        <input className="glassInput" name="name" defaultValue={habit.name} required maxLength={120} />
        <input className="glassInput" name="description" defaultValue={habit.description ?? ""} maxLength={400} />
        <select className="glassSelect" name="frequency" defaultValue={habit.frequency}>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
        </select>
        <input className="glassInput amountInput" name="targetCount" type="number" min="1" max="31" defaultValue={habit.targetCount} />
        <div className="rowActions">
          <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
            Guardar
          </button>
          <button className="btn" type="button" onClick={() => setIsEditing(false)}>
            Cancelar
          </button>
        </div>
        {mutation.error ? <p className="formError">{mutation.error}</p> : null}
      </form>
    );
  }

  return (
    <div className="habitRow expanded">
      <span className="habitIcon">H</span>
      <div className="habitInfo">
        <strong>{habit.name}</strong>
        <span>{habit.description ?? `${habit.streak} días de racha`}</span>
      </div>
      <div className="habitDays">
        {weekDates().map((date) => {
          const key = dateInputValue(date);
          const isDone = loggedDates.has(key);
          const isToday = key === dateInputValue(new Date());

          return (
            <button
              className={`habitDay${isDone ? " done" : ""}${isToday ? " today" : ""}`}
              key={`${habit.id}-${key}`}
              type="button"
              onClick={() => toggleLog(date)}
              disabled={mutation.isBusy}
              aria-label={`${isDone ? "Desmarcar" : "Marcar"} ${key}`}
            >
              {date.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 1).toUpperCase()}
            </button>
          );
        })}
      </div>
      <div className="rowActions">
        <button className="btn compactBtn" type="button" onClick={() => setIsEditing(true)}>
          Editar
        </button>
        <button className="btn compactBtn dangerBtn" type="button" onClick={deleteHabit} disabled={mutation.isBusy}>
          Eliminar
        </button>
      </div>
      {mutation.error ? <span className="inlineError">{mutation.error}</span> : null}
    </div>
  );
}

export function CreateAccountForm() {
  const mutation = useRefreshAfterMutation();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    await mutation.run(async () => {
      await requestJson("/api/accounts", "POST", {
        name: formString(form, "name"),
        currency: formString(form, "currency") || "EUR",
        initialBalance: formNumber(form, "initialBalance")
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm financeForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" placeholder="Cuenta" required maxLength={120} />
      <input className="glassInput amountInput" name="initialBalance" type="number" step="0.01" defaultValue="0" />
      <input className="glassInput currencyInput" name="currency" defaultValue="EUR" maxLength={3} aria-label="Moneda" />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function CreateCategoryForm() {
  const mutation = useRefreshAfterMutation();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    await mutation.run(async () => {
      await requestJson("/api/categories", "POST", {
        name: formString(form, "name"),
        kind: formString(form, "kind"),
        color: formString(form, "color")
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm financeForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" placeholder="Categoría" required maxLength={100} />
      <select className="glassSelect" name="kind" defaultValue="expense" aria-label="Tipo">
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
        <option value="savings">Ahorro</option>
      </select>
      <input className="glassInput colorInput" name="color" type="color" defaultValue="#2563eb" aria-label="Color" />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function CreateTransactionForm({
  accounts,
  categories
}: {
  accounts: AccountActionData[];
  categories: CategoryActionData[];
}) {
  const mutation = useRefreshAfterMutation();
  const today = dateInputValue(new Date());

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const categoryId = formString(form, "categoryId");

    await mutation.run(async () => {
      await requestJson("/api/transactions", "POST", {
        accountId: formString(form, "accountId"),
        categoryId: categoryId || null,
        type: formString(form, "type"),
        description: formString(form, "description"),
        amount: formNumber(form, "amount"),
        occurredAt: formString(form, "occurredAt")
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm transactionForm" onSubmit={onSubmit}>
      <select className="glassSelect" name="accountId" required disabled={accounts.length === 0} aria-label="Cuenta">
        {accounts.length === 0 ? <option value="">Crea una cuenta primero</option> : null}
        {accounts.map((account) => (
          <option value={account.id} key={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <select className="glassSelect" name="type" defaultValue="expense" aria-label="Tipo">
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
        <option value="transfer">Transferencia</option>
      </select>
      <select className="glassSelect" name="categoryId" defaultValue="" aria-label="Categoría">
        <option value="">Sin categoría</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <input className="glassInput" name="description" placeholder="Descripción" required maxLength={180} />
      <input className="glassInput amountInput" name="amount" type="number" min="0.01" step="0.01" placeholder="Importe" required />
      <input className="glassInput" name="occurredAt" type="date" defaultValue={today} required />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy || accounts.length === 0}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function CreateBudgetForm({ categories }: { categories: CategoryActionData[] }) {
  const mutation = useRefreshAfterMutation();
  const expenseCategories = categories.filter((category) => category.kind === "expense");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    await mutation.run(async () => {
      await requestJson("/api/budgets", "POST", {
        categoryId: formString(form, "categoryId"),
        month: formString(form, "month"),
        limitAmount: formNumber(form, "limitAmount")
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm financeForm" onSubmit={onSubmit}>
      <select className="glassSelect" name="categoryId" required disabled={expenseCategories.length === 0} aria-label="Categoría">
        {expenseCategories.length === 0 ? <option value="">Crea una categoría de gasto</option> : null}
        {expenseCategories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <input className="glassInput" name="month" type="month" defaultValue={new Date().toISOString().slice(0, 7)} required />
      <input className="glassInput amountInput" name="limitAmount" type="number" min="0.01" step="0.01" placeholder="Límite" required />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy || expenseCategories.length === 0}>
        Guardar
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}

export function TransactionRow({
  transaction,
  accounts,
  categories
}: {
  transaction: TransactionActionData;
  accounts: AccountActionData[];
  categories: CategoryActionData[];
}) {
  const mutation = useRefreshAfterMutation();
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryId = formString(form, "categoryId");

    await mutation.run(async () => {
      await requestJson(`/api/transactions/${transaction.id}`, "PATCH", {
        accountId: formString(form, "accountId"),
        categoryId: categoryId || null,
        type: formString(form, "type"),
        description: formString(form, "description"),
        amount: formNumber(form, "amount"),
        occurredAt: formString(form, "occurredAt")
      });
      setIsEditing(false);
    });
  }

  async function deleteTransaction() {
    if (!window.confirm("¿Eliminar esta transacción?")) return;

    await mutation.run(async () => {
      await requestJson(`/api/transactions/${transaction.id}`, "DELETE");
    });
  }

  if (isEditing) {
    return (
      <form className="transItem editItem" onSubmit={onSubmit}>
        <select className="glassSelect" name="accountId" defaultValue={transaction.accountId}>
          {accounts.map((account) => (
            <option value={account.id} key={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <select className="glassSelect" name="type" defaultValue={transaction.type}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
          <option value="transfer">Transferencia</option>
        </select>
        <select className="glassSelect" name="categoryId" defaultValue={transaction.categoryId ?? ""}>
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input className="glassInput" name="description" defaultValue={transaction.description} required maxLength={180} />
        <input className="glassInput amountInput" name="amount" type="number" min="0.01" step="0.01" defaultValue={transaction.amount} />
        <input className="glassInput" name="occurredAt" type="date" defaultValue={dateInputValue(transaction.occurredAt)} />
        <div className="rowActions">
          <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
            Guardar
          </button>
          <button className="btn" type="button" onClick={() => setIsEditing(false)}>
            Cancelar
          </button>
        </div>
        {mutation.error ? <p className="formError">{mutation.error}</p> : null}
      </form>
    );
  }

  return (
    <div className="transItem">
      <span className={`transIcon ${transaction.type}`}>{transaction.type === "expense" ? "-" : "+"}</span>
      <div className="transInfo">
        <strong>{transaction.description}</strong>
        <span>
          {typeLabels[transaction.type]} · {transaction.account?.name ?? "Cuenta"} · {dateInputValue(transaction.occurredAt)}
        </span>
      </div>
      <strong className={`transAmount ${transaction.type === "expense" ? "neg" : "pos"}`}>
        {transaction.type === "expense" ? "-" : "+"}
        {formatCurrency(transaction.amount)}
      </strong>
      <div className="rowActions">
        <button className="btn compactBtn" type="button" onClick={() => setIsEditing(true)}>
          Editar
        </button>
        <button className="btn compactBtn dangerBtn" type="button" onClick={deleteTransaction} disabled={mutation.isBusy}>
          Eliminar
        </button>
      </div>
      {mutation.error ? <span className="inlineError">{mutation.error}</span> : null}
    </div>
  );
}

export function SavingsGoalEditor({ goal }: { goal: SavingsGoalActionData }) {
  const mutation = useRefreshAfterMutation();
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const targetDate = formString(form, "targetDate");

    await mutation.run(async () => {
      await requestJson(`/api/savings-goals/${goal.id}`, "PATCH", {
        name: formString(form, "name"),
        targetAmount: formNumber(form, "targetAmount"),
        currentAmount: formNumber(form, "currentAmount"),
        targetDate: targetDate || null
      });
      setIsEditing(false);
    });
  }

  async function deleteGoal() {
    if (!window.confirm("¿Eliminar esta meta de ahorro?")) return;

    await mutation.run(async () => {
      await requestJson(`/api/savings-goals/${goal.id}`, "DELETE");
    });
  }

  if (isEditing) {
    return (
      <form className="savingItem editItem" onSubmit={onSubmit}>
        <input className="glassInput" name="name" defaultValue={goal.name} required maxLength={120} />
        <input className="glassInput" name="targetAmount" type="number" min="0.01" step="0.01" defaultValue={goal.targetAmount} />
        <input className="glassInput" name="currentAmount" type="number" min="0" step="0.01" defaultValue={goal.currentAmount} />
        <input className="glassInput" name="targetDate" type="date" defaultValue={dateInputValue(goal.targetDate)} />
        <div className="rowActions">
          <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
            Guardar
          </button>
          <button className="btn" type="button" onClick={() => setIsEditing(false)}>
            Cancelar
          </button>
        </div>
        {mutation.error ? <p className="formError">{mutation.error}</p> : null}
      </form>
    );
  }

  const progress = Math.min(100, Math.round((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100));

  return (
    <div className="savingItem">
      <div className="savingHeader">
        <strong>{goal.name}</strong>
        <span>{progress}%</span>
      </div>
      <div className="progressTrack">
        <div className="progressFill green" style={{ width: `${progress}%` }} />
      </div>
      <span className="savingAmounts">
        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
      </span>
      <div className="rowActions">
        <button className="btn compactBtn" type="button" onClick={() => setIsEditing(true)}>
          Editar
        </button>
        <button className="btn compactBtn dangerBtn" type="button" onClick={deleteGoal} disabled={mutation.isBusy}>
          Eliminar
        </button>
      </div>
      {mutation.error ? <span className="inlineError">{mutation.error}</span> : null}
    </div>
  );
}

export function CreateSavingsGoalForm() {
  const mutation = useRefreshAfterMutation();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const targetDate = formString(form, "targetDate");

    await mutation.run(async () => {
      await requestJson("/api/savings-goals", "POST", {
        name: formString(form, "name"),
        targetAmount: formNumber(form, "targetAmount"),
        currentAmount: formNumber(form, "currentAmount"),
        targetDate: targetDate || null
      });
      formElement.reset();
    });
  }

  return (
    <form className="inlineForm savingsCreateForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" type="text" placeholder="Nueva meta" required maxLength={120} />
      <input className="glassInput amountInput" name="targetAmount" type="number" min="0.01" step="0.01" placeholder="Objetivo" required />
      <input className="glassInput amountInput" name="currentAmount" type="number" min="0" step="0.01" placeholder="Actual" defaultValue="0" />
      <input className="glassInput" name="targetDate" type="date" aria-label="Fecha objetivo" />
      <button className="btn btnPrimary" type="submit" disabled={mutation.isBusy}>
        Crear
      </button>
      {mutation.error ? <p className="formError">{mutation.error}</p> : null}
    </form>
  );
}
