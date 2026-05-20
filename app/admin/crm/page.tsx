import prisma from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

export default async function AdminCrmPage() {
  const [metrics, leads] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      _count: true
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { activities: true } }
      }
    })
  ]);

  const stats = metrics.reduce(
    (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
    {} as Record<LeadStatus, number>
  );

  const totalLeads = metrics.reduce((sum, curr) => sum + curr._count, 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Pipeline CRM</h2>
        <p className="text-sm text-gray-600 mt-1">Gestión de contactos comerciales y prospectos institucionales.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total de leads" value={totalLeads.toString()} bg="bg-blue-50" text="text-starfeet-blue" />
        <StatCard title="Nuevos" value={(stats.NEW_LEAD || 0).toString()} bg="bg-gray-100" text="text-gray-800" />
        <StatCard title="En proceso" value={((stats.CONTACTED || 0) + (stats.QUALIFIED || 0) + (stats.PROPOSAL || 0) + (stats.NEGOTIATION || 0)).toString()} bg="bg-amber-100" text="text-amber-800" />
        <StatCard title="Ganados" value={(stats.CLOSED_WON || 0).toString()} bg="bg-green-100" text="text-green-800" />
      </div>

      <article className="rounded-2xl border border-gray-200 bg-white">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-condensed text-xl font-bold uppercase text-starfeet-blue">Últimos Leads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 uppercase text-gray-500 text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Establecimiento/Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Interés</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No hay leads registrados</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600">{lead.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{lead.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{lead.email || "-"}</p>
                      <p className="text-xs text-gray-500">{lead.phone || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.interest || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        lead.status === 'CLOSED_WON' ? "bg-green-100 text-green-800" :
                        lead.status === 'CLOSED_LOST' ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-starfeet-blue"
                      }`}>
                        {leadStatusLabel(lead.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function StatCard({ title, value, bg, text }: { title: string, value: string, bg: string, text: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">{title}</p>
      <p className={`mt-1 font-condensed text-3xl font-black ${text}`}>{value}</p>
    </div>
  );
}

function leadStatusLabel(status: string) {
  switch (status) {
    case "NEW_LEAD":
      return "Nuevo";
    case "CONTACTED":
      return "Contactado";
    case "QUALIFIED":
      return "Calificado";
    case "PROPOSAL":
    case "PROPOSAL_SENT":
      return "Propuesta enviada";
    case "NEGOTIATION":
      return "Negociación";
    case "WON":
    case "CLOSED_WON":
      return "Ganado";
    case "LOST":
    case "CLOSED_LOST":
      return "Perdido";
    default:
      return status;
  }
}
