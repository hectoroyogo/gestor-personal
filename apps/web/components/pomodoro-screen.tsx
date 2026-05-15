"use client";

import { useEffect, useState } from "react";

type PomodoroMode = "focus" | "short" | "long";

function secondsForMode(mode: PomodoroMode) {
  if (mode === "focus") return 25 * 60;
  if (mode === "short") return 5 * 60;
  return 15 * 60;
}

function formatPomodoroTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PomodoroScreen() {
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("focus");
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [focusTask, setFocusTask] = useState("");

  useEffect(() => {
    if (!pomodoroRunning) return;

    const interval = window.setInterval(() => {
      setPomodoroSeconds((current) => {
        if (current > 1) return current - 1;

        setPomodoroRunning(false);
        if (pomodoroMode === "focus") {
          setPomodoroSessions((sessions) => sessions + 1);
        }
        return secondsForMode(pomodoroMode);
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pomodoroMode, pomodoroRunning]);

  function selectPomodoroMode(nextMode: PomodoroMode) {
    setPomodoroMode(nextMode);
    setPomodoroRunning(false);
    setPomodoroSeconds(secondsForMode(nextMode));
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setPomodoroSeconds(secondsForMode(pomodoroMode));
  }

  function skipPomodoro() {
    const nextMode = pomodoroMode === "focus" ? "short" : "focus";
    selectPomodoroMode(nextMode);
  }

  return (
    <div className="dashboardPage">
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
              <span className="pomoTime">{formatPomodoroTime(pomodoroSeconds)}</span>
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
    </div>
  );
}
