import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { uploadEventImage } from '$lib/utils/storage';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;
	const { session } = await locals.safeGetSession();

	if (!session) {
		redirect(303, '/organizador/iniciar-sesion');
	}

	// Obtener el evento con sus tipos de tickets
	const { data: event, error } = await supabaseAdmin
		.from('events')
		.select(`
			*,
			ticket_types (
				id,
				name,
				price,
				initial_quantity,
				available_tickets,
				is_active
			)
		`)
		.eq('slug', slug)
		.eq('organizer_id', session.user.id) // Solo el dueño puede editar
		.single();

	if (error || !event) {
		redirect(303, '/organizador/eventos');
	}

	return {
		event,
		user: session.user
	};
};

export const actions = {
	default: async ({ request, params, locals }) => {
		const { slug } = params;
		const { session } = await locals.safeGetSession();

		if (!session) {
			return fail(401, { message: 'No autorizado' });
		}

		const formData = await request.formData();

		// Datos básicos del evento
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const venue = formData.get('venue') as string;
		const location = formData.get('location') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const imageFile = formData.get('image') as File;
		const keepCurrentImage = formData.get('keepCurrentImage') === 'true';

		// Validaciones
		if (!name || name.trim().length < 3) {
			return fail(400, { message: 'El nombre debe tener al menos 3 caracteres' });
		}

		if (!description || description.trim().length < 10) {
			return fail(400, { message: 'La descripción debe tener al menos 10 caracteres' });
		}

		if (!venue || venue.trim().length < 3) {
			return fail(400, { message: 'El lugar/recinto debe tener al menos 3 caracteres' });
		}

		if (!location || location.trim().length < 3) {
			return fail(400, { message: 'La ciudad debe tener al menos 3 caracteres' });
		}

		if (!date || !time) {
			return fail(400, { message: 'La fecha y hora son obligatorias' });
		}

		const eventDateTime = new Date(`${date}T${time}`);
		if (eventDateTime <= new Date()) {
			return fail(400, { message: 'La fecha y hora deben ser futuras' });
		}

		// Obtener evento actual
		const { data: currentEvent, error: fetchError } = await supabaseAdmin
			.from('events')
			.select('*')
			.eq('slug', slug)
			.eq('organizer_id', session.user.id)
			.single();

		if (fetchError || !currentEvent) {
			return fail(404, { message: 'Evento no encontrado' });
		}

		let imageUrl = currentEvent.image_url;

		// Si hay una nueva imagen, subirla
		if (!keepCurrentImage && imageFile && imageFile.size > 0) {
			const uploadResult = await uploadEventImage(imageFile, session.user.id);
			if ('error' in uploadResult) {
				return fail(500, { message: uploadResult.error || 'Error al subir la imagen' });
			}
			imageUrl = uploadResult.url;

			// Eliminar imagen anterior si existe
			if (currentEvent.image_url) {
				const oldPath = currentEvent.image_url.split('/').pop();
				if (oldPath) {
					await supabaseAdmin.storage.from('event-images').remove([`${session.user.id}/${oldPath}`]);
				}
			}
		}

		// Generar nuevo slug si cambió el nombre
		let newSlug = currentEvent.slug;
		if (name.trim() !== currentEvent.title) {
			const baseSlug = slugify(name);
			let slugCounter = 1;
			newSlug = baseSlug;

			// Verificar unicidad del slug (excluyendo el evento actual)
			while (true) {
				const { data: existingEvent } = await supabaseAdmin
					.from('events')
					.select('id')
					.eq('slug', newSlug)
					.neq('id', currentEvent.id)
					.single();

				if (!existingEvent) break;

				newSlug = `${baseSlug}-${slugCounter}`;
				slugCounter++;
			}
		}

		// Actualizar evento
		const { error: updateError } = await supabaseAdmin
			.from('events')
			.update({
				title: name.trim(),
				description: description.trim(),
				venue: venue.trim(),
				location: location.trim(),
				event_date: eventDateTime.toISOString(),
				image_url: imageUrl,
				slug: newSlug
			})
			.eq('id', currentEvent.id);

		if (updateError) {
			return fail(500, { message: `Error al actualizar el evento: ${updateError.message}` });
		}

		// Actualizar tipos de tickets
		const ticketTypesJson = formData.get('ticket_types') as string;
		if (ticketTypesJson) {
			try {
				const ticketTypes = JSON.parse(ticketTypesJson);

				// Obtener tickets actuales
				const { data: currentTickets } = await supabaseAdmin
					.from('ticket_types')
					.select('id, initial_quantity, available_tickets')
					.eq('event_id', currentEvent.id);

				const currentTicketsMap = new Map(currentTickets?.map(t => [t.id, t]) || []);

				for (const ticket of ticketTypes) {
					if (ticket.id && ticket.id.startsWith('existing-')) {
						// Actualizar ticket existente
						const existingId = ticket.id.replace('existing-', '');
						const currentTicket = currentTicketsMap.get(existingId);

						if (currentTicket) {
							// Calcular nuevos tickets disponibles si cambió la cantidad inicial
							let newAvailable = currentTicket.available_tickets;
							if (ticket.quantity !== currentTicket.initial_quantity) {
								const soldTickets = currentTicket.initial_quantity - currentTicket.available_tickets;
								newAvailable = Math.max(0, ticket.quantity - soldTickets);
							}

							await supabaseAdmin
								.from('ticket_types')
								.update({
									name: ticket.name.trim(),
									price: ticket.price,
									initial_quantity: ticket.quantity,
									available_tickets: newAvailable
								})
								.eq('id', existingId);
						}
					} else {
						// Crear nuevo tipo de ticket
						await supabaseAdmin
							.from('ticket_types')
							.insert({
								event_id: currentEvent.id,
								name: ticket.name.trim(),
								price: ticket.price,
								initial_quantity: ticket.quantity,
								available_tickets: ticket.quantity,
								is_active: true
							});
					}
				}
			} catch (error) {
				return fail(500, { message: 'Error al actualizar los tipos de tickets' });
			}
		}

		// Redirigir al evento actualizado (con el nuevo slug si cambió)
		redirect(303, `/organizador/eventos/${newSlug}?success=updated`);
	}
} satisfies Actions;
