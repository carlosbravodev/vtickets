-- Agregar columna order_number para mostrar el número de orden de Lemon Squeezy
ALTER TABLE orders 
ADD COLUMN order_number INTEGER;

-- Agregar comentario para claridad
COMMENT ON COLUMN orders.order_number IS 'Número secuencial de orden de Lemon Squeezy (ej: 2362079) - el que ve el usuario en emails';
COMMENT ON COLUMN orders.lemon_squeezy_order_id IS 'ID interno de Lemon Squeezy (ej: 6738298) - solo para referencia interna';
