<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { optimizeSupabaseImage } from '$lib/utils/image';

	let { data } = $props();
	const { order, ticketCount } = data;

	// Formatear fecha
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Formatear fecha solo día
	function formatDateShort(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Generar archivo .ics para calendario y abrirlo automáticamente
	function addToCalendar() {
		const event = Array.isArray(order.event) ? order.event[0] : order.event;
		const startDate = new Date(event.event_date);
		const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas

		const formatICSDate = (date: Date) => {
			return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		};

		const icsContent = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//VTickets//Event Calendar//ES',
			'CALSCALE:GREGORIAN',
			'METHOD:PUBLISH',
			'BEGIN:VEVENT',
			`UID:${order.id}@vtickets.app`,
			`DTSTART:${formatICSDate(startDate)}`,
			`DTEND:${formatICSDate(endDate)}`,
			`SUMMARY:${event.title}`,
			`DESCRIPTION:Entrada comprada en VTickets - Orden #${order.order_number}`,
			`LOCATION:${event.location || ''}`,
			`STATUS:CONFIRMED`,
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');

		// Crear blob y URL
		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		
		// Crear link temporal y simular click
		const link = document.createElement('a');
		link.href = url;
		link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
		
		// En dispositivos móviles, intentar abrir directamente
		if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
			// En móviles, el archivo .ics se abre automáticamente con la app de calendario
			link.click();
		} else {
			// En escritorio, descargar el archivo que luego se puede abrir
			link.click();
		}
		
		// Limpiar
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 100);
	}
</script>

<svelte:head>
	<title>¡Compra Confirmada! - VTickets</title>
</svelte:head>

{#if order}
	{@const event = Array.isArray(order.event) ? order.event[0] : order.event}
	<div class="min-h-screen bg-linear-to-br from-green-50 to-blue-50 py-12 px-4">
		<div class="max-w-4xl mx-auto">
			<!-- Header de éxito -->
			<div class="text-center mb-8" in:fade={{ duration: 400 }}>
				<div class="inline-block mb-4" in:scale={{ duration: 600, delay: 200 }}>
					<div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
						<svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
						</svg>
					</div>
				</div>
				<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
					¡Compra Confirmada!
				</h1>
				<p class="text-xl text-gray-600">
					Tu pago ha sido procesado exitosamente 🎉
				</p>
			</div>

			<!-- Card principal con detalles de la orden -->
			<div class="bg-white rounded-2xl shadow-xl overflow-hidden mb-6" in:fly={{ y: 30, duration: 500, delay: 300 }}>
				<!-- Imagen del evento -->
				<div class="relative h-48 md:h-64 overflow-hidden">
					<img 
						src={optimizeSupabaseImage(event.image_url, { width: 1200, quality: 90 })}
						alt={event.title}
						class="w-full h-full object-cover"
					/>
					<div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
					<div class="absolute bottom-0 left-0 right-0 p-6">
						<h2 class="text-2xl md:text-3xl font-bold text-white mb-2">
							{event.title}
						</h2>
						<div class="flex flex-wrap gap-3 text-white">
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<span class="text-sm font-medium">{formatDateShort(event.event_date)}</span>
							</div>
							{#if event.location}
								<div class="flex items-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									</svg>
									<span class="text-sm font-medium">{event.location}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Detalles de la compra -->
				<div class="p-6 md:p-8">
					<!-- Número de orden y fecha -->
					<div class="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
						<div>
							<p class="text-sm text-gray-500 mb-1">Número de Orden</p>
							<p class="text-lg font-bold text-gray-900">#{order.order_number}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 mb-1">Fecha de Compra</p>
							<p class="text-lg font-semibold text-gray-900">{formatDateShort(order.created_at)}</p>
						</div>
					</div>

					<!-- Resumen de entradas -->
					<div class="mb-6">
						<h3 class="text-lg font-bold text-gray-900 mb-4">Resumen de Entradas</h3>
						<div class="space-y-3">
							{#each order.tickets as ticket}
								{@const ticketType = Array.isArray(ticket.ticket_type) ? ticket.ticket_type[0] : ticket.ticket_type}
								<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
											</svg>
										</div>
										<div>
											<p class="font-semibold text-gray-900">{ticketType.name}</p>
											<p class="text-sm text-gray-500">Código: {ticket.ticket_code}</p>
										</div>
									</div>
									<p class="text-lg font-bold text-indigo-600">${parseFloat(ticketType.price).toFixed(2)}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Total -->
					<div class="bg-indigo-50 rounded-xl p-6 mb-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-gray-600 mb-1">Total de Entradas</p>
								<p class="text-2xl font-bold text-gray-900">{ticketCount} {ticketCount === 1 ? 'entrada' : 'entradas'}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-600 mb-1">Total Pagado</p>
								<p class="text-3xl font-extrabold text-indigo-600">${parseFloat(order.total_price).toFixed(2)}</p>
							</div>
						</div>
					</div>

					<!-- Información importante -->
					<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
						<div class="flex items-start gap-3">
							<svg class="w-6 h-6 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<p class="font-semibold text-yellow-800 mb-1">Información Importante</p>
								<p class="text-sm text-yellow-700">
									Hemos enviado tus entradas a tu correo electrónico. También puedes descargarlas desde tu cuenta.
								</p>
							</div>
						</div>
					</div>

					<!-- Botones de acción -->
					<div class="grid md:grid-cols-2 gap-4">
						<a
							href="/cuenta"
							class="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
							</svg>
							Ver Mis Entradas
						</a>

						<button
							onclick={addToCalendar}
							class="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 hover:border-indigo-600 text-gray-700 hover:text-indigo-600 font-bold rounded-xl transition-all duration-200"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Agregar a Calendario
						</button>
					</div>
				</div>
			</div>

			<!-- Más eventos -->
			<div class="text-center">
				<a
					href="/eventos"
					class="inline-block px-8 py-3 bg-white border-2 border-gray-300 hover:border-indigo-600 text-gray-700 hover:text-indigo-600 font-semibold rounded-xl transition-all duration-200"
				>
					Explorar Más Eventos
				</a>
			</div>
		</div>
	</div>
{/if}
