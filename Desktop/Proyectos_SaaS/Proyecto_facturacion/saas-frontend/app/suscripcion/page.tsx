'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SuscripcionPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // Aquí simularemos el inicio del pago. Más adelante esto llamará a Stripe/MercadoPago.
  // EL CÓDIGO NUEVO (DE VERDAD) - CÓPIALO Y PÉGALO
  const iniciarPago = async (planName: string, precio: number) => {
    setLoadingPlan(planName);
    
    try {
      const token = localStorage.getItem('saas_token');
      // Llamamos al backend de NestJS que acabamos de programar
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName, precio }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Magia: El backend nos dio el link de Mercado Pago, ¡redirigimos la ventana!
        window.location.href = data.url;
      } else {
        alert('Error devuelto por el servidor: ' + (data.message || 'Desconocido'));
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert('Error de conexión con el backend.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Planes y Precios</h2>
        <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Elige el plan perfecto para tu negocio
        </p>
        <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
          Facturación electrónica ilimitada, control de inventario y reportes gerenciales en un solo lugar. Cancela cuando quieras.
        </p>
        <div className="mt-6">
           <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              ← Volver al Dashboard
           </Link>
        </div>
      </div>

      {/* TARJETAS DE PLANES */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* PLAN MENSUAL */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Mensual</h3>
            <p className="text-slate-500 mb-6 text-sm">Flexibilidad total. Paga mes a mes sin compromisos a largo plazo.</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold tracking-tight text-slate-900">S/ 120</span>
              <span className="text-slate-500 ml-2 text-lg font-medium">/mes</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-3">✓</span> <span className="text-slate-600 font-medium">Comprobantes electrónicos ilimitados</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-3">✓</span> <span className="text-slate-600 font-medium">Punto de Venta (POS) multi-caja</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-3">✓</span> <span className="text-slate-600 font-medium">Control de Inventario y Kardex</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-3">✓</span> <span className="text-slate-600 font-medium">Exportación SIRE para Contadores</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-3">✓</span> <span className="text-slate-600 font-medium">Soporte técnico por correo</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => iniciarPago('Mensual', 120)}
            disabled={loadingPlan !== null}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-8 rounded-xl transition-colors focus:ring-4 focus:ring-slate-100 outline-none disabled:opacity-50"
          >
            {loadingPlan === 'Mensual' ? 'Procesando...' : 'Elegir Plan Mensual'}
          </button>
        </div>

        {/* PLAN ANUAL (Destacado) */}
        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col justify-between relative transform md:-translate-y-4 ring-4 ring-blue-500/30">
          <div className="absolute top-0 right-0 -mt-4 mr-8">
            <span className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">
              Ahorras 20%
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Plan Anual</h3>
            <p className="text-slate-400 mb-6 text-sm">La mejor opción para negocios establecidos. Paga un año y olvídate.</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold tracking-tight text-white">S/ 1150</span>
              <span className="text-slate-400 ml-2 text-lg font-medium">/año</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">✓</span> <span className="text-slate-300 font-medium">Todo lo del Plan Mensual</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">✓</span> <span className="text-white font-bold">2 meses gratis</span> <span className="text-slate-300 ml-1 font-medium">incluidos</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">✓</span> <span className="text-slate-300 font-medium">Soporte prioritario por WhatsApp</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">✓</span> <span className="text-slate-300 font-medium">Capacitación inicial gratuita (1h)</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => iniciarPago('Anual', 1150)}
            disabled={loadingPlan !== null}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-900/50 transition-all focus:ring-4 focus:ring-blue-500/50 outline-none disabled:opacity-50"
          >
            {loadingPlan === 'Anual' ? 'Procesando...' : 'Elegir Plan Anual'}
          </button>
        </div>

      </div>

      {/* FOOTER DE CONFIANZA */}
      <div className="max-w-7xl mx-auto mt-16 text-center border-t border-slate-200 pt-8">
        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
           <span>🔒</span> Pagos 100% seguros procesados con tecnología encriptada.
        </p>
      </div>

    </div>
  );
}