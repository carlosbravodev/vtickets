import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { logger } from '$lib/logger';

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectTo = formData.get('redirectTo') as string || '/';

		logger.log('🔑 ============ LOGIN INICIADO ============');
		logger.log('📧 Email:', email);
		logger.log('🎯 RedirectTo:', redirectTo);

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			logger.error('❌ Error en login:', error.message);
			return fail(400, {
				email,
				message: 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.',
				success: false
			});
		}

		logger.log('✅ Login exitoso, usuario:', data.user?.id);
		logger.log('🔄 Redirigiendo a:', redirectTo);
		logger.log('⚠️  El middleware verificará el perfil después');

		// Redirigir a la página original o al home
		redirect(303, redirectTo);
	},

	registro: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectTo = formData.get('redirectTo') as string || '/';

		logger.log('📝 ============ REGISTRO INICIADO ============');
		logger.log('📧 Email:', email);
		logger.log('🎯 RedirectTo:', redirectTo);

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${new URL(request.url).origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
			}
		});

		if (error) {
			logger.error('❌ Error en registro:', error.message);
			return fail(400, {
				email,
				message: `Error al crear la cuenta: ${error.message}`,
				success: false
			});
		}

		logger.log('✅ Usuario creado:', data.user?.id);
		logger.log('🔐 Sesión creada:', !!data.session);
		
		// Si se creó una sesión inmediatamente (email confirmation disabled)
		// redirigir al usuario para que el middleware lo mande a completar perfil
		if (data.session) {
			logger.log('🔄 Sesión activa, redirigiendo a:', redirectTo);
			logger.log('⚠️  El middleware debería detectar perfil incompleto y redirigir a /completar-perfil');
			redirect(303, redirectTo);
		}

		// Si requiere confirmación de email
		logger.log('📧 Se requiere confirmación por email');
		return {
			email,
			message:
				'¡Cuenta creada exitosamente! Por favor, revisa tu correo para confirmar tu cuenta.',
			success: true
		};
	}
};
