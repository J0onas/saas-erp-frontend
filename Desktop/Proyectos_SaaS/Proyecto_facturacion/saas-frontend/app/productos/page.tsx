'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el Modal de Nuevo Producto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoStock, setNuevoStock] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarProductos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarProductos = async () => {
    const token = localStorage.getItem('saas_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProductos(data.data);
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  const guardarNuevoProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoPrecio || !nuevoStock) return alert('Completa todos los campos');

    setGuardando(true);
    const token = localStorage.getItem('saas_token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: nuevoNombre,
          unit_price: Number(nuevoPrecio),
          stock: Number(nuevoStock)
        })
      });

      const data = await response.json();
      if (data.success) {
        // Limpiamos el formulario, cerramos el modal y recargamos la lista
        setNuevoNombre('');
        setNuevoPrecio('');
        setNuevoStock('');
        setMostrarModal(false);
        cargarProductos();
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const renderStockBadge = (stock: number) => {
    if (stock > 20) return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">✅ {stock} en Stock</span>;
    if (stock > 0) return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">⚠️ {stock} (Bajo)</span>;
    return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">❌ Agotado</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Barra Superior */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo e Inventario</h1>
            <p className="text-gray-500 mt-1">Control de existencias y precios del negocio.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setMostrarModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
            >
              ➕ Nuevo Producto
            </button>
            <Link href="/dashboard" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-lg font-medium shadow-sm transition">
              ← Volver al POS
            </Link>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando almacén...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                    <th className="px-6 py-4 font-semibold border-b">Descripción del Producto</th>
                    <th className="px-6 py-4 font-semibold border-b text-right">Precio Unitario</th>
                    <th className="px-6 py-4 font-semibold border-b text-center">Estado de Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No hay productos registrados en el almacén.
                      </td>
                    </tr>
                  ) : (
                    productos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{prod.name}</td>
                        <td className="px-6 py-4 text-sm text-blue-700 font-bold text-right">S/ {Number(prod.unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">{renderStockBadge(prod.stock)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- MODAL PARA NUEVO PRODUCTO --- */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Producto</h2>
                <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
              </div>
              
              <form onSubmit={guardarNuevoProducto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Descripción</label>
                  <input 
                    type="text" 
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Teclado Mecánico Redragon"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 font-bold">S/</span>
                      <input 
                        type="number" 
                        required step="0.01" min="0"
                        value={nuevoPrecio}
                        onChange={(e) => setNuevoPrecio(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 pl-8 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                    <input 
                      type="number" 
                      required min="0"
                      value={nuevoStock}
                      onChange={(e) => setNuevoStock(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Cantidad"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}