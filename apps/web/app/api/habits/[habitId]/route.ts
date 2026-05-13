import { deleteHabit, updateHabit } from "@gestor/api";
import { habitUpdateInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson, serialize } from "../../../../lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ habitId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { habitId } = await params;
    const payload = habitUpdateInputSchema.parse(await parseRequestJson(request));
    return ok(serialize(await updateHabit(user.id, habitId, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ habitId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { habitId } = await params;
    await deleteHabit(user.id, habitId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
