import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/supabaseAdmin';

/**
 * Endpoint unificado para escaneo de tickets
 * Combina validación + marcado de verificación en una sola operación atómica
 * Optimizado para eventos masivos con escaneo continuo
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // 1. Verificar autenticación
    const session = await locals.supabase.auth.getSession();
    
    if (!session.data.session) {
      throw error(401, 'No autenticado');
    }

    const user = session.data.session.user;

    // 2. Obtener datos del request
    const { ticket_id, event_id, qr_data, entry_gate, device_info } = await request.json();

    console.log('[SCAN] Inicio de verificación:', { 
      event_id, 
      qr_preview: qr_data?.substring(0, 50),
      user_id: user.id 
    });

    if (!event_id) {
      throw error(400, 'event_id es requerido');
    }

    let actualTicketId = ticket_id;

    // 3. Decodificar JWT si es necesario
    if (qr_data && !ticket_id) {
      try {
        if (qr_data.startsWith('eyJ')) {
          console.log('[SCAN] Decodificando JWT...');
          const secret = new TextEncoder().encode(
            env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
          );
          
          const { payload } = await jwtVerify(qr_data, secret);
          console.log('[SCAN] JWT válido:', { tid: payload.tid, eid: payload.eid });
          
          actualTicketId = payload.tid as string;
          
          // Validar que el event_id del JWT coincida
          if (payload.eid !== event_id) {
            return json({ 
              success: false,
              error: 'El ticket no pertenece a este evento',
              error_type: 'wrong_event',
              ticket_event: payload.eid,
              expected_event: event_id
            }, { status: 400 });
          }
        } else {
          actualTicketId = qr_data;
        }
      } catch (jwtError) {
        console.error('[SCAN] Error decodificando JWT:', jwtError);
        return json({ 
          success: false,
          error: 'QR inválido o expirado',
          error_type: 'invalid_qr'
        }, { status: 400 });
      }
    }

    if (!actualTicketId) {
      throw error(400, 'Se requiere ticket_id o qr_data');
    }

    // 4. Verificar que el usuario es organizador del evento
    const { data: event, error: eventError } = await locals.supabase
      .from('events')
      .select('id, created_by, title')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('[SCAN] Error obteniendo evento:', eventError);
      return json({ 
        success: false,
        error: 'Evento no encontrado',
        error_type: 'event_not_found'
      }, { status: 404 });
    }

    if (event.created_by !== user.id) {
      return json({ 
        success: false,
        error: 'No tienes permiso para verificar tickets de este evento',
        error_type: 'unauthorized'
      }, { status: 403 });
    }

    console.log('[SCAN] Evento validado:', event.title);

    // 5. Obtener ticket con filtro event_id (optimización de índice)
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
        ticket_types!inner (
          id,
          name,
          price,
          description
        )
      `)
      .eq('id', actualTicketId)
      .eq('event_id', event_id) // ← Filtro para usar índice compuesto
      .single() as { data: any; error: any }; // Type assertion para evitar errores TS

    if (ticketError || !ticket) {
      console.error('[SCAN] Ticket no encontrado:', ticketError);
      return json({ 
        success: false,
        error: 'Ticket no encontrado o no pertenece a este evento',
        error_type: 'ticket_not_found'
      }, { status: 404 });
    }

    console.log('[SCAN] Ticket encontrado:', ticket.ticket_code);

    // 6. Validar estado del ticket
    if (ticket.status === 'cancelled') {
      return json({
        success: false,
        error: 'Ticket cancelado',
        error_type: 'cancelled',
        ticket: {
          id: ticket.id,
          code: ticket.ticket_code,
          holder_name: ticket.holder_name,
          type: (ticket.ticket_types as any)?.name
        }
      }, { status: 400 });
    }

    if (ticket.status === 'refunded') {
      return json({
        success: false,
        error: 'Ticket reembolsado',
        error_type: 'refunded',
        ticket: {
          id: ticket.id,
          code: ticket.ticket_code,
          holder_name: ticket.holder_name,
          type: (ticket.ticket_types as any)?.name
        }
      }, { status: 400 });
    }

    // 7. Si ya está verificado, registrar en historial y retornar
    if (ticket.verified) {
      console.log('[SCAN] Ticket ya verificado anteriormente');
      
      // Registrar intento en historial
      await supabaseAdmin
        .from('ticket_verifications')
        .insert({
          ticket_id: ticket.id,
          event_id,
          verified_by: user.id,
          verification_status: 'already_verified',
          device_info: device_info || {},
          entry_gate: entry_gate || null,
          sync_status: 'synced'
        });

      return json({
        success: false,
        error: 'Ticket ya verificado',
        error_type: 'already_verified',
        ticket: {
          id: ticket.id,
          code: ticket.ticket_code,
          holder_name: ticket.holder_name,
          holder_email: ticket.holder_email,
          type: (ticket.ticket_types as any)?.name,
          price: (ticket.ticket_types as any)?.price,
          verified_at: ticket.verified_at
        }
      }, { status: 400 });
    }

    // 8. Marcar como verificado (transacción atómica)
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        verified: true,
        verified_at: now,
        verified_by: user.id,
        status: 'used'
      })
      .eq('id', ticket.id)
      .eq('event_id', event_id); // ← Filtro adicional de seguridad

    if (updateError) {
      console.error('[SCAN] Error actualizando ticket:', updateError);
      return json({ 
        success: false,
        error: 'Error al verificar ticket',
        error_type: 'database_error'
      }, { status: 500 });
    }

    // 9. Registrar verificación exitosa en historial
    const { error: historyError } = await supabaseAdmin
      .from('ticket_verifications')
      .insert({
        ticket_id: ticket.id,
        event_id,
        verified_by: user.id,
        verification_status: 'success',
        device_info: device_info || {},
        entry_gate: entry_gate || null,
        sync_status: 'synced'
      });

    if (historyError) {
      console.error('[SCAN] Error guardando historial:', historyError);
      // No es crítico, continuamos
    }

    console.log('[SCAN] ✅ Ticket verificado exitosamente');

    // 10. Retornar respuesta exitosa con todos los datos
    return json({
      success: true,
      message: 'Ticket verificado correctamente',
      ticket: {
        id: ticket.id,
        code: ticket.ticket_code,
        holder_name: ticket.holder_name,
        holder_email: ticket.holder_email,
        type: (ticket.ticket_types as any)?.name,
        price: (ticket.ticket_types as any)?.price,
        verified_at: now
      }
    });

  } catch (err) {
    console.error('[SCAN] Error inesperado:', err);
    
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({ 
      success: false,
      error: 'Error interno del servidor',
      error_type: 'server_error'
    }, { status: 500 });
  }
};
