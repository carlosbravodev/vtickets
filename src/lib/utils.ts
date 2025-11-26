import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS de manera inteligente
 * Elimina clases duplicadas y conflictivas
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
