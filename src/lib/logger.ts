import { dev } from '$app/environment';

/**
 * Logger utility que solo imprime en desarrollo
 * En producción, los logs se silencian automáticamente
 */
export const logger = {
	log: (...args: any[]) => {
		if (dev) {
			console.log(...args);
		}
	},
	
	error: (...args: any[]) => {
		// Siempre mostrar errores, incluso en producción
		console.error(...args);
	},
	
	warn: (...args: any[]) => {
		if (dev) {
			console.warn(...args);
		}
	},
	
	info: (...args: any[]) => {
		if (dev) {
			console.info(...args);
		}
	},
	
	debug: (...args: any[]) => {
		if (dev) {
			console.debug(...args);
		}
	}
};
