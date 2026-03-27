'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface AppNotification {
    id: string;
    type: 'LOW_STOCK' | 'NEW_INVOICE' | 'SUBSCRIPTION_EXPIRING' | 'SYSTEM' | 'CASH_CLOSED';
    title: string;
    message: string;
    data?: Record<string, any>;
    timestamp: string;
    read?: boolean;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
    LOW_STOCK:              { bg: 'bg-amber-50',   border: 'border-amber-200',  icon: '⚠️' },
    NEW_INVOICE:            { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅' },
    SUBSCRIPTION_EXPIRING:  { bg: 'bg-red-50',     border: 'border-red-200',    icon: '🔔' },
    CASH_CLOSED:            { bg: 'bg-blue-50',    border: 'border-blue-200',   icon: '🔒' },
    SYSTEM:                 { bg: 'bg-slate-50',   border: 'border-slate-200',  icon: 'ℹ️' },
};

export function useNotifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [toasts, setToasts]               = useState<AppNotification[]>([]);
    const [connected, setConnected]         = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('saas_token');
        if (!token) return;

        // Cerrar conexión anterior
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // EventSource no soporta headers, usamos query param para el token
        const url = `${API}/api/v1/notifications/stream`;

        // Para enviar el JWT usamos fetch con SSE manualmente
        const controller = new AbortController();

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
        }).then(async (res) => {
            if (!res.ok || !res.body) return;

            setConnected(true);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let eventData = '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        eventData = line.slice(6);
                    } else if (line === '' && eventData) {
                        try {
                            const notification: AppNotification = JSON.parse(eventData);

                            // No mostrar toast de bienvenida
                            if (notification.type !== 'SYSTEM') {
                                setNotifications(prev => [notification, ...prev].slice(0, 50));
                                addToast(notification);
                            }
                        } catch { /**/ }
                        eventData = '';
                    }
                }
            }
        }).catch(() => {
            setConnected(false);
            // Reconectar en 5 segundos
            reconnectTimer.current = setTimeout(connect, 5000);
        });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            eventSourceRef.current?.close();
        };
    }, [connect]);

    const addToast = (notification: AppNotification) => {
        setToasts(prev => [...prev, notification]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 5000);
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return { notifications, toasts, connected, unreadCount, markAllRead };
}

// ── Componente de Toasts ──────────────────────────────────────────────────────
export function NotificationToasts({ toasts }: { toasts: AppNotification[] }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => {
                const style = TYPE_STYLES[toast.type] || TYPE_STYLES.SYSTEM;
                return (
                    <div key={toast.id}
                        className={`${style.bg} ${style.border} border rounded-2xl px-4 py-3 shadow-lg
                            backdrop-blur-sm pointer-events-auto
                            animate-in slide-in-from-right-5 duration-300`}>
                        <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">{style.icon}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800">{toast.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Componente Panel de Notificaciones ────────────────────────────────────────
export function NotificationPanel({
    notifications,
    unreadCount,
    connected,
    onMarkAllRead,
}: {
    notifications: AppNotification[];
    unreadCount: number;
    connected: boolean;
    onMarkAllRead: () => void;
}) {
    const [open, setOpen] = useState(false);

    const style_map = TYPE_STYLES;

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                onClick={() => { setOpen(!open); if (!open) onMarkAllRead(); }}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700
                    hover:bg-slate-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white
                        text-[10px] font-black rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {/* Indicador de conexión */}
                <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${
                    connected ? 'bg-emerald-400' : 'bg-slate-300'
                }`} />
            </button>

            {/* Panel dropdown */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl
                        border border-slate-200 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 text-sm">Notificaciones</h3>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    connected
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {connected ? '● En vivo' : '○ Desconectado'}
                                </span>
                            </div>
                            {notifications.length > 0 && (
                                <button onClick={onMarkAllRead}
                                    className="text-xs text-blue-600 hover:underline font-medium">
                                    Marcar todo leído
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-96">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    Sin notificaciones aún
                                </div>
                            ) : notifications.map((n) => {
                                const s = style_map[n.type] || style_map.SYSTEM;
                                return (
                                    <div key={n.id}
                                        className={`flex items-start gap-3 px-4 py-3 border-b
                                            border-slate-50 hover:bg-slate-50 transition ${
                                            !n.read ? 'bg-blue-50/30' : ''
                                        }`}>
                                        <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                                {!n.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(n.timestamp).toLocaleTimeString('es-PE', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
