# Checklist de Testing - Sistema de Verificación QR

## 1. Testing de Validación Online ✅

### 1.1 Ticket Válido
- [ ] Escanear ticket válido por primera vez
  - **Esperado**: ✅ Mensaje de éxito, vibración positiva, mostrar datos del ticket
  - **Verificar**: Contador de verificados incrementa, ticket guardado en historial

### 1.2 Ticket Duplicado
- [ ] Escanear el mismo ticket dos veces consecutivas
  - **Esperado**: ❌ Error "Ticket ya verificado", vibración de error
  - **Verificar**: Contador no incrementa

### 1.3 Ticket de Otro Evento
- [ ] Escanear ticket válido pero de diferente evento
  - **Esperado**: ❌ Error "Este ticket no pertenece a este evento"
  - **Verificar**: No se marca como verificado

### 1.4 Ticket Inválido/Falso
- [ ] Escanear QR con datos incorrectos o ticket_id inexistente
  - **Esperado**: ❌ Error "Ticket no encontrado" o "QR inválido"
  - **Verificar**: No se crea registro de verificación

### 1.5 QR No JSON
- [ ] Escanear QR que no sea formato JSON
  - **Esperado**: Sistema intenta usar como ticket_id directo, o muestra error si no existe
  - **Verificar**: Manejo de error adecuado

---

## 2. Testing de Modo Offline 📵

### 2.1 Verificación Offline Básica
- [ ] **Setup**: Activar modo avión en el dispositivo
- [ ] Escanear ticket válido previamente cacheado
  - **Esperado**: ✅ Verificación exitosa con indicador "Se sincronizará cuando haya conexión"
  - **Verificar**: 
    - Badge "Offline" visible
    - Ticket guardado en IndexedDB queue
    - Contador de pendientes incrementa

### 2.2 Múltiples Verificaciones Offline
- [ ] **Setup**: Modo avión activado
- [ ] Escanear 5 tickets diferentes consecutivamente
  - **Esperado**: Todos se agregan a cola, contador muestra "5 pendientes"
  - **Verificar**: Todos guardados en IndexedDB con status "pending"

### 2.3 Duplicado Offline
- [ ] **Setup**: Modo avión
- [ ] Escanear mismo ticket dos veces offline
  - **Esperado**: ❌ Segunda vez muestra error "Ticket ya verificado localmente"
  - **Verificar**: No se duplica en la cola

### 2.4 Ticket No Cacheado
- [ ] **Setup**: Modo avión, escanear ticket que NO fue cacheado previamente
  - **Esperado**: ❌ Error "Ticket no encontrado en caché offline"
  - **Verificar**: No se agrega a cola

### 2.5 Sincronización Automática
- [ ] **Setup**: Tener 3+ tickets en cola offline
- [ ] Desactivar modo avión (restaurar conexión)
  - **Esperado**: 
    - Badge cambia a "Online"
    - Toast "Conexión restaurada"
    - Sincronización automática inicia
    - Spinner "Sincronizando..." visible
  - **Verificar**:
    - Todos los tickets se envían al backend
    - Cola de IndexedDB se vacía
    - Historial muestra las verificaciones
    - Contador de pendientes vuelve a 0

### 2.6 Sincronización Manual
- [ ] **Setup**: Modo online, tener tickets en cola
- [ ] Click en botón "X pendientes"
  - **Esperado**: Sincronización manual exitosa
  - **Verificar**: Cola procesada correctamente

### 2.7 Manejo de Errores en Sync
- [ ] **Setup**: Ticket en cola que ya fue verificado por otro organizador
- [ ] Sincronizar
  - **Esperado**: Error capturado, ticket marcado como "failed" en cola
  - **Verificar**: Toast de error, no se elimina de la cola automáticamente

---

## 3. Testing de Historial 📊

### 3.1 Vista Básica
- [ ] Acceder a `/verificar/[event_id]/historial`
  - **Esperado**: Tabla con todas las verificaciones, ordenadas por más reciente
  - **Verificar**: Columnas: Fecha, Cliente, Tipo Ticket, Código, Verificado por

