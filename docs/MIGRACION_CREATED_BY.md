# 🔧 Aplicar Migración: add_created_by_to_events

## Opción 1: Usando Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard: https://hgedsumfzmwfswqwyqan.supabase.co
2. Click en **SQL Editor** (barra lateral izquierda)
3. Click en **New Query**
4. Copia y pega todo el contenido de: `supabase/migrations/add_created_by_to_events.sql`
5. Click en **Run** (o presiona Ctrl+Enter)
6. Verifica que aparezca: "Success. No rows returned"

## Opción 2: Usando Supabase CLI (si lo tienes instalado)

```bash
# Asegúrate de estar en la raíz del proyecto
cd /home/black/Documentos/vtickets

# Ejecutar la migración
supabase db push
```

## ✅ Verificación

Después de ejecutar la migración, verifica que se aplicó correctamente:

```sql
-- En SQL Editor, ejecuta:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'created_by';

-- Deberías ver:
-- column_name | data_type
-- created_by  | uuid
```

## 📋 Políticas RLS Creadas

La migración crea las siguientes políticas:

1. ✅ **SELECT**: Todos pueden ver eventos (público)
2. ✅ **INSERT**: Solo organizadores autenticados pueden crear
3. ✅ **UPDATE**: Solo el creador puede editar sus eventos
4. ✅ **DELETE**: Solo el creador puede eliminar sus eventos

## ⚠️ Nota sobre Eventos Existentes

Si tienes eventos existentes en la BD, el campo `created_by` será NULL. 
Puedes asignarlos a un organizador específico ejecutando:

```sql
-- Reemplaza 'uuid-del-organizador' con el UUID real de un usuario
UPDATE public.events 
SET created_by = 'uuid-del-organizador' 
WHERE created_by IS NULL;
```

## 🚀 Siguiente Paso

Una vez aplicada la migración, continúa con:
- Crear la ruta `/organizador/eventos`
- Implementar el listado de eventos del organizador
