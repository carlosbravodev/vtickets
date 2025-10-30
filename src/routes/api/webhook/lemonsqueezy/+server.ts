import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { supabase } from '$lib/supabase';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const signature = request.headers.get('x-signature');

		if (!signature) {
			return json({ error: 'No signature provided' }, { status: 401 });
		}

		// Verificar firma del webhook
		const webhookSecret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
		
		if (!webhookSecret) {
			console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
			return json({ error: 'Server configuration error' }, { status: 500 });
		}

		const hmac = crypto.createHmac('sha256', webhookSecret);
		const digest = hmac.update(rawBody).digest('hex');

		if (signature !== digest) {
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const event = JSON.parse(rawBody);
		const eventName = event.meta.event_name;

		// Procesar evento de pago exitoso
		if (eventName === 'order_created') {
			const orderId = event.data.id;
			const customData = event.data.attributes.custom_data;
			const status = event.data.attributes.status;
			const totalAmount = parseFloat(event.data.attributes.total) / 100;

			if (status === 'paid') {
				// Extraer información personalizada
				const eventId = customData.event_id;
				const tickets = JSON.parse(customData.tickets);

				// Crear orden en Supabase
				const { error: orderError } = await supabase.from('orders').insert({
					lemon_squeezy_order_id: orderId,
					event_id: eventId,
					total_price: totalAmount,
					payment_status: 'paid',
					created_at: new Date().toISOString()
				});

				if (orderError) {
					console.error('Error creating order:', orderError);
					return json({ error: 'Error saving order' }, { status: 500 });
				}

				// Actualizar tickets disponibles
				for (const [ticketId, quantity] of Object.entries(tickets)) {
					await supabase.rpc('decrease_ticket_availability', {
						ticket_id: ticketId,
						quantity: quantity as number
					});
				}

				console.log('✅ Order processed successfully:', orderId);
			}
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
