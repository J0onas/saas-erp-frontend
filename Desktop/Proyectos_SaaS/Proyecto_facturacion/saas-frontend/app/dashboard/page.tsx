'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import BranchSelector from '../components/BranchSelector';
import { useNotifications, NotificationToasts, NotificationPanel } from '../components/useNotifications';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const router = useRouter();
  const { notifications, toasts, connected, unreadCount, markAllRead } = useNotifications();

  const [cajaVerificada, setCajaVerificada] = useState(false);
  const [cajaAbierta, setCajaAbierta]     = useState(false);
  const [montoInicial, setMontoInicial]   = useState('');
  const [abriendoCaja, setAbriendoCaja]   = useState(false);

  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [montoCierre, setMontoCierre]   = useState('');
  const [notasCierre, setNotasCierre]   = useState('');
  const [cerrandoCaja, setCerrandoCaja] = useState(false);

  const [loading, setLoading]                     = useState(false);
  const [pdfBase64, setPdfBase64]                 = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink]           = useState<string | null>(null);
  const [successMessage, setSuccessMessage]       = useState('');
  const [clienteRuc, setClienteRuc]               = useState('');
  const [clienteNombre, setClienteNombre]         = useState('');
  const [clienteCorreo, setClienteCorreo]         = useState('');
  const [buscandoCliente, setBuscandoCliente]     = useState(false);
  const [metodoPago, setMetodoPago]               = useState('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<'01'|'03'>('01');

  const [terminoBusqueda, setTerminoBusqueda]         = useState('');
  const [sugerenciasProducto, setSugerenciasProducto] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias]   = useState(false);
  const [carrito, setCarrito]                         = useState<any[]>([]);

  const [aplicarDetraccion, setAplicarDetraccion]       = useState(false);
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(12);

  const [suscripcionVencida, setSuscripcionVencida]   = useState(false);
  const [mensajeSuscripcion, setMensajeSuscripcion]   = useState('');

  const [errorVenta, setErrorVenta] = useState('');
  const [sunatStatus, setSunatStatus] = useState('');
  const [sunatMessage, setSunatMessage] = useState('');
  const [descuentoGlobal, setDescuentoGlobal] = useState(0); // porcentaje 0-100
  const [descuentoItems, setDescuentoItems] = useState<Record<string, number>>({}); // { productId: porcentaje }
  const [branchSeleccionada, setBranchSeleccionada] = useState<{id:string;name:string}|null>(null);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/login'); return; }
    verificarEstadoCaja(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const token = () => localStorage.getItem('saas_token') || '';

  const verificarEstadoCaja = async (t: string) => {
    try {
      const res = await fetch(`${API}/api/v1/cash/status`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (res.status === 402) {
        setSuscripcionVencida(true);
        setMensajeSuscripcion(data.message || 'Tu suscripción ha vencido.');
      } else if (data.success) {
        setCajaAbierta(data.active);
      }
    } finally {
      setCajaVerificada(true);
    }
  };
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoInicial) return;
    setAbriendoCaja(true);
    try {
      const res = await fetch(`${API}/api/v1/cash/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ initialAmount: Number(montoInicial) }),
      });
      const data = await res.json();
      if (data.success) setCajaAbierta(true);
    } finally { setAbriendoCaja(false); }
  };

  const limpiarVenta = () => {
    setClienteRuc(''); setClienteNombre(''); setClienteCorreo('');
    setMetodoPago('EFECTIVO'); setPdfBase64(null); setWhatsappLink(null);
    setSuccessMessage(''); setCarrito([]); setTerminoBusqueda('');
    setErrorVenta(''); setAplicarDetraccion(false);
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoCierre) return;
    setCerrandoCaja(true);
    try {
      const res = await fetch(`${API}/api/v1/cash/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ finalAmountCash: Number(montoCierre), notes: notasCierre }),
      });
      const data = await res.json();
      if (data.success) {
        setMostrarModalCierre(false); setCajaAbierta(false);
        setMontoCierre(''); setNotasCierre(''); setMontoInicial('');
        limpiarVenta();
      }
    } finally { setCerrandoCaja(false); }
  };

  const buscarClienteBD = useCallback(async (doc: string) => {
    if (doc.length !== 8 && doc.length !== 11) return;
    if (doc.length === 8) setTipoComprobante('03');
    if (doc.length === 11) setTipoComprobante('01');
    setBuscandoCliente(true);
    try {
      const res = await fetch(`${API}/api/v1/clients/search/${doc}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.full_name) setClienteNombre(data.data.full_name);
      }
    } finally { setBuscandoCliente(false); }
  }, []);

  const buscarProductoBD = async (termino: string) => {
    setTerminoBusqueda(termino);
    if (!termino || termino.length < 2) { setMostrarSugerencias(false); return; }
    try {
      const res = await fetch(`${API}/api/v1/products/search/${termino}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSugerenciasProducto(data.data);
        setMostrarSugerencias(true);
      } else {
        setMostrarSugerencias(false);
      }
    } catch { setMostrarSugerencias(false); }
  };

  const buscarPorBarcode = async (codigo: string) => {
  const token = localStorage.getItem('saas_token');
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/barcode/${encodeURIComponent(codigo)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.success && data.data) {
      seleccionarProducto(data.data);
    } else {
      setErrorVenta(`Código "${codigo}" no encontrado en el catálogo.`);
      setTimeout(() => setErrorVenta(''), 3000);
    }
  } catch {
    console.error('Error buscando por barcode');
  }
};

  // ── AGREGAR AL CARRITO con validación de stock ────────────────────────────
  const seleccionarProducto = (producto: any) => {
    const stockDisponible = Number(producto.stock_quantity ?? 0);

    // ← FIX: bloquear productos agotados
    if (stockDisponible <= 0) {
      setErrorVenta(`"${producto.name}" está agotado y no puede ser vendido.`);
      setTerminoBusqueda(''); setSugerenciasProducto([]); setMostrarSugerencias(false);
      return;
    }

    const existente = carrito.find((item) => item.id === producto.id);
    if (existente) {
      // ← FIX: no sobrepasar el stock al incrementar
      const nuevaCantidad = existente.quantity + 1;
      if (nuevaCantidad > stockDisponible) {
        setErrorVenta(`Stock máximo para "${producto.name}" es ${stockDisponible} unidades.`);
        return;
      }
      setCarrito(carrito.map((item) =>
        item.id === producto.id ? { ...item, quantity: nuevaCantidad } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, quantity: 1 }]);
    }

    setErrorVenta('');
    setTerminoBusqueda(''); setSugerenciasProducto([]); setMostrarSugerencias(false);
  };

  const actualizarCantidad = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const item = carrito.find((i) => i.id === id);
    if (item) {
      const stock = Number(item.stock_quantity ?? 999);
      if (nuevaCantidad > stock) {
        setErrorVenta(`Stock máximo para "${item.name}" es ${stock} unidades.`);
        return;
      }
    }
    setErrorVenta('');
    setCarrito(carrito.map((i) => i.id === id ? { ...i, quantity: nuevaCantidad } : i));
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter((i) => i.id !== id));
    setErrorVenta('');
  };

  const subtotalSinDesc = carrito.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
   const descItemsTotal  = carrito.reduce((s, i) => {
     const pct = descuentoItems[i.id] || 0;
     return s + (Number(i.unit_price) * i.quantity * pct / 100);
   }, 0);
   const descGlobalMonto = (subtotalSinDesc - descItemsTotal) * descuentoGlobal / 100;
   const total    = subtotalSinDesc - descItemsTotal - descGlobalMonto;
   const subtotal = total / 1.18;
   const igv      = total - subtotal;
   const superaLimiteDetraccion = total > 700;

  useEffect(() => {
    if (!superaLimiteDetraccion) setAplicarDetraccion(false);
  }, [superaLimiteDetraccion]);

  useEffect(() => {
  let barcodeBuffer = '';
  let barcodeTimeout: NodeJS.Timeout;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Los lectores de barras envían chars muy rápido y terminan con Enter
    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 3) {
        buscarPorBarcode(barcodeBuffer.trim());
      }
      barcodeBuffer = '';
      clearTimeout(barcodeTimeout);
      return;
    }

    // Solo capturar si no hay un input activo (para no interferir con formularios)
    const active = document.activeElement as HTMLElement;
    const esInputActivo = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
    if (esInputActivo) return;

    if (e.key.length === 1) {
      barcodeBuffer += e.key;
      clearTimeout(barcodeTimeout);
      // Limpiar buffer si no llega el Enter en 300ms (tipeo manual, no lector)
      barcodeTimeout = setTimeout(() => { barcodeBuffer = ''; }, 300);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [carrito]);

  const montoDetraccion = aplicarDetraccion ? (total * porcentajeDetraccion) / 100 : 0;

  const emitirFactura = async () => {
    setErrorVenta('');
    if (!clienteRuc || !clienteNombre) {
      setErrorVenta('Ingresa RUC/DNI y nombre del cliente.');
      return;
    }
    if (carrito.length === 0) {
      setErrorVenta('El carrito está vacío.');
      return;
    }

    setLoading(true);
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - offsetMs).toISOString();

    const payloadItems = carrito.map((item, idx) => {
     const pctItem = descuentoItems[item.id] || 0;
     const descMonto = Number(item.unit_price) * item.quantity * pctItem / 100;
     const precioConDesc = Number(item.unit_price) * item.quantity - descMonto;
     return {
       id: idx + 1,
       productId: item.id,
       description: item.name,
       quantity: item.quantity,
       unitValue: Number((Number(item.unit_price) / 1.18).toFixed(2)),
       unitPrice: Number(item.unit_price),
       totalTaxes: Number(((Number(item.unit_price) - Number(item.unit_price) / 1.18) * item.quantity).toFixed(2)),
       discountPercent: pctItem,
       discountAmount: Number(descMonto.toFixed(2)),
     };
   });

    const payload = {
      serieNumber: '',
      issueDate: localISO.split('T')[0],
      issueTime: localISO.split('T')[1].substring(0, 8),
      paymentMethod: metodoPago,
      customerEmail: clienteCorreo,
      hasDetraction: aplicarDetraccion,
      detractionPercent: aplicarDetraccion ? porcentajeDetraccion : 0,
      detractionAmount: Number(montoDetraccion.toFixed(2)),
      currency: 'PEN',
      branchId: branchSeleccionada?.id || null,
      tipoComprobante: tipoComprobante,
      // supplier ya no se envía: el backend lo obtiene desde company_settings
      supplier: { ruc: '', businessName: '', addressCode: '0000' },
      customer: {
        documentType: clienteRuc.length === 8 ? '1' : '6',
        documentNumber: clienteRuc,
        fullName: clienteNombre,
      },
      items: payloadItems,
      totalTaxBase: Number(subtotal.toFixed(2)),
      totalIgv: Number(igv.toFixed(2)),
      totalAmount: total,
      discountPercent: descuentoGlobal,
      discountAmount: Number(descGlobalMonto.toFixed(2)),
    };

    try {
      const res = await fetch(`${API}/api/v1/invoices/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al emitir comprobante');

      setSuccessMessage(data.message);
      setPdfBase64(data.pdfDocument);
      setWhatsappLink(data.whatsappLink || null);
      setSunatStatus(data.sunatStatus);      // nuevo estado
      setSunatMessage(data.sunatMessage);    // nuevo estado
    } catch (err: any) {
      setErrorVenta(err.message);
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = () => {
    if (!pdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = `Comprobante_${clienteRuc}.pdf`;
    link.click();
  };

  // ── ESTADOS DE PANTALLA ───────────────────────────────────────────────────
  if (!cajaVerificada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-blue-600 rounded-full" />
          Verificando acceso...
        </div>
      </div>
    );
  }

  if (suscripcionVencida) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 sm:mx-auto border-t-4 border-red-500 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Suscripción vencida</h2>
          <p className="text-slate-500 text-sm mb-6">{mensajeSuscripcion}</p>
          <button onClick={() => router.push('/suscripcion')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition mb-3">
            Renovar plan
          </button>
          <button onClick={() => { localStorage.removeItem('saas_token'); router.push('/login'); }}
            className="text-sm text-slate-400 hover:text-slate-700">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (!cajaAbierta) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 sm:mx-auto text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-1">Caja cerrada</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa el monto inicial para abrir tu turno.</p>
          <form onSubmit={handleAbrirCaja} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monto inicial (S/)</label>
              <input type="number" required min="0" step="0.10"
                value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0.00" />
            </div>
            <button type="submit" disabled={abriendoCaja}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50">
              {abriendoCaja ? 'Abriendo...' : 'Abrir caja y empezar'}
            </button>
          </form>
          <button onClick={() => { localStorage.removeItem('saas_token'); router.push('/login'); }}
            className="mt-4 text-sm text-red-400 hover:text-red-600">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── POS PRINCIPAL ─────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50">
      <NotificationToasts toasts={toasts} />
      <Navbar
        cajaInfo={cajaAbierta ? (branchSeleccionada?.name || 'Caja abierta') : undefined}
        onCerrarTurno={() => setMostrarModalCierre(true)}
      />
      <div className="hidden md:block fixed top-3 right-4 z-30">
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          connected={connected}
          onMarkAllRead={markAllRead}
        />
      </div>
      <PageWrapper>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* ── Panel izquierdo: productos ─────────────────────────────────── */}
          <div className="md:col-span-1 lg:col-span-8 space-y-4 order-1">
            
            {/* Buscador */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 min-h-[120px]">
              <div className="mb-3">
                <BranchSelector onBranchChange={setBranchSeleccionada} />
              </div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Buscar producto</h2>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={terminoBusqueda}
                  onChange={(e) => buscarProductoBD(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Nombre o código del producto..."
                />
                {mostrarSugerencias && sugerenciasProducto.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-xl overflow-hidden">
                    {sugerenciasProducto.map((prod) => {
                      const stock = Number(prod.stock_quantity ?? 0);
                      const agotado = stock <= 0;
                      return (
                        <li key={prod.id}
                          onClick={() => seleccionarProducto(prod)}
                          className={`flex justify-between items-center px-4 py-3 border-b last:border-0 transition cursor-pointer ${
                            agotado ? 'bg-red-50 cursor-not-allowed opacity-60' : 'hover:bg-blue-50'
                          }`}>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{prod.name}</div>
                            <div className={`text-xs mt-0.5 font-medium ${
                              agotado ? 'text-red-500' : stock <= 10 ? 'text-amber-500' : 'text-emerald-600'
                            }`}>
                              {agotado ? '❌ Agotado' : `Stock: ${stock}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">
                              S/ {Number(prod.unit_price).toFixed(2)}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Error de venta */}
            {errorVenta && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorVenta}
              </div>
            )}

            {/* Tabla carrito */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-700">Detalle de venta</h2>
              </div>

              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium text-sm">Busca un producto para comenzar</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-2xl">
                <table className="w-full text-sm whitespace-nowrap min-w-[680px]">
                  <thead>
  <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-semibold">Producto</th>
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold">P. Unit</th>
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold">Desc. %</th>
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold">Cant.</th>
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-semibold">Subtotal</th>
    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold w-10"></th>
  </tr>
</thead>
                  <tbody className="divide-y divide-slate-50">
                    {carrito.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-slate-800">{item.name}</td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-slate-600">
                          S/ {Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                          <input
                            type="number"
                           min="0"
                           max="100"
                           value={descuentoItems[item.id] || 0}
                           onChange={(e) => setDescuentoItems(prev => ({
                            ...prev,
                            [item.id]: Math.min(100, Math.max(0, Number(e.target.value)))
                         }))}
                          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center
                            text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                           />
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => actualizarCantidad(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition flex items-center justify-center">
                              −
                            </button>
                            <span className="font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                            <button onClick={() => actualizarCantidad(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition flex items-center justify-center">
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-bold text-blue-600">
                          S/ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                          <button onClick={() => eliminarDelCarrito(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Panel derecho: cliente y cobro ─────────────────────────────── */}
          <div className="md:col-span-1 lg:col-span-4 space-y-4 order-2">

           {/* Cliente */}
<div className="bg-white rounded-2xl border border-slate-200 p-4">
  <h2 className="text-sm font-bold text-slate-700 mb-3">Datos del cliente</h2>

  {/* ── SELECTOR TIPO COMPROBANTE ── */}
  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
      Tipo de comprobante
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => setTipoComprobante('01')}
        className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition ${
          tipoComprobante === '01'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
        }`}
      >
        🧾 Factura
      </button>
      <button
        type="button"
        onClick={() => setTipoComprobante('03')}
        className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition ${
          tipoComprobante === '03'
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
        }`}
      >
        🏷️ Boleta
      </button>
    </div>
    <p className="text-xs text-slate-400 mt-1">
      {tipoComprobante === '03'
        ? 'Serie B001 · Para personas naturales (DNI)'
        : 'Serie F001 · Para empresas (RUC)'}
    </p>
  </div>

  <div className="space-y-3">
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">RUC / DNI</label>
      <div className="relative">
        <input type="text" value={clienteRuc}
          onChange={(e) => setClienteRuc(e.target.value)}
          onBlur={() => buscarClienteBD(clienteRuc)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-slate-50 focus:bg-white"
          placeholder="20123456789" />
        {buscandoCliente && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-blue-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Razón social / Nombre</label>
      <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-slate-50 focus:bg-white"
        placeholder="Nombre completo" />
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Correo (opcional)</label>
      <input type="email" value={clienteCorreo} onChange={(e) => setClienteCorreo(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-slate-50 focus:bg-white"
        placeholder="cliente@correo.com" />
    </div>
  </div>
</div>

            {/* Cobro */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700">Método de pago</h2>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="YAPE">📱 Yape / Plin</option>
                  <option value="TARJETA">💳 Tarjeta</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                </select>
              </div>

              {/* ← DESCUENTO GLOBAL */}
<div className="mb-3">
  <div className="flex items-center justify-between mb-1">
    <label className="text-xs font-semibold text-slate-500 uppercase">
      Descuento global
    </label>
    <div className="flex items-center gap-1">
      <input
        type="number" min="0" max="100"
        value={descuentoGlobal}
        onChange={(e) => setDescuentoGlobal(
          Math.min(100, Math.max(0, Number(e.target.value)))
        )}
        className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center
          font-bold text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <span className="text-sm text-slate-500">%</span>
    </div>
  </div>
  {descuentoGlobal > 0 && (
    <p className="text-xs text-right text-emerald-600 font-medium">
      Ahorro: -S/ {descGlobalMonto.toFixed(2)}
    </p>
  )}
</div>

              {/* Total */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Subtotal (sin IGV)</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-3">
                  <span>IGV 18%</span>
                  <span>S/ {igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-black text-xl text-slate-900 border-t border-slate-200 pt-2">
                  <span>TOTAL</span>
                  <span className="text-blue-600">S/ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Detracción */}
              {superaLimiteDetraccion && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <label className="flex items-center gap-2 text-amber-700 font-semibold text-sm cursor-pointer">
                    <input type="checkbox" checked={aplicarDetraccion}
                      onChange={(e) => setAplicarDetraccion(e.target.checked)}
                      className="accent-amber-600 w-4 h-4" />
                    Aplicar detracción
                  </label>
                  {aplicarDetraccion && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200">
                      <div className="flex items-center gap-1">
                        <input type="number" value={porcentajeDetraccion}
                          onChange={(e) => setPorcentajeDetraccion(Number(e.target.value))}
                          className="w-14 border border-amber-300 rounded-lg px-2 py-1 text-sm text-center font-bold" />
                        <span className="text-xs text-amber-700">%</span>
                      </div>
                      <span className="text-sm font-bold text-amber-800">
                        S/ {montoDetraccion.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              {!pdfBase64 ? (
                <div className="sticky bottom-0 bg-white pt-3 pb-2 sm:static sm:bg-transparent sm:pt-0 sm:pb-0">
                <button onClick={emitirFactura}
                  disabled={loading || carrito.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Emitir comprobante
                    </>
                  )}
                </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Venta registrada con éxito
                  </div>
                  {sunatStatus && (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
        sunatStatus === 'ACEPTADO'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          : sunatStatus === 'RECHAZADO'
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-amber-50 border border-amber-200 text-amber-700'
      }`}>
        {sunatStatus === 'ACEPTADO' ? '✓ SUNAT: Aceptado'
         : sunatStatus === 'RECHAZADO' ? '✗ SUNAT: Rechazado'
         : '⏳ SUNAT: ' + sunatStatus}
        {sunatMessage && <span className="opacity-75 ml-1">· {sunatMessage}</span>}
      </div>
    )}
                  <button onClick={descargarPDF}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar PDF
                  </button>
                  {/* ← BOTÓN WHATSAPP */}
                  {whatsappLink && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#1da851] text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M11.993 0C5.376 0 0 5.376 0 11.993c0 2.107.553 4.09 1.52 5.81L.012 24l6.363-1.49A11.952 11.952 0 0011.993 24C18.61 24 24 18.624 24 11.993 24 5.376 18.61 0 11.993 0zm0 21.818a9.825 9.825 0 01-5.006-1.369l-.36-.214-3.72.975.993-3.628-.235-.373a9.827 9.827 0 01-1.506-5.216c0-5.431 4.419-9.85 9.834-9.85 5.431 0 9.837 4.419 9.837 9.85 0 5.415-4.406 9.825-9.837 9.825z"/>
                      </svg>
                      Compartir por WhatsApp
                    </a>
                  )}
                  <button onClick={limpiarVenta}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                    Nueva venta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </PageWrapper>

      {/* Modal cierre de caja */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 sm:mx-auto border-t-4 border-amber-500">
            <h2 className="text-lg font-black text-slate-800 mb-1">Cuadre de caja</h2>
            <p className="text-slate-500 text-sm mb-5">Declara el efectivo físico al cierre.</p>
            <form onSubmit={handleCerrarCaja} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Efectivo contado (S/)</label>
                <input type="number" required step="0.10" min="0"
                  value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notas (opcional)</label>
                <textarea value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 resize-none focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalCierre(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={cerrandoCaja}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm">
                  {cerrandoCaja ? 'Cerrando...' : 'Confirmar cierre'}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      )}
    </div>
  );
}
