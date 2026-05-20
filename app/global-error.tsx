"use client";

import React from "react";
import { NextIntlClientProvider } from "next-intl";

export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
        <NextIntlClientProvider locale="es" messages={{}}>
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-extrabold text-rose-500">Ocurrió un error inesperado</h2>
            <p className="text-sm text-slate-400">
              Disculpas por las molestias. Por favor, reintentá cargar la página.
            </p>
            <button
              onClick={() => reset()}
              className="rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-4 py-2 text-sm transition"
            >
              Reintentar
            </button>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
