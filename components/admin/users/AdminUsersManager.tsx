"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";
import { UserActionsMenu } from "@/components/admin/users/UserActionsMenu";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  roleLabel,
  roleOptions,
  statusClassName,
  statusLabel,
} from "@/components/admin/users/user-admin-utils";

type UserRow = {
  id: string;
  slug: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  role: Role;
  isActive: boolean;
  lockoutUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  status: "active" | "inactive" | "blocked";
  _count: { orders: number };
  totalSpentByCurrency: Record<string, number>;
};

type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

type EditForm = {
  name: string;
  phone: string;
  documentNumber: string;
  role: Role;
  isActive: boolean;
};

type PendingAction =
  | { type: "reset"; user: UserRow }
  | { type: "unlock"; user: UserRow }
  | { type: "revoke"; user: UserRow }
  | null;

type UserActionType = Exclude<PendingAction, null>["type"];

const initialPagination: Pagination = { total: 0, page: 1, pageSize: 20, pages: 1 };

export function AdminUsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState("all");
  const [purchases, setPurchases] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null);
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("role", role);
      params.set("status", status);
      params.set("purchases", purchases);
      params.set("sort", sort);
      params.set("dir", dir);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar los usuarios");

      setUsers(payload.users ?? []);
      setPagination(payload.pagination ?? initialPagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [dir, page, purchases, q, role, sort, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectedUserLabel = useMemo(() => {
    const user = editingUser ?? passwordUser ?? pendingAction?.user;
    return user ? user.name || user.email : "";
  }, [editingUser, passwordUser, pendingAction]);

  function submitFilters(event?: FormEvent) {
    event?.preventDefault();
    setPage(1);
    loadUsers();
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setEditForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      documentNumber: user.documentNumber ?? "",
      role: user.role,
      isActive: user.isActive,
    });
  }

  async function saveEdit() {
    if (!editingUser || !editForm) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim() || null,
          phone: editForm.phone.trim() || null,
          documentNumber: editForm.documentNumber.trim() || null,
          role: editForm.role,
          isActive: editForm.isActive,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar el usuario");

      setEditingUser(null);
      setEditForm(null);
      setSuccess("Usuario actualizado correctamente.");
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setActionLoading(false);
    }
  }

  async function runSimpleAction() {
    if (!pendingAction) return;
    const endpoints = {
      reset: "reset-password",
      unlock: "unlock",
      revoke: "revoke-sessions",
    };

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${pendingAction.user.id}/${endpoints[pendingAction.type]}`, {
        method: "POST",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo completar la acción");

      const extra = payload.devCode ? ` Código dev: ${payload.devCode}` : "";
      setSuccess(actionSuccessMessage(pendingAction.type, payload.sent) + extra);
      setPendingAction(null);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setActionLoading(false);
    }
  }

  async function savePassword() {
    if (!passwordUser) return;
    if (password.trim().length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${passwordUser.id}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo cambiar la contraseña");

      setPasswordUser(null);
      setPassword("");
      setSuccess("Contraseña actualizada y sesiones revocadas.");
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Usuarios</h2>
          <p className="text-sm text-gray-600">{pagination.total} usuarios registrados</p>
        </div>
      </header>

      <form onSubmit={submitFilters} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-[minmax(220px,1fr)_180px_170px_170px_170px_130px]">
        <label className="block">
          <span className="sr-only">Buscar usuarios</span>
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar nombre, email, documento o teléfono"
            className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-starfeet-blue"
          />
        </label>
        <DropdownSelect
          value={role}
          onChange={(value) => {
            setRole(value as Role | "all");
            setPage(1);
          }}
          ariaLabel="Filtrar por rol"
          options={roleOptions}
          buttonClassName="h-10 rounded-xl border border-gray-300 px-3 text-sm"
        />
        <DropdownSelect
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          ariaLabel="Filtrar por estado"
          options={[
            { value: "all", label: "Todos los estados" },
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
            { value: "blocked", label: "Bloqueados" },
          ]}
          buttonClassName="h-10 rounded-xl border border-gray-300 px-3 text-sm"
        />
        <DropdownSelect
          value={purchases}
          onChange={(value) => {
            setPurchases(value);
            setPage(1);
          }}
          ariaLabel="Filtrar por compras"
          options={[
            { value: "all", label: "Con o sin compras" },
            { value: "yes", label: "Con compras" },
            { value: "no", label: "Sin compras" },
          ]}
          buttonClassName="h-10 rounded-xl border border-gray-300 px-3 text-sm"
        />
        <DropdownSelect
          value={sort}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          ariaLabel="Ordenar usuarios"
          options={[
            { value: "createdAt", label: "Alta" },
            { value: "lastLoginAt", label: "Último login" },
            { value: "email", label: "Email" },
            { value: "orders", label: "Compras" },
          ]}
          buttonClassName="h-10 rounded-xl border border-gray-300 px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setDir((current) => (current === "desc" ? "asc" : "desc"));
            setPage(1);
          }}
          className="h-10 cursor-pointer rounded-xl border border-gray-300 px-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          {dir === "desc" ? "Desc" : "Asc"}
        </button>
      </form>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <div className="overflow-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último login</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3 text-right">Compras</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Opciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {loading ? "Cargando usuarios..." : "No se encontraron usuarios."}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.slug ?? user.id}`} className="font-semibold text-starfeet-blue hover:underline">
                      {user.name ?? "Sin nombre"}
                    </Link>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.phone ? <p className="text-xs text-gray-400">{user.phone}</p> : null}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{roleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClassName(user.status)}`}>
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(user.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{user._count.orders}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    <SpentSummary totals={user.totalSpentByCurrency} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex">
                      <UserActionsMenu
                        detailHref={`/admin/users/${user.slug ?? user.id}`}
                        canUnlock={user.status === "blocked"}
                        onEdit={() => openEdit(user)}
                        onResetPassword={() => setPendingAction({ type: "reset", user })}
                        onSetPassword={() => {
                          setPassword("");
                          setPasswordUser(user);
                        }}
                        onUnlock={() => setPendingAction({ type: "unlock", user })}
                        onRevokeSessions={() => setPendingAction({ type: "revoke", user })}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="font-semibold">
          Página {pagination.page} de {pagination.pages}
        </span>
        <button
          type="button"
          disabled={page >= pagination.pages || loading}
          onClick={() => setPage((current) => current + 1)}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <EntityFormModal
        open={Boolean(editingUser && editForm)}
        mode="edit"
        title="Editar usuario"
        loading={actionLoading}
        onClose={() => {
          setEditingUser(null);
          setEditForm(null);
        }}
        onSubmit={saveEdit}
        submitLabel="Guardar cambios"
      >
        {editForm ? (
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <UserReadOnlyIdentity label={selectedUserLabel} email={editingUser?.email ?? ""} />
            <TextField label="Nombre" value={editForm.name} onChange={(value) => setEditForm({ ...editForm, name: value })} />
            <TextField label="Teléfono" value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
            <TextField
              label="Documento"
              value={editForm.documentNumber}
              onChange={(value) => setEditForm({ ...editForm, documentNumber: value })}
            />
            <DropdownSelect
              value={editForm.role}
              onChange={(value) => setEditForm({ ...editForm, role: value as Role })}
              ariaLabel="Rol de usuario"
              options={roleOptions.filter((option) => option.value !== "all")}
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={editForm.isActive}
                onChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                ariaLabel="Usuario activo"
              />
              <span className="text-sm text-gray-700">Usuario activo</span>
            </div>
          </form>
        ) : null}
      </EntityFormModal>

      <EntityFormModal
        open={Boolean(passwordUser)}
        mode="edit"
        title="Cambiar password"
        loading={actionLoading}
        onClose={() => {
          setPasswordUser(null);
          setPassword("");
        }}
        onSubmit={savePassword}
        submitLabel="Cambiar password"
      >
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <UserReadOnlyIdentity label={selectedUserLabel} email={passwordUser?.email ?? ""} />
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
          <p className="text-xs text-gray-500">Esta acción revoca las sesiones activas del usuario.</p>
        </form>
      </EntityFormModal>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmTitle(pendingAction?.type)}
        description={confirmDescription(pendingAction?.type, selectedUserLabel)}
        confirmLabel={confirmLabel(pendingAction?.type)}
        destructive={pendingAction?.type === "revoke"}
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={runSimpleAction}
      />
    </section>
  );
}

function SpentSummary({ totals }: { totals: Record<string, number> }) {
  const entries = Object.entries(totals);
  if (entries.length === 0) return <span className="text-gray-400">-</span>;

  return (
    <div className="space-y-1">
      {entries.map(([currency, value]) => (
        <p key={currency}>{formatCurrency(value, currency)}</p>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function UserReadOnlyIdentity({ label, email }: { label: string; email: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{email}</p>
    </div>
  );
}

function confirmTitle(type?: UserActionType) {
  if (type === "reset") return "Enviar reset";
  if (type === "unlock") return "Desbloquear usuario";
  if (type === "revoke") return "Revocar sesiones";
  return "Confirmar acción";
}

function confirmDescription(type: UserActionType | undefined, label: string) {
  if (type === "reset") return `Se generará un código de recuperación y se enviará a ${label}.`;
  if (type === "unlock") return `Se limpiará el bloqueo y los intentos fallidos de ${label}.`;
  if (type === "revoke") return `Se invalidarán las sesiones activas de ${label}.`;
  return "Confirma para continuar.";
}

function confirmLabel(type?: UserActionType) {
  if (type === "reset") return "Enviar reset";
  if (type === "unlock") return "Desbloquear";
  if (type === "revoke") return "Revocar sesiones";
  return "Confirmar";
}

function actionSuccessMessage(type: UserActionType, sent?: boolean) {
  if (type === "reset") return sent ? "Email de reset enviado." : "Reset generado. Mailer no configurado.";
  if (type === "unlock") return "Usuario desbloqueado.";
  return "Sesiones revocadas.";
}
