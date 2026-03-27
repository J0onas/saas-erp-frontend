'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ReportesPage() {
    const router = useRouter();
    const [metrics, setMetrics]         = useState<any>(null);
    const [monthly, setMonthly]         = useState<any[]>([]);
    const [cargando, setCargando]       = useState(true);
    const [yearSelected, setYearSelected] = useState(new Date().getFullYear());

    // SIRE export
    const [sireMonth, setSireMonth]   = useState(new Date().getMonth() + 1);
    const [sireYear, setSireYear]     = useState(new Date().getFullYear());
    const [exportando, setExportando] = useState<string | null>(null);

    // Ventas export
    const [ventasDesde, setVentasDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [ventasHasta, setVentasHasta] = useState(
        new Date().toISOString().split('T')[0]
    );

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (!raw) { router.push('/login'); return; }
            const user = JSON.parse(raw);
            if (!['GERENTE', 'SUPERADMIN'].includes(user.role)) {
                router.push('/dashboard'); return;
            }
        } catch { router.push('/login'); return; }
        cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yearSelected]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [metricsRes, monthlyRes] = await Promise.all([
                fetch(`${API}/api/v1/invoices/reports/dashboard`, {
                    headers: { Authorization: `Bearer ${token()}` },
                }),
                fetch(`${API}/api/v1/reports/monthly?year=${yearSelected}`, {
                    headers: { Authorization: `Bearer ${token()}` },
                }),
            ]);
            const metricsData = await metricsRes.json();
            const monthlyData = await monthlyRes.json();
            if (metricsData.success) setMetrics(metricsData.data);
            if (monthlyData.success) setMonthly(monthlyData.data);
        } finally { setCargando(false); }
    };

    // ── Descarga CSV directa ──────────────────────────────────────────────────
    const downloadCSV = async (type: 'sire' | 'ventas') => {
        setExportando(type);
        try {
            let url = '';
            let filename = '';

            if (type === 'sire') {
                url = `${API}/api/v1/reports/sire?month=${sireMonth}&year=${sireYear}`;
                filename = `SIRE_${sireYear}${String(sireMonth).padStart(2, '0')}.csv`;
            } else {
                url = `${API}/api/v1/reports/ventas?desde=${ventasDesde}&hasta=${ventasHasta}`;
                filename = `Ventas_${ventasDesde}_${ventasHasta}.csv`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token()}` },
            });

            if (!res.ok) throw new Error('Error en la descarga');

            const blob  = await res.blob();
            const link  = document.createElement('a');
            link.href   = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);

        } catch {
            alert('Error al generar el reporte. Intenta de nuevo.');
        } finally {
            setExportando(null);
        }
    };

    const kpis = metrics?.kpis;

    return (
        <div className="bg-slate-50">
            <Navbar />
            <PageWrapper>
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Reportes</h1>
                            <p className="text-slate-500 text-sm mt-1">Análisis y exportaciones de tu negocio.</p>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin h-7 w-7 border-2 border-slate-200 border-t-blue-600 rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* ── KPIs ─────────────────────────────────────── */}
                            {kpis && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {[
                                        { label: 'Total facturas',    val: kpis.total_invoices,                               color: 'text-blue-600'   },
                                        { label: 'Total facturado',   val: `S/ ${Number(kpis.total_revenue).toFixed(2)}`,     color: 'text-emerald-600'},
                                        { label: 'Ticket promedio',   val: `S/ ${Number(kpis.average_ticket).toFixed(2)}`,    color: 'text-purple-600' },
                                    ].map((kpi) => (
                                        <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{kpi.label}</p>
                                            <p className={`text-2xl sm:text-3xl font-black ${kpi.color}`}>{kpi.val}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Gráficos ─────────────────────────────────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                {metrics?.lastDays?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4">Ventas últimos 7 días</h3>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={metrics.lastDays} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }}/>
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `S/${v}`}/>
                                                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, 'Ventas']}/>
                                                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#grad)" dot={false}/>
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {metrics?.paymentMethods?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4">Métodos de pago</h3>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={metrics.paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                                                        {metrics.paymentMethods.map((_: any, i: number) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                                                        ))}
                                                    </Pie>
                                                    <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}/>
                                                    <Tooltip formatter={(v) => [`S/ ${Number(v).toFixed(2)}`]}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Resumen anual ─────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-bold text-slate-700">Resumen mensual {yearSelected}</h3>
                                    <select value={yearSelected} onChange={(e) => setYearSelected(Number(e.target.value))}
                                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        {[2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                                <th className="px-4 py-3 text-left font-semibold">Mes</th>
                                                <th className="px-4 py-3 text-center font-semibold">Facturas</th>
                                                <th className="px-4 py-3 text-center font-semibold">Boletas</th>
                                                <th className="px-4 py-3 text-center font-semibold hidden sm:table-cell">Anuladas</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total IGV</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total Facturado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {monthly.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                        Sin datos para {yearSelected}
                                                    </td>
                                                </tr>
                                            ) : monthly.map((row) => (
                                                <tr key={row.mes} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{MESES[row.mes]}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{row.facturas}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{row.boletas}</td>
                                                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                        {row.anuladas > 0 && (
                                                            <span className="text-red-500 font-medium">{row.anuladas}</span>
                                                        )}
                                                        {row.anuladas === 0 && <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600">
                                                        S/ {Number(row.total_igv || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                        S/ {Number(row.total_facturado || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {monthly.length > 0 && (
                                                <tr className="bg-slate-50 font-bold">
                                                    <td className="px-4 py-3 text-slate-700">TOTAL</td>
                                                    <td className="px-4 py-3 text-center text-slate-700">
                                                        {monthly.reduce((s, r) => s + r.facturas, 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-700">
                                                        {monthly.reduce((s, r) => s + r.boletas, 0)}
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell" />
                                                    <td className="px-4 py-3 text-right text-slate-700">
                                                        S/ {monthly.reduce((s, r) => s + Number(r.total_igv || 0), 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-blue-700">
                                                        S/ {monthly.reduce((s, r) => s + Number(r.total_facturado || 0), 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── Exportaciones ────────────────────────────── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                                {/* SIRE */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Exportar SIRE</h3>
                                            <p className="text-xs text-slate-500">Formato oficial SUNAT para contadores</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Mes</label>
                                            <select value={sireMonth} onChange={(e) => setSireMonth(Number(e.target.value))}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                                {MESES.slice(1).map((m, i) => (
                                                    <option key={i + 1} value={i + 1}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Año</label>
                                            <select value={sireYear} onChange={(e) => setSireYear(Number(e.target.value))}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => downloadCSV('sire')}
                                        disabled={exportando === 'sire'}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {exportando === 'sire' ? (
                                            <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>Generando...</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Descargar CSV SIRE</>
                                        )}
                                    </button>
                                </div>

                                {/* Reporte de ventas */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Reporte de ventas</h3>
                                            <p className="text-xs text-slate-500">Detalle completo por rango de fechas</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Desde</label>
                                            <input type="date" value={ventasDesde}
                                                onChange={(e) => setVentasDesde(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Hasta</label>
                                            <input type="date" value={ventasHasta}
                                                onChange={(e) => setVentasHasta(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"/>
                                        </div>
                                    </div>
                                    <button onClick={() => downloadCSV('ventas')}
                                        disabled={exportando === 'ventas'}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {exportando === 'ventas' ? (
                                            <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>Generando...</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Descargar CSV Ventas</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageWrapper>
        </div>
    );
}
