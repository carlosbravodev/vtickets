import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/logger';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const redirectTo = url.searchParams.get('redirectTo') ?? '/';
	const authType = url.searchParams.get('authType') ?? 'buyer'; // buyer u organizer

	if (code) {
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);
		
		if (!error && data.user) {
			// Obtener TODOS los perfiles del usuario (puede tener múltiples roles)
			const { data: profiles, error: profileError } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', data.user.id);

			if (profileError) {
				logger.error('Error fetching profiles in callback:', profileError);
				// Si hay error obteniendo perfiles, redirigir a completar perfil
				redirect(303, '/completar-perfil');
			}

			// Si no tiene perfiles, crear uno con el rol solicitado
			if (!profiles || profiles.length === 0) {
				logger.log('New OAuth user, creating profile with role:', authType);
				const role = authType === 'organizer' ? 'organizer' : 'buyer';
				
				const { error: insertError } = await supabase
					.from('profiles')
					.insert({
						id: data.user.id,
						email: data.user.email,
						role: role
					});

				if (insertError) {
					logger.error('Error creating profile in callback:', insertError);
					redirect(303, '/completar-perfil');
				}
				
				logger.log(`${authType} profile created successfully via OAuth:`, { email: data.user.email });
				redirect(303, redirectTo);
			}

			// Verificar si el usuario tiene el rol solicitado
			const requestedRole = authType === 'organizer' ? 'organizer' : 'buyer';
			const hasRequestedRole = profiles.some(p => p.role === requestedRole);

			if (!hasRequestedRole) {
				// Usuario existe pero no tiene el rol solicitado
				const availableRoles = profiles.map(p => p.role).join(', ');
				logger.warn('User tried to login with unavailable role:', { 
					email: data.user.email, 
					availableRoles,
					requestedRole
				});
				
				// No cerramos sesión, solo redirigimos a la sección correcta
				const correctPath = profiles[0].role === 'organizer' ? '/organizador' : '/';
				redirect(303, correctPath);
			}

			// Usuario tiene el rol correcto, redirigir
			logger.log(`${authType} logged in successfully via OAuth:`, { email: data.user.email, roles: profiles.map(p => p.role) });
			redirect(303, redirectTo);
		}
	}

	// Si hay error, redirigir según el tipo de autenticación
	const loginPath = authType === 'organizer' ? '/organizador/iniciar-sesion' : '/iniciar-sesion';
	redirect(303, `${loginPath}?error=auth_callback_error`);
};
