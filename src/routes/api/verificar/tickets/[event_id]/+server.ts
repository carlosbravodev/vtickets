import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Verificar autenticación
    const session = await locals.supabase.auth.getSession();
    
    if (!session.data.session) {
      throw error(401, 'No autenticado');
    }

    const user = session.data.session.user;
    const eventId = params.event_id;

    // Verificar que el usuario es el organizador del evento
    const { data: event, error: eventError } = await locals.supabase
      .from('events')
      .select('id, created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw error(404, 'Evento no encontrado');
    }

    if (event.created_by !== user.id) {
      throw error(403, 'No tienes permiso para ver los tickets de este evento');
    }

    // Obtener todos los tickets del evento
    const { data: tickets, error: ticketsError } = await locals.supabase
      .from('tickets')
      .select(`
        id,
        ticket_code,
        holder_name,
        holder_email,
        verified,
        status,
        ticket_types (
          name,
          price,
          description
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'active');

    if (ticketsError) {
      console.error('Error cargando tickets:', ticketsError);
      throw error(500, 'Error al cargar tickets');
    }

    return json(tickets || []);

  } catch (err) {
    console.error('Error en /api/verificar/tickets/[event_id]:', err);
    
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    return json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};
