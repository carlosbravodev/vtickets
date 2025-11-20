import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	// Si no está autenticado, redirigir a login
	if (!session || !user) {
		redirect(303, '/organizador/iniciar-sesion');
	}

	// Obtener todas las estadísticas globales del organizador
	const { data: allStats } = await supabaseAdmin
		.from('event_statistics')
		.select('*')
		.eq('created_by', user.id);

	// Calcular totales globales
	const globalStats = {
		totalRevenue: allStats?.reduce((sum, stat) => sum + Number(stat.total_revenue || 0), 0) || 0,
		totalTicketsSold: allStats?.reduce((sum, stat) => sum + (stat.total_tickets_sold || 0), 0) || 0,
		totalOrders: allStats?.reduce((sum, stat) => sum + (stat.total_orders || 0), 0) || 0,
		uniqueBuyers: allStats?.reduce((sum, stat) => sum + (stat.unique_buyers || 0), 0) || 0,
		totalEvents: allStats?.length || 0
	};

	// Obtener eventos ordenados por ingresos (top 5)
	const topEvents = allStats
		?.sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
		.slice(0, 5)
		.map(stat => ({
			event_id: stat.event_id,
			event_title: stat.event_title,
			total_revenue: Number(stat.total_revenue || 0),
			total_tickets_sold: stat.total_tickets_sold || 0,
			total_orders: stat.total_orders || 0
		})) || [];

	// Obtener eventos activos (próximos)
	const { data: activeEvents } = await supabaseAdmin
		.from('events')
		.select('id, title, event_date, slug')
		.eq('created_by', user.id)
		.gte('event_date', new Date().toISOString())
		.order('event_date', { ascending: true })
		.limit(5);

	// Obtener últimas 10 órdenes de todos los eventos
	const { data: recentOrders } = await supabaseAdmin
		.from('orders')
		.select(`
			id,
			order_number,
			buyer_email,
			total_amount,
			status,
			created_at,
			events (
				title,
				slug
			)
		`)
		.in('event_id', allStats?.map(s => s.event_id) || [])
		.eq('status', 'completed')
		.order('created_at', { ascending: false })
		.limit(10);

	return {
		user,
		globalStats,
		topEvents,
		activeEvents: activeEvents || [],
		recentOrders: recentOrders || []
	};
};
