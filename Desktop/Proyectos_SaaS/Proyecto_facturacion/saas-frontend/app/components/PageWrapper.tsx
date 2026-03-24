'use client';

import { useEffect, useState } from 'react';

const COLLAPSED_KEY = 'sidebar_collapsed';

export default function PageWrapper({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch { /**/ }

    const handler = (e: Event) => {
      setCollapsed((e as CustomEvent).detail.collapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  return (
    <div
      className={`transition-all duration-300 min-h-screen
        /* Mobile: topbar de 56px + bottom nav de 64px */
        pt-14 pb-20
        /* Desktop: sidebar lateral, sin padding top/bottom */
        md:pt-0 md:pb-0
        ${className}
      `}
      style={{
        // En desktop aplica el margen del sidebar
        // En mobile no aplica margen lateral
      }}>
      {/* Wrapper interno para el margen del sidebar en desktop */}
      <div
        className="hidden md:block"
        style={{ marginLeft: collapsed ? 68 : 220, transition: 'margin-left 300ms ease-in-out' }} />
      <div
        className="md:hidden"
        style={{ marginLeft: 0 }} />
      {/* Contenido real */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: 0 }}>
        {/* Este div solo aplica el margen en desktop */}
        <InnerWrapper collapsed={collapsed} className={className}>
          {children}
        </InnerWrapper>
      </div>
    </div>
  );
}

function InnerWrapper({ children, collapsed, className }: {
  children: React.ReactNode;
  collapsed: boolean;
  className?: string;
}) {
  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        // Solo en md+ aplicamos el margen del sidebar
      }}>
      {/* Mobile layout: sin margen lateral */}
      <div className="md:hidden">
        {children}
      </div>
      {/* Desktop layout: con margen del sidebar */}
      <div
        className="hidden md:block transition-all duration-300"
        style={{ marginLeft: collapsed ? 68 : 220 }}>
        {children}
      </div>
    </div>
  );
}
