<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';
	
	let { data, form }: { data: any; form: any } = $props();
	
	// Rastrear el último form para evitar duplicados en el mismo render
	let lastFormTimestamp = $state(0);
	
	// Mostrar toast cuando hay resultado del servidor
	$effect(() => {
		if (form?.message) {
			// Crear un identificador único basado en el tiempo
			const currentTimestamp = Date.now();
			
			// Solo mostrar si ha pasado al menos 100ms desde el último (evita duplicados en mismo render)
			if (currentTimestamp - lastFormTimestamp > 100) {
				lastFormTimestamp = currentTimestamp;
				
				if (form.success) {
					toast.success(form.message);
				} else {
					toast.error(form.message);
				}
			}
		}
	});
	
	let QRCodeStyling: any = null;
	let isQRLibraryLoaded = $state(false);
	
	// Estado de las pestañas (por defecto "perfil")
	let activeTab = $state<'entradas' | 'perfil'>('perfil');
	let isSubmitting = $state(false);

	// Cargar la librería solo en el cliente
	onMount(async () => {
		try {
			const QRCodeStylingModule = await import('qr-code-styling');
			QRCodeStyling = QRCodeStylingModule.default;
			isQRLibraryLoaded = true;
		} catch (error) {
			console.error('Error cargando qr-code-styling:', error);
		}
	});

	// Generar QR code moderno como data URL
	async function generateQRImage(jwt: string): Promise<string> {
		// Solo ejecutar en el navegador
		if (!browser) {
			return '';
		}

		try {
			// Esperar a que la librería esté cargada (máximo 5 segundos)
			let attempts = 0;
			while (!QRCodeStyling && attempts < 50) {
				await new Promise(resolve => setTimeout(resolve, 100));
				attempts++;
			}

			if (!QRCodeStyling) {
				console.error('QRCodeStyling no se cargó después de 5 segundos');
				return '';
			}

			const qrCode = new QRCodeStyling({
				width: 400,
				height: 400,
				data: jwt,
				margin: 15,
				qrOptions: {
					typeNumber: 0, // Auto-ajuste según datos (ahora más pequeño por JWT optimizado)
					mode: 'Byte',
					errorCorrectionLevel: 'L' // L = Baja corrección (7%) → PUNTOS MÁS GRANDES ✅
				},
				imageOptions: {
					hideBackgroundDots: true,
					imageSize: 0.4,
					margin: 0,
					saveAsBlob: true
				},
				dotsOptions: {
					type: 'extra-rounded', // Puntos súper redondeados
					color: '#000000',
					roundSize: true
				},
				backgroundOptions: {
					color: '#ffffff',
					round: 0
				},
				cornersSquareOptions: {
					type: 'extra-rounded', // Esquinas redondeadas más grandes
					color: '#000000'
				},
				cornersDotOptions: {
					type: 'dot', // Puntos internos de las esquinas más visibles
					color: '#000000'
				}
			});

			// Convertir a data URL
			const blob = await qrCode.getRawData('png');
			if (!blob) {
				console.error('No se pudo generar el blob del QR');
				return '';
			}
			
			return new Promise((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.onerror = () => {
					console.error('Error leyendo el blob');
					resolve('');
				};
				reader.readAsDataURL(blob);
			});
		} catch (error) {
			console.error('Error generando QR:', error);
			return '';
		}
	}

	// Descargar QR como imagen
	function downloadQR(dataUrl: string, ticketCode: string) {
		const link = document.createElement('a');
		link.download = `ticket-${ticketCode}.png`;
		link.href = dataUrl;
		link.click();
	}

	// Obtener color del estado del ticket
	const getTicketStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'used':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			case 'cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'refunded':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const getTicketStatusText = (status: string) => {
		switch (status) {
			case 'active':
				return '✓ Activo';
			case 'used':
				return '✓ Usado';
			case 'cancelled':
				return '✗ Cancelado';
			case 'refunded':
				return '↩ Reembolsado';
			default:
				return status;
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'refunded':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'paid':
				return 'Pagado';
			case 'pending':
				return 'Pendiente';
			case 'refunded':
				return 'Reembolsado';
			default:
				return status;
		}
	};
