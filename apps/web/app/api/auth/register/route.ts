import { Prisma } from "@gestor/db";
import { registerInputSchema } from "@gestor/core";
import { prisma } from "@gestor/db";

import { createSession, hashPassword } from "../../../../lib/auth";
import { created, handleRouteError, parseRequestJson } from "../../../../lib/http";

export async function POST(request: Request) {
  try {
    const payload = registerInputSchema.parse(await parseRequestJson(request));
    const passwordHash = hashPassword(payload.password);

    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        name: payload.name,
        passwordHash,
        accounts: {
          create: {
            name: "Cuenta principal",
            currency: "EUR",
            initialBalance: new Prisma.Decimal(0)
          }
        },
        categories: {
          create: [
            { name: "Salario", kind: "income", color: "#34d399" },
            { name: "Alimentación", kind: "expense", color: "#60a5fa" },
            { name: "Ahorro", kind: "savings", color: "#fbbf24" }
          ]
        }
      }
    });

    await createSession(user.id);

    return created({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "Ese email ya está registrado"
          }
        },
        { status: 409 }
      );
    }

    return handleRouteError(error);
  }
}
