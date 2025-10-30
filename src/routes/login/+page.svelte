<script lang="ts">
	import { fade, fly } from 'svelte/transition';
</script>

<div class="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
	<div class="max-w-md w-full" in:fly={{ y: 20, duration: 600 }}>
		<!-- Card -->
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
			<!-- Header con icono -->
			<div class="bg-linear-to-br from-indigo-600 to-purple-600 p-8 text-center">
				<div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4" in:fade={{ delay: 200 }}>
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-white mb-2">Acceso Restringido</h1>
				<p class="text-indigo-100">Área de administración</p>
			</div>

			<!-- Body -->
			<div class="p-8">
				<div class="text-center mb-8">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
						<svg class="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
						Funcionalidad en Desarrollo
					</h2>
					<p class="text-gray-600 dark:text-gray-400 mb-8">
						El sistema de autenticación estará disponible próximamente. Esta sección es solo para administradores.
					</p>
				</div>

				<!-- Botón de regreso -->
				<div class="text-center">
					<a
						href="/"
						class="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Volver al inicio
					</a>
				</div>
			</div>
		</div>

		<!-- Info adicional -->
		<div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400" in:fade={{ delay: 400 }}>
			<p>¿Eres administrador? Contacta al equipo de desarrollo</p>
		</div>
	</div>
</div>
