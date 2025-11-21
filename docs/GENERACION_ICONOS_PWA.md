# Generación de Iconos PWA para VTickets

## ¿Qué necesitas hacer?

Necesitas crear **2 iconos** en formato PNG para que la PWA funcione correctamente:

1. **icon-192x192.png** - Icono pequeño (aparece en la pantalla de inicio, notificaciones)
2. **icon-512x512.png** - Icono grande (usado por Android para la instalación)

## Ubicación

Los iconos deben guardarse en:
```
/home/black/Documentos/vtickets/static/icons/
```

## Opción 1: Usar tu logo existente (RECOMENDADO)

Si tienes un logo en `src/lib/assets/logo-navbar.png` o `favicon.png`:

### Método manual (con GIMP, Photoshop, etc.)

1. Abre tu logo en un editor de imágenes
2. Redimensiona a **192x192 píxeles** (mantén el aspect ratio)
3. Si el logo es rectangular, agrégale un fondo o padding para que quede cuadrado
4. Exporta como **PNG** con el nombre `icon-192x192.png`
5. Repite el proceso para **512x512 píxeles** → `icon-512x512.png`
6. Guarda ambos en `/static/icons/`

### Método con ImageMagick (terminal)

```bash
# Instalar ImageMagick si no lo tienes
sudo apt install imagemagick  # En Ubuntu/Debian

# Desde la raíz del proyecto
cd /home/black/Documentos/vtickets

# Redimensionar logo a 192x192 (con padding si es necesario)
convert src/lib/assets/logo-navbar.png -resize 192x192 -gravity center -background white -extent 192x192 static/icons/icon-192x192.png

# Redimensionar logo a 512x512
convert src/lib/assets/logo-navbar.png -resize 512x512 -gravity center -background white -extent 512x512 static/icons/icon-512x512.png
```

**Nota**: Si tu logo tiene fondo transparente y quieres mantenerlo, cambia `-background white` por `-background none`.

## Opción 2: Usar pwa-asset-generator (AUTOMÁTICO)

Esta herramienta genera todos los iconos automáticamente desde una imagen:

```bash
# Instalar globalmente
npm install -g pwa-asset-generator

# Generar iconos desde tu logo
pwa-asset-generator src/lib/assets/logo-navbar.png static/icons --icon-only --favicon --type png --background "#4F46E5"
```

Esto generará múltiples tamaños, pero necesitas solo los de 192x192 y 512x512.

## Opción 3: Crear iconos desde cero

Si no tienes un logo o quieres crear uno nuevo:

1. Ve a **Figma**, **Canva** o cualquier editor de diseño
2. Crea un canvas de **512x512 píxeles**
3. Diseña tu icono con:
   - Fondo de color (#4F46E5 - color de tu app)
   - Letra "V" o "VT" centrada
   - Diseño simple y reconocible
4. Exporta en 512x512 y 192x192

## Opción 4: Usar un placeholder temporal

Si quieres probar la PWA rápidamente, puedes generar iconos de colores sólidos:

```bash
cd /home/black/Documentos/vtickets/static/icons

# Icono 192x192 con color #4F46E5 (índigo)
convert -size 192x192 xc:"#4F46E5" -font DejaVu-Sans -pointsize 80 -fill white -gravity center -annotate +0+0 "VT" icon-192x192.png

# Icono 512x512
convert -size 512x512 xc:"#4F46E5" -font DejaVu-Sans -pointsize 200 -fill white -gravity center -annotate +0+0 "VT" icon-512x512.png
```

## Verificar los iconos

Una vez creados, verifica que existan:

```bash
ls -lh /home/black/Documentos/vtickets/static/icons/
# Deberías ver:
# icon-192x192.png
# icon-512x512.png
```

## Características recomendadas para los iconos

✅ **Formato**: PNG (con transparencia o fondo sólido)  
✅ **Tamaño exacto**: 192x192 y 512x512 píxeles  
✅ **Diseño**: Simple, reconocible, sin texto pequeño  
✅ **Colores**: Usar los colores de tu marca (#4F46E5 índigo)  
✅ **Forma**: Cuadrada (Android recorta automáticamente en círculo si es necesario)

## ¿Qué pasa después?

Una vez que tengas los iconos en `/static/icons/`, la PWA estará lista para:

1. Instalarse en dispositivos móviles (Android/iOS)
2. Aparecer en la pantalla de inicio con tu icono
3. Funcionar en modo offline
4. Mostrar tu logo en la splash screen

## ¿Necesitas ayuda?

- Si tienes problemas con ImageMagick, avísame
- Si prefieres que te genere un SVG simple para convertir, puedo hacerlo
- Si quieres usar un servicio online, prueba: https://realfavicongenerator.net/
