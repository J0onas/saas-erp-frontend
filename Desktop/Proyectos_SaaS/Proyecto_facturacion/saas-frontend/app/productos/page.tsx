'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductosPage() {
    const router = useRouter();
    const [productos, setProductos] = useState<any[]>([]);
    const [cargando, setCargando]   = useState(true);
    const [busqueda, setBusqueda]   = useState('');
    const [userRole, setUserRole]   = useState('CAJERO');
    const [mensaje, setMensaje]     = useState({ tipo: '', texto: '' });

    // Modal nuevo producto
    const [modalNuevo, setModalNuevo] = useState(false);
    const [formNuevo, setFormNuevo]   = useState({ name: '', unit_price: '', stock: '' });
    const [guardando, setGuardando]   = useState(false);

    // Modal ingreso de mercancía
    const [modalIngreso, setModalIngreso]   = useState<any>(null);
    const [formIngreso, setFormIngreso]     = useState({ quantity: '', reason: '', supplierName: '' });
    const [procesandoIngreso, setProcesandoIngreso] = useState(false);

    // Modal ajuste de stock
    const [modalAjuste, setModalAjuste]   = useState<any>(null);
    const [formAjuste, setFormAjuste]     = useState({ newStock: '', reason: '' });
    const [procesandoAjuste, setProcesandoAjuste] = useState(false);

    // Panel movimientos
    const [movimientos, setMovimientos]     = useState<any[]>([]);
    const [cargandoMov, setCargandoMov]     = useState(false);
    const [productoMovs, setProductoMovs]   = useState<any>(null);

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (raw) setUserRole(JSON.parse(raw).role || 'CAJERO');
        } catch { /* */ }
        cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mostrarMensaje = (tipo: string, texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    };

    const cargarProductos = async () => {
        setCargando(true);
        try {
            const res = await fetch(`${API}/api/v1/products`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setProductos(data.data);
        } finally { setCargando(false); }
    };

    const guardarProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const res = await fetch(`${API}/api/v1/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({
                    name: formNuevo.name,
                    unit_price: Number(formNuevo.unit_price),
                    stock: Number(formNuevo.stock),
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensaje('ok', 'Producto registrado correctamente.');
                setModalNuevo(false);
                setFormNuevo({ name: '', unit_price: '', stock: '' });
                cargarProductos();
            } else {
                mostrarMensaje('err', 'Error al guardar el producto.');
            }
        } finally { setGuardando(false); }
    };

    const registrarIngreso = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcesandoIngreso(true);
        try {
            const res = await fetch(`${API}/api/v1/inventory/entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({
                    productId: modalIngreso.id,
                    quantity: Number(formIngreso.quantity),
                    reason: formIngreso.reason || undefined,
                    supplierName: formIngreso.supplierName || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensaje('ok', data.message);
                setModalIngreso(null);
                setFormIngreso({ quantity: '', reason: '', supplierName: '' });
                cargarProductos();
            } else {
                mostrarMensaje('err', data.message || 'Error al registrar ingreso.');
            }
        } finally { setProcesandoIngreso(false); }
    };

    const registrarAjuste = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcesandoAjuste(true);
        try {
            const res = await fetch(`${API}/api/v1/inventory/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({
                    productId: modalAjuste.id,
                    newStock: Number(formAjuste.newStock),
                    reason: formAjuste.reason,
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensaje('ok', data.message);
                setModalAjuste(null);
                setFormAjuste({ newStock: '', reason: '' });
                cargarProductos();
            } else {
                mostrarMensaje('err', data.message || 'Error al ajustar stock.');
            }
        } finally { setProcesandoAjuste(false); }
    };

    const verMovimientos = async (producto: any) => {
        setProductoMovs(producto);
        setCargandoMov(true);
        try {
            const res = await fetch(
                `${API}/api/v1/inventory/movements?productId=${producto.id}`,
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            const data = await res.json();
            if (data.success) setMovimientos(data.data);
        } finally { setCargandoMov(false); }
    };

    const productosFiltrados = productos.filter((p) =>
        p.name.toLowerCase().includes(busqueda.toLowerCase())
    );

    const stockBadge = (stock: number) => {
        const s = Number(stock ?? 0);
        if (s <= 0)  return { label: 'Agotado', cls: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500' };
        if (s <= 10) return { label: `${s} — Bajo`, cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
        return         { label: `${s} en stock`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    };

    const tipoMovIcon = (tipo: string) => {
        if (tipo === 'INPUT')   return { icon: '↑', cls: 'text-emerald-700 bg-emerald-100' };
        if (tipo === 'OUTPUT')  return { icon: '↓', cls: 'text-red-600 bg-red-100' };
        if (tipo === 'RETURN')  return { icon: '↩', cls: 'text-blue-600 bg-blue-100' };
        return                         { icon: '⇄', cls: 'text-amber-700 bg-amber-100' };
    };

    const esGerente = ['GERENTE', 'SUPERADMIN'].includes(userRole);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Catálogo e inventario</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Control de existencias y precios del negocio.
                        </p>
                    </div>
                    {esGerente && (
                        <button onClick={() => setModalNuevo(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                                text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo producto
                        </button>
                    )}
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

                <input type="text" value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="mb-4 w-full sm:w-72 px-4 py-2.5 border border-slate-200 rounded-xl
                        text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500
                        focus:outline-none transition"
                    placeholder="🔍 Buscar producto..." />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Tabla principal */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {cargando ? (
                            <div className="p-10 flex items-center justify-center text-slate-500">
                                <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
                                Cargando inventario...
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500
                                        text-xs uppercase tracking-wider">
                                        <th className="px-5 py-3.5 text-left font-semibold">Producto</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Precio</th>
                                        <th className="px-5 py-3.5 text-center font-semibold">Stock</th>
                                        {esGerente && (
                                            <th className="px-5 py-3.5 text-center font-semibold">Acciones</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {productosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                                                {busqueda
                                                    ? `Sin resultados para "${busqueda}"`
                                                    : 'No hay productos registrados.'}
                                            </td>
                                        </tr>
                                    ) : productosFiltrados.map((prod) => {
                                        const b = stockBadge(Number(prod.stock_quantity ?? prod.stock ?? 0));
                                        return (
                                            <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 font-semibold text-slate-800">
                                                    {prod.name}
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-blue-600">
                                                    S/ {Number(prod.unit_price).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1
                                                        rounded-full text-xs font-semibold border ${b.cls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                                        {b.label}
                                                    </span>
                                                </td>
                                                {esGerente && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Ingresar stock */}
                                                            <button
                                                                onClick={() => {
                                                                    setModalIngreso(prod);
                                                                    setFormIngreso({ quantity: '', reason: '', supplierName: '' });
                                                                }}
                                                                title="Ingresar mercancía"
                                                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700
                                                                    hover:bg-emerald-100 border border-emerald-200 transition text-xs font-bold">
                                                                +Stock
                                                            </button>
                                                            {/* Ajustar */}
                                                            <button
                                                                onClick={() => {
                                                                    setModalAjuste(prod);
                                                                    setFormAjuste({
                                                                        newStock: String(prod.stock_quantity ?? prod.stock ?? 0),
                                                                        reason: ''
                                                                    });
                                                                }}
                                                                title="Ajustar stock"
                                                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700
                                                                    hover:bg-amber-100 border border-amber-200 transition text-xs font-bold">
                                                                Ajustar
                                                            </button>
                                                            {/* Historial */}
                                                            <button
                                                                onClick={() => verMovimientos(prod)}
                                                                title="Ver movimientos"
                                                                className="p-1.5 rounded-lg bg-slate-50 text-slate-600
                                                                    hover:bg-slate-100 border border-slate-200 transition text-xs font-bold">
                                                                Kardex
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {!cargando && (
                            <div className="px-5 py-3 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
                                <span>{productosFiltrados.length} productos</span>
                                <span>·</span>
                                <span className="text-red-400 font-medium">
                                    {productos.filter(p => Number(p.stock_quantity ?? p.stock ?? 0) <= 0).length} agotados
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Panel Kardex */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-700">
                                {productoMovs ? `Kardex — ${productoMovs.name}` : 'Kardex de movimientos'}
                            </h3>
                            {!productoMovs && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Haz clic en "Kardex" de cualquier producto
                                </p>
                            )}
                        </div>
                        <div className="overflow-y-auto max-h-[420px]">
                            {cargandoMov ? (
                                <div className="p-6 flex items-center justify-center text-slate-400 text-sm">
                                    <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-blue-600 rounded-full mr-2" />
                                    Cargando...
                                </div>
                            ) : movimientos.length === 0 && productoMovs ? (
                                <div className="p-6 text-center text-slate-400 text-sm">
                                    Sin movimientos registrados.
                                </div>
                            ) : movimientos.map((mov) => {
                                const ic = tipoMovIcon(mov.type);
                                return (
                                    <div key={mov.id}
                                        className="flex items-start gap-3 px-4 py-3 border-b
                                            border-slate-50 hover:bg-slate-50 transition-colors">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center
                                            text-sm font-bold flex-shrink-0 ${ic.cls}`}>
                                            {ic.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {mov.type}
                                                </span>
                                                <span className="text-xs font-bold text-slate-800 ml-2">
                                                    {mov.quantity} un.
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                {mov.reason}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">{mov.fecha}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL NUEVO PRODUCTO ───────────────────────────────────────── */}
            {modalNuevo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">Registrar producto</h2>
                            <button onClick={() => setModalNuevo(false)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={guardarProducto} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Nombre o descripción
                                </label>
                                <input type="text" required value={formNuevo.name}
                                    onChange={(e) => setFormNuevo(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-blue-500 focus:outline-none transition"
                                    placeholder="Ej. Teclado mecánico Redragon" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Precio de venta
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-slate-400 text-sm">S/</span>
                                        <input type="number" required step="0.01" min="0"
                                            value={formNuevo.unit_price}
                                            onChange={(e) => setFormNuevo(p => ({ ...p, unit_price: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3
                                                text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                                focus:ring-blue-500 focus:outline-none transition"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Stock inicial
                                    </label>
                                    <input type="number" required min="0"
                                        value={formNuevo.stock}
                                        onChange={(e) => setFormNuevo(p => ({ ...p, stock: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3
                                            text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                            focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="0" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalNuevo(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700
                                        py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white
                                        py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL INGRESO DE MERCANCÍA ─────────────────────────────────── */}
            {modalIngreso && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-emerald-500">
                        <h2 className="text-lg font-black text-slate-800 mb-1">Ingresar mercancía</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Producto: <strong>{modalIngreso.name}</strong> · Stock actual:{' '}
                            <strong>{modalIngreso.stock_quantity ?? modalIngreso.stock ?? 0}</strong>
                        </p>
                        <form onSubmit={registrarIngreso} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Cantidad a ingresar *
                                </label>
                                <input type="number" required min="1"
                                    value={formIngreso.quantity}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, quantity: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800
                                        text-lg font-bold bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Proveedor (opcional)
                                </label>
                                <input type="text"
                                    value={formIngreso.supplierName}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, supplierName: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="Ej. Distribuidora Lima SAC" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Motivo (opcional)
                                </label>
                                <input type="text"
                                    value={formIngreso.reason}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="Ej. Compra orden #123" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button"
                                    onClick={() => setModalIngreso(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700
                                        py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesandoIngreso}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white
                                        py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {procesandoIngreso ? 'Registrando...' : 'Registrar entrada'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL AJUSTE DE STOCK ──────────────────────────────────────── */}
            {modalAjuste && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-amber-500">
                        <h2 className="text-lg font-black text-slate-800 mb-1">Ajuste de inventario</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Producto: <strong>{modalAjuste.name}</strong> · Stock actual:{' '}
                            <strong>{modalAjuste.stock_quantity ?? modalAjuste.stock ?? 0}</strong>
                        </p>
                        <form onSubmit={registrarAjuste} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Stock físico real contado *
                                </label>
                                <input type="number" required min="0"
                                    value={formAjuste.newStock}
                                    onChange={(e) => setFormAjuste(p => ({ ...p, newStock: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800
                                        text-lg font-bold bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-amber-400 focus:outline-none transition"
                                    placeholder="0" />
                                {formAjuste.newStock !== '' && (
                                    <p className={`text-xs mt-1 font-medium ${
                                        Number(formAjuste.newStock) > Number(modalAjuste.stock_quantity ?? 0)
                                            ? 'text-emerald-600'
                                            : Number(formAjuste.newStock) < Number(modalAjuste.stock_quantity ?? 0)
                                            ? 'text-red-500'
                                            : 'text-slate-400'
                                    }`}>
                                        Diferencia:{' '}
                                        {Number(formAjuste.newStock) - Number(modalAjuste.stock_quantity ?? 0) >= 0 ? '+' : ''}
                                        {Number(formAjuste.newStock) - Number(modalAjuste.stock_quantity ?? 0)} unidades
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Justificación *
                                </label>
                                <input type="text" required minLength={5}
                                    value={formAjuste.reason}
                                    onChange={(e) => setFormAjuste(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-amber-400 focus:outline-none transition"
                                    placeholder="Ej. Conteo físico mensual, merma por vencimiento..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button"
                                    onClick={() => setModalAjuste(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700
                                        py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesandoAjuste}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white
                                        py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {procesandoAjuste ? 'Ajustando...' : 'Confirmar ajuste'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
