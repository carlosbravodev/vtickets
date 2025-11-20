-- Trigger para actualizar automáticamente total_tickets en events
-- Se ejecuta cuando se insertan, actualizan o eliminan ticket_types

-- Función para calcular y actualizar total_tickets
CREATE OR REPLACE FUNCTION update_event_total_tickets()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar total_tickets del evento
  UPDATE events
  SET total_tickets = (
    SELECT COALESCE(SUM(initial_quantity), 0)
    FROM ticket_types
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT
DROP TRIGGER IF EXISTS trigger_update_total_tickets_insert ON ticket_types;
CREATE TRIGGER trigger_update_total_tickets_insert
  AFTER INSERT ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_event_total_tickets();

-- Crear trigger para UPDATE
DROP TRIGGER IF EXISTS trigger_update_total_tickets_update ON ticket_types;
CREATE TRIGGER trigger_update_total_tickets_update
  AFTER UPDATE OF initial_quantity ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_event_total_tickets();

-- Crear trigger para DELETE
DROP TRIGGER IF EXISTS trigger_update_total_tickets_delete ON ticket_types;
CREATE TRIGGER trigger_update_total_tickets_delete
  AFTER DELETE ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_event_total_tickets();

-- Actualizar total_tickets para eventos existentes
UPDATE events e
SET total_tickets = (
  SELECT COALESCE(SUM(initial_quantity), 0)
  FROM ticket_types tt
  WHERE tt.event_id = e.id
);
