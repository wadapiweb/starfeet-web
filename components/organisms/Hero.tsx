"use client";
import React from "react";
import { Button } from "../atoms/Button";
import { motion } from "framer-motion";
import Image from "next/image";

export const Hero = () => {
    return (
        <section className="relative w-full bg-white overflow-hidden">
            {/* Contenedor Principal de Bloques */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6">

                {/* SECCIÓN 1: HERO PRINCIPAL (Texto Izquierda + Imagen Derecha) */}
                <div className="h-screen flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* BLOQUE IZQUIERDO 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full md:w-[40%] flex flex-col justify-center items-start"
                    >
                        <div className="pointer-events-auto">
                            <h1 className="font-condensed font-black text-[70px] md:text-[110px] text-starfeet-blue leading-[0.9] mb-6 uppercase tracking-normal drop-shadow-sm whitespace-nowrap">
                                TU PISADA<br />MEJORA
                            </h1>
                            <p className="font-sans font-medium text-lg md:text-xl text-starfeet-blue mb-10 max-w-xl leading-tight">
                                Primer complemento para reeducar la pisada<br className="hidden md:block" /> Innovación a nivel mundial
                            </p>
                            <Button>
                                COMPRAR
                            </Button>
                        </div>
                    </motion.div>

                    {/* BLOQUE DERECHO 1: LA IMAGEN NUEVA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full md:w-[60%] flex justify-center items-center relative md:translate-x-8 flex-shrink-0"
                    >
                        <div className="relative w-full aspect-square max-w-[1080px] translate-y-4">
                            <Image 
                                src="/images/hero01_a.webp" 
                                alt="Starfeet Product" 
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};
