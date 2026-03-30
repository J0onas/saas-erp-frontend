'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL PAGE - Verificación de correo electrónico
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <EnvelopeIcon className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        <p className="text-slate-600 font-medium">Verificando tu correo...</p>
        <p className="text-slate-400 text-sm">Esto solo tomará un momento</p>
      </div>
    </div>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError('No se proporcionó un token de verificación.');
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email?token=${token}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setMessage(data.message || '¡Tu correo ha sido verificado exitosamente!');
      } else {
        setError(data.message || 'No se pudo verificar el correo. El enlace puede haber expirado.');
      }
    } catch {
      setError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  // Estado: Verificando
  if (isVerifying) {
    return <LoadingSpinner />;
  }

  // Estado: Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">No se pudo verificar</h1>
            <p className="text-slate-500">{error}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-amber-800 font-medium text-sm">
              Esto puede ocurrir porque:
            </p>
            <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
              <li>El enlace ha expirado (validez de 24 horas)</li>
              <li>Ya verificaste tu correo anteriormente</li>
              <li>El enlace fue copiado incorrectamente</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              Ir a iniciar sesión
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            
            <p className="text-slate-400 text-sm">
              Si necesitas un nuevo enlace, intenta iniciar sesión y te daremos la opción de reenviarlo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Éxito
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animación de éxito */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">
            ¡Verificación exitosa!
          </h1>
          <p className="text-slate-500 text-lg">
            {message}
          </p>
        </div>

        {/* Card de bienvenida */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">¡Bienvenido a SaaS ERP!</p>
              <p className="text-emerald-600 text-sm">Tu cuenta está lista para usar</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-emerald-700">
            <p className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              14 días de prueba gratuita activados
            </p>
            <p className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              Acceso completo a todas las funciones
            </p>
            <p className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              Soporte incluido durante tu prueba
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
        >
          Iniciar sesión ahora
          <ArrowRightIcon className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
