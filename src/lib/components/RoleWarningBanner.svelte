<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	interface Props {
		currentSection: 'buyer' | 'organizer';
		userHasRole: boolean;
		availableRoles: string[];
	}

	let { currentSection, userHasRole, availableRoles }: Props = $props();

	// Determinar si debe mostrarse el banner
	let shouldShow = $derived(!userHasRole && availableRoles.length > 0);

	// Información del banner según la sección
	let bannerInfo = $derived.by(() => {
		if (currentSection === 'organizer') {
			return {
				title: 'Acceso Restringido',
				message: 'Estás intentando acceder a la sección de organizadores pero tu cuenta es de comprador.',
				linkText: 'Ir a la Tienda',
				linkHref: '/',
				bgColor: 'bg-orange-50',
				borderColor: 'border-orange-200',
				textColor: 'text-orange-800',
				iconColor: 'text-orange-500'
			};
		} else {
			return {
				title: 'Sesión de Organizador Activa',
				message: 'Tienes una sesión de organizador activa. Para comprar tickets, usa tu cuenta de comprador.',
				linkText: 'Ir al Panel de Organizador',
				linkHref: '/organizador',
				bgColor: 'bg-blue-50',
				borderColor: 'border-blue-200',
				textColor: 'text-blue-800',
				iconColor: 'text-blue-500'
			};
		}
	});

	let isDismissed = $state(false);

	function dismiss() {
		isDismissed = true;
	}
</script>

{#if shouldShow && !isDismissed}
	<div 
		in:slide={{ duration: 300 }}
		out:fade={{ duration: 200 }}
		class="sticky top-0 z-40 {bannerInfo.bgColor} border-b-2 {bannerInfo.borderColor}"
	>
		<div class="max-w-7xl mx-auto px-4 py-3">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3 flex-1">
					<!-- Icono -->
					<svg class="w-6 h-6 {bannerInfo.iconColor} shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>

					<!-- Mensaje -->
					<div class="flex-1">
						<p class="font-semibold {bannerInfo.textColor} text-sm md:text-base">
							{bannerInfo.title}
						</p>
						<p class="text-xs md:text-sm {bannerInfo.textColor} opacity-90 mt-0.5">
							{bannerInfo.message}
						</p>
					</div>
				</div>

				<!-- Acciones -->
				<div class="flex items-center gap-2 shrink-0">
					<a
						href={bannerInfo.linkHref}
						class="px-4 py-2 bg-white hover:bg-gray-50 {bannerInfo.textColor} text-sm font-semibold rounded-lg border-2 {bannerInfo.borderColor} transition-colors whitespace-nowrap"
					>
						{bannerInfo.linkText}
					</a>
					<button
						onclick={dismiss}
						class="{bannerInfo.textColor} hover:opacity-75 transition-opacity p-1"
						title="Cerrar"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
