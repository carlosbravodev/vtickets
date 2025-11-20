import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async ({ parent }) => {
  // Obtener datos del layout (session y user)
  await parent();
  // Obtener eventos próximos (ordenados por fecha ascendente)
  const today = new Date().toISOString();
  
  const { data: upcomingEvents, error } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (
        price
      )
    `)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10);

  if (error) {
    logger.error('Error fetching upcoming events:', error);
    return { 
      upcomingEvents: [],
      error: error.message 
    };
  }

  // Procesar eventos para agregar el precio mínimo
  const eventsWithPrice = upcomingEvents?.map(event => ({
    ...event,
    min_price: event.ticket_types?.length > 0
      ? Math.min(...event.ticket_types.map((t: any) => Number(t.price)))
      : 0
  })) || [];

  // Obtener eventos en Guayaquil (ordenados por fecha ascendente)
  const { data: guayaquilEvents, error: guayaquilError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (
        price
      )
    `)
    .ilike('location', '%Guayaquil%')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10);

  // Procesar eventos de Guayaquil
  const guayaquilEventsWithPrice = guayaquilEvents?.map(event => ({
    ...event,
    min_price: event.ticket_types?.length > 0
      ? Math.min(...event.ticket_types.map((t: any) => Number(t.price)))
      : 0
  })) || [];

  if (guayaquilError) {
    logger.error('Error fetching Guayaquil events:', guayaquilError);
  }

  // Obtener eventos en Quito (ordenados por fecha ascendente)
  const { data: quitoEvents, error: quitoError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (
        price
      )
    `)
    .ilike('location', '%Quito%')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10);

  // Procesar eventos de Quito
  const quitoEventsWithPrice = quitoEvents?.map(event => ({
    ...event,
    min_price: event.ticket_types?.length > 0
      ? Math.min(...event.ticket_types.map((t: any) => Number(t.price)))
      : 0
  })) || [];

  if (quitoError) {
    logger.error('Error fetching Quito events:', quitoError);
  }

  return {
    upcomingEvents: eventsWithPrice,
    guayaquilEvents: guayaquilEventsWithPrice,
    quitoEvents: quitoEventsWithPrice,
    error: null
  };
};