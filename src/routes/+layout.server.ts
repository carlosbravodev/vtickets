import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: LayoutServerLoad = async ({ locals: { session, user } }) => {
	let profiles = [];
	let primaryProfile = null;

	// Cargar TODOS los perfiles del usuario si está autenticado
	if (user?.id) {
		const { data } = await supabaseAdmin
			.from('profiles')
			.select('id, first_name, last_name, email, role, created_at')
			.eq('id', user.id)
			.order('created_at', { ascending: true });
		
		if (data && data.length > 0) {
			profiles = data;
			// El perfil primario es el comprador si existe, sino el primero
			primaryProfile = profiles.find(p => p.role === 'buyer') || profiles[0];
		}
	}

	return {
		session,
		user,
		profile: primaryProfile, // Para compatibilidad con código existente
		profiles, // Todos los perfiles del usuario
		availableRoles: profiles.map(p => p.role) // ['buyer', 'organizer'] o solo uno
	};
};
