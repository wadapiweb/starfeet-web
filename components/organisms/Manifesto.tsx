"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Reveal } from "../atoms/Reveal";

// Componente individual para evitar romper rules-of-hooks mapeando dentro de loops
const RevealCharacter = ({ char, progress, start, end }: { char: string, progress: MotionValue<number>, start: number, end: number }) => {
    const color = useTransform(progress, [start, end], ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 1)"]);
    return (
        <motion.span style={{ color, display: "inline-block" }}>
            {char === " " ? "\u00A0" : char}
        </motion.span>
    );
};

const ScrollRevealLine = ({ text, progress, range }: { text: string, progress: MotionValue<number>, range: [number, number] }) => {
    const characters = text.split("");
    const amount = range[1] - range[0];
    const step = amount / characters.length;

    return (
        <span className="whitespace-nowrap">
            {characters.map((char, i) => {
                const start = range[0] + (i * step);
                const end = start + step;
                return (
                    <RevealCharacter 
                        key={i} 
                        char={char} 
                        progress={progress} 
                        start={start} 
                        end={end} 
                    />
                );
            })}
        </span>
    );
};

export const Manifesto = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 0.6", "end 0.5"]
    });

    return (
        <section ref={containerRef} className="bg-starfeet-blue w-full min-h-screen flex flex-col justify-center overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col gap-2 w-fit mx-auto">
                    {[
                        { text: "PRIMER COMPLEMENTO", range: [0, 0.25] },
                        { text: "PARA REEDUCAR LA PISADA", range: [0.25, 0.5] },
                        { text: "INNOVACIÓN A NIVEL", range: [0.5, 0.75] },
                        { text: "MUNDIAL", range: [0.75, 1] }
                    ].map((item, index) => (
                        <Reveal
                            key={index}
                            delay={index * 0.1}
                            distance={30}
                            duration={0.5}
                        >
                            <h2 className="font-condensed font-black text-3xl md:text-6xl lg:text-7xl xl:text-8xl leading-none uppercase tracking-normal text-white/20">
                                <ScrollRevealLine 
                                    text={item.text} 
                                    progress={scrollYProgress} 
                                    range={item.range as [number, number]} 
                                />
                            </h2>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};
