<script lang="ts">
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { data } = $props();
	const { event } = data;

	// Configurar Lemon Squeezy event listener
	onMount(() => {
		if (window.LemonSqueezy) {
			window.LemonSqueezy.Setup({
				eventHandler: (event: any) => {
					if (event.event === 'Checkout.Success') {
						// Redirigir a página de éxito cuando el pago se completa
						goto('/success');
					}
				}
			});
		}
	});

	// Estado para las cantidades de tickets seleccionados
	type TicketSelection = {
		[ticketId: string]: number;
	};
	
	let selectedTickets = $state<TicketSelection>({});
	
	// Calcular el total
	let totalAmount = $derived.by(() => {
		let total = 0;
		if (event.ticket_types) {
			for (const ticket of event.ticket_types) {
				const quantity = selectedTickets[ticket.id] || 0;
				total += quantity * parseFloat(ticket.price);
			}
		}
		return total;
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

	function goBack() {
		goto('/');
	}

	function selectTicket(ticketId: string) {
		if (!selectedTickets[ticketId]) {
			selectedTickets[ticketId] = 1;
		}
	}

	function increaseQuantity(ticketId: string, maxTickets: number) {
		const currentQuantity = selectedTickets[ticketId] || 0;
		if (currentQuantity < maxTickets && currentQuantity < 10) {
			selectedTickets[ticketId] = currentQuantity + 1;
		}
	}

	function decreaseQuantity(ticketId: string) {
		const currentQuantity = selectedTickets[ticketId] || 0;
		if (currentQuantity > 1) {
			selectedTickets[ticketId] = currentQuantity - 1;
		} else {
			delete selectedTickets[ticketId];
		}
	}

	// Estado de loading para el checkout
	let isCreatingCheckout = $state(false);

	// Función para proceder al pago
	async function proceedToPayment() {
		if (totalAmount <= 0) return;

		isCreatingCheckout = true;

		try {
			// Construir descripción detallada de los tickets
			const ticketDetails = event.ticket_types
				.filter((ticket: any) => selectedTickets[ticket.id])
				.map((ticket: any) => {
					const qty = selectedTickets[ticket.id];
					return `${ticket.name} x${qty} ($${ticket.price} c/u)`;
				})
				.join('\n');

			const response = await fetch('/api/create-checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					eventId: event.id,
					eventTitle: event.title,
					tickets: selectedTickets,
					totalAmount: totalAmount,
					ticketDetails: ticketDetails
				})
			});

			const data = await response.json();

			if (data.error) {
				console.error('Error details:', data.details);
				alert('Error al crear el checkout. Por favor verifica tu configuración de Lemon Squeezy.');
				isCreatingCheckout = false;
				return;
			}

			// Redirigir al checkout de Lemon Squeezy
			window.location.href = data.checkoutUrl;
		} catch (error) {
			console.error('Error:', error);
			alert('Error al procesar el pago. Por favor intenta de nuevo.');
			isCreatingCheckout = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section con imagen -->
	<div class="relative h-96 overflow-hidden" in:fade={{ duration: 400 }}>
		<img
			class="w-full h-full object-cover"
			src={optimizeSupabaseImage(event.image_url, { width: 1920, quality: 90 })}
			alt={event.title}
		/>
		<div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10"></div>
		
		<!-- Botón de volver atrás - Superior izquierda -->
		<div class="absolute top-8 left-8 z-30" in:fly={{ x: -30, duration: 500, delay: 100 }}>
			<button
				onclick={goBack}
				class="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm group"
				aria-label="Volver a eventos"
			>
				<svg 
					class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				<span class="font-semibold">Volver a eventos</span>
			</button>
		</div>
		
		<!-- Título sobre la imagen -->
		<div class="absolute bottom-0 left-0 right-0 p-8" in:fly={{ y: 30, duration: 600, delay: 200 }}>
			<div class="container mx-auto max-w-5xl">
				<h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
					{event.title}
				</h1>
				{#if event.is_active}
					<span class="inline-block bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
						Evento Activo
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Contenido principal -->
	<div class="container mx-auto max-w-5xl px-4 py-12" in:fly={{ y: 50, duration: 500, delay: 300 }}>
		<div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
			<!-- Información clave -->
			<div class="grid md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
				<!-- Fecha y hora -->
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha y Hora</h3>
						<p class="text-lg text-gray-900">{formatDateTime(event.event_date)}</p>
					</div>
				</div>

				<!-- Ubicación -->
				{#if event.location}
					<div class="flex items-start space-x-4">
						<div class="shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Ubicación</h3>
							<p class="text-lg text-gray-900">{event.location}</p>
						</div>
					</div>
				{/if}

				<!-- Entradas disponibles -->
				{#if event.total_tickets}
					<div class="flex items-start space-x-4">
						<div class="shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Entradas Totales</h3>
							<p class="text-lg text-gray-900">{event.total_tickets.toLocaleString()}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Descripción -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Acerca del Evento</h2>
				<p class="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{event.description}</p>
			</div>

			<!-- Tipos de Tickets -->
			{#if event.ticket_types && event.ticket_types.length > 0}
				<div class="mb-8 pb-8 border-b border-gray-200">
					<h2 class="text-2xl font-bold text-gray-900 mb-6">Tipos de Entradas</h2>
					<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each event.ticket_types as ticket, i (ticket.id)}
							<div
								in:fly={{ y: 30, duration: 400, delay: 400 + (i * 100) }}
								class="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
							>
								<!-- Nombre del ticket -->
								<div class="flex items-center justify-between mb-4">
									<h3 class="text-xl font-bold text-gray-900">{ticket.name}</h3>
									<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
									</svg>
								</div>

								<!-- Precio -->
								<div class="mb-4">
									<span class="text-3xl font-extrabold text-indigo-600">${ticket.price}</span>
									<span class="text-gray-500 ml-1">por entrada</span>
								</div>

								<!-- Disponibilidad -->
								<div class="flex items-center text-sm text-gray-600 mb-4">
									<svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>{ticket.available_tickets} disponibles</span>
								</div>

								<!-- Botón de selección o controles de cantidad -->
								{#if !selectedTickets[ticket.id]}
									<button
										onclick={() => selectTicket(ticket.id)}
										class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
									>
										Seleccionar
									</button>
								{:else}
									<div class="flex items-center justify-between gap-2">
										<!-- Botón disminuir -->
										<button
											onclick={() => decreaseQuantity(ticket.id)}
											class="shrink-0 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
											aria-label="Disminuir cantidad"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
											</svg>
										</button>

										<!-- Input de cantidad -->
										<div class="flex-1 text-center">
											<input
												type="number"
												value={selectedTickets[ticket.id]}
												readonly
												class="w-full py-2 px-4 text-center text-lg font-bold bg-white border-2 border-indigo-300 rounded-lg focus:outline-none"
											/>
										</div>

										<!-- Botón aumentar -->
										<button
											onclick={() => increaseQuantity(ticket.id, ticket.available_tickets)}
											class="shrink-0 w-10 h-10 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
											aria-label="Aumentar cantidad"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
										</button>
									</div>

									<!-- Subtotal para este tipo de ticket -->
									<div class="mt-3 text-center text-sm text-gray-600">
										Subtotal: <span class="font-bold text-indigo-600">${(selectedTickets[ticket.id] * parseFloat(ticket.price)).toFixed(2)}</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Resumen y botón de compra -->
			<div class="pt-8 border-t border-gray-200">
				{#if totalAmount > 0}
					<!-- Resumen del total -->
					<div class="bg-indigo-50 rounded-xl p-6 mb-6" in:fly={{ y: 20, duration: 400 }}>
						<div class="flex items-center justify-between mb-4">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Total a pagar</h3>
								<p class="text-sm text-gray-600">
									{Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)} 
									{Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) === 1 ? 'entrada' : 'entradas'} seleccionada(s)
								</p>
							</div>
							<div class="text-right">
								<p class="text-4xl font-extrabold text-indigo-600">${totalAmount.toFixed(2)}</p>
							</div>
						</div>

						<!-- Desglose de tickets -->
						<div class="space-y-2 pt-4 border-t border-indigo-200">
							{#each event.ticket_types as ticket}
								{#if selectedTickets[ticket.id]}
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-700">
											{ticket.name} x {selectedTickets[ticket.id]}
										</span>
										<span class="font-semibold text-gray-900">
											${(selectedTickets[ticket.id] * parseFloat(ticket.price)).toFixed(2)}
										</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Botón de compra -->
					<div class="flex justify-center">
						<button
							onclick={proceedToPayment}
							disabled={isCreatingCheckout}
							class="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if isCreatingCheckout}
								<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Procesando...
							{:else}
								🍋 Proceder al pago
							{/if}
						</button>
					</div>
				{:else}
					<!-- Mensaje cuando no hay tickets seleccionados -->
					<div class="text-center">
						<p class="text-gray-500 mb-4">Selecciona tus entradas para continuar</p>
						<button
							disabled
							class="px-8 py-4 bg-gray-300 text-gray-500 font-bold text-lg rounded-lg cursor-not-allowed"
						>
							Comprar Entradas
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
