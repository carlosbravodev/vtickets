import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verificar autenticación
    const session = await locals.supabase.auth.getSession();
    
    if (!session.data.session) {
      throw error(401, 'No autenticado');
    }

    const user = session.data.session.user;

    // Obtener datos del request
    const { ticket_id, event_id } = await request.json();

    if (!ticket_id || !event_id) {
      throw error(400, 'Faltan parámetros: ticket_id y event_id son requeridos');
    }

    // 1. Verificar que el evento existe y el usuario es el organizador
    const { data: event, error: eventError } = await locals.supabase
      .from('events')
      .select('id, created_by, title')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.created_by !== user.id) {
      return json({ error: 'No tienes permiso para verificar tickets de este evento' }, { status: 403 });
    }

    // 2. Obtener el ticket con toda su información
    const { data: ticket, error: ticketError } = await locals.supabase
      .from('tickets')
      .select(`
        id,
        ticket_code,
        event_id,
        status,
        verified,
        verified_at,
        holder_name,
        holder_email,
        ticket_type_id,
        ticket_types (
          id,
          name,
          price,
          description
        )
      `)
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // 3. Validaciones de negocio
    
    // Verificar que el ticket pertenece al evento correcto
    if (ticket.event_id !== event_id) {
      return json({ 
        error: 'Este ticket no pertenece a este evento',
        ticket_event: ticket.event_id,
        expected_event: event_id
      }, { status: 400 });
    }

    // Verificar que el ticket no esté cancelado o reembolsado
    if (ticket.status === 'cancelled') {
      return json({ error: 'Este ticket ha sido cancelado' }, { status: 400 });
    }

    if (ticket.status === 'refunded') {
      return json({ error: 'Este ticket ha sido reembolsado' }, { status: 400 });
    }

    // Informar si ya está verificado (pero no es un error bloqueante)
    if (ticket.verified) {
      return json({
        valid: true,
        already_verified: true,
        verified_at: ticket.verified_at,
        ticket: {
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          holder_name: ticket.holder_name,
          holder_email: ticket.holder_email,
          ticket_type: ticket.ticket_types,
          status: ticket.status
        },
        message: 'Este ticket ya fue verificado anteriormente'
      });
    }

    // 4. Ticket válido y listo para verificar
    return json({
      valid: true,
      already_verified: false,
      ticket: {
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        holder_name: ticket.holder_name,
        holder_email: ticket.holder_email,
        ticket_type: ticket.ticket_types,
        status: ticket.status
      },
      message: 'Ticket válido, listo para verificar'
    });

  } catch (err) {
    console.error('Error en /api/verificar/validate:', err);
    
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};
