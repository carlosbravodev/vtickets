<script lang="ts">
	import { fade } from 'svelte/transition';
	import Hero from '$lib/components/Hero.svelte';
	import EventSection from '$lib/components/EventSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
	<!-- Hero Section -->
	<Hero />

	<!-- Próximos Eventos Section -->
	<div class="first-section">
		{#if data?.upcomingEvents?.length}
			<EventSection 
				title="Próximos Eventos" 
				events={data.upcomingEvents}
				maxCards={10}
			/>
		{:else}
			<div class="py-8 text-center">
				<p class="text-gray-500">No hay eventos disponibles</p>
			</div>
		{/if}
	</div>

	<!-- Eventos en Guayaquil Section -->
	{#if data?.guayaquilEvents?.length}
		<EventSection 
			title="Eventos en Guayaquil" 
			events={data.guayaquilEvents}
			maxCards={10}
		/>
	{/if}

	<!-- Eventos en Quito Section -->
	{#if data?.quitoEvents?.length}
		<EventSection 
			title="Eventos en Quito" 
			events={data.quitoEvents}
			maxCards={10}
		/>
	{/if}

	<!-- Features Section -->
	<section class="py-20 bg-white dark:bg-gray-800">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
					¿Por qué elegir VTickets?
				</h2>
				<p class="text-lg text-gray-600 dark:text-gray-300">
					La mejor experiencia para comprar tus entradas
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				<!-- Feature 1 -->
				<div class="text-center p-8 rounded-2xl bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 hover:shadow-xl transition-shadow duration-300">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-6">
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Pago Seguro</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Transacciones protegidas con la última tecnología de encriptación
					</p>
				</div>

				<!-- Feature 2 -->
				<div class="text-center p-8 rounded-2xl bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-xl transition-shadow duration-300">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-6">
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Rápido y Fácil</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Compra tus entradas en segundos con nuestra interfaz intuitiva
					</p>
				</div>

				<!-- Feature 3 -->
				<div class="text-center p-8 rounded-2xl bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 hover:shadow-xl transition-shadow duration-300">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-600 text-white mb-6">
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Soporte 24/7</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Estamos aquí para ayudarte en cualquier momento que lo necesites
					</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.first-section {
		padding-top: 3rem;
	}

	@media (min-width: 768px) {
		.first-section {
			padding-top: 4rem;
		}
	}
</style>

