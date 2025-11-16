import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.safeGetSession();
	
	if (!session?.user) {
		throw redirect(303, '/iniciar-sesion');
	}

	const { orderId } = params;

	// Cargar la orden con todos los tickets y evento
	const { data: order, error: orderError } = await supabaseAdmin
		.from('orders')
		.select(`
			id,
			order_number,
			lemon_squeezy_order_id,
			user_id,
			event:events (
				id,
				title,
				description,
				event_date,
				event_time,
				venue_name,
				venue_address,
				venue_city,
				banner_url
			),
			tickets (
				id,
				ticket_code,
				qr_token,
				holder_name,
				holder_email,
				holder_identification,
				ticket_type:ticket_types (
					id,
					name,
					price
				)
			)
		`)
		.eq('id', orderId)
		.single();

	if (orderError || !order) {
		console.error('Error loading order:', orderError);
		throw error(404, 'Orden no encontrada');
	}

	// Verificar que el usuario sea dueño de la orden
	if (order.user_id !== session.user.id) {
		throw error(403, 'No tienes permiso para ver esta orden');
	}

	// Verificar que tenga tickets
	if (!order.tickets || order.tickets.length === 0) {
		throw error(404, 'No se encontraron tickets para esta orden');
	}

	return {
		order,
		event: order.event,
		tickets: order.tickets
	};
};
