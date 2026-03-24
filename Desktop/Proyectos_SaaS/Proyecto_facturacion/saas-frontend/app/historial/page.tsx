'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const API = process.env.NEXT_PUBLIC_API_URL;

const RAZONES = [
    'Error en el precio',
    'Error en los datos del cliente',
    'Producto no entregado',
    'Devolución del cliente',
    'Duplicado por error',
    'Otro motivo',
];

export default function HistorialPage() {
    const router = useRouter();
    const [invoices, setInvoices]   = useState<any[]>([]);
    const [loading, setLoading]     = useState(true);
    const [busqueda, setBusqueda]   = useState('');
    const [userRole, setUserRole]   = useState('CAJERO');

    // Modal de anulación
    const [modalAnular, setModalAnular]       = useState<any>(null);
    const [razonAnular, setRazonAnular]       = useState(RAZONES[0]);
    const [anulando, setAnulando]             = useState(false);
    const [mensajeAnulacion, setMensajeAnulacion] = useState('');

    const token = () => localStorage.getItem('saas_token') || '';

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (raw) setUserRole(JSON.parse(raw).role || 'CAJERO');
        } catch { /* */ }
        cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/v1/invoices/history`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setInvoices(data);
        } finally { setLoading(false); }
    };

    const descargarPdf = async (invoiceId: string, comprobante: string) => {
        try {
            const res = await fetch(`${API}/api/v1/invoices/${invoiceId}/pdf`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdfDocument}`;
            link.download = `${comprobante}.pdf`;
            link.click();
        } catch { alert('Error descargando el PDF.'); }
    };

    const confirmarAnulacion = async () => {
        if (!modalAnular) return;
        setAnulando(true);
        setMensajeAnulacion('');
        try {
            const res = await fetch(
                `${API}/api/v1/invoices/${modalAnular.id}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify({ reason: razonAnular }),
                }
            );
            const data = await res.json();
            if (data.success) {
                setMensajeAnulacion(`✅ ${data.message}`);
                setTimeout(() => {
                    setModalAnular(null);
                    setMensajeAnulacion('');
                    cargarHistorial();
                }, 2000);
            } else {
                setMensajeAnulacion(`❌ ${data.message}`);
            }
        } catch {
            setMensajeAnulacion('❌ Error de conexión.');
        } finally {
            setAnulando(false);
        }
    };

    const filtradas = invoices.filter((f) => {
        const t = busqueda.toLowerCase();
        return (
            (f.full_name || '').toLowerCase().includes(t) ||
            (f.customer_document || '').toLowerCase().includes(t) ||
            (f.comprobante || '').toLowerCase().includes(t)
        );
    });

    const metodoPill = (metodo: string) => {
        const m = (metodo || 'EFECTIVO').toUpperCase();
        const map: Record<string, { cls: string; label: string }> = {
            YAPE:          { cls: 'bg-violet-100 text-violet-700 border-violet-200', label: '📱 Yape/Plin' },
            TARJETA:       { cls: 'bg-cyan-100 text-cyan-700 border-cyan-200',       label: '💳 Tarjeta' },
            TRANSFERENCIA: { cls: 'bg-orange-100 text-orange-700 border-orange-200', label: '🏦 Transf.' },
            EFECTIVO:      { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '💵 Efectivo' },
        };
        const s = map[m] || map.EFECTIVO;
        return (
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="bg-slate-50">
            <Navbar />

            <PageWrapper>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Historial de comprobantes</h1>
                        <p className="text-slate-500 text-sm mt-1">Bóveda de facturación electrónica.</p>
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input type="text" value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
                                text-slate-700 bg-white focus:ring-2 focus:ring-blue-500
                                focus:outline-none transition w-full sm:w-64"
                            placeholder="Buscar cliente, RUC, comprobante..." />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex items-center justify-center text-slate-500">
                            <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
                            Cargando bóveda...
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-2xl">
                            <table className="w-full text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200
                                        text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-left font-semibold">Comprobante</th>
                                        <th className="hidden sm:table-cell px-3 sm:px-5 py-2.5 sm:py-3.5 text-left font-semibold">Fecha</th>
                                        <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-left font-semibold">Cliente</th>
                                        <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-right font-semibold">Total</th>
                                        <th className="hidden sm:table-cell px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Pago</th>
                                        <th className="hidden sm:table-cell px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Estado</th>
                                        <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtradas.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                                                {busqueda
                                                    ? `Sin resultados para "${busqueda}"`
                                                    : 'No hay comprobantes registrados.'}
                                            </td>
                                        </tr>
                                    ) : filtradas.map((inv) => (
                                        <tr key={inv.id}
                                            className={`hover:bg-slate-50 transition-colors ${inv.cancelled ? 'opacity-50' : ''}`}>

                                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block bg-slate-100 border border-slate-200
                                                        text-slate-800 text-xs font-bold font-mono px-2 py-1 rounded-lg">
                                                        {inv.comprobante || inv.id.split('-')[0]}
                                                    </span>
                                                    {inv.cancelled && (
                                                        <span className="text-xs bg-red-100 text-red-600
                                                            border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                                                            ANULADA
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="hidden sm:table-cell px-3 sm:px-5 py-3 sm:py-4 text-slate-600 font-medium">
                                                {inv.fecha || '—'}
                                            </td>

                                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                                                <div className="font-semibold text-slate-800 max-w-[160px] truncate">
                                                    {inv.full_name || 'Sin registrar'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {inv.customer_document}
                                                </div>
                                            </td>

                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-right font-bold text-blue-600">
                                                S/ {Number(inv.total_amount).toFixed(2)}
                                            </td>

                                            <td className="hidden sm:table-cell px-3 sm:px-5 py-3 sm:py-4 text-center">
                                                {metodoPill(inv.payment_method)}
                                            </td>

                                            <td className="hidden sm:table-cell px-3 sm:px-5 py-3 sm:py-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-semibold border ${
                                                    inv.cancelled
                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                        : inv.xml_ubl_status === 'ACCEPTED'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {inv.cancelled ? '✗ Anulada'
                                                     : inv.xml_ubl_status === 'ACCEPTED' ? '✓ Aceptado'
                                                     : '⏳ Pendiente'}
                                                </span>
                                            </td>

                                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* PDF */}
                                                    <button
                                                        onClick={() => descargarPdf(inv.id, inv.comprobante)}
                                                        className="inline-flex items-center gap-1 text-blue-600
                                                            hover:text-blue-700 bg-blue-50 hover:bg-blue-100
                                                            border border-blue-100 px-2.5 py-1.5 rounded-lg
                                                            text-xs font-bold transition">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        PDF
                                                    </button>

                                                    {/* Anular — solo GERENTE y no anuladas */}
                                                    {['GERENTE', 'SUPERADMIN'].includes(userRole) &&
                                                     !inv.cancelled && (
                                                        <button
                                                            onClick={() => {
                                                                setModalAnular(inv);
                                                                setRazonAnular(RAZONES[0]);
                                                            }}
                                                            className="inline-flex items-center gap-1 text-red-600
                                                                hover:text-red-700 bg-red-50 hover:bg-red-100
                                                                border border-red-200 px-2.5 py-1.5 rounded-lg
                                                                text-xs font-bold transition">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                            Anular
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && (
                    <p className="mt-3 text-xs text-slate-400">
                        {filtradas.length} comprobante{filtradas.length !== 1 ? 's' : ''}
                        {filtradas.filter(f => f.cancelled).length > 0 && (
                            <span className="ml-2 text-red-400">
                                · {filtradas.filter(f => f.cancelled).length} anulados
                            </span>
                        )}
                    </p>
                )}
            </div>
            </PageWrapper>

            {/* ── MODAL DE ANULACIÓN ─────────────────────────────────────────── */}
            {modalAnular && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 sm:mx-auto border-t-4 border-red-500">
                        <h2 className="text-lg font-black text-slate-800 mb-1">
                            Anular comprobante
                        </h2>
                        <p className="text-slate-500 text-sm mb-5">
                            Se generará una Nota de Crédito y se restaurará el stock.
                        </p>

                        {/* Info del comprobante */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-mono font-bold text-slate-800">
                                    {modalAnular.comprobante}
                                </span>
                                <span className="font-bold text-blue-600">
                                    S/ {Number(modalAnular.total_amount).toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {modalAnular.full_name || 'Cliente sin registrar'}
                            </p>
                        </div>

                        {/* Razón */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Motivo de anulación *
                            </label>
                            <select value={razonAnular}
                                onChange={(e) => setRazonAnular(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                                    text-sm text-slate-700 bg-white focus:ring-2
                                    focus:ring-red-400 focus:outline-none">
                                {RAZONES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {/* Aviso */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-700">
                            Esta acción no se puede deshacer. Solo se puede anular comprobantes del día de hoy (norma SUNAT).
                        </div>

                        {/* Mensaje resultado */}
                        {mensajeAnulacion && (
                            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                                mensajeAnulacion.startsWith('✅')
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                                {mensajeAnulacion}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setModalAnular(null)}
                                disabled={anulando}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700
                                    py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50">
                                Cancelar
                            </button>
                            <button onClick={confirmarAnulacion} disabled={anulando}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white
                                    py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                {anulando ? 'Anulando...' : 'Confirmar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
