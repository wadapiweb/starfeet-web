"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";

type ActionType = "reset" | "unlock" | "revoke";

type AdminUserDetailActionsProps = {
  userId: string;
  userLabel: string;
  isBlocked: boolean;
};

export function AdminUserDetailActions({ userId, userLabel, isBlocked }: AdminUserDetailActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: ActionType) {
    const endpoint = {
      reset: "reset-password",
      unlock: "unlock",
      revoke: "revoke-sessions",
    }[action];

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/${endpoint}`, { method: "POST" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo completar la acción");

      const devCode = payload.devCode ? ` Código dev: ${payload.devCode}` : "";
      setMessage(successMessage(action, payload.sent) + devCode);
      setPendingAction(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    if (password.trim().length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo cambiar la contraseña");

      setPassword("");
      setPasswordOpen(false);
      setMessage("Contraseña actualizada y sesiones revocadas.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPendingAction("reset")}
          className="cursor-pointer rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          Enviar reset
        </button>
        <button
          type="button"
          onClick={() => setPasswordOpen(true)}
          className="cursor-pointer rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          Cambiar password
        </button>
        {isBlocked ? (
          <button
            type="button"
            onClick={() => setPendingAction("unlock")}
            className="cursor-pointer rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Desbloquear
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPendingAction("revoke")}
          className="cursor-pointer rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          Revocar sesiones
        </button>
      </div>

      {message ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <EntityFormModal
        open={passwordOpen}
        mode="edit"
        title="Cambiar password"
        loading={loading}
        onClose={() => {
          setPasswordOpen(false);
          setPassword("");
        }}
        onSubmit={savePassword}
        submitLabel="Cambiar password"
      >
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">{userLabel}</p>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nueva contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <p className="text-xs text-gray-500">Esta acción revoca las sesiones activas.</p>
        </form>
      </EntityFormModal>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmTitle(pendingAction)}
        description={confirmDescription(pendingAction, userLabel)}
        confirmLabel={confirmLabel(pendingAction)}
        destructive={pendingAction === "revoke"}
        loading={loading}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && runAction(pendingAction)}
      />
    </div>
  );
}

function confirmTitle(type: ActionType | null) {
  if (type === "reset") return "Enviar reset";
  if (type === "unlock") return "Desbloquear usuario";
  if (type === "revoke") return "Revocar sesiones";
  return "Confirmar acción";
}

function confirmDescription(type: ActionType | null, label: string) {
  if (type === "reset") return `Se generará un código de recuperación para ${label}.`;
  if (type === "unlock") return `Se limpiará el bloqueo de ${label}.`;
  if (type === "revoke") return `Se invalidarán las sesiones activas de ${label}.`;
  return "Confirma para continuar.";
}

function confirmLabel(type: ActionType | null) {
  if (type === "reset") return "Enviar reset";
  if (type === "unlock") return "Desbloquear";
  if (type === "revoke") return "Revocar sesiones";
  return "Confirmar";
}

function successMessage(type: ActionType, sent?: boolean) {
  if (type === "reset") return sent ? "Email de reset enviado." : "Reset generado. Mailer no configurado.";
  if (type === "unlock") return "Usuario desbloqueado.";
  return "Sesiones revocadas.";
}
