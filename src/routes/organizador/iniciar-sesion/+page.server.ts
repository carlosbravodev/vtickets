import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logger } from '$lib/logger';

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

export const load: PageServerLoad = async ({ locals }) => {
	// Si ya está autenticado como organizador, redirigir al dashboard
	const { session, user } = await locals.safeGetSession();
	
	if (session && user) {
		// Aquí después verificaremos el rol, por ahora solo redirigimos
		redirect(303, '/organizador');
	}
	
	return {};
};

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;
			const password = formData.get('password') as string;

			// Validación básica
			if (!email || !password) {
				return fail(400, {
					email,
					message: 'Por favor completa todos los campos.',
					success: false
				});
			}

			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				logger.error('Organizer login error:', error);
				return fail(400, {
					email,
					message: translateSupabaseError(error),
					success: false
				});
			}

			// Redirigir al dashboard de organizador
			redirect(303, '/organizador');
		} catch (error) {
			// Si es un redirect intencional, dejarlo pasar
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}
			
			logger.error('Unexpected error in organizer login:', error);
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

			// Crear cuenta con rol de organizador
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${new URL(request.url).origin}/auth/callback?redirectTo=/organizador`,
					data: {
						role: 'organizer' // 🎯 Asignar rol de organizador automáticamente
					}
				}
			});

			if (error) {
				logger.error('Organizer registration error:', error);
				return fail(400, {
					email,
					message: translateSupabaseError(error),
					success: false
				});
			}
			
			// Si se creó una sesión inmediatamente (email confirmation disabled)
			if (data.session) {
				redirect(303, '/organizador');
			}

			// Si requiere confirmación de email
			return {
				email,
				message:
					'¡Cuenta de organizador creada exitosamente! Por favor, revisa tu correo para confirmar tu cuenta.',
				success: true
			};
		} catch (error) {
			// Si es un redirect intencional, dejarlo pasar
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}
			
			logger.error('Unexpected error in organizer registration:', error);
			return fail(500, {
				message: 'Error interno del servidor. Por favor intenta de nuevo.',
				success: false
			});
		}
	}
};
