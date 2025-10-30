/**
 * Optimiza una URL de imagen aplicando transformaciones según el proveedor
 * Soporta: Supabase Storage y Unsplash
 * @param url - URL original de la imagen
 * @param options - Opciones de transformación
 */
export function optimizeSupabaseImage(
	url: string,
	options: {
		width?: number;
		height?: number;
		quality?: number;
		format?: 'webp' | 'avif' | 'jpg';
	} = {}
): string {
	if (!url) return '';

	const { width = 800, height, quality = 80, format = 'webp' } = options;

	// Detectar si es una imagen de Unsplash
	if (url.includes('unsplash.com')) {
		// Limpiar URL de parámetros existentes si los tiene
		const baseUrl = url.split('?')[0];
		
		// Unsplash soporta transformaciones mediante parámetros de query
		const params = new URLSearchParams();
		params.set('auto', 'format'); // Auto-selecciona el mejor formato
		params.set('fit', 'crop');
		params.set('w', width.toString());
		if (height) params.set('h', height.toString());
		params.set('q', quality.toString());
		
		// Agregar parámetros adicionales de Unsplash si es necesario
		if (url.includes('premium_photo')) {
			// Mantener los parámetros específicos de fotos premium
			const originalParams = new URL(url).searchParams;
			if (originalParams.has('ixlib')) params.set('ixlib', originalParams.get('ixlib')!);
			if (originalParams.has('ixid')) params.set('ixid', originalParams.get('ixid')!);
		}
		
		return `${baseUrl}?${params.toString()}`;
	}

	// Si es de Supabase Storage
	if (url.includes('supabase.co/storage')) {
		const params = new URLSearchParams();
		
		if (width) params.set('width', width.toString());
		if (height) params.set('height', height.toString());
		if (quality) params.set('quality', quality.toString());
		if (format) params.set('format', format);

		return `${url}?${params.toString()}`;
	}

	// Si es de otro proveedor, retornar sin modificar
	return url;
}
