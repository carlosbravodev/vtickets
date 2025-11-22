import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verificar autenticación
    const session = await locals.supabase.auth.getSession();
    
    if (!session.data.session) {
      throw error(401, 'No autenticado');
    }

    const user = session.data.session.user;

    // Obtener datos del request
    const { ticket_id, event_id, qr_data } = await request.json();

    console.log('[VALIDATE] Datos recibidos:', { ticket_id, event_id, qr_data: qr_data?.substring(0, 50) });

    if (!event_id) {
      throw error(400, 'event_id es requerido');
    }

    let actualTicketId = ticket_id;

    // Si se proporciona qr_data (JWT), decodificarlo
    if (qr_data && !ticket_id) {
      try {
        // Verificar si es un JWT (comienza con "eyJ")
        if (qr_data.startsWith('eyJ')) {
          console.log('[VALIDATE] Decodificando JWT...');
          const secret = new TextEncoder().encode(
            env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
          );
          
          const { payload } = await jwtVerify(qr_data, secret);
          console.log('[VALIDATE] JWT decodificado:', payload);
          
          // El JWT contiene tid (ticket_id) y eid (event_id)
          actualTicketId = payload.tid as string;
          
          // Validar que el event_id del JWT coincida con el solicitado
          if (payload.eid !== event_id) {
            return json({ 
              error: 'El ticket no pertenece a este evento (verificación JWT)',
              ticket_event: payload.eid,
              expected_event: event_id
            }, { status: 400 });
          }
        } else {
          // Si no es JWT, asumir que es el ticket_id directamente
          actualTicketId = qr_data;
        }
      } catch (jwtError) {
        console.error('[VALIDATE] Error decodificando JWT:', jwtError);
        return json({ error: 'QR inválido o expirado' }, { status: 400 });
      }
    }

    if (!actualTicketId) {
      throw error(400, 'Se requiere ticket_id o qr_data');
    }

    console.log('[VALIDATE] Ticket ID a validar:', actualTicketId);

    // 1. Verificar que el evento existe y el usuario es el organizador
    const { data: event, error: eventError } = await locals.supabase
      .from('events')
      .select('id, created_by, title')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('[VALIDATE] Error obteniendo evento:', eventError);
      return json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.created_by !== user.id) {
      return json({ error: 'No tienes permiso para verificar tickets de este evento' }, { status: 403 });
    }

    console.log('[VALIDATE] Evento validado:', event.title);

    // 2. Obtener el ticket con toda su información (usando admin client para evitar RLS)
    const { data: ticket, error: ticketError } = await supabaseAdmin
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
      .eq('id', actualTicketId)
      .single();

    if (ticketError || !ticket) {
      console.error('[VALIDATE] Error obteniendo ticket:', ticketError);
      return json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    console.log('[VALIDATE] Ticket encontrado:', ticket.ticket_code);

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
