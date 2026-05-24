"use client";

import { useEffect, useMemo, useState } from "react";

type PomodoroMode = "focus" | "short" | "long";

type PomodoroSession = {
  id: string;
  task: string;
  completedAt: string;
  durationMinutes: number;
};

const sessionsStorageKey = "gestor-pomodoro-sessions";

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeInputValue(value: string) {
  return new Date(value).toISOString();
}

function createPomodoroSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  if (window.crypto?.getRandomValues) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `pomodoro-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseStoredSessions(value: string | null): PomodoroSession[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as PomodoroSession[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (session) =>
        typeof session.id === "string" &&
        typeof session.task === "string" &&
        typeof session.completedAt === "string" &&
        Number.isFinite(session.durationMinutes)
    );
  } catch {
    return [];
  }
}

function playCompletionSound() {
  const audioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!audioContextConstructor) return;

  const audioContext = new audioContextConstructor();
  const gain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.18);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.65);
  window.setTimeout(() => void audioContext.close(), 800);
}

function showCompletionNotification(task: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  new Notification("Sesión Pomodoro completada", {
    body: task ? `Terminaste: ${task}` : "Has completado una sesión de enfoque."
  });
}

function buildContributionDays(sessions: PomodoroSession[]) {
  const today = new Date();
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - 83);
  firstDay.setHours(0, 0, 0, 0);

  const counts = sessions.reduce<Record<string, number>>((acc, session) => {
    const key = toDayKey(session.completedAt);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 84 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    const key = toDayKey(date);
    const count = counts[key] ?? 0;
    const level = count >= 4 ? 4 : count;

    return {
      key,
      count,
      date,
      level
    };
  });
}

export function PomodoroScreen() {
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("focus");
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [focusTask, setFocusTask] = useState("");
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  useEffect(() => {
    setSessions(parseStoredSessions(window.localStorage.getItem(sessionsStorageKey)));
    setSessionsLoaded(true);
  }, []);

  useEffect(() => {
    if (!sessionsLoaded) return;
    window.localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
  }, [sessions, sessionsLoaded]);

  useEffect(() => {
    if (!pomodoroRunning) return;

    const interval = window.setInterval(() => {
      setPomodoroSeconds((current) => {
        if (current > 1) return current - 1;

        setPomodoroRunning(false);
        playCompletionSound();

        if (pomodoroMode === "focus") {
          const task = focusTask.trim();
          const completedSession = {
            id: createPomodoroSessionId(),
            task: task || "Sesión de enfoque",
            completedAt: new Date().toISOString(),
            durationMinutes: Math.round(secondsForMode("focus") / 60)
          };

          setSessions((currentSessions) => [completedSession, ...currentSessions]);
          showCompletionNotification(task);
        }

        return secondsForMode(pomodoroMode);
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [focusTask, pomodoroMode, pomodoroRunning]);

  const totalMinutes = useMemo(
    () => sessions.reduce((total, session) => total + session.durationMinutes, 0),
    [sessions]
  );
  const contributionDays = useMemo(() => buildContributionDays(sessions), [sessions]);

  async function togglePomodoro() {
    if (!pomodoroRunning && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => null);
    }

    setPomodoroRunning((running) => !running);
  }

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

  function updateSession(sessionId: string, field: "task" | "completedAt" | "durationMinutes", value: string) {
    setSessions((currentSessions) =>
      currentSessions.map((session) => {
        if (session.id !== sessionId) return session;

        if (field === "durationMinutes") {
          return { ...session, durationMinutes: Math.max(1, Number(value) || 1) };
        }

        if (field === "completedAt") {
          return { ...session, completedAt: fromDateTimeInputValue(value) };
        }

        return { ...session, task: value };
      })
    );
  }

  function deleteSession(sessionId: string) {
    setSessions((currentSessions) => currentSessions.filter((session) => session.id !== sessionId));
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
            <button className="pomoMainBtn" type="button" onClick={togglePomodoro}>
              {pomodoroRunning ? "Pausar" : "Iniciar"}
            </button>
            <button className="btn" type="button" onClick={skipPomodoro}>
              Siguiente
            </button>
          </div>
          <div className="pomoInfo">
            <div>
              <strong>{sessions.length}</strong>
              <span>Sesiones</span>
            </div>
            <div>
              <strong>{totalMinutes}</strong>
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

        <section className="pomoHistoryGrid">
          <article className="card pomoHistoryCard">
            <div className="cardTitle">Historial de sesiones</div>
            <div className="pomoSessionList">
              {sessions.length === 0 ? (
                <p className="emptyState">Aún no hay sesiones completadas.</p>
              ) : (
                sessions.map((session) => (
                  <div className="pomoSessionItem" key={session.id}>
                    <input
                      className="glassInput"
                      value={session.task}
                      onChange={(event) => updateSession(session.id, "task", event.target.value)}
                      aria-label="Nombre de sesión"
                    />
                    <input
                      className="glassInput"
                      type="datetime-local"
                      value={toDateTimeInputValue(session.completedAt)}
                      onChange={(event) => updateSession(session.id, "completedAt", event.target.value)}
                      aria-label="Fecha de sesión"
                    />
                    <input
                      className="glassInput amountInput"
                      type="number"
                      min="1"
                      value={session.durationMinutes}
                      onChange={(event) => updateSession(session.id, "durationMinutes", event.target.value)}
                      aria-label="Minutos de sesión"
                    />
                    <span>{formatDateTime(session.completedAt)}</span>
                    <button className="btn compactBtn dangerBtn" type="button" onClick={() => deleteSession(session.id)}>
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card pomoContributionCard">
            <div className="cardTitle">Mapa de enfoque</div>
            <div className="pomoContributionGrid" aria-label="Sesiones completadas por día">
              {contributionDays.map((day) => (
                <span
                  className={`pomoContributionDay level-${day.level}`}
                  key={day.key}
                  title={`${day.key}: ${day.count} sesiones`}
                />
              ))}
            </div>
            <div className="pomoContributionLegend" aria-hidden="true">
              <span>Menos</span>
              <span className="pomoContributionDay level-0" />
              <span className="pomoContributionDay level-2" />
              <span className="pomoContributionDay level-4" />
              <span>Más</span>
            </div>
          </article>
        </section>
      </section>
    </div>
  );
}
