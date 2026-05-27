"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/atoms/BrandLogo";
import { useTranslations } from "@/lib/i18n";

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const Footer = () => {
  const t = useTranslations("Footer");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  const handleHeartClick = () => {
    // Spawn 8 floating hearts with randomized trajectories and scales
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 100, // horizontal spread
      y: -(Math.random() * 120 + 80),  // float up height
      scale: Math.random() * 0.6 + 0.8,
      rotation: (Math.random() - 0.5) * 60, // rotate left/right
    }));

    setHearts((prev) => [...prev, ...newHearts]);
  };

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/Starfeetok",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/starfeetok",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@starfeetok",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.73 4.05 1.02.9 2.37 1.4 3.77 1.46v3.9c-1.3-.16-2.58-.68-3.65-1.46-.32-.23-.61-.5-.88-.79-.02 1.94-.01 3.89-.02 5.83-.12 3.8-3.04 7.02-6.84 7.03-3.65-.03-6.66-3-6.67-6.65.02-3.66 3.03-6.66 6.69-6.65.06 0 .12 0 .18.01v3.97c-1.48-.05-2.78.96-2.92 2.43-.17 1.73 1.11 3.23 2.84 3.4 1.73.17 3.23-1.11 3.4-2.84.07-.69-.11-1.39-.51-1.93-.01-3.52-.01-7.05-.02-10.57h.03z"/>
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/channel/UCzVGz3UCEuwCxQGAiY2-31g",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative bg-starfeet-blue text-white overflow-hidden border-t border-white/10 z-30">
      {/* Visual Design Background Accent */}
      <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 pointer-events-none select-none opacity-5">
        <span className="font-condensed font-black text-[250px] leading-none text-white">SF</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-white/10">
          
          {/* Brand and Description Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link href="/" className="inline-block w-fit group">
              <BrandLogo className="h-10 w-auto text-white group-hover:text-starfeet-lime transition-colors duration-300" />
            </Link>
            <p className="font-sans text-sm text-gray-300 leading-relaxed max-w-sm">
              {t("description")}
            </p>
            {/* Social Icons with Micro-animations */}
            <div className="flex gap-4 mt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  whileHover={{ scale: 1.15, color: "#D4FD23", y: -2 }}
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:border-starfeet-lime hover:shadow-[0_0_15px_rgba(212,253,35,0.15)] transition-colors duration-300 cursor-pointer"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Spacer for structure */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Links Column 1: Shop */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h4 className="font-condensed font-black text-lg tracking-wider text-starfeet-lime uppercase">
              {t("shopTitle")}
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: t("shopDevices"), href: "/tienda" },
                { name: t("shopAccessories"), href: "/tienda" },
                { name: t("shopFaq"), href: "/help" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-gray-300 hover:text-starfeet-lime transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Professionals */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h4 className="font-condensed font-black text-lg tracking-wider text-starfeet-lime uppercase">
              {t("professionalsTitle")}
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: t("professionalsPortal"), href: "/login" },
                { name: t("professionalsRegister"), href: "/registro" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-gray-300 hover:text-starfeet-lime transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Support & Policies */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h4 className="font-condensed font-black text-lg tracking-wider text-starfeet-lime uppercase">
              {t("supportTitle")}
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: t("supportContact"), href: "/contacto" },
                { name: t("supportShipping"), href: "/help" },
                { name: t("supportTerms"), href: "/help" },
                { name: t("supportPrivacy"), href: "/help" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-gray-300 hover:text-starfeet-lime transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Signature with interactive heart click */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
          <p className="font-sans text-xs text-gray-400 text-center sm:text-left">
            {t("copyright")}
          </p>
          
          {/* Custom Interactive Signature with Heart Click Floating Effect */}
          <div className="font-sans text-xs text-gray-400 flex items-center gap-1.5 select-none">
            <span>{t("by")}</span>
            <div className="relative inline-block">
              <motion.button
                onClick={handleHeartClick}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.25 }}
                className="focus:outline-none cursor-pointer text-base leading-none p-0.5"
                title="Sumak Heart Effect!"
                aria-label="Make hearts float"
              >
                ❤️
              </motion.button>

              <AnimatePresence>
                {hearts.map((h) => (
                  <motion.span
                    key={h.id}
                    initial={{ opacity: 1, scale: 0.1, x: 0, y: 0, rotate: 0 }}
                    animate={{
                      opacity: 0,
                      scale: h.scale,
                      x: h.x,
                      y: h.y,
                      rotate: h.rotation,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    onAnimationComplete={() => {
                      setHearts((prev) => prev.filter((item) => item.id !== h.id));
                    }}
                    className="absolute pointer-events-none text-sm z-50"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    ❤️
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <Link
              href="https://estudiosumak.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-300 hover:text-starfeet-lime hover:underline transition-colors cursor-pointer"
            >
              sumak
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
