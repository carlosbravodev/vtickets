-- Políticas RLS para ticket_types
-- Permite a los organizadores gestionar los tipos de tickets de sus eventos

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "ticket_types_select_policy" ON ticket_types;
DROP POLICY IF EXISTS "ticket_types_insert_policy" ON ticket_types;
DROP POLICY IF EXISTS "ticket_types_update_policy" ON ticket_types;
DROP POLICY IF EXISTS "ticket_types_delete_policy" ON ticket_types;

-- SELECT: Cualquiera puede ver los tipos de tickets
CREATE POLICY "ticket_types_select_policy" 
ON ticket_types FOR SELECT 
TO authenticated 
USING (true);

-- INSERT: Los organizadores pueden crear tipos de tickets para sus propios eventos
CREATE POLICY "ticket_types_insert_policy" 
ON ticket_types FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.created_by = auth.uid()
  )
);

-- UPDATE: Los organizadores pueden actualizar tipos de tickets de sus propios eventos
CREATE POLICY "ticket_types_update_policy" 
ON ticket_types FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.created_by = auth.uid()
  )
);

-- DELETE: Los organizadores pueden eliminar tipos de tickets de sus propios eventos
CREATE POLICY "ticket_types_delete_policy" 
ON ticket_types FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.created_by = auth.uid()
  )
);
