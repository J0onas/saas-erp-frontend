'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      localStorage.setItem('saas_token', data.access_token);
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
        <div className="mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black mb-3">Sistema POS</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Facturación electrónica para el mercado peruano. 
            Emite, gestiona y controla tu negocio.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: '📄', text: 'Facturas y boletas electrónicas SUNAT' },
            { icon: '📦', text: 'Control de inventario en tiempo real' },
            { icon: '📊', text: 'Reportes y analytics del negocio' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-blue-100">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900">Bienvenido</h2>
              <p className="text-gray-500 mt-1 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verificando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-blue-200 text-xs mt-6">
            Sistema de Facturación Electrónica · Perú
          </p>
        </div>
      </div>
    </div>
  );
}
