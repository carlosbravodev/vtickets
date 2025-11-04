import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { supabaseAdmin } from '$lib/supabaseAdmin';

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 *
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	event.locals.supabase = createServerClient(
		env.PUBLIC_SUPABASE_URL,
		env.PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies API requires `path` to be explicitly set in
				 * the cookie options. Setting `path` to `/` replicates previous/
				 * standard behavior.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Proteger rutas que requieren autenticación
	if (event.url.pathname.startsWith('/cuenta')) {
		if (!session) {
			redirect(303, '/login');
		}
	}

	// Si el usuario ya está autenticado, redirigir desde login
	if (event.url.pathname.startsWith('/login')) {
		if (session) {
			redirect(303, '/');
		}
	}

	return resolve(event);
};

const profileGuard: Handle = async ({ event, resolve }) => {
	const { session } = await event.locals.safeGetSession();

	// Solo verificar si el usuario está autenticado
	if (session?.user) {
		// Rutas públicas que NO requieren perfil completo
		const publicRoutes = [
			'/login',
			'/auth',
			'/eventos',
			'/evento',
			'/api',
			'/onboarding'
		];

		// Verificar si la ruta actual es pública
		const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

		// Si NO es ruta pública, verificar perfil
		if (!isPublicRoute) {
			try {
				const { data: profile } = await supabaseAdmin
					.from('profiles')
					.select('first_name, last_name, phone')
					.eq('id', session.user.id)
					.single();

				// Si el perfil no está completo, redirigir a onboarding
				if (!profile?.first_name || !profile?.last_name || !profile?.phone) {
					redirect(303, '/onboarding');
				}
			} catch (error) {
				console.error('Error verificando perfil:', error);
				// En caso de error, permitir continuar
			}
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard, profileGuard);
