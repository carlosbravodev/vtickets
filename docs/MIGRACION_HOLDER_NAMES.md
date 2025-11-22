# Actualización de holder_name en Tickets Existentes

## Problema
Los tickets creados antes del fix no tienen el campo `holder_name` poblado, solo tienen `holder_email`.

## Solución
Hemos creado un endpoint de migración que actualiza automáticamente todos los tickets existentes.

## Cómo ejecutar la migración

### Opción 1: Desde la terminal (con autenticación)

```bash
# 1. Iniciar sesión en la aplicación web
# 2. Obtener tu session cookie desde las DevTools del navegador
# 3. Ejecutar:

curl -X POST http://localhost:5173/api/admin/update-holder-names \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=TU_TOKEN_AQUI"
```

### Opción 2: Desde Supabase SQL Editor (Recomendado)

Ejecuta directamente en Supabase:

```sql
-- Actualizar holder_name en tickets que tienen buyer_id pero no holder_name
UPDATE tickets t
SET holder_name = CONCAT(p.first_name, ' ', p.last_name)
FROM orders o
JOIN profiles p ON o.buyer_id = p.id
WHERE t.order_id = o.id
  AND t.holder_name IS NULL
  AND o.buyer_id IS NOT NULL
  AND p.first_name IS NOT NULL;

-- Verificar cuántos tickets se actualizaron
SELECT 
  COUNT(*) as total_tickets_actualizados
FROM tickets 
WHERE holder_name IS NOT NULL;
```

### Opción 3: Desde el código (desarrollo)

Crear un archivo temporal `scripts/migrate-holder-names.ts`:

```typescript
import { supabaseAdmin } from '../src/lib/supabaseAdmin';

async function migrateHolderNames() {
  console.log('🔄 Iniciando migración...');
  
  // Ejecutar la query de actualización
  const { data, error } = await supabaseAdmin.rpc('update_holder_names');
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Migración completada');
  }
}

migrateHolderNames();
```

## Verificación

Después de ejecutar la migración, verifica:

```sql
-- Ver tickets sin holder_name (debería ser 0)
SELECT COUNT(*) 
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.holder_name IS NULL 
  AND o.buyer_id IS NOT NULL;

-- Ver algunos ejemplos de tickets actualizados
SELECT 
  t.id,
  t.holder_name,
  t.holder_email,
  o.buyer_id
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.holder_name IS NOT NULL
LIMIT 10;
```

## Cambios Implementados

### 1. En `/api/create-checkout` (línea 147)
- Ahora incluye `buyer_name` en `custom_data`
- Se envía junto con `event_id`, `tickets` y `buyer_id`

### 2. En `/api/webhook/lemonsqueezy` (línea 49)
- Extrae `buyer_name` desde `custom_data.buyer_name`
- Fallback a `checkout_data.name` y `user_name`
- Se guarda en `holder_name` al crear tickets

### 3. Script de migración
- Endpoint: `/api/admin/update-holder-names`
- Actualiza tickets existentes automáticamente
- Obtiene nombres desde tabla `profiles` usando `buyer_id`

## Resultado Esperado

Después de la migración, todos los tickets mostrarán:

**Antes:**
```
usuario@example.com
Entrada VIP
```

**Después:**
```
Juan Pérez García
Entrada VIP
```
