-- Crear tabla de historial de verificaciones
-- Esta tabla registra cada intento de verificación (exitoso o fallido)
-- Útil para auditoría, detección de fraudes y sincronización offline

CREATE TABLE IF NOT EXISTS ticket_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Información de la verificación
  verification_status VARCHAR(20) NOT NULL CHECK (
    verification_status IN ('success', 'already_verified', 'invalid_ticket', 'wrong_event', 'cancelled_ticket', 'error')
  ),
  
  -- Metadata del dispositivo (para tracking y debug)
  device_info JSONB DEFAULT '{}'::jsonb,
  -- Ejemplo: {"user_agent": "...", "platform": "iOS", "app_version": "1.0.0"}
  
  -- Control de sincronización offline
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (
    sync_status IN ('pending', 'synced', 'failed')
  ),
  synced_at TIMESTAMPTZ,
  
  -- Ubicación de verificación (opcional)
  entry_gate VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_verifications_ticket 
  ON ticket_verifications(ticket_id);

CREATE INDEX IF NOT EXISTS idx_verifications_event 
  ON ticket_verifications(event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verifications_verified_by 
  ON ticket_verifications(verified_by);

CREATE INDEX IF NOT EXISTS idx_verifications_sync_status 
  ON ticket_verifications(sync_status) WHERE sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_verifications_status 
  ON ticket_verifications(verification_status);

-- RLS (Row Level Security)
ALTER TABLE ticket_verifications ENABLE ROW LEVEL SECURITY;

-- Política: Solo el organizador del evento puede ver las verificaciones
CREATE POLICY "Organizadores pueden ver verificaciones de sus eventos"
  ON ticket_verifications
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Política: Solo usuarios autenticados pueden crear verificaciones
CREATE POLICY "Usuarios autenticados pueden crear verificaciones"
  ON ticket_verifications
  FOR INSERT
  WITH CHECK (
    verified_by = auth.uid()
    AND event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Política: Solo el creador puede actualizar (para sync)
CREATE POLICY "Solo el verificador puede actualizar sync status"
  ON ticket_verifications
  FOR UPDATE
  USING (verified_by = auth.uid())
  WITH CHECK (verified_by = auth.uid());

-- Comentarios
COMMENT ON TABLE ticket_verifications IS 'Historial completo de todas las verificaciones de tickets (éxito y fallos)';
COMMENT ON COLUMN ticket_verifications.verification_status IS 'Resultado de la verificación: success, already_verified, invalid_ticket, etc.';
COMMENT ON COLUMN ticket_verifications.device_info IS 'Información del dispositivo usado para verificar (JSON)';
COMMENT ON COLUMN ticket_verifications.sync_status IS 'Estado de sincronización para verificaciones offline';
