# Sistema de Estadísticas con Vista Materializada

## Descripción

Este sistema implementa una vista materializada (`event_statistics`) que cachea todas las estadísticas de eventos para mejorar el rendimiento del dashboard del organizador.

## Arquitectura

### Vista Materializada: `event_statistics`

Contiene estadísticas precalculadas para cada evento:

- **Básicas**:
  - `total_tickets_sold`: Total de tickets vendidos (suma de `sold_tickets`)
  - `total_tickets_available`: Total de tickets disponibles
  - `total_tickets`: Capacidad total del evento

- **Financieras**:
  - `total_revenue`: Ingresos totales (solo órdenes pagadas)
  - `avg_ticket_price`: Precio promedio por ticket

- **Métricas**:
  - `occupancy_percentage`: Porcentaje de ocupación (0-100)
  - `total_orders`: Número total de órdenes
  - `unique_buyers`: Número de compradores únicos

- **Metadatos**:
  - `last_updated`: Timestamp de la última actualización

### Triggers Automáticos

El sistema tiene triggers que actualizan automáticamente los contadores:

1. **`update_event_total_tickets()`**: Actualiza `total_tickets` en eventos
   - Se ejecuta en INSERT/UPDATE/DELETE de `ticket_types`
   - Calcula: `SUM(initial_quantity)`

2. **`update_ticket_type_on_sale()`**: Incrementa `sold_tickets` al vender
   - Se ejecuta en INSERT de `tickets` con status 'active'
   - Actualiza: `sold_tickets + 1`, `available_tickets - 1`

3. **`update_ticket_type_on_status_change()`**: Maneja cancelaciones/reembolsos
   - Se ejecuta en UPDATE de `tickets.status`
   - Revierte contadores si cambia de active → cancelled/refunded

4. **`update_ticket_type_on_delete()`**: Revierte al eliminar tickets
   - Se ejecuta en DELETE de `tickets`
   - Revierte: `sold_tickets - 1`, `available_tickets + 1`

### Refresh de la Vista Materializada

La vista se refresca automáticamente cada 5 minutos mediante **pg_cron**:

```sql
-- Ver configuración del job
SELECT * FROM cron.job WHERE jobname = 'refresh-event-statistics';

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-event-statistics') 
ORDER BY start_time DESC LIMIT 10;
```

#### Refresh Manual

Si necesitas refrescar manualmente:

```sql
-- Desde SQL
SELECT refresh_event_statistics();

-- O vía Edge Function
POST /functions/v1/refresh-stats
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

#### Ajustar Frecuencia

Edita la migración `20241120_setup_stats_refresh_cron.sql` y cambia el cron expression:

- `'*/1 * * * *'` → Cada minuto (muy frecuente)
- `'*/5 * * * *'` → Cada 5 minutos (⭐ recomendado)
- `'*/15 * * * *'` → Cada 15 minutos (menos carga)
- `'0 * * * *'` → Cada hora

Luego ejecuta:
```sql
SELECT cron.unschedule('refresh-event-statistics');
SELECT cron.schedule('refresh-event-statistics', 'TU_EXPRESION', $$SELECT refresh_event_statistics();$$);
```

## Uso en el Código

### Dashboard del Organizador

`src/routes/organizador/eventos/+page.server.ts`:

```typescript
// 1. Obtener eventos
const { data: eventsData } = await supabaseAdmin
  .from('events')
  .select('*, ticket_types(*)')
  .eq('created_by', user.id);

// 2. Obtener estadísticas de la vista materializada (super rápido)
const { data: statistics } = await supabaseAdmin
  .from('event_statistics')
  .select('*')
  .eq('created_by', user.id);

// 3. Combinar datos
const statsMap = new Map(statistics?.map(s => [s.event_id, s]) || []);
const eventsWithStats = eventsData.map(event => ({
  ...event,
  stats: statsMap.get(event.id)
}));
```

### Tipos de Datos

```typescript
interface EventStatistics {
  event_id: string;
  total_tickets_sold: number;
  total_tickets_available: number;
  occupancy_percentage: number; // 0-100
  total_revenue: number;
  total_orders: number;
  unique_buyers: number;
  avg_ticket_price: number;
  last_updated: string; // ISO timestamp
}
```

## Índices

La vista tiene dos índices para rendimiento óptimo:

1. `idx_event_statistics_event_id`: Único, para lookups por evento
2. `idx_event_statistics_created_by`: Para filtrar por organizador

## Ventajas vs Consultas en Tiempo Real

| Aspecto | Vista Materializada | Consultas Directas |
|---------|---------------------|-------------------|
| **Velocidad** | ⚡ Muy rápida (datos precalculados) | 🐌 Lenta (N+1 queries) |
| **Carga DB** | 📉 Mínima (solo SELECT simple) | 📈 Alta (múltiples JOINs y SUM) |
| **Actualización** | 🕐 Cada 5 min (configurable) | ⚡ Tiempo real |
| **Espacio** | 💾 Usa espacio adicional | 💾 No usa espacio extra |
| **Métricas avanzadas** | ✅ Fácil de añadir | ❌ Requiere queries complejas |

## Monitoreo

### Ver tamaño de la vista:
```sql
SELECT pg_size_pretty(pg_total_relation_size('event_statistics'));
```

### Ver cuántos eventos están cacheados:
```sql
SELECT COUNT(*) FROM event_statistics;
```

### Ver última actualización por evento:
```sql
SELECT event_id, title, last_updated 
FROM event_statistics 
ORDER BY last_updated DESC;
```

## Troubleshooting

### La vista no se actualiza

1. Verificar que el cron job está activo:
```sql
SELECT * FROM cron.job WHERE jobname = 'refresh-event-statistics';
```

2. Ver errores en el historial:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-event-statistics')
ORDER BY start_time DESC;
```

3. Refrescar manualmente:
```sql
SELECT refresh_event_statistics();
```

### Los datos están desincronizados

Los triggers mantienen `sold_tickets` y `total_tickets` siempre actualizados en tiempo real.
La vista materializada puede tener un delay de máximo 5 minutos para métricas derivadas.

Si necesitas datos más frescos, reduce la frecuencia del cron o usa los campos de `ticket_types` directamente.

## Migraciones Relacionadas

1. `20241120_improve_ticket_types.sql`: Añade campos de seguimiento
2. `20241120_trigger_total_tickets.sql`: Trigger para total_tickets
3. `20241120_trigger_ticket_sales.sql`: Triggers para sold_tickets
4. `20241120_add_performance_indexes.sql`: Índices de rendimiento
5. `20241120_create_event_stats_view.sql`: Vista materializada
6. `20241120_setup_stats_refresh_cron.sql`: Configuración de pg_cron

## Mantenimiento

### Reconstruir la vista (si hay corrupción):
```sql
DROP MATERIALIZED VIEW IF EXISTS event_statistics;
-- Luego ejecutar la migración create_event_stats_view.sql
```

### Deshabilitar el auto-refresh:
```sql
SELECT cron.unschedule('refresh-event-statistics');
```

### Volver a habilitar:
```sql
SELECT cron.schedule(
  'refresh-event-statistics',
  '*/5 * * * *',
  $$SELECT refresh_event_statistics();$$
);
```
