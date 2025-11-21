<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Tipo para verificaciones
	type Verification = any; // Simplificado para evitar problemas de tipos con Supabase

	// Estado para filtros
	let dateFrom = $state(data.filters.dateFrom || '');
	let dateTo = $state(data.filters.dateTo || '');
	let selectedVerifier = $state(data.filters.verifierId || '');

	// Aplicar filtros
	function applyFilters() {
		const params = new URLSearchParams();
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);
		if (selectedVerifier) params.set('verifier', selectedVerifier);
		params.set('page', '1'); // Reset a la página 1 al filtrar

		goto(`?${params.toString()}`, { keepFocus: true });
	}

	// Limpiar filtros
	function clearFilters() {
		dateFrom = '';
		dateTo = '';
		selectedVerifier = '';
		goto($page.url.pathname, { keepFocus: true });
	}

	// Formatear fecha
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('es-ES', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(date);
	}

	// Formatear precio
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(price);
	}

	// Exportar a CSV
	async function exportToCSV() {
		const csvRows = [
			['Fecha', 'Hora', 'Nombre Cliente', 'Email', 'Tipo de Ticket', 'Precio', 'Código Ticket', 'Verificado Por'].join(',')
		];

		data.verifications.forEach((v: Verification) => {
			const date = new Date(v.verified_at);
			const dateStr = date.toLocaleDateString('es-ES');
			const timeStr = date.toLocaleTimeString('es-ES');
			const customerName = v.ticket?.order?.customer_name || 'N/A';
			const customerEmail = v.ticket?.order?.customer_email || 'N/A';
			const ticketType = v.ticket?.ticket_type?.name || 'N/A';
			const price = v.ticket?.ticket_type?.price ? formatPrice(v.ticket.ticket_type.price) : 'N/A';
			const code = v.ticket?.code || 'N/A';
			const verifierEmail = v.verifier?.email || 'N/A';

			csvRows.push([
				`"${dateStr}"`,
				`"${timeStr}"`,
				`"${customerName}"`,
				`"${customerEmail}"`,
				`"${ticketType}"`,
				`"${price}"`,
				`"${code}"`,
				`"${verifierEmail}"`
			].join(','));
		});

		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `historial_${data.event.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}
</script>

<svelte:head>
	<title>Historial - {data.event.title} | VTickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-12">
	<!-- Header -->
	<div class="bg-white border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<a
						href="/organizador/verificar/{data.event.id}"
						class="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-2"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Volver a escaneo
					</a>
					<h1 class="text-3xl font-bold text-gray-900">Historial de Verificaciones</h1>
					<p class="text-gray-600 mt-1">{data.event.title}</p>
				</div>
				<button
					onclick={exportToCSV}
					class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Exportar CSV
				</button>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
		<!-- Filtros -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-2">
						Desde
					</label>
					<input
						id="dateFrom"
						type="date"
						bind:value={dateFrom}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<div>
					<label for="dateTo" class="block text-sm font-medium text-gray-700 mb-2">
						Hasta
					</label>
					<input
						id="dateTo"
						type="date"
						bind:value={dateTo}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<div>
					<label for="verifier" class="block text-sm font-medium text-gray-700 mb-2">
						Verificado por
					</label>
					<select
						id="verifier"
						bind:value={selectedVerifier}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="">Todos</option>
						{#each data.verifiers as verifier}
							<option value={verifier.id}>{verifier.email}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end gap-2">
					<button
						onclick={applyFilters}
						class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
					>
						Aplicar
					</button>
					<button
						onclick={clearFilters}
						class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
					>
						Limpiar
					</button>
				</div>
			</div>
		</div>

		<!-- Estadísticas -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Total de verificaciones</p>
					<p class="text-3xl font-bold text-gray-900">{data.pagination.totalItems}</p>
				</div>
				<div class="text-right">
					<p class="text-sm text-gray-600">
						Mostrando {Math.min((data.pagination.currentPage - 1) * data.pagination.perPage + 1, data.pagination.totalItems)} - 
						{Math.min(data.pagination.currentPage * data.pagination.perPage, data.pagination.totalItems)} de {data.pagination.totalItems}
					</p>
				</div>
			</div>
		</div>

		<!-- Tabla de verificaciones -->
		{#if data.verifications.length === 0}
			<div class="bg-white rounded-lg shadow-sm p-12 text-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">No hay verificaciones</h3>
				<p class="text-gray-600">
					{#if dateFrom || dateTo || selectedVerifier}
						No se encontraron verificaciones con los filtros seleccionados.
					{:else}
						Aún no se han verificado tickets para este evento.
					{/if}
				</p>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-sm overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Fecha y Hora
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Cliente
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Tipo de Ticket
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Código
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Verificado por
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.verifications as verification (verification.id)}
								{@const v = verification as Verification}
								<tr class="hover:bg-gray-50 transition">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{formatDate(v.verified_at)}
										</div>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm font-medium text-gray-900">
											{v.ticket?.order?.customer_name || 'N/A'}
										</div>
										<div class="text-sm text-gray-500">
											{v.ticket?.order?.customer_email || ''}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{v.ticket?.ticket_type?.name || 'N/A'}
										</div>
										<div class="text-sm text-gray-500">
											{v.ticket?.ticket_type?.price 
												? formatPrice(v.ticket.ticket_type.price) 
												: ''}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<code class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
											{v.ticket?.code || 'N/A'}
										</code>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">
											{v.verifier?.email || 'N/A'}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Paginación -->
			{#if data.pagination.totalPages > 1}
				<div class="mt-6 flex items-center justify-between">
					<div class="text-sm text-gray-600">
						Página {data.pagination.currentPage} de {data.pagination.totalPages}
					</div>
					<div class="flex gap-2">
						{#if data.pagination.currentPage > 1}
							<a
								href="?{new URLSearchParams({ 
									...(dateFrom && { dateFrom }), 
									...(dateTo && { dateTo }), 
									...(selectedVerifier && { verifier: selectedVerifier }), 
									page: String(data.pagination.currentPage - 1) 
								}).toString()}"
								class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
							>
								Anterior
							</a>
						{/if}
						{#if data.pagination.currentPage < data.pagination.totalPages}
							<a
								href="?{new URLSearchParams({ 
									...(dateFrom && { dateFrom }), 
									...(dateTo && { dateTo }), 
									...(selectedVerifier && { verifier: selectedVerifier }), 
									page: String(data.pagination.currentPage + 1) 
								}).toString()}"
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
							>
								Siguiente
							</a>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
