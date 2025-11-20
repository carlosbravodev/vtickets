# Sistema de Autenticación Independiente para Compradores y Organizadores

## Resumen de Cambios

Se ha implementado un sistema completamente independiente de autenticación para compradores y organizadores, manteniendo la separación de roles en todas las capas de la aplicación.

## Características Implementadas

### 1. **Layouts Independientes**

#### Layout de Compradores (`/routes/+layout.svelte`)
- Navbar principal con enlaces a eventos y cuenta de usuario
- Diseño en colores índigo/morado para compradores
- Redirecciona a `/iniciar-sesion`
- **Link cruzado**: "Para Organizadores →" que lleva a `/organizador/iniciar-sesion`
- **Condición**: Solo se muestra si NO estamos en rutas `/organizador/*`

#### Layout de Organizadores (`/routes/organizador/+layout.svelte`)
- Navbar específica con enlaces a "Mis Eventos" y "Estadísticas"
- Diseño en gradiente púrpura oscuro/índigo para organizadores
- Redirecciona a `/organizador/iniciar-sesion`
- Badge distintivo "Panel de Organizadores"
- **Link cruzado**: "← Ir a Tienda" que lleva a la página principal `/`
- **Independiente**: Tiene su propio layout que no hereda la navbar de compradores

### 2. **Componente NavbarOrganizer**

Ubicación: `/src/lib/components/NavbarOrganizer.svelte`

Características:
- Diseño completamente diferente al navbar de compradores
- Gradiente púrpura oscuro (`from-purple-900 to-indigo-900`)
- Logo invertido para contraste con fondo oscuro
- Menús específicos para organizadores:
  - Mis Eventos
  - Estadísticas
  - Mi perfil
  - Configuración
  - **← Ir a Tienda** (link a página de compradores)
- Responsive con menú móvil adaptado
- **Prevención de duplicación**: El layout de compradores NO se muestra en rutas `/organizador/*`

### 3. **Autenticación OAuth (Google y Facebook)**

#### Para Compradores
- **Ruta**: `/iniciar-sesion`
- **Parámetro**: `authType=buyer`
- **Validación**: Solo permite cuentas con rol `buyer`
- **Redirección**: Si es organizador → Mensaje de error + logout

#### Para Organizadores
- **Ruta**: `/organizador/iniciar-sesion`
- **Parámetro**: `authType=organizer`
- **Validación**: Solo permite cuentas con rol `organizer`
- **Redirección**: Si es comprador → Mensaje de error + logout

### 4. **Callback de Autenticación Mejorado**

Ubicación: `/routes/auth/callback/+server.ts`

Flujo:
1. Recibe `code` y `authType` (buyer u organizer)
2. Intercambia código por sesión
3. Obtiene perfil del usuario desde la BD
4. **Verifica que el rol coincida con authType**
5. Si el rol no coincide:
   - Cierra la sesión automáticamente
   - Redirige al login correspondiente con mensaje de error
6. Si el rol coincide:
   - Mantiene la sesión
   - Redirige a la página solicitada

### 5. **Validación de Roles en Login**

#### Login de Compradores (`/routes/iniciar-sesion/+page.server.ts`)
```typescript
// Verifica que el rol sea 'buyer'
if (profile?.role !== 'buyer') {
  await supabase.auth.signOut();
  return fail(403, {
    message: 'Esta cuenta es de organizador. Por favor usa el login de organizadores.'
  });
}
```

#### Login de Organizadores (`/routes/organizador/iniciar-sesion/+page.server.ts`)
```typescript
// Verifica que el rol sea 'organizer'
if (profile?.role !== 'organizer') {
  await supabase.auth.signOut();
  return fail(403, {
    message: 'Esta cuenta es de comprador. Por favor usa el login de compradores.'
  });
}
```

### 6. **Migraciones de Base de Datos**

#### Nueva Migración: `ensure_role_independence.sql`

Características:
- **Índice único compuesto** `(email, role)`: Permite que el mismo email exista con roles diferentes
- **Función `prevent_role_change()`**: Previene que un usuario cambie de rol una vez asignado
- **Trigger**: Ejecuta la validación automáticamente en cada UPDATE

