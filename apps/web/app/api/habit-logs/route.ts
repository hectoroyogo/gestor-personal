import { logHabit } from "@gestor/api";
import { habitLogInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../lib/auth";
import { created, handleRouteError, parseRequestJson, serialize } from "../../../lib/http";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const payload = habitLogInputSchema.parse(await parseRequestJson(request));
    return created(serialize(await logHabit(user.id, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}

