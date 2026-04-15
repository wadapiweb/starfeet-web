import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalSingleActions } from "@/components/admin/ProfessionalSingleActions";

type AdminProfessionalDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function AdminProfessionalDetailPage({ params }: AdminProfessionalDetailPageProps) {
  const { slug } = await params;

  const professional = await prisma.user.findFirst({
    where: {
      role: "KINESIOLOGO",
      OR: [{ slug }, { id: slug }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!professional) {
    notFound();
  }

  const professionalId = professional.id;
  const now = new Date();

  const [
    assignmentsTotal,
    assignmentsActive,
    patientsTotal,
    commissionsAggregate,
    pendingAggregate,
    paidAggregate,
    recentAssignments,
    recentCommissions,
    salesByCurrency,
  ] = await Promise.all([
    safeTableQuery(
      () =>
        prisma.couponAssignment.count({
          where: { kinesioUserId: professionalId },
        }),
      0,
    ),
    safeTableQuery(
      () =>
        prisma.couponAssignment.count({
          where: {
            kinesioUserId: professionalId,
            coupon: {
              isActive: true,
              expiresAt: { gt: now },
            },
          },
        }),
      0,
    ),
    safeTableQuery(
      () =>
        prisma.patientKinesioLink.count({
          where: { kinesioUserId: professionalId },
        }),
      0,
    ),
    safeTableQuery(
      () =>
        prisma.commissionEntry.aggregate({
          where: { kinesioUserId: professionalId },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      { _sum: { amount: new Prisma.Decimal(0) }, _count: { _all: 0 } },
    ),
    safeTableQuery(
      () =>
        prisma.commissionEntry.aggregate({
          where: { kinesioUserId: professionalId, status: { in: ["PENDING", "VALIDATED"] } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      { _sum: { amount: new Prisma.Decimal(0) }, _count: { _all: 0 } },
    ),
    safeTableQuery(
      () =>
        prisma.commissionEntry.aggregate({
          where: { kinesioUserId: professionalId, status: "PAID" },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      { _sum: { amount: new Prisma.Decimal(0) }, _count: { _all: 0 } },
    ),
    safeTableQuery(
      () =>
        prisma.couponAssignment.findMany({
          where: { kinesioUserId: professionalId },
          orderBy: { assignedAt: "desc" },
          take: 6,
          select: {
            id: true,
            assignedAt: true,
            coupon: {
              select: {
                id: true,
                code: true,
                isActive: true,
                expiresAt: true,
                usageCount: true,
                maxUses: true,
              },
            },
          },
        }),
      [],
    ),
    safeTableQuery(
      () =>
        prisma.commissionEntry.findMany({
          where: { kinesioUserId: professionalId },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                currency: true,
                totalAmount: true,
              },
            },
            coupon: {
              select: {
                code: true,
              },
            },
          },
        }),
      [],
    ),
    safeTableQuery(
      () =>
        prisma.order.groupBy({
          by: ["currency"],
          where: {
            commissionEntries: {
              some: { kinesioUserId: professionalId },
            },
          },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
      [],
    ),
  ]);

  const salesCount = salesByCurrency.reduce((sum, item) => sum + item._count._all, 0);
  const salesTotalArs = Number(salesByCurrency.find((item) => item.currency === "ARS")?._sum.totalAmount ?? 0);
  const salesTotalUsd = Number(salesByCurrency.find((item) => item.currency === "USD")?._sum.totalAmount ?? 0);

  const totalCommissionAmount = Number(commissionsAggregate._sum.amount ?? 0);
  const pendingCommissionAmount = Number(pendingAggregate._sum.amount ?? 0);
  const paidCommissionAmount = Number(paidAggregate._sum.amount ?? 0);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Profesional</p>
            <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
              {professional.name ?? "Sin nombre"}
            </h2>
          </div>
          <ProfessionalSingleActions
            professional={{
              id: professional.id,
              name: professional.name,
              email: professional.email,
              phone: professional.phone,
              isActive: professional.isActive,
            }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-700">{professional.email}</p>
        <p className="text-sm text-gray-700">{professional.phone ?? "Sin teléfono"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${professional.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
            {professional.isActive ? "Activo" : "Inactivo"}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            Alta {professional.createdAt.toISOString().slice(0, 10)}
          </span>
          {professional.slug ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-starfeet-blue">/{professional.slug}</span>
          ) : null}
          <Link href="/admin/professionals" className="rounded-full border border-starfeet-blue/30 px-3 py-1 text-xs font-bold text-starfeet-blue hover:bg-starfeet-blue/5">
            Volver a profesionales
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cupones asignados" value={`${assignmentsTotal}`} hint={`${assignmentsActive} activos`} />
        <MetricCard label="Pacientes vinculados" value={`${patientsTotal}`} hint="Relación histórica" />
        <MetricCard
          label="Comisiones acumuladas"
          value={`ARS ${currencyFormatter.format(totalCommissionAmount)}`}
          hint={`${commissionsAggregate._count._all} registros`}
        />
        <MetricCard label="Ventas atribuidas" value={`${salesCount}`} hint={`ARS ${currencyFormatter.format(salesTotalArs)} / USD ${currencyFormatter.format(salesTotalUsd)}`} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Estado de liquidación</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <StatusPill title="Pendiente + validado" value={`ARS ${currencyFormatter.format(pendingCommissionAmount)}`} count={pendingAggregate._count._all} tone="amber" />
            <StatusPill title="Pagado" value={`ARS ${currencyFormatter.format(paidCommissionAmount)}`} count={paidAggregate._count._all} tone="green" />
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Cupones recientes</h3>
          <ul className="mt-3 space-y-2">
            {recentAssignments.length === 0 ? (
              <li className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">Sin asignaciones recientes.</li>
            ) : (
              recentAssignments.map((assignment) => (
                <li key={assignment.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-starfeet-blue">{assignment.coupon.code}</span>
                    <span className="text-xs text-gray-500">{assignment.assignedAt.toISOString().slice(0, 10)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Uso {assignment.coupon.usageCount}/{assignment.coupon.maxUses} · {assignment.coupon.isActive ? "Activo" : "Inactivo"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Comisiones recientes</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2">Cupón</th>
                <th className="px-3 py-2">Total orden</th>
                <th className="px-3 py-2">Comisión</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-gray-500">Sin comisiones registradas.</td>
                </tr>
              ) : (
                recentCommissions.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-200 text-gray-700">
                    <td className="px-3 py-2">{entry.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{entry.order.id.slice(0, 10)}</td>
                    <td className="px-3 py-2">{entry.coupon?.code ?? "-"}</td>
                    <td className="px-3 py-2">
                      {entry.order.currency} {currencyFormatter.format(Number(entry.order.totalAmount))}
                    </td>
                    <td className="px-3 py-2">ARS {currencyFormatter.format(Number(entry.amount))}</td>
                    <td className="px-3 py-2">{entry.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

async function safeTableQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isMissingTableError(error)) {
      return fallback;
    }
    throw error;
  }
}

function isMissingTableError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 font-condensed text-3xl font-black text-starfeet-blue">{value}</p>
      <p className="mt-1 text-xs text-gray-600">{hint}</p>
    </article>
  );
}

function StatusPill({
  title,
  value,
  count,
  tone,
}: {
  title: string;
  value: string;
  count: number;
  tone: "amber" | "green";
}) {
  const toneClass = tone === "green" ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-900";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
      <p className="text-xs">{count} movimientos</p>
    </div>
  );
}
