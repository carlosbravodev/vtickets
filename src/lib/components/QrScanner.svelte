<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	// Props
	let {
		onScanSuccess,
		onScanError,
		scannerState = $bindable()
	}: {
		onScanSuccess: (decodedText: string) => void;
		onScanError?: (error: string) => void;
		scannerState?: 'idle' | 'processing' | 'success' | 'error';
	} = $props();

	// Estado
	let html5QrCode: Html5Qrcode | null = $state(null);
	let isScanning = $state(false);
	let errorMessage = $state('');
	let cameraId = $state<string | null>(null);
	
	// Cooldown para evitar escaneos duplicados
	const recentScans = new Map<string, number>();
	const SCAN_COOLDOWN = 3000; // 3 segundos

	// Inicializar en onMount para asegurar que el DOM esté listo
	onMount(() => {
		try {
			html5QrCode = new Html5Qrcode('qr-reader');
			console.log('Html5Qrcode inicializado correctamente');
		} catch (err) {
			console.error('Error al inicializar Html5Qrcode:', err);
			errorMessage = 'Error al inicializar el escáner de QR';
		}
	});

	// Iniciar el escáner
	async function startScanning() {
		try {
			errorMessage = '';
			
			// Verificar que html5QrCode esté inicializado
			if (!html5QrCode) {
				throw new Error('El escáner no está inicializado. Por favor, recarga la página.');
			}

			// Obtener cámaras disponibles
			const cameras = await Html5Qrcode.getCameras();
			
			if (!cameras || cameras.length === 0) {
				throw new Error('No se encontraron cámaras en tu dispositivo');
			}

			// Buscar cámara trasera (mejor para escanear QR)
			const backCamera = cameras.find(camera => 
				camera.label.toLowerCase().includes('back') || 
				camera.label.toLowerCase().includes('trasera') ||
				camera.label.toLowerCase().includes('rear')
			);
			
			// Usar cámara trasera si existe, si no, la primera disponible
			const selectedCamera = backCamera || cameras[cameras.length - 1];
			
			console.log('Usando cámara:', selectedCamera.label);

			// Iniciar el escáner con la cámara seleccionada
			await html5QrCode.start(
				selectedCamera.id,
				{
					fps: 25, // Aumentado de 10 para detección más rápida (25-30 fps es óptimo)
					qrbox: { width: 350, height: 350 }, // Aumentado de 250 para mayor área de escaneo (96% más grande)
					aspectRatio: 1.0,
					disableFlip: false,
				// Configuración de cámara para mejor enfoque automático
				videoConstraints: {
					facingMode: 'environment' // Preferir cámara trasera (auto-focus habilitado)
				}
				},
				(decodedText) => {
					// QR detectado
					const now = Date.now();
					
					// Verificar cooldown para evitar duplicados
					const lastScan = recentScans.get(decodedText);
					if (lastScan && now - lastScan < SCAN_COOLDOWN) {
						console.log('QR ignorado (cooldown activo)');
						return;
					}
					
					// Registrar escaneo
					recentScans.set(decodedText, now);
					
					// Limpiar escaneos antiguos (más de 10 segundos)
					for (const [key, timestamp] of recentScans.entries()) {
						if (now - timestamp > 10000) {
							recentScans.delete(key);
						}
					}
					
					console.log('QR detectado:', decodedText.substring(0, 50));
					
					// Llamar al callback de éxito
					// NO DETENER EL SCANNER - se procesa en background
					onScanSuccess(decodedText);
				},
				(errorMsg) => {
					// Error de escaneo (normal, ocurre constantemente mientras busca QR)
					// No hacer nada aquí
				}
			);

			isScanning = true;
			console.log('Escáner iniciado correctamente');
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Error desconocido al iniciar el escáner';
			errorMessage = errorMsg;
			console.error('Error completo:', err);
			
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
		if (html5QrCode) {
			try {
				await html5QrCode.clear();
			} catch (err) {
				console.error('Error al limpiar escáner:', err);
			}
			html5QrCode = null;
		}
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
	<!-- Visor de cámara con estados visuales -->
	<div 
		id="qr-reader" 
		class="qr-scanner rounded-lg overflow-hidden shadow-lg"
		class:scanner-idle={scannerState === 'idle'}
		class:scanner-processing={scannerState === 'processing'}
		class:scanner-success={scannerState === 'success'}
		class:scanner-error={scannerState === 'error'}
	></div>



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

	<!-- Instrucciones mejoradas -->
	{#if isScanning}
		<div class="mt-4 text-center text-sm text-gray-600">
			<p class="font-medium text-gray-700">📱 Acerca el código QR al recuadro</p>
			<p class="mt-1 text-xs text-gray-500">La detección es automática (FPS mejorado para mayor velocidad)</p>
		</div>
	{/if}
</div>

<style>
	/* Personalizar el diseño del escáner */
	:global(#qr-reader) {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		transition: all 0.3s ease;
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
		transition: border-color 0.3s ease;
	}

	/* Estados del scanner */
	.qr-scanner {
		position: relative;
	}

	.qr-scanner::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 0.5rem;
		pointer-events: none;
		transition: all 0.3s ease;
		border: 4px solid transparent;
		z-index: 10;
	}

	/* Estado IDLE - Indigo (esperando) */
	.scanner-idle::before {
		border-color: #4F46E5;
	}

	/* Estado PROCESSING - Yellow con pulse (validando) */
	.scanner-processing::before {
		border-color: #EAB308;
		animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* Estado SUCCESS - Green con flash (verificado) */
	.scanner-success::before {
		border-color: #10B981;
		animation: flash-success 1s ease-out;
	}

	/* Estado ERROR - Red con shake (error) */
	.scanner-error::before {
		border-color: #EF4444;
		animation: shake 0.5s ease-in-out;
	}

	/* Animaciones */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes flash-success {
		0% {
			opacity: 0.3;
			transform: scale(0.95);
		}
		50% {
			opacity: 1;
			transform: scale(1.02);
			box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes shake {
		0%, 100% {
			transform: translateX(0);
		}
		10%, 30%, 50%, 70%, 90% {
			transform: translateX(-5px);
		}
		20%, 40%, 60%, 80% {
			transform: translateX(5px);
		}
	}

	/* Guías de alineación grises: ya proporciona html5-qrcode */
	/* No agregar estilos adicionales para evitar conflictos */

</style>
