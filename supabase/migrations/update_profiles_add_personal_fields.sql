-- Migración para actualizar la tabla profiles con campos personales adicionales
-- Separar nombre y apellido, y agregar más datos personales

-- Renombrar columna 'name' a 'first_name' para ser más claro
ALTER TABLE profiles RENAME COLUMN name TO first_name;

-- Renombrar 'sname' a 'last_name' para mayor claridad
ALTER TABLE profiles RENAME COLUMN sname TO last_name;

-- Agregar nuevos campos para información personal
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('cedula', 'pasaporte', 'ruc'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Ecuador';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN profiles.first_name IS 'Primer nombre del usuario';
COMMENT ON COLUMN profiles.last_name IS 'Apellido(s) del usuario';
COMMENT ON COLUMN profiles.birth_date IS 'Fecha de nacimiento';
COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento: cedula, pasaporte, o ruc';
COMMENT ON COLUMN profiles.document_number IS 'Número de documento de identidad';
COMMENT ON COLUMN profiles.address IS 'Dirección completa';
COMMENT ON COLUMN profiles.city IS 'Ciudad de residencia';
COMMENT ON COLUMN profiles.country IS 'País de residencia';
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario';

-- Crear índice para búsquedas por documento
CREATE INDEX IF NOT EXISTS profiles_document_number_idx ON profiles(document_number);

-- Nota: La columna 'ci' existente se mantiene por compatibilidad
-- pero ahora tenemos 'document_type' y 'document_number' para más flexibilidad
COMMENT ON COLUMN profiles.ci IS 'Cédula de Identidad - Ecuador (LEGACY - usar document_number)';
