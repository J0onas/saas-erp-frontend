'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_STYLES: Record<string, string> = {
    ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    TRIAL:     'bg-blue-50 text-blue-700 border-blue-200',
    SUSPENDED: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE:    'Activo',
    TRIAL:     'Trial',
    SUSPENDED: 'Suspendido',
};

type Tab = 'metrics' | 'tenants' | 'logs' | 'planes';

function AsignarPlanForm({ planes, token, API, onSuccess }: {
    planes: any[]; token: () => string; API: string; onSuccess?: () => void;
}) {
    const [tenantId, setTenantId] = useState('');
    const [planId, setPlanId]     = useState('');
    const [msg, setMsg]           = useState('');
    const [loading, setLoading]   = useState(false);

    const asignar = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/v1/plans/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ tenantId, planId }),
            });
            const data = await res.json();
            setMsg(data.message);
            if (data.success) { setTenantId(''); setPlanId(''); onSuccess?.(); }
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={asignar} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">UUID del Tenant</label>
                <input type="text" required value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Plan</label>
                <select required value={planId} onChange={(e) => setPlanId(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="">Seleccionar...</option>
                    {planes.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                </select>
            </div>
            <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
                {loading ? 'Asignando...' : 'Asignar plan'}
            </button>
            {msg && <p className="w-full text-sm text-emerald-600 font-medium">{msg}</p>}
        </form>
    );
}

export default function SuperadminPage() {
    const router = useRouter();
    const [tab, setTab]             = useState<Tab>('metrics');
    const [metrics, setMetrics]     = useState<any>(null);
    const [planes, setPlanes]       = useState<any[]>([]);
    const [tenants, setTenants]     = useState<any[]>([]);
    const [logs, setLogs]           = useState<any[]>([]);
    const [cargando, setCargando]   = useState(true);
    const [busqueda, setBusqueda]   = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [tenantDetalle, setTenantDetalle] = useState<any>(null);
    const [procesando, setProcesando] = useState<string | null>(null);
    const [mensaje, setMensaje]     = useState({ tipo: '', texto: '' });

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        // Verificar que sea SUPERADMIN
        try {
            const raw = localStorage.getItem('user_data');
            if (!raw) { router.push('/login'); return; }
            const user = JSON.parse(raw);
            if (user.role !== 'SUPERADMIN') { router.push('/dashboard'); return; }
        } catch { router.push('/login'); return; }

        cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mostrarMsg = (tipo: string, texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    };

    const cargarTodo = async () => {
        setCargando(true);
        await Promise.all([cargarMetrics(), cargarTenants(), cargarLogs(), cargarPlanes()]);
        setCargando(false);
    };

    const cargarMetrics = async () => {
        try {
            const res  = await fetch(`${API}/api/v1/admin/metrics`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setMetrics(data.data);
        } catch { /* */ }
    };

    const cargarTenants = async () => {
        try {
            const params = new URLSearchParams();
            if (filtroStatus) params.set('status', filtroStatus);
            if (busqueda)     params.set('search', busqueda);

            const res  = await fetch(`${API}/api/v1/admin/tenants?${params}`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setTenants(data.data);
        } catch { /* */ }
    };

    const cargarLogs = async () => {
        try {
            const res  = await fetch(`${API}/api/v1/admin/audit-logs?limit=100`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setLogs(data.data);
        } catch { /* */ }
    };

    const cargarPlanes = async () => {
        try {
            const res  = await fetch(`${API}/api/v1/plans`);
            const data = await res.json();
            if (data.success) setPlanes(data.data);
        } catch { }
    };

    const verDetalle = async (tenant: any) => {
        try {
            const res  = await fetch(`${API}/api/v1/admin/tenants/${tenant.id}`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setTenantDetalle(data.data);
        } catch { /* */ }
    };

    const cambiarStatus = async (
        tenantId: string,
        status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
        extendDays?: number
    ) => {
        setProcesando(tenantId);
        try {
            const res  = await fetch(`${API}/api/v1/admin/tenants/${tenantId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ status, extendDays }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', data.message);
                cargarTenants();
                if (tenantDetalle?.id === tenantId) setTenantDetalle(null);
            } else {
                mostrarMsg('err', data.message);
            }
        } finally { setProcesando(null); }
    };

    const KpiCard = ({ label, value, sub, color = 'blue' }: any) => {
        const colors: Record<string, string> = {
            blue:   'text-blue-600 bg-blue-50',
            green:  'text-emerald-600 bg-emerald-50',
            amber:  'text-amber-600 bg-amber-50',
            red:    'text-red-600 bg-red-50',
            purple: 'text-purple-600 bg-purple-50',
        };
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
                <p className={`text-3xl font-black ${colors[color].split(' ')[0]}`}>{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Header fijo */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-slate-900">Panel Superadmin</h1>
                                <p className="text-xs text-slate-400">Control total del SaaS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                SUPERADMIN
                            </span>
                            <button onClick={() => { localStorage.removeItem('saas_token'); localStorage.removeItem('user_data'); router.push('/login'); }}
                                className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium">
                                Salir
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 pb-0">
                        {([
                            { key: 'metrics', label: 'Métricas' },
                            { key: 'tenants', label: 'Tenants' },
                            { key: 'logs',    label: 'Audit Log' },
                            { key: 'planes',  label: 'Planes' },
                        ] as { key: Tab; label: string }[]).map((t) => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                                    tab === t.key
                                        ? 'border-purple-600 text-purple-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {mensaje.texto && (
                    <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                        mensaje.tipo === 'ok'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
                    </div>
                )}

                {cargando ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-purple-600 rounded-full" />
                    </div>
                ) : (
                    <>
                        {/* ── TAB MÉTRICAS ─────────────────────────────────────── */}
                        {tab === 'metrics' && metrics && (
                            <div className="space-y-6">

                                {/* KPIs */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <KpiCard label="Total tenants"  value={metrics.general.total_tenants}    color="purple" />
                                    <KpiCard label="Activos"        value={metrics.general.active_tenants}   color="green"  sub="Con suscripción vigente" />
                                    <KpiCard label="En trial"       value={metrics.general.trial_tenants}    color="blue"   sub="Periodo de prueba" />
                                    <KpiCard label="Suspendidos"    value={metrics.general.suspended_tenants} color="red"   />
                                    <KpiCard label="Nuevos (30d)"   value={metrics.general.new_this_month}   color="amber" sub="Últimos 30 días" />
                                </div>

                                {/* Gráficos */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Crecimiento de tenants */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4">
                                            Nuevos tenants por mes
                                        </h3>
                                        <div className="h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.growthByMonth} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,.07)' }}
                                                        formatter={(v) => [`${v} tenants`, 'Nuevos']}
                                                    />
                                                    <Bar dataKey="nuevos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Ingresos por mes */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4">
                                            Volumen de facturación por mes
                                        </h3>
                                        <div className="h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={metrics.revenueByMonth} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                                                        formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, 'Facturado']}
                                                    />
                                                    <Area type="monotone" dataKey="ingresos" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Top tenants */}
                                {metrics.topTenants?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-700">Top tenants por volumen</h3>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                                    <th className="px-5 py-3 text-left font-semibold">#</th>
                                                    <th className="px-5 py-3 text-left font-semibold">Empresa</th>
                                                    <th className="px-5 py-3 text-center font-semibold">Facturas</th>
                                                    <th className="px-5 py-3 text-right font-semibold">Facturado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {metrics.topTenants.map((t: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-5 py-3.5">
                                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                                                i === 0 ? 'bg-amber-100 text-amber-700'
                                                                : i === 1 ? 'bg-slate-200 text-slate-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                            }`}>{i + 1}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{t.business_name}</td>
                                                        <td className="px-5 py-3.5 text-center text-slate-600">{t.total_invoices}</td>
                                                        <td className="px-5 py-3.5 text-right font-bold text-purple-600">S/ {Number(t.revenue).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB TENANTS ──────────────────────────────────────── */}
                        {tab === 'tenants' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Lista de tenants */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Filtros */}
                                    <div className="flex flex-wrap gap-3">
                                        <input type="text" value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && cargarTenants()}
                                            className="flex-1 min-w-48 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                                            placeholder="Buscar por nombre o RUC..." />
                                        <select value={filtroStatus}
                                            onChange={(e) => { setFiltroStatus(e.target.value); setTimeout(cargarTenants, 0); }}
                                            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                            <option value="">Todos</option>
                                            <option value="ACTIVE">Activos</option>
                                            <option value="TRIAL">En trial</option>
                                            <option value="SUSPENDED">Suspendidos</option>
                                        </select>
                                        <button onClick={cargarTenants}
                                            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition">
                                            Buscar
                                        </button>
                                    </div>

                                    {/* Tabla */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                                    <th className="px-5 py-3.5 text-left font-semibold">Empresa</th>
                                                    <th className="px-5 py-3.5 text-center font-semibold">Estado</th>
                                                    <th className="px-5 py-3.5 text-center font-semibold">Facturas</th>
                                                    <th className="px-5 py-3.5 text-center font-semibold">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {tenants.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                                                            No hay tenants registrados.
                                                        </td>
                                                    </tr>
                                                ) : tenants.map((t) => (
                                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="font-semibold text-slate-800">{t.business_name}</div>
                                                            <div className="text-xs font-mono text-slate-400 mt-0.5">RUC: {t.ruc}</div>
                                                            {t.plan_name && (
                                                                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                                                                    {t.plan_name}
                                                                </span>
                                                            )}
                                                            <div className="text-xs text-slate-400">Desde: {t.created_at}</div>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                                STATUS_STYLES[t.subscription_status] || STATUS_STYLES.TRIAL
                                                            }`}>
                                                                {STATUS_LABELS[t.subscription_status] || t.subscription_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className="font-bold text-slate-700">{t.total_invoices}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button onClick={() => verDetalle(t)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 transition text-xs font-medium">
                                                                    Detalle
                                                                </button>
                                                                {t.subscription_status !== 'ACTIVE' ? (
                                                                    <button
                                                                        onClick={() => cambiarStatus(t.id, 'ACTIVE', 30)}
                                                                        disabled={procesando === t.id}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-medium disabled:opacity-50">
                                                                        Activar
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => cambiarStatus(t.id, 'SUSPENDED')}
                                                                        disabled={procesando === t.id}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition text-xs font-medium disabled:opacity-50">
                                                                        Suspender
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                                            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel detalle tenant */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-sm font-bold text-slate-700">
                                            {tenantDetalle ? tenantDetalle.business_name : 'Detalle del tenant'}
                                        </h3>
                                        {!tenantDetalle && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Haz clic en "Detalle" de un tenant
                                            </p>
                                        )}
                                    </div>

                                    {tenantDetalle ? (
                                        <div className="p-5 space-y-4">
                                            <div className="space-y-2">
                                                {[
                                                    { label: 'RUC', value: tenantDetalle.ruc },
                                                    { label: 'Estado', value: STATUS_LABELS[tenantDetalle.subscription_status] },
                                                    { label: 'Válido hasta', value: tenantDetalle.subscription_valid_until ? new Date(tenantDetalle.subscription_valid_until).toLocaleDateString('es-PE') : '—' },
                                                    { label: 'Usuarios', value: tenantDetalle.total_users },
                                                    { label: 'Facturas', value: tenantDetalle.total_invoices },
                                                    { label: 'Productos', value: tenantDetalle.total_products },
                                                    { label: 'Facturado', value: `S/ ${Number(tenantDetalle.total_revenue || 0).toFixed(2)}` },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex justify-between text-sm">
                                                        <span className="text-slate-500 font-medium">{item.label}</span>
                                                        <span className="font-semibold text-slate-800">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Acciones rápidas */}
                                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase">Acciones rápidas</p>
                                                <button onClick={() => cambiarStatus(tenantDetalle.id, 'ACTIVE', 30)}
                                                    disabled={procesando === tenantDetalle.id}
                                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                                                    Activar 30 días más
                                                </button>
                                                <button onClick={() => cambiarStatus(tenantDetalle.id, 'TRIAL', 14)}
                                                    disabled={procesando === tenantDetalle.id}
                                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                                                    Dar 14 días de trial
                                                </button>
                                                <button onClick={() => cambiarStatus(tenantDetalle.id, 'SUSPENDED')}
                                                    disabled={procesando === tenantDetalle.id}
                                                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition disabled:opacity-50">
                                                    Suspender acceso
                                                </button>
                                            </div>

                                            {/* Últimas facturas */}
                                            {tenantDetalle.recentInvoices?.length > 0 && (
                                                <div className="border-t border-slate-100 pt-4">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Últimas facturas</p>
                                                    <div className="space-y-1.5">
                                                        {tenantDetalle.recentInvoices.map((inv: any) => (
                                                            <div key={inv.id} className="flex justify-between text-xs">
                                                                <span className="text-slate-500">{inv.fecha}</span>
                                                                <span className="font-bold text-purple-600">S/ {Number(inv.total_amount).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm">
                                            Selecciona un tenant para ver su información
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── TAB AUDIT LOGS ───────────────────────────────────── */}
                        {tab === 'logs' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700">Registro de actividad</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Últimas 100 acciones del sistema</p>
                                    </div>
                                    <button onClick={cargarLogs}
                                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
                                        Actualizar
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                                <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                                                <th className="px-5 py-3 text-left font-semibold">Acción</th>
                                                <th className="px-5 py-3 text-left font-semibold">Usuario</th>
                                                <th className="px-5 py-3 text-left font-semibold">Empresa</th>
                                                <th className="px-5 py-3 text-left font-semibold">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {logs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                                        No hay registros de actividad aún.
                                                    </td>
                                                </tr>
                                            ) : logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                                                        {log.fecha}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                            {log.action}
                                                        </span>
                                                        {log.entity && (
                                                            <span className="ml-1 text-xs text-slate-400">{log.entity}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-xs text-slate-700 font-medium">
                                                        {log.user_name || log.user_email || '—'}
                                                    </td>
                                                    <td className="px-5 py-3 text-xs text-slate-600">
                                                        {log.tenant_name || '—'}
                                                    </td>
                                                    <td className="px-5 py-3 text-xs font-mono text-slate-400">
                                                        {log.ip_address || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {tab === 'planes' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {planes.map((plan) => (
                                        <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase">{plan.name}</span>
                                                    <h3 className="font-black text-slate-900">{plan.display_name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-purple-600">S/ {plan.price_monthly}</p>
                                                    <p className="text-xs text-slate-400">/mes</p>
                                                </div>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                {[
                                                    { label: 'Usuarios',     val: plan.max_users       === -1 ? 'Ilimitados' : plan.max_users },
                                                    { label: 'Productos',    val: plan.max_products    === -1 ? 'Ilimitados' : plan.max_products },
                                                    { label: 'Facturas/mes', val: plan.max_invoices_mo === -1 ? 'Ilimitadas' : plan.max_invoices_mo },
                                                    { label: 'Precio anual', val: `S/ ${plan.price_yearly}` },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex justify-between text-sm">
                                                        <span className="text-slate-500">{item.label}</span>
                                                        <span className="font-bold text-slate-800">{item.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-700 mb-4">Asignar plan a tenant</h3>
                                    <AsignarPlanForm planes={planes} token={token} API={API!} onSuccess={cargarTenants} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
