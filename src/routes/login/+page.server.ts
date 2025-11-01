import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectTo = formData.get('redirectTo') as string || '/';

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Error en login:', error.message);
			return fail(400, {
				email,
				message: 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.',
				success: false
			});
		}

		// Redirigir a la página original o al home
		redirect(303, redirectTo);
	},

	registro: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectTo = formData.get('redirectTo') as string || '/';

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${new URL(request.url).origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
			}
		});

		if (error) {
			console.error('Error en registro:', error.message);
			return fail(400, {
				email,
				message: `Error al crear la cuenta: ${error.message}`,
				success: false
			});
		}

		// Mostrar mensaje de éxito
		return {
			email,
			message:
				'¡Cuenta creada exitosamente! Por favor, revisa tu correo para confirmar tu cuenta.',
			success: true
		};
	}
};
