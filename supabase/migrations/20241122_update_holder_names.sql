-- Migración: Actualizar holder_name en tickets existentes
-- Fecha: 2024-11-22
-- Descripción: Actualiza el campo holder_name con el nombre completo del comprador
--              obtenido desde la tabla profiles usando el buyer_id de la orden

-- Paso 1: Ver cuántos tickets necesitan actualización
SELECT 
  COUNT(*) as tickets_sin_nombre,
  COUNT(DISTINCT o.buyer_id) as compradores_unicos
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.holder_name IS NULL 
  AND o.buyer_id IS NOT NULL;

-- Paso 2: Actualizar tickets con el nombre del comprador
UPDATE tickets t
SET 
  holder_name = CONCAT(p.first_name, ' ', p.last_name),
  updated_at = NOW()
FROM orders o
JOIN profiles p ON o.buyer_id = p.id
WHERE t.order_id = o.id
  AND t.holder_name IS NULL
  AND o.buyer_id IS NOT NULL
  AND p.first_name IS NOT NULL
  AND p.last_name IS NOT NULL;

-- Paso 3: Verificar resultados
SELECT 
  'Tickets actualizados' as status,
  COUNT(*) as cantidad
FROM tickets 
WHERE holder_name IS NOT NULL

UNION ALL

SELECT 
  'Tickets sin nombre' as status,
  COUNT(*) as cantidad
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.holder_name IS NULL 
  AND o.buyer_id IS NOT NULL;

-- Paso 4: Ver ejemplos de tickets actualizados
SELECT 
  t.ticket_code,
  t.holder_name,
  t.holder_email,
  tt.name as tipo_entrada,
  e.title as evento
FROM tickets t
JOIN ticket_types tt ON t.ticket_type_id = tt.id
JOIN events e ON t.event_id = e.id
WHERE t.holder_name IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;
