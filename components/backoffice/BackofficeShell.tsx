"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BackofficeNavItem } from "@/lib/backoffice-navigation";
import { BackofficeSignOutButton } from "@/components/backoffice/BackofficeSignOutButton";

type BackofficeShellProps = {
  area: "ADMIN" | "KINESIO";
  title: string;
  subtitle: string;
  navItems: BackofficeNavItem[];
  userName?: string | null;
  userEmail?: string | null;
  children: React.ReactNode;
};

export function BackofficeShell({
  area,
  title,
  subtitle,
  navItems,
  userName,
  userEmail,
  children,
}: BackofficeShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-12 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700"
          >
            {mobileOpen ? "Cerrar menú" : "Menú"}
          </button>
          <span className="rounded-full bg-starfeet-blue px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
            {area}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
          <aside
            className={`rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-28 lg:block lg:h-[calc(100vh-8.5rem)] lg:overflow-auto ${
              mobileOpen ? "block" : "hidden"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-starfeet-blue/70">{area}</p>
            <h2 className="mt-2 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
              Workspace
            </h2>

            <nav className="mt-5 space-y-2" aria-label={`Navegación ${area.toLowerCase()}`}>
              {navItems.map((item) => {
                const matchPrefix = item.matchPrefix ?? item.href;
                const active =
                  pathname === item.href ||
                  pathname === matchPrefix ||
                  pathname.startsWith(`${matchPrefix}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl border px-3 py-2 transition ${
                      active
                        ? "border-starfeet-blue bg-starfeet-blue text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-starfeet-blue/40"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.1em]">{item.label}</p>
                    <p className={`mt-1 text-xs ${active ? "text-gray-100" : "text-gray-500"}`}>{item.description}</p>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-4">
            <header className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-starfeet-blue/70">Panel {area}</p>
                  <h1 className="mt-1 font-condensed text-4xl font-black uppercase tracking-tight text-starfeet-blue md:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600">{subtitle}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 md:min-w-60">
                  <p className="font-bold uppercase tracking-[0.12em] text-gray-500">Sesión</p>
                  <p className="mt-1 text-sm font-semibold text-starfeet-blue">{userName ?? "Sin nombre"}</p>
                  <p className="truncate text-xs">{userEmail ?? "Sin email"}</p>
                  <div className="mt-3">
                    <BackofficeSignOutButton />
                  </div>
                </div>
              </div>
            </header>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
