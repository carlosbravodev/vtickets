// Store de Toast usando Svelte 5 runes
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

class ToastStore {
	toasts = $state<Toast[]>([]);
	private nextId = 0;

	show(message: string, type: ToastType = 'info', duration: number = 4000) {
		const id = this.nextId++;
		const toast: Toast = { id, message, type, duration };
		
		this.toasts.push(toast);

		// Auto-remove después de la duración
		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	success(message: string, duration?: number) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration?: number) {
		this.show(message, 'error', duration);
	}

	info(message: string, duration?: number) {
		this.show(message, 'info', duration);
	}

	warning(message: string, duration?: number) {
		this.show(message, 'warning', duration);
	}

	remove(id: number) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}
}

export const toast = new ToastStore();
