"use client";

import { signOut } from "next-auth/react";

export function BackofficeSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 transition hover:bg-gray-100"
    >
      Cerrar sesión
    </button>
  );
}
