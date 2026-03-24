'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_STYLES: Record<string, string> = {
  SUPERADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  GERENTE:    'bg-blue-100 text-blue-700 border-blue-200',
  CAJERO:     'bg-slate-100 text-slate-600 border-slate-200',
};

export default function UsuariosPage() {
  const router  = useRouter();
  const [usuarios, setUsuarios]       = useState<any[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [userRole, setUserRole]       = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [mensaje, setMensaje]         = useState({ tipo: '', texto: '' });

  const [form, setForm] = useState({
    fullName: '', email: '', role: 'CAJERO', password: '',
  });

  const token = () => localStorage.getItem('saas_token') || '';

  useEffect(() => {
    // Verificar que el usuario es GERENTE
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) {
        const user = JSON.parse(raw);
        setUserRole(user.role || 'CAJERO');
        if (!['GERENTE', 'SUPERADMIN'].includes(user.role)) {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    cargarUsuarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setUsuarios(data.data);
      else if (res.status === 403) router.push('/dashboard');
    } finally { setCargando(false); }
  };

  const mostrarMensaje = (tipo: string, texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const invitarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/v1/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        mostrarMensaje('ok', data.message);
        setMostrarModal(false);
        setForm({ fullName: '', email: '', role: 'CAJERO', password: '' });
        cargarUsuarios();
      } else {
        mostrarMensaje('err', data.message || 'Error al crear usuario.');
      }
    } finally { setGuardando(false); }
  };

  const cambiarRol = async (userId: string, nuevoRol: string) => {
    const res = await fetch(`${API}/api/v1/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ role: nuevoRol }),
    });
    const data = await res.json();
    if (data.success) {
      mostrarMensaje('ok', data.message);
      cargarUsuarios();
    } else {
      mostrarMensaje('err', data.message);
    }
  };

  const toggleActivo = async (userId: string, activo: boolean) => {
    const res = await fetch(`${API}/api/v1/users/${userId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ active: !activo }),
    });
    const data = await res.json();
    if (data.success) {
      mostrarMensaje('ok', data.message);
      cargarUsuarios();
    } else {
      mostrarMensaje('err', data.message);
    }
  };

  return (
    <div className="bg-slate-50">
      <Navbar />

      <PageWrapper>
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Gestión de usuarios</h1>
            <p className="text-slate-500 text-sm mt-1">
              Administra el acceso de tu equipo al sistema.
            </p>
          </div>
          <button onClick={() => setMostrarModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar usuario
          </button>
        </div>

        {/* Feedback */}
        {mensaje.texto && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Info de roles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { rol: 'GERENTE', desc: 'Acceso completo: POS, reportes, configuración, usuarios.', color: 'border-blue-200 bg-blue-50' },
            { rol: 'CAJERO',  desc: 'Solo POS, inventario e historial de comprobantes.', color: 'border-slate-200 bg-slate-50' },
          ].map((item) => (
            <div key={item.rol} className={`p-3 rounded-xl border ${item.color}`}>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mb-1.5 ${ROLE_STYLES[item.rol]}`}>
                {item.rol}
              </span>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {cargando ? (
            <div className="p-10 flex items-center justify-center text-slate-500">
              <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3" />
              Cargando usuarios...
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-2xl">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500
                  text-xs uppercase tracking-wider">
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-left font-semibold">Usuario</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Rol actual</th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Estado</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Cambiar rol</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${
                    u.active === false ? 'opacity-50' : ''
                  }`}>
                    {/* Usuario */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center
                          justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {u.full_name || '—'}
                          </div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1
                        rounded-full border ${ROLE_STYLES[u.role] || ROLE_STYLES.CAJERO}`}>
                        {u.role || 'CAJERO'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="hidden sm:table-cell px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                        px-2.5 py-1 rounded-full ${
                          u.active === false
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.active === false ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                        {u.active === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>

                    {/* Cambiar rol */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      {u.role !== 'SUPERADMIN' && (
                        <select
                          defaultValue={u.role || 'CAJERO'}
                          onChange={(e) => cambiarRol(u.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5
                            bg-white text-slate-700 focus:outline-none focus:ring-1
                            focus:ring-blue-500 cursor-pointer">
                          <option value="GERENTE">GERENTE</option>
                          <option value="CAJERO">CAJERO</option>
                        </select>
                      )}
                    </td>

                    {/* Activar / Desactivar */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      {u.role !== 'SUPERADMIN' && (
                        <button
                          onClick={() => toggleActivo(u.id, u.active !== false)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg
                            border transition ${
                              u.active === false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            }`}>
                          {u.active === false ? 'Reactivar' : 'Desactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
      </PageWrapper>

      {/* Modal agregar usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 sm:mx-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-slate-800">Agregar usuario</h2>
              <button onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg
                  hover:bg-slate-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={invitarUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nombre completo
                </label>
                <input type="text" required
                  value={form.fullName}
                  onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                    text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                    focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Juan Pérez" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <input type="email" required
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                    text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                    focus:ring-blue-500 focus:outline-none transition"
                  placeholder="cajero@minegocio.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol</label>
                  <select value={form.role}
                    onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                      bg-white text-slate-700 focus:outline-none focus:ring-2
                      focus:ring-blue-500 transition">
                    <option value="CAJERO">CAJERO</option>
                    <option value="GERENTE">GERENTE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Contraseña temporal
                  </label>
                  <input type="password" required minLength={6}
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                      text-slate-800 bg-slate-50 focus:bg-white focus:ring-2
                      focus:ring-blue-500 focus:outline-none transition"
                    placeholder="Min. 6 chars" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                El usuario podrá cambiar su contraseña una vez dentro del sistema.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700
                    py-3 rounded-xl font-semibold text-sm transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white
                    py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
                  {guardando ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
