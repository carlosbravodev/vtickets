import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		const session = locals.session;
		const user = locals.user;

		// Redirigir a iniciar sesión si no está autenticado
		if (!session || !user) {
			throw redirect(303, '/iniciar-sesion?redirectTo=/completar-perfil');
		}

		const userId = user.id;

		// Obtener perfil actual
		const { data: profile, error: profileError } = await supabaseAdmin
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();

		if (profileError) {
			logger.error('Error fetching profile in completar-perfil load:', profileError);
			// Continuar sin datos de perfil si hay error
		}

		// Obtener el redirectTo de la URL
		const redirectTo = url.searchParams.get('redirectTo') || '/cuenta';

		// Si el perfil ya está completo, redirigir al destino
		if (profile?.first_name && profile?.last_name && profile?.phone && profile?.document_number) {
			throw redirect(303, redirectTo);
		}

		return {
			user: user,
			profile: profile || null,
			redirectTo
		};
	} catch (error) {
		// Si es un redirect intencional, dejarlo pasar
		if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
			throw error;
		}
		
		logger.error('Unexpected error in completar-perfil load:', error);
		throw redirect(303, '/iniciar-sesion');
	}
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		try {
			const session = locals.session;
			const user = locals.user;

			if (!session || !user) {
				return fail(401, { message: 'No autorizado. Por favor inicia sesión.' });
			}

			const formData = await request.formData();
			const first_name = (formData.get('first_name') as string)?.trim();
			const last_name = (formData.get('last_name') as string)?.trim();
			const phone = (formData.get('phone') as string)?.trim();
			const birth_date = formData.get('birth_date') as string;
			const document_type = formData.get('document_type') as string;
			const document_number = (formData.get('document_number') as string)?.trim();
			const city = (formData.get('city') as string)?.trim();
			const country = (formData.get('country') as string)?.trim();
			const redirectTo = formData.get('redirectTo') as string || '/cuenta';

			// Validaciones básicas
			if (!first_name || !last_name || !phone || !document_number) {
				return fail(400, {
					message: 'Nombre, apellido, teléfono y número de documento son obligatorios.',
					first_name,
					last_name,
					phone,
					document_number
				});
			}

			// Validación de longitud mínima
			if (first_name.length < 2 || last_name.length < 2) {
				return fail(400, {
					message: 'El nombre y apellido deben tener al menos 2 caracteres.',
					first_name,
					last_name,
					phone,
					document_number
				});
			}

			// Validación de teléfono (mínimo 7 dígitos)
			if (phone.length < 7) {
				return fail(400, {
					message: 'El número de teléfono debe tener al menos 7 dígitos.',
					first_name,
					last_name,
					phone,
					document_number
				});
			}

			// Validación de número de documento (mínimo 6 caracteres)
			if (document_number.length < 6) {
				return fail(400, {
					message: 'El número de documento debe tener al menos 6 caracteres.',
					first_name,
					last_name,
					phone,
					document_number
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
				.eq('id', user.id);

			if (error) {
				logger.error('Error updating profile:', error);
				return fail(500, { 
					message: 'Error al actualizar el perfil. Por favor intenta de nuevo.',
					first_name,
					last_name,
					phone,
					document_number
				});
			}

			logger.log('Profile updated successfully for user:', user.id);

			// Redirigir al destino original o a /cuenta
			throw redirect(303, redirectTo);
		} catch (error) {
			// Si es un redirect intencional, dejarlo pasar
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}
			
			logger.error('Unexpected error in completar-perfil action:', error);
			return fail(500, {
				message: 'Error inesperado del servidor. Por favor intenta de nuevo más tarde.'
			});
		}
	}
};
