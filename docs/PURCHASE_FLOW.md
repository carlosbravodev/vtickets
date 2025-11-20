# 🔄 Flujo Completo de Compra

Este documento explica el flujo completo desde que un usuario hace clic en "Comprar" hasta que se guarda en tu base de datos.

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USUARIO EN PÁGINA DE EVENTO                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Selecciona tickets
                              │    (VIP x2, General x1)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Click "Proceder al Pago"                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. POST /api/create-checkout
                              │    Body: {
                              │      eventId: "uuid",
                              │      tickets: {"ticket1": 2, "ticket2": 1},
                              │      totalAmount: 75.00,
                              │      buyerId: "user-uuid" (si está autenticado)
                              │    }
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR SVELTEKIT                                │
│  - Obtiene buyer_id de locals.session                               │
│  - Prepara custom_data con event_id, tickets, buyer_id              │
│  - Hace request a Lemon Squeezy API                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. POST https://api.lemonsqueezy.com/v1/checkouts
                              │    Headers: Authorization: Bearer API_KEY
                              │    Body: checkout data + custom_data
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LEMON SQUEEZY API                                 │
│  - Crea checkout session                                            │
│  - Genera URL única de pago                                         │
│  - Guarda custom_data para el webhook                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Retorna checkoutUrl
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USUARIO                                           │
│  - Redirigido a checkout.lemonsqueezy.com                           │
│  - Ve formulario de pago de Lemon Squeezy                           │
│  - Ingresa información de tarjeta                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 5. Usuario completa el pago
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LEMON SQUEEZY                                     │
│  - Procesa el pago                                                  │
│  - Cambia status de "pending" a "paid"                              │
│  - DISPARA WEBHOOK "order_created"                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 6. POST https://tu-dominio.com/api/webhook/lemonsqueezy
                              │    Headers: 
                              │      X-Signature: hmac_sha256_signature
                              │    Body: {
                              │      meta: { event_name: "order_created" },
                              │      data: {
                              │        id: "order-id",
                              │        attributes: {
                              │          status: "paid",
                              │          total: 7500, (en centavos)
                              │          user_email: "user@example.com",
                              │          checkout_data: {
                              │            custom: {
                              │              event_id: "uuid",
                              │              tickets: "{...}",
                              │              buyer_id: "user-uuid"
                              │            }
                              │          }
                              │        }
                              │      }
                              │    }
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           WEBHOOK ENDPOINT (TU SERVIDOR)                             │
│  1. Verifica firma HMAC SHA256                                      │
│  2. Valida que el webhook viene de Lemon Squeezy                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ ✅ Firma válida
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           PROCESAMIENTO DEL WEBHOOK                                  │
│  1. Extrae datos del evento                                         │
│  2. Verifica que status = "paid"                                    │
│  3. Verifica que la orden no exista (prevenir duplicados)           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 7. INSERT INTO orders
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                                 │
│  Tabla: orders                                                      │
│  {                                                                  │
│    id: "new-uuid",                                                  │
│    lemon_squeezy_order_id: "order-id",                              │
│    event_id: "event-uuid",                                          │
│    buyer_id: "user-uuid",                                           │
│    user_email: "user@example.com",                                  │
│    total_price: 75.00,                                              │
│    payment_status: "paid",                                          │
│    tickets_data: { "ticket1": 2, "ticket2": 1 },                   │
│    created_at: "2025-11-02T10:30:00Z"                               │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 8. Para cada tipo de ticket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           ACTUALIZAR DISPONIBILIDAD DE TICKETS                       │
│  CALL decrease_ticket_availability(                                 │
│    ticket_id: "ticket1",                                            │
│    quantity: 2                                                      │
│  )                                                                  │
│                                                                     │
│  UPDATE ticket_types                                                │
│  SET available_tickets = available_tickets - 2                      │
│  WHERE id = "ticket1"                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ ✅ Todo exitoso
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPUESTA AL WEBHOOK                              │
│  Status: 200 OK                                                     │
│  Body: { "received": true }                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 9. Lemon Squeezy redirige al usuario
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PÁGINA DE ÉXITO                                   │
│  - Usuario ve confirmación                                          │
│  - Recibe email con sus tickets                                     │
│  - Puede ver su orden en "Mi cuenta"                                │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔐 Validaciones de Seguridad

### 1. Verificación de Firma HMAC
```typescript
const hmac = crypto.createHmac('sha256', webhookSecret);
const digest = hmac.update(rawBody).digest('hex');

if (signature !== digest) {
  return json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 2. Prevención de Duplicados
```typescript
const { data: existingOrder } = await supabase
  .from('orders')
  .select('id')
  .eq('lemon_squeezy_order_id', orderId)
  .single();

if (existingOrder) {
  return json({ received: true, message: 'Order already processed' });
}
```

### 3. Validación de Datos
```typescript
if (!eventId || Object.keys(tickets).length === 0) {
  return json({ error: 'Invalid webhook data' }, { status: 400 });
}
```

## 📝 Custom Data Enviado

En el checkout (`/api/create-checkout`):
```typescript
const customData = {
  event_id: eventId,           // UUID del evento
  tickets: JSON.stringify({    // Tickets seleccionados
    "ticket-uuid-1": 2,        // 2 tickets VIP
    "ticket-uuid-2": 1         // 1 ticket General
  }),
  buyer_id: buyerId || null    // UUID del usuario (si está autenticado)
};
```

Recibido en el webhook:
```typescript
const customData = event.data.attributes.checkout_data.custom;
const eventId = customData.event_id;
const tickets = JSON.parse(customData.tickets);
const buyerId = customData.buyer_id;
```

## 🎫 Tickets Data en la Base de Datos

La columna `tickets_data` (JSONB) guarda:
```json
{
  "ticket-uuid-1": 2,
  "ticket-uuid-2": 1
}
```

Esto permite:
- Saber exactamente qué tickets y cuántos se compraron
- Reconstruir la orden en el futuro
- Generar reportes de ventas por tipo de ticket

## 🔄 Estados de Payment Status

| Estado | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `pending` | Pago pendiente | Orden creada pero no pagada |
| `paid` | Pago completado | Webhook `order_created` con status=paid |
| `failed` | Pago fallido | Error en el procesamiento |
| `refunded` | Reembolsado | Webhook `order_refunded` |

## 🚨 Manejo de Errores

### Error en el Webhook
```typescript
try {
  // Procesar orden
} catch (error) {
  console.error('Webhook error:', error);
  return json({ error: 'Internal server error' }, { status: 500 });
}
```

Lemon Squeezy intentará reenviar el webhook si falla (hasta 3 veces).

### Error al Guardar en Supabase
```typescript
if (orderError) {
  console.error('❌ Error creating order:', orderError);
  return json({ error: 'Error saving order' }, { status: 500 });
}
```

El webhook retorna 500, y Lemon Squeezy lo reintentará.

## 📊 Logs Generados

```
📨 Webhook received: order_created
   Order ID: #12345
   Status: paid
   Amount: $75.00
✅ Order processed successfully: #12345
   Database ID: abc123-def456-...
   Authenticated user: user-uuid-123
```

## 🎯 Próximos Pasos

Después de configurar el webhook:

1. ✅ Probar en modo test
2. ✅ Verificar que las órdenes se guarden en Supabase
3. ✅ Verificar que los tickets se actualicen
4. ✅ Implementar página "Mis Compras" para usuarios
5. ✅ Enviar emails de confirmación (próxima fase)
6. ✅ Generar PDFs de tickets (próxima fase)

## 🔗 Enlaces Útiles

- [Lemon Squeezy Test Cards](https://docs.lemonsqueezy.com/help/getting-started/test-mode#test-card-numbers)
- [Webhook Debugging](https://app.lemonsqueezy.com/settings/webhooks)
- [Supabase Dashboard](https://app.supabase.com)
