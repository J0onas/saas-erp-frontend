# Copilot Instructions — POSmart Frontend

## Contexto Global del Sistema posMart

Eres un Senior Full-Stack Engineer trabajando en posMart, un SaaS POS multi-tenant.

### Backend (saas-backend)
- Framework: NestJS 11 + TypeScript.
- Base de Datos: PostgreSQL 16 (Supabase). No usamos ORM Entities, solo TypeORM Raw Queries (`queryRunner.query`).
- Regla de Oro Multi-tenant: TODA consulta debe iniciar con la transacción: `SELECT set_config('app.current_tenant', $1, true)`.
- Aislamiento: El `tenant_id` se extrae del JWT vía `@AuthGuard('jwt')`.

### Frontend (saas-frontend)
- Framework: Next.js 16 (App Router) + React 19.
- Estilos: Tailwind CSS v4.
- UI/UX: Diseño limpio, responsivo, B2B, modo oscuro por defecto (`bg-slate-900`), estilo "Bento Box" para dashboards.
- Componentes: Usar íconos de `lucide-react`.

### Reglas de Ejecución
- Analiza los archivos existentes usando `@` antes de crear nuevos.
- Escribe código limpio, maneja errores en bloques try/catch y haz rollback de transacciones si fallan.

---

Next.js 16 App Router with React 19 and Tailwind CSS 4.

**Related**: See `../saas-backend/.github/copilot-instructions.md` for backend architecture and full project context.

---

## Build & Run Commands

```bash
npm install
npm run dev      # Development (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Architecture

### App Router Structure

```
app/
├── components/              # Shared: Navbar, PageWrapper, BranchSelector, useNotifications
├── dashboard/page.tsx       # Main POS screen (cart + invoicing)
├── productos/               # Inventory management
├── historial/               # Invoice history
├── reportes/                # Analytics (GERENTE+ only)
├── usuarios/                # User management (GERENTE+ only)
├── sucursales/              # Multi-branch (GERENTE+ only)
├── configuracion/           # Business settings (GERENTE+ only)
├── superadmin/              # Platform admin (SUPERADMIN only)
├── login/, register/, forgot-password/, reset-password/, verify-email/
└── layout.tsx               # Root layout with fonts
```

### Role-Based Navigation

Navigation items are filtered by user role in `components/Navbar.tsx`:

| Route | Roles |
|-------|-------|
| `/dashboard`, `/productos`, `/historial` | All authenticated |
| `/reportes`, `/sucursales`, `/proveedores`, `/usuarios`, `/configuracion` | `GERENTE`, `SUPERADMIN` |
| `/superadmin` | `SUPERADMIN` only |

### API Communication

```typescript
const API = process.env.NEXT_PUBLIC_API_URL;

// Pattern used throughout pages:
const res = await fetch(`${API}/api/v1/endpoint`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('saas_token')}` },
});
```

- **Token storage**: `localStorage.saas_token`
- **User data**: `localStorage.user_data` (JSON with `email`, `name`, `role`)
- **Subscription expired**: Handle `res.status === 402` → show renewal modal

### Real-time Notifications

`useNotifications()` hook connects to SSE stream at `/api/v1/notifications/stream`.

```typescript
const { notifications, toasts, connected, unreadCount, markAllRead } = useNotifications();
```

Components: `NotificationToasts` (floating), `NotificationPanel` (dropdown).

### Layout Components

- **`PageWrapper`**: Handles responsive margin for sidebar (collapsed/expanded state via `localStorage.sidebar_collapsed`)
- **`Navbar`**: Desktop sidebar + mobile topbar + bottom nav. Emits `sidebar-toggle` custom event
- **`BranchSelector`**: Multi-branch dropdown for tenants with branches feature

---

## Key Conventions

### Component Pattern
```typescript
'use client';  // Required for hooks, state, effects

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PageName() {
  const router = useRouter();
  // Auth check on mount
  useEffect(() => {
    if (!localStorage.getItem('saas_token')) router.push('/login');
  }, []);
  // ...
}
```

### Styling
- **Tailwind CSS 4** with dark theme base (`bg-[#0f172a]`, `bg-slate-900`)
- **Responsive**: Mobile-first, `md:` breakpoint for desktop
- **Glass effects**: `bg-white/5`, `border-white/10`, `backdrop-blur-sm`
- **Gradients**: `bg-gradient-to-br from-blue-600 to-indigo-600`

### Forms
- Controlled inputs with `useState`
- Loading states: `disabled={loading}` + spinner
- Error display: Alert div with conditional rendering

### Icons
- Custom SVG icons defined in `Navbar.tsx` (`Icons` object)
- `@heroicons/react` available for additional icons

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001   # Backend API (include port, no trailing slash)
```

---

## Common Patterns

### Protected Page
```typescript
useEffect(() => {
  const token = localStorage.getItem('saas_token');
  if (!token) { router.push('/login'); return; }
  fetchData(token);
}, []);
```

### API Call with Error Handling
```typescript
const res = await fetch(`${API}/api/v1/resource`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});

if (res.status === 402) {
  setSuscripcionVencida(true);
  return;
}

const result = await res.json();
if (!result.success) throw new Error(result.message);
```

### Logout
```typescript
localStorage.removeItem('saas_token');
localStorage.removeItem('user_data');
router.push('/login');
```
