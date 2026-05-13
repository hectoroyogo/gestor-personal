"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@gestor/core";

import {
  CreateAccountForm,
  CreateBudgetForm,
  CreateCategoryForm,
  CreateHabitForm,
  CreateSavingsGoalForm,
  CreateTransactionForm,
  CreateTaskForm,
  HabitEditorRow,
  SavingsGoalEditor,
  TaskEditorRow,
  TransactionRow,
  type AccountActionData,
  type BudgetActionData,
  type CategoryActionData,
  type HabitActionData,
  type SavingsGoalActionData,
  type TaskActionData,
  type TransactionActionData
} from "./dashboard-actions";
import { MotivationQuote } from "./motivation-quote";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type TransactionType = "income" | "expense" | "transfer";
export type ScreenId = "dashboard" | "todo" | "habits" | "finance" | "notes" | "pomodoro";
type NoteColor = 0 | 1 | 2 | 3 | 4;
type PomodoroMode = "focus" | "short" | "long";

export type DashboardScreenData = {
  tasks: TaskActionData[];
  habits: HabitActionData[];
  accounts: AccountActionData[];
  categories: CategoryActionData[];
  budgets: BudgetActionData[];
  savingsGoals: SavingsGoalActionData[];
  latestTransactions: TransactionActionData[];
  monthly: Record<string, { income: number; expense: number }>;
};

type DashboardScreensProps = {
  data: DashboardScreenData;
  userName: string;
  screen: ScreenId;
};

type LocalNote = {
  id: number;
  title: string;
  body: string;
  color: NoteColor;
  date: string;
};

const statusLabels = {
  todo: "Pendiente",
  in_progress: "En curso",
  done: "Completada"
} as const;

const priorityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta"
} as const;

const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

