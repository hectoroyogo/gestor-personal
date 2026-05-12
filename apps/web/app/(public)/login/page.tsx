import Link from "next/link";

import { AuthForm } from "../../../components/auth-form";

export default function LoginPage() {
  return (
    <main className="authPage">
      <section className="authShell">
        <div className="authHero">
          <a className="brand authBrand" href="/login" aria-label="Nexus">
            <span className="brandIcon">N</span>
            <span className="brandName">Nexus</span>
          </a>
          <div>
            <p className="kicker">Gestor personal</p>
            <h1>
              Entra y organiza <span className="headerAccent">tu día</span>.
            </h1>
            <p>
              Tareas, hábitos, ahorro y movimientos en una interfaz clara, rápida y preparada
              para uso diario.
            </p>
          </div>
          <div className="authFeatureGrid" aria-label="Resumen de módulos">
            <span>Tareas</span>
            <span>Hábitos</span>
            <span>Finanzas</span>
            <span>Ahorro</span>
          </div>
        </div>

        <div className="authPanel">
          <p className="cardTitle">Acceso</p>
          <h2>Inicia sesión</h2>
          <p className="mutedText">La frase del dashboard cambiará en cada login correcto.</p>
          <AuthForm mode="login" />
          <p className="authSwitch">
            ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
