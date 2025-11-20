# Arquitectura del Sistema de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                        VTICKETS APP                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────────┐
│   SECCIÓN COMPRADORES    │    │   SECCIÓN ORGANIZADORES      │
│   (vtickets.com)         │    │   (vtickets.com/organizador) │
└──────────────────────────┘    └──────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│  +layout.svelte          │    │  /organizador/               │
│  - Navbar compradores    │    │  +layout.svelte              │
│  - Color: Indigo         │    │  - NavbarOrganizer           │
│  - Enlaces: Eventos      │    │  - Color: Purple dark        │
└──────────────────────────┘    │  - Enlaces: Mis Eventos,     │
           │                    │    Estadísticas              │
           ▼                    └──────────────────────────────┘
┌──────────────────────────┐                   │
│  /iniciar-sesion         │                   ▼
│                          │    ┌──────────────────────────────┐
│  ┌────────────────────┐  │    │  /organizador/iniciar-sesion │
│  │ Email/Password     │  │    │                              │
│  │ role: 'buyer'      │  │    │  ┌────────────────────────┐  │
│  └────────────────────┘  │    │  │ Email/Password         │  │
│                          │    │  │ role: 'organizer'      │  │
│  ┌────────────────────┐  │    │  └────────────────────────┘  │
│  │ OAuth Google       │  │    │                              │
│  │ authType=buyer     │  │    │  ┌────────────────────────┐  │
│  └────────────────────┘  │    │  │ OAuth Google           │  │
│                          │    │  │ authType=organizer     │  │
│  ┌────────────────────┐  │    │  └────────────────────────┘  │
│  │ OAuth Facebook     │  │    │                              │
│  │ authType=buyer     │  │    │  ┌────────────────────────┐  │
│  └────────────────────┘  │    │  │ OAuth Facebook         │  │
└──────────────────────────┘    │  │ authType=organizer     │  │
           │                    │  └────────────────────────┘  │
           │                    └──────────────────────────────┘
           │                                   │
           └───────────────┬───────────────────┘
                          ▼
           ┌──────────────────────────────────┐
           │   /auth/callback/+server.ts      │
           │                                  │
           │  1. Exchange code for session    │
           │  2. Get user profile from DB     │
           │  3. CHECK: role === authType?    │
           │     ├─ YES → Allow login         │
           │     └─ NO  → Logout + Error      │
           └──────────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────┐
           │      SUPABASE DATABASE           │
           │                                  │
           │  profiles table:                 │
           │  ┌────────┬───────┬──────────┐   │
           │  │ email  │ role  │ id       │   │
           │  ├────────┼───────┼──────────┤   │
           │  │ juan@  │ buyer │ uuid-1   │   │
           │  │ juan@  │ org   │ uuid-2   │   │ ← Mismo email
           │  └────────┴───────┴──────────┘   │   2 perfiles
           │                                  │
           │  UNIQUE INDEX (email, role)      │
           │  TRIGGER prevent_role_change()   │
           └──────────────────────────────────┘
```

## Flujo de Validación

### Registro
```
Usuario → Formulario → Server Action → Supabase Auth
                ↓
        Metadata { role: 'buyer' | 'organizer' }
                ↓
        Trigger DB → handle_new_user()
                ↓
        Crear perfil con rol correcto
```

### Login con OAuth
```
Click botón OAuth → supabase.auth.signInWithOAuth()
        ↓
    Redirect a Provider (Google/Facebook)
        ↓
    Callback: /auth/callback?code=XXX&authType=buyer
        ↓
    1. Exchange code for session
    2. Query DB for user role
    3. Validate: user.role === authType
        ├─ Match → ✅ Login successful
        └─ No match → ❌ Logout + Error message
```

### Protección de Roles
```
NIVEL 1: Cliente (Svelte)
    ├─ Navbar diferente según sección
    └─ Botones OAuth con authType correcto

NIVEL 2: Server Actions
    ├─ Validación de rol después de login
    └─ Cierre de sesión si rol incorrecto

NIVEL 3: Callback Handler
    ├─ Verificación de rol vs authType
    └─ Redirección según resultado

NIVEL 4: Base de Datos
    ├─ Constraint UNIQUE (email, role)
    ├─ Trigger prevent_role_change()
    └─ CHECK constraint roles válidos
```

## Independencia Total

✅ **Navbars separadas** - Diseño y enlaces diferentes
✅ **Layouts independientes** - Rutas y contextos aislados
✅ **Formularios separados** - Cada uno con su validación
✅ **OAuth independiente** - Parámetro authType diferencia
✅ **Validación de roles** - En todas las capas
✅ **Base de datos** - Permite mismo email con roles diferentes
✅ **Sin interferencia** - Compradores y organizadores nunca se cruzan
