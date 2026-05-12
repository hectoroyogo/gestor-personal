import type { getDashboard } from "@gestor/api";
import { formatCurrency } from "@gestor/core";

type DashboardViewProps = {
  data: Awaited<ReturnType<typeof getDashboard>>;
  userName: string;
};

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

  return (
    <div className="dashboardStack">
      <section className="hero glassPanel">
        <div>
          <p className="eyebrow">Panel principal</p>
          <h1>Hola, {userName}</h1>
          <p className="mutedText">
            Tu sistema personal ya está preparado para tareas, hábitos, control financiero y ahorro.
          </p>
        </div>
      </section>

      <section className="metricsGrid">
        <article className="metricCard glassPanel">
          <span className="metricLabel">Tareas activas</span>
          <strong>{activeTasks}</strong>
          <p className="mutedText">{completedTasks} completadas</p>
        </article>
        <article className="metricCard glassPanel">
          <span className="metricLabel">Mejor hábito</span>
          <strong>{bestHabit.streak} días</strong>
          <p className="mutedText">{bestHabit.name}</p>
        </article>
        <article className="metricCard glassPanel">
          <span className="metricLabel">Balance reciente</span>
          <strong>{formatCurrency(balance)}</strong>
          <p className="mutedText">Últimos movimientos</p>
        </article>
        <article className="metricCard glassPanel">
          <span className="metricLabel">Metas de ahorro</span>
          <strong>{data.savingsGoals.length}</strong>
          <p className="mutedText">Objetivos activos</p>
        </article>
      </section>

      <section className="contentGrid">
        <article className="glassPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Tareas</p>
              <h2>Prioridades</h2>
            </div>
          </div>

          <div className="listStack">
            {data.tasks.length === 0 ? (
              <p className="emptyState">No hay tareas aún. Usa `POST /api/tasks` para crear la primera.</p>
            ) : (
              data.tasks.slice(0, 6).map((task) => (
                <div className="listItem" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p className="mutedText">{task.description ?? "Sin descripción"}</p>
                  </div>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="glassPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Hábitos</p>
              <h2>Rachas</h2>
            </div>
          </div>

          <div className="listStack">
            {data.habits.length === 0 ? (
              <p className="emptyState">No hay hábitos aún. Usa `POST /api/habits` para empezar.</p>
            ) : (
              data.habits.map((habit) => (
                <div className="listItem" key={habit.id}>
                  <div>
                    <strong>{habit.name}</strong>
                    <p className="mutedText">{habit.description ?? "Seguimiento personal"}</p>
                  </div>
                  <span className="badge badge-highlight">{habit.streak}d</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="glassPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Finanzas</p>
              <h2>Movimientos recientes</h2>
            </div>
          </div>

          <div className="listStack">
            {data.latestTransactions.length === 0 ? (
              <p className="emptyState">
                No hay transacciones aún. Crea cuentas y usa `POST /api/transactions`.
              </p>
            ) : (
              data.latestTransactions.map((entry) => (
                <div className="listItem" key={entry.id}>
                  <div>
                    <strong>{entry.description}</strong>
                    <p className="mutedText">{entry.type}</p>
                  </div>
                  <span className={`amount ${entry.type === "expense" ? "negative" : "positive"}`}>
                    {entry.type === "expense" ? "-" : "+"}
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="glassPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Ahorro</p>
              <h2>Objetivos</h2>
            </div>
          </div>

          <div className="listStack">
            {data.savingsGoals.length === 0 ? (
              <p className="emptyState">
                No hay metas aún. Usa `POST /api/savings-goals` para registrar objetivos.
              </p>
            ) : (
              data.savingsGoals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100)
                );

                return (
                  <div className="goalCard" key={goal.id}>
                    <div className="listItem goalHeader">
                      <div>
                        <strong>{goal.name}</strong>
                        <p className="mutedText">
                          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <span className="badge badge-highlight">{progress}%</span>
                    </div>
                    <div className="progressBar">
                      <div style={{ width: `${progress}%` }} />
                    </div>
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
