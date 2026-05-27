"use client";
import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export const CuandoPisasBien = () => {
  const t = useTranslations("CuandoPisasBien");
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the scroll progress of this container relative to the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax effect: translates the background image vertically to create scroll depth
  const yBg = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  // Horizontal marquee: glides the text from right to left as the user scrolls
  const xText = useTransform(scrollYProgress, [0, 1], ["75%", "-75%"]);

  return (
    <section
      ref={containerRef}
      aria-label="Sección de transición cuando pisas bien"
      className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-black"
    >
      {/* Parallax Background Image */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-x-0 -top-[15%] h-[130%] w-full pointer-events-none"
      >
        <Image
          src="/images/cuando_pisas_bien1.webp"
          alt="Cuando pisas bien background"
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-[0.70] contrast-[1.05]"
        />
      </motion.div>

      {/* Subtle overlay gradient to blend with surrounding sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none z-10" />

      {/* Marquee Text Overlay */}
      <div className="relative z-20 w-full overflow-hidden flex items-center justify-center pointer-events-none">
        <motion.div style={{ x: xText }} className="flex whitespace-nowrap">
          <span className="font-condensed font-black text-[260px] xl:text-[380px] text-white/20 leading-none tracking-tighter select-none uppercase">
            {t("marquee")}
          </span>
        </motion.div>
      </div>
    </section>
  );
};
