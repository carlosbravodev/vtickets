<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Estado para alternar entre login y registro
	let mode = $state<'login' | 'registro'>('login');
	let isLoading = $state(false);
	let showPassword = $state(false);

	function toggleMode() {
		mode = mode === 'login' ? 'registro' : 'login';
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'} - Organizadores | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-2xl shadow-2xl p-8">
			<!-- Logo/Header -->
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					{mode === 'login' ? '¡Bienvenido Organizador!' : 'Crea tu cuenta de Organizador'}
				</h1>
				<p class="text-gray-600">
					{mode === 'login' ? 'Accede a tu panel de control' : 'Comienza a crear y gestionar eventos'}
				</p>
			</div>

			<!-- Mensajes de Error/Éxito -->
			{#if form?.message}
				<div class="mb-6 p-4 rounded-lg {form.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<p class="text-sm {form.success ? 'text-green-800' : 'text-red-800'}">
						{form.message}
					</p>
				</div>
			{/if}

			<!-- Formulario -->
			<form 
				method="POST" 
				action="?/{mode}" 
				use:enhance={() => {
					isLoading = true;
					return async ({ update, result }) => {
						await update();
						isLoading = false;
						if (result.type === 'redirect') {
							// La redirección se manejará automáticamente
						}
					};
				}}
			>
				<div class="space-y-4">
					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
							Correo Electrónico
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={form?.email || ''}
							required
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
							placeholder="organizador@ejemplo.com"
						/>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
							Contraseña
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								required
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12"
								placeholder={mode === 'login' ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{#if showPassword}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<!-- Botón de Submit -->
					<button
						type="submit"
						disabled={isLoading}
						class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
					>
						{#if isLoading}
							<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							{mode === 'login' ? 'Iniciando sesión...' : 'Registrando...'}
						{:else}
							{mode === 'login' ? '🔐 Iniciar Sesión' : '🚀 Crear Cuenta'}
						{/if}
					</button>
				</div>
			</form>

			<!-- Toggle entre Login y Registro -->
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">
					{mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
					<button
						type="button"
						onclick={toggleMode}
						class="font-semibold text-purple-600 hover:text-purple-700 transition-colors ml-1"
					>
						{mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
					</button>
				</p>
			</div>

			<!-- Separador -->
			<div class="mt-8 pt-6 border-t border-gray-200">
				<p class="text-xs text-center text-gray-500">
					<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					Panel de Organizadores - Solo para cuentas autorizadas
				</p>
			</div>

			<!-- Link a la app de compradores -->
			<div class="mt-4 text-center">
				<a 
					href="https://vtickets.com" 
					class="text-sm text-purple-600 hover:text-purple-700 font-medium"
				>
					← ¿Buscas comprar tickets? Ir a la tienda
				</a>
			</div>
		</div>
	</div>
</div>
