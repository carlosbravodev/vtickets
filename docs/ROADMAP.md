# 🗺️ Roadmap de Escalamiento - VTickets

## 📍 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas

1. **Autenticación y Usuarios**
   - Sistema de autenticación con Supabase Auth
   - Perfil de usuario obligatorio (first_name, last_name, document_number)
   - Gestión de sesiones

2. **Gestión de Eventos**
   - CRUD completo de eventos
   - Múltiples tipos de tickets por evento
   - Imágenes con Supabase Storage
   - Sistema de slugs para URLs amigables
   - Optimización automática de imágenes (compresión WebP/JPEG)
   - Panel de organizador completo
   - Estadísticas de ventas en tiempo real (vista materializada)
   - Edición de eventos existentes
   - Dashboard global de organizador

3. **Sistema de Compras**
   - Integración completa con Lemon Squeezy
   - Prellenado de datos de usuario en checkout
   - Generación automática de tickets PDF con QR
   - Webhooks para procesar pagos
   - Almacenamiento de tickets en Supabase

4. **Experiencia de Usuario**
   - Sistema de notificaciones (Toasts)
   - Responsive design
   - Página de cuenta con historial de compras

### 🔧 Stack Tecnológico

- **Frontend:** SvelteKit 5 (runes)
- **Backend:** SvelteKit API routes
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **Pagos:** Lemon Squeezy
- **Hosting:** Vercel
- **PDF:** PDFKit

---

## ✅ FASE 1: Optimización y Validación - COMPLETADA

**Objetivo:** Solidificar la base antes de agregar nuevas features.

### 1.1 Correcciones Críticas de Seguridad ✅

#### ✅ Migrar de `getSession()` a `getUser()`
- **Archivo:** `src/hooks.server.ts`
- **Estado:** Implementado
- **Solución:**
  ```typescript
  // ✅ Migrado a getUser() para mejor seguridad
  const { data: { user } } = await supabase.auth.getUser()
  ```
- **Impacto:** Seguridad mejorada, warnings eliminados

### 1.2 Validaciones y Manejo de Errores ✅

#### ✅ Validación de cantidades y stock
- **Implementado:**
  - ✅ Validar que cantidad > 0
  - ✅ Verificar stock disponible antes de checkout
  - ✅ Bloquear venta de eventos pasados
  - ✅ Validar fechas de eventos
- **Archivo:** `src/routes/evento/[id]/+page.server.ts`

#### ✅ Estados de carga mejorados
- **Implementado:**
  - ✅ Loading states en botones ("Procesando...", spinner)
  - ✅ Skeleton loaders para lista de eventos
  - ✅ Feedback visual durante redirección a checkout
  - ✅ Disable buttons durante operaciones
- **Archivos:** Componentes `.svelte`

#### ✅ Manejo robusto de errores
- **Implementado:**
  - ✅ Página de error personalizada (`+error.svelte`)
  - ✅ Sistema de notificaciones Toast
  - ✅ Mensajes de error descriptivos
  - ✅ Logging de errores para debugging

### 1.3 Mejoras UX ✅

#### ✅ Página de confirmación mejorada
- **Ruta:** `/exito`
- **Implementado:**
  - ✅ Mostrar detalles de la compra (evento, cantidad, total)
  - ✅ Botón para descargar tickets
  - ✅ Botón para ver en "Mis Entradas"
  - ✅ Diseño responsive y profesional

**✅ Fase 1 completada exitosamente**

---

## 💰 FASE 2: Features de Negocio (En progreso)

**Objetivo:** Agregar funcionalidades que generen valor inmediato.

### 2.1 Sistema de Cupones/Descuentos ⏳ PENDIENTE

**Estado:** No implementado - Pendiente para futuras iteraciones

