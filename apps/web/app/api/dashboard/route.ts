import { getDashboard } from "@gestor/api";

import { getCurrentUser } from "../../../lib/auth";
import { handleRouteError, ok, serialize } from "../../../lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const dashboard = await getDashboard(user.id);
    return ok(serialize(dashboard));
  } catch (error) {
    return handleRouteError(error);
  }
}

