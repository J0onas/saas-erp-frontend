'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const API = process.env.NEXT_PUBLIC_API_URL;

const FORM_VACIO = { name: '', address: '', phone: '' };

type Vista = 'lista' | 'stock' | 'transferir' | 'stats';

export default function SucursalesPage() {
    const router = useRouter();
    const [sucursales, setSucursales]   = useState<any[]>([]);
    const [cargando, setCargando]       = useState(true);
    const [mensaje, setMensaje]         = useState({ tipo: '', texto: '' });

    const [modalForm, setModalForm]     = useState<'crear' | 'editar' | null>(null);
    const [sucEditar, setSucEditar]     = useState<any>(null);
    const [form, setForm]               = useState({ ...FORM_VACIO });
    const [guardando, setGuardando]     = useState(false);

    // Panel lateral
    const [sucSeleccionada, setSucSeleccionada] = useState<any>(null);
    const [vista, setVista]             = useState<Vista>('stock');
    const [stockData, setStockData]     = useState<any[]>([]);
    const [statsData, setStatsData]     = useState<any>(null);
    const [cargandoPanel, setCargandoPanel] = useState(false);

    // Transferencia
    const [transferForm, setTransferForm] = useState({
        fromBranchId: '', toBranchId: '', productId: '', quantity: '',
    });
    const [transfiriendo, setTransfiriendo] = useState(false);

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
        cargarSucursales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mostrarMsg = (tipo: string, texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    };

    const cargarSucursales = async () => {
        setCargando(true);
        try {
            const res  = await fetch(`${API}/api/v1/branches`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setSucursales(data.data);
        } finally { setCargando(false); }
    };

    const abrirCrear = () => {
        setForm({ ...FORM_VACIO });
        setSucEditar(null);
        setModalForm('crear');
    };

    const abrirEditar = (suc: any) => {
        setForm({ name: suc.name, address: suc.address || '', phone: suc.phone || '' });
        setSucEditar(suc);
        setModalForm('editar');
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const isEditar = modalForm === 'editar' && sucEditar;
            const url    = isEditar
                ? `${API}/api/v1/branches/${sucEditar.id}`
                : `${API}/api/v1/branches`;
            const res = await fetch(url, {
                method: isEditar ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', data.message);
                setModalForm(null);
                cargarSucursales();
            } else {
                mostrarMsg('err', data.message || 'Error al guardar.');
            }
        } finally { setGuardando(false); }
    };

    const toggleActivo = async (suc: any) => {
        if (suc.is_main) { mostrarMsg('err', 'No puedes desactivar la sucursal principal.'); return; }
        const res = await fetch(`${API}/api/v1/branches/${suc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ is_active: !suc.is_active }),
        });
        const data = await res.json();
        if (data.success) { mostrarMsg('ok', data.message); cargarSucursales(); }
    };

    const seleccionarSucursal = async (suc: any, v: Vista = 'stock') => {
        setSucSeleccionada(suc);
        setVista(v);
        setCargandoPanel(true);
        try {
            if (v === 'stock' || v === 'transferir') {
                const res  = await fetch(`${API}/api/v1/branches/${suc.id}/stock`, {
                    headers: { Authorization: `Bearer ${token()}` },
                });
                const data = await res.json();
                if (data.success) setStockData(data.data);
                if (v === 'transferir') {
                    setTransferForm(p => ({ ...p, fromBranchId: suc.id, toBranchId: '', productId: '', quantity: '' }));
                }
            } else if (v === 'stats') {
                const res  = await fetch(`${API}/api/v1/branches/${suc.id}/stats`, {
                    headers: { Authorization: `Bearer ${token()}` },
                });
                const data = await res.json();
                if (data.success) setStatsData(data.data);
            }
        } finally { setCargandoPanel(false); }
    };

    const realizarTransferencia = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransfiriendo(true);
        try {
            const res = await fetch(`${API}/api/v1/branches/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({
                    fromBranchId: transferForm.fromBranchId,
                    toBranchId:   transferForm.toBranchId,
                    productId:    transferForm.productId,
                    quantity:     Number(transferForm.quantity),
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', data.message);
                setTransferForm(p => ({ ...p, toBranchId: '', productId: '', quantity: '' }));
                seleccionarSucursal(sucSeleccionada, 'transferir');
                cargarSucursales();
            } else {
                mostrarMsg('err', data.message);
            }
        } finally { setTransfiriendo(false); }
    };

    return (
        <div className="bg-slate-50">
            <Navbar />
            <PageWrapper>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Sucursales</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Gestiona tus puntos de venta y stock por ubicación.
                            </p>
                        </div>
                        <button onClick={abrirCrear}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                                text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva sucursal
                        </button>
                    </div>

                    {mensaje.texto && (
                        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                            mensaje.tipo === 'ok'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                            {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Lista de sucursales */}
                        <div className="lg:col-span-1 space-y-3">
                            {cargando ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 flex justify-center">
                                    <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full" />
                                </div>
                            ) : sucursales.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                                    No hay sucursales registradas.
                                </div>
                            ) : sucursales.map((suc) => (
                                <div key={suc.id}
                                    className={`bg-white rounded-2xl border transition-all cursor-pointer ${
                                        sucSeleccionada?.id === suc.id
                                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                                    } ${!suc.is_active ? 'opacity-60' : ''}`}
                                    onClick={() => seleccionarSucursal(suc, 'stock')}>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-800 truncate">{suc.name}</h3>
                                                    {suc.is_main && (
                                                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md flex-shrink-0">
                                                            PRINCIPAL
                                                        </span>
                                                    )}
                                                </div>
                                                {suc.address && (
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{suc.address}</p>
                                                )}
                                                {suc.phone && (
                                                    <p className="text-xs text-slate-400">{suc.phone}</p>
                                                )}
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                suc.is_active
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {suc.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                        {/* Métricas rápidas */}
                                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                                            {[
                                                { label: 'Usuarios', val: suc.total_users },
                                                { label: 'Facturas', val: suc.total_invoices },
                                                { label: 'Facturado', val: `S/${Number(suc.total_revenue).toFixed(0)}` },
                                            ].map((item) => (
                                                <div key={item.label} className="text-center">
                                                    <p className="text-xs font-black text-slate-800">{item.val}</p>
                                                    <p className="text-[10px] text-slate-400">{item.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => abrirEditar(suc)}
                                                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition">
                                                Editar
                                            </button>
                                            <button onClick={() => seleccionarSucursal(suc, 'transferir')}
                                                className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium transition">
                                                Transferir
                                            </button>
                                            <button onClick={() => seleccionarSucursal(suc, 'stats')}
                                                className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg text-xs font-medium transition">
                                                Stats
                                            </button>
                                            {!suc.is_main && (
                                                <button onClick={() => toggleActivo(suc)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                                                        suc.is_active
                                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    }`}>
                                                    {suc.is_active ? 'Desactivar' : 'Activar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Panel derecho */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {!sucSeleccionada ? (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                        </svg>
                                        <p className="text-sm">Selecciona una sucursal para ver su información</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Header del panel */}
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-800">{sucSeleccionada.name}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">{sucSeleccionada.address || 'Sin dirección'}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {(['stock', 'transferir', 'stats'] as Vista[]).map((v) => (
                                                <button key={v}
                                                    onClick={() => seleccionarSucursal(sucSeleccionada, v)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                        vista === v
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}>
                                                    {v === 'stock' ? 'Stock' : v === 'transferir' ? 'Transferir' : 'Estadísticas'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {cargandoPanel ? (
                                        <div className="p-10 flex justify-center">
                                            <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* VISTA STOCK */}
                                            {vista === 'stock' && (
                                                <div className="overflow-auto max-h-[520px]">
                                                    <table className="w-full text-sm">
                                                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                                                            <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                                                <th className="px-5 py-3 text-left font-semibold">Producto</th>
                                                                <th className="px-5 py-3 text-center font-semibold">Stock sucursal</th>
                                                                <th className="px-5 py-3 text-center font-semibold">Stock total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {stockData.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                                                                        Sin productos registrados.
                                                                    </td>
                                                                </tr>
                                                            ) : stockData.map((item) => {
                                                                const branchQty = Number(item.branch_quantity);
                                                                const stockOk = branchQty > 5;
                                                                const stockLow = branchQty > 0 && branchQty <= 5;
                                                                return (
                                                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="px-5 py-3.5">
                                                                            <div className="font-medium text-slate-800">{item.name}</div>
                                                                            {item.category_name && (
                                                                                <div className="text-xs text-slate-400">{item.category_name}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-center">
                                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                                                                                branchQty <= 0
                                                                                    ? 'bg-red-100 text-red-600'
                                                                                    : stockLow
                                                                                    ? 'bg-amber-100 text-amber-700'
                                                                                    : 'bg-emerald-100 text-emerald-700'
                                                                            }`}>
                                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                                    branchQty <= 0 ? 'bg-red-500' : stockLow ? 'bg-amber-500' : 'bg-emerald-500'
                                                                                }`} />
                                                                                {branchQty} un.
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-center text-slate-500 text-sm font-medium">
                                                                            {Number(item.total_quantity)} un.
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* VISTA TRANSFERIR */}
                                            {vista === 'transferir' && (
                                                <div className="p-6">
                                                    <p className="text-sm text-slate-500 mb-5">
                                                        Transfiere stock desde <strong>{sucSeleccionada.name}</strong> hacia otra sucursal.
                                                    </p>
                                                    <form onSubmit={realizarTransferencia} className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                                Sucursal destino *
                                                            </label>
                                                            <select required
                                                                value={transferForm.toBranchId}
                                                                onChange={(e) => setTransferForm(p => ({ ...p, toBranchId: e.target.value }))}
                                                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                                                <option value="">Seleccionar sucursal...</option>
                                                                {sucursales
                                                                    .filter(s => s.id !== sucSeleccionada.id && s.is_active)
                                                                    .map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                                Producto *
                                                            </label>
                                                            <select required
                                                                value={transferForm.productId}
                                                                onChange={(e) => setTransferForm(p => ({ ...p, productId: e.target.value }))}
                                                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                                                <option value="">Seleccionar producto...</option>
                                                                {stockData
                                                                    .filter(item => Number(item.branch_quantity) > 0)
                                                                    .map(item => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {item.name} — {item.branch_quantity} disponibles
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                                Cantidad *
                                                            </label>
                                                            <input type="number" required min="1"
                                                                value={transferForm.quantity}
                                                                onChange={(e) => setTransferForm(p => ({ ...p, quantity: e.target.value }))}
                                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                                                placeholder="0" />
                                                        </div>
                                                        <button type="submit" disabled={transfiriendo}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                                            {transfiriendo ? 'Transfiriendo...' : 'Confirmar transferencia'}
                                                        </button>
                                                    </form>
                                                </div>
                                            )}

                                            {/* VISTA STATS */}
                                            {vista === 'stats' && statsData && (
                                                <div className="p-6 space-y-5">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {[
                                                            { label: 'Facturas totales', val: statsData.stats.total_invoices },
                                                            { label: 'Facturado total',  val: `S/ ${Number(statsData.stats.total_revenue).toFixed(2)}` },
                                                            { label: 'Ticket promedio',  val: `S/ ${Number(statsData.stats.avg_ticket).toFixed(2)}` },
                                                        ].map((kpi) => (
                                                            <div key={kpi.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                                                                <p className="text-xl font-black text-blue-600">{kpi.val}</p>
                                                                <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {statsData.lastDays?.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Últimos 7 días</p>
                                                            <div className="space-y-2">
                                                                {statsData.lastDays.map((d: any) => {
                                                                    const max = Math.max(...statsData.lastDays.map((x: any) => Number(x.total)));
                                                                    const pct = max > 0 ? (Number(d.total) / max) * 100 : 0;
                                                                    return (
                                                                        <div key={d.date} className="flex items-center gap-3">
                                                                            <span className="text-xs font-mono text-slate-400 w-12">{d.date}</span>
                                                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                                                <div className="bg-blue-500 h-2 rounded-full transition-all"
                                                                                    style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-700 w-20 text-right">
                                                                                S/ {Number(d.total).toFixed(0)}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(!statsData.lastDays || statsData.lastDays.length === 0) && (
                                                        <div className="text-center text-slate-400 text-sm py-4">
                                                            Sin ventas registradas en esta sucursal.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </PageWrapper>

            {/* ── MODAL CREAR / EDITAR ──────────────────────────────────────── */}
            {modalForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">
                                {modalForm === 'crear' ? 'Nueva sucursal' : `Editar — ${sucEditar?.name}`}
                            </h2>
                            <button onClick={() => setModalForm(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={guardar} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Nombre de la sucursal *
                                </label>
                                <input type="text" required value={form.name}
                                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    placeholder="Ej. Sucursal Miraflores" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dirección</label>
                                <input type="text" value={form.address}
                                    onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    placeholder="Av. Larco 123, Miraflores" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono</label>
                                <input type="text" value={form.phone}
                                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    placeholder="+51 999 999 999" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalForm(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando ? 'Guardando...' : modalForm === 'crear' ? 'Crear sucursal' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
