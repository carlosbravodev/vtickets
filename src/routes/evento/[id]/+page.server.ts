import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { slugify } from '$lib/utils/slug';
import type { PageServerLoad } from './$types';

/**
 * Genera un slug único para cada evento, añadiendo un número secuencial si hay duplicados
 */
function generateUniqueSlug(event: any, allEvents: any[]): string {
  const baseSlug = slugify(event.title);
  
  // Contar cuántos eventos tienen el mismo slug base (creados antes que este)
  const duplicates = allEvents.filter(e => {
    const eventSlug = slugify(e.title);
    return eventSlug === baseSlug && new Date(e.created_at) < new Date(event.created_at);
  });

  // Si hay duplicados, añadir número secuencial
  if (duplicates.length > 0) {
    return `${baseSlug}-${duplicates.length + 1}`;
  }

  return baseSlug;
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id: slugParam } = params;
  
  // Traemos todos los eventos para generar slugs únicos
  const { data: allEvents, error: fetchError } = await supabase
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
    .order('created_at', { ascending: true }); // Ordenar por fecha de creación

  if (fetchError) {
    console.error('Error fetching events:', fetchError);
    throw error(500, 'Error al cargar el evento');
  }

  // Buscar el evento cuyo slug único coincida
  const event = allEvents?.find(e => generateUniqueSlug(e, allEvents) === slugParam);

  // Si no se encuentra por slug, intentar por ID (retrocompatibilidad)
  if (!event) {
    const { data: eventById, error: dbError } = await supabase
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
      .eq('id', slugParam)
      .single();

    if (dbError || !eventById) {
      throw error(404, 'Evento no encontrado');
    }

    return {
      event: eventById,
      user: locals.user
    };
  }

  return {
    event,
    user: locals.user
  };
};