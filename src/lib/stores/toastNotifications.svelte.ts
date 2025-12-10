import { writable } from 'svelte/store';

export interface ToastNotification {
	id: string;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
}

function createToastStore() {
	const { subscribe, set, update } = writable<ToastNotification[]>([]);

	return {
		subscribe,
		add: (toast: Omit<ToastNotification, 'id'>) => {
			const id = Math.random().toString(36).slice(2);
			const duration = toast.duration || 3000;

			update((toasts) => [...toasts, { ...toast, id }]);

			// Auto-remove después del duration
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, duration);

			return id;
		},
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		clear: () => {
			set([]);
		}
	};
}

export const toastStore = createToastStore();