### 3.2 Paginación
- [ ] **Setup**: Evento con 50+ verificaciones
- [ ] Navegar entre páginas
  - **Esperado**: 20 items por página, botones "Anterior" y "Siguiente"
  - **Verificar**: Contador correcto "Mostrando 1-20 de 50"

### 3.3 Filtro por Fecha
- [ ] Aplicar filtro "Desde" y "Hasta"
  - **Esperado**: Solo verificaciones en ese rango
  - **Verificar**: URL con parámetros `?dateFrom=...&dateTo=...`

### 3.4 Filtro por Verificador
- [ ] Seleccionar verificador del dropdown
  - **Esperado**: Solo verificaciones de ese usuario
  - **Verificar**: Lista de verificadores únicos correcta

### 3.5 Exportar CSV
- [ ] Click en "Exportar CSV"
  - **Esperado**: Descarga archivo `historial_[evento]_[fecha].csv`
  - **Verificar**: 
    - CSV con headers correctos
    - Todos los registros de la página actual
    - Formato UTF-8, comas como separador

### 3.6 Limpiar Filtros
- [ ] Aplicar filtros, luego click "Limpiar"
  - **Esperado**: Volver a vista completa sin filtros

---

## 4. Testing de Interfaz PWA 📱

### 4.1 Instalación iOS
- [ ] Safari en iPhone
- [ ] Compartir → "Añadir a pantalla de inicio"
  - **Esperado**: Ícono instalado, abrir en modo standalone
  - **Verificar**: Sin barra de navegación Safari

### 4.2 Instalación Android
- [ ] Chrome en Android
- [ ] Banner "Instalar app" o menú → "Añadir a pantalla de inicio"
  - **Esperado**: PWA instalada como app nativa
  - **Verificar**: Splash screen, modo fullscreen

### 4.3 Acceso a Cámara
- [ ] Primera vez escaneando
  - **Esperado**: Prompt de permisos de cámara
  - **Verificar**: Permiso concedido, cámara funciona

### 4.4 Persistencia de Sesión
- [ ] Cerrar PWA, volver a abrir
  - **Esperado**: Sesión mantenida, no pide login
  - **Verificar**: IndexedDB persiste datos

### 4.5 Service Worker
- [ ] Verificar en DevTools → Application → Service Workers
  - **Esperado**: Service Worker activo y corriendo
  - **Verificar**: Cache de assets estáticos

---

## 5. Testing de Dispositivos 📲

### 5.1 iPhone (iOS Safari)
- [ ] iPhone 12 o superior, iOS 16+
- [ ] Todos los tests de Online, Offline, Historial
  - **Verificar**: Vibraciones funcionan, cámara accesible

### 5.2 Android (Chrome)
- [ ] Android 10+, Chrome 100+
- [ ] Todos los tests de Online, Offline, Historial
  - **Verificar**: Permisos correctos, vibración

### 5.3 iPad/Tablet
- [ ] Tablet con cámara trasera
- [ ] Testing básico de escaneo
  - **Verificar**: UI responsive, botones accesibles

### 5.4 Desktop (Testing de desarrollo)
- [ ] Chrome/Firefox en desktop
- [ ] Probar flujo sin cámara física (simulador)
  - **Verificar**: DevTools camera simulation funciona

---

## 6. Testing de Seguridad 🔒

### 6.1 Autorización de Organizador
- [ ] **Setup**: Usuario normal (no organizador)
- [ ] Intentar acceder a `/verificar/[event_id]`
  - **Esperado**: Redirect a inicio o error 403

### 6.2 Evento de Otro Organizador
- [ ] **Setup**: Organizador A intenta verificar evento de Organizador B
- [ ] Acceder a URL
  - **Esperado**: Error 403 "No tienes permiso"

### 6.3 Token de Sesión
- [ ] **Setup**: Cerrar sesión
- [ ] Intentar acceder a rutas de verificación
  - **Esperado**: Redirect a `/iniciar-sesion`

