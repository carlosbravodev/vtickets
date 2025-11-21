import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const session = await locals.safeGetSession();
	if (!session) {
		throw redirect(303, '/iniciar-sesion');
	}

	const { event_id } = params;

	// Verificar que el evento existe y el usuario es el organizador
	const { data: event, error: eventError } = await supabaseAdmin
		.from('events')
		.select('id, title, created_by')
		.eq('id', event_id)
		.single();

	if (eventError || !event) {
		throw error(404, 'Evento no encontrado');
	}

	if (event.created_by !== session.user?.id) {
		throw error(403, 'No tienes permiso para ver el historial de este evento');
	}

	// Parámetros de paginación y filtros
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = 20;
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	// Filtros opcionales
	const dateFrom = url.searchParams.get('dateFrom');
	const dateTo = url.searchParams.get('dateTo');
	const verifierId = url.searchParams.get('verifier');

	// Query base para obtener verificaciones
	let query = supabaseAdmin
		.from('ticket_verifications')
		.select(
			`
			id,
			verified_at,
			device_info,
			ticket_id,
			verified_by
		`,
			{ count: 'exact' }
		)
		.eq('event_id', event_id)
		.order('verified_at', { ascending: false });

	// Aplicar filtros de fecha si existen
	if (dateFrom) {
		query = query.gte('verified_at', `${dateFrom}T00:00:00Z`);
	}
	if (dateTo) {
		query = query.lte('verified_at', `${dateTo}T23:59:59Z`);
	}
	if (verifierId) {
		query = query.eq('verified_by', verifierId);
	}

	// Aplicar paginación
	query = query.range(from, to);

	const { data: rawVerifications, error: verificationsError, count } = await query;

	if (verificationsError) {
		throw error(500, 'Error al cargar historial de verificaciones');
	}

	// Enriquecer con datos de tickets y usuarios
	const verifications = await Promise.all(
		(rawVerifications || []).map(async (v) => {
			const [ticketData, userData] = await Promise.all([
				supabaseAdmin
					.from('tickets')
					.select('id, code, ticket_types(id, name, price), orders(id, customer_name, customer_email)')
					.eq('id', v.ticket_id)
					.single(),
				supabaseAdmin.auth.admin.getUserById(v.verified_by)
			]);

			return {
				...v,
				ticket: ticketData.data ? {
					...ticketData.data,
					ticket_type: Array.isArray(ticketData.data.ticket_types) ? ticketData.data.ticket_types[0] : ticketData.data.ticket_types,
					order: Array.isArray(ticketData.data.orders) ? ticketData.data.orders[0] : ticketData.data.orders
				} : null,
				verifier: userData.data.user ? { email: userData.data.user.email } : null
			};
		})
	);

	// Obtener lista de verificadores únicos para el filtro
	const { data: verifierIds } = await supabaseAdmin
		.from('ticket_verifications')
		.select('verified_by')
		.eq('event_id', event_id);

	// Obtener emails de los verificadores
	const uniqueVerifierIds = [...new Set(verifierIds?.map((v) => v.verified_by))];
	const verifiersData = await Promise.all(
		uniqueVerifierIds.map(async (id) => {
			const { data } = await supabaseAdmin.auth.admin.getUserById(id);
			return { id, email: data.user?.email || 'Unknown' };
		})
	);

	return {
		event: {
			id: event.id,
			title: event.title
		},
		verifications: verifications || [],
		pagination: {
			currentPage: page,
			perPage,
			totalItems: count || 0,
			totalPages: Math.ceil((count || 0) / perPage)
		},
		filters: {
			dateFrom,
			dateTo,
			verifierId
		},
		verifiers: verifiersData
	};
};
