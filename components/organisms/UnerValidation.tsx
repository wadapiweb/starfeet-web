"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export const UnerValidation = () => {
  const t = useTranslations("UnerValidation");

  return (
    <section 
      aria-label="Validación científica de la UNER"
      className="relative bg-[#09224b] text-white min-h-screen flex items-center py-20 lg:py-28 overflow-hidden border-t border-[#0d2e61]"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch w-full">
        {/* LADO IZQUIERDO: TEXTO CON ANIMACIÓN DE ENTRADA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col gap-6 md:gap-8 justify-center z-10"
        >
          <h2 className="font-condensed font-black text-5xl md:text-[80px] leading-[0.9] tracking-tighter uppercase whitespace-pre-line text-white">
            {t("title")}
          </h2>
          <p className="font-sans text-base md:text-lg leading-relaxed text-white/80 whitespace-pre-line max-w-2xl">
            {t("description")}
          </p>
        </motion.div>

        {/* LADO DERECHO: IMAGEN CON ESTILOS FIJADOS */}
        <div className="lg:col-span-5 relative w-full h-[360px] lg:absolute lg:right-[10%] lg:top-[-200px] lg:bottom-0 lg:w-[50%] lg:h-auto lg:scale-[0.85] lg:origin-top z-0">
          <Image
            src="/images/comprobacion_uner-3.webp"
            alt="Comprobación científica de pisada UNER"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain object-top"
            priority
          />
        </div>
      </div>
    </section>
  );
};
