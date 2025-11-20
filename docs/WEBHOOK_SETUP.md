# 🔗 Configuración de Webhooks Lemon Squeezy

Este documento explica cómo vincular las compras de Lemon Squeezy con tu base de datos de Supabase.

## 📋 Requisitos Previos

1. Cuenta activa en Lemon Squeezy
2. Store configurado en Lemon Squeezy
3. Base de datos de Supabase con la tabla `orders`
4. Variables de entorno configuradas

## 🔧 Paso 1: Configurar Variables de Entorno

Asegúrate de tener estas variables en tu `.env`:

```bash
# Lemon Squeezy API
LEMON_SQUEEZY_API_KEY=tu_api_key
LEMON_SQUEEZY_STORE_ID=tu_store_id
LEMON_SQUEEZY_VARIANT_ID=tu_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=tu_webhook_secret

# App URL (producción)
PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

## 🌐 Paso 2: Configurar Webhook en Lemon Squeezy

### A. Acceder a la configuración de Webhooks

1. Ve a tu dashboard de Lemon Squeezy: https://app.lemonsqueezy.com
2. Selecciona tu Store
3. Ve a **Settings → Webhooks**
4. Haz clic en **"+"** para crear un nuevo webhook

### B. Configurar el Endpoint

**Callback URL:**
```
https://tu-dominio.vercel.app/api/webhook/lemonsqueezy
```

**Para desarrollo local (usando ngrok):**
```
https://tu-url-de-ngrok.ngrok.io/api/webhook/lemonsqueezy
```

### C. Seleccionar Eventos

Marca estos eventos en Lemon Squeezy:

- ✅ `order_created` - **REQUERIDO** - Cuando se crea una orden
- ✅ `order_refunded` - **OPCIONAL** - Cuando se hace un reembolso

### D. Obtener el Signing Secret

1. Después de crear el webhook, Lemon Squeezy te dará un **Signing Secret**
2. Copia este valor
3. Agrégalo a tu `.env` como `LEMON_SQUEEZY_WEBHOOK_SECRET`

## 🧪 Paso 3: Probar el Webhook

### Opción A: Usar Lemon Squeezy Test Mode

1. En tu código, asegúrate de tener `test_mode: true` en el checkout
2. Realiza una compra de prueba
3. Usa las tarjetas de prueba de Lemon Squeezy:
   - **Éxito**: `4242 4242 4242 4242`
   - **Fallo**: `4000 0000 0000 0002`
4. Verifica los logs en tu terminal

### Opción B: Desarrollo Local con ngrok

1. Instala ngrok: https://ngrok.com/download
2. Ejecuta tu servidor local:
   ```bash
   npm run dev
   ```
3. En otra terminal, ejecuta ngrok:
   ```bash
   ngrok http 5173
   ```
4. Copia la URL de ngrok (ej: `https://abc123.ngrok.io`)
5. Configura el webhook en Lemon Squeezy con esa URL
6. Realiza una compra de prueba

## 📊 Paso 4: Verificar en Supabase

Después de una compra exitosa, verifica que se creó el registro:

```sql
SELECT 
  id,
  lemon_squeezy_order_id,
  event_id,
  user_email,
  buyer_id,
  total_price,
  payment_status,
  tickets_data,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 Logs del Webhook

El webhook genera logs útiles:

```
📨 Webhook received: order_created
   Order ID: #12345
   Status: paid
   Amount: $25.00
✅ Order processed successfully: #12345
   Database ID: uuid-here
   Authenticated user: user-uuid
```

## 🔒 Seguridad

El webhook implementa estas medidas de seguridad:

1. **Verificación de firma HMAC SHA256**
   - Valida que el webhook viene realmente de Lemon Squeezy
   - Usa el Signing Secret para la validación

2. **Prevención de duplicados**
   - Verifica si la orden ya existe antes de crearla
   - Usa `lemon_squeezy_order_id` como identificador único

3. **Validación de datos**
   - Verifica que todos los campos requeridos estén presentes
   - Maneja errores gracefully

## 📦 Datos que se Guardan

La tabla `orders` contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID interno de la orden |
| `lemon_squeezy_order_id` | TEXT | ID de la orden en Lemon Squeezy |
| `event_id` | UUID | Referencia al evento |
| `user_email` | TEXT | Email del comprador |
| `buyer_id` | UUID | ID del usuario autenticado (null si es invitado) |
| `total_price` | NUMERIC | Precio total pagado |
| `payment_status` | TEXT | Estado: 'pending', 'paid', 'failed', 'refunded' |
| `tickets_data` | JSONB | Detalles de los tickets comprados |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

## 🎫 Actualización de Tickets

Después de una compra exitosa, el webhook:

1. Crea el registro en `orders`
2. Llama a la función `decrease_ticket_availability()` para cada tipo de ticket
3. Reduce la disponibilidad automáticamente

## ⚠️ Troubleshooting

### El webhook no se ejecuta

1. Verifica que la URL del webhook sea accesible públicamente
2. Revisa que el `LEMON_SQUEEZY_WEBHOOK_SECRET` sea correcto
3. Verifica los logs en Lemon Squeezy Dashboard → Webhooks → Recent Deliveries

### Las órdenes se duplican

- El webhook ya tiene protección contra duplicados
- Si persiste, verifica que no tengas múltiples webhooks configurados en Lemon Squeezy

### Los tickets no se actualizan

- Verifica que la función `decrease_ticket_availability()` exista en Supabase
- Revisa los logs para ver si hay errores al actualizar los tickets

### Webhook falla con "Invalid signature"

- Verifica que el `LEMON_SQUEEZY_WEBHOOK_SECRET` en `.env` sea exactamente el mismo que en Lemon Squeezy
- No debe tener espacios ni comillas adicionales

## 🚀 Producción

Antes de pasar a producción:

1. ✅ Cambia `test_mode: false` en el checkout
2. ✅ Actualiza `PUBLIC_APP_URL` con tu dominio real
3. ✅ Actualiza la URL del webhook en Lemon Squeezy
4. ✅ Prueba con una compra pequeña real
5. ✅ Verifica que la orden se cree en Supabase

## 📚 Recursos

- [Lemon Squeezy Webhooks Docs](https://docs.lemonsqueezy.com/api/webhooks)
- [Lemon Squeezy API Reference](https://docs.lemonsqueezy.com/api)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica "Recent Deliveries" en Lemon Squeezy
3. Prueba el webhook con una herramienta como [webhook.site](https://webhook.site)
