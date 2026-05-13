import { deleteCategory, updateCategory } from "@gestor/api";
import { categoryUpdateInputSchema } from "@gestor/core";

import { getCurrentUser } from "../../../../lib/auth";
import { handleRouteError, ok, parseRequestJson, serialize } from "../../../../lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { categoryId } = await params;
    const payload = categoryUpdateInputSchema.parse(await parseRequestJson(request));
    return ok(serialize(await updateCategory(user.id, categoryId, payload)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
    }

    const { categoryId } = await params;
    await deleteCategory(user.id, categoryId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
