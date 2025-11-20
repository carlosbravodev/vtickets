<script lang="ts">
	import type { PageData } from './$types';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Ordenar eventos por fecha del evento (más próximos primero)
	let sortedEvents = $derived(
		data.events ? [...data.events].sort((a, b) => 
			new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
		) : []
	);

	// Mostrar mensaje de éxito si viene de crear evento
	onMount(() => {
		const success = $page.url.searchParams.get('success');
		const eventSlug = $page.url.searchParams.get('event');
		
		if (success === 'created' && eventSlug) {
			toast.success('¡Evento creado exitosamente! 🎉');
			// Limpiar URL
			window.history.replaceState({}, '', '/organizador/eventos');
		}
	});

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
		{#if sortedEvents && sortedEvents.length > 0}
			<!-- Lista de eventos -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each sortedEvents as event (event.id)}
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
									<span class="line-clamp-1">
										{#if event.venue}
											{event.venue}{event.location ? `, ${event.location}` : ''}
										{:else}
											{event.location || 'Ubicación por definir'}
										{/if}
									</span>
								</div>
							</div>

							<!-- Estadísticas -->
							<div class="space-y-3 mb-4">
								<!-- Estadística principal: Tickets -->
								<div class="p-4 bg-linear-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
									<div class="flex items-center justify-between mb-2">
										<span class="text-xs font-semibold text-purple-700 uppercase">Tickets</span>
										{#if event.stats.occupancyPercentage > 0}
											<span class="text-xs font-bold text-purple-600">
												{event.stats.occupancyPercentage.toFixed(0)}% ocupado
											</span>
										{/if}
									</div>
									<div class="flex items-baseline gap-2">
										<span class="text-3xl font-bold text-purple-900">
											{event.stats.totalTicketsSold}
										</span>
										<span class="text-sm text-purple-700">
											/ {event.stats.totalTicketsSold + event.stats.totalTicketsAvailable}
										</span>
									</div>
									{#if event.stats.occupancyPercentage > 0}
										<div class="mt-2 w-full bg-purple-200 rounded-full h-2 overflow-hidden">
											<div 
												class="h-full bg-purple-600 rounded-full transition-all duration-500"
												style="width: {Math.min(event.stats.occupancyPercentage, 100)}%"
											></div>
										</div>
									{/if}
								</div>

								<!-- Estadísticas secundarias -->
								<div class="grid grid-cols-3 gap-2">
									<!-- Ingresos -->
									<div class="p-3 bg-green-50 rounded-lg border border-green-200">
										<p class="text-[10px] text-green-700 font-semibold mb-1">Ingresos</p>
										<p class="text-sm font-bold text-green-900">
											{formatCurrency(event.stats.totalRevenue)}
										</p>
									</div>

									<!-- Órdenes -->
									{#if event.stats.totalOrders !== undefined}
										<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
											<p class="text-[10px] text-blue-700 font-semibold mb-1">Órdenes</p>
											<p class="text-sm font-bold text-blue-900">
												{event.stats.totalOrders}
											</p>
										</div>
									{/if}

									<!-- Compradores únicos -->
									{#if event.stats.uniqueBuyers !== undefined}
										<div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
											<p class="text-[10px] text-orange-700 font-semibold mb-1">Compradores</p>
											<p class="text-sm font-bold text-orange-900">
												{event.stats.uniqueBuyers}
											</p>
										</div>
									{/if}
								</div>

								<!-- Precio promedio si está disponible -->
								{#if event.stats.avgTicketPrice && event.stats.avgTicketPrice > 0}
									<div class="text-center p-2 bg-gray-50 rounded-lg">
										<span class="text-xs text-gray-600">
											Precio promedio: 
											<span class="font-bold text-gray-900">
												{formatCurrency(event.stats.avgTicketPrice)}
											</span>
										</span>
									</div>
								{/if}
							</div>

						<!-- Acciones -->
						<div class="flex gap-2">
							<a
								href="/organizador/eventos/{event.slug}"
								class="flex-1 text-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors"
							>
								Ver Detalles
							</a>
							<a
								href="/organizador/eventos/{event.slug}/editar"
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
