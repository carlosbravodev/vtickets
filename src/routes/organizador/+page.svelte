<script lang="ts">
	import type { PageData } from './$types';
	import { fade } from 'svelte/transition';
	
	let { data }: { data: PageData } = $props();
	const globalStats = $derived(data.globalStats);
	const topEvents = $derived(data.topEvents);
	const activeEvents = $derived(data.activeEvents);
	const recentOrders = $derived(data.recentOrders);

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
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

	function formatEventDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Organizador | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
					<p class="mt-1 text-sm text-gray-600">
						Resumen general de todos tus eventos
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
		<!-- Estadísticas Principales -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<!-- Ingresos Totales -->
			<div class="bg-white rounded-xl shadow-md p-6" in:fade={{ duration: 200, delay: 0 }}>
				<div class="flex items-center justify-between mb-2">
					<div class="p-3 bg-green-100 rounded-lg">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
				<p class="text-sm text-gray-600 mb-1">Ingresos Totales</p>
				<p class="text-2xl font-bold text-gray-900">
					{formatCurrency(globalStats.totalRevenue)}
				</p>
			</div>

			<!-- Tickets Vendidos -->
			<div class="bg-white rounded-xl shadow-md p-6" in:fade={{ duration: 200, delay: 0 }}>
				<div class="flex items-center justify-between mb-2">
					<div class="p-3 bg-purple-100 rounded-lg">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
						</svg>
					</div>
				</div>
				<p class="text-sm text-gray-600 mb-1">Tickets Vendidos</p>
				<p class="text-2xl font-bold text-gray-900">
					{globalStats.totalTicketsSold.toLocaleString()}
				</p>
			</div>

			<!-- Órdenes -->
			<div class="bg-white rounded-xl shadow-md p-6" in:fade={{ duration: 200, delay: 0 }}>
				<div class="flex items-center justify-between mb-2">
					<div class="p-3 bg-blue-100 rounded-lg">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
				</div>
				<p class="text-sm text-gray-600 mb-1">Total Órdenes</p>
				<p class="text-2xl font-bold text-gray-900">
					{globalStats.totalOrders.toLocaleString()}
				</p>
			</div>

			<!-- Compradores -->
			<div class="bg-white rounded-xl shadow-md p-6" in:fade={{ duration: 200, delay: 0 }}>
				<div class="flex items-center justify-between mb-2">
					<div class="p-3 bg-orange-100 rounded-lg">
						<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					</div>
				</div>
				<p class="text-sm text-gray-600 mb-1">Compradores</p>
				<p class="text-2xl font-bold text-gray-900">
					{globalStats.uniqueBuyers.toLocaleString()}
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Eventos con Más Ingresos -->
			<div class="bg-white rounded-xl shadow-md p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900">Top Eventos por Ingresos</h2>
					<a href="/organizador/eventos" class="text-sm text-purple-600 hover:text-purple-700 font-semibold">
						Ver todos →
					</a>
				</div>
				
				{#if topEvents && topEvents.length > 0}
					<div class="space-y-4">
						{#each topEvents as event, index}
						<div class="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
							<div class="shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
									<span class="text-sm font-bold text-purple-600">#{index + 1}</span>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold text-gray-900 truncate">
										{event.event_title}
									</p>
									<div class="flex items-center gap-4 mt-1">
										<span class="text-xs text-gray-500">
											{event.total_tickets_sold} tickets
										</span>
										<span class="text-xs text-gray-500">
											{event.total_orders} órdenes
										</span>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-bold text-green-600">
										{formatCurrency(event.total_revenue)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						<p>No hay eventos todavía</p>
					</div>
				{/if}
			</div>

			<!-- Próximos Eventos -->
			<div class="bg-white rounded-xl shadow-md p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900">Próximos Eventos</h2>
					<a href="/organizador/eventos" class="text-sm text-purple-600 hover:text-purple-700 font-semibold">
						Ver todos →
					</a>
				</div>
				
				{#if activeEvents && activeEvents.length > 0}
					<div class="space-y-4">
						{#each activeEvents as event}
							<a 
							href="/organizador/eventos/{event.slug}"
							class="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
						>
							<div class="shrink-0">
									<div class="p-2 bg-blue-100 rounded-lg">
										<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold text-gray-900 truncate">
										{event.title}
									</p>
									<p class="text-xs text-gray-500 mt-1">
										{formatEventDate(event.event_date)}
									</p>
								</div>
								<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p>No hay eventos próximos</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Últimas Transacciones -->
		<div class="bg-white rounded-xl shadow-md p-6 mt-8">
			<h2 class="text-xl font-bold text-gray-900 mb-6">Últimas Transacciones</h2>
			
			{#if recentOrders && recentOrders.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Orden</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Evento</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Monto</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each recentOrders as order}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm font-medium text-gray-900">
										#{order.order_number}
									</td>
									<td class="px-4 py-3 text-sm text-gray-700">
										<a 
											href="/organizador/eventos/{order.events?.slug}"
											class="text-purple-600 hover:text-purple-700 font-medium"
										>
											{order.events?.title || 'N/A'}
										</a>
									</td>
									<td class="px-4 py-3 text-sm text-gray-700">
										{order.buyer_email}
									</td>
									<td class="px-4 py-3 text-sm font-semibold text-gray-900">
										{formatCurrency(parseFloat(order.total_amount))}
									</td>
									<td class="px-4 py-3 text-sm text-gray-600">
										{formatDate(order.created_at)}
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
											</svg>
											Completada
										</span>
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
					<p>No hay transacciones todavía</p>
				</div>
			{/if}
		</div>
	</div>
</div>
