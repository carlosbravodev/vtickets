# Quick Fix Guide - 34 Warnings VTickets

## TL;DR - Lo que necesitas saber

✅ **La app funciona perfectamente**  
⚠️ **34 warnings durante build (no errores)**  
🎯 **Impacto real: Bajo-Medio**

---

## 🚀 Arreglos Rápidos (5-10 minutos)

### 1. Botón sin aria-label
**Archivo**: `src/routes/organizador/eventos/[slug]/+page.svelte:66`

```svelte
// ANTES
<button onclick={() => goto('/organizador/eventos')} class="p-2">

// DESPUÉS  
<button 
  onclick={() => goto('/organizador/eventos')} 
  class="p-2"
  aria-label="Volver a eventos"
  title="Volver a eventos"
>
```

### 2. Labels sin inputs (4 fixes)
**Archivo**: `src/routes/organizador/eventos/[slug]/editar/+page.svelte`

Para cada label (líneas 378, 488, 501, 516):

```svelte
// ANTES
<label class="...">Imagen del evento</label>
<input type="file" accept="image/*" />

// DESPUÉS
<label for="event-image" class="...">Imagen del evento</label>
<input id="event-image" type="file" accept="image/*" />
```

---

## 📚 Refactorizaciones Svelte 5 (Medium Priority)

Cambiar de:
```svelte
const { event, user } = data;
```

A:
```svelte
const event = $derived(data.event);
const user = $derived(data.user);
```

### Archivos que necesitan refactor:
1. `src/routes/evento/[id]/+page.svelte` (1 warning)
2. `src/routes/exito/+page.svelte` (1 warning)
3. `src/routes/organizador/+page.svelte` (1 warning)
4. `src/routes/organizador/eventos/[slug]/+page.svelte` (2 warnings)
5. `src/routes/organizador/eventos/[slug]/editar/+page.svelte` (6 warnings)
6. `src/routes/organizador/verificar/+page.svelte` (1 warning)
7. `src/routes/organizador/verificar/[event_id]/+page.svelte` (4 warnings)
8. `src/routes/organizador/verificar/[event_id]/historial/+page.svelte` (3 warnings)

---

## 📊 Resumen Prioridades

| Prioridad | Count | Tiempo | Impacto |
|-----------|-------|--------|---------|
| 🔴 ALTA | 5 | 5 min | Accesibilidad |
| 🟡 MEDIA | 26 | 2 hrs | Best practices |
| 🟢 BAJA | 3 | 30 min | Bundling |

---

## 📋 Próximos Pasos

1. ✅ **Revisar** WARNINGS_ANALYSIS.md para detalles
2. 🛠️ **Arreglar** accesibilidad (5 min max)
3. 🔄 **Refactorizar** runes cuando tengas tiempo
4. 🧪 **Verificar**: `npm run build`

---

**Más info**: Ver `WARNINGS_ANALYSIS.md` para análisis completo

