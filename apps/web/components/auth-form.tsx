"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { storeNextLoginQuote } from "./motivation-quote";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(body?.error?.message ?? "No se pudo completar la operación");
      return;
    }

    storeNextLoginQuote();

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="authForm card" onSubmit={onSubmit}>
      {mode === "register" && (
        <label className="field">
          <span>Nombre</span>
          <input name="name" type="text" placeholder="Tu nombre" required minLength={2} />
        </label>
      )}

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="tu@email.com" required />
      </label>

      <label className="field">
        <span>Contraseña</span>
        <input name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} />
      </label>

      {error ? <p className="errorText">{error}</p> : null}

      <button className="btn btnPrimary authSubmit" type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>
    </form>
  );
}
