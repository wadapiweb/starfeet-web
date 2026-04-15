"use client";

import { AppModal } from "@/components/atoms/AppModal";
import { ReactNode } from "react";

type Mode = "create" | "view" | "edit";

type EntityFormModalProps = {
  open: boolean;
  mode: Mode;
  title: string;
  loading?: boolean;
  headerActions?: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  children: ReactNode;
};

export function EntityFormModal({
  open,
  mode,
  title,
  loading = false,
  headerActions,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: EntityFormModalProps) {
  const canSubmit = mode === "create" || mode === "edit";
  const label = submitLabel ?? (mode === "create" ? "Crear" : "Guardar cambios");

  return (
    <AppModal open={open} title={title} onClose={onClose} headerActions={headerActions}>
      <fieldset disabled={mode === "view" || loading} className="space-y-4">
        {children}
      </fieldset>

      <div className="mt-6">
        {mode === "view" ? (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || loading}
              className="cursor-pointer col-span-2 rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Guardando..." : label}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer col-span-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </AppModal>
  );
}
