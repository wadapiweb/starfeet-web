"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../atoms/BrandLogo";
import { Button } from "../atoms/Button";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";

// Platform subdomains — the Navbar must never appear here
const PLATFORM_SUBDOMAINS = ["kine.", "dashboard."];

export const Navbar = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [isPlatformHost, setIsPlatformHost] = useState(false);
  const [panelHref, setPanelHref] = useState("/");
  const [loginUrl, setLoginUrl] = useState("/login");
  const [userName, setUserName] = useState("");
  const [timeGreeting, setTimeGreeting] = useState("");

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

    // Greeting string calculation based on user's timezone/hour (in lowercase)
    if (session?.user?.name) {
      setUserName(session.user.name.toLowerCase());
      
      const hour = new Date().getHours();
      let greetStr = "buenos días";
      if (hour >= 12 && hour < 20) {
        greetStr = "buenas tardes";
      } else if (hour >= 20 || hour < 6) {
        greetStr = "buenas noches";
      }
      setTimeGreeting(greetStr);
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
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-starfeet-blue/15 bg-white/85 px-3 shadow-[0_8px_28px_rgba(9,34,75,0.12)] backdrop-blur-xl md:h-[74px] md:px-5">
        <Link href="/" className="flex shrink-0 items-center rounded-xl px-1 py-1">
          <BrandLogo className="h-8 w-auto text-starfeet-blue md:h-10" />
        </Link>

        {/* Absolute Centering to prevent links shifting when actions change width */}
        <div className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 xl:flex">
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

        <div className="flex items-center gap-2 md:gap-3 min-w-[120px] justify-end">
          {status === "loading" ? (
            // Pulsing placeholders: Large on the left, round outline icon on the right
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-11 w-[90px] animate-pulse rounded-xl bg-starfeet-blue/5 md:w-[108px]" />
              <div className="h-11 w-11 animate-pulse rounded-full bg-starfeet-blue/5 border border-starfeet-blue/10" />
            </div>
          ) : session ? (
            <>
              {/* Greeting in lowercase and two lines */}
              {userName && (
                <div className="flex flex-col text-right text-[10px] font-bold leading-[1.25] text-starfeet-blue/75 pr-1.5 select-none md:pr-2">
                  <span>¡hola {userName}!</span>
                  <span>{timeGreeting}</span>
                </div>
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
