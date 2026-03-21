'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { href: '/dashboard',    label: 'POS',          icon: '🏪', roles: undefined },
    { href: '/productos',    label: 'Inventario',   icon: '📦', roles: undefined },
    { href: '/historial',    label: 'Comprobantes', icon: '📂', roles: undefined },
    { href: '/reportes',     label: 'Reportes',     icon: '📊', roles: ['GERENTE', 'SUPERADMIN'] },
    { href: '/proveedores',  label: 'Proveedores',  icon: '🚚', roles: ['GERENTE', 'SUPERADMIN'] },
    { href: '/usuarios',     label: 'Usuarios',     icon: '👥', roles: ['GERENTE', 'SUPERADMIN'] },
    { href: '/configuracion',label: 'Mi Empresa',   icon: '⚙️', roles: ['GERENTE', 'SUPERADMIN'] },
];

const ROLE_STYLES: Record<string, string> = {
    SUPERADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    GERENTE:    'bg-blue-100 text-blue-700 border-blue-200',
    CAJERO:     'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Navbar({ cajaInfo }: { cajaInfo?: string }) {
    const router   = useRouter();
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string>('CAJERO');
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user_data');
            if (raw) {
                const user = JSON.parse(raw);
                setUserRole(user.role || 'CAJERO');
                setUserName(user.name || user.email || '');
            }
        } catch { /**/ }
    }, []);

    const cerrarSesion = () => {
        localStorage.removeItem('saas_token');
        localStorage.removeItem('user_data');
        router.push('/login');
    };

    const itemsVisibles = NAV_ITEMS.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 hidden sm:block">SaaS POS</span>
                        {cajaInfo && (
                            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold
                                text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                {cajaInfo}
                            </span>
                        )}
                    </div>

                    {/* Nav links */}
                    <div className="flex items-center gap-0.5 overflow-x-auto">
                        {itemsVisibles.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <button key={item.href} onClick={() => router.push(item.href)}
                                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5
                                        rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}>
                                    <span className="text-base leading-none">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Usuario + salir */}
                    <div className="flex items-center gap-2">
                        {userRole && (
                            <div className="hidden sm:flex items-center gap-2">
                                {userName && (
                                    <span className="text-xs text-slate-500 font-medium max-w-[90px] truncate">
                                        {userName}
                                    </span>
                                )}
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                    ROLE_STYLES[userRole] || ROLE_STYLES.CAJERO
                                }`}>
                                    {userRole}
                                </span>
                            </div>
                        )}
                        <button onClick={cerrarSesion}
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-500
                                hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:block">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
