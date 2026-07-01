"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";

type UserActionsMenuProps = {
  detailHref: string;
  canUnlock: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onSetPassword: () => void;
  onUnlock: () => void;
  onRevokeSessions: () => void;
};

export function UserActionsMenu({
  detailHref,
  canUnlock,
  onEdit,
  onResetPassword,
  onSetPassword,
  onUnlock,
  onRevokeSessions,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.right - 224 });
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
        aria-label="Opciones de usuario"
        className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
      >
        <DotsVerticalIcon className="h-4 w-4" />
      </button>

      {open && menuPos ? (
        <div
          className="fixed z-[160] w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-2xl"
          style={{ top: menuPos.top, left: Math.max(8, menuPos.left) }}
          role="menu"
        >
          <Link
            href={detailHref}
            onClick={() => setOpen(false)}
            className="cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            role="menuitem"
          >
            <IconEye className="h-4 w-4" />
            Ver detalle
          </Link>
          <MenuButton onClick={() => run(onEdit)} icon={<IconPencil className="h-4 w-4" />} label="Editar datos" />
          <MenuButton onClick={() => run(onResetPassword)} icon={<IconMail className="h-4 w-4" />} label="Enviar reset" />
          <MenuButton onClick={() => run(onSetPassword)} icon={<IconKey className="h-4 w-4" />} label="Cambiar password" />
          {canUnlock ? (
            <MenuButton onClick={() => run(onUnlock)} icon={<IconUnlock className="h-4 w-4" />} label="Desbloquear" />
          ) : null}
          <MenuButton
            onClick={() => run(onRevokeSessions)}
            icon={<IconShield className="h-4 w-4" />}
            label="Revocar sesiones"
            danger
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
  danger = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${
        danger ? "font-semibold text-red-700 hover:bg-red-50" : "text-gray-700"
      }`}
      role="menuitem"
    >
      {icon}
      {label}
    </button>
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

function IconMail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M4 4h16v16H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="7.5" cy="14.5" r="4.5" />
      <path d="m11 11 9-9" />
      <path d="m16 6 2 2" />
      <path d="m18 4 2 2" />
    </svg>
  );
}

function IconUnlock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12h6" />
    </svg>
  );
}
