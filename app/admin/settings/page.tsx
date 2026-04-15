export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Configuración Global</h2>
        <p className="text-sm text-gray-600 mt-1">Parámetros del sistema y variables de negocio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border text-sm text-gray-700 border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-lg uppercase font-condensed text-starfeet-blue border-b pb-2">Negocio</h3>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Moneda Principal</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">ARS</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Validez por defecto de Cupones</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">90 días</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Notificación de Stock Bajo</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">&lt; 10 unidades</span>
          </div>
        </section>

        <section className="bg-white border text-sm text-gray-700 border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-lg uppercase font-condensed text-starfeet-blue border-b pb-2">Pasarelas de Pago</h3>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">MercadoPago (ARS)</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-xs">ACTIVO</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">PayPal (USD)</span>
            <span className="bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded text-xs">INACTIVO</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Transferencia Bancaria</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-xs">ACTIVO</span>
          </div>
        </section>

        <section className="bg-white border text-sm text-gray-700 border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-lg uppercase font-condensed text-starfeet-blue border-b pb-2">Sistema y Correos</h3>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Motor de envíos (SMTP)</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-xs">CONFIGURADO</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="font-bold">Recuperación de Carritos</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-xs">ACTIVO (T+ 30m)</span>
          </div>
        </section>
      </div>
      
      <p className="text-xs text-gray-400 font-mono mt-4 text-center">Configuración inyectada vía variables de entorno. Los cambios de pasarelas requieren deploy.</p>
    </div>
  );
}
