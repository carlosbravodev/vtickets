-- Triggers para actualizar automáticamente sold_tickets y available_tickets
-- Se ejecuta cuando se crean, cancelan o reembolsan tickets

-- Función para actualizar contadores cuando se vende un ticket
CREATE OR REPLACE FUNCTION update_ticket_type_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el ticket está activo (venta nueva)
  IF NEW.status = 'active' THEN
    UPDATE ticket_types
    SET 
      sold_tickets = sold_tickets + 1,
      available_tickets = available_tickets - 1
    WHERE id = NEW.ticket_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar contadores cuando cambia el estado del ticket
CREATE OR REPLACE FUNCTION update_ticket_type_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambia de active a cancelled/refunded, revertir
  IF OLD.status = 'active' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE ticket_types
    SET 
      sold_tickets = sold_tickets - 1,
      available_tickets = available_tickets + 1
    WHERE id = OLD.ticket_type_id;
  
  -- Si cambia de cancelled/refunded a active, incrementar
  ELSIF OLD.status IN ('cancelled', 'refunded') AND NEW.status = 'active' THEN
    UPDATE ticket_types
    SET 
      sold_tickets = sold_tickets + 1,
      available_tickets = available_tickets - 1
    WHERE id = NEW.ticket_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para revertir cuando se elimina un ticket
CREATE OR REPLACE FUNCTION update_ticket_type_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo revertir si el ticket estaba activo
  IF OLD.status = 'active' THEN
    UPDATE ticket_types
    SET 
      sold_tickets = sold_tickets - 1,
      available_tickets = available_tickets + 1
    WHERE id = OLD.ticket_type_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_ticket_sale ON tickets;
CREATE TRIGGER trigger_ticket_sale
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_type_on_sale();

DROP TRIGGER IF EXISTS trigger_ticket_status_change ON tickets;
CREATE TRIGGER trigger_ticket_status_change
  AFTER UPDATE OF status ON tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_ticket_type_on_status_change();

DROP TRIGGER IF EXISTS trigger_ticket_delete ON tickets;
CREATE TRIGGER trigger_ticket_delete
  BEFORE DELETE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_type_on_delete();

-- Actualizar contadores para datos existentes
UPDATE ticket_types tt
SET sold_tickets = (
  SELECT COUNT(*)
  FROM tickets t
  WHERE t.ticket_type_id = tt.id
    AND t.status = 'active'
);

UPDATE ticket_types tt
SET available_tickets = initial_quantity - sold_tickets;
