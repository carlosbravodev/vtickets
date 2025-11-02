<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	let countdown = $state(5);

	onMount(() => {
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				goto('/cuenta');
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>¡Pago Exitoso! | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full" in:fade={{ duration: 400 }}>
		<div class="bg-white rounded-2xl shadow-xl p-8 text-center">
			<!-- Ícono de éxito -->
			<div class="mb-6" in:fly={{ y: -20, duration: 600, delay: 200 }}>
				<div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
					<svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>

			<!-- Mensaje -->
			<div in:fly={{ y: 20, duration: 600, delay: 300 }}>
				<h1 class="text-3xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
				<p class="text-gray-600 mb-6">
					Tu compra ha sido procesada correctamente. Recibirás un correo electrónico con los detalles de tu pedido y tus entradas.
				</p>

				<!-- Información -->
				<div class="bg-indigo-50 rounded-xl p-4 mb-6">
					<p class="text-sm text-gray-700">
						🎫 Revisa tu correo electrónico para descargar tus entradas
					</p>
				</div>

				<!-- Botones -->
				<div class="space-y-3">
					<a
						href="/cuenta"
						class="block w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
					>
						Ver mis entradas
					</a>
					<a
						href="/eventos"
						class="block w-full px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
					>
						Explorar más eventos
					</a>

					<p class="text-sm text-gray-500">
						Redirigiendo a tu cuenta en {countdown} segundo{countdown !== 1 ? 's' : ''}...
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