#### Base de datos
```sql
-- Migration: create_coupons_table.sql
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  event_id uuid references public.events(id) on delete cascade,
  max_uses integer,
  current_uses integer default 0,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  active boolean default true,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- RLS policies
alter table public.coupons enable row level security;

create policy "Coupons are viewable by everyone"
  on public.coupons for select
  using (active = true and now() between valid_from and valid_until);

create policy "Users can create coupons for their events"
  on public.coupons for insert
  with check (auth.uid() = created_by);
```

#### Features por implementar
- [ ] Aplicar cupón en página de evento
- [ ] Validar cupón (código, límites, fechas)
- [ ] Calcular descuento automático
- [ ] Enviar código de cupón a Lemon Squeezy
- [ ] Dashboard de gestión de cupones
- [ ] Estadísticas de uso

#### Archivos a modificar
- `src/routes/evento/[id]/+page.svelte` - Input de cupón
- `src/routes/api/validate-coupon/+server.ts` - Nuevo endpoint
- `src/routes/api/create-checkout/+server.ts` - Aplicar descuento
- `src/routes/organizador/cupones/+page.svelte` - Gestión

**Beneficios:**
- Marketing directo y efectivo
- Promociones early bird
- Fidelización de clientes
- Tracking de campañas

**⏱️ Tiempo estimado:** 5-7 días

### 2.2 Dashboard de Organizador ✅ COMPLETADO

#### Ruta: `/organizador`

**Features implementadas:**
- ✅ Vista de eventos creados (`/organizador/eventos`)
- ✅ Crear eventos (`/organizador/eventos/crear`)
- ✅ Editar eventos (`/organizador/eventos/[slug]/editar`)
- ✅ Ver detalles por evento (`/organizador/eventos/[slug]`)
- ✅ Dashboard global con estadísticas agregadas
- ✅ Estadísticas de ventas por evento
  - ✅ Tickets vendidos vs disponibles
  - ✅ Ingresos totales
  - ✅ Vista materializada para performance (`event_statistics`)
  - ✅ Actualización automática cada 5 minutos (pg_cron)
- ✅ Lista de compradores recientes
- ✅ Protección de rutas bidireccional (organizador ↔️ comprador)
- ✅ Sistema de notificaciones Toast
- ✅ Optimización de imágenes client-side

**Features pendientes (opcionales):**
- [ ] Gráfica de ventas en el tiempo
- [ ] Exportar compradores a CSV
- [ ] Calendario de eventos
- [ ] Filtros avanzados

#### Métricas Implementadas
```typescript
interface EventMetrics {
  totalTicketsSold: number;
  totalRevenue: number;
  totalOrders: number;
  uniqueBuyers: number;
  ticketsByType: {
    name: string;
    sold: number;
    available: number;
    price: number;
  }[];
}
```

### 2.3 Verificación de Tickets ⭐ FEATURE KILLER

#### Base de datos
```sql
-- Migration: create_ticket_verifications_table.sql
create table public.ticket_verifications (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) not null,
  verified_at timestamptz default now(),
  verified_by uuid references auth.users(id),
  location text,
  device_info jsonb
);

-- Agregar campo a tickets
alter table public.tickets add column verified boolean default false;
alter table public.tickets add column verified_at timestamptz;

-- RLS policies
alter table public.ticket_verifications enable row level security;

create policy "Event organizers can verify tickets"
  on public.ticket_verifications for insert
  with check (
    exists (
      select 1 from tickets t
      join events e on t.event_id = e.id
      where t.id = ticket_id and e.created_by = auth.uid()
    )
  );
```

#### Ruta: `/verificar`

**Features:**
- [ ] Escanear QR code (usar cámara del dispositivo)
- [ ] Validar ticket único
- [ ] Marcar como usado (una sola vez)
- [ ] Ver detalles del comprador
- [ ] Historial de verificaciones
- [ ] Modo offline (PWA)
- [ ] Búsqueda manual por código

