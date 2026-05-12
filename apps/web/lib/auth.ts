import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@gestor/db";

const SESSION_TTL_DAYS = 30;

function hashSecret(value: string) {
  const secret = process.env.AUTH_SECRET ?? "development-auth-secret";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  const derivedKey = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(key, "hex");
  return timingSafeEqual(derivedKey, storedKey);
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSecret(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(process.env.COOKIE_NAME ?? "gestor_session", rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.COOKIE_NAME ?? "gestor_session")?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSecret(token) }
    });
  }

  cookieStore.delete(process.env.COOKIE_NAME ?? "gestor_session");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.COOKIE_NAME ?? "gestor_session")?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSecret(token),
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
