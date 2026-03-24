'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ConfiguracionPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    business_name: '',
    ruc: '',
    address: '',
    email: '',
  });

  useEffect(() => {
  // Verificar rol antes de cargar
  try {
    const raw = localStorage.getItem('user_data');
    if (!raw) { router.push('/login'); return; }
    const user = JSON.parse(raw);
    if (!['GERENTE', 'SUPERADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  } catch {
    router.push('/login');
    return;
  }
  cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const token = () => localStorage.getItem('saas_token') || '';

  const cargar = async () => {
    const t = token();
    if (!t) { router.push('/login'); return; }
    try {
      const res = await fetch(`${API}/api/v1/settings/company`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success && data.data) setForm(data.data);
    } finally { setCargando(false); }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setGuardado(false); setError('');
    try {
      const res = await fetch(`${API}/api/v1/settings/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 4000);
      } else {
        setError('No se pudo guardar la configuración. Intenta de nuevo.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally { setGuardando(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-50">
      <Navbar />

      <PageWrapper>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Configuración del negocio</h1>
          <p className="text-slate-500 text-sm mt-1">
            Esta información aparece en la cabecera de todas tus facturas y boletas.
          </p>
        </div>

        {/* Aviso importante */}
        <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Los datos guardados aquí reemplazan automáticamente el texto <strong>"EMPRESA LOCAL"</strong> en 
            todos los PDFs que emitas. Configúralo una sola vez y siempre saldrá correcto.
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="bg-slate-800 px-6 py-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Perfil fiscal de la empresa
            </h2>
          </div>

          {cargando ? (
            <div className="p-10 flex items-center justify-center text-slate-500">
              <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
              Cargando datos...
            </div>
          ) : (
            <form onSubmit={guardar} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Razón social o nombre comercial *
                </label>
                <input type="text" name="business_name" required
                  value={form.business_name} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Ej. Mi Bodeguita S.A.C." />
                <p className="text-xs text-slate-400 mt-1">
                  Este nombre aparecerá destacado en la cabecera de todos tus comprobantes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">RUC *</label>
                  <input type="text" name="ruc" required maxLength={11}
                    value={form.ruc} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="20123456789" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo de contacto</label>
                  <input type="email" name="email"
                    value={form.email} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="contacto@minegocio.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dirección fiscal</label>
                <input type="text" name="address"
                  value={form.address} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Ej. Av. Los Olivos 123, Lima" />
              </div>

              {/* Mensajes */}
              {guardado && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Configuración guardada! Tus próximos PDFs mostrarán estos datos.
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button type="submit" disabled={guardando}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                  {guardando ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Guardar configuración
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </PageWrapper>
    </div>
  );
}
