'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [xmlResult, setXmlResult] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Protección de ruta: Si no hay token, lo regresamos al login
  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const emitirFactura = async () => {
    setLoading(true);
    setXmlResult(null);
    setSuccessMessage('');
    
    const token = localStorage.getItem('saas_token');

    // Usamos el mismo JSON de prueba que usábamos en Thunder Client
    const payloadFactura = {
      serieNumber: "F001-00000001",
      issueDate: "2026-02-27",
      issueTime: "12:00:00",
      currency: "PEN",
      supplier: {
        ruc: "20123456789",
        businessName: "TECH SOLUTIONS SAC",
        addressCode: "0000"
      },
      customer: {
        documentType: "6",
        documentNumber: "20987654321",
        fullName: "COMERCIALIZADORA DEL NORTE"
      },
      items: [
        {
          id: 1,
          description: "Suscripción SaaS ERP - Plan Pro",
          quantity: 1,
          unitValue: 1000.00,
          unitPrice: 1180.00,
          totalTaxes: 180.00
        }
      ],
      totalTaxBase: 1000.00,
      totalIgv: 180.00,
      totalAmount: 1180.00
    };

    try {
      const response = await fetch('http://localhost:3000/api/v1/invoices/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- AQUÍ INYECTAMOS LA LLAVE MAESTRA
        },
        body: JSON.stringify(payloadFactura),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al emitir factura');
      }

      setSuccessMessage(data.message);
      setXmlResult(data.xmlPreview);

    } catch (error: any) {
      alert(`Falló la emisión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('saas_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Facturación Electrónica</h1>
          <button 
            onClick={cerrarSesion}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Emitir Nuevo Comprobante</h2>
          <p className="text-gray-500 mb-6">Haz clic en el botón para generar una factura de prueba y enviarla a la base de datos y al OSE simulado.</p>
          
          <button 
            onClick={emitirFactura}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Procesando en el servidor...' : '🚀 Emitir Factura UBL 2.1'}
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <strong>¡Éxito! </strong> {successMessage}
          </div>
        )}

        {xmlResult && (
          <div className="bg-gray-900 rounded-xl p-4 shadow-inner overflow-hidden">
            <h3 className="text-gray-300 text-sm font-bold mb-2 uppercase tracking-wider">XML Generado (Respuesta del Backend)</h3>
            <pre className="text-green-400 text-xs overflow-x-auto p-2">
              <code>{xmlResult}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}