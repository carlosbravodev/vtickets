<script lang="ts">
	import { toastStore, type ToastNotification } from '$lib/stores/toastNotifications.svelte';
	import { onMount } from 'svelte';

	let toasts = $state<ToastNotification[]>([]);

	onMount(() => {
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		return unsubscribe;
	});

	function getIconAndColor(type: string) {
		switch (type) {
			case 'success':
				return {
					icon: '✓',
					bgColor: 'bg-green-500',
					textColor: 'text-green-50'
				};
			case 'error':
				return {
					icon: '✕',
					bgColor: 'bg-red-500',
					textColor: 'text-red-50'
				};
			case 'warning':
				return {
					icon: '⚠',
					bgColor: 'bg-amber-500',
					textColor: 'text-amber-50'
				};
			case 'info':
			default:
				return {
					icon: 'ℹ',
					bgColor: 'bg-blue-500',
					textColor: 'text-blue-50'
				};
		}
	}
</script>

<!-- Contenedor de toasts en la parte inferior centrado -->
<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
	<div class="flex flex-col gap-3 items-center">
		{#each toasts as toast (toast.id)}
			{@const { icon, bgColor, textColor } = getIconAndColor(toast.type)}
			<div
				class="flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl pointer-events-auto {bgColor} {textColor} animate-in fade-in slide-in-from-bottom-4 duration-300"
				style="animation: slideUp 0.3s ease-out;"
			>
				<span class="text-xl font-bold shrink-0">{icon}</span>
				<span class="font-medium text-sm max-w-xs">{toast.message}</span>
				<button
					onclick={() => toastStore.remove(toast.id)}
					class="shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
					aria-label="Cerrar notificación"
				>
					×
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideDown {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(20px);
		}
	}
</style>
