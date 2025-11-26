import { supabase } from '$lib/supabase';

export const load = async () => {
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (
        price
      )
    `)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return { events: [], error: error.message };
  }

  // Procesar eventos para agregar el precio mínimo
  const eventsWithPrice = events?.map(event => ({
    ...event,
    min_price: event.ticket_types?.length > 0
      ? Math.min(...event.ticket_types.map((t: any) => Number(t.price)))
      : 0
  })) || [];

  return {
    events: eventsWithPrice,
    error: null
  };
};
