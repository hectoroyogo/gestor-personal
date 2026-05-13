import { deleteAccount, updateAccount } from "@gestor/api";
import { accountUpdateInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson, serialize } from "../../../../lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { accountId } = await params;
    const payload = accountUpdateInputSchema.parse(await parseRequestJson(request));
    return ok(serialize(await updateAccount(user.id, accountId, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { accountId } = await params;
    await deleteAccount(user.id, accountId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