Ejemplo:
- ✅ `juan@email.com` puede tener rol `buyer`
- ✅ `juan@email.com` puede tener rol `organizer` (perfil separado)
- ❌ No puede cambiar de `buyer` a `organizer` ni viceversa

### 7. **Asignación Automática de Roles**

#### Durante Registro con Email/Password
```typescript
// Compradores
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: 'buyer'
    }
  }
});

// Organizadores
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: 'organizer'
    }
  }
});
```

#### Durante OAuth (Google/Facebook)
El rol se determina por el parámetro `authType` en la URL de callback.

### 8. **Validación Preventiva**

Antes de permitir el registro, se verifica si el email ya existe con otro rol:

```typescript
const { data: existingProfile } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('email', email)
  .single();

if (existingProfile?.role === 'organizer') {
  return fail(400, {
    message: 'Este correo ya está registrado como organizador.'
  });
}
```

## Flujos de Usuario

### Flujo de Comprador
1. Accede a `vtickets.com`
2. Hace clic en "Entrar"
3. Elige email/password o OAuth (Google/Facebook)
4. Si intenta acceder con cuenta de organizador → Error + logout
5. Si es comprador → Acceso exitoso al área de compradores

### Flujo de Organizador
1. Accede a `vtickets.com/organizador`
2. Hace clic en "Entrar"
3. Elige email/password o OAuth (Google/Facebook)
4. Si intenta acceder con cuenta de comprador → Error + logout
5. Si es organizador → Acceso exitoso al panel de organizadores

## Mensajes de Error Personalizados

### Para Comprador que intenta acceder como Organizador
```
Esta cuenta es de organizador. Por favor usa el login de organizadores.
```

### Para Organizador que intenta acceder como Comprador
```
Esta cuenta es de comprador. Por favor usa el login de compradores.
```

## Seguridad Implementada

1. ✅ **Validación en cliente y servidor**
2. ✅ **Cierre automático de sesión** en caso de rol incorrecto
3. ✅ **Constraint de base de datos** para prevenir cambios de rol
4. ✅ **Índice único compuesto** (email, role)
5. ✅ **Validación en callback OAuth**
6. ✅ **Validación preventiva** antes de registro
7. ✅ **Logs detallados** para auditoría

## Próximos Pasos Recomendados

1. **Protección de rutas**: Agregar middleware para verificar roles en rutas protegidas
2. **Páginas de error**: Crear páginas específicas `/organizador/eventos`, `/organizador/estadisticas`
3. **Tests**: Implementar tests E2E para validar flujos completos
4. **Configuración de OAuth**: Asegurar que Google y Facebook estén configurados en Supabase

## Archivos Modificados/Creados

### Creados
- `/src/lib/components/NavbarOrganizer.svelte`
- `/src/routes/organizador/+layout.svelte`
- `/src/routes/organizador/+layout.server.ts`
- `/supabase/migrations/ensure_role_independence.sql`

### Modificados
- `/src/routes/auth/callback/+server.ts`
- `/src/routes/iniciar-sesion/+page.svelte`
- `/src/routes/organizador/iniciar-sesion/+page.svelte`
- `/src/routes/organizador/iniciar-sesion/+page.server.ts`

## Configuración Requerida en Supabase

### 1. Ejecutar Migración
```bash
# Aplicar la nueva migración
supabase db push
```

### 2. Configurar OAuth Providers

En el dashboard de Supabase:
1. Authentication → Providers
2. Habilitar Google y Facebook
3. Configurar Client ID y Secret
4. Agregar URLs de callback:
   - `https://tudominio.com/auth/callback`
   - `http://localhost:5173/auth/callback` (desarrollo)

## Notas Importantes

- Los usuarios pueden tener **dos perfiles separados** con el mismo email si tienen roles diferentes
- Una vez asignado un rol, **no se puede cambiar** (protección a nivel de base de datos)
- Cada formulario de login valida el rol **antes y después** de la autenticación
- El sistema es **completamente independiente** entre compradores y organizadores
