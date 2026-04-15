"use client";
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BrandLogo } from "../atoms/BrandLogo";
import { Button } from "../atoms/Button";

export const Navbar = () => {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100 h-24 flex items-center">
            <div className="w-full px-6 md:px-12 flex justify-between items-center">
                {/* LOGO PEGADO A LA IZQUIERDA */}
                <Link href="/" className="flex items-center group select-none shrink-0">
                    <BrandLogo className="h-10 md:h-12 w-auto text-starfeet-blue" />
                </Link>

                {/* NAVBAR, BOTON USER Y BOTON COMPRAR PEGADOS A LA DERECHA */}
                <div className="flex items-center gap-8 md:gap-12">
                    {/* MENU LINKS */}
                    <div className="hidden xl:flex items-center gap-10">
                        <Link href="/tienda" className="font-condensed font-bold text-sm text-starfeet-blue/70 hover:text-starfeet-blue transition-colors tracking-widest uppercase">
                            TIENDA
                        </Link>
                        <Link href="/tecnologia" className="font-condensed font-bold text-sm text-starfeet-blue/70 hover:text-starfeet-blue transition-colors tracking-widest uppercase">
                            TECNOLOGÍA
                        </Link>
                        <Link href="/nosotros" className="font-condensed font-bold text-sm text-starfeet-blue/70 hover:text-starfeet-blue transition-colors tracking-widest uppercase">
                            NOSOTROS
                        </Link>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* MI CUENTA / AUTH (CONTORNO + ICONO) */}
                        {session ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => signOut()}
                                className="!px-4 h-12 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                                <span className="hidden sm:inline">SALIR</span>
                            </Button>
                        ) : (
                            <Link href="/api/auth/signin">
                                <Button variant="outline" size="sm" className="flex items-center gap-2 !px-4 h-12">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                    <span className="hidden sm:inline">MI CUENTA</span>
                                </Button>
                            </Link>
                        )}

                        {/* BOTÓN COMPRAR PRIMARIO (MÁS GRANDE) */}
                        <Button variant="primary" size="md" className="h-12 !px-10">
                            COMPRAR
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
