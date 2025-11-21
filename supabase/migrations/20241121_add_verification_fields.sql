-- Agregar campos de verificación a la tabla tickets
-- Estos campos complementan los existentes (scanned_at, scanned_by, entry_gate)

ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Crear índice compuesto para búsquedas de tickets verificados por evento
CREATE INDEX IF NOT EXISTS idx_tickets_event_verified 
  ON tickets(event_id, verified);

-- Crear índice para búsquedas por verificador
CREATE INDEX IF NOT EXISTS idx_tickets_verified_by 
  ON tickets(verified_by) WHERE verified = TRUE;

-- Comentarios para documentación
COMMENT ON COLUMN tickets.verified IS 'Indica si el ticket ha sido verificado en la entrada del evento';
COMMENT ON COLUMN tickets.verified_at IS 'Timestamp de la primera verificación del ticket';
COMMENT ON COLUMN tickets.verified_by IS 'Usuario que realizó la verificación (organizador o staff)';
