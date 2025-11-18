# 🎫 VTickets

Plataforma completa de venta de tickets para eventos con QR codes seguros, desarrollada con SvelteKit 5, Supabase y Lemon Squeezy.

## ✨ Características

### �️ Sistema de Tickets
- 🎫 **QR Codes personalizados** - Diseño moderno con puntos redondeados y estilo único
- 🔐 **Seguridad JWT** - Tokens firmados con hash SHA256 para validación
- 📱 **Tickets digitales** - Visualización estilo "boarding pass" con diseño premium
- ⬇️ **Descarga de tickets** - Usuarios pueden descargar sus QR codes
- 🎨 **Diseño acordeón** - Interfaz desplegable para visualizar tickets

### � Pagos y Órdenes
- 💳 **Procesamiento de pagos** - Integración completa con Lemon Squeezy
- 🌐 **Checkout internacional** - Español con Ecuador como país predeterminado
- 🔔 **Webhooks automáticos** - Generación instantánea de tickets post-compra
- 🔢 **Números de orden** - Sistema secuencial único para cada compra
- 📧 **Post-checkout flow** - Redirección y confirmación después del pago

### 👤 Gestión de Usuarios
- 🔐 **Autenticación Supabase** - Login seguro con email/password
- 📊 **Panel de cuenta** - Vista completa de órdenes y tickets
- 🎯 **Página de cuenta** - Visualización de historial de compras
- 🔒 **Protección de rutas** - Acceso controlado a páginas privadas

### 🎭 Eventos
- 📅 **Catálogo de eventos** - Listado completo con filtros
- 🎨 **Páginas de detalle** - Información completa del evento
- 🎟️ **Múltiples tipos de tickets** - VIP, General, Early Bird, etc.
- 🖼️ **Optimización de imágenes** - Carga rápida y responsive

### 🛠️ Infraestructura Técnica
- ⚡ **Performance optimizada** - View Transitions API y Vite
- 📱 **Mobile-first** - Diseño responsive en todos los dispositivos
- 🐛 **Debug endpoints** - Herramientas para testing y diagnóstico
- 🔄 **Hot reload** - Desarrollo ágil con actualizaciones instantáneas

## 🛠️ Stack Tecnológico

### Frontend
- **SvelteKit 5** - Framework con Svelte 5 Runes
- **Tailwind CSS v4** - Estilos utility-first
- **Vite** - Build tool ultra-rápido
- **Roboto** - Sistema tipográfico profesional
- **qr-code-styling** - Generación de QR codes personalizados

### Backend & Servicios
- **Supabase** - PostgreSQL con Row Level Security (RLS)
- **Supabase Auth** - Autenticación de usuarios
- **Lemon Squeezy** - Procesamiento de pagos internacional
- **Webhooks** - Procesamiento automático post-compra

### Seguridad
- **JWT (jose)** - Tokens firmados para QR codes
- **SHA256** - Hashing para validación adicional
- **nanoid** - Generación de IDs únicos
- **RLS Policies** - Protección a nivel de base de datos
- **Service Role** - Operaciones administrativas seguras

### Desarrollo
- **TypeScript** - Type-safety completo
- **View Transitions API** - Navegación fluida
- **Debug Endpoints** - Testing y diagnóstico
- **Git Workflow** - Despliegue automático con Vercel

## 🎨 Sistema Tipográfico

VTickets utiliza **Roboto** como fuente única con una jerarquía clara de pesos:

### Jerarquía de Pesos

| Peso | Uso | Clases Disponibles |
|------|-----|-------------------|
| **900 (Black)** | Títulos principales, Hero | `.text-black`, `h1` |
| **700 (Bold)** | Títulos de sección, encabezados de cards | `.text-bold`, `h2`, `h3` |
| **500 (Medium)** | Subtítulos, elementos destacados | `.text-medium`, `h4`, `h5`, `h6` |
| **400 (Regular)** | Texto de cuerpo, párrafos | `.body-text`, `p` |
| **300 (Light)** | Texto secundario (opcional) | `.text-light` |

### Letter Spacing

- Títulos grandes (h1): `-0.02em` - Más compacto para impacto visual
- Títulos medianos (h2): `-0.01em` - Ligeramente compacto
- Cuerpo de texto: `0.01em` - Mejor legibilidad
- Botones: `0.02em` - Mayor espaciado para claridad

