# Sistema de Optimización de Imágenes

## Descripción General

Sistema completo de optimización de imágenes para VTickets que incluye compresión client-side, transformaciones server-side y lazy loading.

## Características

### 1. **Compresión Client-Side**
Antes de subir imágenes al servidor, se comprimen automáticamente en el navegador:

- **Formato**: Conversión automática a WebP
- **Tamaño máximo**: 1920x1080px (mantiene aspecto original)
- **Calidad**: 85% (balance entre tamaño y calidad)
- **Reducción promedio**: 60-80% del tamaño original

### 2. **Transformaciones Server-Side**
Supabase Storage aplica transformaciones dinámicas mediante parámetros URL:

```typescript
optimizeSupabaseImage(url, {
  width: 800,        // Ancho deseado
  height: 600,       // Alto deseado (opcional)
  quality: 80,       // Calidad (0-100)
  format: 'webp',    // Formato de salida
  resize: 'cover'    // Tipo de redimensionado
})
```

### 3. **Lazy Loading**
Las imágenes se cargan solo cuando están a punto de ser visibles:

```svelte
<img loading="lazy" ... />
```

### 4. **Imágenes Responsivas**
Srcset automático para diferentes tamaños de pantalla:

```typescript
generateResponsiveSrcSet(url, [400, 800, 1200, 1920])
// Genera: "url?width=400 400w, url?width=800 800w, ..."
```

## Funciones Disponibles

### `compressImage(file, options)`
Comprime una imagen en el cliente antes de subirla.

**Parámetros:**
- `file`: Archivo de imagen original
- `options`:
  - `maxWidth`: Ancho máximo (default: 1920)
  - `maxHeight`: Alto máximo (default: 1080)
  - `quality`: Calidad de compresión (default: 0.85)
  - `targetFormat`: Formato de salida (default: 'webp')

**Retorna:** Promise<File> con imagen comprimida

**Ejemplo:**
```typescript
const compressed = await compressImage(file, {
  maxWidth: 1920,
  quality: 0.85,
  targetFormat: 'webp'
});
```

### `optimizeSupabaseImage(url, options)`
Genera URL optimizada con transformaciones de Supabase.

**Parámetros:**
- `url`: URL original de Supabase Storage
- `options`:
  - `width`: Ancho deseado
  - `height`: Alto deseado
  - `quality`: Calidad (0-100)
  - `format`: 'webp' | 'avif' | 'jpg'
  - `resize`: 'cover' | 'contain' | 'fill'

**Ejemplo:**
```typescript
const optimized = optimizeSupabaseImage(imageUrl, {
  width: 800,
  quality: 80,
  format: 'webp'
});
```

### `validateImageFile(file, maxSizeMB)`
Valida tipo y tamaño de archivo antes de procesar.

**Retorna:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

### `generateResponsiveSrcSet(url, sizes)`
Genera srcset para imágenes responsivas.

**Ejemplo:**
```typescript
const srcset = generateResponsiveSrcSet(url, [400, 800, 1200]);
// "url?width=400 400w, url?width=800 800w, url?width=1200 1200w"
```

## Componente OptimizedImage

Componente reutilizable con optimización automática:

```svelte
<OptimizedImage
  src={event.image_url}
  alt="Nombre del evento"
  width={800}
  height={600}
  quality={85}
  loading="lazy"
  responsive={true}
  placeholder={true}
/>
```

**Props:**
- `src`: URL de la imagen
- `alt`: Texto alternativo
- `width`: Ancho deseado (default: 800)
- `height`: Alto deseado (opcional)
- `quality`: Calidad (default: 80)
- `class`: Clases CSS adicionales
- `loading`: 'lazy' | 'eager' (default: 'lazy')
- `responsive`: Genera srcset (default: true)
- `sizes`: Media queries para srcset
- `placeholder`: Mostrar placeholder animado (default: true)

## Uso en la Aplicación

### Al Subir Imágenes (Crear Evento)

```typescript
async function handleImageChange(e: Event) {
  const file = e.target.files[0];
  
  // 1. Validar
  const validation = validateImageFile(file, 5);
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }
  
  // 2. Comprimir
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    quality: 0.85,
    targetFormat: 'webp'
  });
  
  // 3. Guardar
  eventData.image = compressed;
}
```

### Al Mostrar Imágenes

#### Tarjetas de Eventos (Lista)
```svelte
<img
  src={optimizeSupabaseImage(event.image_url, { width: 600, quality: 85 })}
  alt={event.title}
  loading="lazy"
/>
```

#### Detalle de Evento (Hero)
```svelte
<img
  src={optimizeSupabaseImage(event.image_url, { width: 1920, quality: 90 })}
  alt={event.title}
/>
```

#### Thumbnails (Tickets, Órdenes)
```svelte
<img
  src={optimizeSupabaseImage(event.image_url, { width: 200, height: 200 })}
  alt={event.title}
  loading="lazy"
/>
```

## Guía de Tamaños Recomendados

| Contexto | Ancho | Calidad | Formato |
|----------|-------|---------|---------|
| Hero principal | 1920px | 90% | WebP |
| Detalle evento | 1200px | 90% | WebP |
| Tarjetas lista | 600px | 85% | WebP |
| Dashboard organizador | 400px | 80% | WebP |
| Thumbnails | 200px | 80% | WebP |
| Tickets impresión | 800px | 85% | WebP |

## Beneficios

1. **Rendimiento**
   - Reducción 60-80% en tamaño de archivos
   - Carga más rápida de páginas
   - Menos uso de datos móviles

2. **Escalabilidad**
   - Storage optimizado en Supabase
   - CDN cache más eficiente
   - Soporta miles de eventos

3. **Experiencia de Usuario**
   - Carga progresiva con placeholders
   - Imágenes adaptadas al dispositivo
   - Feedback visual durante compresión

4. **SEO**
   - Core Web Vitals mejorados
   - LCP (Largest Contentful Paint) optimizado
   - Imágenes con lazy loading

## Monitoreo

Durante la compresión se muestra información al usuario:

```
"Imagen optimizada: 4.2MB → 0.8MB (81% reducido)"
```

Esto permite transparencia y confianza en el proceso.

## Compatibilidad

- **WebP**: Soportado por todos los navegadores modernos
- **Fallback**: Si Supabase no puede transformar, retorna original
- **Progressive Enhancement**: Si JS falla, imagen original se carga

## Próximas Mejoras

1. **AVIF Support**: Formato más eficiente que WebP
2. **Blur Hash**: Placeholders con preview de imagen
3. **Thumbnail Generation**: Pre-generar tamaños comunes
4. **CDN Custom**: Implementar Cloudflare Images si escala