const defaultNotes: LocalNote[] = [
  {
    id: 1,
    title: "Ideas proyecto",
    body: "Conectar el módulo de reportes con analítica y revisar los próximos hitos.",
    color: 0,
    date: "Hoy"
  },
  {
    id: 2,
    title: "Lista rápida",
    body: "Revisar tareas pendientes, cerrar gastos de la semana y planificar ahorro.",
    color: 3,
    date: "Ayer"
  },
  {
    id: 3,
    title: "Quote",
    body: "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
    color: 1,
    date: "Lunes"
  }
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "buenos días";
  if (hour < 20) return "buenas tardes";
  return "buenas noches";
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

function clampProgress(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

function formatPomodoroTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function DashboardScreens({ data, userName, screen }: DashboardScreensProps) {
  const [notes, setNotes] = useState<LocalNote[]>(defaultNotes);
  const [noteColor, setNoteColor] = useState<NoteColor>(0);
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done" | "high">("all");
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("focus");
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [focusTask, setFocusTask] = useState("");

  useEffect(() => {
    const savedNotes = window.localStorage.getItem("gestor-notes");
    if (!savedNotes) return;

    try {
      const parsedNotes = JSON.parse(savedNotes) as LocalNote[];
      if (Array.isArray(parsedNotes)) {
        setNotes(parsedNotes);
      }
    } catch {
      window.localStorage.removeItem("gestor-notes");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gestor-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!pomodoroRunning) return;

    const interval = window.setInterval(() => {
      setPomodoroSeconds((current) => {
        if (current > 1) return current - 1;

        setPomodoroRunning(false);
        if (pomodoroMode === "focus") {
          setPomodoroSessions((sessions) => sessions + 1);
        }
        return pomodoroMode === "focus" ? 25 * 60 : pomodoroMode === "short" ? 5 * 60 : 15 * 60;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pomodoroMode, pomodoroRunning]);

  const summary = useMemo(() => {
    const completedTasks = data.tasks.filter((task) => task.status === "done").length;
    const activeTasks = data.tasks.filter((task) => task.status !== "done").length;
    const bestHabit = data.habits.reduce(
      (best, current) => (current.streak > best.streak ? current : best),
      data.habits[0] ?? { streak: 0, name: "Sin hábitos aún" }
    );
    const balance = data.accounts.length > 0
      ? data.accounts.reduce((sum, account) => sum + account.balance, 0)
      : data.latestTransactions.reduce((sum, entry) => {
          if (entry.type === "income") return sum + entry.amount;
          if (entry.type === "expense") return sum - entry.amount;
          return sum;
        }, 0);
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const monthlySummary = data.monthly[currentMonthKey] ?? { income: 0, expense: 0 };
    const totalSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const targetSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

    return {
      activeTasks,
      completedTasks,
      bestHabit,
      balance,
      monthlySummary,
      savingsProgress: targetSavings > 0 ? clampProgress(totalSavings, targetSavings) : 0
    };
  }, [data]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "open") {
      return data.tasks.filter((task) => task.status !== "done");
    }

    if (taskFilter === "done") {
      return data.tasks.filter((task) => task.status === "done");
    }

    if (taskFilter === "high") {
      return data.tasks.filter((task) => task.priority === "high");
    }

    return data.tasks;
  }, [data.tasks, taskFilter]);

  function addNote() {
    setNotes((currentNotes) => [
      {
        id: Date.now(),
        title: "Nueva nota",
        body: "Escribe aquí...",
        color: noteColor,
        date: "Ahora"
      },
      ...currentNotes
    ]);
  }

  function updateNote(noteId: number, field: "title" | "body", value: string) {
    setNotes((currentNotes) =>
      currentNotes.map((note) => (note.id === noteId ? { ...note, [field]: value } : note))
    );
  }

  function deleteNote(noteId: number) {
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
  }

  function selectPomodoroMode(nextMode: PomodoroMode) {
    setPomodoroMode(nextMode);
    setPomodoroRunning(false);
    setPomodoroSeconds(nextMode === "focus" ? 25 * 60 : nextMode === "short" ? 5 * 60 : 15 * 60);
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setPomodoroSeconds(pomodoroMode === "focus" ? 25 * 60 : pomodoroMode === "short" ? 5 * 60 : 15 * 60);
  }

  function skipPomodoro() {
    const nextMode = pomodoroMode === "focus" ? "short" : "focus";
    selectPomodoroMode(nextMode);
  }

  return (
    <div className="dashboardPage">
      {screen === "dashboard" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              Hola, {userName}. <span className="headerAccent">{getGreeting()}</span>
            </h1>
            <p>Resumen rápido de lo importante. Cada módulo completo vive en su propia pantalla.</p>
          </header>

          <section className="dashboardStats" aria-label="Métricas principales">
            <article className="dashMiniCard">
              <span className="dashMiniIcon purple">T</span>
              <span className="statVal">{summary.activeTasks}</span>
              <span className="statLabel">Tareas activas</span>
            </article>
            <article className="dashMiniCard">
              <span className="dashMiniIcon teal">H</span>
              <span className="statVal">{summary.bestHabit.streak}</span>
              <span className="statLabel">Mejor racha: {summary.bestHabit.name}</span>
            </article>
            <article className="dashMiniCard">
              <span className="dashMiniIcon green">€</span>
              <span className="statVal">{formatCurrency(summary.balance)}</span>
              <span className="statLabel">Balance reciente</span>
            </article>
            <article className="dashMiniCard">
              <span className="dashMiniIcon amber">%</span>
              <span className="statVal">{summary.savingsProgress}%</span>
              <span className="statLabel">Ahorro completado</span>
            </article>
          </section>

          <section className="summaryGrid">
            <article className="card summaryCard">
              <div className="cardTitle">To-do list</div>
              <div className="compactList">
                {data.tasks.filter((task) => task.status !== "done").length === 0 ? (
                  <p className="emptyState">No hay tareas pendientes.</p>
                ) : (
                  data.tasks
                    .filter((task) => task.status !== "done")
                    .slice(0, 4)
                    .map((task) => (
                      <div className="compactItem" key={task.id}>
                        <span>{task.title}</span>
                        <span className={`badge badge-${task.priority}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </article>

            <article className="card summaryCard">
              <div className="cardTitle">Hábitos</div>
              <div className="compactList">
                {data.habits.length === 0 ? (
                  <p className="emptyState">No hay hábitos activos.</p>
                ) : (
                  data.habits.slice(0, 4).map((habit) => (
                    <div className="compactItem" key={habit.id}>
                      <span>{habit.name}</span>
                      <span className="badge badge-green">{habit.streak} días</span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="card summaryCard">
              <div className="cardTitle">Finanzas</div>
              <div className="financeSummary">
                <div>
                  <span>Ingresos este mes</span>
                  <strong className="moneyPositive">{formatCurrency(summary.monthlySummary.income)}</strong>
                </div>
                <div>
                  <span>Gastos este mes</span>
                  <strong className="moneyNegative">{formatCurrency(summary.monthlySummary.expense)}</strong>
                </div>
              </div>
            </article>

            <article className="card summaryCard">
              <div className="cardTitle">Metas de ahorro</div>
              <div className="compactList">
                {data.savingsGoals.length === 0 ? (
                  <p className="emptyState">No hay metas de ahorro.</p>
                ) : (
                  data.savingsGoals.slice(0, 3).map((goal) => {
                    const progress = clampProgress(goal.currentAmount, goal.targetAmount);

                    return (
                      <div className="savingPreview" key={goal.id}>
                        <div className="progressLabel">
                          <span>{goal.name}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="progressTrack">
                          <div className="progressFill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </section>

          <MotivationQuote />
        </section>
      )}

      {screen === "todo" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              <span className="headerAccent">To-Do</span> List
            </h1>
            <p>Organiza y cierra las tareas importantes del día.</p>
          </header>
          <article className="card moduleCard fullScreenCard">
            <CreateTaskForm />
            <div className="todoFilters">
              {[
                ["all", "Todas"],
                ["open", "Pendientes"],
                ["done", "Completadas"],
                ["high", "Alta prioridad"]
              ].map(([value, label]) => (
                <button
                  className={`filterChip${taskFilter === value ? " active" : ""}`}
                  key={value}
                  type="button"
                  onClick={() => setTaskFilter(value as typeof taskFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="todoList screenList">
              {filteredTasks.length === 0 ? (
                <p className="emptyState">Añade una tarea para empezar.</p>
              ) : (
                filteredTasks.map((task) => <TaskEditorRow task={task} key={task.id} />)
              )}
            </div>
          </article>
        </section>
      )}

      {screen === "habits" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              Tracker de <span className="headerAccent">Hábitos</span>
            </h1>
            <p>Marca el progreso visualmente y mantén la racha a la vista.</p>
          </header>
          <article className="card moduleCard fullScreenCard">
            <CreateHabitForm />
            <div className="habitsWeekHeader">
              {dayLabels.map((day, index) => (
                <span className={`weekLabel${index === (new Date().getDay() + 6) % 7 ? " todayCol" : ""}`} key={day}>
                  {day}
                </span>
              ))}
            </div>
            <div className="habitList screenList">
              {data.habits.length === 0 ? (
                <p className="emptyState">Añade un hábito diario para crear racha.</p>
              ) : (
                data.habits.map((habit) => <HabitEditorRow habit={habit} key={habit.id} />)
              )}
            </div>
          </article>
        </section>
      )}

      {screen === "finance" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              Control <span className="headerAccent">Financiero</span>
            </h1>
            <p>Gestiona dinero, movimientos recientes y metas de ahorro con claridad.</p>
          </header>
          <section className="financeTop">
            <div className="balanceCard card">
              <span>Balance total</span>
              <strong>{formatCurrency(summary.balance)}</strong>
              <div className="financeBadges">
                <span className="badge badge-green">↑ {formatCurrency(summary.monthlySummary.income)}</span>
                <span className="badge badge-pink">↓ {formatCurrency(summary.monthlySummary.expense)}</span>
              </div>
            </div>
            <div className="card financeMetricCard">
              <div className="cardTitle">Ingresos</div>
              <strong className="moneyPositive">{formatCurrency(summary.monthlySummary.income)}</strong>
              <span className="statLabel">Este mes</span>
              <div className="progressTrack">
                <div className="progressFill green" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="card financeMetricCard">
              <div className="cardTitle">Gastos</div>
              <strong className="moneyNegative">{formatCurrency(summary.monthlySummary.expense)}</strong>
              <span className="statLabel">Este mes</span>
              <div className="progressTrack">
                <div
                  className="progressFill pink"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (summary.monthlySummary.expense /
                          Math.max(summary.monthlySummary.income, summary.monthlySummary.expense, 1)) *
                          100
                      )
                    )}%`
                  }}
                />
              </div>
            </div>
          </section>
          <section className="financeGrid">
            <article className="card moduleCard financeSetupCard">
              <div className="cardTitle">Cuentas</div>
              <CreateAccountForm />
              <div className="compactList">
                {data.accounts.length === 0 ? (
                  <p className="emptyState">Crea una cuenta para registrar movimientos.</p>
                ) : (
                  data.accounts.map((account) => (
                    <div className="compactItem" key={account.id}>
                      <span>{account.name}</span>
                      <span className="badge badge-green">{formatCurrency(account.balance, account.currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
            <article className="card moduleCard financeSetupCard">
              <div className="cardTitle">Categorías y presupuesto</div>
              <CreateCategoryForm />
              <CreateBudgetForm categories={data.categories} />
              <div className="compactList">
                {data.budgets.length === 0 ? (
                  <p className="emptyState">Define un presupuesto mensual para controlar gastos.</p>
                ) : (
                  data.budgets.slice(0, 5).map((budget) => (
                    <div className="compactItem" key={budget.id}>
                      <span>
                        {budget.category.name} · {budget.month}
                      </span>
                      <span className="badge badge-amber">{formatCurrency(budget.limitAmount)}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
            <article className="card moduleCard">
              <div className="cardTitle">Transacciones recientes</div>
              <CreateTransactionForm accounts={data.accounts} categories={data.categories} />
              <div className="transList screenList">
                {data.latestTransactions.length === 0 ? (
                  <p className="emptyState">Aún no hay movimientos registrados.</p>
                ) : (
                  data.latestTransactions.map((entry) => (
                    <TransactionRow
                      accounts={data.accounts}
                      categories={data.categories}
                      transaction={entry}
                      key={entry.id}
                    />
                  ))
                )}
              </div>
            </article>
            <article className="card moduleCard">
              <div className="sectionHeader">
                <div className="cardTitle">Metas de ahorro</div>
                <CreateSavingsGoalForm />
              </div>
              <div className="savingsList">
                {data.savingsGoals.length === 0 ? (
                  <p className="emptyState">Añade una meta con importe objetivo.</p>
                ) : (
                  data.savingsGoals.map((goal) => <SavingsGoalEditor goal={goal} key={goal.id} />)
                )}
              </div>
            </article>
          </section>
        </section>
      )}

      {screen === "notes" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              Bóveda de <span className="headerAccent">Notas</span>
            </h1>
            <p>Ideas, apuntes y recordatorios rápidos guardados en este navegador.</p>
          </header>
          <div className="notesToolbar">
            <button className="btn btnPrimary" type="button" onClick={addNote}>
              Nueva nota
            </button>
            <span>Color</span>
            {[0, 1, 2, 3, 4].map((color) => (
              <button
                className={`noteColorBtn note-c${color}${noteColor === color ? " selected" : ""}`}
                key={color}
                type="button"
                onClick={() => setNoteColor(color as NoteColor)}
                aria-label={`Seleccionar color ${color + 1}`}
              />
            ))}
          </div>
          <div className="notesGrid">
            {notes.map((note) => (
              <article className={`noteCard note-c${note.color}`} key={note.id}>
                <input
                  className="noteTitle"
                  value={note.title}
                  onChange={(event) => updateNote(note.id, "title", event.target.value)}
                  aria-label="Título de nota"
                />
                <textarea
                  className="noteBody"
                  value={note.body}
                  onChange={(event) => updateNote(note.id, "body", event.target.value)}
                  aria-label="Contenido de nota"
                />
                <div className="noteFooter">
                  <span>{note.date}</span>
                  <button type="button" onClick={() => deleteNote(note.id)} aria-label="Eliminar nota">
                    ×
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {screen === "pomodoro" && (
        <section className="screenPage">
          <header className="pageHeader">
            <h1>
              Modo <span className="headerAccent">Enfoque</span>
            </h1>
            <p>Trabaja en bloques profundos y controla sesiones desde una pantalla dedicada.</p>
          </header>
          <article className="card pomodoroWrap">
            <div className="pomoModes">
              <button
                className={`pomoModeBtn${pomodoroMode === "focus" ? " active" : ""}`}
                type="button"
                onClick={() => selectPomodoroMode("focus")}
              >
                Enfoque
              </button>
              <button
                className={`pomoModeBtn${pomodoroMode === "short" ? " active" : ""}`}
                type="button"
                onClick={() => selectPomodoroMode("short")}
              >
                Descanso corto
              </button>
              <button
                className={`pomoModeBtn${pomodoroMode === "long" ? " active" : ""}`}
                type="button"
                onClick={() => selectPomodoroMode("long")}
              >
                Descanso largo
              </button>
            </div>
            <div className="pomoRingWrap">
              <div className="pomoRing">
                <span>{formatPomodoroTime(pomodoroSeconds)}</span>
                <small>{pomodoroMode === "focus" ? "ENFOQUE" : "DESCANSO"}</small>
              </div>
            </div>
            <div className="pomoControls">
              <button className="btn" type="button" onClick={resetPomodoro}>
                Reiniciar
              </button>
              <button className="pomoMainBtn" type="button" onClick={() => setPomodoroRunning((running) => !running)}>
                {pomodoroRunning ? "Pausar" : "Iniciar"}
              </button>
              <button className="btn" type="button" onClick={skipPomodoro}>
                Siguiente
              </button>
            </div>
            <div className="pomoInfo">
              <div>
                <strong>{pomodoroSessions}</strong>
                <span>Sesiones</span>
              </div>
              <div>
                <strong>{pomodoroSessions * 25}</strong>
                <span>Minutos</span>
              </div>
            </div>
            <div className="card pomoTaskCard">
              <div className="cardTitle">Tarea actual</div>
              <input
                className="glassInput"
                value={focusTask}
                onChange={(event) => setFocusTask(event.target.value)}
                placeholder="¿En qué estás trabajando?"
              />
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
