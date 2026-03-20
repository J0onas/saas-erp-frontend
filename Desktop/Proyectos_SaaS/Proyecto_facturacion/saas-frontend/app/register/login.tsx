'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    ruc: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.ruc.length !== 11) {
      setError('El RUC debe tener exactamente 11 dígitos.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.'); return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          ruc: form.ruc,
          email: form.email,
          password: form.password,
          fullName: form.fullName || form.businessName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear la cuenta');
      }

      // Guardar token y redirigir al POS
      localStorage.setItem('saas_token', data.access_token);
      if (data.user) localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>

      {/* Panel decorativo izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black mb-3">Empieza gratis</h1>
        <p className="text-blue-200 text-lg leading-relaxed mb-8">
          14 días de prueba gratuita. Sin tarjeta de crédito.
          Cancela cuando quieras.
        </p>
        <div className="space-y-3">
          {[
            '✓ Facturas y boletas electrónicas SUNAT',
            '✓ Control de inventario en tiempo real',
            '✓ Reportes y analytics del negocio',
            '✓ Soporte técnico incluido',
          ].map((item, i) => (
            <p key={i} className="text-blue-100 text-sm font-medium">{item}</p>
          ))}
        </div>

        {/* Badge de trial */}
        <div className="mt-10 inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">14 días completamente gratis</p>
            <p className="text-blue-200 text-xs">Luego S/.120/mes o S/.1,150/año</p>
          </div>
        </div>
      </div>

      {/* Formulario de registro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-7">
            <div className="mb-6">
              <h2 className="text-xl font-black text-gray-900">Crear cuenta</h2>
              <p className="text-gray-500 text-sm mt-1">
                Completa los datos de tu negocio para empezar.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Razón social o nombre del negocio *
                </label>
                <input type="text" name="businessName" required
                  value={form.businessName} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                  placeholder="Mi Bodeguita S.A.C." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    RUC *
                  </label>
                  <input type="text" name="ruc" required maxLength={11}
                    value={form.ruc} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                    placeholder="20123456789" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nombre del admin
                  </label>
                  <input type="text" name="fullName"
                    value={form.fullName} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                    placeholder="Tu nombre" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Correo electrónico *
                </label>
                <input type="email" name="email" required
                  value={form.email} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                  placeholder="admin@minegocio.com" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Contraseña *
                  </label>
                  <input type="password" name="password" required
                    value={form.password} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                    placeholder="Min. 6 caracteres" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirmar *
                  </label>
                  <input type="password" name="confirmPassword" required
                    value={form.confirmPassword} onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Repite la clave" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm mt-2">
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Creando tu cuenta...
                  </>
                ) : (
                  'Crear cuenta gratis — 14 días de prueba'
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-5">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          <p className="text-center text-blue-200 text-xs mt-4">
            Sistema de Facturación Electrónica · Perú
          </p>
        </div>
      </div>
    </div>
  );
}
