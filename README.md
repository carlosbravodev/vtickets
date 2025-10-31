# 🎫 VTickets

Plataforma moderna de venta de tickets para eventos desarrollada con SvelteKit 5, Supabase y Lemon Squeezy.

## ✨ Características

- 🎨 **Interfaz moderna y responsive** - Diseño elegante con Tailwind CSS v4
- 🎭 **Gestión completa de eventos** - Sistema de eventos con múltiples tipos de tickets
- 💳 **Pagos integrados** - Procesamiento seguro con Lemon Squeezy
- 🌐 **Internacionalización** - Checkout en español con Ecuador como país predeterminado
- ⚡ **Performance optimizada** - View Transitions API y optimización de imágenes
- 🔐 **Autenticación lista** - Estructura preparada para sistema de login
- 📱 **Mobile-first** - Experiencia optimizada para todos los dispositivos

## 🛠️ Tecnologías

### Frontend
- **SvelteKit 5** - Framework moderno con Svelte 5 Runes
- **Tailwind CSS v4** - Estilos utility-first de última generación
- **Vite** - Build tool ultra-rápido
- **Roboto** - Sistema tipográfico unificado con jerarquía clara

### Backend & Database
- **Supabase** - Base de datos PostgreSQL con Row Level Security
- **Lemon Squeezy** - Pasarela de pagos con soporte internacional

### Características Técnicas
- TypeScript para type-safety
- View Transitions API para navegación fluida
- Optimización automática de imágenes
- Test mode para desarrollo seguro

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

Copia el archivo de ejemplo y configura tus credenciales:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Supabase
PUBLIC_SUPABASE_URL=tu_supabase_url
PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=tu_api_key
LEMON_SQUEEZY_STORE_ID=tu_store_id
LEMON_SQUEEZY_VARIANT_ID=tu_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=tu_webhook_secret

# App
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

4. **Configurar la base de datos**

Ejecuta las migraciones en Supabase (ver `docs/database-schema.sql`)

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del proyecto

```
vtickets/
├── src/
│   ├── lib/
│   │   ├── assets/          # Imágenes y recursos
│   │   ├── components/      # Componentes reutilizables
│   │   ├── utils/           # Utilidades (optimización de imágenes, etc)
│   │   ├── supabase.ts      # Cliente de Supabase
│   │   └── lemonsqueezy.ts  # Configuración de Lemon Squeezy
│   ├── routes/
│   │   ├── api/
│   │   │   ├── create-checkout/    # Endpoint para crear checkout
│   │   │   └── webhook/            # Webhook de Lemon Squeezy
│   │   ├── evento/[id]/            # Página de detalle del evento
│   │   ├── eventos/                # Listado de eventos
│   │   ├── login/                  # Página de login (placeholder)
│   │   ├── success/                # Página de confirmación
│   │   └── +layout.svelte          # Layout principal
│   ├── app.css              # Estilos globales
│   └── app.html             # Template HTML
├── static/                  # Archivos estáticos
├── .env.example            # Ejemplo de variables de entorno
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Configuración de Lemon Squeezy

Consulta el archivo [LEMON_SQUEEZY_SETUP.md](./LEMON_SQUEEZY_SETUP.md) para instrucciones detalladas sobre cómo configurar tu cuenta de Lemon Squeezy.

## 🌊 Flujo de compra

1. Usuario navega por los eventos disponibles (`/eventos`)
2. Selecciona un evento y elige cantidades de tickets (`/evento/[id]`)
3. Click en "Proceder al pago"
4. Redirección a Lemon Squeezy (checkout en español)
5. Usuario completa el pago
6. Webhook actualiza la base de datos
7. Usuario es redirigido a página de éxito (`/success`)
8. Recibe email con sus tickets

## 🏗️ Características planificadas

- [ ] Sistema completo de autenticación
- [ ] Panel de administración
- [ ] Generación de QR codes para tickets
- [ ] Sistema de validación de entradas
- [ ] Reportes y analytics
- [ ] Notificaciones por email
- [ ] Exportación de asistentes

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
