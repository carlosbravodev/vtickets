-- Mejoras a la tabla ticket_types para mejor control y métricas
-- Fase 1: Agregar campos para tracking y control de ventas

-- Agregar campos para control de inventario
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS initial_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sold_tickets INTEGER NOT NULL DEFAULT 0;

-- Agregar campos para control de ventas
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sales_start_date TIMESTAMPTZ;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sales_end_date TIMESTAMPTZ;

-- Agregar descripción para el tipo de ticket
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS description TEXT;

-- Actualizar datos existentes: copiar available_tickets a initial_quantity
UPDATE ticket_types 
SET initial_quantity = available_tickets 
WHERE initial_quantity = 0;

-- Comentarios para documentación
COMMENT ON COLUMN ticket_types.initial_quantity IS 'Cantidad inicial de tickets configurada al crear el tipo';
COMMENT ON COLUMN ticket_types.sold_tickets IS 'Cantidad de tickets vendidos (se actualiza automáticamente vía trigger)';
COMMENT ON COLUMN ticket_types.is_active IS 'Si el tipo de ticket está disponible para venta';
COMMENT ON COLUMN ticket_types.sales_start_date IS 'Fecha y hora de inicio de ventas para este tipo de ticket';
COMMENT ON COLUMN ticket_types.sales_end_date IS 'Fecha y hora de fin de ventas para este tipo de ticket';
COMMENT ON COLUMN ticket_types.description IS 'Descripción detallada del tipo de ticket (beneficios, restricciones, etc.)';
