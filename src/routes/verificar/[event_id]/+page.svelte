<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.svelte';
	import QrScanner from '$lib/components/QrScanner.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Referencias
	let scannerRef: any = $state(null);

	// Estado
	let isScanning = $state(false);
	let isProcessing = $state(false);
	let lastScannedTicket = $state<any>(null);
	let verificationResult = $state<{
		success: boolean;
		message: string;
		ticket?: any;
	} | null>(null);
	let showResult = $state(false);

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

	// Formatear precio
	function formatPrice(price: number) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(price / 100);
	}

	// Iniciar escaneo
	async function startScan() {
		try {
			isScanning = true;
			verificationResult = null;
			showResult = false;
			await scannerRef.start();
		} catch (error) {
			console.error('Error al iniciar escaneo:', error);
			toast.error('Error al acceder a la cámara');
			isScanning = false;
		}
	}

	// Detener escaneo
	async function stopScan() {
		try {
			await scannerRef.stop();
			isScanning = false;
		} catch (error) {
			console.error('Error al detener escaneo:', error);
		}
	}

	// Manejar QR escaneado
	async function handleScanSuccess(decodedText: string) {
		// Si ya estamos procesando, ignorar
		if (isProcessing) return;

		isProcessing = true;

		try {
			// Parsear el QR (debería ser JSON)
			let qrData: any;
			
			try {
				qrData = JSON.parse(decodedText);
			} catch {
				// Si no es JSON, asumir que es solo el ticket_id
				qrData = { ticket_id: decodedText };
			}

			// Validar que el QR tenga ticket_id
			if (!qrData.ticket_id) {
				throw new Error('QR inválido: no contiene ticket_id');
			}

			// Detener escaneo mientras procesamos
			await stopScan();

			// Llamar a la API de validación
			const validateResponse = await fetch('/api/verificar/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticket_id: qrData.ticket_id,
					event_id: data.event.id
				})
			});

			const validateData = await validateResponse.json();

			if (!validateResponse.ok) {
				// Error de validación
				verificationResult = {
					success: false,
					message: validateData.error || 'Ticket inválido'
				};
				showResult = true;
				
				// Vibración de error (patrón largo-corto-largo)
				if (navigator.vibrate) {
					navigator.vibrate([400, 100, 400]);
				}

				setTimeout(() => {
					showResult = false;
					isProcessing = false;
				}, 3000);

				return;
			}

			// Ticket válido, ahora marcarlo como verificado
			const markResponse = await fetch('/api/verificar/mark-verified', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticket_id: qrData.ticket_id,
					event_id: data.event.id
				})
			});

			const markData = await markResponse.json();

			if (!markResponse.ok) {
				// Error al marcar (posible duplicado)
				verificationResult = {
					success: false,
					message: markData.error || 'Error al verificar ticket'
				};
			} else {
				// Éxito total
				verificationResult = {
					success: true,
					message: markData.already_verified 
						? 'Ticket ya fue verificado anteriormente' 
						: '✓ Ticket verificado correctamente',
					ticket: validateData.ticket
				};

				// Actualizar estadísticas en tiempo real
				if (!markData.already_verified) {
					data.stats.verified += 1;
					data.stats.pending -= 1;
					data.stats.percentage = Math.round((data.stats.verified / data.stats.total) * 100);
				}

				// Vibración de éxito (patrón corto-corto)
				if (navigator.vibrate) {
					navigator.vibrate([100, 50, 100]);
				}
			}

			showResult = true;

			// Ocultar resultado y permitir nuevo escaneo después de 4 segundos
			setTimeout(() => {
				showResult = false;
				verificationResult = null;
				isProcessing = false;
			}, 4000);

		} catch (error) {
			console.error('Error procesando QR:', error);
			
			verificationResult = {
				success: false,
				message: error instanceof Error ? error.message : 'Error al procesar el código QR'
			};
			showResult = true;

			setTimeout(() => {
				showResult = false;
				isProcessing = false;
			}, 3000);
		}
	}

	// Manejar error de escaneo
	function handleScanError(error: string) {
		console.error('Error de escaneo:', error);
	}
</script>

