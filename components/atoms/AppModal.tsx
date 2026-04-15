"use client";

import { useEffect } from "react";
import { ReactNode } from "react";

type AppModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AppModal({ open, title, onClose, headerActions, children }: AppModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/45"
      />

      <article className="relative w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h3 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
            >
              Cerrar
            </button>
          </div>
        </header>

        <div className="max-h-[78vh] overflow-auto p-5">{children}</div>
      </article>
    </div>
  );
}
