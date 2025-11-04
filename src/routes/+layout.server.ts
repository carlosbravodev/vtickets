import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: LayoutServerLoad = async ({ locals: { session, user } }) => {
	let profile = null;

	// Cargar perfil del usuario si está autenticado
	if (user?.id) {
		const { data } = await supabaseAdmin
			.from('profiles')
			.select('first_name, last_name, email')
			.eq('id', user.id)
			.single();
		
		profile = data;
	}

	return {
		session,
		user,
		profile
	};
};
