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
			// Error obteniendo usuario (puede ser normal si no hay sesión)
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

// Middleware para detectar subdomain
const subdomainDetection: Handle = async ({ event, resolve }) => {
	// Obtener el host de la petición
	const host = event.request.headers.get('host') || '';
	
	// Detectar si estamos en el subdomain de admin
	const isAdminSubdomain = host.startsWith('admin.') || host.startsWith('admin-');
	
	// Almacenar en locals para usar en toda la app
	event.locals.isAdminSubdomain = isAdminSubdomain;
	
	return resolve(event);
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

// Middleware para proteger rutas según rol del usuario
const roleGuard: Handle = async ({ event, resolve }) => {
	try {
		const { session, user } = await event.locals.safeGetSession();

		if (session && user) {
			// Obtener el rol del usuario desde la base de datos
			const { data: profile } = await supabaseAdmin
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			const userRole = profile?.role;

			// PROTECCIÓN 1: Organizadores no pueden acceder a rutas de compradores
			if (userRole === 'organizer') {
				const buyerRoutes = ['/cuenta', '/exito', '/completar-perfil'];
				const isBuyerRoute = buyerRoutes.some(route => event.url.pathname.startsWith(route));
				
				// También bloquear acceso a páginas principales de compradores
				const isBuyerPage = 
					event.url.pathname === '/' || 
					event.url.pathname === '/eventos' ||
					event.url.pathname.startsWith('/evento/');
				
				if (isBuyerRoute || isBuyerPage) {
					logger.warn('Organizer tried to access buyer route:', {
						userId: user.id,
						email: user.email,
						path: event.url.pathname
					});
					
					// Redirigir al dashboard de organizador con mensaje de toast
					throw redirect(303, '/organizador?toast=error&message=' + encodeURIComponent('Tu cuenta de organizador no tiene acceso a esta sección'));
				}
			}

			// PROTECCIÓN 2: Compradores no pueden acceder a rutas de organizadores
			if (userRole === 'buyer') {
				if (event.url.pathname.startsWith('/organizador')) {
					logger.warn('Buyer tried to access organizer route:', {
						userId: user.id,
						email: user.email,
						path: event.url.pathname
					});
					
					// Redirigir a la página de cuenta con mensaje de toast
					throw redirect(303, '/cuenta?toast=error&message=' + encodeURIComponent('Tu cuenta de comprador no tiene acceso a esta sección'));
				}
			}

			// PROTECCIÓN 3: Redirección basada en subdomain (TEMPORALMENTE DESHABILITADA)
			// TODO: Habilitar cuando el dominio admin.vtickets.com esté configurado
			/*
			const isAdminSubdomain = event.locals.isAdminSubdomain;
			const host = event.request.headers.get('host') || '';
			const isProduction = !host.includes('localhost') && !host.includes('127.0.0.1');

			if (isProduction) {
				if (isAdminSubdomain && userRole === 'buyer') {
					throw redirect(303, 'https://vtickets.com/cuenta');
				}

				if (!isAdminSubdomain && userRole === 'organizer') {
					throw redirect(303, 'https://admin.vtickets.com/organizador');
				}
			}
			*/
		}

		return resolve(event);
	} catch (error) {
		// Si es un redirect intencional, dejarlo pasar
		if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
			throw error;
		}
		
		// Cualquier otro error, loggearlo y dejar continuar
		logger.error('Error in roleGuard', error, { path: event.url.pathname });
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

export const handle: Handle = sequence(supabase, subdomainDetection, authGuard, roleGuard, profileGuard);
