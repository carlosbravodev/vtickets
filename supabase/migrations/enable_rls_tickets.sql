-- Habilitar RLS en la tabla tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política: Permitir insertar tickets desde el servidor (webhook)
-- Service role tiene acceso completo sin restricciones RLS
CREATE POLICY "Service role can insert tickets"
ON tickets
FOR INSERT
TO service_role
WITH CHECK (true);

-- Política: Los usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view their own tickets"
ON tickets
FOR SELECT
USING (
  holder_email = auth.jwt() ->> 'email'
  OR
  order_id IN (
    SELECT id FROM orders WHERE buyer_id = auth.uid()
  )
);

-- Política: El personal puede ver todos los tickets (para validación)
-- Esto lo habilitaremos más adelante cuando creemos la tabla staff_users
-- CREATE POLICY "Staff can view all tickets"
-- ON tickets
-- FOR SELECT
-- USING (
--   auth.uid() IN (SELECT id FROM staff_users WHERE can_scan = true)
-- );

-- Política: El personal puede actualizar tickets (marcar como usado)
-- Esto lo habilitaremos más adelante
-- CREATE POLICY "Staff can update tickets"
-- ON tickets
-- FOR UPDATE
-- USING (
--   auth.uid() IN (SELECT id FROM staff_users WHERE can_scan = true)
-- );

COMMENT ON POLICY "Service role can insert tickets" ON tickets IS 
  'Permite al webhook crear tickets usando la service role key';

COMMENT ON POLICY "Users can view their own tickets" ON tickets IS 
  'Los usuarios pueden ver los tickets asociados a su email o sus órdenes';
