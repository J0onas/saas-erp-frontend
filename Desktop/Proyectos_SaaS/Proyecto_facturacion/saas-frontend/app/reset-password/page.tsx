'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  SparklesIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

// ═══════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD PAGE - UI/UX Profesional
// Diseño Split Screen consistente con login, register y forgot-password
// Tema: Verde esmeralda (seguridad + éxito)
// ═══════════════════════════════════════════════════════════════════════════════

// Validación de contraseña
interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

function isPasswordStrong(validation: PasswordValidation): boolean {
  return Object.values(validation).every(Boolean);
}

// Loading fallback para Suspense
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
}

// Componente de indicador de fortaleza
function PasswordStrengthIndicator({ validation }: { validation: PasswordValidation }) {
  const rules = [
    { key: 'minLength', label: 'Al menos 8 caracteres', valid: validation.minLength },
    { key: 'hasUppercase', label: 'Una letra mayúscula', valid: validation.hasUppercase },
    { key: 'hasLowercase', label: 'Una letra minúscula', valid: validation.hasLowercase },
    { key: 'hasNumber', label: 'Un número', valid: validation.hasNumber },
    { key: 'hasSpecial', label: 'Un carácter especial (!@#$%...)', valid: validation.hasSpecial },
  ];

  const validCount = Object.values(validation).filter(Boolean).length;
  const strengthPercent = (validCount / 5) * 100;

  return (
    <div className="mt-3 space-y-3">
      {/* Barra de fortaleza */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Fortaleza de contraseña</span>
          <span className={`font-medium ${
            strengthPercent === 100 ? 'text-emerald-500' :
            strengthPercent >= 60 ? 'text-amber-500' :
            'text-red-500'
          }`}>
            {strengthPercent === 100 ? 'Excelente' :
             strengthPercent >= 60 ? 'Media' :
             'Débil'}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              strengthPercent === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              strengthPercent >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        {rules.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              rule.valid ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <CheckCircleIcon className={`w-4 h-4 ${
              rule.valid ? 'text-emerald-500' : 'text-slate-300'
            }`} />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estados del formulario
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados de validación y UI
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Verificar token al cargar la página
  const verifyToken = useCallback(async () => {
    if (!token) {
      setTokenError('No se proporcionó un token de recuperación válido.');
      setIsVerifyingToken(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-reset-token?token=${token}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
      } else {
        setTokenError(
          data.message || 'El enlace de recuperación ha expirado o no es válido.'
        );
      }
    } catch {
      setTokenError(
        'No se pudo verificar el enlace. Por favor, verifica tu conexión a internet.'
      );
    } finally {
      setIsVerifyingToken(false);
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Actualizar validación de contraseña
  useEffect(() => {
    setPasswordValidation(validatePassword(password));
  }, [password]);

  // Verificar si las contraseñas coinciden
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  // Countdown para redirección después de éxito
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      router.push('/login');
    }
  }, [isSuccess, countdown, router]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validaciones
    if (!isPasswordStrong(passwordValidation)) {
      setSubmitError('La contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setSubmitError(
          data.message || 'No se pudo restablecer la contraseña. Por favor, intenta nuevamente.'
        );
      }
    } catch {
      setSubmitError(
        'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Estados de carga y error de token
  // ═══════════════════════════════════════════════════════════════════════════

  // Estado: Verificando token
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Verificando enlace de recuperación...</p>
          <p className="text-slate-400 text-sm">Esto solo tomará un momento</p>
        </div>
      </div>
    );
  }

  // Estado: Token inválido o expirado
  if (!tokenValid && !isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">Enlace no válido</h1>
            <p className="text-slate-500">{tokenError}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-amber-800 font-medium text-sm">
              Esto puede ocurrir porque:
            </p>
            <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
              <li>El enlace ha expirado (validez de 1 hora)</li>
              <li>Ya has utilizado este enlace anteriormente</li>
              <li>El enlace fue copiado incorrectamente</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
            >
              <KeyIcon className="w-5 h-5" />
              Solicitar nuevo enlace
            </Link>
            
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full text-slate-600 py-3 px-4 rounded-xl font-medium hover:bg-slate-100 transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Contraseña cambiada exitosamente
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircleIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-slate-500">
              Tu contraseña ha sido restablecida exitosamente.
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <ShieldCheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                Hemos enviado un correo de confirmación
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
            >
              Ir a iniciar sesión
            </Link>
            
            <p className="text-slate-400 text-sm">
              Serás redirigido automáticamente en {countdown} segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Formulario principal
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ═══════════════════════════════════════════════════════════════════════
          LADO IZQUIERDO: Formulario
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center md:text-left">
            {/* Logo placeholder */}
            <div className="flex items-center gap-2 justify-center md:justify-start mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                SaaS<span className="text-emerald-500">ERP</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Crear nueva contraseña
            </h1>
            <p className="text-slate-500">
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error de envío */}
            {submitError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            {/* Campo: Nueva contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Nueva contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                  required
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <PasswordStrengthIndicator validation={passwordValidation} />
              )}
            </div>

            {/* Campo: Confirmar contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Confirmar contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    !passwordsMatch && confirmPassword
                      ? 'border-red-300 focus:ring-red-500/40 focus:border-red-500'
                      : 'border-slate-200 focus:ring-emerald-500/40 focus:border-emerald-500'
                  }`}
                  required
                  autoComplete="new-password"
                  aria-invalid={!passwordsMatch}
                  aria-describedby="confirm-password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Error de contraseñas no coinciden */}
              {!passwordsMatch && confirmPassword && (
                <p id="confirm-password-error" className="flex items-center gap-1.5 text-red-500 text-sm mt-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  Las contraseñas no coinciden
                </p>
              )}

              {/* Contraseñas coinciden */}
              {passwordsMatch && confirmPassword && password && (
                <p className="flex items-center gap-1.5 text-emerald-500 text-sm mt-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordStrong(passwordValidation) || !passwordsMatch || !confirmPassword}
              className="relative w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:shadow-none overflow-hidden group"
            >
              <span className={`flex items-center justify-center gap-2 transition-transform duration-200 ${isLoading ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <ShieldCheckIcon className="w-5 h-5" />
                Restablecer contraseña
              </span>
              
              {/* Loading state */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando...</span>
                  </div>
                </div>
              )}
            </button>
          </form>

          {/* Volver al login */}
          <div className="text-center pt-4 border-t border-slate-100">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LADO DERECHO: Branding
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-reset" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-reset)" />
          </svg>
        </div>

        {/* Círculos decorativos */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>

        {/* Contenido */}
        <div className="relative z-10 max-w-lg text-center space-y-8">
          {/* Ilustración de seguridad */}
          <div className="w-32 h-32 mx-auto bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
            <ShieldCheckIcon className="w-16 h-16 text-white" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              Tu seguridad es nuestra{' '}
              <span className="text-emerald-200">prioridad</span>
            </h2>
            <p className="text-emerald-100/80 text-lg">
              Crea una contraseña segura para proteger tu cuenta y toda tu información empresarial.
            </p>
          </div>

          {/* Tips de seguridad */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5" />
              Consejos de seguridad
            </h3>
            <ul className="space-y-3 text-emerald-100/80 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Usa una combinación de letras, números y símbolos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>No reutilices contraseñas de otros sitios</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Considera usar un gestor de contraseñas</span>
              </li>
            </ul>
          </div>

          {/* Badge de confianza */}
          <div className="flex items-center justify-center gap-3 text-emerald-100/60 text-sm">
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Conexión cifrada de extremo a extremo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
