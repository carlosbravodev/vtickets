-- Vista materializada para estadísticas de eventos
-- Esta vista cachea las estadísticas para mejorar el rendimiento del dashboard

CREATE MATERIALIZED VIEW IF NOT EXISTS event_statistics AS
SELECT 
  e.id AS event_id,
  e.title,
  e.slug,
  e.event_date,
  e.venue,
  e.location,
  e.total_tickets,
  e.created_by,
  
  -- Total de tickets vendidos (suma de sold_tickets)
  COALESCE(SUM(tt.sold_tickets), 0)::integer AS total_tickets_sold,
  
  -- Total de tickets disponibles (suma de available_tickets)
  COALESCE(SUM(tt.available_tickets), 0)::integer AS total_tickets_available,
  
  -- Porcentaje de ocupación
  CASE 
    WHEN e.total_tickets > 0 THEN 
      (COALESCE(SUM(tt.sold_tickets), 0)::numeric / e.total_tickets * 100)::numeric(5,2)
    ELSE 0
  END AS occupancy_percentage,
  
  -- Ingresos totales (solo de órdenes pagadas)
  COALESCE(
    (SELECT SUM(o.total_price)
     FROM orders o
     WHERE o.event_id = e.id 
       AND o.payment_status = 'paid'),
    0
  )::numeric(10,2) AS total_revenue,
  
  -- Número de órdenes
  COALESCE(
    (SELECT COUNT(*)
     FROM orders o
     WHERE o.event_id = e.id),
    0
  )::integer AS total_orders,
  
  -- Número de compradores únicos
  COALESCE(
    (SELECT COUNT(DISTINCT buyer_id)
     FROM orders o
     WHERE o.event_id = e.id
       AND o.payment_status = 'paid'),
    0
  )::integer AS unique_buyers,
  
  -- Precio promedio por ticket
  CASE 
    WHEN COALESCE(SUM(tt.sold_tickets), 0) > 0 THEN
      COALESCE(
        (SELECT SUM(o.total_price)
         FROM orders o
         WHERE o.event_id = e.id 
           AND o.payment_status = 'paid'),
        0
      ) / COALESCE(SUM(tt.sold_tickets), 1)
    ELSE 0
  END::numeric(10,2) AS avg_ticket_price,
  
  -- Última actualización
  NOW() AS last_updated

FROM events e
LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_active = true
GROUP BY e.id, e.title, e.slug, e.event_date, e.venue, e.location, e.total_tickets, e.created_by;

-- Índice único en event_id para refrescos eficientes
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_statistics_event_id 
  ON event_statistics(event_id);

-- Índice en created_by para consultas por organizador
CREATE INDEX IF NOT EXISTS idx_event_statistics_created_by 
  ON event_statistics(created_by);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_event_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY event_statistics;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refrescar automáticamente cuando cambian datos relevantes
-- Nota: Las vistas materializadas no soportan triggers directamente,
-- pero podemos usar una función que se llame desde los triggers de las tablas base

CREATE OR REPLACE FUNCTION queue_stats_refresh()
RETURNS trigger AS $$
BEGIN
  -- Esta función podría enviar una notificación o registrar que necesita refresh
  -- Por ahora solo marca que hubo cambios
  PERFORM pg_notify('event_stats_changed', NEW.event_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en ticket_types cuando cambian sold_tickets
DROP TRIGGER IF EXISTS trigger_stats_on_ticket_types ON ticket_types;
CREATE TRIGGER trigger_stats_on_ticket_types
  AFTER INSERT OR UPDATE OR DELETE ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION queue_stats_refresh();

-- Trigger en orders cuando cambian pagos
DROP TRIGGER IF EXISTS trigger_stats_on_orders ON orders;
CREATE TRIGGER trigger_stats_on_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_stats_refresh();

-- Comentarios para documentación
COMMENT ON MATERIALIZED VIEW event_statistics IS 
  'Vista materializada que cachea estadísticas de eventos para mejorar el rendimiento del dashboard. 
   Se debe refrescar periódicamente o cuando cambien datos relevantes.';

COMMENT ON FUNCTION refresh_event_statistics() IS 
  'Refresca la vista materializada de estadísticas de eventos de forma concurrente (sin bloquear lecturas).';
