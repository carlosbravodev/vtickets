<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	// Props
	let {
		onScanSuccess,
		onScanError
	}: {
		onScanSuccess: (decodedText: string) => void;
		onScanError?: (error: string) => void;
	} = $props();

	// Estado
	let html5QrCode: Html5Qrcode | null = $state(null);
	let isScanning = $state(false);
	let errorMessage = $state('');
	let cameraId = $state<string | null>(null);

	// Configuración del escáner
	const qrConfig = {
		fps: 10, // Frames por segundo
		qrbox: { width: 250, height: 250 }, // Tamaño del cuadro de escaneo
		aspectRatio: 1.0,
		disableFlip: false // Permite escanear QR reflejados
	};

	// Iniciar el escáner
	async function startScanning() {
		try {
			errorMessage = '';
			
			// Primero solicitar permisos de cámara explícitamente
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: { facingMode: 'environment' } 
				});
				// Detener el stream inmediatamente, solo queríamos los permisos
				stream.getTracks().forEach(track => track.stop());
			} catch (permError) {
				throw new Error('No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
			}
			
			// Inicializar Html5Qrcode si no existe
			if (!html5QrCode) {
				html5QrCode = new Html5Qrcode('qr-reader');
			}

			// Usar facingMode en lugar de deviceId para mejor compatibilidad
			const constraints = { facingMode: 'environment' };

			// Iniciar el escáner con constraints
			await html5QrCode.start(
				constraints,
				qrConfig,
				(decodedText) => {
					// QR detectado
					console.log('QR detectado:', decodedText);
					
					// Vibrar el dispositivo si está disponible
					if (navigator.vibrate) {
						navigator.vibrate(200);
					}
					
					// Llamar al callback de éxito
					onScanSuccess(decodedText);
				},
				(errorMsg) => {
					// Error de escaneo (normal, ocurre constantemente mientras busca QR)
					// No hacer nada aquí, solo registrar en consola si es necesario
				}
			);

			isScanning = true;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Error al iniciar el escáner';
			errorMessage = errorMsg;
			console.error('Error iniciando escáner:', err);
			
			if (onScanError) {
				onScanError(errorMsg);
			}
		}
	}

	// Detener el escáner
	async function stopScanning() {
		try {
			if (html5QrCode && isScanning) {
				await html5QrCode.stop();
				isScanning = false;
			}
		} catch (err) {
			console.error('Error deteniendo escáner:', err);
		}
	}

	// Limpiar al desmontar el componente
	onDestroy(async () => {
		await stopScanning();
		html5QrCode = null;
	});

	// Exponer funciones para control externo
	export function start() {
		return startScanning();
	}

	export function stop() {
		return stopScanning();
	}
</script>

<!-- Contenedor del escáner -->
<div class="relative">
	<!-- Visor de cámara -->
	<div id="qr-reader" class="rounded-lg overflow-hidden shadow-lg"></div>

	<!-- Mensaje de error -->
	{#if errorMessage}
		<div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="ml-3">
					<p class="text-sm text-red-800">{errorMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Instrucciones -->
	{#if isScanning}
		<div class="mt-4 text-center text-sm text-gray-600">
			<p>📱 Apunta la cámara al código QR del ticket</p>
			<p class="mt-1 text-xs text-gray-500">El escaneo es automático</p>
		</div>
	{/if}
</div>

<style>
	/* Personalizar el diseño del escáner */
	:global(#qr-reader) {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	:global(#qr-reader video) {
		border-radius: 0.5rem;
		width: 100% !important;
		height: auto !important;
	}

	:global(#qr-reader__dashboard) {
		display: none !important; /* Ocultar controles por defecto */
	}

	:global(#qr-reader__scan_region) {
		border: 3px solid #4F46E5 !important;
	}
</style>
