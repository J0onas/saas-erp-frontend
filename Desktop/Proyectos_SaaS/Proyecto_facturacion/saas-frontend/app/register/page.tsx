'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = datos empresa, 2 = credenciales

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!form.businessName.trim()) {
      setError('Ingresa el nombre de tu negocio');
      return false;
    }
    if (!form.ruc || form.ruc.length !== 11) {
      setError('El RUC debe tener exactamente 11 dígitos');
      return false;
    }
    if (!/^\d{11}$/.test(form.ruc)) {
      setError('El RUC solo debe contener números');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/register-tenant`, {
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

      localStorage.setItem('saas_token', data.access_token);
      if (data.user) localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/dashboard');

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsDontMatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LADO IZQUIERDO - FORMULARIO */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">SaaS POS</span>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Crea tu cuenta gratis
            </h1>
            <p className="mt-2 text-slate-500">
              14 días de prueba sin compromiso
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                Empresa
              </span>
            </div>
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                Cuenta
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              role="alert"
              aria-live="polite"
              className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm"
            >
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                {/* Business Name */}
                <div>
                  <label 
                    htmlFor="businessName" 
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Razón social / Nombre del negocio
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    value={form.businessName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 
                             placeholder:text-slate-400
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="Mi Bodeguita S.A.C."
                    required
                    autoFocus
                  />
                </div>

                {/* RUC and Full Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="ruc" 
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      RUC
                    </label>
                    <input
                      id="ruc"
                      name="ruc"
                      type="text"
                      value={form.ruc}
                      onChange={handleChange}
                      maxLength={11}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 
                               font-mono placeholder:text-slate-400 placeholder:font-sans
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200"
                      placeholder="20123456789"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1.5">11 dígitos</p>
                  </div>
                  <div>
                    <label 
                      htmlFor="fullName" 
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Tu nombre
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 
                               placeholder:text-slate-400
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200"
                      placeholder="Juan Pérez"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Opcional</p>
                  </div>
                </div>

                {/* Next Step Button */}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                           text-white font-semibold py-3.5 rounded-xl 
                           transition-all duration-200 
                           shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           flex items-center justify-center gap-2"
                >
                  <span>Continuar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Email */}
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
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 
                             placeholder:text-slate-400
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="admin@minegocio.com"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50
                               placeholder:text-slate-400
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200"
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoComplete="new-password"
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

                {/* Confirm Password */}
                <div>
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl text-slate-900 bg-slate-50/50
                               placeholder:text-slate-400
                               focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                               transition-all duration-200 ${
                                 passwordsDontMatch 
                                   ? 'border-red-300 focus:ring-red-500' 
                                   : passwordsMatch 
                                     ? 'border-green-300 focus:ring-green-500' 
                                     : 'border-slate-200 focus:ring-blue-500'
                               }`}
                      placeholder="Repite tu contraseña"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? (
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
                  {passwordsMatch && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Las contraseñas coinciden
                    </p>
                  )}
                  {passwordsDontMatch && (
                    <p className="text-xs text-red-600 mt-1.5">Las contraseñas no coinciden</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 border border-slate-200 rounded-xl text-slate-700 font-medium
                             hover:bg-slate-50 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
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
                        <span>Creando cuenta...</span>
                      </>
                    ) : (
                      <>
                        <span>Crear cuenta gratis</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            Al crear tu cuenta aceptas nuestros{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Términos de servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de privacidad
            </Link>
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LADO DERECHO - BRANDING */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative bg-slate-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-blue-600/20" />
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <div className="max-w-lg">
            {/* Trial Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              14 días de prueba gratis
            </div>

            {/* Main Value Proposition */}
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Empieza a facturar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                hoy mismo
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-10">
              Configura tu negocio en minutos. Sin tarjeta de crédito, sin compromisos. 
              Cancela cuando quieras.
            </p>

            {/* Benefits List */}
            <div className="space-y-5 mb-12">
              {[
                { 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ), 
                  title: 'Sin tarjeta de crédito', 
                  desc: 'Empieza gratis, paga después' 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ), 
                  title: 'Listo en 5 minutos', 
                  desc: 'Configura y emite tu primera factura' 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ), 
                  title: 'Soporte incluido', 
                  desc: 'Te ayudamos a empezar' 
                },
              ].map((benefit, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Preview */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-3">Después del trial:</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">S/ 79</span>
                <span className="text-slate-400">/ mes</span>
              </div>
              <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Plan Starter - Todo incluido
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
