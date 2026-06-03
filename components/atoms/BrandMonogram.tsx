import React from "react";

/**
 * BrandMonogram — Monograma "SF" extraído del mismo SVG del logotipo.
 * Usa currentColor igual que BrandLogo, controlable con className text-{color}.
 *
 * Uso: <BrandMonogram className="h-10 w-auto text-white" />
 */
export const BrandMonogram = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      // ViewBox calculado: S + F casi tocándose (gap ≈ 0)
      viewBox="-5 -3 403 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="matrix(1,0,0,1,0,-157.456233)" fill="currentColor">
        <g transform="matrix(3.553415,0,0,2.030256,0,157.456233)">
          <g transform="matrix(1.172581,0,0,2.052287,-30.4782,-77.554881)">

            {/* ── S ── transform original del logo */}
            <g transform="matrix(1,0,0,1,42.8001,51.0075)">
              <path d="M0,7.808C-7.288,7.808 -10.931,5.572 -10.931,1.102C-10.931,0.199 -10.786,-0.781 -10.495,-1.838L-10.196,-2.986C-8.482,-9.416 -3.261,-12.631 5.466,-12.631L34.631,-12.631L32.542,-4.823L3.376,-4.823C1.386,-4.823 0.23,-4.211 -0.092,-2.986L-0.39,-1.838C-0.436,-1.654 -0.459,-1.493 -0.459,-1.355C-0.459,-0.452 0.39,-0.001 2.09,-0.001L18.165,-0.001C25.453,-0.001 29.097,2.243 29.097,6.728C29.097,7.616 28.959,8.588 28.683,9.645L28.362,10.793C26.647,17.223 21.427,20.439 12.7,20.439L-16.443,20.439L-14.376,12.631L14.79,12.631C16.78,12.631 17.936,12.018 18.257,10.793L18.579,9.645C18.625,9.477 18.648,9.316 18.648,9.163C18.648,8.259 17.79,7.808 16.076,7.808L0,7.808Z" />
            </g>

            {/* ── F ── casi tocando la S (Tx: 92.16 → 89.0, gap ≈ 0) */}
            <g transform="matrix(1,0,0,1,85.0,51.0075)">
              <path d="M0,7.808L-3.376,20.439L-13.481,20.439L-7.831,-0.689C-5.703,-8.65 0.107,-12.631 9.599,-12.631L33.024,-12.631L30.957,-4.823L7.509,-4.823C4.754,-4.823 3.008,-3.445 2.273,-0.689L2.09,-0.001L29.648,-0.001L27.558,7.808L0,7.808Z" />
            </g>

          </g>
        </g>
      </g>
    </svg>
  );
};
