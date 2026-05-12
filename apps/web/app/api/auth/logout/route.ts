import { clearSession } from "../../../../../lib/auth";
import { handleRouteError, ok } from "../../../../../lib/http";

export async function POST() {
  try {
    await clearSession();
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

