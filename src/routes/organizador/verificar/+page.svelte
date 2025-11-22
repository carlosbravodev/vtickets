<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	let { data }: { data: PageData } = $props();

	// Hacer eventos reactivos
	let events = $state(data.events);
	let realtimeChannel: RealtimeChannel | null = null;

	// Actualizar estadísticas de un evento específico
	async function refreshEventStats(eventId: string) {
		try {
			const response = await fetch(`/api/verificar/stats/${eventId}`);
			if (response.ok) {
				const newStats = await response.json();
				// Actualizar el evento en la lista
				events = events.map(event => 
					event.id === eventId 
						? { ...event, stats: newStats }
						: event
				);
				console.log(`📊 Stats actualizadas para evento ${eventId}`);
			}
		} catch (error) {
			console.error('Error actualizando stats:', error);
		}
	}

	// Inicializar Realtime
	onMount(() => {
		// Suscribirse a cambios en tickets
		import('$lib/supabaseClient').then(({ supabase }) => {
			realtimeChannel = supabase
				.channel('all-tickets')
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'tickets'
					},
					(payload: any) => {
						console.log('🔄 Cambio en tickets detectado:', payload);
						// Actualizar stats del evento afectado
						const eventId = payload.new?.event_id || payload.old?.event_id;
						if (eventId) {
							refreshEventStats(eventId);
						}
					}
				)
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') {
						console.log('✅ Suscrito a actualizaciones de tickets');
					}
				});
		});
	});

	onDestroy(() => {
		if (realtimeChannel) {
			realtimeChannel.unsubscribe();
		}
	});

	// Formatear fecha
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('es-ES', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	// Determinar el color de la barra de progreso
	function getProgressColor(percentage: number) {
		if (percentage >= 80) return 'bg-green-500';
		if (percentage >= 50) return 'bg-yellow-500';
		if (percentage >= 20) return 'bg-orange-500';
		return 'bg-red-500';
	}
</script>

<svelte:head>
	<title>Verificar Tickets - VTickets</title>
	<meta name="description" content="Escanea y verifica tickets con código QR" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Verificar Tickets</h1>
					<p class="mt-2 text-gray-600">
						Selecciona un evento para escanear tickets con QR
					</p>
				</div>
				<a
					href="/organizador"
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
				>
					← Volver al Dashboard
				</a>
			</div>
		</div>

		<!-- Lista de eventos -->
		{#if data.events.length === 0}
			<div class="bg-white rounded-lg shadow-md p-12 text-center">
				<div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No tienes eventos creados</h3>
				<p class="text-gray-600 mb-6">Crea tu primer evento para comenzar a verificar tickets</p>
				<a
					href="/organizador/eventos/crear"
					class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
				>
					Crear Evento
				</a>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2">
				{#each data.events as event}
					<a
						href="/organizador/verificar/{event.id}"
						class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
					>
						<!-- Imagen del evento -->
						{#if event.image_url}
							<div class="h-48 overflow-hidden bg-gray-200">
								<img
									src={event.image_url}
									alt={event.title}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
						{:else}
							<div class="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
								<svg class="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
								</svg>
							</div>
						{/if}

						<!-- Contenido -->
						<div class="p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
								{event.title}
							</h3>
							
							<!-- Fecha y ubicación -->
							<div class="space-y-2 mb-4">
								<div class="flex items-center text-sm text-gray-600">
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									{formatDate(event.event_date)}
								</div>
								<div class="flex items-center text-sm text-gray-600">
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									{event.venue || event.location}
								</div>
							</div>

							<!-- Estadísticas -->
							<div class="mb-3">
								<div class="flex items-center justify-between text-sm mb-2">
									<span class="font-medium text-gray-700">Tickets verificados</span>
									<span class="font-bold text-gray-900">
										{event.stats.verified}/{event.stats.total} ({event.stats.percentage}%)
									</span>
								</div>
								<!-- Barra de progreso -->
								<div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
									<div
										class="{getProgressColor(event.stats.percentage)} h-2.5 rounded-full transition-all duration-500"
										style="width: {event.stats.percentage}%"
									></div>
								</div>
							</div>

							<!-- Botón de acción -->
							<div class="mt-4 pt-4 border-t border-gray-100">
								<span class="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
									<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
									</svg>
									Escanear Tickets
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Info PWA -->
		<div class="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">
						💡 Tip: Instala la app en tu teléfono
					</h3>
					<p class="mt-2 text-sm text-blue-700">
						Puedes instalar VTickets en tu móvil para usarla offline. En tu navegador móvil, busca la opción "Agregar a pantalla de inicio" o "Instalar app".
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
