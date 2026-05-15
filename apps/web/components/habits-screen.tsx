import type { listHabitsForScreen } from "@gestor/api";

import { CreateHabitForm, HabitEditorRow } from "./dashboard-actions";

type HabitsScreenData = Awaited<ReturnType<typeof listHabitsForScreen>>;

export function HabitsScreen({ habits }: { habits: HabitsScreenData }) {
  return (
    <div className="dashboardPage">
      <section className="screenPage">
        <header className="pageHeader">
          <h1>
            Tracker de <span className="headerAccent">Hábitos</span>
          </h1>
          <p>Marca el progreso visualmente y mantén la racha a la vista.</p>
        </header>
        <article className="card moduleCard fullScreenCard">
          <CreateHabitForm />
          <div className="habitList screenList">
            {habits.length === 0 ? (
              <p className="emptyState">Añade un hábito diario para crear racha.</p>
            ) : (
              habits.map((habit) => <HabitEditorRow habit={habit} key={habit.id} />)
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
