-- Índices para optimizar las consultas más frecuentes

-- Índices para la tabla tickets
CREATE INDEX IF NOT EXISTS idx_tickets_event_id_status 
  ON tickets(event_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id_status 
  ON tickets(ticket_type_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_order_id 
  ON tickets(order_id);

-- Índices para la tabla orders
CREATE INDEX IF NOT EXISTS idx_orders_event_id_payment_status 
  ON orders(event_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id 
  ON orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Índices para la tabla ticket_types
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id_is_active 
  ON ticket_types(event_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ticket_types_sales_dates 
  ON ticket_types(sales_start_date, sales_end_date)
  WHERE is_active = true;

-- Índices para la tabla events
CREATE INDEX IF NOT EXISTS idx_events_created_by 
  ON events(created_by);

CREATE INDEX IF NOT EXISTS idx_events_event_date_location 
  ON events(event_date, location);

CREATE INDEX IF NOT EXISTS idx_events_slug 
  ON events(slug);

-- Índice para búsquedas de texto en eventos
CREATE INDEX IF NOT EXISTS idx_events_title_trgm 
  ON events USING gin(title gin_trgm_ops);

-- Nota: Para el índice de texto necesitas la extensión pg_trgm
-- Si no está instalada, se puede omitir ese índice