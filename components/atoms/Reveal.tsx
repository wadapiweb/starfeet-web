"use client";
import { motion, HTMLMotionProps, Variants } from "framer-motion";
import React from "react";

/**
 * Reveal Component
 * Un efecto global de "fade & move" reutilizable para cualquier elemento.
 * Por defecto aparece desde abajo con un suave fade.
 */

interface RevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  distance?: number;
  once?: boolean;
}

export const Reveal = ({ 
  children, 
  delay = 0, 
  direction = "up", 
  duration = 0.6,
  distance = 40,
  once = true,
  className,
  ...props 
}: RevealProps) => {
  
  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? distance : direction === "right" ? -distance : 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Easeout suave y rápido
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: once, amount: 0.2 }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
