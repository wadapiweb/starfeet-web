"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export const HealthSolution = () => {
  const t = useTranslations("HealthSolution");

  return (
    <section 
      aria-label="Una solución pensada para tu salud"
      className="relative bg-[#f4f4f5] min-h-screen flex items-center py-24 md:py-32 overflow-hidden border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 xl:gap-32 items-center w-full">
        {/* LADO IZQUIERDO: VISUALS (TÍTULO + LOGO DE FONDO) */}
        <div className="relative flex justify-center lg:justify-start items-center min-h-[350px] sm:min-h-[450px] md:min-h-[520px] w-full">
          <div className="relative w-full max-w-[480px] h-full min-h-[350px] sm:min-h-[450px] md:min-h-[520px] flex items-center justify-center">
            {/* Logo de Fondo SF */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center scale-[1.3] -translate-x-[5%] sm:scale-[1.6] sm:-translate-x-[8%] md:scale-[1.8] md:-translate-x-[12%] lg:scale-[2.1] lg:-translate-x-[18%] select-none opacity-80 transition-transform duration-300">
              <Image
                src="/images/logo_SF.svg"
                alt="Fondo SF"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Título Principal */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 font-condensed font-black text-[70px] md:text-[110px] text-starfeet-blue leading-[0.9] tracking-normal uppercase text-left w-max z-10 select-none pointer-events-none whitespace-pre-line"
            >
              {t("title")}
            </motion.h2>
          </div>
        </div>

        {/* LADO DERECHO: ÍTEMS DE SOLUCIÓN CON ANIMACIÓN */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-col gap-10 md:gap-12 z-10 pl-0 lg:pl-8 w-full max-w-md lg:ml-auto"
        >
          {/* Item 1 */}
          <div className="flex flex-col">
            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
              {t("item1_title")}
            </h3>
            <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2.5 whitespace-pre-line">
              {t("item1_desc")}
            </p>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col">
            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
              {t("item2_title")}
            </h3>
            <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2.5 whitespace-pre-line">
              {t("item2_desc")}
            </p>
          </div>

          {/* Item 3 */}
          <div className="flex flex-col">
            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
              {t("item3_title")}
            </h3>
            <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2.5 whitespace-pre-line">
              {t("item3_desc")}
            </p>
          </div>

          {/* Item 4 */}
          <div className="flex flex-col">
            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
              {t("item4_title")}
            </h3>
            <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2.5 whitespace-pre-line">
              {t("item4_desc")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