</script>

<svelte:head>
	<title>Mi Cuenta | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-black text-gray-900 mb-2">Mi Cuenta</h1>
			<p class="text-xl text-gray-600">
				Bienvenido, <span class="font-bold">
					{#if data.profile?.first_name && data.profile?.last_name}
						{data.profile.first_name} {data.profile.last_name}
					{:else if data.profile?.first_name}
						{data.profile.first_name}
					{:else}
						{data.user.email}
					{/if}
				</span>
			</p>
		</div>

		<!-- Pestañas de Navegación -->
		<div class="mb-6 border-b border-gray-200">
			<nav class="flex space-x-8" aria-label="Tabs">
				<button
					onclick={() => activeTab = 'perfil'}
					class="tab-button {activeTab === 'perfil' ? 'tab-active' : 'tab-inactive'}"
				>
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
					</svg>
					Mi Perfil
				</button>
				
				<button
					onclick={() => activeTab = 'entradas'}
					class="tab-button {activeTab === 'entradas' ? 'tab-active' : 'tab-inactive'}"
				>
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
					</svg>
					Mis Entradas
					{#if data.orders.length > 0}
						<span class="ml-2 px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
							{data.orders.length}
						</span>
					{/if}
				</button>
			</nav>
		</div>

		<!-- Contenido de las Pestañas -->
		
		<!-- Pestaña: Mis Entradas -->
		{#if activeTab === 'entradas'}
		<div class="bg-white rounded-lg shadow">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-2xl font-bold text-gray-900">Mis Compras</h2>
			</div>

			{#if data.orders.length === 0}
				<div class="px-6 py-12 text-center">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
					<h3 class="mt-2 text-lg font-medium text-gray-900">No tienes compras aún</h3>
					<p class="mt-1 text-gray-500">Explora nuestros eventos y compra tus entradas.</p>
					<div class="mt-6">
						<a
							href="/eventos"
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
						>
							Ver Eventos
						</a>
					</div>
				</div>
			{:else}
			<div class="divide-y divide-gray-200">
				{#each data.orders as order}
					{@const event = Array.isArray(order.event) ? order.event[0] : order.event}
					<div class="px-6 py-6 hover:bg-gray-50 transition-colors">
						<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
							<!-- Info del Evento -->
							<div class="flex-1">
								<div class="flex items-start gap-4">
									{#if event?.image_url}
										<img
											src={event.image_url}
											alt={event.title}
											class="w-24 h-24 object-cover rounded-lg shrink-0"
										/>
									{/if}
									<div class="flex-1">
										<h3 class="text-lg font-bold text-gray-900 mb-1">
											{event?.title || 'Evento'}
										</h3>
										<div class="space-y-1 text-sm text-gray-600">
											<p class="flex items-center gap-2">
												<svg
													class="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
												{event?.event_date
													? formatDate(event.event_date)
													: 'Fecha por confirmar'}
											</p>
											<p class="flex items-center gap-2">
												<svg
													class="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
												{event?.location || 'Ubicación por confirmar'}
											</p>
										</div>
									</div>
								</div>									<!-- Resumen de Tickets -->
									<div class="mt-4 ml-28">
										<p class="text-sm font-medium text-gray-700 mb-2">
											Resumen de entradas:
										</p>
										<div class="space-y-1">
											{#each order.ticketsDetails as ticket}
												<div class="flex items-center justify-between text-sm">
													<span class="text-gray-600">
														{ticket.quantity}x {ticket.name}
													</span>
													<span class="text-gray-900 font-medium">
														{formatPrice(ticket.price)}
													</span>
												</div>
											{/each}
										</div>
									</div>
								</div>

								<!-- Info de la Compra -->
								<div class="lg:text-right space-y-2">
									<div>
										<span
											class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(
												order.payment_status
											)}"
										>
											{getStatusText(order.payment_status)}
										</span>
									</div>
									<p class="text-2xl font-bold text-gray-900">
										{formatPrice(order.total_price)}
									</p>
									<p class="text-xs text-gray-500">
										Comprado el {formatDate(order.created_at)}
									</p>
								<p class="text-xs text-gray-400">
									Orden #{order.order_number || order.lemon_squeezy_order_id}
								</p>
								
								<!-- Botón Imprimir Tickets -->
								<div class="mt-4">
									<a
										href="/imprimir-tickets/{order.id}"
										target="_blank"
										class="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold rounded-lg transition-all duration-200 text-sm"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
										</svg>
										Imprimir Tickets
									</a>
								</div>
							</div>
							</div>

							<!-- Tickets Individuales con QR -->
							{#if order.tickets && order.tickets.length > 0}
								<div class="mt-6 pt-6 border-t border-gray-200">
									<!-- Header desplegable -->
									<button
										onclick={() => {
											const ticketsSection = document.getElementById(`tickets-${order.id}`);
											const icon = document.getElementById(`icon-tickets-${order.id}`);
											if (ticketsSection && icon) {
												const isHidden = ticketsSection.classList.contains('hidden');
												ticketsSection.classList.toggle('hidden');
												icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
											}
										}}
										class="w-full flex items-center justify-between text-left mb-6 group hover:bg-gray-50 p-3 rounded-lg transition-colors"
									>
										<div class="flex items-center gap-2">
											<span class="text-2xl">🎫</span>
											<h4 class="text-lg font-bold text-gray-900">
												Tus Entradas ({order.tickets.length})
											</h4>
										</div>
										<svg 
											id="icon-tickets-{order.id}"
											class="w-6 h-6 text-gray-600 transition-transform duration-300"
											fill="none" 
											stroke="currentColor" 
											viewBox="0 0 24 24"
										>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
										</svg>
									</button>

									<!-- Contenido desplegable con scroll horizontal -->
									<div id="tickets-{order.id}" class="hidden tickets-scroll-container">
										<!-- Botones de scroll (solo visible en desktop y dentro del contenedor) -->
										<div class="hidden lg:flex gap-2 justify-end mb-4">
											<button 
												onclick={() => {
													const container = document.getElementById(`scroll-tickets-${order.id}`);
													if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
												}}
												class="w-10 h-10 rounded-full border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
												aria-label="Scroll izquierda"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="15 18 9 12 15 6"></polyline>
												</svg>
											</button>
											<button 
												onclick={() => {
													const container = document.getElementById(`scroll-tickets-${order.id}`);
													if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
												}}
												class="w-10 h-10 rounded-full border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
												aria-label="Scroll derecha"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="9 18 15 12 9 6"></polyline>
												</svg>
											</button>
										</div>

										<div id="scroll-tickets-{order.id}" class="tickets-scroll-wrapper">
									{#each order.tickets as ticket}
										{@const ticketType = Array.isArray(ticket.ticket_type)
											? ticket.ticket_type[0]
											: ticket.ticket_type}
										
										<!-- Ticket Card - Estilo Boarding Pass -->
										<div class="relative bg-linear-to-br from-indigo-600 to-purple-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
											<!-- Background Pattern -->
											<div class="absolute inset-0 opacity-10">
												<div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px);"></div>
											</div>
											
											<!-- Status Badge -->
											<div class="absolute top-4 right-4 z-10">
												<span class="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg {
													ticket.status === 'active' ? 'bg-green-400 text-green-900' :
													ticket.status === 'used' ? 'bg-gray-300 text-gray-700' :
													ticket.status === 'cancelled' ? 'bg-red-400 text-red-900' :
													'bg-yellow-400 text-yellow-900'
												}">
													{getTicketStatusText(ticket.status).toUpperCase()}
												</span>
											</div>

											<div class="relative p-6">
												<!-- Header -->
												<div class="mb-4">
													<div class="text-white/80 text-xs uppercase tracking-wider mb-1">
														Tipo de Entrada
													</div>
													<div class="text-white text-xl font-bold">
														{ticketType?.name || 'Entrada General'}
													</div>
												</div>

												<!-- Main Content - Two Columns -->
												<div class="grid grid-cols-[1fr,auto] gap-6 items-center">
													<!-- Left: Event Info -->
													<div class="space-y-4">
														<!-- Event Name -->
														<div>
															<div class="text-white/60 text-xs uppercase tracking-wider mb-1">
																Evento
															</div>
															<div class="text-white text-base font-semibold leading-tight">
																{event?.title || 'Evento'}
															</div>
														</div>

														<!-- Date & Location -->
														<div class="grid grid-cols-2 gap-3">
															<div>
																<div class="text-white/60 text-xs uppercase tracking-wider mb-1">
																	Fecha
																</div>
																<div class="text-white text-sm font-medium">
																	{#if event?.event_date}
																		{new Date(event.event_date).toLocaleDateString('es-ES', { 
																			day: '2-digit', 
																			month: 'short',
																			year: 'numeric'
																		})}
																	{:else}
																		Por confirmar
																	{/if}
																</div>
															</div>
															<div>
																<div class="text-white/60 text-xs uppercase tracking-wider mb-1">
																	Hora
																</div>
																<div class="text-white text-sm font-medium">
																	{#if event?.event_date}
																		{new Date(event.event_date).toLocaleTimeString('es-ES', { 
																			hour: '2-digit', 
																			minute: '2-digit'
																		})}
																	{:else}
																		--:--
																	{/if}
																</div>
															</div>
														</div>

														<!-- Ticket Code -->
														<div class="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
															<div class="text-white/60 text-xs uppercase tracking-wider mb-1">
																Código de Entrada
															</div>
															<div class="text-white font-mono text-sm font-bold tracking-wide">
																{ticket.ticket_code}
															</div>
														</div>

														{#if ticket.status === 'used' && ticket.scanned_at}
															<div class="bg-gray-900/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
																<p class="text-white/70 text-xs text-center">
																	✓ Escaneado el {formatDate(ticket.scanned_at)}
																</p>
															</div>
														{/if}
													</div>

													<!-- Right: QR Code -->
													<div class="flex flex-col items-center gap-3">
														{#await generateQRImage(ticket.qr_token)}
															<div class="w-44 h-44 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
																<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
															</div>
														{:then qrDataUrl}
															<div class="bg-white p-3 rounded-xl shadow-2xl border-4 border-white/30">
																<img
																	src={qrDataUrl}
																	alt="QR Code"
																	class="w-40 h-40 object-contain"
																/>
															</div>
														{:catch error}
															<div class="w-44 h-44 bg-red-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-sm border-2 border-red-500/50">
																Error QR
															</div>
														{/await}

														<div class="text-white/60 text-xs text-center max-w-44">
															Presenta este código en la entrada
														</div>
													</div>
												</div>

												<!-- Footer Actions -->
												{#if ticket.status === 'active'}
													<div class="mt-6 pt-4 border-t border-white/20 space-y-2">
														{#await generateQRImage(ticket.qr_token) then qrDataUrl}
															<button
																onclick={() => downloadQR(qrDataUrl, ticket.ticket_code)}
																class="w-full px-4 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
															>
																<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
																</svg>
																Descargar Entrada
															</button>
														{/await}
														<a
															href="/evento/{order.event_id}"
															class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 border border-white/30"
														>
															<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
															</svg>
															Ver Detalles del Evento
														</a>
													</div>
												{/if}
											</div>
										</div>
										{/each}
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Información adicional -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<div class="shrink-0">
					<svg
						class="h-5 w-5 text-blue-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">Información sobre tus entradas</h3>
					<div class="mt-2 text-sm text-blue-700 space-y-1">
						<p>
							🎫 Cada entrada tiene su propio código QR único y seguro.
						</p>
						<p>
							📱 Puedes descargar los QR o mostrarlos directamente desde esta página en el evento.
						</p>
						<p>
							✅ Los códigos QR son válidos hasta la fecha del evento.
						</p>
					</div>
				</div>
			</div>
		</div>
		{/if}

		<!-- Pestaña: Mi Perfil -->
		{#if activeTab === 'perfil'}
		<div class="bg-white rounded-lg shadow">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-2xl font-bold text-gray-900">Información Personal</h2>
			</div>

		<div class="px-6 py-8">
			<form 
				method="POST" 
				action="?/updateProfile" 
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						// Si la actualización fue exitosa, recargar todos los datos primero
						if (result.type === 'success') {
							await invalidateAll();
						}
						
						// Actualizar sin resetear el formulario
						await update({ reset: false });
						
						isSubmitting = false;
					};
				}}
				class="space-y-6"
			>
					<!-- Nombre y Apellido -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="first_name" class="block text-sm font-medium text-gray-700 mb-2">
								Nombres <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="first_name"
								name="first_name"
								value={data.profile?.first_name || ''}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Juan Carlos"
								required
							/>
						</div>

						<div>
							<label for="last_name" class="block text-sm font-medium text-gray-700 mb-2">
								Apellidos <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="last_name"
								name="last_name"
								value={data.profile?.last_name || ''}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Pérez García"
								required
							/>
						</div>
					</div>

					<!-- Email (solo lectura) -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Correo Electrónico
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={data.user.email}
							disabled
							class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
						/>
						<p class="mt-1 text-xs text-gray-500">El correo no se puede modificar</p>
					</div>

					<!-- Teléfono -->
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
							Teléfono <span class="text-red-500">*</span>
						</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							value={data.profile?.phone || ''}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="+593 99 999 9999"
						/>
					</div>

					<!-- Tipo de Documento y Número -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="document_type" class="block text-sm font-medium text-gray-700 mb-2">
								Tipo de Documento <span class="text-red-500">*</span>
							</label>
							<select
								id="document_type"
								name="document_type"
								value={data.profile?.document_type || 'cedula'}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							>
								<option value="cedula">Cédula</option>
								<option value="pasaporte">Pasaporte</option>
								<option value="ruc">RUC</option>
							</select>
						</div>

						<!-- Número de Documento -->
						<div>
							<label for="document_number" class="block text-sm font-medium text-gray-700 mb-2">
								Número de Documento <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="document_number"
								name="document_number"
								value={data.profile?.document_number || ''}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="1234567890"
							/>
						</div>
					</div>

					<!-- Fecha de Nacimiento -->
					<div>
						<label for="birth_date" class="block text-sm font-medium text-gray-700 mb-2">
							Fecha de Nacimiento
						</label>
						<input
							type="date"
							id="birth_date"
							name="birth_date"
							value={data.profile?.birth_date || ''}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>

					<!-- Ciudad y País -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="city" class="block text-sm font-medium text-gray-700 mb-2">
								Ciudad
							</label>
							<input
								type="text"
								id="city"
								name="city"
								value={data.profile?.city || ''}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Quito"
							/>
						</div>

						<div>
							<label for="country" class="block text-sm font-medium text-gray-700 mb-2">
								País
							</label>
							<input
								type="text"
								id="country"
								name="country"
								value={data.profile?.country || 'Ecuador'}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Ecuador"
							/>
						</div>
					</div>

					<!-- Botones -->
					<div class="flex gap-4 pt-4">
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-xl flex items-center gap-2"
						>
							{#if isSubmitting}
								<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Guardando...
							{:else}
								Guardar Cambios
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
		{/if}

	</div>
</div>

<style>
	/* Smooth transitions */
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}

	/* Estilos de pestañas */
	.tab-button {
		display: flex;
		align-items: center;
		padding: 1rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
		cursor: pointer;
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
	}

	.tab-active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	.tab-inactive {
		color: #6b7280;
		border-bottom-color: transparent;
	}

	.tab-inactive:hover {
		color: #374151;
		border-bottom-color: #d1d5db;
	}

	/* Tickets Scroll Container */
	.tickets-scroll-container {
		position: relative;
	}

	/* Wrapper con scroll horizontal */
	.tickets-scroll-wrapper {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-behavior: smooth;
		padding-bottom: 1.5rem;
		padding-right: 1.5rem;
		/* Ocultar scrollbar */
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.tickets-scroll-wrapper::-webkit-scrollbar {
		display: none;
	}

	/* Cada ticket card */
	.tickets-scroll-wrapper > div {
		min-width: 380px;
		max-width: 380px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.tickets-scroll-wrapper > div {
			min-width: 320px;
			max-width: 320px;
		}
	}
</style>
