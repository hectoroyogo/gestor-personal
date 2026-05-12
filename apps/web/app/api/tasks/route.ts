import { createTask, listTasks } from "@gestor/api";
import { taskInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../lib/auth";
import { created, handleRouteError, ok, parseRequestJson, serialize } from "../../../lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const tasks = await listTasks(user.id);
    return ok(serialize(tasks));
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

    const payload = taskInputSchema.parse(await parseRequestJson(request));
    const task = await createTask(user.id, payload);
    return created(serialize(task));
  } catch (error) {
    return handleRouteError(error);
  }
}

