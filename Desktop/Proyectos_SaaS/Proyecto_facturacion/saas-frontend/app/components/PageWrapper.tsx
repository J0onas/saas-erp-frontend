'use client';

import { useEffect, useState } from 'react';

const COLLAPSED_KEY = 'sidebar_collapsed';

// Envuelve el contenido de cada página con el margen correcto del sidebar.
// Úsalo así en cada página que tenga <Navbar />:
//
//   <div className="min-h-screen bg-slate-50">
//     <Navbar />
//     <PageWrapper>
//       {/* tu contenido */}
//     </PageWrapper>
//   </div>

export default function PageWrapper({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Leer estado inicial del sidebar
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch { /**/ }

    // Escuchar cambios cuando el usuario colapsa/expande el sidebar
    const handler = (e: Event) => {
      setCollapsed((e as CustomEvent).detail.collapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  return (
    <div
      style={{ marginLeft: collapsed ? 68 : 220 }}
      className={`transition-all duration-300 min-h-screen ${className}`}>
      {children}
    </div>
  );
}
