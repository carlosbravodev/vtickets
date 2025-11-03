-- TEMPORAL: Deshabilitar RLS para pruebas
-- ⚠️ Esto hace que la tabla sea pública - solo para desarrollo local

ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Cuando encuentres la service_role key, ejecuta:
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- Y luego ejecuta el archivo enable_rls_tickets.sql
