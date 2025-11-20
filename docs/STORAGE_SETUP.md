# 📸 Sistema de Storage para Imágenes de Eventos

## Configuración Actual

### Bucket Creado: `event-images`

**Características:**
- ✅ **Público**: Las imágenes son accesibles sin autenticación
- 📏 **Límite de tamaño**: 5MB por archivo
- 🎨 **Formatos permitidos**: JPEG, JPG, PNG, WebP
- 🔒 **Políticas de seguridad**: RLS habilitado

## Políticas de Seguridad (RLS)

### 1. Public Access (SELECT)
```sql
-- Cualquiera puede VER las imágenes
✅ Lectura pública de todas las imágenes del bucket
```

### 2. Authenticated Upload (INSERT)
```sql
-- Solo usuarios autenticados pueden SUBIR imágenes
✅ Requiere auth.role() = 'authenticated'
```

### 3. Own Images Update (UPDATE)
```sql
-- Los usuarios solo pueden ACTUALIZAR sus propias imágenes
✅ Valida que el userId coincida con la carpeta
📁 Estructura: userId/eventId/imagen.jpg
```

### 4. Own Images Delete (DELETE)
```sql
-- Los usuarios solo pueden ELIMINAR sus propias imágenes
✅ Misma validación que UPDATE
```

## Estructura de Carpetas

```
event-images/
├── {userId}/
│   ├── {eventId}/
│   │   ├── 1234567890-abc123.jpg
│   │   └── 1234567891-def456.webp
│   └── temp/
│       └── preview-xyz789.png
```

**Ventajas:**
- Organización por usuario y evento
- Fácil identificar el propietario
- Facilita la limpieza de imágenes huérfanas
- RLS automático por carpetas

## Uso en el Código

### Helper Functions (`/src/lib/utils/storage.ts`)

#### 1. Subir Imagen
```typescript
import { uploadEventImage } from '$lib/utils/storage';

const result = await uploadEventImage(
  imageFile,      // File object del input
  user.id,        // UUID del usuario
  event.id        // UUID del evento (opcional)
);

if ('error' in result) {
  console.error(result.error);
} else {
  console.log('URL:', result.url);
  console.log('Path:', result.path);
  // Guardar result.path en la base de datos
}
```

#### 2. Eliminar Imagen
```typescript
import { deleteEventImage } from '$lib/utils/storage';

const result = await deleteEventImage(
  'userId/eventId/imagen.jpg',  // Path guardado en DB
  supabase                       // Cliente de Supabase
);

if (!result.success) {
  console.error(result.error);
}
```

#### 3. Actualizar Imagen
```typescript
import { updateEventImage } from '$lib/utils/storage';

// Elimina la anterior y sube la nueva automáticamente
const result = await updateEventImage(
  oldImagePath,   // Path de la imagen anterior
  newImageFile,   // Nuevo archivo
  user.id,
  event.id,
  supabase
);
```

#### 4. Obtener URL Pública
```typescript
import { getEventImageUrl } from '$lib/utils/storage';

const publicUrl = getEventImageUrl('userId/eventId/imagen.jpg');
// https://xxxxx.supabase.co/storage/v1/object/public/event-images/userId/eventId/imagen.jpg
```

## Ejemplo en Formulario

### En +page.svelte (Crear Evento)
```svelte
<script lang="ts">
  import { uploadEventImage } from '$lib/utils/storage';
  
  let imageFile: File | null = $state(null);
  let imagePreview: string | null = $state(null);
  let isUploading = $state(false);
  
  function handleImageChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      imageFile = target.files[0];
      imagePreview = URL.createObjectURL(imageFile);
    }
  }
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!imageFile) return;
    
    isUploading = true;
    
    // Subir imagen
    const uploadResult = await uploadEventImage(
      imageFile,
      user.id
    );
    
    if ('error' in uploadResult) {
      toast.error(uploadResult.error);
      isUploading = false;
      return;
    }
    
    // Crear evento con la URL de la imagen
    const formData = new FormData();
    formData.append('image_url', uploadResult.url);
    formData.append('image_path', uploadResult.path); // Guardar path para futuras eliminaciones
    // ... otros campos
    
    await fetch('/api/events', {
      method: 'POST',
      body: formData
    });
    
    isUploading = false;
  }
</script>

<form onsubmit={handleSubmit}>
  <input 
    type="file" 
    accept="image/*"
    onchange={handleImageChange}
  />
  
  {#if imagePreview}
    <img src={imagePreview} alt="Preview" />
  {/if}
  
  <button disabled={isUploading}>
    {isUploading ? 'Subiendo...' : 'Crear Evento'}
  </button>
</form>
```

## Validaciones Implementadas

### En el Helper (`storage.ts`)
- ✅ Tipo de archivo (solo imágenes)
- ✅ Tamaño máximo (5MB)
- ✅ Nombres únicos (timestamp + random)
- ✅ Manejo de errores
- ✅ Cache control (1 hora)

### En Supabase (RLS)
- ✅ Solo usuarios autenticados pueden subir
- ✅ Solo el propietario puede eliminar/actualizar
- ✅ Acceso público de lectura

## Migración Aplicada

```sql
-- Archivo: supabase/migrations/create_event_images_storage.sql
✅ Bucket creado
✅ 4 políticas de RLS configuradas
✅ Límites y tipos MIME establecidos
```

## Próximos Pasos

1. **Formulario de Crear Evento** - Usar `uploadEventImage()`
2. **Formulario de Editar Evento** - Usar `updateEventImage()`
3. **Eliminar Evento** - Usar `deleteEventImage()` antes de borrar el evento
4. **Optimización de Imágenes** - Considerar resize automático en el futuro

## URLs de Ejemplo

```
Desarrollo:
https://abcdefghijk.supabase.co/storage/v1/object/public/event-images/user-id/event-id/imagen.jpg

Producción:
https://tu-proyecto.supabase.co/storage/v1/object/public/event-images/user-id/event-id/imagen.jpg
```

## Notas Importantes

⚠️ **Guardar siempre el `path` en la base de datos** junto con la `url`
- El `path` se necesita para eliminar la imagen posteriormente
- La `url` es para mostrarla en el frontend

⚠️ **Limpieza de imágenes huérfanas**
- Si eliminas un evento, recuerda eliminar su imagen del storage
- Considera un cron job para limpiar imágenes sin evento asociado

✅ **Ya está todo listo para usar**
- Migración aplicada ✓
- Helper functions creadas ✓
- Políticas de seguridad configuradas ✓
