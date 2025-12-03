<script lang="ts">
	import { fade } from "svelte/transition";
	import { onMount } from "svelte";
	import Hero from "$lib/components/Hero.svelte";
	import EventSection from "$lib/components/EventSection.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	// Estado de carga para mejorar la percepción de UX
	let isLoading = $state(true);

	onMount(() => {
		// Pequeño delay para mostrar skeletons brevemente
		const timer = setTimeout(() => {
			isLoading = false;
		}, 300);

		return () => clearTimeout(timer);
	});
</script>

<div class="page-container">
	<!-- Hero Section -->
	<Hero />

	<!-- Próximos Eventos Section -->
	<div class="first-section">
		{#if data?.upcomingEvents?.length || isLoading}
			<EventSection
				title="Próximos Eventos"
				events={data.upcomingEvents || []}
				maxCards={10}
				{isLoading}
			/>
		{:else}
			<div class="py-8 text-center">
				<p class="text-gray-500">No hay eventos disponibles</p>
			</div>
		{/if}
	</div>

	<!-- Eventos en Guayaquil Section -->
	{#if data?.guayaquilEvents?.length || isLoading}
		<EventSection
			title="Próximos eventos en Guayaquil"
			events={data.guayaquilEvents || []}
			maxCards={10}
			{isLoading}
		/>
	{/if}

	<!-- Eventos en Quito Section -->
	{#if data?.quitoEvents?.length || isLoading}
		<EventSection
			title="	Próximos eventos en Quito"
			events={data.quitoEvents || []}
			maxCards={10}
			{isLoading}
		/>
	{/if}

	<!-- Features Section -->
	<section class="py-16 md:py-24 bg-gray-50/50 relative overflow-hidden">
		<!-- Decorative elements -->
		<div
			class="absolute top-0 left-0 w-1/2 h-1/2 bg-buyer-100/20 blur-[120px] rounded-full pointer-events-none"
		></div>
		<div
			class="absolute bottom-0 right-0 w-1/3 h-1/3 bg-organizer-100/20 blur-[100px] rounded-full pointer-events-none"
		></div>

		<div class="max-w-7xl mx-auto px-6 relative z-10">
			<!-- Header -->
			<div class="text-center mb-16">
				<h2
					class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4"
				>
					¿Por qué elegir VTickets?
				</h2>
				<div class="h-1.5 w-24 bg-buyer-600 rounded-full mx-auto mb-6"></div>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					La mejor experiencia para comprar tus entradas de forma segura,
					rápida y confiable
				</p>
			</div>

			<!-- Features Grid -->
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Feature 1: Security -->
				<div
					class="group relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-buyer-200 hover:shadow-lg transition-all duration-300"
				>
					<!-- Icon Container -->
					<div
						class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-buyer-50 text-buyer-600 mb-6 group-hover:bg-buyer-100 transition-colors duration-300"
					>
						<svg
							class="w-7 h-7"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>

					<!-- Content -->
					<h3
						class="text-xl font-bold text-gray-900 mb-3 group-hover:text-buyer-600 transition-colors duration-300"
					>
						Pago Seguro
					</h3>
					<p class="text-gray-600 leading-relaxed">
						Transacciones protegidas con la última tecnología de
						encriptación de nivel bancario
					</p>

					<!-- Bottom accent -->
					<div
						class="absolute bottom-0 left-0 h-1 w-0 bg-buyer-600 rounded-full group-hover:w-full transition-all duration-500"
					></div>
				</div>

				<!-- Feature 2: Speed -->
				<div
					class="group relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-buyer-200 hover:shadow-lg transition-all duration-300"
				>
					<!-- Icon Container -->
					<div
						class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-buyer-50 text-buyer-600 mb-6 group-hover:bg-buyer-100 transition-colors duration-300"
					>
						<svg
							class="w-7 h-7"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>

					<!-- Content -->
					<h3
						class="text-xl font-bold text-gray-900 mb-3 group-hover:text-buyer-600 transition-colors duration-300"
					>
						Rápido y Fácil
					</h3>
					<p class="text-gray-600 leading-relaxed">
						Compra tus entradas en segundos con nuestra interfaz
						intuitiva y proceso optimizado
					</p>

					<!-- Bottom accent -->
					<div
						class="absolute bottom-0 left-0 h-1 w-0 bg-buyer-600 rounded-full group-hover:w-full transition-all duration-500"
					></div>
				</div>

				<!-- Feature 3: Support -->
				<div
					class="group relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-buyer-200 hover:shadow-lg transition-all duration-300"
				>
					<!-- Icon Container -->
					<div
						class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-buyer-50 text-buyer-600 mb-6 group-hover:bg-buyer-100 transition-colors duration-300"
					>
						<svg
							class="w-7 h-7"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>

					<!-- Content -->
					<h3
						class="text-xl font-bold text-gray-900 mb-3 group-hover:text-buyer-600 transition-colors duration-300"
					>
						Soporte 24/7
					</h3>
					<p class="text-gray-600 leading-relaxed">
						Estamos aquí para ayudarte en cualquier momento que lo
						necesites con atención personalizada
					</p>

					<!-- Bottom accent -->
					<div
						class="absolute bottom-0 left-0 h-1 w-0 bg-buyer-600 rounded-full group-hover:w-full transition-all duration-500"
					></div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #f8f9fa;
	}

	.first-section {
		padding-top: 3rem;
	}

	@media (min-width: 768px) {
		.first-section {
			padding-top: 4rem;
		}
	}
</style>
