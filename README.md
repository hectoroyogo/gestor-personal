# Gestor Personal

Monorepo preparado para:

- `apps/web`: Next.js con backend integrado
- `apps/mobile`: Expo + React Native
- `packages/core`: dominio, tipos y validaciones
- `packages/db`: Prisma y acceso a datos
- `packages/api`: casos de uso y servicios de aplicacion
- `packages/ui-tokens`: tokens visuales compartidos
- `infra`: Docker y despliegue

## Estado actual

- La app web y la API estan implementadas a nivel base.
- La base de datos ya tiene migracion inicial versionada.
- El flujo recomendado para la primera prueba es Docker.
- La app mobile sigue siendo un cliente inicial y no forma parte del arranque minimo.

## Arranque en Debian 12

Requisitos:

- Docker Engine con plugin `docker compose`
- Git

Pasos:

1. Clonar el repositorio.
2. Copiar `.env.example` a `.env` si no existe.
3. Revisar `AUTH_SECRET` y cambiarlo por un valor largo y aleatorio.
4. Ejecutar `docker compose -f infra/docker-compose.dev.yml up --build`.
5. Abrir `http://localhost:3000`.

El contenedor web aplica las migraciones al arrancar, por lo que no hace falta ejecutar Prisma manualmente para una primera prueba.

## Servicios Docker

- Web: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Caddy en produccion: `80/443`

## Pendiente antes de una validacion seria

- Instalar dependencias y ejecutar `pnpm -r typecheck`.
- Levantar el stack completo y probar registro, login y dashboard.
- Anadir datos de prueba o un seed si quieres demos repetibles.
