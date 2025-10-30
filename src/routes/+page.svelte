<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<div class="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
	<!-- Hero Section -->
	<section class="relative overflow-hidden">
		<div class="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-purple-500/10"></div>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
			<div class="text-center" in:fade={{ duration: 600 }}>
				<h1 class="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
					<span class="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
						VTickets
					</span>
				</h1>
				<p class="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
					Tu plataforma de confianza para comprar entradas a los mejores eventos
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<a
						href="/eventos"
						class="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
					>
						Ver Eventos
						<svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</a>
				</div>
			</div>
		</div>

		<!-- Decorative elements -->
		<div class="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
		<div class="absolute top-0 right-0 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
		<div class="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
	</section>

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
	@keyframes blob {
		0% {
			transform: translate(0px, 0px) scale(1);
		}
		33% {
			transform: translate(30px, -50px) scale(1.1);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.9);
		}
		100% {
			transform: translate(0px, 0px) scale(1);
		}
	}
	
	.animate-blob {
		animation: blob 7s infinite;
	}
	
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>

