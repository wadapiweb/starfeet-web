import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type AdminCouponDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminCouponDetailPage({ params }: AdminCouponDetailPageProps) {
  const { slug } = await params;

  const coupon = await prisma.coupon.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      assignments: {
        include: {
          kinesioUser: {
            select: { id: true, slug: true, name: true, email: true, isActive: true },
          },
        },
      },
      _count: {
        select: { orders: true, redemptions: true },
      },
    },
  });

  if (!coupon) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Cupón</p>
        <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
          {coupon.code}
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Descuento: {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `${coupon.discountValue} fijo`} ·
          Comisión: {coupon.commissionType === "PERCENTAGE" ? ` ${coupon.commissionValue}%` : ` ${coupon.commissionValue} fijo`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${coupon.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
          >
            {coupon.isActive ? "Activo" : "Inactivo"}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            Uso {coupon.usageCount}/{coupon.maxUses}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            Vence {coupon.expiresAt?.toISOString().slice(0, 10) ?? "Sin vencimiento"}
          </span>
          <Link
            href="/admin/coupons"
            className="rounded-full border border-starfeet-blue/30 px-3 py-1 text-xs font-bold text-starfeet-blue hover:bg-starfeet-blue/5"
          >
            Volver a cupones
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Órdenes afectadas</p>
          <p className="mt-2 font-condensed text-3xl font-black text-starfeet-blue">{coupon._count.orders}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Redenciones</p>
          <p className="mt-2 font-condensed text-3xl font-black text-starfeet-blue">{coupon._count.redemptions}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Asignaciones</p>
          <p className="mt-2 font-condensed text-3xl font-black text-starfeet-blue">{coupon.assignments.length}</p>
        </article>
      </section>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Profesionales asignados</h3>
        <ul className="mt-3 space-y-2">
          {coupon.assignments.length === 0 ? (
            <li className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">Sin profesionales asignados.</li>
          ) : (
            coupon.assignments.map((assignment) => (
              <li key={assignment.kinesioUser.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <span>{assignment.kinesioUser.name ?? assignment.kinesioUser.email}</span>
                  <span className={`text-xs font-bold ${assignment.kinesioUser.isActive ? "text-green-700" : "text-gray-500"}`}>
                    {assignment.kinesioUser.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{assignment.kinesioUser.email}</p>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
