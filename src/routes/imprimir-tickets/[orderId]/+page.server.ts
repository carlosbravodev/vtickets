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
			buyer_id,
			event:events!inner (
id,
title,
description,
event_date,
venue,
location,
image_url
),
			tickets!inner (
id,
ticket_code,
qr_token,
holder_name,
holder_email,
ticket_type:ticket_types!inner (
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
	if (order.buyer_id !== session.user.id) {
		throw error(403, 'No tienes permiso para ver esta orden');
	}

	// Verificar que tenga tickets
	if (!order.tickets || order.tickets.length === 0) {
		throw error(404, 'No se encontraron tickets para esta orden');
	}

	// event es un objeto por el !inner, tickets es un array
	// Extraer event del order para evitar conflictos de tipos
	const eventData = Array.isArray(order.event) ? order.event[0] : order.event;
	
	// Normalizar ticket_type que también viene con !inner
	const normalizedTickets = order.tickets.map((ticket: any) => ({
		...ticket,
		ticket_type: Array.isArray(ticket.ticket_type) ? ticket.ticket_type[0] : ticket.ticket_type
	}));
	
	return {
		order,
		event: eventData,
		tickets: normalizedTickets
	};
};
