"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("gestor-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
      return;
    }

    document.documentElement.dataset.theme = "dark";
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("gestor-theme", nextTheme);
  }

  return (
    <button
      className="themeToggleWrap"
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "light"}
    >
      <span className="themeIcon" aria-hidden="true">
        ☼
      </span>
      <span>Modo claro</span>
      <span className={`togglePill${theme === "light" ? " on" : ""}`} aria-hidden="true" />
    </button>
  );
}
