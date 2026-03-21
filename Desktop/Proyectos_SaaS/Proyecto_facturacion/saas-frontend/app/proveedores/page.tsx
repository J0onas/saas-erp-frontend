'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL;

const FORM_VACIO = {
    name: '', ruc: '', contact_name: '',
    email: '', phone: '', address: '', notes: '',
};

// ── FIX: InputField FUERA del componente para evitar remount en cada tecla ──
function InputField({
    label, name, type = 'text', placeholder = '', required = false,
    value, onChange,
}: {
    label: string; name: string; type?: string;
    placeholder?: string; required?: boolean;
    value: string; onChange: (name: string, value: string) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {label}{required && ' *'}
            </label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                    text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                    focus:ring-blue-500 focus:outline-none transition"
            />
        </div>
    );
}

export default function ProveedoresPage() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [cargando, setCargando]       = useState(true);
    const [busqueda, setBusqueda]       = useState('');
    const [mensaje, setMensaje]         = useState({ tipo: '', texto: '' });
    const [verInactivos, setVerInactivos] = useState(false);

    const [modalForm, setModalForm]   = useState<'crear' | 'editar' | null>(null);
    const [provEditar, setProvEditar] = useState<any>(null);
    const [form, setForm]             = useState({ ...FORM_VACIO });
    const [guardando, setGuardando]   = useState(false);

    const [provHistorial, setProvHistorial] = useState<any>(null);
    const [historial, setHistorial]         = useState<any[]>([]);
    const [cargandoHist, setCargandoHist]   = useState(false);

    const token = () => localStorage.getItem('saas_token') || '';

    // Handler estable para InputField — no recrea en cada render
    const handleField = (name: string, value: string) => {
        setForm(p => ({ ...p, [name]: value }));
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (raw) {
                const user = JSON.parse(raw);
                if (!['GERENTE', 'SUPERADMIN'].includes(user.role)) {
                    router.push('/dashboard'); return;
                }
            } else { router.push('/login'); return; }
        } catch { router.push('/login'); return; }
        cargarProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verInactivos]);

    const mostrarMsg = (tipo: string, texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    };

    const cargarProveedores = async () => {
        setCargando(true);
        try {
            const url = verInactivos
                ? `${API}/api/v1/suppliers`
                : `${API}/api/v1/suppliers?active=true`;
            const res  = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
            const data = await res.json();
            if (data.success) setProveedores(data.data);
        } finally { setCargando(false); }
    };

    const abrirCrear = () => {
        setForm({ ...FORM_VACIO });
        setProvEditar(null);
        setModalForm('crear');
    };

    const abrirEditar = (prov: any) => {
        setForm({
            name: prov.name || '',
            ruc: prov.ruc || '',
            contact_name: prov.contact_name || '',
            email: prov.email || '',
            phone: prov.phone || '',
            address: prov.address || '',
            notes: prov.notes || '',
        });
        setProvEditar(prov);
        setModalForm('editar');
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const isEditar = modalForm === 'editar' && provEditar;
            const url    = isEditar
                ? `${API}/api/v1/suppliers/${provEditar.id}`
                : `${API}/api/v1/suppliers`;
            const method = isEditar ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    name: form.name,
                    ruc: form.ruc || undefined,
                    contact_name: form.contact_name || undefined,
                    email: form.email || undefined,
                    phone: form.phone || undefined,
                    address: form.address || undefined,
                    notes: form.notes || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                mostrarMsg('ok', data.message);
                setModalForm(null);
                cargarProveedores();
            } else {
                mostrarMsg('err', data.message || 'Error al guardar.');
            }
        } finally { setGuardando(false); }
    };

    const toggleActivo = async (prov: any) => {
        const nuevoEstado = !prov.active;
        if (!nuevoEstado && !confirm(`¿Desactivar a "${prov.name}"?`)) return;
        const res  = await fetch(`${API}/api/v1/suppliers/${prov.id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ active: nuevoEstado }),
        });
        const data = await res.json();
        if (data.success) { mostrarMsg('ok', data.message); cargarProveedores(); }
        else mostrarMsg('err', data.message);
    };

    const verHistorial = async (prov: any) => {
        setProvHistorial(prov);
        setCargandoHist(true);
        try {
            const res  = await fetch(`${API}/api/v1/suppliers/${prov.id}/history`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.success) setHistorial(data.data);
        } finally { setCargandoHist(false); }
    };

    const filtrados = proveedores.filter((p) => {
        const t = busqueda.toLowerCase();
        return (
            p.name.toLowerCase().includes(t) ||
            (p.ruc || '').includes(t) ||
            (p.contact_name || '').toLowerCase().includes(t) ||
            (p.email || '').toLowerCase().includes(t)
        );
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Proveedores</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Gestiona tus contactos de compras y abastecimiento.
                        </p>
                    </div>
                    <button onClick={abrirCrear}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                            text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo proveedor
                    </button>
                </div>

                {mensaje.texto && (
                    <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                        mensaje.tipo === 'ok'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <input type="text" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full sm:w-72 px-4 py-2.5 border border-slate-200 rounded-xl
                            text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500
                            focus:outline-none transition"
                        placeholder="🔍 Buscar por nombre, RUC o contacto..." />
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={verInactivos}
                            onChange={(e) => setVerInactivos(e.target.checked)}
                            className="accent-blue-600 w-4 h-4" />
                        Mostrar inactivos
                    </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Tabla */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {cargando ? (
                            <div className="p-10 flex items-center justify-center text-slate-500">
                                <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
                                Cargando proveedores...
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200
                                        text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="px-5 py-3.5 text-left font-semibold">Proveedor</th>
                                        <th className="px-5 py-3.5 text-center font-semibold">Compras</th>
                                        <th className="px-5 py-3.5 text-center font-semibold">Estado</th>
                                        <th className="px-5 py-3.5 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                                                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay proveedores registrados.'}
                                            </td>
                                        </tr>
                                    ) : filtrados.map((prov) => (
                                        <tr key={prov.id}
                                            className={`hover:bg-slate-50 transition-colors ${!prov.active ? 'opacity-50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-800">{prov.name}</div>
                                                <div className="flex flex-wrap gap-3 mt-0.5">
                                                    {prov.ruc && <span className="text-xs font-mono text-slate-400">RUC: {prov.ruc}</span>}
                                                    {prov.contact_name && <span className="text-xs text-slate-400">👤 {prov.contact_name}</span>}
                                                    {prov.phone && <span className="text-xs text-slate-400">📞 {prov.phone}</span>}
                                                    {prov.email && <span className="text-xs text-slate-400">✉️ {prov.email}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700">{prov.total_orders}</span>
                                                <span className="text-xs text-slate-400 ml-1">órdenes</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                                    prov.active
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${prov.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {prov.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => abrirEditar(prov)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition text-xs font-medium">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => verHistorial(prov)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition text-xs font-medium">
                                                        Historial
                                                    </button>
                                                    <button onClick={() => toggleActivo(prov)}
                                                        className={`px-2.5 py-1.5 rounded-lg border transition text-xs font-medium ${
                                                            prov.active
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                                        }`}>
                                                        {prov.active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!cargando && (
                            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                                {filtrados.length} proveedor{filtrados.length !== 1 ? 'es' : ''}
                            </div>
                        )}
                    </div>

                    {/* Panel historial */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-700">
                                {provHistorial ? `Historial — ${provHistorial.name}` : 'Historial de compras'}
                            </h3>
                            {!provHistorial && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Haz clic en "Historial" de un proveedor
                                </p>
                            )}
                        </div>
                        <div className="overflow-y-auto max-h-[460px]">
                            {cargandoHist ? (
                                <div className="p-6 flex items-center justify-center text-slate-400 text-sm">
                                    <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-blue-600 rounded-full mr-2" />
                                    Cargando...
                                </div>
                            ) : historial.length === 0 && provHistorial ? (
                                <div className="p-6 text-center text-slate-400 text-sm">
                                    Sin compras registradas con este proveedor.
                                </div>
                            ) : historial.map((h) => (
                                <div key={h.id}
                                    className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition">
                                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        ↑
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-slate-800 truncate">{h.product_name}</span>
                                            <span className="text-xs font-bold text-emerald-700 ml-2 flex-shrink-0">+{h.quantity} un.</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{h.reason}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{h.fecha}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL CREAR / EDITAR ──────────────────────────────────────── */}
            {modalForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">
                                {modalForm === 'crear' ? 'Nuevo proveedor' : `Editar — ${provEditar?.name}`}
                            </h2>
                            <button onClick={() => setModalForm(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={guardar} className="space-y-4">
                            {/* Todos los InputField usan value + onChange estables */}
                            <InputField label="Nombre o razón social" name="name"
                                placeholder="Ej. Distribuidora Lima SAC" required
                                value={form.name} onChange={handleField} />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="RUC" name="ruc"
                                    placeholder="20123456789"
                                    value={form.ruc} onChange={handleField} />
                                <InputField label="Teléfono / WhatsApp" name="phone"
                                    placeholder="+51 999 999 999"
                                    value={form.phone} onChange={handleField} />
                            </div>

                            <InputField label="Nombre del contacto" name="contact_name"
                                placeholder="Ej. Juan Pérez"
                                value={form.contact_name} onChange={handleField} />

                            <InputField label="Correo electrónico" name="email"
                                type="email" placeholder="contacto@proveedor.com"
                                value={form.email} onChange={handleField} />

                            <InputField label="Dirección" name="address"
                                placeholder="Av. Los Olivos 123, Lima"
                                value={form.address} onChange={handleField} />

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Notas internas
                                </label>
                                <textarea value={form.notes}
                                    onChange={(e) => handleField('notes', e.target.value)}
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                                        text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                                        focus:ring-blue-500 focus:outline-none transition resize-none"
                                    placeholder="Ej. Entrega los martes, pago a 30 días..." />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalForm(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                                    {guardando
                                        ? 'Guardando...'
                                        : modalForm === 'crear' ? 'Crear proveedor' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
