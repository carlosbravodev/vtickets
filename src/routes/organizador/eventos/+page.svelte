<script lang="ts">
	import type { PageData } from './$types';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { fade } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

	function formatDateTime(dateString: string) {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		};
		return date.toLocaleDateString('es-ES', options);
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Mis Eventos - Organizador | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Mis Eventos</h1>
					<p class="mt-1 text-sm text-gray-600">
						Gestiona todos tus eventos y visualiza estadísticas de ventas
					</p>
				</div>
				<a
					href="/organizador/eventos/crear"
					class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Crear Evento
				</a>
			</div>
		</div>
	</div>

	<!-- Contenido -->
	<div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		{#if data.events && data.events.length > 0}
			<!-- Lista de eventos -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.events as event (event.id)}
					<article
						in:fade={{ duration: 300 }}
						class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
					>
						<!-- Imagen del evento -->
						<div class="relative h-48 bg-gray-200">
							{#if event.image_url}
								<img
									src={optimizeSupabaseImage(event.image_url, { width: 400, height: 300 })}
									alt={event.title}
									class="w-full h-full object-cover"
								/>
							{:else}
								<div class="flex items-center justify-center h-full bg-linear-to-br from-purple-400 to-purple-600">
									<svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
									</svg>
								</div>
							{/if}
						</div>

						<!-- Información del evento -->
						<div class="p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
								{event.title}
							</h3>
							
							<div class="space-y-2 mb-4">
								<!-- Fecha -->
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span>{formatDateTime(event.event_date)}</span>
								</div>

								<!-- Ubicación -->
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<span class="line-clamp-1">{event.location}</span>
								</div>
							</div>

							<!-- Estadísticas -->
							<div class="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
								<div>
									<p class="text-xs text-gray-500 font-semibold">Vendidos</p>
									<p class="text-2xl font-bold text-purple-600">
										{event.stats.totalTicketsSold}
									</p>
								</div>
								<div>
									<p class="text-xs text-gray-500 font-semibold">Ingresos</p>
									<p class="text-lg font-bold text-green-600">
										{formatCurrency(event.stats.totalRevenue)}
									</p>
								</div>
							</div>

							<!-- Acciones -->
							<div class="flex gap-2">
								<a
									href="/organizador/eventos/{event.id}"
									class="flex-1 text-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors"
								>
									Ver Detalles
								</a>
								<a
									href="/organizador/eventos/{event.id}/editar"
									class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
									title="Editar evento"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<!-- Estado vacío -->
			<div class="text-center py-16">
				<div class="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
					<svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
					</svg>
				</div>
				
				<h2 class="text-2xl font-bold text-gray-900 mb-4">
					¡Aún no has creado ningún evento!
				</h2>
				
				<p class="text-gray-600 mb-8 max-w-md mx-auto">
					Comienza creando tu primer evento. Podrás gestionar tickets, ver estadísticas de ventas y mucho más.
				</p>

				<a
					href="/organizador/eventos/crear"
					class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Crear Mi Primer Evento
				</a>
			</div>
		{/if}
	</div>
</div>
