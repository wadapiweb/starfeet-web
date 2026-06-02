/**
 * lib/domains.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Fuente única de verdad para todas las URLs del ecosistema Starfeet.
 *
 * Para cambiar el dominio (e.g. starfeet.ar → starfeetoficial.com),
 * sólo editar el archivo .env — sin tocar código fuente.
 *
 * Variables de entorno requeridas (ver .env.example):
 *   NEXT_PUBLIC_BASE_DOMAIN   → dominio wildcard para cookies (e.g. .starfeet.ar)
 *   NEXT_PUBLIC_ROOT_DOMAIN   → dominio raíz limpio (e.g. starfeet.ar)
 *   NEXT_PUBLIC_URL_TIENDA    → https://tienda.starfeet.ar
 *   NEXT_PUBLIC_URL_KINE      → https://kine.starfeet.ar
 *   NEXT_PUBLIC_URL_DASHBOARD → https://dashboard.starfeet.ar
 *   NEXT_PUBLIC_URL_LANDING   → https://dev.starfeet.ar
 *   NEXT_PUBLIC_URL_MARKETING → https://dev.starfeet.ar/marketing-admin
 *   SUPPORT_EMAIL             → soporte@starfeet.ar
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const DOMAINS = {
  /** Wildcard para cookies (siempre con punto inicial: ".starfeet.ar") */
  base: process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar",

  /** Dominio raíz sin punto (para fallback de host y validaciones) */
  root: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "starfeet.ar",

  /** Tienda / ecommerce */
  tienda: process.env.NEXT_PUBLIC_URL_TIENDA || "https://tienda.starfeet.ar",

  /** Panel de kinesiología */
  kine: process.env.NEXT_PUBLIC_URL_KINE || "https://kine.starfeet.ar",

  /** Dashboard / admin */
  dashboard: process.env.NEXT_PUBLIC_URL_DASHBOARD || "https://dashboard.starfeet.ar",

  /** Landing page (Hostinger Cloud) */
  landing: process.env.NEXT_PUBLIC_URL_LANDING || "https://dev.starfeet.ar",

  /** Panel de marketing (ruta en la landing) */
  marketing: process.env.NEXT_PUBLIC_URL_MARKETING || "https://dev.starfeet.ar/marketing-admin",

  /** Email de soporte visible en UI */
  supportEmail: process.env.SUPPORT_EMAIL || "soporte@starfeet.ar",
} as const;

export type DomainKey = keyof typeof DOMAINS;
