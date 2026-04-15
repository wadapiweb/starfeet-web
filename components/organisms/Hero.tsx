"use client";
import React from "react";
import Spline from '@splinetool/react-spline';
import { Button } from "../atoms/Button";
import { motion } from "framer-motion";

export const Hero = () => {
    return (
        <section className="relative w-full bg-white">
            {/* Capa de Fondo 3D Fijada */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center z-0">
                <div className="absolute inset-0 w-full h-full">
                    <Spline
                        scene="https://prod.spline.design/wm9HdM73hQup4aMZ/scene.splinecode"
                    />
                </div>
            </div>

            {/* Capa Superior de Textos en Flujo de Scroll Normal */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pointer-events-none -mt-[100vh]">

                {/* BLOQUE IZQUIERDO 1 */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-screen flex flex-col justify-center items-start w-full md:w-1/2"
                >
                    <div className="pointer-events-auto">
                        <h1 className="font-condensed font-black text-[80px] md:text-[130px] text-starfeet-blue leading-[0.9] mb-6 uppercase tracking-tighter drop-shadow-sm">
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

                {/* BLOQUE DERECHO 2 */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-screen flex flex-col justify-center items-end w-full md:w-1/2 ml-auto"
                >
                    <div className="pointer-events-auto bg-white/40 backdrop-blur-[2px] p-8 md:p-12 rounded-3xl shadow-sm border border-white/20 text-right">
                        <h2 className="font-condensed font-black text-4xl md:text-6xl text-starfeet-blue mb-8 uppercase leading-none whitespace-nowrap">
                            DISEÑO BIOMECÁNICO
                        </h2>
                        <div className="font-sans font-normal text-base md:text-lg text-starfeet-blue space-y-4 leading-tight">
                            <p className="whitespace-nowrap">Nuestra tecnología se adapta a la forma única de tu pie.</p>
                            <p className="whitespace-nowrap">Proporcionando soporte dinámico exactamente donde lo necesitas.</p>
                            <p className="whitespace-nowrap">Corrige la postura desde la base, aliviando la tensión corporal.</p>
                            <p className="whitespace-nowrap">Siente la diferencia de caminar con una alineación perfecta.</p>
                            <p className="whitespace-nowrap">Diseñado por expertos en kinesiología para tu bienestar diario.</p>
                        </div>
                    </div>
                </motion.div>

                {/* BLOQUE IZQUIERDO 3 */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-screen flex flex-col justify-center items-start w-full md:w-1/2 pb-32"
                >
                    <div className="pointer-events-auto bg-white/40 backdrop-blur-[2px] p-8 md:p-12 rounded-3xl shadow-sm border border-white/20 text-left">
                        <h2 className="font-condensed font-black text-4xl md:text-6xl text-starfeet-blue mb-8 uppercase leading-none whitespace-nowrap">
                            ESTABILIDAD TOTAL
                        </h2>
                        <div className="font-sans font-normal text-base md:text-lg text-starfeet-blue space-y-4 leading-tight">
                            <p className="whitespace-nowrap">Nuestra estructura patentada distribuye el peso</p>
                            <p className="whitespace-nowrap">de manera uniforme, eliminando puntos de presión.</p>
                            <p className="whitespace-nowrap">Equilibrio perfecto en cada fase del ciclo de la marcha.</p>
                            <p className="whitespace-nowrap">Siente la seguridad de una base sólida y confiable.</p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};
