import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/lib/admin-users";
import { AdminUserDetailActions } from "@/components/admin/users/AdminUserDetailActions";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  roleLabel,
  statusClassName,
  statusLabel,
} from "@/components/admin/users/user-admin-utils";

type AdminUserDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { slug } = await params;
  const detail = await getAdminUserDetail(slug);

  if (!detail) {
    notFound();
  }

  const { user, clientActivity, kinesioActivity, marketingActivity, loginEvents, auditEvents } = detail;
  const userLabel = user.name || user.email;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Usuario</p>
          <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
            {user.name ?? "Sin nombre"}
          </h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <Link
          href="/admin/users"
          className="cursor-pointer rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          Volver a usuarios
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Perfil</h3>
              <p className="text-sm text-gray-600">Identidad, rol y estado operativo.</p>
            </div>
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClassName(user.status)}`}>
              {statusLabel(user.status)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Metric label="Rol" value={roleLabel(user.role)} />
            <Metric label="Alta" value={formatDate(user.createdAt)} />
            <Metric label="Teléfono" value={user.phone ?? "-"} />
            <Metric label="Documento" value={user.documentNumber ?? "-"} />
            <Metric label="OAuth vinculados" value={String(user._count.accounts)} />
            <Metric label="Órdenes" value={String(user._count.orders)} />
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Acciones</h3>
          <p className="mb-4 text-sm text-gray-600">Operaciones sensibles auditadas.</p>
          <AdminUserDetailActions userId={user.id} userLabel={userLabel} isBlocked={user.status === "blocked"} />
        </article>
      </div>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Seguridad</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Último login" value={formatDateTime(user.lastLoginAt)} />
          <Metric label="Último fallo" value={formatDateTime(user.lastFailedLoginAt)} />
          <Metric label="Intentos fallidos" value={String(user.failedLoginAttempts)} />
          <Metric label="Bloqueado hasta" value={formatDateTime(user.lockoutUntil)} />
          <Metric label="Password actualizado" value={formatDateTime(user.passwordChangedAt)} />
          <Metric label="Versión de sesión" value={String(user.sessionVersion)} />
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-2">
        <ClientActivity activity={clientActivity} />
        {kinesioActivity ? <KinesioActivity activity={kinesioActivity} /> : <MarketingOrAdminActivity activity={marketingActivity} />}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <EventsTable title="Historial de login" events={loginEvents} empty="Sin eventos de login." />
        <EventsTable title="Auditoría reciente" events={auditEvents} empty="Sin eventos auditados." />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ClientActivity({ activity }: { activity: NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>["clientActivity"] }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Compras</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {activity.totalsByCurrency.length === 0 ? (
          <Metric label="Total" value="Sin compras" />
        ) : (
          activity.totalsByCurrency.map((item) => (
            <Metric key={item.currency} label={`${item.orders} órdenes`} value={formatCurrency(item.total, item.currency)} />
          ))
        )}
      </div>
      <div className="mt-5 overflow-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
            <tr>
              <th className="px-3 py-2">Orden</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activity.recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">Sin órdenes recientes.</td>
              </tr>
            ) : (
              activity.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/sales/${order.id}`} className="font-mono text-xs text-starfeet-blue hover:underline">
                      {order.id.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{order.status}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDate(order.createdAt)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {formatCurrency(Number(order.totalAmount), order.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function KinesioActivity({ activity }: { activity: NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>["kinesioActivity"] }) {
  if (!activity) return null;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Actividad Profesional</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="Cupones asignados" value={String(activity.assignedCoupons)} />
        <Metric label="Pacientes vinculados" value={String(activity.patients)} />
        <Metric label="Comisiones" value={formatCurrency(activity.commissionsTotal, "ARS")} />
        <Metric label="Pendiente/validado" value={formatCurrency(activity.pendingCommissionsTotal, "ARS")} />
      </div>
      <div className="mt-5 space-y-3">
        {activity.recentCoupons.length === 0 ? (
          <p className="text-sm text-gray-500">Sin cupones recientes.</p>
        ) : (
          activity.recentCoupons.map((item) => (
            <div key={`${item.coupon.id}-${item.assignedAt.toISOString()}`} className="rounded-xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">{item.coupon.code}</p>
              <p className="text-xs text-gray-500">
                {item.coupon.usageCount}/{item.coupon.maxUses} usos · {item.coupon.isActive ? "Activo" : "Inactivo"}
              </p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function MarketingOrAdminActivity({ activity }: { activity: NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>["marketingActivity"] }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">Actividad Operativa</h3>
      {!activity ? (
        <p className="mt-4 text-sm text-gray-500">Sin actividad específica para este rol.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Campañas creadas" value={String(activity.campaigns)} />
            <Metric label="Leads asignados" value={String(activity.leads)} />
          </div>
          <div className="mt-5 space-y-3">
            {activity.recentCampaigns.length === 0 ? (
              <p className="text-sm text-gray-500">Sin campañas recientes.</p>
            ) : (
              activity.recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-semibold text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {campaign.status} · {formatDate(campaign.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </article>
  );
}

function EventsTable({
  title,
  events,
  empty,
}: {
  title: string;
  events: NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>["loginEvents"];
  empty: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-condensed text-2xl font-black uppercase text-starfeet-blue">{title}</h3>
      <div className="mt-4 overflow-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Resultado</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">{empty}</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td className="px-3 py-2 text-gray-700">{formatDateTime(event.createdAt)}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{event.action}</td>
                  <td className="px-3 py-2 text-gray-700">{event.outcome ?? "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{event.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
