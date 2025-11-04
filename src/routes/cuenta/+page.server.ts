import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	// Redirigir al login si no está autenticado
	if (!session) {
		throw redirect(303, '/login?redirectTo=/cuenta');
	}

	const userId = session.user.id;

	// Obtener todas las órdenes del usuario con tickets individuales
	const { data: orders, error: ordersError } = await supabaseAdmin
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
	}

	// Obtener perfil del usuario
	const { data: profile, error: profileError } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (profileError) {
		console.error('Error fetching profile:', profileError);
	}

	// Para cada orden, obtener los nombres de los tickets
	const ordersWithTicketDetails = await Promise.all(
		(orders || []).map(async (order) => {
			const ticketIds = Object.keys(order.tickets_data);
			
			const { data: ticketTypes } = await supabaseAdmin
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
		user: session.user,
		profile: profile || null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const session = locals.session;

		if (!session) {
			return fail(401, { message: 'No autenticado' });
		}

		const formData = await request.formData();
		const first_name = formData.get('first_name') as string;
		const last_name = formData.get('last_name') as string;
		const phone = formData.get('phone') as string;
		const birth_date = formData.get('birth_date') as string;
		const document_type = formData.get('document_type') as string;
		const document_number = formData.get('document_number') as string;
		const city = formData.get('city') as string;
		const country = formData.get('country') as string;

		// Validación de campos requeridos
		if (!first_name || !last_name || !phone) {
			return fail(400, {
				message: 'Los campos Nombres, Apellidos y Teléfono son obligatorios'
			});
		}

		try {
			// Actualizar perfil
			const { error } = await supabaseAdmin
				.from('profiles')
				.update({
					first_name,
					last_name,
					phone,
					birth_date: birth_date || null,
					document_type: document_type || null,
					document_number: document_number || null,
					city: city || null,
					country: country || 'Ecuador',
					updated_at: new Date().toISOString()
				})
				.eq('id', session.user.id);

			if (error) {
				console.error('Error actualizando perfil:', error);
				return fail(500, { message: 'Error al actualizar el perfil' });
			}

			return { success: true, message: 'Perfil actualizado correctamente' };
		} catch (error) {
			console.error('Error:', error);
			return fail(500, { message: 'Error al actualizar el perfil' });
		}
	}
};
