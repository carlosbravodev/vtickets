<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard - Organizador | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header Temporal -->
	<div class="bg-purple-900 text-white py-6 px-4">
		<div class="max-w-7xl mx-auto">
			<h1 class="text-3xl font-bold">Dashboard de Organizador</h1>
			<p class="text-purple-200 mt-2">Bienvenido al panel de control</p>
		</div>
	</div>

	<!-- Contenido Temporal -->
	<div class="max-w-7xl mx-auto px-4 py-12">
		<div class="bg-white rounded-xl shadow-lg p-8 text-center">
			<div class="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
				<svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
				</svg>
			</div>
			
			<h2 class="text-2xl font-bold text-gray-900 mb-4">
				¡Sistema de Organizadores Activado! 🎉
			</h2>
			
			<p class="text-gray-600 mb-6 max-w-2xl mx-auto">
				Has iniciado sesión correctamente como organizador. Este es tu dashboard donde podrás crear y gestionar eventos, ver estadísticas de ventas, y mucho más.
			</p>

			<div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
				<p class="text-sm text-purple-800 font-semibold mb-2">
					Usuario autenticado:
				</p>
				<p class="text-purple-600">
					{data.user.email}
				</p>
			</div>

			<div class="text-left max-w-md mx-auto space-y-3 mb-8">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<div>
						<p class="font-semibold text-gray-900">Sistema de Roles Implementado</p>
						<p class="text-sm text-gray-600">Roles separados para compradores y organizadores</p>
					</div>
				</div>
				
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<div>
						<p class="font-semibold text-gray-900">Detección de Subdomain</p>
						<p class="text-sm text-gray-600">admin.vtickets.com separado de vtickets.com</p>
					</div>
				</div>
				
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<div>
						<p class="font-semibold text-gray-900">Login/Registro Independiente</p>
						<p class="text-sm text-gray-600">Formularios separados con asignación automática de rol</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a 
					href="/organizador/iniciar-sesion"
					class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
				>
					← Volver al Login
				</a>
				<button
					disabled
					class="px-6 py-3 bg-purple-300 text-white font-semibold rounded-lg cursor-not-allowed"
				>
					Dashboard Completo (Próximamente)
				</button>
			</div>

			<p class="text-xs text-gray-500 mt-8">
				🚧 En las siguientes fases implementaremos la gestión completa de eventos y estadísticas
			</p>
		</div>
	</div>
</div>
