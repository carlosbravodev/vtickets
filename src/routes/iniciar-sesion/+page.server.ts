import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logger } from '$lib/logger';
import { supabaseAdmin } from '$lib/supabaseAdmin';

// Función para traducir errores de Supabase a español
function translateSupabaseError(error: any): string {
	const errorMessage = error?.message?.toLowerCase() || '';
	
	// Errores de autenticación
	if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
		return 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
	}
	
	if (errorMessage.includes('email not confirmed')) {
		return 'Por favor confirma tu correo electrónico antes de iniciar sesión.';
	}
	
	if (errorMessage.includes('user already registered') || errorMessage.includes('already exists')) {
		return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
	}
	
	if (errorMessage.includes('password')) {
		return 'La contraseña debe tener al menos 6 caracteres.';
	}
	
	if (errorMessage.includes('rate limit')) {
		return 'Demasiados intentos. Por favor espera un momento e inténtalo de nuevo.';
	}
	
	if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
		return 'Error de conexión. Por favor verifica tu internet e inténtalo de nuevo.';
	}
	
	// Error genérico si no se reconoce
	return `Error inesperado: ${error.message || 'Por favor intenta de nuevo más tarde.'}`;
}

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
	// Si ya está autenticado como comprador, redirigir
	const { session, user } = await safeGetSession();
	
	if (session && user) {
		// Verificar que sea comprador
		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();
		
		// Solo redirigir si es comprador
		if (profile?.role === 'buyer') {
			// Redirigir a la página solicitada o a la home
			const redirectTo = url.searchParams.get('redirectTo') || '/';
			redirect(303, redirectTo);
		}
	}
	
	return {};
};

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;
			const password = formData.get('password') as string;
			const redirectTo = formData.get('redirectTo') as string || '/';

			// Validación básica
			if (!email || !password) {
				return fail(400, {
					email,
					message: 'Por favor completa todos los campos.',
					success: false
				});
			}

			const { data: authData, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				logger.error('Login error:', error);
				return fail(400, {
					email,
					message: translateSupabaseError(error),
					success: false
				});
			}

			// ⭐ VALIDACIÓN DE ROL: Verificar que el usuario sea comprador
			if (authData?.user) {
				const { data: profile, error: profileError } = await supabase
					.from('profiles')
					.select('role')
					.eq('id', authData.user.id)
					.single();

				if (profileError) {
					logger.error('Error fetching profile role:', profileError);
					// Cerrar sesión si hay error
					await supabase.auth.signOut();
					return fail(500, {
						email,
						message: 'Error al verificar permisos. Por favor intenta de nuevo.',
						success: false
					});
				}

				// Verificar que el rol sea 'buyer'
				if (profile?.role !== 'buyer') {
					logger.warn('Organizer tried to login as buyer:', { email, role: profile?.role });
					// Cerrar sesión
					await supabase.auth.signOut();
					return fail(403, {
						email,
						message: 'Esta cuenta es de organizador. Por favor usa el login de organizadores en admin.vtickets.com',
						success: false
					});
				}

				logger.log('Buyer logged in successfully:', { email, userId: authData.user.id });
			}

			redirect(303, redirectTo);
		} catch (error) {
			// Si es un redirect intencional, dejarlo pasar
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}
			
			logger.error('Unexpected error in login:', error);
			return fail(500, {
				message: 'Error interno del servidor. Por favor intenta de nuevo.',
				success: false
			});
		}
	},

	registro: async ({ request, locals: { supabase } }) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;
			const password = formData.get('password') as string;
			const redirectTo = formData.get('redirectTo') as string || '/';

			// Validación básica
			if (!email || !password) {
				return fail(400, {
					email,
					message: 'Por favor completa todos los campos.',
					success: false
				});
			}

			// Validación de formato de email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return fail(400, {
					email,
					message: 'Por favor ingresa un correo electrónico válido.',
					success: false
				});
			}

			// Validación de longitud de contraseña
			if (password.length < 6) {
				return fail(400, {
					email,
					message: 'La contraseña debe tener al menos 6 caracteres.',
					success: false
				});
			}

			// ⭐ VALIDACIÓN PREVIA: Verificar si el email ya existe con rol de organizer
			const { data: existingProfile } = await supabaseAdmin
				.from('profiles')
				.select('role')
				.eq('email', email)
				.single();

			if (existingProfile) {
				if (existingProfile.role === 'organizer') {
					logger.warn('Organizer tried to register as buyer:', { email });
					return fail(400, {
						email,
						message: 'Este correo ya está registrado como organizador. Por favor usa el login de organizadores en admin.vtickets.com',
						success: false
					});
				}
				// Si ya es buyer, Supabase manejará el error de "email already exists"
			}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${new URL(request.url).origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
				data: {
					role: 'buyer' // Asignar rol de comprador automáticamente
				}
			}
		});			if (error) {
				logger.error('Registration error:', error);
				return fail(400, {
					email,
					message: translateSupabaseError(error),
					success: false
				});
			}
			
			// Si se creó una sesión inmediatamente (email confirmation disabled)
			if (data.session) {
				redirect(303, redirectTo);
			}

			// Si requiere confirmación de email
			return {
				email,
				message:
					'¡Cuenta creada exitosamente! Por favor, revisa tu correo para confirmar tu cuenta.',
				success: true
			};
		} catch (error) {
			// Si es un redirect intencional, dejarlo pasar
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}
			
			logger.error('Unexpected error in registration:', error);
			return fail(500, {
				message: 'Error interno del servidor. Por favor intenta de nuevo.',
				success: false
			});
		}
	}
};
