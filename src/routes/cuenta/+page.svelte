<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'refunded':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'paid':
				return 'Pagado';
			case 'pending':
				return 'Pendiente';
			case 'refunded':
				return 'Reembolsado';
			default:
				return status;
		}
	};
</script>

<svelte:head>
	<title>Mi Cuenta | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-black text-gray-900 mb-2">Mi Cuenta</h1>
			<p class="text-xl text-gray-600">
				Bienvenido, <span class="font-bold">{data.user.email}</span>
			</p>
		</div>

		<!-- Órdenes -->
		<div class="bg-white rounded-lg shadow">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-2xl font-bold text-gray-900">Mis Compras</h2>
			</div>

			{#if data.orders.length === 0}
				<div class="px-6 py-12 text-center">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
					<h3 class="mt-2 text-lg font-medium text-gray-900">No tienes compras aún</h3>
					<p class="mt-1 text-gray-500">Explora nuestros eventos y compra tus entradas.</p>
					<div class="mt-6">
						<a
							href="/eventos"
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
						>
							Ver Eventos
						</a>
					</div>
				</div>
			{:else}
				<div class="divide-y divide-gray-200">
					{#each data.orders as order}
						<div class="px-6 py-6 hover:bg-gray-50 transition-colors">
							<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
								<!-- Info del Evento -->
								<div class="flex-1">
									<div class="flex items-start gap-4">
										{#if order.event?.image_url}
											<img
												src={order.event.image_url}
												alt={order.event.title}
												class="w-24 h-24 object-cover rounded-lg shrink-0"
											/>
										{/if}
										<div class="flex-1">
											<h3 class="text-lg font-bold text-gray-900 mb-1">
												{order.event?.title || 'Evento'}
											</h3>
											<div class="space-y-1 text-sm text-gray-600">
												<p class="flex items-center gap-2">
													<svg
														class="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													{order.event?.event_date
														? formatDate(order.event.event_date)
														: 'Fecha por confirmar'}
												</p>
												<p class="flex items-center gap-2">
													<svg
														class="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
														/>
													</svg>
													{order.event?.location || 'Ubicación por confirmar'}
												</p>
											</div>
										</div>
									</div>

									<!-- Tickets Comprados -->
									<div class="mt-4 ml-28">
										<p class="text-sm font-medium text-gray-700 mb-2">Entradas:</p>
										<div class="space-y-1">
											{#each order.ticketsDetails as ticket}
												<div class="flex items-center justify-between text-sm">
													<span class="text-gray-600">
														{ticket.quantity}x {ticket.name}
													</span>
													<span class="text-gray-900 font-medium">
														{formatPrice(ticket.price)}
													</span>
												</div>
											{/each}
										</div>
									</div>
								</div>

								<!-- Info de la Compra -->
								<div class="lg:text-right space-y-2">
									<div>
										<span
											class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(
												order.payment_status
											)}"
										>
											{getStatusText(order.payment_status)}
										</span>
									</div>
									<p class="text-2xl font-bold text-gray-900">
										{formatPrice(order.total_price)}
									</p>
									<p class="text-xs text-gray-500">
										Comprado el {formatDate(order.created_at)}
									</p>
									<p class="text-xs text-gray-400">
										Order #{order.lemon_squeezy_order_id}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Información adicional -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<div class="shrink-0">
					<svg
						class="h-5 w-5 text-blue-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">Información sobre tus entradas</h3>
					<div class="mt-2 text-sm text-blue-700">
						<p>
							Tus entradas han sido enviadas a tu correo electrónico. Si no las encuentras,
							revisa tu carpeta de spam o contacta con soporte.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Smooth transitions */
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
