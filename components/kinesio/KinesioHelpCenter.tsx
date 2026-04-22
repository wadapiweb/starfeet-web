import { getAdminSettingsSnapshot } from "@/lib/admin-settings.server";

export async function KinesioHelpCenter() {
  const settings = await getAdminSettingsSnapshot().catch(() => null);
  const supportEmail = String(settings?.general.supportEmail ?? "soporte@starfeet.ar");
  const whatsapp = String(settings?.general.supportWhatsapp ?? "+54 9 11 5555-0000");

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Ayuda operativa</h2>
        <p className="mt-2 text-sm text-gray-600">
          Este espacio reúne el flujo mínimo que necesitás para operar pacientes, cupones, comisiones y liquidaciones sin fricción.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Soporte real" value={supportEmail} description={`WhatsApp: ${whatsapp}`} />
        <Card title="Secuencia recomendada" value="Pacientes → Cupones → Comisiones" description="Trabajá en ese orden para leer el impacto comercial." />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue">Preguntas frecuentes</h3>
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <FaqItem
            q="¿Qué significa una comisión pendiente?"
            a="La venta ya existe, pero todavía no fue validada o cerrada para liquidación."
          />
          <FaqItem
            q="¿Dónde veo el desempeño de un paciente?"
            a="En Pacientes, abrí el registro y revisá su historial de órdenes, teléfono y fechas de vínculo."
          />
          <FaqItem
            q="¿Cómo uso los filtros?"
            a="Usá el rango de fechas del dashboard y después afiná por estado o por paciente según el módulo."
          />
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mt-2 break-words font-semibold text-starfeet-blue">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="font-semibold text-starfeet-blue">{q}</p>
      <p className="mt-1 text-gray-600">{a}</p>
    </article>
  );
}
