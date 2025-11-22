import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const eventId = params.event_id;

    // Verificar autenticación (opcional, ya que las stats son públicas para el organizador)
    const session = await locals.supabase.auth.getSession();
    
    if (!session.data.session) {
      throw error(401, 'No autenticado');
    }

    // Contar TODOS los tickets vendidos (active + used)
    const { count: totalTickets } = await locals.supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['active', 'used']);

    const { count: verifiedTickets } = await locals.supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('verified', true);

    const total = totalTickets || 0;
    const verified = verifiedTickets || 0;
    const pending = total - verified;
    const percentage = total ? Math.round((verified / total) * 100) : 0;

    return json({
      total,
      verified,
      pending,
      percentage
    });

  } catch (err) {
    console.error('Error en /api/verificar/stats:', err);
    
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    return json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};
