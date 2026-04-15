"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type EntityActionsMenuProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewAsUserHref?: string;
};

export function EntityActionsMenu({ onView, onEdit, onDelete, viewAsUserHref }: EntityActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        left: rect.right - 176,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

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
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Opciones"
        className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
      >
        <DotsVerticalIcon className="h-4 w-4" />
      </button>

      {open && menuPos ? (
        <div
          className="fixed z-[160] w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-2xl"
          style={{ top: menuPos.top, left: Math.max(8, menuPos.left) }}
        >
          {onView ? (
            <button
              type="button"
              onClick={() => run(onView)}
              className="cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <IconEye className="h-4 w-4" />
              Ver
            </button>
          ) : null}

          {viewAsUserHref ? (
            <Link
              href={viewAsUserHref}
              target="_blank"
              onClick={() => setOpen(false)}
              className="cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <IconExternalLink className="h-4 w-4" />
              Ver como usuario
            </Link>
          ) : null}

          {onEdit ? (
            <button
              type="button"
              onClick={() => run(onEdit)}
              className="cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <IconPencil className="h-4 w-4" />
              Editar
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => run(onDelete)}
              className="cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <IconTrash className="h-4 w-4" />
              Eliminar
            </button>
          ) : null}
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

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4 12.5-14.5Z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M14 3h7v7" />
      <path d="m10 14 11-11" />
      <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
    </svg>
  );
}
