import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	// Redirigir al login si no está autenticado
	if (!session) {
		throw redirect(303, '/login?redirectTo=/cuenta');
	}

	const userId = session.user.id;

	// Obtener todas las órdenes del usuario con tickets individuales
	const { data: orders, error: ordersError } = await supabase
		.from('orders')
		.select(`
			id,
			lemon_squeezy_order_id,
			order_number,
			event_id,
			total_price,
			payment_status,
			tickets_data,
			created_at,
			event:events!inner (
				id,
				title,
				event_date,
				location,
				image_url
			),
			tickets (
				id,
				ticket_code,
				qr_token,
				status,
				scanned_at,
				ticket_type:ticket_types (
					id,
					name,
					price
				)
			)
		`)
		.eq('buyer_id', userId)
		.order('created_at', { ascending: false });

	if (ordersError) {
		console.error('Error fetching orders:', ordersError);
		return {
			orders: [],
			user: session.user
		};
	}

	// Para cada orden, obtener los nombres de los tickets
	const ordersWithTicketDetails = await Promise.all(
		orders.map(async (order) => {
			const ticketIds = Object.keys(order.tickets_data);
			
			const { data: ticketTypes } = await supabase
				.from('ticket_types')
				.select('id, name, price')
				.in('id', ticketIds);

			// Crear un mapa de tickets con cantidades
			const ticketsDetails = ticketTypes?.map(ticket => ({
				...ticket,
				quantity: order.tickets_data[ticket.id]
			})) || [];

			return {
				...order,
				ticketsDetails
			};
		})
	);

	return {
		orders: ordersWithTicketDetails,
		user: session.user
	};
};
