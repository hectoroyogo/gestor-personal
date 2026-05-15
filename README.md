# Gestor Personal

Gestor Personal es una aplicacion para organizar el dia a dia desde un solo panel. La idea es reunir tareas, habitos, finanzas, notas, foco y planificacion ligera sin saltar entre varias herramientas.

El proyecto esta pensado para uso personal: entrar, ver que requiere atencion, actualizar avances y mantener una vision clara de lo importante.

## Que puedes hacer

- Ver un dashboard general con tareas activas, mejor racha de habitos, balance financiero y progreso de ahorro.
- Gestionar tareas con prioridad, estado, descripcion y fecha limite.
- Crear habitos y marcar el progreso en un calendario visual.
- Registrar cuentas, categorias, presupuestos, transacciones y metas de ahorro.
- Guardar notas locales en el navegador.
- Usar un Pomodoro para sesiones de enfoque y descansos.
- Mantener una agenda local para prioridades del dia, vision semanal y cierre.
- Cambiar entre tema claro y oscuro.

## Estado actual

- La app web es el producto principal y ya incluye autenticacion, dashboard protegido y CRUD de los modulos principales.
- El backend vive dentro de Next.js mediante route handlers.
- La base de datos usa PostgreSQL con Prisma y una migracion inicial versionada.
- La app mobile existe como cliente inicial, pero no forma parte del flujo minimo de uso.
- Las pantallas del dashboard cargan datos por seccion para evitar traer informacion innecesaria.

## Stack tecnico

- Monorepo con `pnpm`.
- `apps/web`: Next.js App Router con backend integrado.
- `apps/mobile`: Expo + React Native.
- `packages/core`: tipos, dominio y validaciones.
- `packages/db`: Prisma Client, schema y migraciones.
- `packages/api`: casos de uso y acceso a datos.
- `packages/ui-tokens`: tokens visuales compartidos.
- `infra`: Docker Compose, Caddy y scripts de despliegue.

## Arranque en Debian 12

Requisitos:

- Docker Engine con plugin `docker compose`.
- Git.

Pasos:

1. Clonar el repositorio.
2. Copiar `.env.example` a `.env` si no existe.
3. Cambiar `AUTH_SECRET` por un valor largo y aleatorio.
4. Ejecutar `docker compose -f infra/docker-compose.dev.yml up --build`.
5. Abrir `http://localhost:3000`.

El contenedor web aplica las migraciones al arrancar, por lo que no hace falta ejecutar Prisma manualmente para una primera prueba.

## Servicios Docker

- Web: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Caddy en produccion: `80/443`

## Comandos utiles

```bash
corepack pnpm --filter @gestor/core typecheck
corepack pnpm --filter @gestor/api typecheck
corepack pnpm --filter @gestor/web typecheck
```

Notas:

- En Windows, `next build` puede fallar con `EISDIR readlink` en rutas dinamicas de Next.js. El entorno objetivo recomendado sigue siendo Debian 12/Docker.
- `pnpm -r typecheck` puede fallar si el entorno mobile no tiene todos los tipos de Expo instalados.
