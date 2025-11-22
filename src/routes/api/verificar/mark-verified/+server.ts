import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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
    const { ticket_id, event_id, entry_gate, device_info } = await request.json();

    console.log('[MARK-VERIFIED] Datos recibidos:', { ticket_id, event_id });

    if (!ticket_id || !event_id) {
      throw error(400, 'Faltan parámetros: ticket_id y event_id son requeridos');
    }

    // 1. Verificar que el usuario es el organizador del evento
    const { data: event, error: eventError } = await locals.supabase
      .from('events')
      .select('id, created_by')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.created_by !== user.id) {
      return json({ error: 'No tienes permiso para verificar tickets de este evento' }, { status: 403 });
    }

    // 2. Verificar el estado actual del ticket (usando admin para evitar RLS)
    const { data: currentTicket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, verified, event_id, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !currentTicket) {
      console.error('[MARK-VERIFIED] Error obteniendo ticket:', ticketError);
      return json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    console.log('[MARK-VERIFIED] Ticket actual:', currentTicket);

    if (currentTicket.event_id !== event_id) {
      return json({ error: 'El ticket no pertenece a este evento' }, { status: 400 });
    }

    // Si ya está verificado, registrar en historial pero no actualizar ticket
    if (currentTicket.verified) {
      console.log('[MARK-VERIFIED] Ticket ya verificado');
      // Registrar en historial como "already_verified"
      await supabaseAdmin
        .from('ticket_verifications')
        .insert({
          ticket_id,
          event_id,
          verified_by: user.id,
          verification_status: 'already_verified',
          device_info: device_info || {},
          entry_gate: entry_gate || null,
          sync_status: 'synced'
        });

      return json({
        success: true,
        already_verified: true,
        message: 'Este ticket ya fue verificado anteriormente'
      });
    }

    // 3. Marcar el ticket como verificado (con protección contra race conditions)
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        verified: true,
        verified_at: now,
        verified_by: user.id,
        status: 'used', // Opcional: marcar como usado
        scanned_at: now,
        scanned_by: user.id,
        entry_gate: entry_gate || null,
        updated_at: now
      })
      .eq('id', ticket_id)
      .eq('verified', false); // IMPORTANTE: solo actualizar si aún no está verificado

    if (updateError) {
      console.error('[MARK-VERIFIED] Error actualizando ticket:', updateError);
      
      // Registrar el error en el historial
      await supabaseAdmin
        .from('ticket_verifications')
        .insert({
          ticket_id,
          event_id,
          verified_by: user.id,
          verification_status: 'error',
          device_info: device_info || {},
          entry_gate: entry_gate || null,
          sync_status: 'failed'
        });

      return json({ error: 'Error al verificar el ticket' }, { status: 500 });
    }

    console.log('[MARK-VERIFIED] Ticket verificado correctamente');

    // 4. Registrar en el historial de verificaciones
    const { error: historyError } = await supabaseAdmin
      .from('ticket_verifications')
      .insert({
        ticket_id,
        event_id,
        verified_by: user.id,
        verification_status: 'success',
        device_info: device_info || {},
        entry_gate: entry_gate || null,
        sync_status: 'synced',
        synced_at: now
      });

    if (historyError) {
      console.error('[MARK-VERIFIED] Error registrando en historial:', historyError);
      // No fallar la operación si falla el historial, el ticket ya fue marcado
    }

    // 5. Respuesta exitosa
    return json({
      success: true,
      already_verified: false,
      verified_at: now,
      message: 'Ticket verificado correctamente'
    });

  } catch (err) {
    console.error('Error en /api/verificar/mark-verified:', err);
    
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};
