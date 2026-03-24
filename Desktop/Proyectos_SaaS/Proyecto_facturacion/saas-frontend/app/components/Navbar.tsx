'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  pos:       (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>),
  inventory: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
  receipts:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  reports:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  suppliers: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>),
  users:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  branches:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  settings:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
  logout:    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  lock:      (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>),
  menu:      (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  close:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  chevronL:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>),
  chevronR:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  more:      (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>),
};

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'POS',          icon: Icons.pos,       roles: undefined,                         mobileShow: true },
  { href: '/productos',     label: 'Inventario',   icon: Icons.inventory, roles: undefined,                         mobileShow: true },
  { href: '/historial',     label: 'Comprobantes', icon: Icons.receipts,  roles: undefined,                         mobileShow: true },
  { href: '/reportes',      label: 'Reportes',     icon: Icons.reports,   roles: ['GERENTE', 'SUPERADMIN'],          mobileShow: false },
  { href: '/sucursales',    label: 'Sucursales',   icon: Icons.branches,  roles: ['GERENTE', 'SUPERADMIN'],          mobileShow: false },
  { href: '/proveedores',   label: 'Proveedores',  icon: Icons.suppliers, roles: ['GERENTE', 'SUPERADMIN'],          mobileShow: false },
  { href: '/usuarios',      label: 'Usuarios',     icon: Icons.users,     roles: ['GERENTE', 'SUPERADMIN'],          mobileShow: false },
  { href: '/configuracion', label: 'Mi Empresa',   icon: Icons.settings,  roles: ['GERENTE', 'SUPERADMIN'],          mobileShow: false },
];

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  GERENTE:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CAJERO:     'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const COLLAPSED_KEY = 'sidebar_collapsed';

export default function Navbar({ cajaInfo, onCerrarTurno }: {
  cajaInfo?: string;
  onCerrarTurno?: () => void;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole]   = useState('CAJERO');
  const [userName, setUserName]   = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // drawer lateral en móvil

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) {
        const user = JSON.parse(raw);
        setUserRole(user.role || 'CAJERO');
        setUserName(user.name || user.email || '');
      }
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch { /**/ }
  }, []);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: next } }));
  };

  const cerrarSesion = () => {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('user_data');
    router.push('/login');
  };

  const itemsVisibles = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  // Ítems que se muestran en la bottom nav (máximo 4 + "Más")
  const itemsBottomNav = itemsVisibles.filter(i => i.mobileShow).slice(0, 4);
  const itemsDrawer    = itemsVisibles; // todos en el drawer

  return (
    <>
      {/* ── SIDEBAR DESKTOP (md+) ───────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? 68 : 220 }}
        className="hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col
          bg-[#0f172a] border-r border-white/5
          transition-all duration-300 ease-in-out overflow-hidden">

        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-3 h-16 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 text-white">{Icons.receipts}</div>
            </div>
            {!collapsed && <span className="text-white font-bold text-sm tracking-wide whitespace-nowrap">SaaS POS</span>}
          </div>
          <button onClick={toggleCollapsed}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5 transition flex-shrink-0">
            <div className="w-4 h-4">{collapsed ? Icons.chevronR : Icons.chevronL}</div>
          </button>
        </div>

        {/* Caja glass */}
        {cajaInfo && (
          <div className="mx-2 mt-3 mb-1 px-3 py-2.5 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-emerald-300 text-xs font-semibold truncate">{cajaInfo}</p>
                  <p className="text-emerald-500 text-[10px]">Turno activo</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {itemsVisibles.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <div className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-2 space-y-1 flex-shrink-0">
          {onCerrarTurno && (
            <button onClick={onCerrarTurno} title={collapsed ? 'Cerrar turno' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all">
              <div className="w-5 h-5 flex-shrink-0">{Icons.lock}</div>
              {!collapsed && <span className="whitespace-nowrap">Cerrar turno</span>}
            </button>
          )}
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-white/5">
              <p className="text-white text-xs font-semibold truncate">{userName || 'Usuario'}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 ${ROLE_COLORS[userRole] || ROLE_COLORS.CAJERO}`}>
                {userRole}
              </span>
            </div>
          )}
          <button onClick={cerrarSesion} title={collapsed ? 'Salir' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <div className="w-5 h-5 flex-shrink-0">{Icons.logout}</div>
            {!collapsed && <span className="whitespace-nowrap">Salir</span>}
          </button>
        </div>
      </aside>

      {/* ── TOPBAR MÓVIL (solo md-) ─────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14
        bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 text-white">{Icons.receipts}</div>
          </div>
          <span className="text-white font-bold text-sm">SaaS POS</span>
          {cajaInfo && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {cajaInfo}
            </span>
          )}
        </div>
        <button onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition">
          <div className="w-5 h-5">{Icons.menu}</div>
        </button>
      </header>

      {/* ── DRAWER LATERAL MÓVIL ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />

          {/* Panel */}
          <div className="relative w-72 bg-[#0f172a] h-full flex flex-col shadow-2xl">
            {/* Header drawer */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 text-white">{Icons.receipts}</div>
                </div>
                <span className="text-white font-bold text-sm">SaaS POS</span>
              </div>
              <button onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition">
                <div className="w-5 h-5">{Icons.close}</div>
              </button>
            </div>

            {/* Usuario en drawer */}
            <div className="mx-3 mt-3 px-4 py-3 rounded-xl bg-white/5 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{userName || 'Usuario'}</p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${ROLE_COLORS[userRole] || ROLE_COLORS.CAJERO}`}>
                  {userRole}
                </span>
              </div>
            </div>

            {/* Nav en drawer */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {itemsDrawer.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button key={item.href} onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <div className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
                  </button>
                );
              })}
            </nav>

            {/* Footer drawer */}
            <div className="border-t border-white/5 p-3 space-y-1">
              {onCerrarTurno && (
                <button onClick={onCerrarTurno}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition">
                  <div className="w-5 h-5">{Icons.lock}</div>
                  <span>Cerrar turno</span>
                </button>
              )}
              <button onClick={cerrarSesion}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
                <div className="w-5 h-5">{Icons.logout}</div>
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV MÓVIL ────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
        bg-[#0f172a] border-t border-white/5
        flex items-center justify-around px-2 h-16 safe-area-pb">
        {itemsBottomNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              <div className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`}>{item.icon}</div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
        {/* Botón "Más" para acceder al drawer */}
        <button onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 transition">
          <div className="w-5 h-5">{Icons.more}</div>
          <span className="text-[10px] font-semibold">Más</span>
        </button>
      </nav>
    </>
  );
}
