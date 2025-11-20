import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	// Si no está autenticado, redirigir a login
	if (!session || !user) {
		redirect(303, '/organizador/iniciar-sesion');
	}

	// Verificar que sea organizador
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (profile?.role !== 'organizer') {
		redirect(303, '/');
	}

	// Obtener eventos con estadísticas usando la vista materializada
	// Esta consulta es mucho más eficiente que calcular stats por separado
	const { data: eventsData, error } = await supabaseAdmin
		.from('events')
		.select(`
			id,
			title,
			description,
			event_date,
			venue,
			location,
			image_url,
			slug,
			total_tickets,
			created_at,
			ticket_types (
				id,
				name,
				price,
				initial_quantity,
				sold_tickets,
				available_tickets,
				is_active
			)
		`)
		.eq('created_by', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching organizer events:', error);
		return {
			user,
			events: [],
			error: error.message
		};
	}

	// Obtener estadísticas de la vista materializada
	const { data: statistics, error: statsError } = await supabaseAdmin
		.from('event_statistics')
		.select('*')
		.eq('created_by', user.id);

	if (statsError) {
		console.error('Error fetching event statistics:', statsError);
	}

	// Crear un mapa de estadísticas por event_id para lookup rápido
	const statsMap = new Map(
		statistics?.map(stat => [stat.event_id, stat]) || []
	);

	// Combinar eventos con sus estadísticas
	const eventsWithStats = (eventsData || []).map((event) => {
		const stats = statsMap.get(event.id);
		
		return {
			...event,
			stats: {
				totalTicketsSold: stats?.total_tickets_sold || 0,
				totalTicketsAvailable: stats?.total_tickets_available || 0,
				totalRevenue: Number(stats?.total_revenue || 0),
				totalOrders: stats?.total_orders || 0,
				uniqueBuyers: stats?.unique_buyers || 0,
				occupancyPercentage: Number(stats?.occupancy_percentage || 0),
				avgTicketPrice: Number(stats?.avg_ticket_price || 0),
				lastUpdated: stats?.last_updated
			}
		};
	});

	return {
		user,
		events: eventsWithStats
	};
};
