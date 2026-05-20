"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BackofficeNavItem } from "@/lib/backoffice-navigation";
import { BrandLogo } from "@/components/atoms/BrandLogo";

/**
 * Detects whether we are running on a dedicated subdomain (kine.* or dashboard.*)
 * and returns the path prefix that should be stripped from nav hrefs.
 * Returns empty string when no stripping is needed (e.g. localhost or dev domains).
 */
function useSubdomainPrefix(area: "ADMIN" | "KINESIO"): string {
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    const host = window.location.hostname;
    if (area === "KINESIO" && host.startsWith("kine.")) {
      setPrefix("/kinesio");
    } else if (area === "ADMIN" && host.startsWith("dashboard.")) {
      setPrefix("/admin");
    }
  }, [area]);

  return prefix;
}

type BackofficeShellProps = {
  area: "ADMIN" | "KINESIO";
  title: string;
  subtitle: string;
  navItems: BackofficeNavItem[];
  userName?: string | null;
  userEmail?: string | null;
  themeMode?: "light" | "dark";
  children: React.ReactNode;
};

export function BackofficeShell({
  area,
  title,
  navItems,
  userName,
  userEmail,
  themeMode = "light",
  children,
}: BackofficeShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const subdomainPrefix = useSubdomainPrefix(area);

  // Strip the subdomain prefix from nav items so links are clean on kine.* / dashboard.*
  const resolvedNavItems = subdomainPrefix
    ? navItems.map((item) => ({
        ...item,
        href: item.href === subdomainPrefix ? "/" : item.href.replace(new RegExp(`^${subdomainPrefix}`), ""),
        matchPrefix: item.matchPrefix
          ? item.matchPrefix.replace(new RegExp(`^${subdomainPrefix}`), "")
          : undefined,
      }))
    : navItems;

  const sectionTitle = resolveSectionTitle(pathname, resolvedNavItems, title);
  const isDark = themeMode === "dark";

  return (
    <div className={isDark ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-[#f3f5f9] text-gray-900"}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-72 border-r px-4 py-5 lg:flex lg:flex-col ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
          }`}
      >
        <SidebarContent
          area={area}
          navItems={resolvedNavItems}
          pathname={pathname}
          subdomainPrefix={subdomainPrefix}
          onNavigate={() => undefined}
          userName={userName}
          userEmail={userEmail}
          themeMode={themeMode}
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
          <aside
            className={`absolute inset-y-0 left-0 w-72 border-r px-4 py-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
              }`}
          >
            <SidebarContent
              area={area}
              navItems={resolvedNavItems}
              pathname={pathname}
              subdomainPrefix={subdomainPrefix}
              onNavigate={() => setMobileOpen(false)}
              userName={userName}
              userEmail={userEmail}
              themeMode={themeMode}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header
          className={`sticky top-0 z-30 border-b px-4 py-3 backdrop-blur md:px-6 ${isDark ? "border-slate-800 bg-slate-950/90" : "border-gray-200 bg-white/95"
            }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="Volver"
                onClick={() => router.back()}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${isDark
                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <IconChevronLeft className="h-7 w-7" aria-hidden="true" strokeWidth={2.5} />
              </button>

              <h1
                className={`truncate font-condensed text-2xl font-black uppercase tracking-tight md:text-3xl ${isDark ? "text-sky-300" : "text-starfeet-blue"
                  }`}
              >
                {sectionTitle}
              </h1>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] lg:hidden ${isDark
                    ? "border-slate-700 bg-slate-900 text-slate-200"
                    : "border-gray-300 bg-white text-gray-700"
                  }`}
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
                  className={`w-full rounded-xl border px-3 py-2 pl-9 text-sm shadow-sm outline-none transition ${isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/15"
                      : "border-gray-300 bg-white text-gray-900 focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
                    }`}
                />
                <IconSearch
                  className={`pointer-events-none absolute left-3 top-2.5 h-4 w-4 ${isDark ? "text-slate-400" : "text-gray-500"
                    }`}
                  aria-hidden="true"
                />
              </label>

              <button
                type="button"
                aria-label="Notificaciones"
                className={`relative rounded-xl border p-2 transition ${isDark
                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
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
          <div
            className={`rounded-2xl border p-4 shadow-sm md:p-5 ${isDark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-gray-200 bg-white"
              }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  area: "ADMIN" | "KINESIO";
  navItems: BackofficeNavItem[];
  pathname: string;
  subdomainPrefix: string;
  onNavigate: () => void;
  userName?: string | null;
  userEmail?: string | null;
  themeMode: "light" | "dark";
};

function SidebarContent({ area, navItems, pathname, subdomainPrefix, onNavigate, userName, userEmail, themeMode }: SidebarContentProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const basePrefix = area === "ADMIN" ? "/admin" : "/kinesio";
  const linkPrefix = subdomainPrefix ? "" : basePrefix;
  const profileHref = `${linkPrefix}/profile`;
  const settingsHref = `${linkPrefix}/settings`;
  const helpHref = `${linkPrefix}/help`;
  const isDark = themeMode === "dark";

  return (
    <>
      <Link
        href="/"
        className={`flex items-center rounded-xl px-2 py-1 ${isDark ? "text-sky-300 hover:bg-slate-800" : "text-starfeet-blue hover:bg-gray-50"}`}
        onClick={onNavigate}
      >
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
              className={`block rounded-xl border px-3 py-3 transition ${active
                  ? isDark
                    ? "border-sky-300 bg-sky-300 text-slate-950"
                    : "border-starfeet-blue bg-starfeet-blue text-white"
                  : isDark
                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-300/40"
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
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-gray-50"
            }`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="min-w-0">
            <span className={`block truncate font-semibold ${isDark ? "text-sky-300" : "text-starfeet-blue"}`}>
              {userName ?? "Usuario"}
            </span>
            <span className={`block truncate text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>{userEmail ?? "Sin email"}</span>
          </span>
          {menuOpen ? (
            <IconChevronUp className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-gray-500"}`} aria-hidden="true" />
          ) : (
            <IconChevronDown className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-gray-500"}`} aria-hidden="true" />
          )}
        </button>

        {menuOpen ? (
          <div
            className={`absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border p-1 shadow-lg ${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"
              }`}
            role="menu"
          >
            <Link
              href={profileHref}
              onClick={() => {
                setMenuOpen(false);
                onNavigate();
              }}
              className={`inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${isDark ? "text-slate-200 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                }`}
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
              className={`inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${isDark ? "text-slate-200 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                }`}
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
              className={`inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${isDark ? "text-slate-200 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                }`}
              role="menuitem"
            >
              <IconCircleHelp className="h-4 w-4" aria-hidden="true" />
              Ayuda
            </Link>
            <button
              type="button"
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
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
