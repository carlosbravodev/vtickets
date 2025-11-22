import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ params, locals }) => {
  // Verificar autenticación
  const session = await locals.supabase.auth.getSession();
  
  if (!session.data.session) {
    throw redirect(303, '/iniciar-sesion?redirect=/verificar');
  }

  const user = session.data.session.user;
  const eventId = params.event_id;

  // Obtener información del evento
  const { data: event, error: eventError } = await locals.supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      event_date,
      location,
      venue,
      image_url,
      created_by,
      total_tickets
    `)
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw error(404, 'Evento no encontrado');
  }

  // Verificar que el usuario es el organizador del evento
  if (event.created_by !== user.id) {
    throw error(403, 'No tienes permiso para verificar tickets de este evento');
  }

  // Obtener estadísticas de verificación
  // Contar TODOS los tickets vendidos (active + used) - usar admin para evitar RLS
  const { count: totalTickets } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['active', 'used']);

  const { count: verifiedTickets } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('verified', true);

  // Obtener últimas verificaciones (últimas 10)
  const { data: rawVerifications } = await locals.supabase
    .from('ticket_verifications')
    .select(`
      id,
      created_at,
      verification_status,
      tickets!inner (
        ticket_code,
        holder_name,
        holder_email,
        ticket_types (
          name,
          price
        )
      )
    `)
    .eq('event_id', eventId)
    .eq('verification_status', 'success')
    .order('created_at', { ascending: false })
    .limit(10);

  // Transformar datos (Supabase devuelve arrays, necesitamos objetos)
  const recentVerifications = (rawVerifications || []).map((v: any) => ({
    ...v,
    ticket: Array.isArray(v.tickets) ? v.tickets[0] : v.tickets
  }));

  return {
    event,
    stats: {
      total: totalTickets || 0,
      verified: verifiedTickets || 0,
      pending: (totalTickets || 0) - (verifiedTickets || 0),
      percentage: totalTickets ? Math.round(((verifiedTickets || 0) / totalTickets) * 100) : 0
    },
    recentVerifications
  };
};
