import { getCurrentUser } from "../../../../../lib/auth";
import { ok } from "../../../../../lib/http";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Session required"
        }
      },
      { status: 401 }
    );
  }

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

