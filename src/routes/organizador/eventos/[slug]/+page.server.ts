import { supabaseAdmin } from '$lib/supabaseAdmin';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw error(401, 'No autorizado');
	}

	// Buscar el evento por slug
	const { data: event, error: eventError } = await supabaseAdmin
		.from('events')
		.select(`
			*,
			ticket_types (
				id,
				name,
				price,
				initial_quantity,
				available_tickets,
				is_active
			)
		`)
		.eq('slug', slug)
		.eq('organizer_id', session.user.id) // Solo el organizador puede ver sus eventos
		.single();

	if (eventError || !event) {
		throw error(404, 'Evento no encontrado');
	}

	// Obtener estadísticas detalladas del evento desde la vista materializada
	const { data: stats } = await supabaseAdmin
		.from('event_statistics')
		.select('*')
		.eq('event_id', event.id)
		.single();

	// Obtener órdenes del evento (últimas 10)
	const { data: recentOrders } = await supabaseAdmin
		.from('orders')
		.select(`
			id,
			order_number,
			buyer_email,
			total_amount,
			status,
			created_at,
			tickets (
				id,
				ticket_number,
				ticket_types (
					name,
					price
				)
			)
		`)
		.eq('event_id', event.id)
		.eq('status', 'completed')
		.order('created_at', { ascending: false })
		.limit(10);

	// Obtener total de tickets vendidos por tipo
	const { data: ticketSales } = await supabaseAdmin
		.from('tickets')
		.select(`
			ticket_type_id,
			ticket_types (
				name
			)
		`)
		.eq('event_id', event.id);

	// Agrupar tickets por tipo
	const ticketSalesByType = ticketSales?.reduce((acc: any, ticket: any) => {
		const typeId = ticket.ticket_type_id;
		const typeName = ticket.ticket_types?.name || 'Desconocido';
		
		if (!acc[typeId]) {
			acc[typeId] = { name: typeName, count: 0 };
		}
		acc[typeId].count++;
		
		return acc;
	}, {});

	return {
		event,
		stats: {
			total_tickets_sold: stats?.total_tickets_sold || 0,
			total_tickets_available: stats?.total_tickets_available || 0,
			total_revenue: Number(stats?.total_revenue || 0),
			total_orders: stats?.total_orders || 0,
			unique_buyers: stats?.unique_buyers || 0,
			avg_ticket_price: Number(stats?.avg_ticket_price || 0),
			occupancy_percentage: Number(stats?.occupancy_percentage || 0)
		},
		recentOrders: recentOrders || [],
		ticketSalesByType: ticketSalesByType || {}
	};
};
