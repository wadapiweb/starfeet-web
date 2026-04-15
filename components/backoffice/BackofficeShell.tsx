"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  navItems,
  userName,
  userEmail,
  children,
}: BackofficeShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sectionTitle = resolveSectionTitle(pathname, navItems, title);

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
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="Volver"
                onClick={() => router.back()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100"
              >
                <IconChevronLeft className="h-7 w-7" aria-hidden="true" strokeWidth={2.5} />
              </button>

              <h1 className="truncate font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue md:text-3xl">
                {sectionTitle}
              </h1>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 lg:hidden"
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconMenu className="h-4 w-4" aria-hidden="true" />
                  Menú
                </span>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="relative block md:w-80">
                <span className="sr-only">Buscar en el panel</span>
                <input
                  type="search"
                  placeholder="Buscar órdenes, cupones o pacientes"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 shadow-sm outline-none transition focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
                />
                <IconSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
              </label>

              <button
                type="button"
                aria-label="Notificaciones"
                className="relative rounded-xl border border-gray-300 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
              >
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  3
                </span>
                <IconBell className="h-5 w-5" aria-hidden="true" />
              </button>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const profileHref = area === "ADMIN" ? "/admin/profile" : "/kinesio/profile";
  const settingsHref = area === "ADMIN" ? "/admin/settings" : "/kinesio/settings";
  const helpHref = area === "ADMIN" ? "/admin/help" : "/kinesio/help";

  return (
    <>
      <Link href="/" className="flex items-center rounded-xl px-2 py-1 text-starfeet-blue hover:bg-gray-50" onClick={onNavigate}>
        <BrandLogo className="h-9 w-auto" />
      </Link>

      <nav className="mt-6 flex-1 space-y-2 overflow-auto" aria-label={`Navegación ${area.toLowerCase()}`}>
        {navItems.map((item) => {
          const ItemIcon = resolveNavIcon(item.href);
          const matchPrefix = item.matchPrefix ?? item.href;
          const exactOnly = matchPrefix === item.href;
          const active = exactOnly
            ? pathname === item.href
            : pathname === item.href || pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-xl border px-3 py-3 transition ${
                active
                  ? "border-starfeet-blue bg-starfeet-blue text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-starfeet-blue/40"
              }`}
            >
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em]">
                <ItemIcon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </p>
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
          {menuOpen ? (
            <IconChevronUp className="h-4 w-4 text-gray-500" aria-hidden="true" />
          ) : (
            <IconChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
          )}
        </button>

        {menuOpen ? (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-gray-200 bg-white p-1 shadow-lg" role="menu">
            <Link
              href={profileHref}
              onClick={() => {
                setMenuOpen(false);
                onNavigate();
              }}
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <IconUser className="h-4 w-4" aria-hidden="true" />
              Perfil
            </Link>
            <Link
              href={settingsHref}
              onClick={() => {
                setMenuOpen(false);
                onNavigate();
              }}
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <IconSettings className="h-4 w-4" aria-hidden="true" />
              Configuración
            </Link>
            <Link
              href={helpHref}
              onClick={() => {
                setMenuOpen(false);
                onNavigate();
              }}
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <IconCircleHelp className="h-4 w-4" aria-hidden="true" />
              Ayuda
            </Link>
            <button
              type="button"
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <IconLogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function resolveSectionTitle(pathname: string, navItems: BackofficeNavItem[], fallback: string) {
  for (const item of navItems) {
    const matchPrefix = item.matchPrefix ?? item.href;
    const exactOnly = matchPrefix === item.href;
    const isMatch = exactOnly
      ? pathname === item.href
      : pathname === item.href || pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);

    if (isMatch) {
      return item.label;
    }
  }

  if (pathname.endsWith("/profile")) {
    return "Perfil";
  }
  if (pathname.endsWith("/settings")) {
    return "Configuración";
  }
  if (pathname.endsWith("/help")) {
    return "Ayuda";
  }

  return fallback;
}

type IconProps = React.SVGProps<SVGSVGElement>;
type IconComponent = (props: IconProps) => React.JSX.Element;

function resolveNavIcon(href: string): IconComponent {
  if (href.includes("/products")) {
    return IconBox;
  }
  if (href.includes("/coupons")) {
    return IconTicket;
  }
  if (href.includes("/professionals")) {
    return IconUsers;
  }
  if (href.includes("/sales")) {
    return IconShoppingCart;
  }
  if (href.includes("/crm")) {
    return IconUsers;
  }
  if (href.includes("/finance") || href.includes("/commissions") || href.includes("/payouts")) {
    return IconWallet;
  }
  if (href.includes("/patients")) {
    return IconUser;
  }
  return IconLayoutDashboard;
}

function IconBase({ className, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

function IconBell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </IconBase>
  );
}

function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

function IconChevronLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 18-6-6 6-6" />
    </IconBase>
  );
}

function IconChevronUp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 15 6-6 6 6" />
    </IconBase>
  );
}

function IconChevronDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

function IconMenu(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}

function IconCircleHelp(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.9.4-1.2.9-1.2 1.8" />
      <circle cx="12" cy="16.5" r="0.5" />
    </IconBase>
  );
}

function IconLayoutDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </IconBase>
  );
}

function IconLogOut(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z" />
    </IconBase>
  );
}

function IconShoppingCart(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7" />
    </IconBase>
  );
}

function IconTicket(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z" />
      <path d="M9 8v8" />
      <path d="M15 8v8" />
    </IconBase>
  );
}

function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

function IconUsers(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 21a6 6 0 0 0-8 0" />
      <circle cx="12" cy="8" r="4" />
      <path d="M22 21a6 6 0 0 0-4-5.7" />
      <path d="M2 21a6 6 0 0 1 4-5.7" />
    </IconBase>
  );
}

function IconWallet(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M16 12h4" />
      <circle cx="16" cy="12" r="1" />
    </IconBase>
  );
}

function IconBox(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7 12 3l9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </IconBase>
  );
}
