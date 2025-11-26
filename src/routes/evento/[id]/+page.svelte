<script lang="ts">
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { logger } from '$lib/logger';
	import { toast } from '$lib/stores/toast.svelte';
	
	let { data } = $props();
	const { event, user } = data;
	
	// Verificar si el usuario está autenticado
	let isAuthenticated = $derived(!!user);
	
	// Verificar si el evento ya pasó
	let isEventPast = $derived(new Date(event.event_date) < new Date());
	
	// Obtener la URL actual para redirección después del login
	let currentPath = $derived($page.url.pathname);

	// Configurar Lemon Squeezy event listener
	onMount(() => {
		if (window.LemonSqueezy) {
			window.LemonSqueezy.Setup({
				eventHandler: (event: any) => {
					if (event.event === 'Checkout.Success') {
						// Redirigir a página de éxito cuando el pago se completa
						goto('/exito');
					}
				}
			});
		}

		// Resetear el estado de checkout cuando el usuario vuelve a la página
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// Si el usuario vuelve a la página y el estado está en "procesando", resetearlo
				if (isCreatingCheckout) {
					isCreatingCheckout = false;
				}
			}
		};

		// Resetear cuando la página se carga desde el caché (botón back del navegador)
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				// La página fue restaurada desde el caché (bfcache)
				isCreatingCheckout = false;
			}
		};

		// Escuchar cuando el usuario regresa a la pestaña
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('pageshow', handlePageShow);

		// Cleanup
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('pageshow', handlePageShow);
			if (checkoutTimeout) clearTimeout(checkoutTimeout);
		};
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
		goto('/eventos');
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
	let checkoutTimeout: number | null = null;

	// Función para proceder al pago
	async function proceedToPayment() {
		// Verificar autenticación antes de proceder
		if (!isAuthenticated) {
			toast.warning('Debes iniciar sesión para comprar entradas', 4000);
			setTimeout(() => {
				goto(`/iniciar-sesion?redirectTo=${encodeURIComponent(currentPath)}`);
			}, 500);
			return;
		}
		
		if (totalAmount <= 0) return;

		isCreatingCheckout = true;

		// Timeout de seguridad: resetear después de 3 minutos si no se completa
		checkoutTimeout = window.setTimeout(() => {
			if (isCreatingCheckout) {
				logger.log('Checkout timeout - resetting state');
				isCreatingCheckout = false;
			}
		}, 180000); // 3 minutos

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
			// Si hay un redirectTo, redirigir a esa página
			if (data.redirectTo) {
				logger.log('Redirecting to:', data.redirectTo);
				toast.warning(data.message || 'Redirigiendo...', 5000);
				goto(data.redirectTo);
				return;
			}
			
			// Si no hay redirectTo, mostrar error
			logger.error('Error details:', data.details);
			toast.error(data.message || 'Error al crear el checkout. Por favor verifica tu configuración.', 6000);
			isCreatingCheckout = false;
			if (checkoutTimeout) clearTimeout(checkoutTimeout);
			return;
		}

		// Redirigir al checkout de Lemon Squeezy (sin parámetro de redirección)
		// La redirección se manejará manualmente después del pago
		window.location.href = data.checkoutUrl;
		} catch (error) {
			logger.error('Error:', error);
			toast.error('Error al procesar el pago. Por favor intenta de nuevo.', 5000);
			isCreatingCheckout = false;
			if (checkoutTimeout) clearTimeout(checkoutTimeout);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Botón de volver -->
	<div class="container mx-auto max-w-4xl px-4 pt-8 pb-4">
		<button
			onclick={goBack}
			class="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-black hover:text-white transition-all duration-200 shadow-sm border-2 border-black flex items-center gap-2"
			in:fly={{ x: -20, duration: 400, delay: 200 }}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			<span>Volver</span>
		</button>
	</div>

	<!-- Hero Section: Imagen + Info del Evento -->
	<div class="container mx-auto max-w-7xl px-4 pb-8" in:fade={{ duration: 400 }}>
		<div class="grid lg:grid-cols-2 gap-8 items-start">
			<!-- Imagen del evento (horizontal 4:3) -->
			<div class="w-full" style="aspect-ratio: 4/3;">
				<img
					class="w-full h-full object-cover rounded-2xl shadow-xl"
					src={optimizeSupabaseImage(event.image_url, { width: 1200, quality: 90 })}
					alt={event.title}
				/>
			</div>

			<!-- Información del evento -->
			<div class="space-y-8" in:fly={{ y: 30, duration: 500, delay: 300 }}>
				<!-- Título y badge -->
				<div>
					<h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-black mb-3 leading-tight" style="letter-spacing: -0.025em;">
						{event.title}
					</h1>
					{#if isEventPast}
						<span class="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
							Evento Finalizado
						</span>
					{:else if event.is_active}
						<span class="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
							Evento Activo
						</span>
					{/if}
				</div>

				<!-- Información clave en grid -->
				<div class="space-y-5">
					<!-- Fecha y hora -->
					<div class="flex items-start space-x-3">
						<div class="shrink-0 w-10 h-10 bg-black rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha y Hora</p>
							<p class="text-base font-bold text-black">{formatDateTime(event.event_date)}</p>
						</div>
					</div>

					<!-- Ubicación -->
					{#if event.location || event.venue}
						<div class="flex items-start space-x-3">
							<div class="shrink-0 w-10 h-10 bg-black rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
							<div>
								<p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ubicación</p>
								{#if event.venue}
									<p class="text-base font-bold text-black">{event.venue}</p>
									{#if event.location}
										<p class="text-sm font-medium text-gray-600">{event.location}</p>
									{/if}
								{:else}
									<p class="text-base font-bold text-black">{event.location}</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Descripción -->
				<div class="pt-4 border-t border-gray-200">
					<h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Acerca del Evento</h2>
					<p class="text-black text-base font-normal leading-relaxed whitespace-pre-line">{event.description}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Contenido principal: Compra de Entradas -->
	<div class="container mx-auto max-w-7xl px-4 pb-12" in:fly={{ y: 50, duration: 500, delay: 300 }}>
		<div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">

			{#if event.ticket_types && event.ticket_types.length > 0}
				<!-- Sección de Compra de Entradas -->
				<div class="mb-10 relative">
					<h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Entradas Disponibles</h2>
					
					<!-- Overlay si el evento ya pasó (prioridad máxima) -->
					{#if isEventPast}
						<div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 rounded-xl flex items-center justify-center" in:fade={{ duration: 300 }}>
							<div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border-2 border-black" in:fly={{ y: 20, duration: 400, delay: 100 }}>
								<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 class="text-2xl font-bold text-black mb-3">Evento Finalizado</h3>
								<p class="text-gray-600 mb-6">
									Lo sentimos, este evento ya ha pasado y las entradas ya no están disponibles para la compra.
								</p>
								<button
									onclick={goBack}
									class="w-full px-6 py-3 bg-white hover:bg-black text-black hover:text-white border-2 border-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
									</svg>
									Ver Otros Eventos
								</button>
							</div>
						</div>
					{/if}
					
					<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each event.ticket_types as ticket, i (ticket.id)}
							<div
								in:fly={{ y: 30, duration: 400, delay: 400 + (i * 100) }}
								class="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
							>
							<!-- Nombre del ticket -->
							<div class="flex items-center justify-between mb-5">
								<h3 class="text-lg font-extrabold text-black">{ticket.name}</h3>
								<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
								</svg>
							</div>

							<!-- Precio -->
							<div class="mb-5">
								<span class="text-4xl font-extrabold text-black" style="letter-spacing: -0.02em;">${ticket.price}</span>
								<span class="text-gray-400 ml-2 text-sm font-medium uppercase tracking-wide">por entrada</span>
							</div>

							<!-- Disponibilidad -->
							<div class="flex items-center text-xs text-green-600 font-bold uppercase tracking-wide mb-5">
									<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>Disponible</span>
								</div>

								<!-- Botón de selección o controles de cantidad -->
								{#if !selectedTickets[ticket.id]}
									<button
										onclick={() => selectTicket(ticket.id)}
										class="w-full py-2 px-4 bg-white hover:bg-black text-black hover:text-white border-2 border-black font-semibold rounded-lg transition-all duration-200"
									>
										Seleccionar
									</button>
								{:else}
									<div class="flex items-center justify-between gap-2">
									<!-- Botón disminuir -->
									<button
										onclick={() => decreaseQuantity(ticket.id)}
										disabled={isCreatingCheckout}
										class="shrink-0 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-red-300"
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
											class="w-full py-2 px-4 text-center text-lg font-bold bg-white border-2 border-black rounded-lg focus:outline-none"
										/>
									</div>

									<!-- Botón aumentar -->
									<button
										onclick={() => increaseQuantity(ticket.id, ticket.available_tickets)}
										disabled={isCreatingCheckout}
										class="shrink-0 w-10 h-10 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-green-300"
										aria-label="Aumentar cantidad"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
										</svg>
									</button>
								</div>									<!-- Subtotal para este tipo de ticket -->
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
					<div class="bg-gray-50 rounded-xl p-8 mb-8" in:fly={{ y: 20, duration: 400 }}>
						<div class="flex items-center justify-between mb-6">
							<div>
								<h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total a pagar</h3>
								<p class="text-xs text-gray-500 font-medium">
									{Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)} 
									{Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) === 1 ? 'entrada' : 'entradas'} seleccionada(s)
								</p>
							</div>
							<div class="text-right">
								<p class="text-5xl font-extrabold text-black" style="letter-spacing: -0.03em;">${totalAmount.toFixed(2)}</p>
							</div>
						</div>

						<!-- Desglose de tickets -->
						<div class="space-y-3 pt-5 border-t border-gray-200">
							{#each event.ticket_types as ticket}
								{#if selectedTickets[ticket.id]}
									<div class="flex items-center justify-between">
										<span class="text-sm text-gray-600 font-medium">
											{ticket.name} x {selectedTickets[ticket.id]}
										</span>
										<span class="text-base font-bold text-black">
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
							class="px-10 py-5 bg-white hover:bg-black text-black hover:text-white border-2 border-black font-extrabold text-base rounded-lg focus:outline-none transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 uppercase tracking-wide"
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

<!-- Overlay de redirección al checkout -->
{#if isCreatingCheckout}
	<div 
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
		in:fade={{ duration: 200 }}
	>
		<div 
			class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border-2 border-black"
			in:fly={{ y: 20, duration: 300 }}
		>
			<!-- Spinner grande -->
			<div class="flex justify-center mb-6">
				<svg class="animate-spin h-16 w-16 text-black" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
			
			<!-- Mensaje -->
			<h3 class="text-2xl font-bold text-black mb-3">
				Preparando tu compra...
			</h3>
			<p class="text-gray-600 mb-4">
				Estamos creando tu sesión de pago segura con Lemon Squeezy
			</p>
			
			<!-- Icono de Lemon Squeezy -->
			<div class="flex items-center justify-center gap-2 text-sm text-gray-500">
				<span>🍋</span>
				<span>Procesador de pagos seguro</span>
			</div>
		</div>
	</div>
{/if}
