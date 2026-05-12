import { createSavingsGoal, listSavingsGoals } from "@gestor/api";
import { savingsGoalInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../lib/auth";
import { created, handleRouteError, ok, parseRequestJson, serialize } from "../../../lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    return ok(serialize(await listSavingsGoals(user.id)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const payload = savingsGoalInputSchema.parse(await parseRequestJson(request));
    return created(serialize(await createSavingsGoal(user.id, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}
