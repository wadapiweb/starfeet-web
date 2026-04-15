"use client";
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../atoms/BrandLogo";
import { Button } from "../atoms/Button";

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const panelHref =
    role === "ADMIN" ? "/admin" : role === "KINESIOLOGO" ? "/kinesio" : "/cliente";
  const isBackoffice = pathname.startsWith("/admin") || pathname.startsWith("/kinesio");

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
              <Link href={panelHref}>
                <Button variant="outline" size="sm" className="h-11 !px-5">
                  Panel
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
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
              <Link href="/login">
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
