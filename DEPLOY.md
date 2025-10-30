# 🚀 Guía de Deploy en Vercel

## ✅ Preparación completada

Tu proyecto ya está configurado para Vercel:
- ✅ Adaptador de Vercel instalado
- ✅ Configuración actualizada en `svelte.config.js`
- ✅ Archivo `vercel.json` creado
- ✅ Cambios subidos a GitHub

---

## 📝 Pasos para Deploy desde Vercel Dashboard

### 1. Acceder a Vercel

Ve a: **https://vercel.com**
- Inicia sesión con tu cuenta de GitHub

### 2. Importar el proyecto

1. Click en **"Add New..."** → **"Project"**
2. Busca el repositorio `carlosbravodev/vtickets`
3. Click en **"Import"**

### 3. Configurar el proyecto

Vercel detectará automáticamente que es un proyecto SvelteKit. Verifica:

**Framework Preset:** SvelteKit  
**Build Command:** `npm run build` (automático)  
**Output Directory:** `.svelte-kit` (automático)  
**Install Command:** `npm install` (automático)

### 4. Configurar Variables de Entorno 🔑

**MUY IMPORTANTE**: Antes de hacer deploy, debes configurar estas variables:

#### Variables Públicas (comienzan con PUBLIC_):
```
PUBLIC_SUPABASE_URL=https://hgedsumfzmwfswqwyqan.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
PUBLIC_APP_URL=https://tu-proyecto.vercel.app
```

#### Variables Privadas:
```
LEMON_SQUEEZY_API_KEY=tu_api_key
LEMON_SQUEEZY_STORE_ID=236207
LEMON_SQUEEZY_VARIANT_ID=1064358
LEMON_SQUEEZY_WEBHOOK_SECRET=tu_webhook_secret
NODE_ENV=production
```

**Cómo agregarlas:**
1. En la página de configuración del proyecto, ve a **"Environment Variables"**
2. Agrega cada variable **una por una**
3. Asegúrate de que estén disponibles para **Production, Preview y Development**

### 5. Deploy

1. Una vez configuradas las variables, click en **"Deploy"**
2. Espera mientras Vercel construye tu proyecto (2-5 minutos)
3. ¡Listo! 🎉

---

## 🔄 Después del Deploy

### Configurar el Webhook de Lemon Squeezy

Una vez que tengas tu URL de Vercel (ej: `https://vtickets.vercel.app`), debes actualizar el webhook:

1. Ve a **Lemon Squeezy Dashboard** → **Settings** → **Webhooks**
2. Edita tu webhook existente o crea uno nuevo
3. URL del webhook: `https://tu-proyecto.vercel.app/api/webhook/lemonsqueezy`
4. Eventos: Selecciona `order_created`
5. Guarda los cambios

### Actualizar PUBLIC_APP_URL

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Edita `PUBLIC_APP_URL`
3. Cambia el valor a tu URL de producción: `https://tu-proyecto.vercel.app`
4. Redeploy el proyecto para aplicar el cambio

---

## 🔍 Verificación Post-Deploy

Verifica que todo funcione:

1. ✅ **Página principal** carga correctamente
2. ✅ **Listado de eventos** (`/eventos`) muestra los eventos de Supabase
3. ✅ **Detalle de evento** (`/evento/[id]`) carga con tipos de tickets
4. ✅ **Checkout** redirige a Lemon Squeezy correctamente
5. ✅ **Success page** se muestra después del pago

---

## 🐛 Solución de Problemas

### Error: "Internal Server Error"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Vercel: **Deployments** → Click en el deploy → **Functions** tab

### Error: "Cannot connect to Supabase"
- Verifica que `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` estén correctas
- Asegúrate de que las variables tengan el prefijo `PUBLIC_`

### Error: "Lemon Squeezy authentication failed"
- Verifica que `LEMON_SQUEEZY_API_KEY` esté correcta (NO lleva el prefijo PUBLIC_)
- Confirma que la API Key sea válida en Lemon Squeezy

### Webhook no funciona
- Asegúrate de que la URL del webhook sea correcta
- Verifica que `LEMON_SQUEEZY_WEBHOOK_SECRET` coincida con el de tu dashboard
- Revisa los logs del webhook en Lemon Squeezy

---

## 🔄 Deploys Automáticos

Vercel está configurado para deploy automático:
- **Push a `main`** → Deploy a producción
- **Pull Request** → Preview deployment automático
- **Otras ramas** → Preview deployment automático

Para desactivar deploys automáticos:
1. Ve a **Settings** → **Git**
2. Configura según tus preferencias

---

## 📊 Monitoreo

### Ver logs en tiempo real:
```bash
vercel logs https://tu-proyecto.vercel.app
```

### Ver analytics:
- Ve a tu proyecto en Vercel
- Tab **"Analytics"** para ver métricas de uso

---

## 🎯 Checklist Final

Antes de considerar el deploy como completo:

- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso sin errores
- [ ] Página principal carga
- [ ] Conexión con Supabase funciona
- [ ] Checkout de Lemon Squeezy funciona
- [ ] Webhook configurado y probado
- [ ] `PUBLIC_APP_URL` actualizada con la URL de producción
- [ ] DNS personalizado configurado (opcional)

---

## 🌐 Dominio Personalizado (Opcional)

Para usar tu propio dominio:

1. Ve a **Settings** → **Domains**
2. Click en **"Add"**
3. Ingresa tu dominio (ej: `vtickets.com`)
4. Sigue las instrucciones para configurar los registros DNS
5. Espera a que se verifique (puede tomar hasta 48 horas)

---

## 📞 Soporte

- **Documentación de Vercel**: https://vercel.com/docs
- **SvelteKit en Vercel**: https://vercel.com/docs/frameworks/sveltekit
- **Vercel Discord**: https://vercel.com/discord

---

¡Tu aplicación está lista para producción! 🚀
