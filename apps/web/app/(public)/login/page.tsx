import Link from "next/link";

import { AuthForm } from "../../../components/auth-form";

export default function LoginPage() {
  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Acceso</p>
        <h1>Entra en tu gestor personal</h1>
        <p className="mutedText">
          Sesiones HTTP-only, backend propio y estructura preparada para web y móvil.
        </p>
        <AuthForm mode="login" />
        <p className="mutedText">
          ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
        </p>
      </section>
    </main>
  );
}