#### Flujo de Verificación
```typescript
1. Organizer abre /verificar/[event_id]
2. Escanea QR code del ticket
3. Sistema valida:
   - Ticket existe ✓
   - Pertenece a este evento ✓
   - No ha sido usado ✓
   - Fecha del evento es hoy ✓
4. Marcar como verificado
5. Mostrar confirmación visual (✓ verde o ✗ rojo)
6. Guardar log de verificación
```

#### Tecnologías
- **QR Scanner:** `html5-qrcode` o `@zxing/library`
- **PWA:** Service workers para modo offline
- **UI:** Feedback visual inmediato

**⏱️ Tiempo estimado:** 5-7 días

**⏱️ Tiempo total Fase 2:** 
- ✅ Dashboard Organizador: Completado
- ⏳ Sistema de Cupones: Pendiente (5-7 días)
- ⏳ Verificación de Tickets: Pendiente (5-7 días)

---

## 🚀 FASE 3: Escalabilidad y Multi-tenancy (3-4 semanas)

**Objetivo:** Permitir múltiples organizadores independientes.

### 3.1 Sistema de Organizaciones

#### Base de datos
```sql
-- Migration: create_organizations_system.sql
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  description text,
  website text,
  email text,
  phone text,
  owner_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz default now(),
  primary key (organization_id, user_id)
);

-- Modificar tabla events
alter table public.events add column organization_id uuid references public.organizations(id);

-- Índices
create index idx_events_organization on public.events(organization_id);
create index idx_org_members_user on public.organization_members(user_id);
```

#### RLS Policies
```sql
-- Policies para organizations
create policy "Organizations are viewable by members"
  on public.organizations for select
  using (
    exists (
      select 1 from organization_members
      where organization_id = id and user_id = auth.uid()
    )
  );

create policy "Only owners can update organization"
  on public.organizations for update
  using (owner_id = auth.uid());

-- Policies para events con organizaciones
create policy "Events are viewable by organization members"
  on public.events for select
  using (
    organization_id is null or
    exists (
      select 1 from organization_members
      where organization_id = events.organization_id
      and user_id = auth.uid()
    )
  );
```

#### Features
- [ ] Crear organización
- [ ] Invitar miembros por email
- [ ] Gestión de permisos por rol
- [ ] Transferir ownership
- [ ] Eliminar miembros
- [ ] Estadísticas consolidadas

#### Roles y Permisos
```typescript
type Role = 'owner' | 'admin' | 'editor' | 'viewer';

const permissions = {
  owner: ['all'],
  admin: ['create_event', 'edit_event', 'delete_event', 'manage_members', 'view_stats'],
  editor: ['create_event', 'edit_event', 'view_stats'],
  viewer: ['view_stats']
};
```

**⏱️ Tiempo estimado:** 10-14 días

### 3.2 Subdominios o Paths por Organización

#### Opción 1: Path-based (Más fácil)
```
https://tuplataforma.com/org/nombre-org/eventos
https://tuplataforma.com/org/nombre-org/evento/mi-evento-123
```

#### Opción 2: Subdomain-based (Más profesional)
```
https://nombre-org.tuplataforma.com/eventos
https://nombre-org.tuplataforma.com/evento/mi-evento-123
```

**Recomendación:** Empezar con Path-based, migrar a Subdomains después.

**⏱️ Tiempo estimado:** 3-5 días

### 3.3 Configuración Personalizada

#### Features por Organización
- [ ] Logo y branding
- [ ] Color scheme personalizado
- [ ] Email de notificaciones personalizado
- [ ] Página de organización pública
- [ ] Links a redes sociales
- [ ] Términos y condiciones propios

#### Integración Lemon Squeezy Multi-tenant
```typescript
// Cada organización su propia API key
table organization_settings {
  organization_id: uuid
  lemon_squeezy_api_key: text (encrypted)
  lemon_squeezy_store_id: text
  commission_rate: numeric // Tu comisión
}
```

**⏱️ Tiempo estimado:** 5-7 días

**⏱️ Tiempo total Fase 3:** 18-26 días

---

## 🎨 FASE 4: Features Avanzadas (4-6 semanas)

