import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sube una imagen al bucket de event-images en Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario que sube la imagen
 * @param eventId - ID del evento (opcional, para organizarlo en carpetas)
 * @returns URL pública de la imagen subida
 */
export async function uploadEventImage(
	file: File,
	userId: string,
	eventId?: string
): Promise<{ url: string; path: string } | { error: string }> {
	try {
		// Validar tipo de archivo
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return { error: 'Tipo de archivo no permitido. Usa JPEG, PNG o WebP.' };
		}

		// Validar tamaño (5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return { error: 'La imagen no puede superar los 5MB.' };
		}

		// Generar nombre único para el archivo
		const fileExt = file.name.split('.').pop();
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(7);
		const fileName = `${timestamp}-${randomString}.${fileExt}`;

		// Estructura de carpetas: userId/eventId/fileName o userId/fileName
		const filePath = eventId ? `${userId}/${eventId}/${fileName}` : `${userId}/${fileName}`;

		// Subir archivo
		const { data, error } = await supabaseAdmin.storage
			.from('event-images')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (error) {
			console.error('Error uploading image:', error);
			return { error: `Error al subir la imagen: ${error.message}` };
		}

		// Obtener URL pública
		const {
			data: { publicUrl }
		} = supabaseAdmin.storage.from('event-images').getPublicUrl(data.path);

		return {
			url: publicUrl,
			path: data.path
		};
	} catch (err) {
		console.error('Unexpected error uploading image:', err);
		return { error: 'Error inesperado al subir la imagen.' };
	}
}

/**
 * Elimina una imagen del bucket de event-images
 * @param path - Ruta del archivo en el bucket
 * @param supabase - Cliente de Supabase (para validar permisos del usuario)
 */
export async function deleteEventImage(
	path: string,
	supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase.storage.from('event-images').remove([path]);

		if (error) {
			console.error('Error deleting image:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (err) {
		console.error('Unexpected error deleting image:', err);
		return { success: false, error: 'Error inesperado al eliminar la imagen.' };
	}
}

/**
 * Actualiza una imagen (elimina la anterior y sube la nueva)
 */
export async function updateEventImage(
	oldPath: string,
	newFile: File,
	userId: string,
	eventId?: string,
	supabase?: SupabaseClient
): Promise<{ url: string; path: string } | { error: string }> {
	try {
		// Eliminar imagen anterior si existe
		if (oldPath && supabase) {
			await deleteEventImage(oldPath, supabase);
		}

		// Subir nueva imagen
		return await uploadEventImage(newFile, userId, eventId);
	} catch (err) {
		console.error('Error updating image:', err);
		return { error: 'Error al actualizar la imagen.' };
	}
}

/**
 * Obtiene la URL pública de una imagen
 */
export function getEventImageUrl(path: string): string {
	const {
		data: { publicUrl }
	} = supabaseAdmin.storage.from('event-images').getPublicUrl(path);
	return publicUrl;
}
