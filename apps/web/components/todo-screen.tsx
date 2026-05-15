"use client";

import { useMemo, useState } from "react";
import type { listTasks } from "@gestor/api";

import { CreateTaskForm, TaskEditorRow } from "./dashboard-actions";

type TodoScreenData = Awaited<ReturnType<typeof listTasks>>;

export function TodoScreen({ tasks }: { tasks: TodoScreenData }) {
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done" | "high">("all");
  const filteredTasks = useMemo(() => {
    if (taskFilter === "open") return tasks.filter((task) => task.status !== "done");
    if (taskFilter === "done") return tasks.filter((task) => task.status === "done");
    if (taskFilter === "high") return tasks.filter((task) => task.priority === "high");
    return tasks;
  }, [tasks, taskFilter]);

  return (
    <div className="dashboardPage">
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
    </div>
  );
}