**Objetivo:** Diferenciarte de la competencia.

### 4.1 Asientos Numerados

#### Base de datos
```sql
create table public.seating_maps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  layout jsonb not null, -- SVG o coordenadas
  created_at timestamptz default now()
);

create table public.seats (
  id uuid default gen_random_uuid() primary key,
  seating_map_id uuid references public.seating_maps(id) on delete cascade,
  section text not null,
  row text not null,
  number text not null,
  status text default 'available' check (status in ('available', 'reserved', 'sold')),
  ticket_type_id uuid references public.ticket_types(id),
  reserved_until timestamptz,
  ticket_id uuid references public.tickets(id),
  unique(seating_map_id, section, row, number)
);
```

#### Features
- [ ] Editor visual de mapa de asientos
- [ ] Selección interactiva de asientos
- [ ] Reserva temporal (15 minutos)
- [ ] Liberación automática de reservas expiradas
- [ ] Vista previa del asiento (ubicación en el venue)
- [ ] Precios por sección

#### UX Flow
```typescript
1. Usuario selecciona evento
2. Ve mapa interactivo de asientos
3. Selecciona asientos deseados
4. Sistema reserva temporalmente (15 min)
5. Usuario procede al checkout
6. Al completar pago, asientos se marcan como "sold"
7. Si no completa pago, asientos se liberan automáticamente
```

**⏱️ Tiempo estimado:** 12-15 días

### 4.2 Transferencia de Tickets

#### Base de datos
```sql
create table public.ticket_transfers (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) not null,
  from_user_id uuid references auth.users(id) not null,
  to_email text not null,
  to_user_id uuid references auth.users(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  message text,
  created_at timestamptz default now(),
  responded_at timestamptz
);
```

#### Features
- [ ] Iniciar transferencia desde "Mis Entradas"
- [ ] Email de notificación al destinatario
- [ ] Página de aceptación de transferencia
- [ ] Crear cuenta si no existe
- [ ] Actualizar ownership del ticket
- [ ] Generar nuevo QR code
- [ ] Historial de transferencias

#### Flow
```typescript
1. Usuario A inicia transferencia a email de Usuario B
2. Sistema envía email a Usuario B con link único
3. Usuario B hace clic en link
4. Si no tiene cuenta, se crea automáticamente
5. Usuario B acepta/rechaza transferencia
6. Si acepta:
   - Ticket se mueve a cuenta de Usuario B
   - Se genera nuevo PDF con QR actualizado
   - Se notifica a Usuario A
7. Si rechaza:
   - Ticket permanece con Usuario A
   - Se notifica a Usuario A
```

**⏱️ Tiempo estimado:** 7-10 días

### 4.3 Recordatorios Automáticos

#### Implementación
```typescript
// Supabase Edge Function + pg_cron
create extension if not exists pg_cron;

-- Ejecutar diariamente
select cron.schedule(
  'send-event-reminders',
  '0 9 * * *', -- 9 AM diario
  $$ select send_event_reminders() $$
);
```

#### Tipos de Recordatorios
- [ ] 7 días antes del evento
- [ ] 1 día antes del evento
- [ ] 2 horas antes del evento
- [ ] Cambios en el evento (reagendado, cancelado)

#### Contenido del Email
```typescript
- Nombre del evento
- Fecha y hora
- Ubicación + mapa
- Link a tickets
- Instrucciones de acceso
- Información de contacto
```

**⏱️ Tiempo estimado:** 5-7 días

### 4.4 Eventos Recurrentes

