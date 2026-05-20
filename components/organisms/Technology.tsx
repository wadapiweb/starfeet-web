"use client";
import React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "../atoms/Reveal";

// ─── Data ────────────────────────────────────────────────────────────────────

interface FeatureData {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    dotTop: string;
    dotLeft: string;
}

const leftFeatures: FeatureData[] = [
    {
        id: "anatomica",
        title: "ESTRUCTURA ANATÓMICA",
        subtitle: "con DOBLE CAPA DE NEOPRENE",
        description: "que contiene los pies sin compresiones excesivas",
        dotTop: "40.84%",
        dotLeft: "24.52%",
    },
    {
        id: "derivador",
        title: "DERIVADOR DE PESO CORPORAL",
        subtitle: "desarrollo exclusivo de Starfeet",
        description: "que ayuda a mejorar la descarga de peso sobre los pies, favoreciendo el movimiento natural de la pisada sin sobrecargas",
        dotTop: "59.16%",
        dotLeft: "50.72%",
    },
];

const rightFeatures: FeatureData[] = [
    {
        id: "tiras",
        title: "TIRAS ADAPTABLES",
        subtitle: "con velcro",
        description: "que ayudan a un calce seguro y personalizado a tu pie",
        dotTop: "13.79%",
        dotLeft: "58.92%",
    },
    {
        id: "correctores",
        title: "CORRECTORES DE DEDOS",
        subtitle: "de compuesto expandible de alta resistencia",
        description: "que favorecen la alineación de la estructura del pie, y la liberación de las tensiones acumuladas",
        dotTop: "51.89%",
        dotLeft: "70.52%",
    },
];

const fingerDots = [
    { id: "finger1", top: "62.36%", left: "68.12%" },
    { id: "finger2", top: "72.77%", left: "64.32%" },
    { id: "finger3", top: "79.17%", left: "56.92%" },
];

// ─── Mobile card ──────────────────────────────────────────────────────────────

const MobileFeatureCard = ({ feature, delay }: { feature: FeatureData; delay: number }) => (
    <Reveal delay={delay} direction="up">
        <div className="flex flex-col gap-1.5 pl-4 border-l-[3px] border-starfeet-lime">
            <h3 className="font-condensed font-black text-base md:text-lg text-starfeet-blue uppercase leading-tight">
                {feature.title}
                <br />
                <span className="font-sans font-semibold text-sm normal-case">{feature.subtitle}</span>
            </h3>
            <p className="font-sans text-sm text-starfeet-dark-100 leading-relaxed">
                {feature.description}
            </p>
        </div>
    </Reveal>
);

// ─── Animation variants ───────────────────────────────────────────────────────

const drawLineVariant = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (customDelay: number) => ({
        pathLength: 1,
        opacity: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transition: { duration: 0.8, delay: customDelay, ease: "easeInOut" as any }
    })
};

const popDot = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
        scale: 1,
        opacity: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transition: { type: "spring" as any, stiffness: 350, damping: 20, delay }
    })
};

// ─── Componente Principal ───────────────────────────────────────────────────────────

