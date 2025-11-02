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

		console.log(`📨 Webhook received: ${eventName}`);

		// Procesar evento de pago exitoso
		if (eventName === 'order_created') {
			const orderId = event.data.id;
			const orderIdentifier = event.data.attributes.identifier; // ID legible para humanos
			const customData = event.meta.custom_data || {};
			const status = event.data.attributes.status;
			const totalAmount = parseFloat(event.data.attributes.total) / 100;
			const userEmail = event.data.attributes.user_email;

			console.log(`   Order ID: ${orderIdentifier}`);
			console.log(`   Status: ${status}`);
			console.log(`   Amount: $${totalAmount}`);

			if (status === 'paid') {
				// Extraer información personalizada
				const eventId = customData.event_id;
				const tickets = JSON.parse(customData.tickets || '{}');
				const buyerId = customData.buyer_id || null;

				// Validar datos requeridos
				if (!eventId || Object.keys(tickets).length === 0) {
					console.error('❌ Missing required data in webhook');
					return json({ error: 'Invalid webhook data' }, { status: 400 });
				}

				// Verificar si la orden ya existe (prevenir duplicados)
				const { data: existingOrder } = await supabase
					.from('orders')
					.select('id')
					.eq('lemon_squeezy_order_id', orderId)
					.single();

				if (existingOrder) {
					console.log('⚠️  Order already exists, skipping');
					return json({ received: true, message: 'Order already processed' });
				}

				// Preparar datos de la orden
				const orderData: any = {
					lemon_squeezy_order_id: orderId,
					event_id: eventId,
					user_email: userEmail,
					total_price: totalAmount,
					payment_status: 'paid',
					tickets_data: tickets,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};

				// Agregar buyer_id si el usuario estaba autenticado
				if (buyerId) {
					orderData.buyer_id = buyerId;
				}

				// Crear orden en Supabase
				const { data: newOrder, error: orderError } = await supabase
					.from('orders')
					.insert(orderData)
					.select()
					.single();

				if (orderError) {
					console.error('❌ Error creating order:', orderError);
					return json({ error: 'Error saving order' }, { status: 500 });
				}

				// Actualizar tickets disponibles
				for (const [ticketId, quantity] of Object.entries(tickets)) {
					const { error: ticketError } = await supabase.rpc('decrease_ticket_availability', {
						ticket_id: ticketId,
						quantity: quantity as number
					});

					if (ticketError) {
						console.error(`❌ Error updating ticket ${ticketId}:`, ticketError);
					}
				}

				console.log('✅ Order processed successfully:', orderIdentifier);
				console.log(`   Database ID: ${newOrder.id}`);
				if (buyerId) {
					console.log(`   Authenticated user: ${buyerId}`);
				} else {
					console.log(`   Guest user: ${userEmail}`);
				}
			} else {
				console.log(`⏳ Order status is "${status}", waiting for payment`);
			}
		}

		// Procesar actualizaciones de orden (refunds, etc)
		else if (eventName === 'order_refunded') {
			const orderId = event.data.id;
			const refundedAmount = parseFloat(event.data.attributes.refunded) / 100;

			console.log(`💰 Order refunded: ${orderId}, Amount: $${refundedAmount}`);

			// Actualizar estado en la base de datos
			const { error: updateError } = await supabase
				.from('orders')
				.update({
					payment_status: 'refunded',
					updated_at: new Date().toISOString()
				})
				.eq('lemon_squeezy_order_id', orderId);

			if (updateError) {
				console.error('❌ Error updating refund:', updateError);
			} else {
				console.log('✅ Refund processed successfully');
			}
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
