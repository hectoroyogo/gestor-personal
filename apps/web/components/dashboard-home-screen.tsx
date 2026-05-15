import { formatCurrency } from "@gestor/core";
import type { getDashboardOverview } from "@gestor/api";

import { MotivationQuote } from "./motivation-quote";

type DashboardOverviewData = Awaited<ReturnType<typeof getDashboardOverview>>;

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

function clampProgress(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

export function DashboardHomeScreen({ data, userName }: { data: DashboardOverviewData; userName: string }) {
  const monthlySummary = data.monthly[data.currentMonthKey] ?? { income: 0, expense: 0 };

  return (
    <div className="dashboardPage">
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
            <span className="statVal">{data.taskStats.active}</span>
            <span className="statLabel">Tareas activas</span>
          </article>
          <article className="dashMiniCard">
            <span className="dashMiniIcon teal">H</span>
            <span className="statVal">{data.bestHabit.streak}</span>
            <span className="statLabel">Mejor racha: {data.bestHabit.name}</span>
          </article>
          <article className="dashMiniCard">
            <span className="dashMiniIcon green">€</span>
            <span className="statVal">{formatCurrency(data.balance)}</span>
            <span className="statLabel">Balance reciente</span>
          </article>
          <article className="dashMiniCard">
            <span className="dashMiniIcon amber">%</span>
            <span className="statVal">{data.savingsProgress}%</span>
            <span className="statLabel">Ahorro completado</span>
          </article>
        </section>

        <section className="summaryGrid">
          <article className="card summaryCard">
            <div className="cardTitle">To-do list</div>
            <div className="compactList">
              {data.openTasks.length === 0 ? (
                <p className="emptyState">No hay tareas pendientes.</p>
              ) : (
                data.openTasks.map((task) => (
                  <div className="compactItem" key={task.id}>
                    <span>{task.title}</span>
                    <span className={`badge badge-${task.priority}`}>{priorityLabels[task.priority]}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card summaryCard">
            <div className="cardTitle">Hábitos</div>
            <div className="compactList">
              {data.topHabits.length === 0 ? (
                <p className="emptyState">No hay hábitos activos.</p>
              ) : (
                data.topHabits.map((habit) => (
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
                <strong className="moneyPositive">{formatCurrency(monthlySummary.income)}</strong>
              </div>
              <div>
                <span>Gastos este mes</span>
                <strong className="moneyNegative">{formatCurrency(monthlySummary.expense)}</strong>
              </div>
            </div>
          </article>

          <article className="card summaryCard">
            <div className="cardTitle">Metas de ahorro</div>
            <div className="compactList">
              {data.savingsGoals.length === 0 ? (
                <p className="emptyState">No hay metas de ahorro.</p>
              ) : (
                data.savingsGoals.map((goal) => {
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
    </div>
  );
}
