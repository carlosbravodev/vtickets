# 📱 Guía del Organizador - Sistema de Verificación QR

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación de la PWA](#instalación-de-la-pwa)
3. [Acceder al sistema de verificación](#acceder-al-sistema-de-verificación)
4. [Escanear tickets paso a paso](#escanear-tickets-paso-a-paso)
5. [Modo Offline](#modo-offline)
6. [Ver historial de verificaciones](#ver-historial-de-verificaciones)
7. [Solución de problemas](#solución-de-problemas)
8. [Preguntas frecuentes](#preguntas-frecuentes)

---

## 🎯 Introducción

El sistema de verificación QR de VTickets te permite:

- ✅ **Verificar tickets en tiempo real** escaneando códigos QR
- 📱 **Funciona offline** - no necesitas conexión a Internet constante
- 📊 **Ver historial completo** de todas las verificaciones
- 👥 **Múltiples verificadores** pueden trabajar simultáneamente
- 🔐 **Seguro y confiable** - previene duplicados y fraudes

### ¿Qué necesitas?

- 📱 Smartphone con cámara (iPhone o Android)
- 🌐 Conexión a Internet (solo para instalación y sincronización)
- 👤 Cuenta de organizador en VTickets
- 🎫 Un evento creado con tickets vendidos

---

## 📲 Instalación de la PWA

La PWA (Progressive Web App) te permite usar el sistema como una app nativa, incluso sin conexión.

### En iPhone (iOS)

1. **Abre Safari** y ve a `https://vtickets.vercel.app`

2. **Inicia sesión** con tu cuenta de organizador

3. **Toca el botón de compartir** (ícono de cuadrado con flecha)
   
   ![Botón compartir iOS](https://via.placeholder.com/300x100?text=Boton+Compartir+iOS)

4. **Desplázate hacia abajo** y selecciona **"Añadir a pantalla de inicio"**

   ![Añadir a pantalla de inicio](https://via.placeholder.com/300x100?text=Anadir+a+Inicio)

5. **Personaliza el nombre** (opcional) y toca **"Añadir"**

6. ✅ **Listo!** Verás el ícono de VTickets en tu pantalla de inicio

### En Android

1. **Abre Chrome** y ve a `https://vtickets.vercel.app`

2. **Inicia sesión** con tu cuenta de organizador

3. **Verás un banner en la parte inferior** que dice "Instalar app"
   
   - Si no aparece, toca el menú (⋮) → **"Añadir a pantalla de inicio"**

   ![Banner instalar Android](https://via.placeholder.com/300x100?text=Banner+Android)

4. **Toca "Instalar"** o "Añadir"

5. ✅ **Listo!** La app se instalará como una app nativa

### Verificar la instalación

- ✅ Deberías ver el ícono de VTickets en tu pantalla de inicio
- ✅ Al abrir, NO deberías ver la barra de navegación del navegador
- ✅ Se abrirá en modo pantalla completa (fullscreen)

---

## 🔐 Acceder al sistema de verificación

1. **Abre la app VTickets** desde tu pantalla de inicio

2. **Inicia sesión** si no lo has hecho ya
   - Email y contraseña
   - Asegúrate de tener rol de **Organizador**

3. **Ve al menú principal** y selecciona **"Verificar Tickets"**

4. **Selecciona tu evento** de la lista
   - Solo verás eventos de los que eres organizador
   - Verás estadísticas básicas: Total, Verificados, Pendientes

5. ✅ **Estás listo para escanear!**

---

## 📸 Escanear tickets paso a paso

### Preparación

Antes del evento, asegúrate de:

1. ✅ **Tener buena conexión a Internet** para cachear tickets
2. ✅ **Abrir la página de verificación** de tu evento al menos una vez online
   - Esto descargará todos los tickets para uso offline
3. ✅ **Dar permisos de cámara** la primera vez que escanees

### Proceso de escaneo

#### Paso 1: Iniciar escaneo

1. En la pantalla de verificación, toca **"Iniciar Escaneo"**

   ![Botón iniciar escaneo](https://via.placeholder.com/300x150?text=Iniciar+Escaneo)

2. **Permite el acceso a la cámara** cuando se te solicite
   - Toca "Permitir" o "OK"
   - Solo necesitas hacerlo la primera vez

3. La cámara se activará y verás un **visor en tiempo real**

#### Paso 2: Enfocar el QR

1. **Apunta la cámara** hacia el código QR del ticket

2. **Mantén el teléfono estable** a unos 15-20 cm de distancia

3. **Asegúrate de buena iluminación** - el QR debe ser claramente visible

4. El sistema **detecta automáticamente** el QR - no necesitas tocar ningún botón

   ![Escaneando QR](https://via.placeholder.com/300x200?text=Escaneando+QR)

#### Paso 3: Resultados

##### ✅ Ticket Válido

Si el ticket es válido, verás:

- ✅ **Mensaje de éxito** en verde
- 📱 **Vibración positiva** (dos pulsos cortos)
- 👤 **Nombre del comprador**
- 🎫 **Tipo de ticket** (General, VIP, etc.)
- 💰 **Precio del ticket**
- 📊 **Contador actualizado** (Verificados +1)

El ticket quedará **marcado como verificado** automáticamente.

![Ticket válido](https://via.placeholder.com/300x200?text=Ticket+Valido)

##### ❌ Ticket Inválido

Si hay un problema, verás:

- ❌ **Mensaje de error** en rojo
- 📱 **Vibración de error** (un pulso largo)
- ℹ️ **Razón del error**:
  - "Ticket ya verificado" - fue escaneado anteriormente
  - "Este ticket no pertenece a este evento" - ticket de otro evento
  - "Ticket no encontrado" - QR inválido o falso

![Ticket inválido](https://via.placeholder.com/300x200?text=Ticket+Invalido)

#### Paso 4: Continuar escaneando

- El escáner **permanece activo** después de cada escaneo
- Simplemente **apunta al siguiente QR**
- Para pausar, toca **"Detener Escaneo"**

### Tips para escaneo rápido

💡 **Consejos**:
- Mantén el teléfono estable para lecturas más rápidas
- Asegúrate de buena iluminación natural o artificial
- Si el QR está en un papel arrugado, aplánalo un poco
- Evita reflejos en la pantalla del teléfono si el ticket es digital
- Puedes escanear tickets impresos O en pantallas de otros teléfonos

---

## 📵 Modo Offline

Una de las mejores características es la capacidad de verificar tickets **sin conexión a Internet**.

### ¿Cómo funciona?

1. **Cacheo inicial** (requiere Internet):
   - La primera vez que abres la página de verificación estando online
   - La app descarga TODOS los tickets del evento
   - Se guardan en tu dispositivo (IndexedDB)

2. **Verificación offline**:
   - Puedes escanear tickets normalmente sin Internet
   - La app busca en el cache local
   - Valida contra los datos descargados
   - Guarda las verificaciones en una "cola de sincronización"

3. **Sincronización automática**:
   - Cuando recuperes conexión, la app detecta automáticamente
   - Envía todas las verificaciones pendientes al servidor
   - Limpia la cola local
   - ✅ Todo sincronizado!

### Indicadores visuales

#### 🟢 Modo Online
```
┌─────────────────────────┐
│ 🟢 Online               │
└─────────────────────────┘
```
- Punto verde parpadeante
- Verificaciones se guardan directamente en el servidor

#### 🟠 Modo Offline
```
┌─────────────────────────┐
│ 📵 Offline              │
└─────────────────────────┘
```
- Ícono de señal tachada en ámbar
- Verificaciones van a la cola local

#### 🔄 Sincronizando
```
┌─────────────────────────┐
│ 🔄 5 pendientes         │
└─────────────────────────┘
```
- Botón azul muestra cuántas verificaciones esperan sincronizarse
- Click para sincronizar manualmente

### Uso en el evento

**Escenario recomendado**:

1. **Antes del evento** (con WiFi):
   - Abre la app y carga la página de verificación
   - Espera mensaje: "✅ Tickets cacheados para uso offline"

2. **Durante el evento** (sin WiFi):
   - Escanea tickets normalmente
   - Verás "Se sincronizará cuando haya conexión" en cada verificación exitosa
   - El contador de pendientes aumenta

3. **Después del evento** (con WiFi):
   - La app sincroniza automáticamente al recuperar conexión
   - O toca el botón "X pendientes" para forzar sincronización
   - Espera el mensaje: "✅ Sincronización completa"

### ⚠️ Limitaciones del modo offline

- ❌ **No puedes ver actualizaciones en tiempo real** de otros verificadores
- ❌ **No puedes acceder al historial completo** (solo las últimas 10 verificaciones cacheadas)
- ✅ **SÍ puedes verificar tickets** que estén en el cache
- ✅ **SÍ se previenen duplicados** localmente

---

## 📊 Ver historial de verificaciones

### Acceder al historial

1. En la pantalla de verificación, toca el botón **"Historial"** (ícono de reloj)

   ![Botón historial](https://via.placeholder.com/200x50?text=Historial)

2. Verás una **tabla completa** de todas las verificaciones

### Información mostrada

Cada fila contiene:

| Columna | Descripción |
|---------|-------------|
| **Fecha y Hora** | Cuándo se verificó el ticket |
| **Cliente** | Nombre y email del comprador |
| **Tipo de Ticket** | General, VIP, etc. + precio |
| **Código** | Código único del ticket |
| **Verificado por** | Email del organizador que escaneó |

### Filtrar resultados

#### Por fecha
1. Selecciona **"Desde"** y **"Hasta"**
2. Toca **"Aplicar"**
3. Solo verás verificaciones en ese rango

#### Por verificador
1. Despliega el menú **"Verificado por"**
2. Selecciona un organizador específico
3. Toca **"Aplicar"**

#### Limpiar filtros
- Toca **"Limpiar"** para volver a ver todos los resultados

### Exportar datos

Para generar un reporte:

1. Aplica los filtros deseados (opcional)
2. Toca **"Exportar CSV"** (botón verde)
3. Se descargará un archivo `historial_[evento]_[fecha].csv`
4. Abre con Excel, Google Sheets o cualquier programa de hojas de cálculo

**Contenido del CSV**:
- Todas las columnas de la tabla
- Formato compatible con Excel
- Codificación UTF-8 (acentos y ñ correctos)

### Paginación

- El historial muestra **20 verificaciones por página**
- Usa los botones **"Anterior"** y **"Siguiente"** para navegar
- Verás el contador: "Mostrando 1-20 de 150"

---

## 🛠️ Solución de problemas

### Problema: No puedo acceder a la cámara

**Síntomas**: Mensaje "Error al acceder a la cámara"

**Soluciones**:

1. **Verificar permisos**:
   - iOS: Ajustes → Safari → Cámara → Permitir
   - Android: Configuración → Apps → Chrome → Permisos → Cámara → Permitir

2. **Reiniciar la app**:
   - Cierra completamente VTickets
   - Vuelve a abrir

3. **Verificar que ninguna otra app use la cámara**:
   - Cierra todas las demás apps
   - Intenta de nuevo

4. **Reinstalar la PWA**:
   - Elimina el ícono de la pantalla de inicio
   - Vuelve a instalarla siguiendo los pasos anteriores

---

### Problema: El QR no se detecta

**Síntomas**: La cámara está activa pero no lee el QR

**Soluciones**:

1. **Mejora la iluminación**:
   - Usa luz natural o enciende luces adicionales
   - Evita sombras sobre el QR

2. **Limpia la cámara**:
   - Usa un paño suave para limpiar el lente

3. **Ajusta la distancia**:
   - Acércate o aléjate del QR (15-20 cm ideal)
   - Mantén el teléfono estable

4. **Verifica el QR**:
   - Asegúrate de que sea un ticket válido de VTickets
   - Si está muy arrugado o borroso, pide al cliente que lo muestre en su email

---

### Problema: "Ticket ya verificado" pero el cliente jura que no entró

**Posibles causas**:

1. **Verificación duplicada accidental**:
   - Otro organizador ya escaneó el ticket
   - Revisa el historial para ver quién y cuándo lo verificó

2. **Ticket compartido/revendido**:
   - El QR fue compartido con otra persona que ya entró
   - ⚠️ Esto es fraude - consulta con tu equipo de seguridad

3. **Error de sincronización**:
   - Poco probable, pero revisa en el historial online

**Qué hacer**:
- 🔍 Ve al historial y busca ese código de ticket
- 👀 Verifica fecha, hora y quién lo escaneó
- 📞 Si es legítimo, contacta al cliente por email/teléfono para resolver
- 🚫 Si detectas fraude, sigue tus protocolos de seguridad

---

### Problema: Las verificaciones offline no se sincronizan

**Síntomas**: El contador de pendientes no baja a 0

**Soluciones**:

1. **Verificar conexión a Internet**:
   - Abre el navegador y carga cualquier página
   - Asegúrate de tener WiFi o datos móviles activos

2. **Sincronización manual**:
   - Toca el botón "X pendientes"
   - Espera unos segundos

3. **Revisar errores**:
   - Si aparece un mensaje de error, léelo cuidadosamente
   - Puede ser que un ticket ya fue verificado por otro organizador

4. **Reintentar**:
   - Cierra y vuelve a abrir la app
   - La sincronización debería reiniciarse automáticamente

5. **Último recurso** (contacta soporte):
   - Si nada funciona, toma captura de pantalla
   - Envía a soporte con el ID del evento y hora aproximada

---

### Problema: La app está lenta o se congela

**Soluciones**:

1. **Cerrar otras apps**:
   - Deja solo VTickets abierta
   - Libera memoria RAM

2. **Limpiar cache del navegador** (si usas versión web):
   - iOS: Ajustes → Safari → Limpiar historial y datos
   - Android: Chrome → Configuración → Privacidad → Borrar datos

3. **Actualizar la app**:
   - Elimina y reinstala la PWA
   - Esto descargará la última versión

4. **Revisar espacio de almacenamiento**:
   - Asegúrate de tener al menos 100 MB libres
   - Elimina apps o fotos innecesarias

---

## ❓ Preguntas frecuentes

### ¿Puedo usar la app sin instalarla?

**Sí**, pero es más lento. Puedes abrir `https://vtickets.vercel.app` en Safari/Chrome y usar la versión web. Sin embargo, la PWA instalada:
- ✅ Carga más rápido
- ✅ Funciona mejor offline
- ✅ No muestra la barra del navegador

### ¿Cuántos organizadores pueden verificar al mismo tiempo?

**Ilimitados**. Cada organizador puede escanear tickets simultáneamente. El sistema previene duplicados automáticamente.

### ¿Qué pasa si dos organizadores escanean el mismo ticket exactamente al mismo tiempo?

El **primero en llegar** al servidor marcará el ticket como verificado. El segundo recibirá un error "Ticket ya verificado". Esto es por diseño para prevenir fraudes.

### ¿Puedo verificar tickets de varios eventos a la vez?

**No**. Debes seleccionar un evento a la vez. Para cambiar de evento:
1. Vuelve a la lista de eventos (← Volver a eventos)
2. Selecciona el otro evento

### ¿Cuánto espacio ocupa el cache offline?

Depende del número de tickets:
- **100 tickets**: ~100 KB
- **1,000 tickets**: ~1 MB
- **10,000 tickets**: ~10 MB

Es muy ligero y no debería ser problema.

### ¿Los datos están seguros?

**Sí**. Todas las comunicaciones usan HTTPS (encriptado). Los datos en IndexedDB solo son accesibles por la app. Además:
- 🔐 Autenticación requerida
- 🛡️ Solo organizadores autorizados tienen acceso
- 📊 Logs de auditoría de todas las verificaciones

### ¿Funciona en tablets?

**Sí**, cualquier dispositivo con cámara y navegador moderno. Tablets iPad y Android funcionan perfectamente.

### ¿Puedo imprimir la lista de verificaciones?

**Sí**, de dos formas:
1. **Exportar a CSV** y luego imprimir desde Excel/Google Sheets
2. **Imprimir directamente** desde el navegador (Ctrl+P o Cmd+P) en la página de historial

### ¿Qué pasa si pierdo conexión en medio de un evento?

**No hay problema**. La app cambiará automáticamente a modo offline:
- ✅ Seguirás verificando tickets
- ✅ Se guardarán en la cola local
- ✅ Se sincronizarán cuando recuperes conexión

### ¿Puedo verificar tickets de eventos pasados?

**Sí**, no hay límite de tiempo. Puedes acceder al historial de cualquier evento tuyo, incluso años después.

---

## 📞 Contacto y Soporte

Si tienes problemas que no se resuelven con esta guía:

- 📧 **Email**: soporte@vtickets.com
- 💬 **Chat en vivo**: Disponible en la app
- 📱 **Teléfono**: +34 XXX XXX XXX (horario 9:00 - 18:00)
- 📚 **Base de conocimientos**: https://docs.vtickets.com

---

**¡Gracias por usar VTickets! 🎉**

*Última actualización: 2024-01-XX*  
*Versión de la guía: 1.0*
