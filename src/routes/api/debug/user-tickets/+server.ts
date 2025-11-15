import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { logger } from '$lib/logger';

export const GET: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	const userId = user.id;

	logger.log('🔍 Buscando órdenes para usuario:', userId);

	// Obtener órdenes con tickets
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
				qr_hash,
				status,
				scanned_at,
				ticket_type_id,
				ticket_type:ticket_types (
					id,
					name,
					price
				)
			)
		`)
		.eq('buyer_id', userId)
		.order('created_at', { ascending: false });

	console.log('📦 Órdenes encontradas:', orders?.length || 0);
	console.log('❌ Error:', ordersError);

	if (ordersError) {
		return json({
			error: ordersError,
			orders: null
		}, { status: 500 });
	}

	// Log detallado de cada orden
	orders?.forEach((order, index) => {
		console.log(`\n📋 Orden ${index + 1}:`, {
			id: order.id,
			order_number: order.order_number,
			total_tickets: order.tickets?.length || 0,
			tickets: order.tickets?.map(t => ({
				code: t.ticket_code,
				has_qr_token: !!t.qr_token,
				qr_token_length: t.qr_token?.length || 0,
				has_qr_hash: !!t.qr_hash,
				status: t.status,
				ticket_type: t.ticket_type
			}))
		});
	});

	return json({
		success: true,
		userId,
		orderCount: orders?.length || 0,
		orders: orders?.map(order => ({
			...order,
			tickets: order.tickets?.map(ticket => ({
				...ticket,
				qr_token_preview: ticket.qr_token ? 
					ticket.qr_token.substring(0, 50) + '...' : 
					null
			}))
		}))
	});
};