#### Base de datos
```sql
create table public.recurring_events (
  id uuid default gen_random_uuid() primary key,
  parent_event_id uuid references public.events(id),
  recurrence_pattern jsonb not null, -- rrule format
  created_at timestamptz default now()
);

-- Ejemplo de pattern
{
  "frequency": "weekly",
  "interval": 1,
  "daysOfWeek": ["monday", "wednesday", "friday"],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

#### Features
- [ ] Crear evento recurrente
- [ ] Generar instancias automáticamente
- [ ] Modificar una instancia individual
- [ ] Modificar todas las instancias futuras
- [ ] Cancelar ocurrencia específica

**⏱️ Tiempo estimado:** 7-10 días

**⏱️ Tiempo total Fase 4:** 31-42 días

---

## 📊 FASE 5: Analytics y Monetización (Continuo)

**Objetivo:** Optimizar y generar ingresos.

### 5.1 Analytics Avanzado

#### Herramientas Recomendadas
- **PostHog:** Analytics + Feature flags
- **Plausible:** Analytics simple y privado
- **Google Analytics 4:** Gratis pero pesado

#### Métricas Clave
```typescript
// Conversión
- Visitantes únicos
- Eventos visitados
- Checkouts iniciados
- Compras completadas
- Tasa de conversión

// Engagement
- Tiempo en página
- Páginas por sesión
- Eventos más populares
- Categorías más vistas

// Abandono
- Abandono de carrito
- Puntos de salida
- Errores durante checkout
```

#### Implementación
```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export const trackEvent = (event: string, properties?: any) => {
  posthog.capture(event, properties);
};

// Uso
trackEvent('checkout_initiated', {
  event_id: eventId,
  ticket_count: tickets.length,
  total_amount: totalAmount
});
```

**⏱️ Tiempo estimado:** 3-5 días

### 5.2 Modelo de Negocio

#### Opción 1: Comisión por Transacción
```typescript
// En webhook de Lemon Squeezy
const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%

const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
const organizerAmount = totalAmount - platformFee;

// Almacenar en BD
table transactions {
  total_amount: numeric
  platform_fee: numeric
  organizer_amount: numeric
  organization_id: uuid
}
```

**Pros:**
- Sin riesgo para organizadores
- Escalable
- Incentivo alineado (más ventas = más ganancia)

**Cons:**
- Requiere volumen alto
- Complejo de implementar

#### Opción 2: Suscripción por Organizador
```typescript
// Planes
const PLANS = {
  free: {
    price: 0,
    limits: {
      events_per_month: 1,
      tickets_per_month: 100,
      features: ['basic_reporting']
    }
  },
  pro: {
    price: 29, // USD/mes
    limits: {
      events_per_month: Infinity,
      tickets_per_month: 1000,
      features: ['advanced_reporting', 'custom_branding', 'priority_support']
    }
  },
  enterprise: {
    price: 99, // USD/mes
    limits: {
      events_per_month: Infinity,
      tickets_per_month: Infinity,
      features: ['all', 'white_label', 'dedicated_support', 'api_access']
    }
  }
};
```

**Pros:**
- Ingresos predecibles
- Simple de implementar
- Fácil de entender

**Cons:**
- Barrera de entrada
- Requiere marketing

#### Opción 3: Híbrido (RECOMENDADO)
```typescript
// Comisión baja + Features premium

