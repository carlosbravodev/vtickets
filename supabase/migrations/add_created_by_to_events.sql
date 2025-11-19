-- Migración: Agregar campo created_by a events para vincular con organizadores
-- Fecha: 2024-11-18
-- Descripción: Permite que cada evento tenga un organizador asignado

-- PASO 1: Agregar columna created_by
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- PASO 2: Crear índice para búsquedas rápidas por organizador
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- PASO 3: Habilitar Row Level Security en la tabla events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- PASO 4: Política para SELECT - Todos pueden ver eventos (compradores)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
  ON public.events
  FOR SELECT
  USING (true); -- Todos los eventos son visibles públicamente

-- PASO 5: Política para INSERT - Solo usuarios autenticados pueden crear eventos
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = created_by); -- Solo pueden crear eventos asignándose como creadores

-- PASO 6: Política para UPDATE - Solo el creador puede editar sus eventos
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events"
  ON public.events
  FOR UPDATE
  USING (auth.uid() = created_by) -- Solo el creador puede actualizar
  WITH CHECK (auth.uid() = created_by); -- Y no puede cambiar el creador

-- PASO 7: Política para DELETE - Solo el creador puede eliminar sus eventos
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
CREATE POLICY "Users can delete their own events"
  ON public.events
  FOR DELETE
  USING (auth.uid() = created_by); -- Solo el creador puede eliminar

-- PASO 8: Comentarios descriptivos
COMMENT ON COLUMN public.events.created_by IS 'UUID del organizador que creó el evento. Referencia a auth.users(id).';

-- PASO 9: Actualizar eventos existentes (opcional - asignar a un usuario admin o dejar NULL)
-- Si tienes eventos existentes, puedes asignarlos a un usuario específico:
-- UPDATE public.events SET created_by = 'uuid-del-admin' WHERE created_by IS NULL;
