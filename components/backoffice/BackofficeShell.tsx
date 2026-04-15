"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BackofficeNavItem } from "@/lib/backoffice-navigation";
import { BrandLogo } from "@/components/atoms/BrandLogo";

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
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 lg:hidden"
            >
              Menú
            </button>

            <div className="ml-auto flex items-center gap-2">
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
            </div>
          </div>
        </header>

        <main className="px-4 py-4 md:px-6 md:py-6">
          <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-starfeet-blue/70">Panel {area}</p>
            <h1 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue md:text-4xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          </section>

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Link href="/" className="flex items-center rounded-xl px-2 py-1 text-starfeet-blue hover:bg-gray-50" onClick={onNavigate}>
        <BrandLogo className="h-9 w-auto" />
      </Link>

      <nav className="mt-6 flex-1 space-y-2 overflow-auto" aria-label={`Navegación ${area.toLowerCase()}`}>
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

      <div className="relative mt-4 border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="min-w-0">
            <span className="block truncate font-semibold text-starfeet-blue">{userName ?? "Usuario"}</span>
            <span className="block truncate text-xs text-gray-500">{userEmail ?? "Sin email"}</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-gray-500" aria-hidden="true">
            <path d={menuOpen ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
          </svg>
        </button>

        {menuOpen ? (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm" role="menu">
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
              Perfil
            </button>
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
              Configuración
            </button>
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
              Ayuda
            </button>
            <button
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
