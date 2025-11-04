import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	// Redirigir al login si no está autenticado
	if (!session) {
		throw redirect(303, '/login?redirectTo=/onboarding');
	}

	const userId = session.user.id;

	// Obtener perfil actual
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	// Si el perfil ya está completo, redirigir a /cuenta
	if (profile?.first_name && profile?.last_name && profile?.phone) {
		throw redirect(303, '/cuenta');
	}

	return {
		user: session.user,
		profile: profile || null
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session;

		if (!session) {
			return fail(401, { message: 'No autorizado' });
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

		// Validaciones básicas
		if (!first_name || !last_name || !phone) {
			return fail(400, {
				message: 'Nombre, apellido y teléfono son obligatorios',
				first_name,
				last_name,
				phone
			});
		}

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
			console.error('Error updating profile:', error);
			return fail(500, { message: 'Error al actualizar el perfil' });
		}

		// Redirigir a /cuenta después de completar
		throw redirect(303, '/cuenta');
	}
};
