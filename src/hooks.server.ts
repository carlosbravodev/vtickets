import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { logger } from '$lib/logger';

const supabase: Handle = async ({ event, resolve }) => {
event.locals.supabase = createServerClient(
env.PUBLIC_SUPABASE_URL,
env.PUBLIC_SUPABASE_ANON_KEY,
{
cookies: {
getAll: () => event.cookies.getAll(),
setAll: (cookiesToSet) => {
cookiesToSet.forEach(({ name, value, options }) => {
event.cookies.set(name, value, { ...options, path: '/' });
});
}
}
}
);

event.locals.safeGetSession = async () => {
	try {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		
		if (error) {
			logger.error('Error getting user in safeGetSession', error);
			return { session: null, user: null };
		}
		
		if (!user) {
			return { session: null, user: null };
		}

		// Solo obtener sesión si tenemos un usuario válido
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		return { session, user };
	} catch (error) {
		logger.error('Unexpected error in safeGetSession', error);
		return { session: null, user: null };
	}
};return resolve(event, {
filterSerializedResponseHeaders(name) {
return name === 'content-range' || name === 'x-supabase-api-version';
}
});
};

const authGuard: Handle = async ({ event, resolve }) => {
	try {
		const { session, user } = await event.locals.safeGetSession();
		event.locals.session = session;
		event.locals.user = user;

		if (event.url.pathname.startsWith('/cuenta')) {
			if (!session) {
				redirect(303, '/iniciar-sesion');
			}
		}

		if (event.url.pathname.startsWith('/iniciar-sesion')) {
			if (session) {
				redirect(303, '/');
			}
		}

		return resolve(event);
	} catch (error) {
		// Si es un redirect intencional, dejarlo pasar
		if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
			throw error;
		}
		
		// Cualquier otro error, loggearlo y dejar continuar
		logger.error('Error in authGuard', error, { path: event.url.pathname });
		return resolve(event);
	}
};

const profileGuard: Handle = async ({ event, resolve }) => {
	try {
		const { session, user } = await event.locals.safeGetSession();

		if (session && user) {
			// Rutas excluidas del chequeo de perfil completo
			// - Rutas públicas: eventos, inicio
			// - Rutas de autenticación: login, callback
			// - Rutas de API: se manejan internamente
			// - La propia ruta de completar perfil
			const excludedRoutes = ['/iniciar-sesion', '/auth', '/api', '/completar-perfil', '/evento', '/eventos', '/'];
			const isExcluded = excludedRoutes.some((route) => event.url.pathname.startsWith(route));

			// Solo verificar perfil completo en rutas protegidas como /cuenta
			if (!isExcluded) {
				try {
					const { data: profile, error: profileError } = await supabaseAdmin
						.from('profiles')
						.select('first_name, last_name, phone, document_number')
						.eq('id', user.id)
						.single();

					if (profileError) {
						logger.error('Error fetching profile in profileGuard', profileError, { 
							userId: user.id,
							path: event.url.pathname
						});
						// Redirigir a completar perfil en caso de error al obtener el perfil
						const redirectTo = event.url.pathname + event.url.search;
						throw redirect(303, `/completar-perfil?redirectTo=${encodeURIComponent(redirectTo)}`);
					}

					if (!profile?.first_name || !profile?.last_name || !profile?.phone || !profile?.document_number) {
						// Preservar la URL original como redirectTo
						const redirectTo = event.url.pathname + event.url.search;
						throw redirect(303, `/completar-perfil?redirectTo=${encodeURIComponent(redirectTo)}`);
					}
				} catch (error) {
					// Si es un redirect intencional, dejarlo pasar
					if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
						throw error;
					}
					
					// Para cualquier otro error, loggear y redirigir a completar perfil
					logger.error('Unexpected error in profileGuard', error, {
						userId: user.id,
						path: event.url.pathname
					});
					const redirectTo = event.url.pathname + event.url.search;
					throw redirect(303, `/completar-perfil?redirectTo=${encodeURIComponent(redirectTo)}`);
				}
			}
		}

		return resolve(event);
	} catch (error) {
		// Si es un redirect intencional, dejarlo pasar
		if (error && typeof error === 'object' && 'status' in error && (error.status === 303 || error.status === 302)) {
			throw error;
		}
		
		// Cualquier otro error, loggear y dejar continuar
		logger.error('Unexpected error in profileGuard outer catch', error, {
			path: event.url.pathname
		});
		return resolve(event);
	}
};

export const handle: Handle = sequence(supabase, authGuard, profileGuard);
