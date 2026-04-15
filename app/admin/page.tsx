import prisma from "@/lib/prisma";
import Link from "next/link";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function AdminDashboardPage() {
  const [
    kinesiosActivos,
    cuponesActivos,
    ordenesHoy,
    revenueArs,
    ultimasOrdenes
  ] = await Promise.all([
    prisma.user.count({ where: { role: "KINESIOLOGO", isActive: true } }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] }, currency: "ARS" },
      _sum: { totalAmount: true }
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, coupon: { select: { code: true } } }
    })
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Visión general del negocio, operativa logística y médica.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-starfeet-blue text-white p-4 col-span-2 md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Facturación Acumulada</p>
          <p className="mt-1 font-condensed text-4xl font-black">ARS {currencyFormatter.format(Number(revenueArs._sum.totalAmount || 0))}</p>
          <Link href="/admin/finance" className="inline-block mt-3 text-xs font-bold uppercase underline hover:opacity-80">Ver Finanzas</Link>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Órdenes Hoy</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{ordenesHoy}</p>
          <Link href="/admin/sales" className="inline-block mt-2 text-[10px] uppercase font-bold text-starfeet-blue hover:underline">Ir a Ventas</Link>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kinesiólogos</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{kinesiosActivos}</p>
          <Link href="/admin/professionals" className="inline-block mt-2 text-[10px] uppercase font-bold text-starfeet-blue hover:underline">Ver Lista</Link>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cupones</p>
          <p className="mt-1 font-condensed text-3xl font-black text-gray-900">{cuponesActivos}</p>
          <Link href="/admin/coupons" className="inline-block mt-2 text-[10px] uppercase font-bold text-starfeet-blue hover:underline">Gestionar</Link>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-condensed text-xl font-bold uppercase text-starfeet-blue">Últimas Órdenes</h3>
          <Link href="/admin/sales" className="text-xs font-bold text-starfeet-blue hover:underline">Ver Todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 uppercase text-gray-500 text-[10px] font-bold tracking-wider">
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
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No hay órdenes recientes</td></tr>
              ) : (
                ultimasOrdenes.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.createdAt.toLocaleDateString()}</p>
                      <p className="font-mono text-xs text-gray-400">{order.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.snapshotClientName || order.user?.name || "Sin Nombre"}</p>
                      <p className="text-xs text-gray-500">{order.snapshotClientEmail || order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{order.coupon?.code || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {order.currency} {currencyFormatter.format(Number(order.totalAmount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        order.status === 'PAID' ? "bg-green-100 text-green-800" :
                        order.status === 'DELIVERED' || order.status === 'SHIPPED' ? "bg-blue-100 text-blue-800" :
                        order.status === 'CANCELLED' ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
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
}
