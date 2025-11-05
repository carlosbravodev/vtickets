<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const icons = {
		success: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
		</svg>`,
		error: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
		</svg>`,
		info: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
		</svg>`,
		warning: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
		</svg>`
	};

	const colors = {
		success: 'bg-green-500',
		error: 'bg-red-500',
		info: 'bg-blue-500',
		warning: 'bg-yellow-500'
	};

	const bgColors = {
		success: 'bg-green-50 border-green-200',
		error: 'bg-red-50 border-red-200',
		info: 'bg-blue-50 border-blue-200',
		warning: 'bg-yellow-50 border-yellow-200'
	};

	const textColors = {
		success: 'text-green-800',
		error: 'text-red-800',
		info: 'text-blue-800',
		warning: 'text-yellow-800'
	};
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
	{#each toast.toasts as t (t.id)}
		<div
			in:fly={{ x: 300, duration: 400, easing: quintOut }}
			out:fade={{ duration: 200 }}
			class="pointer-events-auto max-w-sm w-full {bgColors[t.type]} border rounded-lg shadow-lg overflow-hidden"
		>
			<div class="flex items-start p-4 gap-3">
				<!-- Icono -->
				<div class="{colors[t.type]} rounded-full p-2 shrink-0">
					<div class="text-white">
						{@html icons[t.type]}
					</div>
				</div>

				<!-- Mensaje -->
				<div class="flex-1 {textColors[t.type]} pt-1">
					<p class="font-semibold text-sm">{t.message}</p>
				</div>

				<!-- Botón cerrar -->
				<button
					onclick={() => toast.remove(t.id)}
					class="{textColors[t.type]} hover:opacity-70 transition-opacity shrink-0"
					aria-label="Cerrar notificación"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<!-- Barra de progreso -->
			<div class="h-1 {colors[t.type]} opacity-30" style="animation: shrink {t.duration}ms linear"></div>
		</div>
	{/each}
</div>

<style>
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
