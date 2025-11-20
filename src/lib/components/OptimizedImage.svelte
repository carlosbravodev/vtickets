<script lang="ts">
	import { optimizeSupabaseImage, generateResponsiveSrcSet } from '$lib/utils/image';

	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		quality?: number;
		class?: string;
		loading?: 'lazy' | 'eager';
		responsive?: boolean;
		sizes?: string;
		placeholder?: boolean;
	}

	let {
		src,
		alt,
		width = 800,
		height,
		quality = 80,
		class: className = '',
		loading = 'lazy',
		responsive = true,
		sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px',
		placeholder = true
	}: Props = $props();

	let isLoaded = $state(false);
	let hasError = $state(false);

	// Generar URL optimizada
	const optimizedSrc = $derived(
		optimizeSupabaseImage(src, {
			width,
			height,
			quality,
			format: 'webp'
		})
	);

	// Generar srcset para imágenes responsivas
	const srcset = $derived(responsive ? generateResponsiveSrcSet(src) : '');

	function handleLoad() {
		isLoaded = true;
	}

	function handleError() {
		hasError = true;
		console.error('Error loading image:', src);
	}
</script>

{#if hasError}
	<div
		class="flex items-center justify-center bg-gray-200 text-gray-500 {className}"
		style:width={width ? `${width}px` : '100%'}
		style:height={height ? `${height}px` : 'auto'}
	>
		<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	</div>
{:else}
	<div class="relative {className}">
		{#if placeholder && !isLoaded}
			<div
				class="absolute inset-0 bg-linear-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse"
				style:width={width ? `${width}px` : '100%'}
				style:height={height ? `${height}px` : 'auto'}
			></div>
		{/if}

		<img
			src={optimizedSrc}
			srcset={srcset || undefined}
			sizes={responsive ? sizes : undefined}
			{alt}
			{loading}
			class="transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
			onload={handleLoad}
			onerror={handleError}
		/>
	</div>
{/if}

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
