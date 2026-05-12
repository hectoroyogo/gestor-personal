"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type TaskStatus = "todo" | "in_progress" | "done";

async function requestJson(path: string, method: "POST" | "PATCH", payload: unknown) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(body?.error?.message ?? "No se pudo guardar el cambio");
  }
}

export function CreateTaskForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const priority = String(form.get("priority") ?? "medium");

    try {
      await requestJson("/api/tasks", "POST", {
        title,
        priority,
        status: "todo"
      });
      event.currentTarget.reset();
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo crear la tarea");
    }
  }

  return (
    <form className="inlineForm" onSubmit={onSubmit}>
      <input className="glassInput" name="title" type="text" placeholder="Nueva tarea..." required />
      <select className="glassSelect" name="priority" defaultValue="medium" aria-label="Prioridad">
        <option value="high">Alta</option>
        <option value="medium">Media</option>
        <option value="low">Baja</option>
      </select>
      <button className="btn btnPrimary" type="submit" disabled={isPending} aria-label="Añadir tarea">
        +
      </button>
      {error ? <p className="formError">{error}</p> : null}
    </form>
  );
}

export function CreateHabitForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();

    try {
      await requestJson("/api/habits", "POST", {
        name,
        frequency: "daily",
        targetCount: 1
      });
      event.currentTarget.reset();
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo crear el hábito");
    }
  }

  return (
    <form className="inlineForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" type="text" placeholder="Nuevo hábito..." required />
      <button className="btn btnPrimary" type="submit" disabled={isPending} aria-label="Añadir hábito">
        +
      </button>
      {error ? <p className="formError">{error}</p> : null}
    </form>
  );
}

export function CreateSavingsGoalForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const targetAmount = Number(form.get("targetAmount"));

    try {
      await requestJson("/api/savings-goals", "POST", {
        name,
        targetAmount,
        currentAmount: 0
      });
      event.currentTarget.reset();
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo crear la meta");
    }
  }

  return (
    <form className="inlineForm" onSubmit={onSubmit}>
      <input className="glassInput" name="name" type="text" placeholder="Nueva meta..." required />
      <input
        className="glassInput amountInput"
        name="targetAmount"
        type="number"
        min="1"
        step="0.01"
        placeholder="Objetivo"
        required
      />
      <button className="btn btnPrimary" type="submit" disabled={isPending} aria-label="Añadir meta">
        +
      </button>
      {error ? <p className="formError">{error}</p> : null}
    </form>
  );
}

export function TaskStatusButton({
  taskId,
  status
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextStatus: TaskStatus = status === "done" ? "todo" : "done";

  async function updateStatus() {
    setError(null);

    try {
      await requestJson(`/api/tasks/${taskId}`, "PATCH", { status: nextStatus });
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo actualizar");
    }
  }

  return (
    <div className="statusAction">
      <button
        className={`todoCheckbox${status === "done" ? " checked" : ""}`}
        type="button"
        onClick={updateStatus}
        disabled={isPending}
        aria-label={status === "done" ? "Marcar como pendiente" : "Marcar como completada"}
      />
      {error ? <span className="inlineError">{error}</span> : null}
    </div>
  );
}
