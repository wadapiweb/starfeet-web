"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export const ProductStages = () => {
    const t = useTranslations("Stages");
    const [hoveredStage, setHoveredStage] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hoveredStage !== null) {
            const stageVideo = stages[hoveredStage].video;
            // Only update src if it changed
            if (!video.src.endsWith(stageVideo)) {
                video.src = stageVideo;
                video.load();
            }
            video.play().catch((err) => {
                console.warn("Video playback failed:", err);
            });
        } else {
            video.pause();
        }
    }, [hoveredStage]);

    return (
        <section 
            aria-label="Etapas de reeducación de pisada"
            className="relative bg-[#f4f4f5] min-h-screen flex items-center py-24 md:py-32 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 xl:gap-32 items-center w-full">
                {/* LADO IZQUIERDO: VISUALS */}
                <div className="relative flex justify-center lg:justify-start items-center min-h-[350px] sm:min-h-[450px] md:min-h-[520px] w-full">
                    {/* Centered Content Wrapper to keep it aligned with the content grid */}
                    <div className="relative w-full max-w-[480px] h-full min-h-[350px] sm:min-h-[450px] md:min-h-[520px] flex items-center justify-center">
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

                        {/* Initial Title: Fades out when any stage is hovered - Shifted to the right */}
                        <motion.h2
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ 
                                opacity: hoveredStage === null ? 1 : 0,
                                scale: hoveredStage === null ? 1 : 0.95,
                                y: hoveredStage === null ? 0 : -10
                            }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 font-condensed font-black text-[70px] md:text-[110px] text-starfeet-blue leading-[0.9] tracking-normal uppercase text-left w-max z-10 select-none pointer-events-none whitespace-pre-line"
                        >
                            {t("transform_title")}
                        </motion.h2>

                        {/* Circular Video Container: Animates in on hover */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                                opacity: hoveredStage !== null ? 1 : 0,
                                scale: hoveredStage !== null ? 1 : 0.8,
                                y: hoveredStage !== null ? 0 : 15,
                            }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] rounded-full border-[10px] sm:border-[16px] border-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-20 bg-white"
                        >
                            <video
                                ref={videoRef}
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </motion.div>
                    </div>
                </div>

                {/* LADO DERECHO: ETAPAS */}
                <div className="flex flex-col gap-10 md:gap-14 z-10 pl-0 lg:pl-8">
                    {stages.map((stage, idx) => (
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
                            aria-expanded={hoveredStage === idx}
                            className="flex flex-col cursor-pointer transition-opacity duration-300 outline-none focus-visible:ring-2 focus-visible:ring-starfeet-blue focus-visible:ring-offset-4 rounded-lg p-2 -m-2 w-full max-w-md lg:ml-auto"
                            style={{
                                opacity: hoveredStage === null || hoveredStage === idx ? 1 : 0.4
                            }}
                        >
                            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-starfeet-blue uppercase leading-none tracking-tight">
                                {stage.title}
                            </h3>
                            <span className="font-condensed font-bold text-xl sm:text-2xl text-[#c5eb1b] lowercase mt-1">
                                {stage.subtitle}
                            </span>
                            <p className="font-sans text-sm sm:text-base font-normal text-starfeet-blue/80 leading-relaxed mt-2.5 max-w-md whitespace-pre-line">
                                {stage.description}
                                <AnimatePresence>
                                    {hoveredStage === idx && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="inline-block"
                                        >
                                            <Link 
                                                href="/tecnologia" 
                                                className="inline text-sm font-bold text-starfeet-blue hover:underline ml-2"
                                                style={{ cursor: "pointer" }}
                                            >
                                                {t("ver_mas")}
                                            </Link>
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
