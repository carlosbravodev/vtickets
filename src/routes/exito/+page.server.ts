import { redirect, type ServerLoad } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { logger } from '$lib/logger';

export const load: ServerLoad = async ({ locals }) => {
	try {
		const session = locals.session;
		const user = locals.user;

		// Redirigir a iniciar sesión si no está autenticado
		if (!session || !user) {
			throw redirect(303, '/iniciar-sesion');
		}

		const userId = user.id;

		// Obtener la última orden del usuario (más reciente)
		const { data: lastOrder, error: orderError } = await supabaseAdmin
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
					description,
					event_date,
					location,
					image_url
				),
				tickets (
					id,
					ticket_code,
					qr_token,
					status,
					ticket_type:ticket_types (
						id,
						name,
						price
					)
				)
			`)
			.eq('buyer_id', userId)
			.eq('payment_status', 'paid')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (orderError) {
			logger.error('Error fetching last order in exito page', orderError, { userId });
			// Si no hay orden, redirigir a cuenta
			throw redirect(303, '/cuenta');
		}

		// Calcular el total de tickets
		const ticketCount = lastOrder.tickets?.length || 0;

		return {
			order: lastOrder,
			ticketCount,
			user
		};
	} catch (error) {
		// Si es un redirect intencional, dejarlo pasar
		if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
			throw error;
		}
		
		logger.error('Unexpected error in exito page load', error);
		throw redirect(303, '/cuenta');
	}
};