const PLANS = {
  free: {
    price: 0,
    commission: 0.08, // 8%
    features: ['basic']
  },
  pro: {
    price: 19, // USD/mes
    commission: 0.05, // 5%
    features: ['advanced', 'custom_branding']
  },
  enterprise: {
    price: 49, // USD/mes
    commission: 0.03, // 3%
    features: ['all', 'white_label', 'api']
  }
};
```

**Pros:**
- Mejor de ambos mundos
- Ingresos desde día 1
- Incentiva upgrade a planes mayores

**Cons:**
- Más complejo

**⏱️ Tiempo estimado:** 7-10 días (implementación inicial)

### 5.3 Optimización de Conversión

#### A/B Testing
- [ ] Botones de CTA (color, texto, ubicación)
- [ ] Página de evento (layout, información)
- [ ] Proceso de checkout (pasos, campos)
- [ ] Precios (mostrar descuentos, urgencia)

#### Herramientas
- PostHog (tiene A/B testing integrado)
- Google Optimize (gratis)
- Optimizely (caro)

**⏱️ Tiempo estimado:** Continuo

---

## 🚫 Qué NO Hacer (Anti-Roadmap)

### ❌ Evitar
1. **Re-escribir en otro framework**
   - SvelteKit 5 es perfecto para este proyecto
   - No cambiar sin razón de peso

2. **Agregar 10 features a la vez**
   - Enfoque > cantidad
   - Una feature bien hecha > cinco a medias

3. **Optimización prematura**
   - Espera tráfico real antes de optimizar
   - "Premature optimization is the root of all evil"

4. **Sobre-ingeniería**
   - KISS principle (Keep It Simple, Stupid)
   - La solución más simple que funcione

5. **Ignorar feedback de usuarios**
   - Usuarios reales > tus ideas
   - Valida antes de construir

6. **Copiar features de competidores**
   - Enfócate en tu diferenciador
   - No todo lo que brilla es oro

---

## 💡 Quick Wins (Impacto Rápido)

### Features de 1-2 días con alto ROI

#### 1. Compartir en Redes Sociales
```typescript
// Botones de share
- Facebook
- Twitter
- WhatsApp
- Copiar link

// Open Graph tags
<meta property="og:title" content={event.title} />
<meta property="og:image" content={event.image_url} />
<meta property="og:description" content={event.description} />
```
**Tiempo:** 1 día

#### 2. Búsqueda de Eventos
```typescript
// Búsqueda simple
- Por nombre
- Por categoría
- Por fecha
- Por ubicación

// Filtros
- Gratis vs Pagos
- Fecha próxima
- Más populares
```
**Tiempo:** 2 días

#### 3. Calendario de Eventos
```typescript
// Vista mensual
- Integración con FullCalendar
- Filtros por categoría
- Agregar a Google Calendar
- Exportar .ics
```
**Tiempo:** 2-3 días

#### 4. Wishlist / Favoritos
```typescript
table favorite_events {
  user_id: uuid
  event_id: uuid
  created_at: timestamp
}

// Features
- Botón de "favorito" (corazón)
- Página de "Mis Favoritos"
- Notificaciones de cambios
```
**Tiempo:** 1-2 días

#### 5. Email de Bienvenida
```typescript
// Trigger: Usuario completa perfil
// Contenido:
- Bienvenida
- Cómo funciona la plataforma
- Eventos destacados
- Link a crear primer evento (si es organizador)
```
**Tiempo:** 1 día

---

## 🎯 Plan de Acción Recomendado (Próximas 4 semanas)

### Semana 1-2: FASE 1 Completa
```
✅ Día 1-2: Migrar getSession → getUser
✅ Día 3: Test mode configurable
✅ Día 4-5: Validaciones de stock y fechas
✅ Día 6-7: Estados de carga
✅ Día 8-9: Manejo de errores
✅ Día 10: Página de confirmación mejorada
```

### Semana 3: Sistema de Cupones (2.1)
```
✅ Día 1-2: Migrations y base de datos
✅ Día 3-4: UI de aplicación de cupón
✅ Día 5: Integración con checkout
✅ Día 6-7: Dashboard de gestión
```

### Semana 4: Verificación de Tickets (2.3)
```
✅ Día 1-2: Tabla y RLS policies
✅ Día 3-4: Escáner QR (PWA)
✅ Día 5: Marcar como usado
✅ Día 6-7: Historial y reportes
```

**Después de 4 semanas tendrás:**
- ✅ Base sólida y segura
- ✅ Sistema de cupones para marketing
- ✅ Verificación de tickets (feature única)
- ✅ MVP completo y production-ready

---

## 📈 Hitos del Proyecto

### Milestone 1: MVP Optimizado ✅ COMPLETADO
- [x] Sistema de autenticación
- [x] CRUD de eventos
- [x] Integración de pagos
- [x] Generación de tickets
- [x] Seguridad mejorada (getUser)
- [x] Validaciones robustas
- [x] Manejo de errores completo
- [x] Dashboard de organizador completo
- [x] Sistema de estadísticas en tiempo real

### Milestone 2: Marketing Ready ⏳ EN PROGRESO
- [ ] Sistema de cupones funcional
- [x] Dashboard básico de organizador
- [x] Estadísticas de ventas

### Milestone 3: Feature Diferenciador (Semana 4)
- [ ] Verificación de tickets QR
- [ ] PWA para modo offline
- [ ] Historial de verificaciones

### Milestone 4: Multi-tenant (Mes 2-3)
- [ ] Sistema de organizaciones
- [ ] Roles y permisos
- [ ] Branding personalizado

### Milestone 5: Premium Features (Mes 3-4)
- [ ] Asientos numerados
- [ ] Transferencia de tickets
- [ ] Recordatorios automáticos

### Milestone 6: Monetización (Mes 4+)
- [ ] Analytics avanzado
- [ ] Planes de suscripción
- [ ] Sistema de comisiones

---

## 🔄 Proceso de Desarrollo Recomendado

### Metodología
1. **Planning** (10% del tiempo)
   - Definir scope claro
   - Diseñar base de datos
   - Wireframes si es necesario

2. **Development** (60% del tiempo)
   - Implementar feature
   - Tests básicos
   - Documentación inline

3. **Testing** (20% del tiempo)
   - Testing manual exhaustivo
   - Edge cases
   - Mobile responsive

4. **Deploy & Monitor** (10% del tiempo)
   - Deploy a staging
   - QA final
   - Deploy a producción
   - Monitorear errores

### Git Workflow
```bash
# Feature branch
git checkout -b feature/coupon-system

