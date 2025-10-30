import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

const APP_URL = PUBLIC_APP_URL || 'http://localhost:5173';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { eventId, eventTitle, tickets, totalAmount, ticketDetails } = await request.json();

		// Crear checkout directamente con la API de Lemon Squeezy
		// Esto NO requiere productos pre-configurados
		const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
			method: 'POST',
			headers: {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
			},
			body: JSON.stringify({
				data: {
					type: 'checkouts',
					attributes: {
						custom_price: Math.round(totalAmount * 100), // Precio en centavos
						checkout_data: {
							billing_address: {
								country: 'EC' // Ecuador por defecto
							},
							custom: {
								event_id: eventId,
								tickets: JSON.stringify(tickets)
							}
						},
						product_options: {
							name: `🎫 ${eventTitle}`,
							description: ticketDetails,
							receipt_button_text: 'Ver mis entradas',
							receipt_thank_you_note: '¡Gracias por tu compra! Tus entradas han sido enviadas a tu correo.'
						},
						checkout_options: {
							button_color: '#6366f1',
							locale: 'es' // Idioma español
						},
						preview: false,
						test_mode: true
					},
					relationships: {
						store: {
							data: {
								type: 'stores',
								id: LEMON_SQUEEZY_STORE_ID
							}
						},
						variant: {
							data: {
								type: 'variants',
								id: LEMON_SQUEEZY_VARIANT_ID
							}
						}
					}
				}
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Lemon Squeezy API Error:', errorData);
			return json({ 
				error: 'Error al crear el checkout',
				details: errorData 
			}, { status: 500 });
		}

		const data = await response.json();
		const checkoutUrl = data.data.attributes.url;

		return json({
			checkoutUrl,
			checkoutId: data.data.id
		});
	} catch (error) {
		console.error('Error:', error);
		return json({ 
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
