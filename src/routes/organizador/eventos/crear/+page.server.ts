import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { uploadEventImage } from '$lib/utils/storage';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		redirect(303, '/organizador/iniciar-sesion');
	}

	// Verificar que el usuario tiene rol de organizador
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.eq('role', 'organizer')
		.single();

	if (!profile) {
		redirect(303, '/organizador/iniciar-sesion');
	}

	return {
		user: session.user
	};
};

export const actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { message: 'No autorizado' });
		}

		const formData = await request.formData();

		// Log para debugging
		console.log('FormData entries:');
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				console.log(`${key}:`, value.name, value.size, value.type);
			} else {
				console.log(`${key}:`, value);
			}
		}

		// Datos básicos del evento
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const venue = formData.get('venue') as string;
		const location = formData.get('location') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const imageFile = formData.get('image') as File;

		// Validaciones
		if (!name || name.trim().length < 3) {
			return fail(400, { 
				message: 'El nombre debe tener al menos 3 caracteres', 
				field: 'name',
				debug: { name, length: name?.length }
			});
		}

		if (!description || description.trim().length < 10) {
			return fail(400, {
				message: 'La descripción debe tener al menos 10 caracteres',
				field: 'description'
			});
		}

		if (!venue || venue.trim().length < 3) {
			return fail(400, {
				message: 'El lugar/recinto debe tener al menos 3 caracteres',
				field: 'venue'
			});
		}

		if (!location || location.trim().length < 3) {
			return fail(400, {
				message: 'La ciudad debe tener al menos 3 caracteres',
				field: 'location'
			});
		}

		if (!date) {
			return fail(400, { message: 'La fecha es obligatoria', field: 'date' });
		}

		if (!time) {
			return fail(400, { message: 'La hora es obligatoria', field: 'time' });
		}

		// Validar que la fecha sea futura
		const eventDateTime = new Date(`${date}T${time}`);
		if (eventDateTime <= new Date()) {
			return fail(400, {
				message: 'La fecha y hora del evento deben ser futuras',
				field: 'date'
			});
		}

		if (!imageFile || imageFile.size === 0) {
			return fail(400, { message: 'La imagen es obligatoria', field: 'image' });
		}

		// Log del tamaño de imagen recibida
		console.log('📸 Image received:', {
			name: imageFile.name,
			size: imageFile.size,
			sizeMB: (imageFile.size / 1024 / 1024).toFixed(2) + 'MB',
			type: imageFile.type
		});

		// Tipos de tickets (JSON string)
		const ticketTypesJson = formData.get('ticket_types') as string;
		let ticketTypes: Array<{
			name: string;
			price: number;
			quantity: number;
			description?: string;
		}> = [];

		try {
			ticketTypes = JSON.parse(ticketTypesJson || '[]');
		} catch (e) {
			return fail(400, { message: 'Formato de tickets inválido' });
		}

		if (ticketTypes.length === 0) {
			return fail(400, { message: 'Debes crear al menos un tipo de ticket', field: 'tickets' });
		}

		// Validar cada tipo de ticket
		for (const ticket of ticketTypes) {
			if (!ticket.name || ticket.name.trim().length < 2) {
				return fail(400, {
					message: 'Todos los tipos de ticket deben tener un nombre válido',
					field: 'tickets'
				});
			}
			if (ticket.price < 0) {
				return fail(400, {
					message: 'El precio no puede ser negativo',
					field: 'tickets'
				});
			}
			if (ticket.quantity < 1) {
				return fail(400, {
					message: 'La cantidad debe ser al menos 1',
					field: 'tickets'
				});
			}
		}

		let eventSlug: string; // Variable para guardar el slug del evento creado

		try {
			console.log('🚀 Starting event creation...');
			
			// 1. Subir imagen primero
			console.log('📸 Uploading image...', { size: imageFile.size, type: imageFile.type });
			const uploadResult = await uploadEventImage(imageFile, session.user.id);

			if ('error' in uploadResult) {
				console.error('❌ Image upload failed:', uploadResult.error);
				return fail(400, { message: uploadResult.error, field: 'image' });
			}

			console.log('✅ Image uploaded:', uploadResult.url);

			// 2. Generar slug único
			const baseSlug = slugify(name);
			let slug = baseSlug;
			let slugCounter = 1;

			// Verificar si el slug ya existe
			console.log('🔍 Checking slug uniqueness...');
			while (true) {
				const { data: existingEvent } = await supabase
					.from('events')
					.select('id')
					.eq('slug', slug)
					.single();

				if (!existingEvent) break;

				slug = `${baseSlug}-${slugCounter}`;
				slugCounter++;
			}

			console.log('✅ Slug generated:', slug);

			// 3. Crear evento
			console.log('📝 Creating event...');
			const { data: event, error: eventError } = await supabase
				.from('events')
				.insert({
					title: name.trim(),
					description: description.trim(),
					venue: venue.trim(),
					location: location.trim(),
					event_date: eventDateTime.toISOString(),
					image_url: uploadResult.url,
					slug: slug,
					organizer_id: session.user.id,
					created_by: session.user.id
				})
				.select()
				.single();

			if (eventError) {
				console.error('❌ Event creation failed:', eventError);
				// Si falla, eliminar la imagen subida
				await supabase.storage.from('event-images').remove([uploadResult.path]);
				return fail(500, { message: `Error al crear el evento: ${eventError.message}` });
			}

			console.log('✅ Event created:', event.id);
			eventSlug = event.slug; // Guardar el slug para usar después del try-catch

			// 4. Crear tipos de tickets
			console.log('🎫 Creating ticket types...', ticketTypes.length);
			const ticketsToInsert = ticketTypes.map((ticket) => ({
				event_id: event.id,
				name: ticket.name.trim(),
				price: ticket.price,
				initial_quantity: ticket.quantity,
				available_tickets: ticket.quantity,
				is_active: true
			}));

			const { error: ticketsError } = await supabase
				.from('ticket_types')
				.insert(ticketsToInsert);

			if (ticketsError) {
				console.error('❌ Tickets creation failed:', ticketsError);
				// Rollback: eliminar evento e imagen
				await supabase.from('events').delete().eq('id', event.id);
				await supabase.storage.from('event-images').remove([uploadResult.path]);
				return fail(500, { message: `Error al crear los tipos de tickets: ${ticketsError.message}` });
			}

			console.log('✅ All tickets created successfully');
			console.log('🎉 Event creation completed!');
		} catch (error) {
			console.error('💥 Unexpected error creating event:', error);
			return fail(500, { 
				message: 'Error inesperado al crear el evento',
				debug: error instanceof Error ? error.message : String(error)
			});
		}

		// Éxito - redirigir al listado de eventos (fuera del try-catch)
		redirect(303, `/organizador/eventos?success=created&event=${eventSlug}`);
	}
} satisfies Actions;
