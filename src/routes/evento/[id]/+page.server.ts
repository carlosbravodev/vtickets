import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id: slugParam } = params;
  
  // Buscar el evento por su slug
  const { data: event, error: fetchError } = await supabase
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
    .eq('slug', slugParam)
    .single();

  if (fetchError || !event) {
    console.error('Error fetching event:', fetchError);
    throw error(404, 'Evento no encontrado');
  }

  return {
    event,
    user: locals.user
  };
};