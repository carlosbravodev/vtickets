<script lang="ts">
	import type { PageData } from './$types';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	const { event, stats, recentOrders, ticketSalesByType } = data;

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

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Verificar si el evento ya pasó
	let isEventPast = $derived(new Date(event.event_date) < new Date());

	// Calcular totales de tickets
	let totalTickets = $derived(
		event.ticket_types?.reduce((sum: number, t: any) => sum + t.initial_quantity, 0) || 0
	);
	let availableTickets = $derived(
		event.ticket_types?.reduce((sum: number, t: any) => sum + t.available_tickets, 0) || 0
	);
	let soldTickets = $derived(totalTickets - availableTickets);
	let occupancyPercentage = $derived(
		totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0
	);
</script>

<svelte:head>
	<title>{event.title} - Detalles | Panel de Organizadores</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center gap-4 mb-4">
				<button
					onclick={() => goto('/organizador/eventos')}
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<div class="flex-1">
					<h1 class="text-3xl font-bold text-gray-900">{event.title}</h1>
					<div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
						<div class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span>{formatDateTime(event.event_date)}</span>
						</div>
						<div class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span>{event.venue}{event.location ? `, ${event.location}` : ''}</span>
						</div>
					</div>
				</div>
				<div class="flex gap-2">
					<a
						href="/organizador/eventos/{event.slug}/editar"
						class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
					>
						Editar Evento
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Contenido -->
	<div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Columna principal -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Imagen del evento -->
				{#if event.image_url}
					<div class="bg-white rounded-xl shadow-md overflow-hidden">
						<img
							src={optimizeSupabaseImage(event.image_url, { width: 800, height: 450 })}
							alt={event.title}
							class="w-full h-96 object-cover"
							in:fade={{ duration: 300 }}
						/>
					</div>
				{/if}

				<!-- Descripción -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
					<p class="text-gray-700 whitespace-pre-line">{event.description}</p>
				</div>

				<!-- Tipos de tickets -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-xl font-bold text-gray-900 mb-4">Tipos de Tickets</h2>
					<div class="space-y-4">
						{#each event.ticket_types as ticketType}
							{@const sold = ticketType.initial_quantity - ticketType.available_tickets}
							{@const soldPercentage = (sold / ticketType.initial_quantity) * 100}
							
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<div>
										<h3 class="font-bold text-gray-900">{ticketType.name}</h3>
										<p class="text-sm text-gray-600">
											{formatCurrency(parseFloat(ticketType.price))}
										</p>
									</div>
									<div class="text-right">
										<div class="text-2xl font-bold text-purple-600">
											{sold}
										</div>
										<div class="text-xs text-gray-600">
											de {ticketType.initial_quantity} vendidos
										</div>
									</div>
								</div>

								<!-- Barra de progreso -->
								<div class="mt-3">
									<div class="flex items-center justify-between text-xs text-gray-600 mb-1">
										<span>{soldPercentage.toFixed(1)}% vendido</span>
										<span>{ticketType.available_tickets} disponibles</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
										<div 
											class="h-full bg-purple-600 rounded-full transition-all duration-500"
											style="width: {Math.min(soldPercentage, 100)}%"
										></div>
									</div>
								</div>

								<!-- Estado -->
								<div class="mt-2">
									{#if ticketType.is_active}
										{#if ticketType.available_tickets > 0}
											<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
												<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
												</svg>
												Activo
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
												<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
												</svg>
												Agotado
											</span>
										{/if}
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
											Inactivo
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Órdenes recientes -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-xl font-bold text-gray-900 mb-4">Órdenes Recientes</h2>
					{#if recentOrders && recentOrders.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Orden</th>
										<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
										<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tickets</th>
										<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
										<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									{#each recentOrders as order}
										<tr class="hover:bg-gray-50">
											<td class="px-4 py-3 text-sm font-medium text-gray-900">
												#{order.order_number}
											</td>
											<td class="px-4 py-3 text-sm text-gray-700">
												{order.buyer_email}
											</td>
											<td class="px-4 py-3 text-sm text-gray-700">
												{order.tickets?.length || 0}
											</td>
											<td class="px-4 py-3 text-sm font-semibold text-gray-900">
												{formatCurrency(parseFloat(order.total_amount))}
											</td>
											<td class="px-4 py-3 text-sm text-gray-600">
												{formatDate(order.created_at)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p>Aún no hay órdenes para este evento</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Sidebar - Estadísticas -->
			<div class="space-y-6">
				<!-- Resumen de ventas -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-lg font-bold text-gray-900 mb-4">Resumen de Ventas</h2>
					
					<!-- Ingresos totales -->
					<div class="mb-6">
						<p class="text-sm text-gray-600 mb-1">Ingresos Totales</p>
						<p class="text-3xl font-bold text-green-600">
							{formatCurrency(stats.total_revenue || 0)}
						</p>
					</div>

					<!-- Ocupación -->
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<p class="text-sm text-gray-600">Ocupación</p>
							<p class="text-sm font-bold text-purple-600">
								{occupancyPercentage.toFixed(1)}%
							</p>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
							<div 
								class="h-full bg-purple-600 rounded-full transition-all duration-500"
								style="width: {Math.min(occupancyPercentage, 100)}%"
							></div>
						</div>
						<div class="flex justify-between text-sm text-gray-600">
							<span>{soldTickets} vendidos</span>
							<span>{totalTickets} total</span>
						</div>
					</div>

					<!-- Estadísticas adicionales -->
					<div class="space-y-4">
						<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<div class="flex items-center gap-3">
								<div class="p-2 bg-blue-100 rounded-lg">
									<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<p class="text-xs text-blue-700 font-semibold">Órdenes</p>
									<p class="text-lg font-bold text-blue-900">{stats.total_orders || 0}</p>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
							<div class="flex items-center gap-3">
								<div class="p-2 bg-orange-100 rounded-lg">
									<svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
								<div>
									<p class="text-xs text-orange-700 font-semibold">Compradores</p>
									<p class="text-lg font-bold text-orange-900">{stats.unique_buyers || 0}</p>
								</div>
							</div>
						</div>

						{#if stats.avg_ticket_price && stats.avg_ticket_price > 0}
							<div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
								<div class="flex items-center gap-3">
									<div class="p-2 bg-purple-100 rounded-lg">
										<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
										</svg>
									</div>
									<div>
										<p class="text-xs text-purple-700 font-semibold">Precio Promedio</p>
										<p class="text-lg font-bold text-purple-900">
											{formatCurrency(stats.avg_ticket_price)}
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Acciones rápidas -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-lg font-bold text-gray-900 mb-4">Acciones</h2>
					<div class="space-y-3">
						<a
							href="/organizador/eventos/{event.slug}/tickets"
							class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
						>
							<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
							</svg>
							<span class="font-semibold text-gray-700">Ver Todos los Tickets</span>
						</a>

						<a
							href="/organizador/eventos/{event.slug}/ordenes"
							class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
						>
							<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<span class="font-semibold text-gray-700">Ver Todas las Órdenes</span>
						</a>

						<a
							href="/organizador/eventos/{event.slug}/editar"
							class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
						>
							<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							<span class="font-semibold text-gray-700">Editar Evento</span>
						</a>
					</div>
				</div>

				<!-- Estado del evento -->
				<div class="bg-white rounded-xl shadow-md p-6">
					<h2 class="text-lg font-bold text-gray-900 mb-4">Estado</h2>
					<div class="space-y-2">
						{#if isEventPast}
							<div class="flex items-center gap-2 text-gray-600">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
								</svg>
								<span class="text-sm">Evento finalizado</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 text-green-600">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								<span class="text-sm font-semibold">Evento activo</span>
							</div>
						{/if}

						{#if availableTickets > 0}
							<div class="flex items-center gap-2 text-blue-600">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								<span class="text-sm">Tickets disponibles</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 text-red-600">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
								<span class="text-sm font-semibold">Agotado</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
