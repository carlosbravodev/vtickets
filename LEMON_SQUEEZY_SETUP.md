# 🍋 Guía de Configuración: Lemon Squeezy

## 📋 Pasos para configurar Lemon Squeezy

### 1. Instalar dependencias

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

### 2. Crear cuenta en Lemon Squeezy

1. Ve a https://lemonsqueezy.com y crea tu cuenta
2. **IMPORTANTE:** Necesitas una empresa registrada en un país soportado (USA, UK, EU, etc.)
3. Completa el proceso de verificación
4. Activa el **modo Test** primero para desarrollo

### 3. Configurar tu Store

1. Ve a **Settings → Store Settings**
2. Configura:
   - Store name
   - Currency: USD
   - Logo y colores de marca

### 4. Crear un Producto

1. Ve a **Products → New Product**
2. Configura:
   - **Name:** "Tickets de Eventos"
   - **Type:** Digital
   - **Price:** No pongas precio fijo (lo enviaremos dinámicamente)
3. Crea una **Variant** (variante) y guarda su ID

### 5. Obtener API Keys

1. Ve a **Settings → API**
2. Copia tu **API Key**
3. Copia tu **Store ID**
4. Anota el **Variant ID** del producto que creaste

### 6. Configurar Webhook

1. Ve a **Settings → Webhooks**
2. Click en **+ New Webhook**
3. Configura:
   - **URL:** `https://tu-dominio.com/api/webhook/lemonsqueezy`
   - **Events:** Selecciona `order_created`
   - **Secret:** Copia el secret generado

### 7. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=tu_api_key
LEMON_SQUEEZY_STORE_ID=tu_store_id
LEMON_SQUEEZY_VARIANT_ID=tu_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=tu_webhook_secret

# App
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

### 8. Probar en modo Test

1. Inicia el servidor: `npm run dev`
2. Ve a un evento y selecciona tickets
3. Click en "Proceder al pago"
4. Usa una tarjeta de prueba de Lemon Squeezy:
   - **Card:** `4242 4242 4242 4242`
   - **Exp:** Cualquier fecha futura
   - **CVC:** Cualquier 3 dígitos

### 9. Configurar Webhook Local (para desarrollo)

Para recibir webhooks en local, usa **ngrok** o **localtunnel**:

```bash
# Opción 1: ngrok
npx ngrok http 5173

# Opción 2: localtunnel
npx localtunnel --port 5173
```

Luego actualiza la URL del webhook en Lemon Squeezy con la URL pública.

### 10. Ir a producción

1. Desactiva el modo Test en Lemon Squeezy
2. Actualiza las variables de entorno con las keys de producción
3. Configura el webhook con tu dominio real
4. ¡Listo para recibir pagos reales!

---

## 🔄 Flujo de pago

```
1. Usuario selecciona tickets → frontend
2. Click "Proceder al pago" → llama a /api/create-checkout
3. API crea sesión en Lemon Squeezy
4. Usuario es redirigido a Lemon Squeezy
5. Usuario completa el pago
6. Lemon Squeezy envía webhook → /api/webhook/lemonsqueezy
7. Webhook crea orden en Supabase y actualiza tickets
8. Usuario es redirigido a /success
```

---

## 💰 Comisiones de Lemon Squeezy

- **5% de comisión** + tarifas de procesamiento de pago
- Ellos manejan:
  - Impuestos internacionales
  - Compliance legal
  - Prevención de fraude
  - Chargebacks

---

## ⚠️ Consideración importante

**Lemon Squeezy requiere que tu empresa esté registrada en un país soportado.**

Si tu empresa está en Ecuador, tienes 2 opciones:

### Opción A: Usar un servicio de incorporación
- **Stripe Atlas** (USA LLC): $500 setup
- **Firstbase.io** (USA LLC): Similar
- Te dan una empresa legal en USA

### Opción B: Usar alternativas locales
- **Kushki** (ecuatoriana)
- **PayPhone** (ecuatoriana)
- **PayPal** (disponible en Ecuador)

---

## 🆘 Soporte

- Documentación: https://docs.lemonsqueezy.com
- Discord: https://discord.gg/lemonsqueezy
- Email: help@lemonsqueezy.com

---

## ✅ Checklist de implementación

- [ ] Cuenta de Lemon Squeezy creada
- [ ] Store configurado
- [ ] Producto y variante creados
- [ ] API Keys obtenidas
- [ ] Webhook configurado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prueba con tarjeta de test exitosa
- [ ] Webhook local funcionando
- [ ] Órdenes guardándose en Supabase
- [ ] Tickets actualizándose correctamente
