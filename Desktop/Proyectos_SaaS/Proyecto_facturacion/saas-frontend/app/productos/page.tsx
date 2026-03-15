'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoStock, setNuevoStock] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => { cargarProductos(); }, []);

  const token = () => localStorage.getItem('saas_token') || '';

  const cargarProductos = async () => {
    const t = token();
    if (!t) { router.push('/login'); return; }
    setCargando(true);
    try {
      const res = await fetch(`${API}/api/v1/products`, {
        headers: { Authorization: `Bearer ${t}` },
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
          name: nuevoNombre,
          unit_price: Number(nuevoPrecio),
          stock: Number(nuevoStock),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNuevoNombre(''); setNuevoPrecio(''); setNuevoStock('');
        setMostrarModal(false);
        setMensaje({ tipo: 'ok', texto: 'Producto registrado correctamente.' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        cargarProductos();
      } else {
        setMensaje({ tipo: 'err', texto: 'Error al guardar.' });
      }
    } finally { setGuardando(false); }
  };

  const productosFiltrados = productos.filter((p) =>
    p.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Agotado', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
    if (stock <= 10) return { label: `${stock} — Bajo`, cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    return { label: `${stock} en stock`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Catálogo e Inventario</h1>
            <p className="text-slate-500 text-sm mt-1">Control de existencias y precios del negocio.</p>
          </div>
          <button onClick={() => setMostrarModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </button>
        </div>

        {/* Mensaje feedback */}
        {mensaje.texto && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Buscador inline */}
        <div className="mb-4">
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="🔍 Buscar producto..." />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {cargando ? (
            <div className="p-12 flex items-center justify-center text-slate-500">
              <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
              Cargando inventario...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Producto</th>
                  <th className="px-6 py-4 text-right font-semibold">Precio</th>
                  <th className="px-6 py-4 text-center font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400">
                      {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos registrados.'}
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((prod) => {
                    const s = stockStatus(Number(prod.stock_quantity ?? prod.stock ?? 0));
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">{prod.name}</span>
                          {prod.code && (
                            <span className="ml-2 text-xs text-slate-400 font-mono">#{prod.code}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                          S/ {Number(prod.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer stats */}
        {!cargando && (
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span>{productosFiltrados.length} productos</span>
            <span>·</span>
            <span className="text-red-500 font-medium">
              {productos.filter(p => Number(p.stock_quantity ?? p.stock ?? 0) <= 0).length} agotados
            </span>
            <span>·</span>
            <span className="text-amber-500 font-medium">
              {productos.filter(p => {
                const s = Number(p.stock_quantity ?? p.stock ?? 0);
                return s > 0 && s <= 10;
              }).length} con stock bajo
            </span>
          </div>
        )}
      </div>

      {/* Modal nuevo producto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-slate-800">Registrar producto</h2>
              <button onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={guardarProducto} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre o descripción</label>
                <input type="text" required value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Ej. Teclado mecánico Redragon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio de venta</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 text-sm font-medium">S/</span>
                    <input type="number" required step="0.01" min="0"
                      value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock inicial</label>
                  <input type="number" required min="0"
                    value={nuevoStock} onChange={(e) => setNuevoStock(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="0" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)}
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
    </div>
  );
}
