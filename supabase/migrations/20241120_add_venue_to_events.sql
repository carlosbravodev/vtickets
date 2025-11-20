-- Agregar columna 'venue' para el nombre del lugar/establecimiento del evento
-- location = ciudad (ej: "Guayaquil", "Quito")
-- venue = nombre del lugar (ej: "Estadio Monumental", "Teatro Nacional", "Centro de Convenciones")

ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;

COMMENT ON COLUMN events.venue IS 'Nombre del lugar, establecimiento o recinto donde se realiza el evento (ej: Estadio, Teatro, Centro de Convenciones)';
COMMENT ON COLUMN events.location IS 'Ciudad donde se realiza el evento';
