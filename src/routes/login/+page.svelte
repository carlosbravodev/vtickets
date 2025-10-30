<script lang="ts">
import { enhance } from '$app/forms';
import { goto, invalidateAll } from '$app/navigation';
import type { ActionData } from './$types';
import { supabase } from '$lib/supabaseClient';

let { form }: { form: ActionData } = $props();

let mode: 'login' | 'registro' = $state('login');
let isLoading = $state(false);
let showPassword = $state(false);

let message = $derived(form?.message || '');
let messageType = $derived(form?.success ? 'success' : 'error');

function toggleMode() {
mode = mode === 'login' ? 'registro' : 'login';
}

async function handleOAuthLogin(provider: 'google' | 'facebook') {
isLoading = true;
const { error } = await supabase.auth.signInWithOAuth({
provider: provider,
options: {
redirectTo: `${location.origin}/auth/callback`
}
});

if (error) {
console.error('Error con OAuth:', error.message);
alert(`Error al iniciar sesión con ${provider}: ${error.message}`);
}
isLoading = false;
}
</script>

<svelte:head>
<title>{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'} | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
<div class="max-w-md w-full">
<div class="bg-white rounded-2xl shadow-xl p-8">
<div class="text-center mb-8">
<h1 class="text-3xl font-bold text-gray-900 mb-2">
{mode === 'login' ? '¡Bienvenido de nuevo!' : '¡Únete a nosotros!'}
</h1>
<p class="text-gray-600">
{mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Crea tu cuenta para empezar'}
</p>
</div>

{#if message}
<div class="mb-4 p-4 rounded-lg {messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}">
<div class="flex items-start">
<svg class="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
{#if messageType === 'success'}
<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
{:else}
<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
{/if}
</svg>
<span>{message}</span>
</div>
</div>
{/if}

<form method="POST" action="?/{mode}" use:enhance={() => {
isLoading = true;
return async ({ update, result }) => {
await update();
isLoading = false;
if (result.type === 'redirect') {
await invalidateAll();
goto(result.location);
}
};
}}>
<div class="mb-4">
<label for="email" class="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
<input type="email" id="email" name="email" required autocomplete="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="tu@email.com" value={form?.email ?? ''} />
</div>

<div class="mb-6">
<label for="password" class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
<div class="relative">
<input type={showPassword ? 'text' : 'password'} id="password" name="password" required autocomplete={mode === 'login' ? 'current-password' : 'new-password'} class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12" placeholder="••••••••" minlength="6" />
<button type="button" onclick={() => showPassword = !showPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
{#if showPassword}
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
{:else}
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
{/if}
</button>
</div>
{#if mode === 'registro'}
<p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
{/if}
</div>

<button type="submit" disabled={isLoading} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
{#if isLoading}
<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
Procesando...
{:else}
{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
{/if}
</button>
</form>

			<div class="my-6 flex items-center">
				<div class="flex-1 border-t border-gray-300"></div>
				<span class="px-4 text-sm text-gray-500">o continúa con</span>
				<div class="flex-1 border-t border-gray-300"></div>
			</div>

			<button type="button" onclick={() => handleOAuthLogin('google')} disabled={isLoading} class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50">
				<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
				Google
			</button><div class="mt-6 text-center">
<p class="text-gray-600">
{mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
<button type="button" onclick={toggleMode} class="text-indigo-600 hover:text-indigo-700 font-semibold ml-1">
{mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
</button>
</p>
</div>
</div>

<p class="mt-4 text-center text-sm text-gray-500">
Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
</p>
</div>
</div>
