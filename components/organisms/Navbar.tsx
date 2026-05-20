"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../atoms/BrandLogo";
import { Button } from "../atoms/Button";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";

// Platform subdomains — the Navbar must never appear here
const PLATFORM_SUBDOMAINS = ["kine.", "dashboard."];

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [isPlatformHost, setIsPlatformHost] = useState(false);
  const [panelHref, setPanelHref] = useState("/");
  const [signOutUrl, setSignOutUrl] = useState("/");
  const [loginUrl, setLoginUrl] = useState("/login");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const host = window.location.hostname;
    const isPlatform = PLATFORM_SUBDOMAINS.some((sub) => host.startsWith(sub));
    setIsPlatformHost(isPlatform);

    // Absolute URL to the user's dashboard on the correct subdomain
    const absoluteDashboard = getAbsoluteDashboardRouteForRole(
      session?.user?.role,
      host
    );
    setPanelHref(absoluteDashboard);

    // Sign-out redirects to /login on the correct subdomain.
    const base = absoluteDashboard.replace(/\/$/, "");
    setSignOutUrl(`${base}/login`);

    // Greeting string calculation based on user's timezone/hour
    if (session?.user?.name) {
      const hour = new Date().getHours();
      let greetStr = "Buenos días";
      if (hour >= 12 && hour < 20) {
        greetStr = "Buenas tardes";
      } else if (hour >= 20 || hour < 6) {
        greetStr = "Buenas noches";
      }
      setGreeting(`¡Hola ${session.user.name} ${greetStr}!`);
    }

    // Build absolute login URL pointing to dashboard.starfeet.ar/login?callbackUrl=...
    const parts = host.split(":");
    const cleanHost = parts[0];
    const port = parts[1] ? `:${parts[1]}` : "";
    let baseDomain = cleanHost;
    
    if (baseDomain.startsWith("tienda.")) baseDomain = baseDomain.replace(/^tienda\./, "");
    else if (baseDomain.startsWith("kine.")) baseDomain = baseDomain.replace(/^kine\./, "");
    else if (baseDomain.startsWith("dashboard.")) baseDomain = baseDomain.replace(/^dashboard\./, "");
    else if (baseDomain.startsWith("www.")) baseDomain = baseDomain.replace(/^www\./, "");

    const protocol = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https";
    const targetLogin = `${protocol}://dashboard.${baseDomain}${port}/login`;
    const currentUrl = window.location.href;
    setLoginUrl(`${targetLogin}?callbackUrl=${encodeURIComponent(currentUrl)}`);
  }, [session?.user?.role, session?.user?.name]);

  // Hide on platform subdomains OR on internal backoffice paths
  const isBackoffice =
    isPlatformHost ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/kinesio");

  if (isBackoffice) {
    return null;
  }

  return (
    <nav className="fixed left-0 top-0 z-50 w-full px-3 pt-3 md:px-6 md:pt-4">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-starfeet-blue/15 bg-white/85 px-3 shadow-[0_8px_28px_rgba(9,34,75,0.12)] backdrop-blur-xl md:h-[74px] md:px-5">
        <Link href="/" className="flex shrink-0 items-center rounded-xl px-1 py-1">
          <BrandLogo className="h-8 w-auto text-starfeet-blue md:h-10" />
        </Link>

        <div className="hidden items-center gap-8 xl:flex">
          <Link href="/tienda" className="font-condensed text-sm font-bold uppercase tracking-[0.16em] text-starfeet-blue/70 transition-colors hover:text-starfeet-blue">
            Tienda
          </Link>
          <Link href="/tecnologia" className="font-condensed text-sm font-bold uppercase tracking-[0.16em] text-starfeet-blue/70 transition-colors hover:text-starfeet-blue">
            Tecnología
          </Link>
          <Link href="/nosotros" className="font-condensed text-sm font-bold uppercase tracking-[0.16em] text-starfeet-blue/70 transition-colors hover:text-starfeet-blue">
            Nosotros
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {session ? (
            <>
              {/* Hola (nombre) Buenos días, tardes, noches */}
              {greeting && (
                <span className="text-xs font-bold uppercase tracking-wider text-starfeet-blue/75 pr-1 md:pr-2 select-none">
                  {greeting}
                </span>
              )}

              {/* User Icon -> links to their panel (absolute subdomain) */}
              <Link href={panelHref}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 w-11 !px-0"
                  aria-label="Panel"
                  title="Panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Button>
              </Link>

              {/* Sign-out -> /login on the correct subdomain for the role */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: signOutUrl })}
                className="h-11 w-11 !px-0"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16 17 5-5-5-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
                </svg>
              </Button>
            </>
          ) : (
            <>
              {/* User Icon when not logged in -> links to dashboard.starfeet.ar/login */}
              <Link href={loginUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 w-11 !px-0"
                  aria-label="Iniciar sesión"
                  title="Iniciar sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Button>
              </Link>

              <Link href="/tienda">
                <Button variant="primary" size="md" className="h-11 !px-6 md:!px-8">
                  Compra
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
