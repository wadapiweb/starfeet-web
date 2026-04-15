import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type AdminSaleDetailPageProps = {
  params: Promise<{ id: string }>;
};

const money = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function statusLabel(status: string) {
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

function statusTone(status: string) {
  switch (status) {
    case "PAID":
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "PENDING_PAYMENT":
    case "INITIATED":
      return "bg-amber-100 text-amber-800";
    case "SHIPPED":
      return "bg-blue-100 text-blue-800";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function AdminSaleDetailPage({ params }: AdminSaleDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
    },
    include: {
      user: {
        select: { id: true, slug: true, name: true, email: true },
      },
      coupon: {
        select: { id: true, slug: true, code: true, discountType: true, discountValue: true },
      },
      orderItems: {
        include: {
          product: {
            select: { id: true, slug: true, name: true, type: true, imageUrls: true },
          },
          inventory: {
            select: { id: true, physicalSize: true, sku: true },
          },
        },
      },
      commissionEntries: {
        select: {
          id: true,
          amount: true,
          status: true,
          kinesioUser: { select: { id: true, slug: true, name: true, email: true } },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Compra</p>
        <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
          Orden {order.id.slice(0, 10)}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(order.status)}`}>
            {statusLabel(order.status)}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            {order.currency} {money.format(Number(order.totalAmount))}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            {order.orderItems.length} item(s)
          </span>
          <Link
            href="/admin/sales"
            className="rounded-full border border-starfeet-blue/30 px-3 py-1 text-xs font-bold text-starfeet-blue hover:bg-starfeet-blue/5"
          >
            Volver a ventas
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Cliente</h3>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Nombre:</span> {order.snapshotClientName ?? order.user?.name ?? "Sin dato"}</p>
            <p><span className="font-semibold">Email:</span> {order.snapshotClientEmail ?? order.user?.email ?? "Sin dato"}</p>
            <p><span className="font-semibold">Teléfono:</span> {order.snapshotClientPhone ?? "Sin dato"}</p>
            <p><span className="font-semibold">Fecha:</span> {order.createdAt.toISOString().slice(0, 10)}</p>
            <p><span className="font-semibold">Pago:</span> {order.paymentProvider ?? "Sin definir"}</p>
            <p><span className="font-semibold">Transacción:</span> {order.transactionId ?? "Sin transacción"}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Cupón y comisión</h3>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Cupón:</span> {order.coupon?.code ?? "Sin cupón"}</p>
            <p>
              <span className="font-semibold">Descuento:</span>{" "}
              {order.coupon
                ? order.coupon.discountType === "PERCENTAGE"
                  ? `${order.coupon.discountValue}%`
                  : `${order.coupon.discountValue} fijo`
                : "-"}
            </p>
            <p><span className="font-semibold">Comisiones:</span> {order.commissionEntries.length}</p>
          </div>
          {order.commissionEntries.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {order.commissionEntries.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700">
                  <p className="font-semibold">{entry.kinesioUser.name ?? entry.kinesioUser.email}</p>
                  <p>ARS {money.format(Number(entry.amount))} · {entry.status}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Items de la compra</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Talle</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Unitario</th>
                <th className="px-3 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-200 text-gray-700">
                  <td className="px-3 py-2 font-semibold text-starfeet-blue">{item.product.name}</td>
                  <td className="px-3 py-2">{item.product.type}</td>
                  <td className="px-3 py-2">{item.adminResolvedSize ?? item.inventory?.physicalSize ?? item.userSelectedSize}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{order.currency} {money.format(Number(item.unitPrice))}</td>
                  <td className="px-3 py-2">{order.currency} {money.format(Number(item.unitPrice) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
