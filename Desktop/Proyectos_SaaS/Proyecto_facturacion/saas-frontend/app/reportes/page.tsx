'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as TooltipBar,
  PieChart, Pie, Cell, Tooltip as TooltipPie, Legend, ResponsiveContainer,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function ReportesPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('saas_token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API}/api/v1/invoices/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMetrics(data.data);
      } finally { setCargando(false); }
    };
    load();
  }, [router]);

  const descargarSIRE = async () => {
    const token = localStorage.getItem('saas_token');
    const now = new Date();
    try {
      const res = await fetch(
        `${API}/api/v1/invoices/reports/sire/${now.getFullYear()}/${now.getMonth() + 1}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!data.success || data.data.length === 0) {
        alert('No hay ventas este mes para exportar.'); return;
      }
      const headers = ['Fecha Emision','Tipo','Serie','Correlativo','Tipo Doc','Num Doc','Razon Social','Base Imponible','IGV','Total','Estado SUNAT'];
      const rows = data.data.map((f: any) => [
        f.fecha_emision, f.tipo_comprobante, f.serie, f.correlativo,
        f.tipo_doc_cliente, f.numero_doc_cliente, `"${f.razon_social}"`,
        f.base_imponible, f.igv, f.importe_total, f.estado_sunat,
      ]);
      const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SIRE_${now.getFullYear()}_${now.getMonth() + 1}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch { alert('Error exportando el reporte.'); }
  };

  const KpiCard = ({ label, value, icon, sub }: any) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
    </div>
  );

  return (
    <div className="bg-slate-50">
      <Navbar />

      <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Centro de mando</h1>
            <p className="text-slate-500 text-sm mt-1">Análisis de rendimiento y salud financiera.</p>
          </div>
          <button onClick={descargarSIRE}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar SIRE
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full" />
              Procesando datos...
            </div>
          </div>
        ) : metrics ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Ingresos totales" icon="💰"
                value={`S/ ${Number(metrics.kpis.total_revenue).toFixed(2)}`}
                sub="Suma acumulada de ventas"
              />
              <KpiCard
                label="Operaciones" icon="🧾"
                value={`${metrics.kpis.total_invoices}`}
                sub="Comprobantes emitidos"
              />
              <KpiCard
                label="Ticket promedio" icon="📈"
                value={`S/ ${Number(metrics.kpis.average_ticket).toFixed(2)}`}
                sub="Por transacción"
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Curva de ingresos (últimos 7 días)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.lastDays} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => `S/${v}`} />
                      <TooltipBar
                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,.07)' }}
                        formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, 'Ventas']}
                        labelStyle={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                        fillOpacity={1} fill="url(#grad)" dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-1">Canales de pago</h3>
                <p className="text-xs text-slate-400 mb-3">Distribución por método</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics.paymentMethods} cx="50%" cy="45%"
                        innerRadius={55} outerRadius={78} paddingAngle={4}
                        dataKey="value" stroke="none">
                        {metrics.paymentMethods.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <TooltipPie
                        formatter={(v) => `S/ ${Number(v).toFixed(2)}`}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.07)' }}
                      />
                      <Legend verticalAlign="bottom" height={30} iconType="circle"
                        wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top productos */}
            {metrics.topProducts && metrics.topProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Top productos estrella</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Los artículos que generan más valor al negocio</p>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-semibold w-10">#</th>
                      <th className="px-5 py-3 text-left font-semibold">Producto</th>
                      <th className="px-5 py-3 text-center font-semibold">Unidades</th>
                      <th className="px-5 py-3 text-right font-semibold">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {metrics.topProducts.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-amber-100 text-amber-700'
                            : i === 1 ? 'bg-slate-200 text-slate-600'
                            : i === 2 ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-400'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-5 py-3.5 text-center text-slate-600">{p.sold} un.</td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                          S/ {p.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-bold">Error cargando los datos de reportes.</p>
          </div>
        )}
      </div>
      </PageWrapper>
    </div>
  );
}
