'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SuscripcionPage() {
    const router = useRouter();
    const [planes, setPlanes]           = useState<any[]>([]);
    const [planActual, setPlanActual]   = useState<any>(null);
    const [cargando, setCargando]       = useState(true);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [ciclo, setCiclo]             = useState<'mensual' | 'anual'>('mensual');

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [planesRes, actualRes] = await Promise.all([
                fetch(`${API}/api/v1/plans`),
                fetch(`${API}/api/v1/plans/current`, {
                    headers: { Authorization: `Bearer ${token()}` },
                }),
            ]);
            const planesData = await planesRes.json();
            const actualData = await actualRes.json();
            if (planesData.success) setPlanes(planesData.data);
            if (actualData.success) setPlanActual(actualData.data);
        } finally { setCargando(false); }
    };

    const iniciarPago = async (plan: any) => {
        setLoadingPlan(plan.name);
        try {
            const precio = ciclo === 'anual' ? plan.price_yearly : plan.price_monthly;
            const res = await fetch(`${API}/api/v1/invoices/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ planName: plan.display_name, precio }),
            });
            const data = await res.json();
            if (data.success && data.url) {
                window.location.href = data.url;
            }
        } finally { setLoadingPlan(null); }
    };

    const esPlanActual = (plan: any) =>
        planActual?.name === plan.name;

    const formatLimit = (val: number, unit: string) =>
        val === -1 ? 'Ilimitados' : `${val} ${unit}`;

    const descuento = (plan: any) => {
        if (!plan.price_monthly || !plan.price_yearly) return 0;
        const anualizadoMensual = plan.price_monthly * 12;
        return Math.round((1 - plan.price_yearly / anualizadoMensual) * 100);
    };

    const PLAN_STYLES: Record<string, {
        border: string; badge: string; btn: string; highlight: boolean;
    }> = {
        STARTER:    { border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', btn: 'bg-slate-800 hover:bg-slate-700 text-white', highlight: false },
        PRO:        { border: 'border-blue-500 ring-2 ring-blue-500/20', badge: 'bg-blue-600 text-white', btn: 'bg-blue-600 hover:bg-blue-700 text-white', highlight: true },
        ENTERPRISE: { border: 'border-purple-300', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700 text-white', highlight: false },
    };

    return (
        <div className="bg-slate-50">
            <Navbar />
            <PageWrapper>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-slate-900 mb-3">
                            Planes y suscripción
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Elige el plan que mejor se adapte a tu negocio.
                            Cambia o cancela cuando quieras.
                        </p>

                        {/* Toggle ciclo */}
                        <div className="inline-flex items-center gap-3 mt-6 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                            <button onClick={() => setCiclo('mensual')}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
                                    ciclo === 'mensual'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}>
                                Mensual
                            </button>
                            <button onClick={() => setCiclo('anual')}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                                    ciclo === 'anual'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}>
                                Anual
                                <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                                    -20%
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Plan actual */}
                    {planActual && (
                        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Plan actual</p>
                                    <p className="font-black text-slate-900 text-lg">
                                        {planActual.display_name || 'Sin plan asignado'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Vence</p>
                                <p className="font-bold text-slate-800">
                                    {planActual.subscription_valid_until
                                        ? new Date(planActual.subscription_valid_until)
                                            .toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                                        : '—'}
                                </p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    planActual.subscription_status === 'ACTIVE'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : planActual.subscription_status === 'TRIAL'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-red-100 text-red-600'
                                }`}>
                                    {planActual.subscription_status === 'ACTIVE' ? 'Activo'
                                     : planActual.subscription_status === 'TRIAL' ? 'En prueba'
                                     : 'Suspendido'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tarjetas de planes */}
                    {cargando ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-blue-600 rounded-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {planes.map((plan) => {
                                const style   = PLAN_STYLES[plan.name] || PLAN_STYLES.STARTER;
                                const precio  = ciclo === 'anual' ? plan.price_yearly : plan.price_monthly;
                                const desc    = descuento(plan);
                                const esActual = esPlanActual(plan);
                                const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');

                                return (
                                    <div key={plan.id}
                                        className={`bg-white rounded-2xl border ${style.border} p-6 flex flex-col shadow-sm relative`}>

                                        {/* Badge Popular */}
                                        {style.highlight && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                                                    MÁS POPULAR
                                                </span>
                                            </div>
                                        )}

                                        {/* Badge ahorro anual */}
                                        {ciclo === 'anual' && desc > 0 && (
                                            <div className="absolute top-4 right-4">
                                                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-1 rounded-lg">
                                                    -{desc}%
                                                </span>
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${style.badge}`}>
                                                {plan.name}
                                            </span>
                                            <h3 className="text-xl font-black text-slate-900">{plan.display_name}</h3>

                                            <div className="mt-4 flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-slate-900">
                                                    S/ {Number(precio).toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                                                </span>
                                                <span className="text-slate-500 text-sm font-medium">
                                                    /{ciclo === 'anual' ? 'año' : 'mes'}
                                                </span>
                                            </div>
                                            {ciclo === 'anual' && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Equivale a S/ {(plan.price_yearly / 12).toFixed(0)}/mes
                                                </p>
                                            )}
                                        </div>

                                        {/* Límites */}
                                        <div className="grid grid-cols-3 gap-2 mb-5 bg-slate-50 rounded-xl p-3">
                                            {[
                                                { label: 'Usuarios', val: formatLimit(plan.max_users, '') },
                                                { label: 'Productos', val: formatLimit(plan.max_products, '') },
                                                { label: 'Fact./mes', val: formatLimit(plan.max_invoices_mo, '') },
                                            ].map((item) => (
                                                <div key={item.label} className="text-center">
                                                    <p className="text-xs font-black text-slate-900">{item.val}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-2.5 flex-1 mb-6">
                                            {features.map((f: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    <span className="text-slate-600">{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Botón */}
                                        {esActual ? (
                                            <div className="w-full py-3 bg-slate-100 text-slate-500 font-bold text-sm rounded-xl text-center">
                                                ✓ Plan actual
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => iniciarPago(plan)}
                                                disabled={loadingPlan !== null}
                                                className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${style.btn}`}>
                                                {loadingPlan === plan.name
                                                    ? 'Procesando...'
                                                    : `Elegir ${plan.display_name}`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-center text-slate-400 text-sm mt-10">
                        🔒 Pagos 100% seguros con MercadoPago · Cancela cuando quieras · Sin contratos
                    </p>
                </div>
            </PageWrapper>
        </div>
    );
}
