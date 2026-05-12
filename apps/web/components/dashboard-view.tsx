import { formatCurrency } from "@gestor/core";

import {
  CreateHabitForm,
  CreateSavingsGoalForm,
  CreateTaskForm,
  TaskStatusButton
} from "./dashboard-actions";
import { MotivationQuote } from "./motivation-quote";

type DashboardViewProps = {
  data: DashboardData;
  userName: string;
};

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type TransactionType = "income" | "expense" | "transfer";

type DashboardData = {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
  }>;
  habits: Array<{
    id: string;
    name: string;
    description: string | null;
    streak: number;
  }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
  }>;
  latestTransactions: Array<{
    id: string;
    type: TransactionType;
    description: string;
    amount: number;
    occurredAt: Date | string;
  }>;
  monthly: Record<string, { income: number; expense: number }>;
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
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

export function DashboardView({ data, userName }: DashboardViewProps) {
  const completedTasks = data.tasks.filter((task) => task.status === "done").length;
  const activeTasks = data.tasks.filter((task) => task.status !== "done").length;
  const bestHabit = data.habits.reduce(
    (best, current) => (current.streak > best.streak ? current : best),
    data.habits[0] ?? { streak: 0, name: "Sin hábitos aún" }
  );
  const balance = data.latestTransactions.reduce((sum, entry) => {
    if (entry.type === "income") return sum + entry.amount;
    if (entry.type === "expense") return sum - entry.amount;
    return sum;
  }, 0);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthlySummary = data.monthly[currentMonthKey] ?? { income: 0, expense: 0 };
  const totalSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const targetSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savingsProgress = targetSavings > 0 ? Math.round((totalSavings / targetSavings) * 100) : 0;

  return (
    <div className="dashboardPage">
      <header className="pageHeader sectionAnchor" id="overview">
        <h1>
          Hola, {userName}. <span className="headerAccent">{getGreeting()}</span>
        </h1>
        <p>
          Vista de control para tareas, hábitos, finanzas y ahorro. Los cambios se guardan contra
          las APIs reales de la app.
        </p>
      </header>

      <section className="dashboardStats" aria-label="Métricas principales">
        <article className="dashMiniCard">
          <span className="dashMiniIcon purple">✓</span>
          <span className="statVal">{activeTasks}</span>
          <span className="statLabel">Tareas activas</span>
        </article>
        <article className="dashMiniCard">
          <span className="dashMiniIcon teal">◷</span>
          <span className="statVal">{bestHabit.streak}</span>
          <span className="statLabel">Mejor racha: {bestHabit.name}</span>
        </article>
        <article className="dashMiniCard">
          <span className="dashMiniIcon green">€</span>
          <span className="statVal">{formatCurrency(balance)}</span>
          <span className="statLabel">Balance reciente</span>
        </article>
        <article className="dashMiniCard">
          <span className="dashMiniIcon amber">%</span>
          <span className="statVal">{savingsProgress}%</span>
          <span className="statLabel">Progreso de ahorro</span>
        </article>
      </section>

      <section className="dashRow secGap">
        <article className="card">
          <div className="cardTitle">Tareas pendientes</div>
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

        <article className="card">
          <div className="cardTitle">Metas de ahorro</div>
          <div className="compactList">
            {data.savingsGoals.length === 0 ? (
              <p className="emptyState">Crea tu primera meta de ahorro.</p>
            ) : (
              data.savingsGoals.slice(0, 4).map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100)
                );

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

      <section className="moduleGrid">
        <article className="card sectionAnchor moduleCard" id="tasks">
          <div className="sectionHeader">
            <div>
              <p className="kicker">To-do list</p>
              <h2>Tareas</h2>
            </div>
            <span className="badge badge-purple">{completedTasks} completadas</span>
          </div>
          <CreateTaskForm />
          <div className="todoList">
            {data.tasks.length === 0 ? (
              <p className="emptyState">Añade una tarea para empezar.</p>
            ) : (
              data.tasks.slice(0, 8).map((task) => (
                <div className={`todoItem${task.status === "done" ? " done" : ""}`} key={task.id}>
                  <TaskStatusButton taskId={task.id} status={task.status} />
                  <div className="todoContent">
                    <strong>{task.title}</strong>
                    <span>{task.description ?? "Sin descripción"}</span>
                  </div>
                  <div className="itemBadges">
                    <span className={`badge badge-${task.priority}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    <span className={`badge status-${task.status}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card sectionAnchor moduleCard" id="habits">
          <div className="sectionHeader">
            <div>
              <p className="kicker">Tracker</p>
              <h2>Hábitos</h2>
            </div>
            <span className="badge badge-teal">{data.habits.length} activos</span>
          </div>
          <CreateHabitForm />
          <div className="habitList">
            {data.habits.length === 0 ? (
              <p className="emptyState">Añade un hábito diario para crear racha.</p>
            ) : (
              data.habits.map((habit) => (
                <div className="habitRow" key={habit.id}>
                  <span className="habitIcon">◷</span>
                  <div className="habitInfo">
                    <strong>{habit.name}</strong>
                    <span>{habit.description ?? "Seguimiento diario"}</span>
                  </div>
                  <span className="badge badge-green">{habit.streak} días</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card sectionAnchor moduleCard financeCard" id="finance">
          <div className="sectionHeader">
            <div>
              <p className="kicker">Control financiero</p>
              <h2>Finanzas</h2>
            </div>
          </div>
          <div className="financeTop">
            <div className="balanceCard">
              <span>Balance reciente</span>
              <strong>{formatCurrency(balance)}</strong>
            </div>
            <div>
              <span className="statLabel">Ingresos del mes</span>
              <strong className="moneyPositive">{formatCurrency(monthlySummary.income)}</strong>
            </div>
            <div>
              <span className="statLabel">Gastos del mes</span>
              <strong className="moneyNegative">{formatCurrency(monthlySummary.expense)}</strong>
            </div>
          </div>
          <div className="transList">
            {data.latestTransactions.length === 0 ? (
              <p className="emptyState">
                Aún no hay movimientos. Crea cuentas y transacciones desde la API para verlos aquí.
              </p>
            ) : (
              data.latestTransactions.map((entry) => (
                <div className="transItem" key={entry.id}>
                  <span className={`transIcon ${entry.type}`}>{entry.type === "expense" ? "-" : "+"}</span>
                  <div className="transInfo">
                    <strong>{entry.description}</strong>
                    <span>{formatDate(entry.occurredAt) ?? entry.type}</span>
                  </div>
                  <strong className={`transAmount ${entry.type === "expense" ? "neg" : "pos"}`}>
                    {entry.type === "expense" ? "-" : "+"}
                    {formatCurrency(entry.amount)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card sectionAnchor moduleCard" id="savings">
          <div className="sectionHeader">
            <div>
              <p className="kicker">Objetivos</p>
              <h2>Ahorro</h2>
            </div>
            <span className="badge badge-amber">{data.savingsGoals.length} metas</span>
          </div>
          <CreateSavingsGoalForm />
          <div className="savingsList">
            {data.savingsGoals.length === 0 ? (
              <p className="emptyState">Añade una meta con importe objetivo.</p>
            ) : (
              data.savingsGoals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100)
                );

                return (
                  <div className="savingItem" key={goal.id}>
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
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
