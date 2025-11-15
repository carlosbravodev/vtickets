import { dev } from '$app/environment';

/**
 * Formatea un timestamp legible
 */
function getTimestamp(): string {
	return new Date().toISOString();
}

/**
 * Formatea el contexto de error para debugging
 */
function formatContext(context?: Record<string, any>): string {
	if (!context || Object.keys(context).length === 0) {
		return '';
	}
	return `\n  Context: ${JSON.stringify(context, null, 2)}`;
}

/**
 * Logger utility mejorado con contexto y timestamps
 * En desarrollo: Muestra todos los logs con formato descriptivo
 * En producción: Solo muestra errores críticos
 */
export const logger = {
	/**
	 * Log general de información (solo desarrollo)
	 */
	log: (message: string, ...args: any[]) => {
		if (dev) {
			console.log(`[${getTimestamp()}] ℹ️  ${message}`, ...args);
		}
	},
	
	/**
	 * Log de errores (siempre visible, incluso en producción)
	 * Incluye timestamp y contexto adicional
	 */
	error: (message: string, error?: any, context?: Record<string, any>) => {
		const timestamp = getTimestamp();
		const contextStr = formatContext(context);
		
		if (error) {
			// Si el error tiene stack trace, incluirlo en desarrollo
			if (dev && error.stack) {
				console.error(
					`[${timestamp}] ❌ ERROR: ${message}${contextStr}\n  Details: ${error.message}\n  Stack: ${error.stack}`
				);
			} else {
				console.error(
					`[${timestamp}] ❌ ERROR: ${message}${contextStr}`,
					error
				);
			}
		} else {
			console.error(`[${timestamp}] ❌ ERROR: ${message}${contextStr}`);
		}
	},
	
	/**
	 * Advertencias (solo desarrollo)
	 */
	warn: (message: string, ...args: any[]) => {
		if (dev) {
			console.warn(`[${getTimestamp()}] ⚠️  WARNING: ${message}`, ...args);
		}
	},
	
	/**
	 * Información contextual (solo desarrollo)
	 */
	info: (message: string, context?: Record<string, any>) => {
		if (dev) {
			const contextStr = formatContext(context);
			console.info(`[${getTimestamp()}] ℹ️  ${message}${contextStr}`);
		}
	},
	
	/**
	 * Debug detallado (solo desarrollo)
	 */
	debug: (message: string, data?: any) => {
		if (dev) {
			console.debug(`[${getTimestamp()}] 🐛 DEBUG: ${message}`, data);
		}
	},

	/**
	 * Log de éxito (solo desarrollo)
	 */
	success: (message: string, context?: Record<string, any>) => {
		if (dev) {
			const contextStr = formatContext(context);
			console.log(`[${getTimestamp()}] ✅ SUCCESS: ${message}${contextStr}`);
		}
	}
};
