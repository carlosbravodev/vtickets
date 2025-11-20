/**
 * Convierte un string a un slug amigable para URLs
 * Excluye palabras cortas y palabras comunes (stopwords)
 * @param text - El texto a convertir
 * @returns El slug generado
 */
export function slugify(text: string): string {
	// Lista de palabras a excluir (stopwords en español)
	const stopwords = [
		'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
		'de', 'del', 'al', 'y', 'e', 'o', 'u', 'en', 'con', 'sin',
		'para', 'por', 'a', 'ante', 'bajo', 'con', 'contra',
		'desde', 'durante', 'entre', 'hacia', 'hasta', 'mediante',
		'según', 'sin', 'sobre', 'tras'
	];

	return text
		.toString()
		.toLowerCase()
		.normalize('NFD') // Normalizar caracteres Unicode
		.replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
		.trim()
		.split(/\s+/) // Separar por espacios
		.filter(word => {
			// Filtrar palabras vacías, de 1-2 letras, y stopwords
			const cleanWord = word.replace(/[^\w]+/g, '');
			return cleanWord.length > 2 && !stopwords.includes(cleanWord);
		})
		.join('-') // Unir con guiones
		.replace(/[^\w\-]+/g, '') // Eliminar caracteres no alfanuméricos (excepto guiones)
		.replace(/\-\-+/g, '-') // Reemplazar múltiples guiones con uno solo
		.replace(/^-+/, '') // Eliminar guiones del inicio
		.replace(/-+$/, ''); // Eliminar guiones del final
}
