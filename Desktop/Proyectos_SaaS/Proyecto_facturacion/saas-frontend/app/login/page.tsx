'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        // Detectar si es error de verificación
        if (data.message?.includes('verifica tu correo')) {
          setNeedsVerification(true);
        }
        throw new Error(data.message || 'Credenciales incorrectas');
      }
      if (data.access_token) localStorage.setItem('saas_token', data.access_token);
      if (data.user) localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Ingresa tu correo para reenviar la verificación');
      return;
    }
    setResendingEmail(true);
    try {
      await fetch(`${apiUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setError('');
      setNeedsVerification(false);
      alert('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch {
      setError('Error al reenviar el correo');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LADO IZQUIERDO - FORMULARIO */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">SaaS POS</span>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-slate-500">
              Ingresa a tu panel de control
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              role="alert"
              aria-live="polite"
              className={`mb-6 flex flex-col gap-3 px-4 py-3.5 rounded-xl text-sm ${
                needsVerification 
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="self-start ml-8 text-amber-800 font-medium underline hover:text-amber-900 disabled:opacity-50"
                >
                  {resendingEmail ? 'Enviando...' : 'Reenviar correo de verificación'}
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 
                         placeholder:text-slate-400
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200"
                placeholder="tu@empresa.com"
                required
                autoComplete="email"
                aria-describedby="email-description"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50
                           placeholder:text-slate-400
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                       disabled:opacity-60 disabled:cursor-not-allowed
                       text-white font-semibold py-3.5 rounded-xl 
                       transition-all duration-200 
                       shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿No tienes cuenta?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
            <p className="text-slate-400 text-xs mt-1">14 días de prueba sin compromiso</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LADO DERECHO - BRANDING */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative bg-slate-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          {/* Main Value Proposition */}
          <div className="max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Transforma la gestión de tu negocio{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                hoy
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-10">
              Facturación electrónica, control de inventario y reportes en tiempo real. 
              Todo lo que necesitas para hacer crecer tu empresa.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-12">
              {[
                { icon: '📄', text: 'Facturas y boletas electrónicas SUNAT' },
                { icon: '📦', text: 'Gestión de inventario multi-sucursal' },
                { icon: '📊', text: 'Reportes y analytics en tiempo real' },
                { icon: '💳', text: 'Múltiples métodos de pago integrados' },
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-4 text-slate-200"
                >
                  <span className="text-xl" role="img" aria-hidden="true">{feature.icon}</span>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-900 flex items-center justify-center"
                  >
                    <span className="text-xs text-white font-medium">
                      {['JZ', 'MC', 'RL', 'AP'][i - 1]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-white font-semibold">+500 empresas</span>
                <span className="text-slate-400"> confían en nosotros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
