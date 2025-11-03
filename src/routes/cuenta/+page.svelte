<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let { data }: { data: PageData } = $props();
	let QRCodeStyling: any = null;
	let isQRLibraryLoaded = $state(false);

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
				width: 300,
				height: 300,
				data: jwt,
				margin: 0,
				qrOptions: {
					typeNumber: 0,
					mode: 'Byte',
					errorCorrectionLevel: 'Q'
				},
				imageOptions: {
					hideBackgroundDots: true,
					imageSize: 0.4,
					margin: 0,
					saveAsBlob: true
				},
				dotsOptions: {
					type: 'extra-rounded',
					color: '#000000',
					roundSize: true
				},
				backgroundOptions: {
					color: '#ffffff',
					round: 0
				},
				cornersSquareOptions: {
					type: 'extra-rounded',
					color: '#000000'
				},
				cornersDotOptions: {
					type: '',
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
				Bienvenido, <span class="font-bold">{data.user.email}</span>
			</p>
		</div>

		<!-- Órdenes -->
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
										<h4 class="text-lg font-bold text-gray-900 flex items-center gap-2">
											<span class="text-2xl">🎫</span>
											<span>Tus Entradas ({order.tickets.length})</span>
										</h4>
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

									<!-- Contenido desplegable -->
									<div id="tickets-{order.id}" class="hidden">
										<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{#each order.tickets as ticket}
										{@const ticketType = Array.isArray(ticket.ticket_type)
											? ticket.ticket_type[0]
											: ticket.ticket_type}
										
										<!-- Ticket Card - Estilo Boarding Pass -->
										<div class="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
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
															<div class="w-40 h-40 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
																<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
															</div>
														{:then qrDataUrl}
															<div class="bg-white p-3 rounded-xl shadow-2xl border-4 border-white/30">
																<img
																	src={qrDataUrl}
																	alt="QR Code"
																	class="w-36 h-36"
																/>
															</div>
														{:catch error}
															<div class="w-40 h-40 bg-red-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-sm border-2 border-red-500/50">
																Error QR
															</div>
														{/await}

														<div class="text-white/60 text-xs text-center max-w-40">
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
	</div>
</div>

<style>
	/* Smooth transitions */
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
