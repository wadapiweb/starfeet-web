"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

import { useTranslations } from "@/lib/i18n";

const StageCircleVideo = ({ src, isHovered }: { src: string; isHovered: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.play().catch((err) => {
        console.warn("Video playback failed:", err);
      });
    } else {
      video.pause();
      // Reset video to first frame to keep it static when not hovered
      try {
        video.currentTime = 0;
      } catch {
        // Ignore if metadata isn't loaded yet
      }
    }
  }, [isHovered]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};

export const ProductStages = () => {
  const t = useTranslations("Stages");
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const stages = [
    {
      id: 1,
      title: t("etapa1_title"),
      subtitle: t("etapa1_subtitle"),
      description: t("etapa1_description"),
      video: "/images/video_etapa1.webm",
    },
    {
      id: 2,
      title: t("etapa2_title"),
      subtitle: t("etapa2_subtitle"),
      description: t("etapa2_description"),
      video: "/images/video_etapa2.webm",
    },
    {
      id: 3,
      title: t("etapa3_title"),
      subtitle: t("etapa3_subtitle"),
      description: t("etapa3_description"),
      video: "/images/video_etapa3.webm",
    },
  ];

  return (
    <section
      aria-label="Etapas de reeducación de pisada"
      className="relative bg-[#f4f4f5] min-h-screen flex items-center py-24 md:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 xl:gap-16 items-center w-full">
        {/* LADO IZQUIERDO: VISUALS (Título estático y Logo de fondo) */}
        <div className="relative flex justify-center lg:justify-start items-center min-h-[150px] sm:min-h-[250px] lg:min-h-[350px] w-full">
          <div className="relative w-full max-w-[480px] h-full min-h-[150px] sm:min-h-[250px] lg:min-h-[350px] flex items-center justify-center lg:justify-start">
            {/* Outline "SF" Background Image - Shifted to the left */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center scale-[1.3] -translate-x-[5%] sm:scale-[1.6] sm:-translate-x-[8%] md:scale-[1.8] md:-translate-x-[12%] lg:scale-[2.1] lg:-translate-x-[18%] select-none opacity-80 transition-transform duration-300">
              <Image
                src="/images/logo_SF.svg"
                alt="Fondo SF"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Section Title (Fija) */}
            <h2 className="font-condensed font-black text-[70px] md:text-[110px] text-starfeet-blue leading-[0.9] tracking-normal uppercase text-center lg:text-left w-max z-10 select-none pointer-events-none whitespace-pre-line">
              {t("transform_title")}
            </h2>
          </div>
        </div>

        {/* LADO DERECHO: ETAPAS */}
        <div className="flex flex-col gap-8 md:gap-10 z-10 pl-0 lg:pl-4 w-full">
          {stages.map((stage, idx) => {
            const isHovered = hoveredStage === idx;
            return (
              <div
                key={stage.id}
                onMouseEnter={() => setHoveredStage(idx)}
                onMouseLeave={() => setHoveredStage(null)}
                onFocus={() => setHoveredStage(idx)}
                onBlur={() => setHoveredStage(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setHoveredStage(hoveredStage === idx ? null : idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isHovered}
                className="flex flex-row items-center justify-between gap-4 sm:gap-6 cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-starfeet-blue focus-visible:ring-offset-4 rounded-2xl p-5 -m-5 w-full max-w-md lg:ml-auto bg-white/30 hover:bg-white/90 hover:shadow-[0_15px_40px_-10px_rgba(9,34,75,0.08)] border border-transparent hover:border-white/60"
                style={{
                  opacity: hoveredStage === null || isHovered ? 1 : 0.5,
                }}
              >
                {/* TEXT CONTENT */}
                <div className="flex-1 text-left">
                  <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
                    {stage.title}
                  </h3>
                  <div className="font-condensed font-bold text-xl sm:text-2xl text-[#c5eb1b] lowercase mt-1">
                    {stage.subtitle}
                  </div>
                  <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2 max-w-md whitespace-pre-line">
                    {stage.description}
                  </p>
                </div>

                {/* ANIMATED CIRCLE ON THE RIGHT */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex-shrink-0 bg-white">
                  <StageCircleVideo src={stage.video} isHovered={isHovered} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
