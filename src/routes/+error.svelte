<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Obtener información del error
	let errorStatus = $derived($page.status);
	let errorMessage = $derived($page.error?.message || 'Ha ocurrido un error inesperado');

	// Configurar mensajes personalizados según el código de error
	let errorConfig = $derived.by(() => {
		switch (errorStatus) {
			case 404:
				return {
					title: '404 - Página no encontrada',
					message: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
					emoji: '🔍',
					suggestions: [
						'Verifica que la URL esté escrita correctamente',
						'El evento que buscas podría haber sido eliminado',
						'Intenta buscar desde la página principal'
					]
				};
			case 403:
				return {
					title: '403 - Acceso denegado',
					message: 'No tienes permiso para acceder a este recurso.',
					emoji: '🔒',
					suggestions: [
						'Asegúrate de haber iniciado sesión',
						'Es posible que necesites permisos especiales',
						'Contacta al administrador si crees que es un error'
					]
				};
			case 500:
				return {
					title: '500 - Error del servidor',
					message: 'Algo salió mal en nuestros servidores. Ya estamos trabajando en ello.',
					emoji: '⚠️',
					suggestions: [
						'Intenta recargar la página en unos momentos',
						'Si el problema persiste, contacta a soporte',
						'Verifica tu conexión a internet'
					]
				};
			default:
				return {
					title: `Error ${errorStatus}`,
					message: errorMessage,
					emoji: '❌',
					suggestions: [
						'Intenta recargar la página',
						'Vuelve a la página principal',
						'Contacta a soporte si el problema continúa'
					]
				};
		}
	});

	function goHome() {
		goto('/');
	}

	function goBack() {
		window.history.back();
	}

	function reloadPage() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>{errorConfig.title} - VTickets</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
	<div class="max-w-2xl w-full">
		<!-- Card principal del error -->
		<div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
			<!-- Emoji grande -->
			<div class="text-8xl mb-6 animate-bounce">
				{errorConfig.emoji}
			</div>

			<!-- Título del error -->
			<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
				{errorConfig.title}
			</h1>

			<!-- Mensaje descriptivo -->
			<p class="text-xl text-gray-600 mb-8">
				{errorConfig.message}
			</p>

			<!-- Sugerencias -->
			<div class="bg-gray-50 rounded-xl p-6 mb-8 text-left">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Qué puedes hacer:
				</h2>
				<ul class="space-y-2">
					{#each errorConfig.suggestions as suggestion}
						<li class="flex items-start gap-3 text-gray-700">
							<svg class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							<span>{suggestion}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Botones de acción -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button
					onclick={goHome}
					class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					Ir al inicio
				</button>

				<button
					onclick={goBack}
					class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Volver atrás
				</button>

				{#if errorStatus >= 500}
					<button
						onclick={reloadPage}
						class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Reintentar
					</button>
				{/if}
			</div>

			<!-- Información de soporte -->
			<div class="mt-8 pt-8 border-t border-gray-200">
				<p class="text-sm text-gray-500">
					¿Necesitas ayuda? Contacta a nuestro equipo de soporte
				</p>
				<p class="text-sm text-gray-400 mt-2">
					Código de error: {errorStatus}
				</p>
			</div>
		</div>

		<!-- Logo de VTickets -->
		<div class="text-center mt-8">
			<a href="/" class="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
				VTickets 🎫
			</a>
		</div>
	</div>
</div>

<style>
	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	.animate-bounce {
		animation: bounce 2s infinite;
	}
</style>
