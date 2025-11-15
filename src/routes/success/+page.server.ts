import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirigir automáticamente a /exito
	// Esta ruta existe solo por compatibilidad con Lemon Squeezy
	// que usa /success como URL de éxito por defecto
	throw redirect(303, '/exito');
};
