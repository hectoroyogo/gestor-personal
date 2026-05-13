import { deleteBudget, updateBudget } from "@gestor/api";
import { budgetUpdateInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson, serialize } from "../../../../lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { budgetId } = await params;
    const payload = budgetUpdateInputSchema.parse(await parseRequestJson(request));
    return ok(serialize(await updateBudget(user.id, budgetId, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { budgetId } = await params;
    await deleteBudget(user.id, budgetId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
