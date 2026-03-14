'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ConfiguracionPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado del formulario
  const [formData, setFormData] = useState({
    business_name: '',
    ruc: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    cargarConfiguracion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarConfiguracion = async () => {
    const token = localStorage.getItem('saas_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/company`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setFormData({
          business_name: data.data.business_name || '',
          ruc: data.data.ruc || '',
          address: data.data.address || '',
          email: data.data.email || ''
        });
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    
    const token = localStorage.getItem('saas_token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/company`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setMensaje({ tipo: 'exito', texto: '¡Configuración de la empresa guardada correctamente!' });
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo guardar la configuración.' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setGuardando(false);
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Barra Superior */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Negocio</h1>
            <p className="text-gray-500 mt-1">Personaliza los datos que aparecerán en tus comprobantes.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-lg font-medium shadow-sm transition">
              ← Volver al POS
            </Link>
          </div>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🏢 Perfil Fiscal de la Empresa
            </h2>
          </div>

          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando datos de la empresa...</div>
          ) : (
            <form onSubmit={guardarConfiguracion} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Razón Social o Nombre Comercial *</label>
                  <input 
                    type="text" 
                    name="business_name"
                    required
                    value={formData.business_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                    placeholder="Ej. Mi Bodeguita S.A.C."
                  />
                  <p className="text-xs text-gray-500 mt-1">Este nombre aparecerá en la cabecera de tus PDFs.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">RUC *</label>
                  <input 
                    type="text" 
                    name="ruc"
                    required
                    maxLength={11}
                    value={formData.ruc}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 font-mono"
                    placeholder="Ej. 20123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Correo de Contacto</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                    placeholder="contacto@minegocio.com"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Fiscal</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                    placeholder="Ej. Av. Los Olivos 123, Lima"
                  />
                </div>
              </div>

              {/* Mensajes de Alerta */}
              {mensaje.texto && (
                <div className={`p-4 rounded-lg font-medium text-sm ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {mensaje.tipo === 'exito' ? '✅ ' : '❌ '} {mensaje.texto}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={guardando}
                  className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-bold shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando cambios...' : '💾 Guardar Configuración'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}