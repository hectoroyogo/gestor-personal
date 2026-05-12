import { loginInputSchema } from "@gestor/core";
import { prisma } from "@gestor/db";

import { createSession, verifyPassword } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson } from "../../../../lib/http";

export async function POST(request: Request) {
  try {
    const payload = loginInputSchema.parse(await parseRequestJson(request));
    const user = await prisma.user.findUnique({
      where: {
        email: payload.email.toLowerCase()
      }
    });

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      return Response.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Credenciales inválidas"
          }
        },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
