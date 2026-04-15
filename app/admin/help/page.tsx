export default function AdminHelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Soporte y Ayuda</h2>
        <p className="text-sm text-gray-600 mt-1">Manual operativo y recursos para el equipo de administración.</p>
      </header>

      <section className="space-y-4">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue border-b pb-2">Preguntas Frecuentes (FAQ)</h3>
        
        <details className="group rounded-xl border border-gray-200 bg-white p-4 open:bg-gray-50">
          <summary className="font-bold cursor-pointer text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-starfeet-blue rounded">
            ¿Cómo crear y asignar un cupón a un nuevo kinesiólogo?
          </summary>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>1. Ve al módulo de <strong>Cupones</strong> y completa el formulario.</p>
            <p>2. Define el % de descuento para el paciente y el % de comisión para el kinesiólogo.</p>
            <p>3. Antes de crear el cupón, marca la casilla correspondiente al kinesiólogo en la lista de asignación (el profesional debe estar creado previamente).</p>
            <p>4. Haz clic en &quot;Crear&quot;. El cupón estará activo inmediatamente.</p>
          </div>
        </details>

        <details className="group rounded-xl border border-gray-200 bg-white p-4 open:bg-gray-50">
          <summary className="font-bold cursor-pointer text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-starfeet-blue rounded">
            ¿Cómo funciona el proceso de liquidaciones (payouts)?
          </summary>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>Las comisiones se generan en estado <strong>Pendiente</strong> al momento de concretarse una venta atribuida (uso de cupón o enlace de paciente).</p>
            <p>A fin de mes, el sistema permite consolidar las comisiones validadas en un período, con el que luego se hará la transferencia al profesional desde el banco.</p>
            <p>Una vez transferido, se marca el período como <strong>Pagado</strong> desde Finanzas.</p>
          </div>
        </details>
      </section>

      <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-condensed text-xl font-bold uppercase text-starfeet-blue mb-2">Soporte Nivel 2</h3>
        <p className="text-sm text-gray-700 mb-4">
          Si hay algún problema en el panel, errores al cobrar o caídas del servicio, puedes reportarlo al equipo técnico.
        </p>
        <p className="text-sm font-bold text-gray-900 border-t border-blue-200 pt-4 mt-2">
          Email soporte: <a href="mailto:soporte@starfeet.ar" className="text-starfeet-blue hover:underline">soporte@starfeet.ar</a>
        </p>
        <p className="text-sm font-bold text-gray-900 mt-1">
          WhatsApp Guardia (SLA 2h): <span className="text-starfeet-blue">+54 9 11 0000-0000</span>
        </p>
      </section>
    </div>
  );
}
