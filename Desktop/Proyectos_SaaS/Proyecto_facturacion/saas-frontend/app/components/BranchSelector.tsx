'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = 'selected_branch';

// ── Hook para usar la sucursal seleccionada en cualquier página ───────────────
export function useBranch() {
    const [branch, setBranchState] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setBranchState(JSON.parse(raw));
        } catch { /**/ }
    }, []);

    const setBranch = (b: { id: string; name: string } | null) => {
        setBranchState(b);
        if (b) localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
        else localStorage.removeItem(STORAGE_KEY);
    };

    return { branch, setBranch };
}

// ── Selector de sucursal para el POS ─────────────────────────────────────────
export default function BranchSelector({
    onBranchChange,
}: {
    onBranchChange?: (branch: { id: string; name: string } | null) => void;
}) {
    const [sucursales, setSucursales]       = useState<any[]>([]);
    const [seleccionada, setSeleccionada]   = useState<string>('');
    const [cargando, setCargando]           = useState(true);

    useEffect(() => {
        cargarSucursales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarSucursales = async () => {
        try {
            const token = localStorage.getItem('saas_token') || '';
            const res   = await fetch(`${API}/api/v1/branches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data  = await res.json();
            if (data.success && data.data.length > 0) {
                const activas = data.data.filter((s: any) => s.is_active);
                setSucursales(activas);

                // Restaurar sucursal guardada o usar la principal
                const guardada = localStorage.getItem('selected_branch');
                if (guardada) {
                    const parsed = JSON.parse(guardada);
                    const existe = activas.find((s: any) => s.id === parsed.id);
                    if (existe) {
                        setSeleccionada(parsed.id);
                        onBranchChange?.(parsed);
                        return;
                    }
                }
                // Default: sucursal principal
                const principal = activas.find((s: any) => s.is_main) || activas[0];
                if (principal) {
                    setSeleccionada(principal.id);
                    localStorage.setItem('selected_branch', JSON.stringify({
                        id: principal.id, name: principal.name,
                    }));
                    onBranchChange?.({ id: principal.id, name: principal.name });
                }
            }
        } finally { setCargando(false); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id  = e.target.value;
        const suc = sucursales.find((s) => s.id === id);
        setSeleccionada(id);
        if (suc) {
            localStorage.setItem('selected_branch', JSON.stringify({
                id: suc.id, name: suc.name,
            }));
            onBranchChange?.({ id: suc.id, name: suc.name });
        }
    };

    if (cargando || sucursales.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <select value={seleccionada} onChange={handleChange}
                className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer">
                {sucursales.map((suc) => (
                    <option key={suc.id} value={suc.id}>
                        {suc.name}{suc.is_main ? ' (Principal)' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
