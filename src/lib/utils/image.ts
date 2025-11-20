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
		resize?: 'cover' | 'contain' | 'fill';
	} = {}
): string {
	if (!url) return '';

	const { width = 800, height, quality = 80, format = 'webp', resize = 'cover' } = options;

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
		params.set('quality', quality.toString());
		params.set('format', format);
		params.set('resize', resize);

		return `${url}?${params.toString()}`;
	}

	// Si es de otro proveedor, retornar sin modificar
	return url;
}

/**
 * Comprime una imagen en el cliente antes de subirla
 * Reduce el tamaño del archivo manteniendo calidad aceptable
 * @param file - Archivo de imagen original
 * @param options - Opciones de compresión
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
	file: File,
	options: {
		maxWidth?: number;
		maxHeight?: number;
		quality?: number;
		targetFormat?: 'webp' | 'jpeg';
	} = {}
): Promise<File> {
	const { maxWidth = 1920, maxHeight = 1080, quality = 0.85, targetFormat = 'webp' } = options;

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		
		reader.onload = (e) => {
			const img = new Image();
			
			img.onload = () => {
				// Calcular nuevas dimensiones manteniendo aspecto
				let width = img.width;
				let height = img.height;
				
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}
				
				if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}
				
				// Crear canvas para redimensionar
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('No se pudo obtener contexto 2D'));
					return;
				}
				
			// Dibujar imagen redimensionada
			ctx.drawImage(img, 0, 0, width, height);
			
			// Intentar convertir a WebP primero, si falla usar JPEG
			const tryFormat = targetFormat === 'webp' ? 'image/webp' : 'image/jpeg';
			const fallbackFormat = 'image/jpeg';
			
			// Convertir a blob
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						// Si falla con WebP, intentar con JPEG
						if (tryFormat === 'image/webp') {
							console.warn('WebP conversion failed, falling back to JPEG');
							canvas.toBlob(
								(jpegBlob) => {
									if (!jpegBlob) {
										reject(new Error('Error al comprimir imagen'));
										return;
									}
									
									const originalName = file.name.split('.')[0];
									const compressedFile = new File(
										[jpegBlob],
										`${originalName}.jpg`,
										{ type: 'image/jpeg' }
									);
									
									resolve(compressedFile);
								},
								fallbackFormat,
								quality
							);
							return;
						}
						
						reject(new Error('Error al comprimir imagen'));
						return;
					}
					
					// Crear nuevo archivo con nombre original pero extensión correcta
					const originalName = file.name.split('.')[0];
					const extension = tryFormat === 'image/webp' ? 'webp' : 'jpg';
					const compressedFile = new File(
						[blob],
						`${originalName}.${extension}`,
						{ type: tryFormat }
					);
					
					resolve(compressedFile);
				},
				tryFormat,
				quality
			);
		};			img.onerror = () => reject(new Error('Error al cargar imagen'));
			img.src = e.target?.result as string;
		};
		
		reader.onerror = () => reject(new Error('Error al leer archivo'));
		reader.readAsDataURL(file);
	});
}

/**
 * Genera un srcset responsivo para imágenes de Supabase
 * @param url - URL base de la imagen
 * @param sizes - Array de anchos deseados
 */
export function generateResponsiveSrcSet(
	url: string,
	sizes: number[] = [400, 800, 1200, 1920]
): string {
	if (!url || !url.includes('supabase.co/storage')) {
		return '';
	}

	return sizes
		.map((size) => `${optimizeSupabaseImage(url, { width: size, quality: 80 })} ${size}w`)
		.join(', ');
}

/**
 * Valida que el archivo sea una imagen y no exceda el tamaño máximo
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (default: 5)
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
	// Validar tipo
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: 'Formato no válido. Solo se permiten: JPG, PNG, WebP, AVIF'
		};
	}

	// Validar tamaño
	const maxSize = maxSizeMB * 1024 * 1024; // Convertir a bytes
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `La imagen no debe superar ${maxSizeMB}MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
		};
	}

	return { valid: true };
}
