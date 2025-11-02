import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { eventId, eventTitle, tickets, totalAmount, ticketDetails } = await request.json();

		// Obtener variables de entorno
		const apiKey = env.LEMON_SQUEEZY_API_KEY;
		const storeId = env.LEMON_SQUEEZY_STORE_ID;
		const variantId = env.LEMON_SQUEEZY_VARIANT_ID;
		const appUrl = publicEnv.PUBLIC_APP_URL || 'http://localhost:5173';

		// Validar que las variables estén configuradas
		if (!apiKey || !storeId || !variantId) {
			console.error('Missing Lemon Squeezy configuration');
			return json({ error: 'Server configuration error' }, { status: 500 });
		}

		// Obtener buyer_id si el usuario está autenticado
		// Nota: Esto funcionará cuando implementemos la Fase 2 (Hooks y Sesión)
		const buyerId = locals.session?.user?.id || null;

		// Preparar custom data para el webhook
		const customData: any = {
			event_id: eventId,
			tickets: JSON.stringify(tickets)
		};

		// Agregar buyer_id si el usuario está autenticado
		if (buyerId) {
			customData.buyer_id = buyerId;
		}

		// Crear checkout directamente con la API de Lemon Squeezy
		// Esto NO requiere productos pre-configurados
		const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
			method: 'POST',
			headers: {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${apiKey}`
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
							custom: customData
						},
						product_options: {
							name: `🎫 ${eventTitle}`,
							description: ticketDetails,
							receipt_button_text: 'Ver mis entradas',
							receipt_link_url: `${appUrl}/cuenta`,
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
								id: storeId
							}
						},
						variant: {
							data: {
								type: 'variants',
								id: variantId
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
