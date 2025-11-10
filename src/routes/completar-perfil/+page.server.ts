import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;

	// Redirigir a iniciar sesión si no está autenticado
	if (!session) {
		throw redirect(303, '/iniciar-sesion?redirectTo=/completar-perfil');
	}

	const userId = session.user.id;

	// Obtener perfil actual
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	// Obtener el redirectTo de la URL
	const redirectTo = url.searchParams.get('redirectTo') || '/cuenta';

	// Si el perfil ya está completo, redirigir al destino
	if (profile?.first_name && profile?.last_name && profile?.phone && profile?.document_number) {
		throw redirect(303, redirectTo);
	}

	return {
		user: session.user,
		profile: profile || null,
		redirectTo
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
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
		const redirectTo = formData.get('redirectTo') as string || '/cuenta';

		// Validaciones básicas
		if (!first_name || !last_name || !phone || !document_number) {
			return fail(400, {
				message: 'Nombre, apellido, teléfono y número de documento son obligatorios',
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
				document_type: document_type || 'cedula',
				document_number,
				birth_date: birth_date || null,
				city: city || null,
				country: country || 'Ecuador',
				updated_at: new Date().toISOString()
			})
			.eq('id', session.user.id);

		if (error) {
			console.error('Error updating profile:', error);
			return fail(500, { message: 'Error al actualizar el perfil' });
		}

		// Redirigir al destino original o a /cuenta
		throw redirect(303, redirectTo);
	}
};
