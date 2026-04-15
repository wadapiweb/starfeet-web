"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type EntityActionsMenuProps = {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  viewAsUserHref?: string;
};

export function EntityActionsMenu({ onView, onEdit, onDelete, viewAsUserHref }: EntityActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Opciones"
        className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
      >
        <DotsVerticalIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => run(onView)}
            className="cursor-pointer block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Ver
          </button>

          {viewAsUserHref ? (
            <Link
              href={viewAsUserHref}
              target="_blank"
              onClick={() => setOpen(false)}
              className="cursor-pointer block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Ver como usuario
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => run(onEdit)}
            className="cursor-pointer block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => run(onDelete)}
            className="cursor-pointer block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
