import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  
  // Traer el evento con sus tipos de tickets
  const { data: event, error: dbError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (
        id,
        name,
        price,
        available_tickets
      )
    `)
    .eq('id', id)
    .single();

  if (dbError) {
    console.error('Error fetching event:', dbError);
    throw error(500, 'Error al cargar el evento');
  }

  if (!event) {
    throw error(404, 'Evento no encontrado');
  }

  return {
    event
  };
};