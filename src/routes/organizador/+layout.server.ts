import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: LayoutServerLoad = async ({ locals: { session, user } }) => {
	let profiles: any[] = [];
	let organizerProfile = null;

	// Cargar TODOS los perfiles del usuario si está autenticado
	if (user?.id) {
		const { data } = await supabaseAdmin
			.from('profiles')
			.select('id, first_name, last_name, email, role, created_at')
			.eq('id', user.id)
			.order('created_at', { ascending: true });
		
		if (data && data.length > 0) {
			profiles = data;
			// Buscar específicamente el perfil de organizador
			organizerProfile = profiles.find(p => p.role === 'organizer');
		}
	}

	return {
		session,
		user,
		profile: organizerProfile || null, // El perfil de organizador o null
		profiles, // Todos los perfiles del usuario
		availableRoles: profiles.map(p => p.role), // ['buyer', 'organizer'] o solo uno
		hasOrganizerRole: !!organizerProfile // true/false si tiene rol de organizador
	};
};