export const Technology = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollTrackerRef = React.useRef<HTMLDivElement>(null);
    const [lines, setLines] = React.useState<{ id: string; path: string; textDot?: {x: number, y: number}; delay: number }[]>([]);

    const { scrollYProgress } = useScroll({
        target: scrollTrackerRef,
        offset: ["start start", "end start"]
    });

    // Fade out texts & SVG overlays as scroll begins
    const fadeOutOpacity = useTransform(scrollYProgress, [0.01, 0.08], [1, 0]);
    // Slide up blue background layer
    const blueBgTop = useTransform(scrollYProgress, [0.08, 0.15], ["100%", "0%"]);
    // Translate text horizontally starting with 'RE' peeking out, and ending with final 'A' visible during exit overlap
    const textTranslateX = useTransform(scrollYProgress, [0.08, 0.95], ["75%", "-65%"]);

    // JS-based engine to calculate perfect pixel paths connecting DOM elements
    React.useEffect(() => {
        const updatePaths = () => {
            if (!containerRef.current) return;
            const container = containerRef.current.getBoundingClientRect();
            const newLines: { id: string; path: string; textDot?: {x: number, y: number}; delay: number }[] = [];

            const getCoord = (id: string, anchor: "left" | "right" | "center" = "center") => {
                const el = document.getElementById(id);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                let x = rect.left + rect.width / 2;
                if (anchor === "left") x = rect.left;
                if (anchor === "right") x = rect.right;
                return {
                    x: x - container.left,
                    y: rect.top + rect.height / 2 - container.top,
                };
            };

            const R = 25; // Radio de la curva en el vértice
            const dotRadius = 9; // Radio externo del dot para cortar la línea

            // 1. Líneas Izquierda (Codo redondeado, línea acortada)
            leftFeatures.forEach((f, idx) => {
                const textPos = getCoord(`static-text-${f.id}`, "right"); 
                const dotPos = getCoord(`static-dot-${f.id}`, "center");
                if (textPos && dotPos) {
                    const elbowX = textPos.x + (dotPos.x - textPos.x) * 0.4;
                    const dx = dotPos.x - elbowX;
                    const dy = dotPos.y - textPos.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const ratio = Math.min(R / dist, 0.45);
                    const curveEndX = elbowX + dx * ratio;
                    const curveEndY = textPos.y + dy * ratio;
                    
                    const stopX = dotPos.x - (dx/dist)*dotRadius;
                    const stopY = dotPos.y - (dy/dist)*dotRadius;

                    const startX = textPos.x + 10;
                    newLines.push({
                        id: `line-${f.id}`,
                        path: `M ${startX} ${textPos.y} L ${elbowX - R} ${textPos.y} Q ${elbowX} ${textPos.y}, ${curveEndX} ${curveEndY} L ${stopX} ${stopY}`,
                        textDot: { x: startX, y: textPos.y },
                        delay: 0.3 + idx * 0.1
                    });
                }
            });

            // 2. Líneas Derecha (Codo redondeado, línea acortada)
            rightFeatures.forEach((f, idx) => {
                const textPos = getCoord(`static-text-${f.id}`, "left");
                const dotPos = getCoord(`static-dot-${f.id}`, "center");
                if (textPos && dotPos) {
                    const elbowX = textPos.x - (textPos.x - dotPos.x) * 0.4;
                    const dx = dotPos.x - elbowX;
                    const dy = dotPos.y - textPos.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const ratio = Math.min(R / dist, 0.45);
                    const curveEndX = elbowX + dx * ratio;
                    const curveEndY = textPos.y + dy * ratio;
                    
                    const stopX = dotPos.x - (dx/dist)*dotRadius;
                    const stopY = dotPos.y - (dy/dist)*dotRadius;

                    const startX = textPos.x - 10;
                    newLines.push({
                        id: `line-${f.id}`,
                        path: `M ${startX} ${textPos.y} L ${elbowX + R} ${textPos.y} Q ${elbowX} ${textPos.y}, ${curveEndX} ${curveEndY} L ${stopX} ${stopY}`,
                        textDot: { x: startX, y: textPos.y },
                        delay: 0.3 + (leftFeatures.length + idx) * 0.1
                    });
                }
            });

            // 3. Curvas en cascada para los dedos (Segmentos rectos acortados entre bordes)
            const baseDot = getCoord(`static-dot-correctores`, "center");
            const f1 = getCoord(`static-dot-finger1`, "center");
            const f2 = getCoord(`static-dot-finger2`, "center");
            const f3 = getCoord(`static-dot-finger3`, "center");
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shorten = (p1: any, p2: any, r: number) => {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 2*r) return null;
                return {
                    x1: p1.x + (dx/dist)*r,
                    y1: p1.y + (dy/dist)*r,
                    x2: p2.x - (dx/dist)*r,
                    y2: p2.y - (dy/dist)*r,
                };
            };

            if (baseDot && f1 && f2 && f3) {
                const s1 = shorten(baseDot, f1, dotRadius);
                const s2 = shorten(f1, f2, dotRadius);
                const s3 = shorten(f2, f3, dotRadius);
                
                if (s1) newLines.push({ id: "link-1", path: `M ${s1.x1} ${s1.y1} L ${s1.x2} ${s1.y2}`, delay: 0.7 });
                if (s2) newLines.push({ id: "link-2", path: `M ${s2.x1} ${s2.y1} L ${s2.x2} ${s2.y2}`, delay: 0.8 });
                if (s3) newLines.push({ id: "link-3", path: `M ${s3.x1} ${s3.y1} L ${s3.x2} ${s3.y2}`, delay: 0.9 });
            }

            setLines(newLines);
        };

        // Esperar a que el layout y las imágenes se estabilicen por completo tras las animaciones de Reveal
        const timer = setTimeout(updatePaths, 1000);
        window.addEventListener("resize", updatePaths);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updatePaths);
        };
    }, []);

    return (
        <section
            ref={scrollTrackerRef}
            aria-labelledby="technology-heading"
            className="relative bg-white border-t border-gray-100 select-none"
        >
            {/* ── MOBILE VIEW ── */}
            <div className="lg:hidden py-24 bg-white space-y-12 max-w-md mx-auto px-6">
                {/* Header */}
                <Reveal>
                    <div className="text-center mb-16">
                        <div className="mb-5 flex justify-center">
                            <span 
                                className="inline-flex items-center justify-center font-sans font-bold text-[11px] text-starfeet-lime uppercase tracking-[0.35em] pt-[7px] pb-[5px] rounded-full border-[2.5px] border-starfeet-blue bg-starfeet-blue/75 backdrop-blur-md shadow-md select-none leading-none"
                                style={{ paddingLeft: 'calc(1rem + 0.35em)', paddingRight: '1rem' }}
                            >
                                Tecnología
                            </span>
                        </div>
                        <h2 className="font-condensed font-black text-5xl md:text-7xl text-starfeet-blue uppercase tracking-tighter leading-none">
                            ¿QUÉ LO HACE{" "}
                            <span className="text-starfeet-lime">DIFERENTE?</span>
                        </h2>
                    </div>
                </Reveal>
                <Reveal>
                    <div className="relative w-full aspect-[682/469]">
                        <Image src="/images/tecnologia01_a.webp" alt="Tecnología Starfeet" fill className="object-cover" />
                    </div>
                </Reveal>
                <div className="grid grid-cols-1 gap-8">
                    {[...leftFeatures, ...rightFeatures].map((f, i) => (
                        <MobileFeatureCard key={f.id} feature={f} delay={i * 0.1} />
                    ))}
                </div>
            </div>

            {/* ── DESKTOP SCROLLYTELLING SEQUENCE ── */}
            <div className="hidden lg:block relative w-full h-[400vh]">
                {/* STICKY VIEWPORT CONTAINER */}
                <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-center">
                    
                    {/* BASE WHITE LAYER */}
                    <div className="absolute inset-0 bg-white pointer-events-none -z-10" />

                    {/* RISING BLUE LAYER (REEDUCA SECTION BACKGROUND) */}
                    <motion.div 
                        className="absolute inset-0 bg-starfeet-blue overflow-hidden z-10 pointer-events-none"
                        style={{ top: blueBgTop }}
                    >
                        {/* GIANT SCROLLING TEXT BEHIND SHOE */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div style={{ x: textTranslateX }} className="flex whitespace-nowrap">
                                <span className="font-condensed font-black text-[260px] xl:text-[380px] text-white/10 leading-none tracking-tighter select-none">
                                    REEDUCÁ TU PISADA
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* TECHNOLOGY MAIN CONTENT WRAPPER */}
                    <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col justify-center h-full py-12">
                        
                        {/* FADING HEADER & DESCRIPTIONS LAYER */}
                        <motion.div style={{ opacity: fadeOutOpacity }} className="absolute inset-x-6 top-12 left-0 right-0 z-30 pointer-events-none">
                            {/* Header */}
                            <div className="text-center">
                                <div className="mb-5 flex justify-center">
                                    <span 
                                        className="inline-flex items-center justify-center font-sans font-bold text-[11px] text-starfeet-lime uppercase tracking-[0.35em] pt-[7px] pb-[5px] rounded-full border-[2.5px] border-starfeet-blue bg-starfeet-blue/75 backdrop-blur-md shadow-md select-none leading-none"
                                        style={{ paddingLeft: 'calc(1rem + 0.35em)', paddingRight: '1rem' }}
                                    >
                                        Tecnología
                                    </span>
                                </div>
                                <h2 className="font-condensed font-black text-6xl xl:text-8xl text-starfeet-blue uppercase tracking-tighter leading-none">
                                    ¿QUÉ LO HACE{" "}
                                    <span className="text-starfeet-lime">DIFERENTE?</span>
                                </h2>
                            </div>
                        </motion.div>

                        {/* DESKTOP GRID */}
                        <div 
                            ref={containerRef}
                            className="grid grid-cols-[1fr_500px_1fr] xl:grid-cols-[1fr_620px_1fr] gap-8 items-stretch relative min-h-[500px] w-full mt-24"
                        >
                            {/* FADING SVG CANVAS OVERLAY */}
                            <motion.svg style={{ opacity: fadeOutOpacity, overflow: 'visible' }} className="absolute inset-0 w-full h-full pointer-events-none z-30">
                                {lines.map((line) => (
                                    <React.Fragment key={line.id}>
                                        <motion.path
                                            d={line.path}
                                            fill="none"
                                            stroke="#D4FD23"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            custom={line.delay}
                                            variants={drawLineVariant}
                                            initial="hidden"
                                            animate="visible"
                                        />
                                        {line.textDot && (
                                            <motion.circle
                                                cx={line.textDot.x}
                                                cy={line.textDot.y}
                                                r="3.5"
                                                fill="#D4FD23"
                                                custom={line.delay}
                                                variants={popDot}
                                                initial="hidden"
                                                animate="visible"
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </motion.svg>

                            {/* 1. Left Texts Column (Fading) */}
                            <motion.div style={{ opacity: fadeOutOpacity }} className="flex flex-col justify-center gap-24 py-12 pr-4 xl:pr-8 z-20 pointer-events-auto">
                                {leftFeatures.map((f, i) => (
                                    <div key={`static-text-${f.id}`} id={`static-text-${f.id}`} className="w-full max-w-[320px] ml-auto text-left">
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, amount: 0.3 }}
                                            transition={{ duration: 0.6, delay: 0.2 + i * 0.2 }}
                                        >
                                            <h3 className="font-condensed font-black text-xl xl:text-2xl text-starfeet-blue uppercase leading-tight mb-1">
                                                {f.title}
                                            </h3>
                                            <p className="font-sans font-semibold text-[13.5px] xl:text-[15px] text-starfeet-blue mb-1.5">
                                                {f.subtitle}
                                            </p>
                                            <p className="font-sans text-[12.5px] xl:text-[14px] text-starfeet-dark-100 leading-relaxed pr-6">
                                                {f.description}
                                            </p>
                                        </motion.div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* 2. Center Image & Dots Column (STATIC PERSISTENT PRODUCT) */}
                            <div className="relative w-full self-center z-20">
                                <Reveal direction="none" duration={0.8} className="relative w-full aspect-[682/469]">
                                    <div className="w-full h-full relative pointer-events-none">
                                        <Image
                                            src="/images/tecnologia01_a.webp"
                                            alt="Tecnología del producto Starfeet"
                                            fill
                                            className="object-cover drop-shadow-md"
                                            priority
                                        />
                                    </div>

                                    {/* FADING DOTS */}
                                    <motion.div style={{ opacity: fadeOutOpacity }} className="absolute inset-0 pointer-events-none z-40">
                                        {/* Dots sobre la imagen usando Wrappers Estáticos */}
                                        {[...leftFeatures, ...rightFeatures].map((f, i) => (
                                            <div
                                                key={`static-dot-${f.id}`}
                                                id={`static-dot-${f.id}`}
                                                className="absolute w-[18px] h-[18px] pointer-events-none"
                                                style={{ top: f.dotTop, left: f.dotLeft, transform: "translate(-50%, -50%)" }}
                                            >
                                                <motion.div
                                                    initial="hidden"
                                                    whileInView="visible"
                                                    viewport={{ once: true, amount: 0.3 }}
                                                    custom={0.4 + i * 0.1}
                                                    variants={popDot}
                                                    className="w-full h-full rounded-full border-[2.5px] border-starfeet-lime flex items-center justify-center bg-transparent shadow-sm"
                                                >
                                                    <div className="w-[6px] h-[6px] rounded-full bg-white"></div>
                                                </motion.div>
                                            </div>
                                        ))}
                                        
                                        {/* Finger Dots */}
                                        {fingerDots.map((dot, i) => (
                                            <div
                                                key={`static-dot-${dot.id}`}
                                                id={`static-dot-${dot.id}`}
                                                className="absolute w-[18px] h-[18px] pointer-events-none"
                                                style={{ top: dot.top, left: dot.left, transform: "translate(-50%, -50%)" }}
                                            >
                                                <motion.div
                                                    initial="hidden"
                                                    whileInView="visible"
                                                    viewport={{ once: true, amount: 0.3 }}
                                                    custom={0.8 + i * 0.1}
                                                    variants={popDot}
                                                    className="w-full h-full rounded-full border-[2.5px] border-starfeet-lime flex items-center justify-center bg-transparent shadow-sm"
                                                >
                                                    <div className="w-[6px] h-[6px] rounded-full bg-white"></div>
                                                </motion.div>
                                            </div>
                                        ))}
                                    </motion.div>
                                </Reveal>
                            </div>

                            {/* 3. Right Texts Column (Fading) */}
                            <motion.div style={{ opacity: fadeOutOpacity }} className="flex flex-col justify-center gap-24 py-12 pl-4 xl:pl-8 z-20 pointer-events-auto">
                                {rightFeatures.map((f, i) => (
                                    <div key={`static-text-${f.id}`} id={`static-text-${f.id}`} className="w-full max-w-[320px] text-left">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, amount: 0.3 }}
                                            transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }}
                                        >
                                            <h3 className="font-condensed font-black text-xl xl:text-2xl text-starfeet-blue uppercase leading-tight mb-1">
                                                {f.title}
                                            </h3>
                                            <p className="font-sans font-semibold text-[13.5px] xl:text-[15px] text-starfeet-blue mb-1.5">
                                                {f.subtitle}
                                            </p>
                                            <p className="font-sans text-[12.5px] xl:text-[14px] text-starfeet-dark-100 leading-relaxed pr-6">
                                                {f.description}
                                            </p>
                                        </motion.div>
                                    </div>
                                ))}
                            </motion.div>

                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};
