"use client";

import { useEffect, useState } from "react";

type AgendaItem = {
  id: string;
  label: string;
  value: string;
};

const defaultAgenda: AgendaItem[] = [
  {
    id: "today",
    label: "Hoy",
    value: "Define los 3 bloques importantes del día."
  },
  {
    id: "week",
    label: "Semana",
    value: "Anota compromisos, entregas y decisiones pendientes."
  },
  {
    id: "review",
    label: "Cierre",
    value: "Qué salió bien, qué ajustar y qué queda para mañana."
  }
];

const agendaStorageKey = "gestor-agenda";

export function AgendaScreen() {
  const [agenda, setAgenda] = useState<AgendaItem[]>(defaultAgenda);

  useEffect(() => {
    const savedAgenda = window.localStorage.getItem(agendaStorageKey);
    if (!savedAgenda) return;

    try {
      const parsedAgenda = JSON.parse(savedAgenda) as AgendaItem[];
      if (Array.isArray(parsedAgenda)) {
        setAgenda(parsedAgenda);
      }
    } catch {
      window.localStorage.removeItem(agendaStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(agendaStorageKey, JSON.stringify(agenda));
  }, [agenda]);

  function updateAgendaItem(itemId: string, value: string) {
    setAgenda((currentAgenda) =>
      currentAgenda.map((item) => (item.id === itemId ? { ...item, value } : item))
    );
  }

  function resetAgenda() {
    setAgenda(defaultAgenda);
  }

  return (
    <div className="dashboardPage">
      <section className="screenPage">
        <header className="pageHeader">
          <h1>
            Agenda de <span className="headerAccent">Control</span>
          </h1>
          <p>Planifica el día, guarda prioridades semanales y deja un cierre rápido sin mezclarlo con las notas.</p>
        </header>

        <section className="agendaGrid" aria-label="Agenda personal">
          {agenda.map((item) => (
            <article className="card agendaCard" key={item.id}>
              <div className="agendaCardHeader">
                <span className="agendaIcon">{item.label.slice(0, 1)}</span>
                <div>
                  <div className="cardTitle">{item.label}</div>
                  <span>{item.id === "today" ? "Prioridad" : item.id === "week" ? "Vista amplia" : "Reflexión"}</span>
                </div>
              </div>
              <textarea
                className="agendaTextarea"
                value={item.value}
                onChange={(event) => updateAgendaItem(item.id, event.target.value)}
                aria-label={`Contenido de agenda: ${item.label}`}
              />
            </article>
          ))}
        </section>

        <div className="agendaActions">
          <button className="btn" type="button" onClick={resetAgenda}>
            Reiniciar agenda
          </button>
        </div>
      </section>
    </div>
  );
}
