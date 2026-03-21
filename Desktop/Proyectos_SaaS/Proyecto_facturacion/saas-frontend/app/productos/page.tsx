'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL;

const COLORES_CATEGORIA = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

export default function ProductosPage() {
    const router = useRouter();
    const [productos, setProductos]     = useState<any[]>([]);
    const [categorias, setCategorias]   = useState<any[]>([]);
    const [cargando, setCargando]       = useState(true);
    const [busqueda, setBusqueda]       = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [userRole, setUserRole]       = useState('CAJERO');
    const [mensaje, setMensaje]         = useState({ tipo: '', texto: '' });

    // Modales
    const [modalNuevo, setModalNuevo]   = useState(false);
    const [modalEditar, setModalEditar] = useState<any>(null);
    const [modalCategoria, setModalCategoria] = useState(false);
    const [modalIngreso, setModalIngreso]     = useState<any>(null);
    const [modalAjuste, setModalAjuste]       = useState<any>(null);

    // Forms
    const [formNuevo, setFormNuevo]   = useState({
        name: '', unit_price: '', stock: '',
        barcode: '', sku: '', category_id: '',
    });
    const [formEditar, setFormEditar] = useState({
        name: '', unit_price: '', barcode: '', sku: '',
        category_id: '', min_stock: '',
    });
    const [formCat, setFormCat]       = useState({ name: '', color: '#3b82f6' });
    const [formIngreso, setFormIngreso] = useState({ quantity: '', reason: '', supplierName: '' });
    const [formAjuste, setFormAjuste]   = useState({ newStock: '', reason: '' });

    const [guardando, setGuardando]         = useState(false);
    const [procesando, setProcesando]       = useState(false);

    // Kardex
    const [movimientos, setMovimientos]   = useState<any[]>([]);
    const [cargandoMov, setCargandoMov]   = useState(false);
    const [productoMovs, setProductoMovs] = useState<any>(null);

    const token = () => localStorage.getItem('saas_token') || '';
    const esGerente = ['GERENTE', 'SUPERADMIN'].includes(userRole);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (raw) setUserRole(JSON.parse(raw).role || 'CAJERO');
        } catch { /**/ }
        cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mostrarMsg = (tipo: string, texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    };

    const cargarTodo = async () => {
        setCargando(true);
        await Promise.all([cargarProductos(), cargarCategorias()]);
        setCargando(false);
    };

    const cargarProductos = async (catId?: string) => {
        const url = catId
            ? `${API}/api/v1/products?categoryId=${catId}`
            : `${API}/api/v1/products`;
        const res  = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
        const data = await res.json();
        if (data.success) setProductos(data.data);
    };

    const cargarCategorias = async () => {
        const res  = await fetch(`${API}/api/v1/categories`, {
            headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        if (data.success) setCategorias(data.data);
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
                    barcode: formNuevo.barcode || undefined,
                    sku: formNuevo.sku || undefined,
                    category_id: formNuevo.category_id || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', 'Producto registrado correctamente.');
                setModalNuevo(false);
                setFormNuevo({ name: '', unit_price: '', stock: '', barcode: '', sku: '', category_id: '' });
                cargarProductos(filtroCategoria || undefined);
            } else {
                mostrarMsg('err', 'Error al guardar el producto.');
            }
        } finally { setGuardando(false); }
    };

    const guardarEdicion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalEditar) return;
        setGuardando(true);
        try {
            const res = await fetch(`${API}/api/v1/products/${modalEditar.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({
                    name: formEditar.name || undefined,
                    unit_price: formEditar.unit_price ? Number(formEditar.unit_price) : undefined,
                    barcode: formEditar.barcode || undefined,
                    sku: formEditar.sku || undefined,
                    category_id: formEditar.category_id || undefined,
                    min_stock: formEditar.min_stock ? Number(formEditar.min_stock) : undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', 'Producto actualizado.');
                setModalEditar(null);
                cargarProductos(filtroCategoria || undefined);
            } else {
                mostrarMsg('err', data.message || 'Error actualizando.');
            }
        } finally { setGuardando(false); }
    };

    const guardarCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const res = await fetch(`${API}/api/v1/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(formCat),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', 'Categoría creada.');
                setModalCategoria(false);
                setFormCat({ name: '', color: '#3b82f6' });
                cargarCategorias();
            }
        } finally { setGuardando(false); }
    };

    const eliminarCategoria = async (catId: string) => {
        if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return;
        const res  = await fetch(`${API}/api/v1/categories/${catId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        if (data.success) { mostrarMsg('ok', data.message); cargarCategorias(); cargarProductos(); }
    };

    const registrarIngreso = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcesando(true);
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
                mostrarMsg('ok', data.message);
                setModalIngreso(null);
                setFormIngreso({ quantity: '', reason: '', supplierName: '' });
                cargarProductos(filtroCategoria || undefined);
            } else { mostrarMsg('err', data.message); }
        } finally { setProcesando(false); }
    };

    const registrarAjuste = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcesando(true);
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
                mostrarMsg('ok', data.message);
                setModalAjuste(null);
                setFormAjuste({ newStock: '', reason: '' });
                cargarProductos(filtroCategoria || undefined);
            } else { mostrarMsg('err', data.message); }
        } finally { setProcesando(false); }
    };

    const verMovimientos = async (producto: any) => {
        setProductoMovs(producto);
        setCargandoMov(true);
        try {
            const res  = await fetch(
                `${API}/api/v1/inventory/movements?productId=${producto.id}`,
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            const data = await res.json();
            if (data.success) setMovimientos(data.data);
        } finally { setCargandoMov(false); }
    };

    const abrirEditar = (prod: any) => {
        setFormEditar({
            name: prod.name,
            unit_price: String(prod.unit_price),
            barcode: prod.barcode || '',
            sku: prod.sku || '',
            category_id: prod.category_id || '',
            min_stock: String(prod.min_stock || 5),
        });
        setModalEditar(prod);
    };

    const handleFiltroCategoria = (catId: string) => {
        setFiltroCategoria(catId);
        cargarProductos(catId || undefined);
    };

    const productosFiltrados = productos.filter((p) =>
        p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    const stockBadge = (stock: number) => {
        const s = Number(stock ?? 0);
        if (s <= 0)  return { label: 'Agotado',    cls: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500' };
        if (s <= 10) return { label: `${s} — Bajo`, cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' };
        return         { label: `${s} en stock`,  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    };

    const tipoMovIcon = (tipo: string) => {
        if (tipo === 'INPUT')  return { icon: '↑', cls: 'text-emerald-700 bg-emerald-100' };
        if (tipo === 'OUTPUT') return { icon: '↓', cls: 'text-red-600 bg-red-100' };
        if (tipo === 'RETURN') return { icon: '↩', cls: 'text-blue-600 bg-blue-100' };
        return                        { icon: '⇄', cls: 'text-amber-700 bg-amber-100' };
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Catálogo e inventario</h1>
                        <p className="text-slate-500 text-sm mt-1">Control de existencias y precios.</p>
                    </div>
                    {esGerente && (
                        <div className="flex gap-2">
                            <button onClick={() => setModalCategoria(true)}
                                className="inline-flex items-center gap-1.5 bg-white border border-slate-200
                                    hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl font-medium text-sm transition">
                                🏷️ Categorías
                            </button>
                            <button onClick={() => setModalNuevo(true)}
                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700
                                    text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo producto
                            </button>
                        </div>
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

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <input type="text" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2 border border-slate-200 rounded-xl
                            text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500
                            focus:outline-none transition"
                        placeholder="🔍 Nombre, barcode o SKU..." />

                    {/* Filtros por categoría */}
                    <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => handleFiltroCategoria('')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                filtroCategoria === ''
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}>
                            Todos
                        </button>
                        {categorias.map((cat) => (
                            <button key={cat.id}
                                onClick={() => handleFiltroCategoria(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                    filtroCategoria === cat.id
                                        ? 'text-white border-transparent'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                                style={filtroCategoria === cat.id
                                    ? { backgroundColor: cat.color, borderColor: cat.color }
                                    : {}}>
                                {cat.name}
                                <span className="ml-1 opacity-60">({cat.product_count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Tabla */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {cargando ? (
                            <div className="p-10 flex items-center justify-center text-slate-500">
                                <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
                                Cargando...
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200
                                        text-slate-500 text-xs uppercase tracking-wider">
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
                                                    : 'No hay productos en esta categoría.'}
                                            </td>
                                        </tr>
                                    ) : productosFiltrados.map((prod) => {
                                        const b = stockBadge(Number(prod.stock_quantity ?? 0));
                                        return (
                                            <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-2">
                                                        {prod.category_color && (
                                                            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                                                style={{ backgroundColor: prod.category_color }} />
                                                        )}
                                                        <div>
                                                            <div className="font-semibold text-slate-800">{prod.name}</div>
                                                            <div className="flex gap-2 mt-0.5">
                                                                {prod.category_name && (
                                                                    <span className="text-xs text-slate-400">{prod.category_name}</span>
                                                                )}
                                                                {prod.barcode && (
                                                                    <span className="text-xs font-mono text-slate-400">
                                                                        📦 {prod.barcode}
                                                                    </span>
                                                                )}
                                                                {prod.sku && (
                                                                    <span className="text-xs font-mono text-slate-400">
                                                                        SKU: {prod.sku}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold text-blue-600">
                                                    S/ {Number(prod.unit_price).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                                        rounded-full text-xs font-semibold border ${b.cls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                                        {b.label}
                                                    </span>
                                                </td>
                                                {esGerente && (
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => abrirEditar(prod)}
                                                                className="px-2 py-1 rounded-lg bg-slate-50 text-slate-600
                                                                    hover:bg-slate-100 border border-slate-200 transition text-xs font-medium">
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setModalIngreso(prod);
                                                                    setFormIngreso({ quantity: '', reason: '', supplierName: '' });
                                                                }}
                                                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700
                                                                    hover:bg-emerald-100 border border-emerald-200 transition text-xs font-medium">
                                                                +Stock
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setModalAjuste(prod);
                                                                    setFormAjuste({
                                                                        newStock: String(prod.stock_quantity ?? 0),
                                                                        reason: ''
                                                                    });
                                                                }}
                                                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700
                                                                    hover:bg-amber-100 border border-amber-200 transition text-xs font-medium">
                                                                Ajuste
                                                            </button>
                                                            <button onClick={() => verMovimientos(prod)}
                                                                className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700
                                                                    hover:bg-blue-100 border border-blue-200 transition text-xs font-medium">
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
                                    {productos.filter(p => Number(p.stock_quantity ?? 0) <= 0).length} agotados
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
                        <div className="overflow-y-auto max-h-[460px]">
                            {cargandoMov ? (
                                <div className="p-6 flex items-center justify-center text-slate-400 text-sm">
                                    <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-blue-600 rounded-full mr-2" />
                                    Cargando...
                                </div>
                            ) : movimientos.length === 0 && productoMovs ? (
                                <div className="p-6 text-center text-slate-400 text-sm">Sin movimientos.</div>
                            ) : movimientos.map((mov) => {
                                const ic = tipoMovIcon(mov.type);
                                return (
                                    <div key={mov.id}
                                        className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center
                                            text-sm font-bold flex-shrink-0 ${ic.cls}`}>
                                            {ic.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-slate-700">{mov.type}</span>
                                                <span className="text-xs font-bold text-slate-800 ml-2">{mov.quantity} un.</span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{mov.reason}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{mov.fecha}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL NUEVO PRODUCTO ─────────────────────────────────────── */}
            {modalNuevo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">Nuevo producto</h2>
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
                                    Nombre o descripción *
                                </label>
                                <input type="text" required value={formNuevo.name}
                                    onChange={(e) => setFormNuevo(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    placeholder="Ej. Teclado mecánico Redragon" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">S/</span>
                                        <input type="number" required step="0.01" min="0"
                                            value={formNuevo.unit_price}
                                            onChange={(e) => setFormNuevo(p => ({ ...p, unit_price: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm
                                                text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock inicial *</label>
                                    <input type="number" required min="0"
                                        value={formNuevo.stock}
                                        onChange={(e) => setFormNuevo(p => ({ ...p, stock: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Código de barras
                                    </label>
                                    <input type="text" value={formNuevo.barcode}
                                        onChange={(e) => setFormNuevo(p => ({ ...p, barcode: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="Ej. 7501055300704" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">SKU</label>
                                    <input type="text" value={formNuevo.sku}
                                        onChange={(e) => setFormNuevo(p => ({ ...p, sku: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="Ej. TEC-001" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría</label>
                                <select value={formNuevo.category_id}
                                    onChange={(e) => setFormNuevo(p => ({ ...p, category_id: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
                                    <option value="">Sin categoría</option>
                                    {categorias.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalNuevo(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL EDITAR PRODUCTO ────────────────────────────────────── */}
            {modalEditar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">Editar producto</h2>
                            <button onClick={() => setModalEditar(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={guardarEdicion} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre</label>
                                <input type="text" value={formEditar.name}
                                    onChange={(e) => setFormEditar(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">S/</span>
                                        <input type="number" step="0.01" min="0"
                                            value={formEditar.unit_price}
                                            onChange={(e) => setFormEditar(p => ({ ...p, unit_price: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm
                                                text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock mínimo</label>
                                    <input type="number" min="0"
                                        value={formEditar.min_stock}
                                        onChange={(e) => setFormEditar(p => ({ ...p, min_stock: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código de barras</label>
                                    <input type="text" value={formEditar.barcode}
                                        onChange={(e) => setFormEditar(p => ({ ...p, barcode: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="Ej. 7501055300704" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">SKU</label>
                                    <input type="text" value={formEditar.sku}
                                        onChange={(e) => setFormEditar(p => ({ ...p, sku: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="Ej. TEC-001" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría</label>
                                <select value={formEditar.category_id}
                                    onChange={(e) => setFormEditar(p => ({ ...p, category_id: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
                                    <option value="">Sin categoría</option>
                                    {categorias.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalEditar(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL GESTIÓN DE CATEGORÍAS ──────────────────────────────── */}
            {modalCategoria && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">Categorías</h2>
                            <button onClick={() => setModalCategoria(false)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Lista de categorías */}
                        <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                            {categorias.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">
                                    No hay categorías creadas aún.
                                </p>
                            ) : categorias.map((cat) => (
                                <div key={cat.id}
                                    className="flex items-center justify-between px-3 py-2
                                        bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.color }} />
                                        <span className="text-sm font-semibold text-slate-800">
                                            {cat.name}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            ({cat.product_count} productos)
                                        </span>
                                    </div>
                                    <button onClick={() => eliminarCategoria(cat.id)}
                                        className="text-xs text-red-500 hover:text-red-700
                                            hover:bg-red-50 px-2 py-1 rounded-lg transition font-medium">
                                        Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Nueva categoría */}
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-sm font-bold text-slate-700 mb-3">Nueva categoría</p>
                            <form onSubmit={guardarCategoria} className="space-y-3">
                                <div>
                                    <input type="text" required value={formCat.name}
                                        onChange={(e) => setFormCat(p => ({ ...p, name: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                            text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        placeholder="Ej. Electrónicos, Ropa, Alimentos..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">
                                        Color de la categoría
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLORES_CATEGORIA.map((color) => (
                                            <button key={color} type="button"
                                                onClick={() => setFormCat(p => ({ ...p, color }))}
                                                className={`w-7 h-7 rounded-full transition border-2 ${
                                                    formCat.color === color
                                                        ? 'border-slate-800 scale-110'
                                                        : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={guardando}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5
                                        rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando ? 'Creando...' : '+ Crear categoría'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL INGRESO DE MERCANCÍA ────────────────────────────────── */}
            {modalIngreso && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-emerald-500">
                        <h2 className="text-lg font-black text-slate-800 mb-1">Ingresar mercancía</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            <strong>{modalIngreso.name}</strong> · Stock actual: <strong>{modalIngreso.stock_quantity ?? 0}</strong>
                        </p>
                        <form onSubmit={registrarIngreso} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cantidad *</label>
                                <input type="number" required min="1"
                                    value={formIngreso.quantity}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, quantity: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Proveedor</label>
                                <input type="text" value={formIngreso.supplierName}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, supplierName: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="Ej. Distribuidora Lima SAC" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Motivo</label>
                                <input type="text" value={formIngreso.reason}
                                    onChange={(e) => setFormIngreso(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                    placeholder="Ej. Compra orden #123" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalIngreso(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesando}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {procesando ? 'Registrando...' : 'Registrar entrada'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL AJUSTE ─────────────────────────────────────────────── */}
            {modalAjuste && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-amber-500">
                        <h2 className="text-lg font-black text-slate-800 mb-1">Ajuste de inventario</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            <strong>{modalAjuste.name}</strong> · Stock actual: <strong>{modalAjuste.stock_quantity ?? 0}</strong>
                        </p>
                        <form onSubmit={registrarAjuste} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock físico real *</label>
                                <input type="number" required min="0"
                                    value={formAjuste.newStock}
                                    onChange={(e) => setFormAjuste(p => ({ ...p, newStock: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none transition"
                                    placeholder="0" />
                                {formAjuste.newStock !== '' && (
                                    <p className={`text-xs mt-1 font-medium ${
                                        Number(formAjuste.newStock) > Number(modalAjuste.stock_quantity ?? 0)
                                            ? 'text-emerald-600' : 'text-red-500'
                                    }`}>
                                        Diferencia: {Number(formAjuste.newStock) - Number(modalAjuste.stock_quantity ?? 0) >= 0 ? '+' : ''}
                                        {Number(formAjuste.newStock) - Number(modalAjuste.stock_quantity ?? 0)} unidades
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Justificación *</label>
                                <input type="text" required minLength={5}
                                    value={formAjuste.reason}
                                    onChange={(e) => setFormAjuste(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                        text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none transition"
                                    placeholder="Ej. Conteo físico mensual, merma..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalAjuste(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesando}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {procesando ? 'Ajustando...' : 'Confirmar ajuste'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
