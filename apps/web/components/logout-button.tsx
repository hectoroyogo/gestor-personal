"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <button className="btn sidebarButton" type="button" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