---

## 7. Testing de Casos Edge 🚧

### 7.1 Conexión Intermitente
- [ ] **Setup**: Activar/desactivar WiFi rápidamente mientras escanea
  - **Esperado**: Sistema detecta cambios, muestra badges correctos
  - **Verificar**: No se pierde ninguna verificación

### 7.2 Batería Baja
- [ ] **Setup**: Dispositivo con <10% batería
- [ ] Escanear varios tickets
  - **Esperado**: Sistema funciona, datos persisten
  - **Verificar**: IndexedDB no se corrompe

### 7.3 App en Background
- [ ] Abrir PWA, iniciar escaneo, cambiar a otra app 30 seg, volver
  - **Esperado**: Estado mantenido, escáner se reinicia
  - **Verificar**: No hay pérdida de datos

### 7.4 Cierre Forzado
- [ ] Iniciar verificación offline, cerrar app antes de completar
  - **Esperado**: Al reabrir, verificación en cola
  - **Verificar**: IndexedDB commit atómico

### 7.5 Dos Organizadores Simultáneos
- [ ] **Setup**: Dos organizadores verifican mismo ticket al mismo tiempo
  - **Esperado**: Uno tiene éxito, otro recibe error "ya verificado"
  - **Verificar**: Constraint de base de datos funciona

---

## 8. Testing de Performance ⚡

### 8.1 Cache Inicial
- [ ] Medir tiempo de carga inicial de tickets en IndexedDB
  - **Target**: < 2 segundos para 500 tickets
  - **Verificar**: Console log muestra "✅ Tickets cacheados"

### 8.2 Búsqueda en Cache
- [ ] Escanear ticket offline (búsqueda en 1000+ tickets cacheados)
  - **Target**: < 500ms tiempo de respuesta
  - **Verificar**: No lag perceptible

### 8.3 Sincronización Masiva
- [ ] Sincronizar 50 verificaciones offline
  - **Target**: < 10 segundos
  - **Verificar**: Progress UI actualiza correctamente

### 8.4 Memoria
- [ ] Verificar uso de RAM después de 1 hora de uso
  - **Target**: < 100MB incremento
  - **Verificar**: No memory leaks en DevTools

---

## 9. Checklist de Regresión 🔄

Ejecutar después de cada cambio importante:

- [ ] Login/Logout funciona
- [ ] Crear evento funciona
- [ ] Comprar ticket funciona
- [ ] Verificación online básica funciona
- [ ] Verificación offline básica funciona
- [ ] Sincronización automática funciona
- [ ] Historial carga correctamente
- [ ] Exportar CSV funciona
- [ ] PWA instala correctamente
- [ ] No hay errores en Console

---

## 10. Criterios de Aceptación ✅

### Mínimo para Production:
- ✅ 100% tests de Validación Online (1.1-1.5) pasan
- ✅ 100% tests de Modo Offline (2.1-2.5) pasan
- ✅ Sincronización automática funciona sin errores
- ✅ Historial básico (3.1-3.3) funciona
- ✅ PWA instala en iOS y Android
- ✅ Tests de Seguridad (6.1-6.3) pasan

### Nice to Have:
- ⭐ Todos los filtros de historial
- ⭐ Exportar CSV
- ⭐ Tests de performance cumplen targets
- ⭐ Zero memory leaks

---

## Registro de Testing

| Fecha | Tester | Dispositivo | Tests Pasados | Tests Fallidos | Notas |
|-------|--------|-------------|---------------|----------------|-------|
| YYYY-MM-DD | Nombre | iPhone 13 | 15/20 | 5/20 | Ver issue #123 |

---

## Bugs Conocidos

1. **[ISSUE-001]** Descripción del bug
   - **Reproducción**: Pasos...
   - **Workaround**: Solución temporal...
   - **Estado**: Open/Fixed

2. **[ISSUE-002]** ...

---

**Última actualización**: 2024-01-XX  
**Responsable**: Equipo de QA
