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

	// Obtener eventos creados por este organizador
	const { data: events, error } = await supabaseAdmin
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
			created_at,
			ticket_types (
				id,
				name,
				price,
				available_tickets
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

	// Calcular estadísticas por evento
	const eventsWithStats = await Promise.all(
		(events || []).map(async (event) => {
			// Contar tickets vendidos para este evento
			const { data: tickets, error: ticketsError } = await supabaseAdmin
				.from('tickets')
				.select('id, ticket_type_id')
				.eq('event_id', event.id);

			if (ticketsError) {
				console.error('Error fetching tickets for event:', event.id, ticketsError);
			}

			const totalTicketsSold = tickets?.length || 0;

			// Calcular total de tickets disponibles
			const totalTicketsAvailable = event.ticket_types?.reduce(
				(sum, type) => sum + (type.available_tickets || 0),
				0
			) || 0;

			// Calcular ingresos totales (aproximado por tickets vendidos)
			const { data: orders, error: ordersError } = await supabaseAdmin
				.from('orders')
				.select('total_amount')
				.eq('event_id', event.id);

			const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

			return {
				...event,
				stats: {
					totalTicketsSold,
					totalTicketsAvailable,
					totalRevenue
				}
			};
		})
	);

	return {
		user,
		events: eventsWithStats
	};
};
