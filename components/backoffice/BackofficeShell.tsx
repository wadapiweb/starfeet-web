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
    <div className="min-h-screen bg-[#f3f5f9] text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-gray-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <SidebarContent
          area={area}
          navItems={navItems}
          pathname={pathname}
          onNavigate={() => undefined}
          userName={userName}
          userEmail={userEmail}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-gray-200 bg-white px-4 py-5">
            <SidebarContent
              area={area}
              navItems={navItems}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              userName={userName}
              userEmail={userEmail}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="mt-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 lg:hidden"
              >
                Menú
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-starfeet-blue/70">{area}</p>
                <h1 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue md:text-4xl">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <label className="relative block md:w-80">
                <span className="sr-only">Buscar en el panel</span>
                <input
                  type="search"
                  placeholder="Buscar órdenes, cupones o pacientes"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 shadow-sm outline-none transition focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Notificaciones"
                  className="relative rounded-xl border border-gray-300 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
                >
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    3
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                    <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                    <path d="M9 17a3 3 0 0 0 6 0" />
                  </svg>
                </button>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Usuario</p>
                  <p className="max-w-44 truncate text-sm font-semibold text-starfeet-blue">{userName ?? "Sin nombre"}</p>
                  <p className="max-w-44 truncate text-xs text-gray-500">{userEmail ?? "Sin email"}</p>
                </div>

                <BackofficeSignOutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 md:px-6 md:py-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  area: "ADMIN" | "KINESIO";
  navItems: BackofficeNavItem[];
  pathname: string;
  onNavigate: () => void;
  userName?: string | null;
  userEmail?: string | null;
};

function SidebarContent({ area, navItems, pathname, onNavigate, userName, userEmail }: SidebarContentProps) {
  return (
    <>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-starfeet-blue/70">{area}</p>
        <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Workspace</h2>
      </div>

      <nav className="mt-5 flex-1 space-y-2 overflow-auto" aria-label={`Navegación ${area.toLowerCase()}`}>
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
              onClick={onNavigate}
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

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-bold uppercase tracking-[0.12em] text-gray-500">Sesión activa</p>
        <p className="mt-1 truncate text-sm font-semibold text-starfeet-blue">{userName ?? "Sin nombre"}</p>
        <p className="truncate text-xs">{userEmail ?? "Sin email"}</p>
      </div>
    </>
  );
}
