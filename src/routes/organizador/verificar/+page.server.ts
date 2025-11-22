import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
  // Verificar que el usuario esté autenticado
  const session = await locals.supabase.auth.getSession();
  
  if (!session.data.session) {
    throw redirect(303, '/iniciar-sesion?redirect=/verificar');
  }

  const user = session.data.session.user;

  // Obtener el perfil del usuario para verificar que es organizador
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Si no es organizador, redirigir al dashboard de usuario normal
  if (profile?.role !== 'organizer') {
    throw redirect(303, '/cuenta');
  }

  // Obtener todos los eventos del organizador
  const { data: events, error } = await locals.supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      event_date,
      location,
      venue,
      image_url,
      total_tickets,
      created_at
    `)
    .eq('created_by', user.id)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error cargando eventos:', error);
    return { events: [] };
  }

  // Para cada evento, obtener el conteo de tickets verificados
  const eventsWithStats = await Promise.all(
    (events || []).map(async (event) => {
      // Contar TODOS los tickets vendidos (active + used) - usar admin para evitar RLS
      const { count: totalTickets } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .in('status', ['active', 'used']);

      const { count: verifiedTickets } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('verified', true);

      return {
        ...event,
        stats: {
          total: totalTickets || 0,
          verified: verifiedTickets || 0,
          percentage: totalTickets ? Math.round(((verifiedTickets || 0) / totalTickets) * 100) : 0
        }
      };
    })
  );

  return {
    events: eventsWithStats
  };
};
