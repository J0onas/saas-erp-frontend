'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistorialPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PARA EL BUSCADOR ---
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchHistorial = async () => {
      const token = localStorage.getItem('saas_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'

        });

        if (!response.ok) throw new Error('Error al cargar historial');
        
        const data = await response.json();
        setInvoices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [router]);

  const descargarPdfHistorial = async (invoiceId: string, comprobante: string) => {
    try {
      const token = localStorage.getItem('saas_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoiceId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al obtener PDF');
      
      const data = await response.json();
      
      const linkSource = `data:application/pdf;base64,${data.pdfDocument}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `Factura_${comprobante || invoiceId.split('-')[0]}.pdf`; 
      downloadLink.click();
      
    } catch (error) {
      alert('Hubo un problema descargando el PDF de la base de datos.');
      console.error(error);
    }
  };

  // --- MOTOR DE BÚSQUEDA EN TIEMPO REAL ---
  const facturasFiltradas = invoices.filter((factura) => {
    const termino = busqueda.toLowerCase();
    
    // Extraemos los datos validando que existan
    const nombreCliente = factura.full_name ? factura.full_name.toLowerCase() : 'cliente sin registrar';
    const documento = factura.customer_document ? factura.customer_document.toLowerCase() : '';
    const comprobante = factura.comprobante ? factura.comprobante.toLowerCase() : '';

    return (
      nombreCliente.includes(termino) ||
      documento.includes(termino) ||
      comprobante.includes(termino)
    );
  });

  // Función para los "Pills" de colores del método de pago (Estilos mejorados)
  const renderMetodoPago = (metodo: string) => {
    const met = metodo || 'EFECTIVO';
    if (met === 'YAPE') return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm whitespace-nowrap">📱 YAPE/PLIN</span>;
    if (met === 'TARJETA') return <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 shadow-sm whitespace-nowrap">💳 TARJETA</span>;
    if (met === 'TRANSFERENCIA') return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 shadow-sm whitespace-nowrap">🏦 TRANSF.</span>;
    return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 shadow-sm whitespace-nowrap">💵 EFECTIVO</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Barra de Navegación Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Historial de Comprobantes</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Bóveda segura de facturación electrónica.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all focus:ring-2 focus:ring-slate-200 outline-none">
            <span className="mr-2">←</span> Volver al POS
          </Link>
        </div>

        {/* --- BARRA DE BÚSQUEDA --- */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 transition-shadow focus-within:shadow-md focus-within:border-blue-400">
          <div className="pl-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent border-none p-3 text-slate-700 focus:outline-none focus:ring-0 text-base font-medium placeholder:text-slate-400 placeholder:font-normal"
            placeholder="Buscar por cliente, RUC/DNI o número de comprobante..."
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')} 
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold flex items-center justify-center mr-1 outline-none"
              aria-label="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Contenedor de la Tabla */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-500 font-medium">Cargando bóveda de datos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Comprobante</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4 text-right">Monto Total</th>
                    <th className="px-6 py-4 text-center">Método Pago</th>
                    <th className="px-6 py-4 text-center">Estado SUNAT</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <p className="text-base font-medium">No se encontraron comprobantes.</p>
                          {busqueda && <p className="text-sm">No hay resultados para "{busqueda}"</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    facturasFiltradas.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* 1. Comprobante Real */}
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-900 bg-slate-100/50 inline-block px-2 py-1 rounded-md border border-slate-200">
                             {inv.comprobante || <span className="text-slate-400 font-mono text-xs">{inv.id.split('-')[0]}</span>}
                           </div>
                        </td>
                        
                        {/* 2. Fecha Real */}
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {inv.fecha || '-'}
                        </td>

                        {/* 3. Nombre y RUC */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-800 truncate max-w-[200px] md:max-w-xs" title={inv.full_name || 'Cliente sin registrar'}>
                            {inv.full_name || 'Cliente sin registrar'}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">Doc: {inv.customer_document}</div>
                        </td>

                        {/* 4. Total */}
                        <td className="px-6 py-4 text-sm text-blue-700 font-extrabold text-right">
                          S/ {Number(inv.total_amount).toFixed(2)}
                        </td>

                        {/* 5. Método de Pago */}
                        <td className="px-6 py-4 text-center">
                          {renderMetodoPago(inv.payment_method)}
                        </td>

                        {/* 6. Estado SUNAT */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] tracking-wider font-bold uppercase border shadow-sm ${
                            inv.xml_ubl_status === 'ACCEPTED' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {inv.xml_ubl_status === 'ACCEPTED' ? '✓ Aceptado' : '⏳ Pendiente'}
                          </span>
                        </td>

                        {/* 7. Acciones */}
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => descargarPdfHistorial(inv.id, inv.comprobante)}
                            className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 px-4 py-2 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
                            title="Descargar PDF"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            PDF
                          </button>
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}