import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	// Si no está autenticado, redirigir a login
	if (!session || !user) {
		redirect(303, '/organizador/iniciar-sesion');
	}
	
	return {
		user
	};
};
