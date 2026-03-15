'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HistorialPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchHistorial = async () => {
      const token = localStorage.getItem('saas_token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API}/api/v1/invoices/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setInvoices(data);
      } finally { setLoading(false); }
    };
    fetchHistorial();
  }, [router]);

  const descargarPdf = async (invoiceId: string, comprobante: string) => {
    const token = localStorage.getItem('saas_token');
    try {
      const res = await fetch(`${API}/api/v1/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.pdfDocument}`;
      link.download = `${comprobante || invoiceId.split('-')[0]}.pdf`;
      link.click();
    } catch { alert('Error descargando el PDF.'); }
  };

  const filtradas = invoices.filter((f) => {
    const t = busqueda.toLowerCase();
    return (
      (f.full_name || '').toLowerCase().includes(t) ||
      (f.customer_document || '').toLowerCase().includes(t) ||
      (f.comprobante || '').toLowerCase().includes(t)
    );
  });

  const metodoPill = (metodo: string) => {
    const m = (metodo || 'EFECTIVO').toUpperCase();
    const styles: Record<string, string> = {
      YAPE: 'bg-violet-100 text-violet-700 border-violet-200',
      TARJETA: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      TRANSFERENCIA: 'bg-orange-100 text-orange-700 border-orange-200',
      EFECTIVO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    const labels: Record<string, string> = {
      YAPE: '📱 Yape/Plin', TARJETA: '💳 Tarjeta',
      TRANSFERENCIA: '🏦 Transf.', EFECTIVO: '💵 Efectivo',
    };
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[m] || styles.EFECTIVO}`}>
        {labels[m] || m}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Historial de comprobantes</h1>
            <p className="text-slate-500 text-sm mt-1">Bóveda de facturación electrónica.</p>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-64"
              placeholder="Buscar cliente, RUC, comprobante..." />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-slate-500">
              <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
              Cargando bóveda...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left font-semibold">Comprobante</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Cliente</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                    <th className="px-5 py-3.5 text-center font-semibold">Pago</th>
                    <th className="px-5 py-3.5 text-center font-semibold">SUNAT</th>
                    <th className="px-5 py-3.5 text-center font-semibold">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay comprobantes registrados.'}
                      </td>
                    </tr>
                  ) : filtradas.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="inline-block bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-mono px-2 py-1 rounded-lg">
                          {inv.comprobante || inv.id.split('-')[0]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{inv.fecha || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 max-w-[180px] truncate">
                          {inv.full_name || 'Sin registrar'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{inv.customer_document}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-blue-600">
                        S/ {Number(inv.total_amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center">{metodoPill(inv.payment_method)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          inv.xml_ubl_status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inv.xml_ubl_status === 'ACCEPTED' ? '✓ Aceptado' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => descargarPdf(inv.id, inv.comprobante)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p className="mt-3 text-xs text-slate-400">
            {filtradas.length} comprobante{filtradas.length !== 1 ? 's' : ''}
            {busqueda && ` para "${busqueda}"`}
          </p>
        )}
      </div>
    </div>
  );
}
