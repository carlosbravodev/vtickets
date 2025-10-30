<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import logoNavbar from '$lib/assets/logo-navbar.png';
	import userIcon from '$lib/assets/icons/user.svg';

	let { children, data } = $props();
	import '../app.css';
	import { goto, invalidateAll, onNavigate } from '$app/navigation';

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	// View Transitions API
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>v•tickets | Tus eventos favoritos.</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="bg-white shadow sticky top-0 z-50">
	<nav class="flex justify-between items-center max-w-7xl mx-auto px-4 py-4">
		<div class="flex items-center gap-8">
			<a href="/">
				<img src={logoNavbar} alt="Logo de vtickets" class="h-10 w-auto min-w-28" />
			</a>
			<div class="hidden md:flex items-center gap-8">
				<a
					href="/eventos"
					class="text-xl font-bold pb-0.5 hover:text-gray-600 transition-colors duration-300"
					>Eventos</a
				>
			</div>
		</div>

		<div class="hidden md:flex items-center gap-4">
			<button
				onclick={() => goto('/login')}
				class="flex items-center bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 font-bold text-xl text-white py-2 px-4 rounded cursor-pointer"
			>
				<img src={userIcon} alt="Icono de usuario" class="inline-block mr-2" />
				Entrar
			</button>
		</div>

		<div class="md:hidden flex items-center">
			<button onclick={toggleMenu} class="text-gray-800 focus:outline-none">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					{#if isMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					{/if}
				</svg>
			</button>
		</div>
	</nav>

	<!-- Mobile Menu -->
	{#if isMenuOpen}
		<div class="absolute w-full md:hidden bg-white shadow-md">
			<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
				<a href="/eventos" class="text-gray-800 hover:text-gray-600 block px-3 py-2 rounded-md text-base font-medium">Eventos</a>
				<button
					onclick={() => {
						goto('/login');
						toggleMenu();
					}}
					class="w-full text-left flex items-center bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 font-bold text-white py-2 px-3 rounded"
				>
					<img src={userIcon} alt="Icono de usuario" class="inline-block mr-2 h-5 w-5" />
					Entrar
				</button>
			</div>
		</div>
	{/if}
</header>

{@render children?.()}
