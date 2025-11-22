# Configuración PWA - VTickets

## Cambios Realizados

### 1. **Manifest (manifest.json)**
- ✅ `display: "standalone"` - Abre como app independiente, no en navegador
- ✅ `start_url: "/"` - URL inicial de la app
- ✅ `scope: "/"` - Alcance de la PWA
- ✅ Iconos configurados (192x192 y 512x512)
- ✅ Theme color y background color
- ✅ Shortcuts para acceso rápido
- ✅ Orientación portrait

### 2. **Service Worker (service-worker.ts)**
- ✅ Cacheo de assets estáticos
- ✅ Estrategia Network First con fallback a cache
- ✅ Soporte offline básico
- ✅ Actualización automática de cache

### 3. **HTML (app.html)**
- ✅ Link al manifest
- ✅ Meta tags para iOS
- ✅ Apple touch icons
- ✅ `apple-mobile-web-app-capable: yes`
- ✅ `apple-mobile-web-app-status-bar-style: black-translucent`

### 4. **Registro del Service Worker (+layout.svelte)**
- ✅ Registro automático al cargar la app
- ✅ Notificación de actualizaciones disponibles
- ✅ Manejo de errores

## Verificación

### En Android (Chrome):
1. Abrir la app en Chrome
2. Menú → "Agregar a pantalla de inicio" o "Instalar app"
3. Debería mostrar el banner de instalación
4. Una vez instalado, abre como app standalone (sin barra de navegador)

### En iOS (Safari):
1. Abrir la app en Safari
2. Botón "Compartir" → "Agregar a pantalla de inicio"
3. Debería aparecer el icono en la pantalla de inicio
4. Al abrir, muestra splash screen y corre en modo standalone

## Diferencias Clave

### ANTES (Acceso Directo):
- ❌ Abre en pestaña del navegador
- ❌ Muestra barra de navegación del navegador
- ❌ No hay splash screen
- ❌ No está en el launcher de apps

### AHORA (PWA Standalone):
- ✅ Abre como aplicación independiente
- ✅ Sin barra de navegación del navegador
- ✅ Splash screen con iconos y colores del brand
- ✅ Aparece en el launcher de aplicaciones
- ✅ Puede funcionar offline (parcialmente)

## Archivos Creados/Modificados

1. ✅ `static/manifest.json` - Configuración de la PWA
2. ✅ `src/service-worker.ts` - Service Worker para cacheo
3. ✅ `src/app.html` - Meta tags y manifest link
4. ✅ `src/routes/+layout.svelte` - Registro del SW
5. ✅ `svelte.config.js` - Configuración del service worker

## Pasos para Verificar

1. **Build y Deploy:**
   ```bash
   npm run build
   git add -A
   git commit -m "feat: Configurar PWA standalone completa"
   git push
   ```

2. **En el móvil:**
   - Abrir la app en el navegador
   - Esperar el prompt de instalación
   - Instalar la app
   - Abrir desde el launcher
   - **Verificar que NO muestra la barra del navegador**

3. **Verificar manifest:**
   - Ir a DevTools → Application → Manifest
   - Verificar que `display: standalone`
   - Verificar iconos cargados

4. **Verificar Service Worker:**
   - DevTools → Application → Service Workers
   - Debe aparecer activo y running

## Troubleshooting

### Si sigue abriendo en el navegador:

1. **Desinstalar y reinstalar:**
   - Mantener presionado el icono → Desinstalar
   - Limpiar cache del navegador
   - Volver a instalar

2. **Verificar manifest en producción:**
   ```bash
   curl https://tu-dominio.com/manifest.json
   ```

3. **Verificar HTTPS:**
   - PWA requiere HTTPS (Vercel ya lo provee)

4. **Verificar en Lighthouse:**
   - DevTools → Lighthouse → Progressive Web App
   - Debe pasar todos los checks de PWA

## Características Adicionales Disponibles

- ✅ Funciona offline (parcialmente)
- ✅ Shortcuts para acceso rápido
- ✅ Update notifications
- ✅ Cacheo inteligente
- ✅ Theme color para barra de estado
- ✅ Splash screen automático

## Próximos Pasos (Opcional)

- [ ] Push notifications
- [ ] Background sync
- [ ] Compartir contenido nativo
- [ ] Badging API
- [ ] Más estrategias de cache
