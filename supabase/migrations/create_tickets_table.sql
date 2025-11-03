-- Crear tabla de tickets individuales
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores únicos
  ticket_code VARCHAR(32) UNIQUE NOT NULL,
  qr_token TEXT NOT NULL,
  qr_hash VARCHAR(64) UNIQUE NOT NULL,
  
  -- Referencias
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  event_id UUID NOT NULL REFERENCES events(id),
  
  -- Información del portador
  holder_name VARCHAR(255),
  holder_email VARCHAR(255),
  
  -- Control de acceso
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'refunded')),
  scanned_at TIMESTAMP,
  scanned_by UUID REFERENCES auth.users(id),
  entry_gate VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_qr_hash ON tickets(qr_hash);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);

-- Comentarios
COMMENT ON TABLE tickets IS 'Tickets individuales con QR único para cada entrada';
COMMENT ON COLUMN tickets.ticket_code IS 'Código alfanumérico visible (ej: GYE2024-VIP-A7X9K2)';
COMMENT ON COLUMN tickets.qr_token IS 'JWT firmado que se codifica en el QR';
COMMENT ON COLUMN tickets.qr_hash IS 'SHA256 hash del JWT para validación rápida';
COMMENT ON COLUMN tickets.status IS 'Estado del ticket: active, used, cancelled, refunded';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();
