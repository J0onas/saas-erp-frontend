'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  // --- ESTADOS DE LA CAJA REGISTRADORA ---
  const [cajaVerificada, setCajaVerificada] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [abriendoCaja, setAbriendoCaja] = useState(false);

  // --- ESTADOS PARA EL CIERRE DE CAJA ---
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [montoCierre, setMontoCierre] = useState('');
  const [notasCierre, setNotasCierre] = useState('');
  const [cerrandoCaja, setCerrandoCaja] = useState(false);

  // --- ESTADOS DEL CLIENTE Y FACTURA ---
  const [loading, setLoading] = useState(false);
  const [xmlResult, setXmlResult] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [clienteRuc, setClienteRuc] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState(''); 
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  
  // --- ESTADOS DEL CARRITO DE COMPRAS (MULTI-PRODUCTO) ---
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerenciasProducto, setSugerenciasProducto] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [carrito, setCarrito] = useState<any[]>([]); // ARRAY QUE GUARDA LA VENTA
  
  // --- ESTADOS DE DETRACCIÓN ---
  const [aplicarDetraccion, setAplicarDetraccion] = useState(false);
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(12);

  // --- ESTADO DE SUSCRIPCIÓN SAAS ---
  const [suscripcionVencida, setSuscripcionVencida] = useState(false);
  const [mensajeSuscripcion, setMensajeSuscripcion] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) {
      router.push('/login');
      return;
    }
    verificarEstadoCaja(token);
  }, [router]);

  const verificarEstadoCaja = async (token: string) => { // <-- Recibe el token
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cash/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }, // <-- Lo envía en el Header
      });
      // ... resto del código
      
      const data = await response.json();

      // NUEVO: Verificamos si el backend bloqueó por falta de pago (Error 402)
      if (response.status === 402) {
        setSuscripcionVencida(true);
        setMensajeSuscripcion(data.message || 'Tu suscripción ha vencido.');
        setCajaVerificada(true); // Marcamos como verificada para quitar el loading
        return; // Detenemos la ejecución aquí
      }

      if (data.success) {
        setCajaAbierta(data.active);
      }
    } catch (error) {
      console.error("Error verificando caja:", error);
    } finally {
      setCajaVerificada(true);
    }
  };

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoInicial === '') return alert('Ingresa un monto inicial válido.');
    
    setAbriendoCaja(true);
    const token = localStorage.getItem('saas_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cash/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ initialAmount: Number(montoInicial) }),
        
      });
      const data = await response.json();
      if (data.success) {
        setCajaAbierta(true);
      } else {
        alert('Error al abrir la caja.');
      }
    } catch (error) {
      alert('Error de conexión.');
    } finally {
      setAbriendoCaja(false);
    }
  };

  const limpiarFormularioVenta = () => {
    setClienteRuc('');
    setClienteNombre('');
    setClienteCorreo('');
    setMetodoPago('EFECTIVO');
    setPdfBase64(null);
    setXmlResult(null);
    setSuccessMessage('');
    setCarrito([]); // Vaciamos el carrito
    setTerminoBusqueda('');
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoCierre === '') return alert('Debes ingresar el dinero contado físicamente.');

    setCerrandoCaja(true);
    const token = localStorage.getItem('saas_token');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cash/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ finalAmountCash: Number(montoCierre), notes: notasCierre }),
        
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message); 
        setMostrarModalCierre(false);
        setCajaAbierta(false); 
        setMontoCierre('');
        setNotasCierre('');
        setMontoInicial('');
        limpiarFormularioVenta();
      } else {
        alert(data.message || 'Error al cerrar turno.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    } finally {
      setCerrandoCaja(false);
    }
  };

  const buscarClienteBD = async (documento: string) => {
    if (documento.length !== 8 && documento.length !== 11) return;
    setBuscandoCliente(true);
    const token = localStorage.getItem('saas_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/search/${documento}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.full_name) {
          setClienteNombre(data.data.full_name);
        }
      }
    } catch (error) {
      console.error("Error de conexión con el servidor");
    } finally {
      setBuscandoCliente(false);
    }
  };

  const buscarProductoBD = async (termino: string) => {
    setTerminoBusqueda(termino);
    if (!termino || termino.length < 2) {
      setMostrarSugerencias(false);
      return;
    }
    const token = localStorage.getItem('saas_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/search/${termino}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setSugerenciasProducto(data.data);
        setMostrarSugerencias(true);
      } else {
        setMostrarSugerencias(false);
      }
    } catch (error) {
      console.error("Error buscando producto:", error);
    }
  };

  // --- LÓGICA DEL CARRITO PROFESIONAL ---
  const seleccionarProducto = (producto: any) => {
    // Verificamos si ya está en el carrito
    const productoExistente = carrito.find(item => item.id === producto.id);
    
    if (productoExistente) {
      // Si existe, le sumamos 1 a la cantidad
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // Si es nuevo, lo agregamos con cantidad 1
      setCarrito([...carrito, { ...producto, quantity: 1 }]);
    }
    
    setTerminoBusqueda('');
    setSugerenciasProducto([]);
    setMostrarSugerencias(false);
  };

  const actualizarCantidad = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setCarrito(carrito.map(item => item.id === id ? { ...item, quantity: nuevaCantidad } : item));
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  // --- MATEMÁTICAS DINÁMICAS ---
  const total = carrito.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  const superaLimiteDetraccion = total > 700;
  
  useEffect(() => {
    if (!superaLimiteDetraccion) setAplicarDetraccion(false);
  }, [superaLimiteDetraccion]);

  const montoDetraccion = aplicarDetraccion ? (total * porcentajeDetraccion) / 100 : 0;

  const emitirFactura = async () => {
    if (!clienteRuc || !clienteNombre) {
      alert('Por favor, ingresa los datos del cliente.');
      return;
    }

    if (carrito.length === 0) {
      alert('🛑 El carrito está vacío. Agrega al menos un producto a la venta.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('saas_token');
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - offsetMs).toISOString();
    
    // Mapeamos el carrito para enviarlo al backend
    const payloadItems = carrito.map((item, index) => {
      const itemTotal = Number(item.unit_price) * item.quantity;
      const itemSubtotal = itemTotal / 1.18;
      const itemIgv = itemTotal - itemSubtotal;
      
      return {
        id: index + 1,
        productId: item.id,
        description: item.name,
        quantity: item.quantity,
        unitValue: Number((Number(item.unit_price) / 1.18).toFixed(2)),
        unitPrice: Number(item.unit_price),
        totalTaxes: Number(itemIgv.toFixed(2))
      };
    });

    const payloadFactura = {
      serieNumber: "", 
      issueDate: localISO.split('T')[0],
      issueTime: localISO.split('T')[1].substring(0, 8),
      paymentMethod: metodoPago, 
      customerEmail: clienteCorreo,
      hasDetraction: aplicarDetraccion,
      detractionPercent: aplicarDetraccion ? porcentajeDetraccion : 0,
      detractionAmount: Number(montoDetraccion.toFixed(2)),
      currency: "PEN",
      supplier: { ruc: "20123456789", businessName: "EMPRESA LOCAL", addressCode: "0000" },
      customer: {
        documentType: clienteRuc.length === 8 ? "1" : "6",
        documentNumber: clienteRuc,
        fullName: clienteNombre
      },
      items: payloadItems, // ENVIAMOS TODO EL ARRAY DE PRODUCTOS
      totalTaxBase: Number(subtotal.toFixed(2)),
      totalIgv: Number(igv.toFixed(2)),
      totalAmount: total
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payloadFactura),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al emitir factura');

      setSuccessMessage(data.message);
      setXmlResult(data.xmlPreview);
      setPdfBase64(data.pdfDocument);
    } catch (error: any) {
      alert(`Falló la emisión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = () => {
    if (!pdfBase64) return;
    const linkSource = `data:application/pdf;base64,${pdfBase64}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `Factura_${clienteRuc}.pdf`;
    downloadLink.click();
  };

  const cerrarSesion = () => {
    localStorage.removeItem('saas_token');
    router.push('/login');
  };

  if (!cajaVerificada) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Verificando seguridad de caja...</div>;
  }

  // --- NUEVO: PANTALLA DE SUSCRIPCIÓN VENCIDA (PAYWALL) ---
  if (suscripcionVencida) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-lg w-full border-t-8 border-red-500 text-center transform transition-all">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-4xl">💳</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Suscripción Vencida</h1>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            {mensajeSuscripcion} <br/>
            Renueva tu plan para reactivar tu Punto de Venta, facturación electrónica y reportes.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 text-left">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">¿Qué sucede ahora?</h3>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span> Emisión de facturas y boletas temporalmente suspendida.
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span> Acceso a reportes gerenciales bloqueado.
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✅</span> Tu información y base de datos de clientes están a salvo.
              </li>
            </ul>
          </div>

          <button 
            onClick={() => router.push('/suscripcion')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 mb-4"
          >
            <span>🚀</span> Renovar Suscripción Ahora
          </button>
          
          <button onClick={cerrarSesion} className="text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO (CAJA CERRADA)
  if (!cajaAbierta) {
    // ... tu mismo código de caja cerrada ...
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-blue-600 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Caja Cerrada</h1>
          <p className="text-gray-500 mb-6">Apertura tu turno para iniciar.</p>
          <form onSubmit={handleAbrirCaja} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Monto Inicial (S/)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-bold">S/</span>
                <input type="number" required step="0.10" min="0" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-3 pl-10 text-xl font-bold text-gray-800 focus:ring-4 focus:ring-blue-100 focus:outline-none" placeholder="0.00" />
              </div>
            </div>
            <button type="submit" disabled={abriendoCaja} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50">
              {abriendoCaja ? 'Abriendo turno...' : '🔓 Abrir Caja y Empezar'}
            </button>
          </form>
          <button onClick={cerrarSesion} className="mt-6 text-sm text-red-500 hover:text-red-700 font-semibold underline">Cerrar sesión y salir</button>
        </div>
      </div>
    );
  }

  // POS NORMAL (CAJA ABIERTA)
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">Punto de Venta Profesional</h1>
            <span className="bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">🟢 Caja Abierta</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push('/productos')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium shadow-sm transition">📦 Inventario</button>
            <button onClick={() => router.push('/reportes')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium shadow-sm transition">📊 Dashboard</button>
            <button onClick={() => router.push('/historial')} className="bg-gray-800 hover:bg-black text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">📂 Comprobantes</button>
            <button onClick={() => setMostrarModalCierre(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition">🔒 Cerrar Turno</button>
            <button onClick={cerrarSesion} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition">Salir</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* PANEL IZQUIERDO: PRODUCTOS Y CARRITO (8 Columnas) */}
          <div className="col-span-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Detalle de Venta</h2>
            
            {/* Buscador de Productos */}
            <div className="mb-6 relative">
              <input 
                type="text" 
                value={terminoBusqueda}
                onChange={(e) => buscarProductoBD(e.target.value)}
                className="w-full border-2 border-blue-200 rounded-lg p-3 text-gray-700 focus:outline-none focus:border-blue-500 bg-blue-50"
                placeholder="🔍 Buscar producto por nombre o código (Ej. Cemento, Teclado)..."
              />
              {mostrarSugerencias && sugerenciasProducto.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-2xl max-h-60 overflow-y-auto">
                  {sugerenciasProducto.map((prod) => (
                    <li key={prod.id} onClick={() => seleccionarProducto(prod)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center">
                      <div className="font-bold text-gray-800">{prod.name}</div>
                      <div className="text-sm text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded">S/ {Number(prod.unit_price).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tabla del Carrito */}
            <div className="min-h-[250px] bg-gray-50 rounded-lg border border-gray-200 p-1">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <span className="text-4xl mb-2">🛒</span>
                  <p>El carrito está vacío. Busca un producto arriba para empezar.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="p-3 rounded-tl-lg">Producto</th>
                      <th className="p-3 text-center">P. Unit</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 rounded-tr-lg text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
                        <td className="p-3 text-center text-gray-600">S/ {Number(item.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => actualizarCantidad(item.id, item.quantity - 1)} className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded-full font-bold text-gray-700">-</button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => actualizarCantidad(item.id, item.quantity + 1)} className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded-full font-bold text-gray-700">+</button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-blue-700">S/ {(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => eliminarDelCarrito(item.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-md">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: CLIENTE, COBRO Y FACTURACIÓN (4 Columnas) */}
          <div className="col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Datos del Cliente</h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">RUC / DNI</label>
                <div className="relative">
                  <input type="text" value={clienteRuc} onChange={(e) => setClienteRuc(e.target.value)} onBlur={() => buscarClienteBD(clienteRuc)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500" placeholder="Ej. 20123456789" />
                  {buscandoCliente && <span className="absolute right-2 top-2 text-xs text-blue-500 font-bold">Buscando...</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Razón Social / Nombres</label>
                <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                <input type="email" value={clienteCorreo} onChange={(e) => setClienteCorreo(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500" placeholder="Opcional" />
              </div>
            </div>

            <div className="mt-auto">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Método de Pago</span>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="border border-gray-300 rounded bg-white text-sm p-1 font-bold">
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="YAPE">📱 Yape/Plin</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                    <option value="TRANSFERENCIA">🏦 Transf.</option>
                  </select>
                </div>
                <div className="flex justify-between font-black text-2xl pt-2 border-t border-gray-300 text-blue-800">
                  <span>TOTAL:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>

              {superaLimiteDetraccion && (
                <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg mb-4 text-sm">
                  <label className="flex items-center text-red-700 font-bold mb-2 cursor-pointer">
                    <input type="checkbox" checked={aplicarDetraccion} onChange={(e) => setAplicarDetraccion(e.target.checked)} className="mr-2 accent-red-600" />
                    ⚠️ Aplica Detracción
                  </label>
                  {aplicarDetraccion && (
                    <div className="flex justify-between items-center border-t border-red-200 pt-2">
                      <input type="number" value={porcentajeDetraccion} onChange={(e) => setPorcentajeDetraccion(Number(e.target.value))} className="border border-red-300 rounded p-1 w-16 text-center font-bold" /> %
                      <span className="font-bold text-red-700">Retención: S/ {montoDetraccion.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {!pdfBase64 ? (
                // MODO 1: ESTAMOS COBRANDO
                <button onClick={emitirFactura} disabled={loading || carrito.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black text-lg shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                  {loading ? 'Procesando con SUNAT...' : '🚀 Emitir Comprobante'}
                </button>
              ) : (
                // MODO 2: VENTA EXITOSA (Bloqueamos doble cobro y mostramos acciones)
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-bold border border-green-300">
                    ✅ ¡Venta registrada con éxito!
                  </div>
                  
                  <button onClick={descargarPDF} className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black text-lg shadow-lg transition-all flex justify-center items-center gap-2">
                    📄 Descargar PDF
                  </button>
                  
                  <button onClick={limpiarFormularioVenta} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-xl font-bold text-lg shadow transition-all flex justify-center items-center gap-2">
                    🔄 Siguiente Venta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE CIERRE DE CAJA --- */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-8 border-orange-500">
            <h2 className="text-2xl font-black text-gray-800 mb-2">Cuadre de Caja</h2>
            <p className="text-gray-600 mb-6">Declara el efectivo físico actual.</p>
            <form onSubmit={handleCerrarCaja} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Efectivo Contado (S/)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-bold">S/</span>
                  <input type="number" required step="0.10" min="0" value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-3 pl-10 text-xl font-bold text-gray-800" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas (Opcional)</label>
                <textarea value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700" rows={2} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModalCierre(false)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" disabled={cerrandoCaja} className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-bold shadow-lg disabled:opacity-50">Confirmar Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}