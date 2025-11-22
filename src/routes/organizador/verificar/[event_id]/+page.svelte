<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.svelte';
	import { syncStore } from '$lib/stores/sync.svelte';
	import QrScanner from '$lib/components/QrScanner.svelte';
	import type { PageData } from './$types';
	import { onMount, onDestroy, tick } from 'svelte';
	import { 
		cacheEvent, 
		cacheTickets, 
		findTicketByCode, 
		addToVerificationQueue,
		isOnline,
		getCachedTickets 
	} from '$lib/utils/offline';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	let { data }: { data: PageData } = $props();

	// Referencias
	let scannerRef: any = $state(null);

	// Estado del scanner (bindable con QrScanner)
	let scannerState: 'idle' | 'processing' | 'success' | 'error' = $state('idle');

	// Estado
	let isScanning = $state(false);
	let isProcessing = $state(false);
	let lastScannedTicket = $state<any>(null);
	let verificationResult = $state<{
		success: boolean;
		message: string;
		ticket?: any;
		isOffline?: boolean;
		error_type?: string;
	} | null>(null);
	let showResult = $state(false);
	let offlineMode = $state(!isOnline());

	// Stream de últimas verificaciones
	interface ScanRecord {
		id: string;
		name: string;
		type: string;
		timestamp: number;
		success: boolean;
		already_verified?: boolean;
	}
	let recentScans = $state<ScanRecord[]>([]);
	const MAX_RECENT_SCANS = 5;
	
	// Flash de última verificación (para UI minimalista)
	let lastScanFlash = $state<{ name: string; type: string; success: boolean; already_verified?: boolean } | null>(null);
	
	// Estadísticas reactivas
	let stats = $state({
		total: data.stats.total,
		verified: data.stats.verified,
		pending: data.stats.pending,
		percentage: data.stats.percentage
	});

	// Canal de Realtime para actualizaciones en vivo
	let realtimeChannel: RealtimeChannel | null = null;

	// Función para actualizar estadísticas desde la BD
	async function refreshStats() {
		try {
			const response = await fetch(`/api/verificar/stats/${data.event.id}`);
			if (response.ok) {
				const newStats = await response.json();
				stats.total = newStats.total;
				stats.verified = newStats.verified;
				stats.pending = newStats.pending;
				stats.percentage = newStats.percentage;
				console.log('📊 Estadísticas actualizadas desde BD:', stats);
			}
		} catch (error) {
			console.error('Error actualizando estadísticas:', error);
		}
	}

	// Inicializar
	onMount(() => {
		// Cachear el evento actual
		cacheEvent(data.event).then(() => {
			// Cargar tickets del evento para cache offline
			return fetch(`/api/verificar/tickets/${data.event.id}`)
				.then((response) => {
					if (response.ok) {
						return response.json();
					}
					throw new Error('No se pudo cargar tickets');
				})
				.then((tickets) => cacheTickets(data.event.id, tickets))
				.then(() => {
					console.log('✅ Tickets cacheados para uso offline');
				})
				.catch(() => {
					console.log('ℹ️ No se pudieron cachear tickets (modo offline?)');
				});
		});

		// Inicializar store de sincronización
		syncStore.init();

		// Suscribirse a cambios en tiempo real en tickets
		import('$lib/supabaseClient').then(({ supabase }) => {
			realtimeChannel = supabase
				.channel(`tickets-${data.event.id}`)
				.on(
					'postgres_changes',
					{
						event: '*', // Escuchar INSERT, UPDATE, DELETE
						schema: 'public',
						table: 'tickets',
						filter: `event_id=eq.${data.event.id}`
					},
					(payload) => {
						console.log('🔄 Cambio detectado en tickets:', payload);
						// Actualizar estadísticas cuando hay cambios
						refreshStats();
					}
				)
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') {
						console.log('✅ Suscrito a actualizaciones en tiempo real');
					}
				});
		});

		// Listener para detectar cambios en conexión
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	// Limpiar al desmontar
	onDestroy(() => {
		if (realtimeChannel) {
			realtimeChannel.unsubscribe();
			console.log('🔌 Desuscrito de actualizaciones en tiempo real');
		}
	});

	// Manejar cambio a online
	function handleOnline() {
		offlineMode = false;
		toast.success('Conexión restaurada');
		syncStore.syncAll();
	}

	// Manejar cambio a offline
	function handleOffline() {
		offlineMode = true;
		toast.warning('Modo offline activado');
	}

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
			
			// Esperar a que el componente se monte en el DOM
			await tick();
			
			// Ahora sí podemos iniciar el escáner
			if (scannerRef) {
				await scannerRef.start();
			} else {
				throw new Error('El escáner no se pudo inicializar');
			}
		} catch (error) {
			console.error('Error al iniciar escaneo:', error);
			toast.error('Error al acceder a la cámara');
			isScanning = false;
		}
	}

	// Detener escaneo
	async function stopScan() {
		try {
			if (scannerRef) {
				await scannerRef.stop();
			}
			isScanning = false;
		} catch (error) {
			console.error('Error al detener escaneo:', error);
		}
	}

	// Vibración diferenciada por resultado
	function vibratePattern(type: 'success' | 'error' | 'already_verified') {
		if (!navigator.vibrate) return;
		
		switch (type) {
			case 'success':
				navigator.vibrate([100, 50, 100]); // Corta y agradable
				break;
			case 'error':
				navigator.vibrate([400, 100, 400]); // Larga y notable
				break;
			case 'already_verified':
				navigator.vibrate([200, 100, 200, 100, 200]); // Patrón doble
				break;
		}
	}

	// Agregar a lista de escaneos recientes
	function addToRecentScans(record: ScanRecord) {
		recentScans = [record, ...recentScans].slice(0, MAX_RECENT_SCANS);
		
		// Mostrar flash temporal (2 segundos) para UI minimalista
		lastScanFlash = {
			name: record.name,
			type: record.type,
			success: record.success && !record.already_verified,
			already_verified: record.already_verified
		};
		
		setTimeout(() => {
			lastScanFlash = null;
		}, 2000);
	}

	// Formatear tiempo relativo (ej: "2s ago")
	function formatRelativeTime(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		return `${Math.floor(minutes / 60)}h`;
	}

	// Manejar QR escaneado (MODO CONTINUO - NO DETIENE SCANNER)
	async function handleScanSuccess(decodedText: string) {
		// Si ya estamos procesando, ignorar (el cooldown ya está en QrScanner)
		if (isProcessing) return;

		isProcessing = true;
		scannerState = 'processing'; // Estado visual amarillo

		try {
			console.log('[SCAN] QR detectado:', decodedText.substring(0, 50));
			
			let ticketId: string | null = null;
			let qrData: string = decodedText;
			
			// Intentar parsear como JSON primero (retrocompatibilidad)
			try {
				const parsed = JSON.parse(decodedText);
				if (parsed.ticket_id) {
					ticketId = parsed.ticket_id;
				}
			} catch {
				// No es JSON, es JWT o UUID directo
			}

			// NO DETENER EL SCANNER - procesamos en background

			// ========== MODO OFFLINE ==========
			if (offlineMode || !isOnline()) {
				console.log('📵 Modo offline: validando localmente');
				
				// En modo offline, necesitamos el ticket_id
				// Si solo tenemos JWT, no podemos validar offline sin decodificarlo
				if (!ticketId) {
					verificationResult = {
						success: false,
						message: 'No se puede validar JWT en modo offline. Conéctate a internet.',
						isOffline: true
					};
					showResult = true;
					
					if (navigator.vibrate) {
						navigator.vibrate([400, 100, 400]);
					}
					
					setTimeout(() => {
						showResult = false;
						isProcessing = false;
					}, 3000);
					return;
				}
				
				// Buscar ticket en caché por ID
				const cachedTicket = await findTicketByCode(ticketId);
				
				if (!cachedTicket) {
					verificationResult = {
						success: false,
						message: 'Ticket no encontrado en caché offline',
						isOffline: true
					};
					showResult = true;
					
					if (navigator.vibrate) {
						navigator.vibrate([400, 100, 400]);
					}
					
					setTimeout(() => {
						showResult = false;
						isProcessing = false;
					}, 3000);
					return;
				}

				// Validar que pertenece al evento
				if (cachedTicket.event_id !== data.event.id) {
					verificationResult = {
						success: false,
						message: 'Ticket de otro evento',
						isOffline: true
					};
					showResult = true;
					
					if (navigator.vibrate) {
						navigator.vibrate([400, 100, 400]);
					}
					
					setTimeout(() => {
						showResult = false;
						isProcessing = false;
					}, 3000);
					return;
				}

				// Validar que no esté ya verificado
				if (cachedTicket.verified) {
					verificationResult = {
						success: false,
						message: 'Ticket ya verificado (offline)',
						ticket: cachedTicket,
						isOffline: true
					};
					showResult = true;
					
					if (navigator.vibrate) {
						navigator.vibrate([400, 100, 400]);
					}
					
					setTimeout(() => {
						showResult = false;
						isProcessing = false;
					}, 3000);
					return;
				}

				// Agregar a la cola de sincronización
				const userId = data.event.created_by; // Asumimos que está disponible
				await addToVerificationQueue(
					cachedTicket.id,
					data.event.id,
					userId,
					undefined,
					{ user_agent: navigator.userAgent }
				);

				// Incrementar contador en el store
				syncStore.incrementPending();

				// Actualizar estadísticas localmente
				stats.verified += 1;
				stats.pending -= 1;
				stats.percentage = Math.round((stats.verified / stats.total) * 100);

				// Mostrar éxito
				verificationResult = {
					success: true,
					message: '✓ Verificado (pendiente de sincronización)',
					ticket: cachedTicket,
					isOffline: true
				};
				showResult = true;

				if (navigator.vibrate) {
					navigator.vibrate([100, 50, 100]);
				}

				setTimeout(() => {
					showResult = false;
					verificationResult = null;
					isProcessing = false;
				}, 4000);

				return;
			}

			// ========== MODO ONLINE (OPTIMIZADO) ==========
			// Llamar al nuevo endpoint unificado /api/verificar/scan
			const scanResponse = await fetch('/api/verificar/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticket_id: ticketId,
					qr_data: qrData,
					event_id: data.event.id,
					device_info: { user_agent: navigator.userAgent }
				})
			});

			const scanResult = await scanResponse.json();

			if (scanResult.success) {
				// ✅ ÉXITO - Ticket verificado
				scannerState = 'success';
				vibratePattern('success');

				// Actualizar estadísticas
				stats.verified += 1;
				stats.pending -= 1;
				stats.percentage = Math.round((stats.verified / stats.total) * 100);

				// Agregar a lista de recientes
				addToRecentScans({
					id: scanResult.ticket.id,
					name: scanResult.ticket.holder_name || scanResult.ticket.holder_email || 'Sin información',
					type: scanResult.ticket.type || 'Entrada General',
					timestamp: Date.now(),
					success: true
				});

				console.log('✅ Ticket verificado:', scanResult.ticket.code);
				
				// Volver a idle después de 1 segundo
				setTimeout(() => {
					scannerState = 'idle';
					isProcessing = false;
				}, 1000);

			} else {
				// ❌ ERROR - Ticket inválido o ya verificado
				const isAlreadyVerified = scanResult.error_type === 'already_verified';
				
				scannerState = 'error';
				vibratePattern(isAlreadyVerified ? 'already_verified' : 'error');

				// Agregar a lista de recientes con warning
				if (scanResult.ticket) {
					addToRecentScans({
						id: scanResult.ticket.id,
						name: scanResult.ticket.holder_name || scanResult.ticket.holder_email || 'Sin información',
						type: scanResult.ticket.type || 'Entrada General',
						timestamp: Date.now(),
						success: false,
						already_verified: isAlreadyVerified
					});
				}

				// Toast solo para errores críticos
				if (scanResult.error_type === 'wrong_event') {
					toast.error('⚠️ Ticket de otro evento');
				} else if (scanResult.error_type === 'cancelled') {
					toast.error('❌ Ticket cancelado');
				} else if (isAlreadyVerified) {
					// No toast, solo visual + vibración
					console.log('⚠️ Ticket ya verificado');
				}

				// Volver a idle después de 1.5 segundos
				setTimeout(() => {
					scannerState = 'idle';
					isProcessing = false;
				}, 1500);
			}

		} catch (error) {
			console.error('[SCAN] Error procesando QR:', error);
			
			scannerState = 'error';
			vibratePattern('error');
			toast.error('Error al procesar el código QR');

			setTimeout(() => {
				scannerState = 'idle';
				isProcessing = false;
			}, 1500);
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

{#if isScanning || isProcessing}
	<!-- Vista Minimalista Extremo (Modo Escaneando) -->
	<div class="h-screen flex flex-col bg-gray-900">
		<!-- Header compacto -->
		<header class="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
			<button 
				onclick={stopScan}
				class="text-white hover:text-gray-300 transition"
				aria-label="Cerrar escáner"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			
			<div class="flex-1 text-center">
				<h1 class="text-white font-semibold text-lg truncate">{data.event.title}</h1>
			</div>
			
			<div class="text-white font-mono text-sm">
				{stats.verified}/{stats.total}
			</div>
		</header>

		<!-- Cámara fullscreen -->
		<main class="flex-1 relative bg-black">
			<QrScanner
				bind:this={scannerRef}
				bind:scannerState
				onScanSuccess={handleScanSuccess}
				onScanError={handleScanError}
			/>
		</main>

		<!-- Flash de última verificación (2 segundos) -->
		{#if lastScanFlash}
			<footer 
				class="absolute bottom-0 left-0 right-0 px-6 py-8 bg-linear-to-t from-black/90 to-transparent pointer-events-none"
				style="animation: fadeInUp 0.3s ease-out;"
			>
				<div 
					class="bg-white rounded-2xl p-6 shadow-2xl border-4"
					class:border-green-500={lastScanFlash.success}
					class:border-amber-500={lastScanFlash.already_verified}
					class:border-red-500={!lastScanFlash.success && !lastScanFlash.already_verified}
				>
					<div class="flex items-center gap-4">
						<!-- Icono -->
						<div 
							class="shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
							class:bg-green-100={lastScanFlash.success}
							class:bg-amber-100={lastScanFlash.already_verified}
							class:bg-red-100={!lastScanFlash.success && !lastScanFlash.already_verified}
						>
							{#if lastScanFlash.success}
								<span class="text-green-600">✓</span>
							{:else if lastScanFlash.already_verified}
								<span class="text-amber-600">⚠</span>
							{:else}
								<span class="text-red-600">✗</span>
							{/if}
						</div>
						
						<!-- Información -->
						<div class="flex-1 min-w-0">
							<p class="text-gray-900 font-bold text-xl truncate">{lastScanFlash.name}</p>
							<p class="text-gray-600 text-base mt-1">{lastScanFlash.type}</p>
							{#if lastScanFlash.already_verified}
								<p class="text-amber-700 text-sm font-semibold mt-1">Ya verificado anteriormente</p>
							{:else if lastScanFlash.success}
								<p class="text-green-700 text-sm font-semibold mt-1">Verificado exitosamente</p>
							{:else}
								<p class="text-red-700 text-sm font-semibold mt-1">Error en verificación</p>
							{/if}
						</div>
					</div>
				</div>
			</footer>
		{/if}
	</div>
{:else}
	<!-- Vista Normal (Modo No Escaneando) -->
	<div class="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-6">
			<a
				href="/organizador/verificar"
				class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
			>
				← Volver a eventos
			</a>
			
			<div class="bg-white rounded-lg shadow-md p-6">
				<!-- Indicador Online/Offline -->
				<div class="mb-4 flex items-center justify-between">
					<h1 class="text-2xl font-bold text-gray-900">{data.event.title}</h1>
					
					<div class="flex items-center gap-3">
						<!-- Botón Historial -->
						<a
							href="/organizador/verificar/{data.event.id}/historial"
							class="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition"
						>
							<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Historial
						</a>

						<!-- Estado de conexión -->
						{#if offlineMode}
							<div class="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
								<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
								</svg>
								Offline
							</div>
						{:else}
							<div class="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
								<div class="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
								Online
							</div>
						{/if}

						<!-- Contador de pendientes -->
						{#if syncStore.pendingCount > 0}
							<button
								onclick={() => syncStore.syncAll()}
								disabled={syncStore.isSyncing}
								class="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm hover:bg-blue-100 disabled:opacity-50"
							>
								{#if syncStore.isSyncing}
									<svg class="animate-spin w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
									Sincronizando...
								{:else}
									<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									{syncStore.pendingCount} pendiente{syncStore.pendingCount !== 1 ? 's' : ''}
								{/if}
							</button>
						{/if}
					</div>
				</div>

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
				<div class="text-3xl font-bold text-gray-900">{stats.total}</div>
				<div class="text-sm text-gray-600 mt-1">Total</div>
			</div>
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<div class="text-3xl font-bold text-green-600">{stats.verified}</div>
				<div class="text-sm text-gray-600 mt-1">Verificados</div>
			</div>
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<div class="text-3xl font-bold text-orange-600">{stats.pending}</div>
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

			<!-- Componente escáner con estado bindable -->
			{#if isScanning || isProcessing}
				<QrScanner
					bind:this={scannerRef}
					bind:scannerState
					onScanSuccess={handleScanSuccess}
					onScanError={handleScanError}
				/>
				
				<!-- Stream de últimas verificaciones -->
				{#if recentScans.length > 0}
					<div class="mt-6 bg-gray-50 rounded-lg p-4">
						<h3 class="text-sm font-semibold text-gray-700 mb-3">Últimos escaneados:</h3>
						<div class="space-y-2">
							{#each recentScans as scan (scan.id)}
								<div 
									class="flex items-center justify-between bg-white rounded-md p-3 border"
									class:border-green-200={scan.success && !scan.already_verified}
									class:border-amber-200={scan.already_verified}
									class:border-red-200={!scan.success && !scan.already_verified}
									style="animation: fadeIn 0.3s ease-out;"
								>
									<div class="flex items-center gap-3">
										{#if scan.success && !scan.already_verified}
											<span class="text-green-600 text-xl">✓</span>
										{:else if scan.already_verified}
											<span class="text-amber-600 text-xl">⚠️</span>
										{:else}
											<span class="text-red-600 text-xl">✗</span>
										{/if}
										<div>
											<p class="font-medium text-gray-900 text-sm">{scan.name}</p>
											<p class="text-xs text-gray-500">{scan.type}</p>
										</div>
									</div>
									<span class="text-xs text-gray-400">{formatRelativeTime(scan.timestamp)} ago</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
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
								{#if verificationResult.isOffline}
									<p class="mt-1 text-sm text-amber-700 flex items-center">
										<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Se sincronizará cuando haya conexión
									</p>
								{/if}
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
{/if}

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

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
