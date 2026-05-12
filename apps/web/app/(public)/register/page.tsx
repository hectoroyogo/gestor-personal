import Link from "next/link";

import { AuthForm } from "../../../components/auth-form";

export default function RegisterPage() {
  return (
    <main className="authPage">
      <section className="authShell">
        <div className="authHero">
          <a className="brand authBrand" href="/login" aria-label="Nexus">
            <span className="brandIcon">N</span>
            <span className="brandName">Nexus</span>
          </a>
          <div>
            <p className="kicker">Nuevo espacio</p>
            <h1>
              Crea tu centro de <span className="headerAccent">control personal</span>.
            </h1>
            <p>
              Empieza con una cuenta aislada y una base lista para tareas, hábitos, finanzas y
              objetivos de ahorro.
            </p>
          </div>
          <div className="authFeatureGrid" aria-label="Resumen de módulos">
            <span>Seguro</span>
            <span>Privado</span>
            <span>Responsive</span>
            <span>Simple</span>
          </div>
        </div>

        <div className="authPanel">
          <p className="cardTitle">Registro</p>
          <h2>Crear cuenta</h2>
          <p className="mutedText">Usa una contraseña de al menos 8 caracteres.</p>
          <AuthForm mode="register" />
          <p className="authSwitch">
            ¿Ya tienes cuenta? <Link href="/login">Ir al login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
