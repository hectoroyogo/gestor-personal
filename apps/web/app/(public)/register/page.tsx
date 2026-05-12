import Link from "next/link";

import { AuthForm } from "../../../components/auth-form";

export default function RegisterPage() {
  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Registro</p>
        <h1>Crea tu espacio de trabajo</h1>
        <p className="mutedText">
          El primer usuario se crea con datos aislados y estructura lista para tareas, hábitos y finanzas.
        </p>
        <AuthForm mode="register" />
        <p className="mutedText">
          ¿Ya tienes cuenta? <Link href="/login">Ir al login</Link>
        </p>
      </section>
    </main>
  );
}

