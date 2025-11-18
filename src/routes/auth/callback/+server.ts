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
			// Obtener el perfil del usuario para verificar el rol
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', data.user.id)
				.single();

			if (profileError) {
				logger.error('Error fetching profile in callback:', profileError);
				await supabase.auth.signOut();
				redirect(303, `/${authType === 'organizer' ? 'organizador/' : ''}iniciar-sesion?error=profile_error`);
			}

			// Verificar que el rol coincida con el tipo de autenticación
			if (authType === 'buyer' && profile?.role !== 'buyer') {
				logger.warn('User with wrong role tried to login as buyer:', { 
					email: data.user.email, 
					role: profile?.role,
					expectedRole: 'buyer'
				});
				await supabase.auth.signOut();
				redirect(303, '/iniciar-sesion?error=wrong_role&message=Esta cuenta es de organizador. Por favor usa el login de organizadores.');
			}

			if (authType === 'organizer' && profile?.role !== 'organizer') {
				logger.warn('User with wrong role tried to login as organizer:', { 
					email: data.user.email, 
					role: profile?.role,
					expectedRole: 'organizer'
				});
				await supabase.auth.signOut();
				redirect(303, '/organizador/iniciar-sesion?error=wrong_role&message=Esta cuenta es de comprador. Por favor usa el login de compradores.');
			}

			// Si el rol es correcto, redirigir
			logger.log(`${authType} logged in successfully via OAuth:`, { email: data.user.email });
			redirect(303, redirectTo);
		}
	}

	// Si hay error, redirigir según el tipo de autenticación
	const loginPath = authType === 'organizer' ? '/organizador/iniciar-sesion' : '/iniciar-sesion';
	redirect(303, `${loginPath}?error=auth_callback_error`);
};