# Commits descriptivos
git commit -m "feat(coupons): Add database schema and migrations"
git commit -m "feat(coupons): Implement validation API endpoint"
git commit -m "feat(coupons): Add UI for applying coupons"

# Pull request
# Code review (si hay equipo)
# Merge to main
# Auto-deploy via Vercel
```

---

## 📚 Recursos y Referencias

### Documentación
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Lemon Squeezy API](https://docs.lemonsqueezy.com/)
- [Vercel Docs](https://vercel.com/docs)

### Librerías Recomendadas
- **QR Scanner:** `html5-qrcode`
- **PDF:** `pdfkit` (ya usas esto)
- **Charts:** `chart.js` o `recharts`
- **Calendario:** `fullcalendar`
- **Email:** Supabase Edge Functions + Resend

### Inspiración
- Eventbrite
- Ticketmaster
- Meetup
- Luma

---

## 🎬 Decisión Final: ¿Por Dónde Empezar?

### Mi Recomendación Personal (Top 3)

#### 1️⃣ Migrar getSession → getUser (1 día)
**Por qué:** Seguridad crítica

#### 2️⃣ Sistema de Cupones (5-7 días)
**Por qué:** 
- Marketing inmediato
- Fácil de implementar
- Alto valor percibido
- Ayuda a conseguir primeros clientes

#### 3️⃣ Verificación de Tickets QR (5-7 días)
**Por qué:**
- Feature diferenciador
- Resuelve problema real
- Demuestra valor completo del sistema
- Cierra el ciclo completo (compra → asistencia)

**Total:** 11-15 días para tener un MVP premium y diferenciado.

---

## ✅ Checklist de Inicio

Antes de empezar cada fase:

- [ ] Leer documentación relacionada
- [ ] Diseñar schema de base de datos
- [ ] Crear migration SQL
- [ ] Definir RLS policies
- [ ] Wireframe de UI (si aplica)
- [ ] Identificar archivos a modificar
- [ ] Crear branch de feature
- [ ] Implementar
- [ ] Testing
- [ ] Deploy
- [ ] Documentar

---

**Última actualización:** 10 de noviembre de 2025
**Versión:** 1.0
**Autor:** GitHub Copilot con validación del equipo
