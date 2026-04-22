import Link from "next/link";

import prisma from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function orderStatusLabel(status: string) {
  switch (status) {
    case "INITIATED":
      return "Iniciada";
    case "PENDING_PAYMENT":
      return "Pendiente de pago";
    case "PAID":
      return "Pagada";
    case "SHIPPED":
      return "Enviada";
    case "DELIVERED":
      return "Entregada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

const AdminDashboardPage = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [kinesiosActivos, cuponesActivos, ordenesHoy, revenueArs, ultimasOrdenes] = await Promise.all([
    prisma.user.count({ where: { role: "KINESIOLOGO", isActive: true } }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] }, currency: "ARS" },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        currency: true,
        totalAmount: true,
        status: true,
        snapshotClientName: true,
        snapshotClientEmail: true,
        user: { select: { name: true, email: true } },
        coupon: { select: { code: true } },
      },
    }),
  ]);

  const totalRevenue = Number(revenueArs._sum.totalAmount ?? 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-600">Visión general del negocio, operativa logística y médica.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="col-span-2 rounded-xl bg-starfeet-blue p-4 text-white md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Facturación acumulada</p>
          <p className="mt-1 font-condensed text-4xl font-black">ARS {currencyFormatter.format(totalRevenue)}</p>
          <Link href="/admin/finance" className="mt-3 inline-block text-xs font-bold uppercase underline hover:opacity-80">
            Ver finanzas
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Órdenes hoy</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{ordenesHoy}</p>
          <Link href="/admin/sales" className="mt-2 inline-block text-[10px] font-bold uppercase text-starfeet-blue hover:underline">
            Ir a ventas
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kinesiólogos</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{kinesiosActivos}</p>
          <Link href="/admin/professionals" className="mt-2 inline-block text-[10px] font-bold uppercase text-starfeet-blue hover:underline">
            Ver lista
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cupones</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{cuponesActivos}</p>
          <Link href="/admin/coupons" className="mt-2 inline-block text-[10px] font-bold uppercase text-starfeet-blue hover:underline">
            Gestionar
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="font-condensed text-xl font-bold uppercase text-starfeet-blue">Últimas órdenes</h3>
          <Link href="/admin/sales" className="text-xs font-bold text-starfeet-blue hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Fecha / ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cupón</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ultimasOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No hay órdenes recientes
                  </td>
                </tr>
              ) : (
                ultimasOrdenes.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.createdAt.toLocaleDateString()}</p>
                      <p className="font-mono text-xs text-gray-400">{order.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.snapshotClientName || order.user?.name || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500">{order.snapshotClientEmail || order.user?.email || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{order.coupon?.code || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {order.currency} {currencyFormatter.format(Number(order.totalAmount))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                          order.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : order.status === "DELIVERED" || order.status === "SHIPPED"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
