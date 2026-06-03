"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "../atoms/BrandLogo";
import { BrandMonogram } from "../atoms/BrandMonogram";
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

  // ── Scroll-aware state ──────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const host = window.location.hostname;
    const isPlatform = PLATFORM_SUBDOMAINS.some((sub) => host.startsWith(sub));
    setIsPlatformHost(isPlatform);

    const absoluteDashboard = getAbsoluteDashboardRouteForRole(
      session?.user?.role,
      host
    );
    setPanelHref(absoluteDashboard);

    if (session?.user?.name) {
      setUserName(session.user.name.toLowerCase());
      const hour = new Date().getHours();
      let greetStr = "buenos días";
      if (hour >= 12 && hour < 20) greetStr = "buenas tardes";
      else if (hour >= 20 || hour < 6) greetStr = "buenas noches";
      setTimeGreeting(greetStr);
    }

    const parts = host.split(":");
    const cleanHost = parts[0];
    const port = parts[1] ? `:${parts[1]}` : "";
    let baseDomain = cleanHost;
    if (baseDomain.startsWith("tienda.")) baseDomain = baseDomain.replace(/^tienda\./, "");
    else if (baseDomain.startsWith("kine.")) baseDomain = baseDomain.replace(/^kine\./, "");
    else if (baseDomain.startsWith("dashboard.")) baseDomain = baseDomain.replace(/^dashboard\./, "");
    else if (baseDomain.startsWith("dev1.")) baseDomain = baseDomain.replace(/^dev1\./, "");
    else if (baseDomain.startsWith("dev.")) baseDomain = baseDomain.replace(/^dev\./, "");
    else if (baseDomain.startsWith("www.")) baseDomain = baseDomain.replace(/^www\./, "");

    const protocol = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https";
    const targetLogin = `${protocol}://dashboard.${baseDomain}${port}/login`;
    const currentUrl = window.location.href;
    setLoginUrl(`${targetLogin}?callbackUrl=${encodeURIComponent(currentUrl)}`);
  }, [session?.user?.role, session?.user?.name]);

  const isBackoffice =
    isPlatformHost ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/kinesio");

  if (isBackoffice) return null;

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ease-in-out ${
        scrolled ? "px-3 pt-2 md:px-6 md:pt-2" : "px-3 pt-3 md:px-6 md:pt-4"
      }`}
    >
      <div
        className={`relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-starfeet-blue/15 px-3 shadow-[0_8px_28px_rgba(9,34,75,0.10)] backdrop-blur-xl transition-all duration-500 ease-in-out md:px-5 ${
          scrolled
            ? "h-12 bg-white/50 shadow-[0_4px_16px_rgba(9,34,75,0.07)]"
            : "h-16 bg-white/85 md:h-[74px]"
        }`}
      >
        {/* ── LOGO: intercambia entre BrandLogo y BrandMonogram al hacer scroll ── */}
        <Link href="/" className="flex shrink-0 items-center rounded-xl px-1 py-1">
          <AnimatePresence mode="wait" initial={false}>
            {scrolled ? (
              <motion.span
                key="monogram"
                initial={{ opacity: 0, scale: 0.75, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <BrandMonogram className="h-5 w-auto text-starfeet-blue" />
              </motion.span>
            ) : (
              <motion.span
                key="logo"
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <BrandLogo className="h-8 w-auto text-starfeet-blue md:h-10" />
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* ── NAV LINKS: se ocultan suavemente al hacer scroll ── */}
        <div className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center xl:flex transition-all duration-300" style={{ gap: scrolled ? '1.25rem' : '2rem' }}>
          {["Tienda", "Tecnología", "Nosotros"].map((label) => (
            <Link
              key={label}
              href={`/${label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}`}
              className={`font-condensed font-bold uppercase tracking-[0.16em] text-starfeet-blue/70 transition-all duration-300 hover:text-starfeet-blue ${
                scrolled ? "text-xs" : "text-sm"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-2 md:gap-3 min-w-[120px] justify-end">
          {status === "loading" ? (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-9 w-[80px] animate-pulse rounded-xl bg-starfeet-blue/5 md:w-[100px]" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-starfeet-blue/5" />
            </div>
          ) : session ? (
            <>
              {userName && !scrolled && (
                <motion.div
                  initial={false}
                  animate={{ opacity: scrolled ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-right text-[10px] font-bold leading-[1.25] text-starfeet-blue/75 pr-1.5 select-none md:pr-2"
                >
                  <span>¡hola {userName}!</span>
                  <span>{timeGreeting}</span>
                </motion.div>
              )}
              <Link href={panelHref}>
                <Button
                  variant="outline"
                  size="sm"
                  className={`!px-0 transition-all duration-300 ${scrolled ? "h-8 w-8" : "h-11 w-11"}`}
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
              <Link href={loginUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className={`!px-0 transition-all duration-300 ${scrolled ? "h-8 w-8" : "h-11 w-11"}`}
                  aria-label="Iniciar sesión"
                  title="Iniciar sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Button>
              </Link>

              <Link href="/tienda">
                <Button
                  variant="primary"
                  size="md"
                  className={`transition-all duration-300 ${
                    scrolled ? "h-8 !px-3 !text-xs !py-0" : "h-11 !px-6 md:!px-8"
                  }`}
                >
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
