'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import {
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    UsersIcon,
    CalendarIcon,
    DocumentTextIcon,
    CreditCardIcon,
    ArrowPathIcon,
    XMarkIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Credit {
    id: string;
    invoice_number: string;
    client_name: string;
    customer_document: string;
    issue_date: string;
    total_amount: number;
    amount_paid: number;
    pending_amount: number;
    days_overdue: number;
}

interface CreditsData {
    success: boolean;
    total_pending: number;
    total_amount: number;
    credits: Credit[];
}

interface SelectedCredit {
    id: string;
    client_name: string;
    invoice_number: string;
    pending_amount: number;
}

export default function CreditosPage() {
    const router = useRouter();
    const [data, setData] = useState<CreditsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Estado del modal
    const [selectedCredit, setSelectedCredit] = useState<SelectedCredit | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        // Verificar rol
        try {
            const raw = localStorage.getItem('user_data');
            if (!raw) { router.push('/login'); return; }
            const user = JSON.parse(raw);
            if (!['GERENTE', 'SUPERADMIN'].includes(user.role)) {
                router.push('/dashboard');
                return;
            }
        } catch { router.push('/login'); return; }

        fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCredits = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await fetch(`${API}/api/v1/invoices/credits`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error('Error fetching credits:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePayment = (credit: Credit) => {
        setSelectedCredit({
            id: credit.id,
            client_name: credit.client_name,
            invoice_number: credit.invoice_number,
            pending_amount: credit.pending_amount,
        });
        setPaymentAmount(credit.pending_amount.toString());
        setError('');
        dialogRef.current?.showModal();
    };

    const closeModal = () => {
        dialogRef.current?.close();
        setSelectedCredit(null);
        setPaymentAmount('');
        setError('');
    };

    const handleSubmitPayment = async () => {
        if (!selectedCredit) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Ingresa un monto válido mayor a 0');
            return;
        }
        if (amount > selectedCredit.pending_amount) {
            setError('El monto no puede ser mayor a la deuda pendiente');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${API}/api/v1/invoices/credits/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    invoice_id: selectedCredit.id,
                    amount: amount,
                }),
            });

            const json = await res.json();

            if (json.success) {
                closeModal();
                fetchCredits(true);
            } else {
                setError(json.message || 'Error al procesar el pago');
            }
        } catch (err) {
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Métricas calculadas
    const totalPorCobrar = data?.total_amount || 0;
    const deudaVencida = data?.credits
        .filter(c => c.days_overdue > 0)
        .reduce((sum, c) => sum + Number(c.pending_amount), 0) || 0;
    const clientesEnMora = new Set(
        data?.credits.filter(c => c.days_overdue > 0).map(c => c.customer_document)
    ).size;

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

    if (loading) {
        return (
            <>
                <Navbar />
                <PageWrapper>
                    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                        <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                </PageWrapper>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <PageWrapper>
                <div className="min-h-screen bg-slate-900 p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                                <CreditCardIcon className="w-8 h-8 text-blue-500" />
                                Cuentas por Cobrar
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Gestiona los créditos pendientes de tus clientes
                            </p>
                        </div>
                        <button
                            onClick={() => fetchCredits(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 
                                       text-white rounded-lg transition-colors border border-slate-700
                                       disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>

                    {/* Bento Box - Tarjetas Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Total por Cobrar */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6
                                        hover:border-blue-500/50 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Total por Cobrar</p>
                                    <p className="text-3xl font-bold text-white mt-2">
                                        {formatMoney(totalPorCobrar)}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {data?.total_pending || 0} facturas pendientes
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Deuda Vencida */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6
                                        hover:border-red-500/50 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Deuda Vencida</p>
                                    <p className="text-3xl font-bold text-red-400 mt-2">
                                        {formatMoney(deudaVencida)}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Requiere atención inmediata
                                    </p>
                                </div>
                                <div className="p-3 bg-red-500/20 rounded-xl">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                        </div>

                        {/* Clientes en Mora */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6
                                        hover:border-amber-500/50 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Clientes en Mora</p>
                                    <p className="text-3xl font-bold text-amber-400 mt-2">
                                        {clientesEnMora}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Con pagos atrasados
                                    </p>
                                </div>
                                <div className="p-3 bg-amber-500/20 rounded-xl">
                                    <UsersIcon className="w-6 h-6 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Deudores */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                                Listado de Créditos Pendientes
                            </h2>
                        </div>

                        {/* Tabla con scroll horizontal en móvil */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-800/80">
                                        <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">
                                            Cliente
                                        </th>
                                        <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">
                                            Documento
                                        </th>
                                        <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                Fecha Emisión
                                            </div>
                                        </th>
                                        <th className="text-center text-slate-400 text-sm font-medium px-4 py-3">
                                            Días Vencidos
                                        </th>
                                        <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                                            Monto Total
                                        </th>
                                        <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                                            Pendiente
                                        </th>
                                        <th className="text-center text-slate-400 text-sm font-medium px-4 py-3">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {data?.credits && data.credits.length > 0 ? (
                                        data.credits.map((credit) => (
                                            <tr
                                                key={credit.id}
                                                className="hover:bg-slate-700/30 transition-colors"
                                            >
                                                <td className="px-4 py-4">
                                                    <p className="text-white font-medium">
                                                        {credit.client_name}
                                                    </p>
                                                    <p className="text-slate-500 text-sm">
                                                        {credit.invoice_number}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-slate-300 font-mono text-sm">
                                                    {credit.customer_document}
                                                </td>
                                                <td className="px-4 py-4 text-slate-300">
                                                    {new Date(credit.issue_date).toLocaleDateString('es-PE')}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {credit.days_overdue > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 
                                                                         bg-red-500/20 text-red-400 rounded-full 
                                                                         text-sm font-medium">
                                                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                                            {credit.days_overdue} días
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 bg-green-500/20 
                                                                         text-green-400 rounded-full text-sm font-medium">
                                                            Al día
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right text-slate-300 font-medium">
                                                    {formatMoney(credit.total_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-white font-semibold">
                                                        {formatMoney(credit.pending_amount)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => handlePayment(credit)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5
                                                                   text-sm font-medium text-blue-400 
                                                                   border border-blue-500/50 rounded-lg
                                                                   hover:bg-blue-500/20 hover:border-blue-500
                                                                   transition-all duration-200"
                                                    >
                                                        <CurrencyDollarIcon className="w-4 h-4" />
                                                        Registrar Pago
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-slate-700/50 rounded-full">
                                                        <CreditCardIcon className="w-8 h-8 text-slate-500" />
                                                    </div>
                                                    <p className="text-slate-400">
                                                        No hay créditos pendientes
                                                    </p>
                                                    <p className="text-slate-500 text-sm">
                                                        Todos los pagos están al día
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer de la tabla */}
                        {data?.credits && data.credits.length > 0 && (
                            <div className="px-4 py-3 bg-slate-800/80 border-t border-slate-700 
                                            flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-slate-400 text-sm">
                                    Mostrando {data.credits.length} créditos pendientes
                                </p>
                                <p className="text-white font-semibold">
                                    Total: {formatMoney(totalPorCobrar)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </PageWrapper>

            {/* Modal de Pago */}
            <dialog
                ref={dialogRef}
                className="bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm"
                onClick={(e) => {
                    if (e.target === dialogRef.current) closeModal();
                }}
            >
                <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
                    {/* Header del Modal */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                            Registrar Abono
                        </h3>
                        <button
                            onClick={closeModal}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 
                                       rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {selectedCredit && (
                        <>
                            {/* Info del Cliente */}
                            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700">
                                <p className="text-slate-400 text-sm">Cliente</p>
                                <p className="text-white font-semibold text-lg">
                                    {selectedCredit.client_name}
                                </p>
                                <p className="text-slate-500 text-sm mt-1">
                                    {selectedCredit.invoice_number}
                                </p>
                                
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <p className="text-slate-400 text-sm">Deuda Pendiente</p>
                                    <p className="text-2xl font-bold text-amber-400">
                                        {formatMoney(selectedCredit.pending_amount)}
                                    </p>
                                </div>
                            </div>

                            {/* Input de Monto */}
                            <div className="mb-6">
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Monto a pagar
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        S/
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedCredit.pending_amount}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-xl 
                                                   py-3 pl-10 pr-4 text-white text-lg font-semibold
                                                   focus:outline-none focus:border-blue-500 focus:ring-1 
                                                   focus:ring-blue-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-slate-500 text-xs mt-2">
                                    Puedes ingresar un monto menor para un pago parcial
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 
                                                rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 
                                               text-white rounded-xl transition-colors
                                               disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 
                                               text-white font-semibold rounded-xl transition-colors
                                               disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            Confirmar Pago
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </dialog>
        </>
    );
}