### Ejemplo de Uso

```html
<h1 class="text-4xl">Título Principal</h1> <!-- 900 Black -->
<h2 class="text-2xl">Sección</h2> <!-- 700 Bold -->
<p class="body-text">Texto de cuerpo</p> <!-- 400 Regular -->
<span class="text-medium">Destacado</span> <!-- 500 Medium -->
<small class="text-light">Secundario</small> <!-- 300 Light -->
```

## 📋 Requisitos previos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase
- Cuenta de Lemon Squeezy

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/carlosbravodev/vtickets.git
cd vtickets
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase - Configuración pública
PUBLIC_SUPABASE_URL=tu_supabase_url
PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Supabase - Service Role (servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Lemon Squeezy - Pagos
LEMON_SQUEEZY_API_KEY=tu_api_key
LEMON_SQUEEZY_STORE_ID=tu_store_id
LEMON_SQUEEZY_WEBHOOK_SECRET=tu_webhook_secret

# Seguridad de Tickets
JWT_SECRET_KEY=tu_jwt_secret_64_caracteres
HASH_SALT=tu_hash_salt_32_caracteres

# App
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

**Notas importantes:**
- `JWT_SECRET_KEY`: Debe tener 64 caracteres para HS256
- `HASH_SALT`: Debe tener 32 caracteres para SHA256
- `SUPABASE_SERVICE_ROLE_KEY`: Necesario para bypass de RLS en operaciones del servidor
- Nunca expongas estas claves en el código del cliente

4. **Configurar la base de datos**

Ejecuta las migraciones en Supabase SQL Editor en este orden:

```sql
-- 1. Crear tabla de tickets
supabase/migrations/create_tickets_table.sql

-- 2. Agregar números de orden
supabase/migrations/add_order_number.sql

-- 3. Habilitar RLS en tickets
supabase/migrations/enable_rls_tickets.sql
```

Las políticas RLS configuradas:
- ✅ Service role puede insertar tickets (para webhooks)
- ✅ Usuarios pueden ver sus propios tickets
- ✅ Usuarios pueden ver tickets de sus órdenes

5. **Configurar Lemon Squeezy**

Consulta [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) para configurar el webhook correctamente.

6. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del proyecto

```
vtickets/
├── src/
│   ├── lib/
│   │   ├── assets/              # Imágenes y recursos
│   │   ├── components/          # Componentes Svelte reutilizables
│   │   │   ├── EventSection.svelte
│   │   │   └── Hero.svelte
│   │   ├── utils/               # Utilidades
│   │   │   ├── image.ts         # Optimización de imágenes
│   │   │   └── slug.ts          # Generación de slugs
│   │   ├── supabase.ts          # Cliente Supabase (anon key)
│   │   ├── supabaseAdmin.ts     # Cliente admin (service role)
│   │   ├── supabaseClient.ts    # Cliente para browser
│   │   └── ticketGenerator.ts   # Generación de tickets con QR
│   ├── routes/
│   │   ├── api/
│   │   │   ├── create-checkout/     # Crear sesión de pago
│   │   │   ├── debug/               # Endpoints de testing
│   │   │   │   ├── env/            # Verificar variables de entorno
│   │   │   │   ├── test-ticket/    # Probar generación de tickets
│   │   │   │   └── user-tickets/   # Ver tickets de usuario
│   │   │   └── webhook/
│   │   │       └── lemonsqueezy/   # Procesar pagos y crear tickets
│   │   ├── auth/
│   │   │   └── callback/            # Callback OAuth Supabase
│   │   ├── cuenta/                  # Panel de usuario (protegido)
│   │   │   ├── +page.server.ts     # Cargar órdenes y tickets
│   │   │   └── +page.svelte        # UI con QR codes
│   │   ├── evento/[id]/             # Detalle del evento
│   │   ├── eventos/                 # Listado de eventos
│   │   ├── login/                   # Login con Supabase Auth
│   │   ├── success/                 # Confirmación post-pago
│   │   ├── +layout.server.ts        # Session management
│   │   └── +layout.svelte           # Layout global
│   ├── app.css                      # Estilos globales + Tailwind
│   └── app.html                     # Template HTML base
├── supabase/
│   └── migrations/                  # Migraciones SQL
│       ├── create_tickets_table.sql
│       ├── add_order_number.sql
│       └── enable_rls_tickets.sql
├── static/                          # Archivos estáticos
├── WEBHOOK_SETUP.md                 # Guía de configuración
├── PURCHASE_FLOW.md                 # Documentación del flujo
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Configuración de Lemon Squeezy

Consulta el archivo [LEMON_SQUEEZY_SETUP.md](./LEMON_SQUEEZY_SETUP.md) para instrucciones detalladas sobre cómo configurar tu cuenta de Lemon Squeezy.

## 🌊 Flujo Completo de Compra

### 1️⃣ Navegación y Selección
- Usuario navega por eventos (`/eventos`)
- Ve detalles del evento (`/evento/[id]`)
- Selecciona cantidades por tipo de ticket
- Click en "Proceder al pago"

### 2️⃣ Proceso de Pago
- API crea checkout session en Lemon Squeezy
- Usuario es redirigido al checkout (español, Ecuador)
- Completa el pago con tarjeta/PayPal
- Lemon Squeezy procesa el pago

### 3️⃣ Generación Automática (Webhook)
- Webhook recibe evento `order_created`
- Valida la firma del webhook
- Crea registro en tabla `orders`
- **Genera tickets automáticamente:**
  - Crea código único por ticket (nanoid)
  - Genera JWT firmado con datos del ticket
  - Crea hash SHA256 para seguridad extra
  - Genera QR code personalizado
  - Inserta tickets en base de datos

### 4️⃣ Confirmación y Acceso
- Usuario redirigido a `/success`
- Recibe confirmación por email (Lemon Squeezy)
- Puede acceder a `/cuenta` para ver sus tickets

### 5️⃣ Visualización de Tickets
- Usuario inicia sesión en `/cuenta`
- Ve historial de órdenes
- Despliega sección "Tus Entradas"
- **Cada ticket muestra:**
  - QR code personalizado (puntos redondeados)
  - Código de ticket único
  - Información del evento
  - Fecha, hora y ubicación
  - Estado del ticket (activo/usado)
  - Botón para descargar QR
  - Link para ver detalles del evento

### 6️⃣ Día del Evento (Próximamente)
- Personal escanea QR en la entrada
- Sistema valida JWT y hash
- Marca ticket como "usado"
- Previene duplicados y fraude

## ✅ Características Completadas

- [x] Sistema completo de autenticación (Supabase Auth)
- [x] Generación de QR codes para tickets (JWT + SHA256)
- [x] Diseño moderno de tickets estilo boarding pass
- [x] Integración completa con Lemon Squeezy
- [x] Webhooks para generación automática de tickets
- [x] Panel de cuenta con historial de órdenes
- [x] Descarga de tickets individuales
- [x] Sistema de seguridad con RLS

## 🚀 Próximas Funcionalidades

- [ ] Sistema de validación de entradas (scanner PWA)
- [ ] Panel de administración para gestión de eventos
- [ ] Reportes y analytics de ventas
- [ ] Notificaciones por email personalizadas
- [ ] Sistema de reembolsos
- [ ] Exportación de asistentes

## 📚 Documentación Adicional

Este proyecto cuenta con documentación detallada sobre componentes específicos:

- **[Sistema de Autenticación Independiente](./SISTEMA_AUTENTICACION_INDEPENDIENTE.md)** - Implementación completa del sistema de roles para compradores y organizadores con OAuth
- **[Arquitectura de Autenticación](./ARQUITECTURA_AUTH.md)** - Diagramas y flujos del sistema de autenticación
- **[Sistema de Toast](./TOAST_SYSTEM.md)** - Sistema de notificaciones visuales
- **[Flujo de Compra](./PURCHASE_FLOW.md)** - Proceso completo de checkout
- **[Setup de Webhooks](./WEBHOOK_SETUP.md)** - Configuración de webhooks de Lemon Squeezy
- **[Roadmap](./ROADMAP.md)** - Funcionalidades planificadas y en desarrollo

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 👨‍💻 Autor

**Carlos Bravo**
- GitHub: [@carlosbravodev](https://github.com/carlosbravodev)

## 🙏 Agradecimientos

- [SvelteKit](https://kit.svelte.dev/)
- [Supabase](https://supabase.com/)
- [Lemon Squeezy](https://lemonsqueezy.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

⭐ Si este proyecto te resulta útil, considera darle una estrella!
