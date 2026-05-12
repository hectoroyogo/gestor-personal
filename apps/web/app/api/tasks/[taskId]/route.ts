import { updateTask } from "@gestor/api";
import { taskUpdateInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson, serialize } from "../../../../lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { taskId } = await params;
    const payload = taskUpdateInputSchema.parse(await parseRequestJson(request));
    const task = await updateTask(user.id, taskId, payload);
    return ok(serialize(task));
  } catch (error) {
    return handleRouteError(error);
  }
}