<svelte:head>
	<title>Verificar: {data.event.title} - VTickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-6">
			<a
				href="/verificar"
				class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
			>
				← Volver a eventos
			</a>
			
			<div class="bg-white rounded-lg shadow-md p-6">
				<h1 class="text-2xl font-bold text-gray-900">{data.event.title}</h1>
				<div class="mt-2 flex items-center text-sm text-gray-600">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					{formatDate(data.event.event_date)}
				</div>
				<div class="mt-1 flex items-center text-sm text-gray-600">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					{data.event.venue || data.event.location}
				</div>
			</div>
		</div>

		<!-- Estadísticas -->
		<div class="grid grid-cols-3 gap-4 mb-6">
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<div class="text-3xl font-bold text-gray-900">{data.stats.total}</div>
				<div class="text-sm text-gray-600 mt-1">Total</div>
			</div>
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<div class="text-3xl font-bold text-green-600">{data.stats.verified}</div>
				<div class="text-sm text-gray-600 mt-1">Verificados</div>
			</div>
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<div class="text-3xl font-bold text-orange-600">{data.stats.pending}</div>
				<div class="text-sm text-gray-600 mt-1">Pendientes</div>
			</div>
		</div>

		<!-- Escáner QR -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="mb-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-2">Escanear Ticket</h2>
				{#if !isScanning && !isProcessing}
					<button
						onclick={startScan}
						class="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
					>
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
						</svg>
						Iniciar Escaneo
					</button>
				{:else if isProcessing}
					<div class="text-center py-8">
						<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
						<p class="mt-4 text-gray-600">Verificando ticket...</p>
					</div>
				{/if}
			</div>

			<!-- Componente escáner -->
			{#if isScanning || isProcessing}
				<QrScanner
					bind:this={scannerRef}
					onScanSuccess={handleScanSuccess}
					onScanError={handleScanError}
				/>
			{/if}

			<!-- Botón detener -->
			{#if isScanning && !isProcessing}
				<button
					onclick={stopScan}
					class="mt-4 w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
				>
					Detener Escaneo
				</button>
			{/if}
		</div>

		<!-- Resultado de verificación -->
		{#if showResult && verificationResult}
			<div 
				class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
				style="animation: slideDown 0.3s ease-out;"
			>
				{#if verificationResult.success}
					<!-- Éxito -->
					<div class="bg-green-50 border-2 border-green-500 rounded-lg p-6 shadow-xl">
						<div class="flex items-start">
							<div class="shrink-0">
								<svg class="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-4">
								<h3 class="text-lg font-bold text-green-900">
									{verificationResult.message}
								</h3>
								{#if verificationResult.ticket}
									<div class="mt-3 text-sm text-green-800 space-y-1">
										<p><strong>Código:</strong> {verificationResult.ticket.ticket_code}</p>
										{#if verificationResult.ticket.holder_name}
											<p><strong>Titular:</strong> {verificationResult.ticket.holder_name}</p>
										{/if}
										{#if verificationResult.ticket.ticket_type}
											<p><strong>Tipo:</strong> {verificationResult.ticket.ticket_type.name}</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<!-- Error -->
					<div class="bg-red-50 border-2 border-red-500 rounded-lg p-6 shadow-xl">
						<div class="flex items-start">
							<div class="shrink-0">
								<svg class="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-4">
								<h3 class="text-lg font-bold text-red-900">Error de Verificación</h3>
								<p class="mt-2 text-sm text-red-800">{verificationResult.message}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Últimas verificaciones -->
		{#if data.recentVerifications.length > 0}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Últimas Verificaciones</h2>
				<div class="space-y-3">
					{#each data.recentVerifications as verification}
						<div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
							<div class="flex-1">
								<p class="font-medium text-gray-900">
									{verification.ticket?.holder_name || 'Sin nombre'}
								</p>
								<p class="text-sm text-gray-600">
									{verification.ticket?.ticket_code} • {verification.ticket?.ticket_types?.[0]?.name || 'N/A'}
								</p>
							</div>
							<div class="text-right">
								<p class="text-xs text-gray-500">
									{formatDate(verification.created_at)}
								</p>
								<span class="inline-flex items-center mt-1 text-xs text-green-700">
									<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Verificado
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translate(-50%, -20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
</style>
