import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { eventId, eventTitle, tickets, totalAmount, ticketDetails } = await request.json();

		// Validar que tickets no esté vacío
		if (!tickets || Object.keys(tickets).length === 0) {
			return json({ 
				error: 'No se han seleccionado entradas',
				message: 'Por favor selecciona al menos una entrada'
			}, { status: 400 });
		}

		// Validar que todas las cantidades sean > 0
		for (const [ticketId, quantity] of Object.entries(tickets)) {
			if (typeof quantity !== 'number' || quantity <= 0) {
				return json({ 
					error: 'Cantidad inválida',
					message: 'La cantidad de entradas debe ser mayor a 0'
				}, { status: 400 });
			}
		}

		// Validar que el totalAmount sea > 0
		if (!totalAmount || totalAmount <= 0) {
			return json({ 
				error: 'Monto inválido',
				message: 'El monto total debe ser mayor a 0'
			}, { status: 400 });
		}

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
	const buyerId = locals.session?.user?.id || null;
	const userEmail = locals.session?.user?.email || null;

	// Verificar que el usuario esté autenticado
	if (!buyerId || !userEmail) {
		return json({ 
			error: 'Usuario no autenticado',
			redirectTo: '/iniciar-sesion'
		}, { status: 401 });
	}

	// Obtener perfil del usuario
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('first_name, last_name, document_number, city, country, phone')
		.eq('id', buyerId)
		.single();

	// Verificar que el perfil esté completo
	if (!profile?.first_name || !profile?.last_name || !profile?.document_number || !profile?.phone) {
		return json({ 
			error: 'Perfil incompleto',
			message: 'Por favor completa tu perfil antes de realizar una compra',
			redirectTo: '/completar-perfil'
		}, { status: 400 });
	}

	// Verificar stock disponible para cada tipo de ticket
	const ticketIds = Object.keys(tickets);
	const { data: ticketTypes, error: ticketError } = await supabaseAdmin
		.from('ticket_types')
		.select('id, name, available_tickets, event_id')
		.in('id', ticketIds)
		.eq('event_id', eventId);

	if (ticketError) {
		console.error('Error fetching ticket types:', ticketError);
		return json({ 
			error: 'Error al verificar disponibilidad',
			message: 'No se pudo verificar el stock de las entradas'
		}, { status: 500 });
	}

	// Validar que todos los tickets existen y pertenecen al evento
	if (!ticketTypes || ticketTypes.length !== ticketIds.length) {
		return json({ 
			error: 'Entradas inválidas',
			message: 'Algunos tipos de entrada no existen o no pertenecen a este evento'
		}, { status: 400 });
	}

	// Verificar que el evento no haya pasado
	const { data: eventData, error: eventError } = await supabaseAdmin
		.from('events')
		.select('event_date, title')
		.eq('id', eventId)
		.single();

	if (eventError) {
		console.error('Error fetching event:', eventError);
		return json({ 
			error: 'Error al verificar evento',
			message: 'No se pudo verificar la información del evento'
		}, { status: 500 });
	}

	const eventDate = new Date(eventData.event_date);
	const now = new Date();

	if (eventDate < now) {
		return json({ 
			error: 'Evento finalizado',
			message: 'Lo sentimos, este evento ya ha pasado y las entradas ya no están disponibles'
		}, { status: 400 });
	}

	// Verificar stock suficiente para cada tipo
	for (const ticketType of ticketTypes) {
		const requestedQuantity = tickets[ticketType.id];
		
		if (requestedQuantity > ticketType.available_tickets) {
			return json({ 
				error: 'Stock insuficiente',
				message: `Lo sentimos, solo quedan ${ticketType.available_tickets} entradas disponibles para "${ticketType.name}"`
			}, { status: 400 });
		}
		
		// También verificar que no se pidan más de 10 entradas por tipo
		if (requestedQuantity > 10) {
			return json({ 
				error: 'Límite excedido',
				message: `El máximo de entradas por tipo es 10`
			}, { status: 400 });
		}
	}
	// Preparar custom data para el webhook
	const customData: any = {
		event_id: eventId,
		tickets: JSON.stringify(tickets),
		buyer_name: `${profile.first_name} ${profile.last_name}`.trim() // Agregar nombre del comprador
	};

	// Agregar buyer_id si el usuario está autenticado
	if (buyerId) {
		customData.buyer_id = buyerId;
	}		// Preparar datos de checkout prellenados
		const checkoutData: any = {
			custom: customData,
			billing_address: {
				country: 'EC' // Ecuador por defecto
			}
		};

	// Prellenar datos del usuario en el checkout
	checkoutData.email = userEmail;
	checkoutData.name = `${profile.first_name} ${profile.last_name}`.trim();
	checkoutData.tax_number = profile.document_number;		// Crear checkout directamente con la API de Lemon Squeezy
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
						checkout_data: checkoutData,
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
