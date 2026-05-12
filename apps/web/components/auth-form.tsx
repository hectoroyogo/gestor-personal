"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
      const body = (await response.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? "No se pudo completar la operación");
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="authForm glassPanel" onSubmit={onSubmit}>
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
        <input name="password" type="password" placeholder="********" required minLength={8} />
      </label>

      {error ? <p className="errorText">{error}</p> : null}

      <button className="primaryButton" type="submit" disabled={isPending}>
        {isPending
          ? "Enviando..."
          : mode === "login"
            ? "Entrar en el dashboard"
            : "Crear cuenta"}
      </button>
    </form>
  );
}

