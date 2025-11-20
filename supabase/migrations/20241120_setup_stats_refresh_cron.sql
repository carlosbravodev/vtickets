-- Configuración de pg_cron para refrescar automáticamente la vista materializada
-- Requiere la extensión pg_cron

-- Habilitar la extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Programar el refresh de la vista materializada cada 5 minutos
-- Si ya existe, primero hay que eliminarlo manualmente: SELECT cron.unschedule('refresh-event-statistics');
SELECT cron.schedule(
  'refresh-event-statistics',          -- Nombre del job
  '*/5 * * * *',                        -- Cada 5 minutos
  $$SELECT refresh_event_statistics();$$ -- Comando a ejecutar
);

-- Verificar que el job se creó correctamente
SELECT 
  jobid,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'refresh-event-statistics';
