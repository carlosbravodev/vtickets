-- Optimización de índices para verificación de tickets
-- Mejora performance de escaneo en eventos masivos

-- Índice compuesto para lookup de verificación ultra-rápido
-- Incluye columnas más consultadas para crear covering index (INCLUDE = covering index)
-- Permite Index Only Scan sin tocar la tabla principal
CREATE INDEX IF NOT EXISTS idx_tickets_verification_lookup 
  ON tickets(id, event_id, verified, status)
  INCLUDE (holder_name, holder_email, ticket_type_id, ticket_code);

-- Índice para stats en tiempo real optimizado
-- WHERE clause reduce tamaño del índice (solo tickets activos/usados = índice parcial)
-- Más rápido y ocupa menos espacio que un índice completo
CREATE INDEX IF NOT EXISTS idx_tickets_event_stats 
  ON tickets(event_id, status, verified)
  WHERE status IN ('active', 'used');

-- Comentarios para documentación
COMMENT ON INDEX idx_tickets_verification_lookup IS 
  'Covering index para verificación rápida de tickets. Optimiza query de validación con filtro event_id.';

COMMENT ON INDEX idx_tickets_event_stats IS 
  'Índice parcial para cálculo de estadísticas en tiempo real. Solo indexa tickets relevantes.';
