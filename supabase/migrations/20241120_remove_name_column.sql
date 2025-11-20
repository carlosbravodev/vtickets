-- Eliminar la columna 'name' de la tabla events
-- Ya que estamos usando 'title' como campo principal

ALTER TABLE events DROP COLUMN IF EXISTS name;
