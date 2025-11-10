<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Completa tu Perfil | v•tickets</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
				<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
				</svg>
			</div>
			<h1 class="text-3xl font-black text-gray-900 mb-2">¡Bienvenido a v•tickets!</h1>
			<p class="text-lg text-gray-600">
				Para continuar, por favor completa tu información personal
			</p>
		</div>

		<!-- Formulario -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			{#if form?.message}
				<div class="mb-6 p-4 rounded-lg {form.message.includes('Error') || form.message.includes('obligatorios') ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}">
					<p class="text-sm font-medium">{form.message}</p>
				</div>
			{/if}

			<form method="POST" use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					await update();
					isSubmitting = false;
					
					if (result.type === 'redirect') {
						toast.success('¡Perfil completado exitosamente! Bienvenido a v•tickets 🎉');
						setTimeout(() => goto(result.location), 500);
					}
				};
			}} class="space-y-6">
			<!-- Campo oculto para preservar redirectTo -->
			<input type="hidden" name="redirectTo" value={data.redirectTo} />
			
				<!-- Nombres y Apellidos -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="first_name" class="block text-sm font-bold text-gray-700 mb-2">
							Nombres <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="first_name"
							name="first_name"
							value={data.profile?.first_name || ''}
							required
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							placeholder="Juan Carlos"
						/>
					</div>

					<div>
						<label for="last_name" class="block text-sm font-bold text-gray-700 mb-2">
							Apellidos <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="last_name"
							name="last_name"
							value={data.profile?.last_name || ''}
							required
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							placeholder="Pérez García"
						/>
					</div>
				</div>

				<!-- Email (solo lectura) -->
				<div>
					<label for="email" class="block text-sm font-bold text-gray-700 mb-2">
						Correo Electrónico
					</label>
					<input
						type="email"
						id="email"
						value={data.user?.email || ''}
						disabled
						class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
					/>
				</div>

				<!-- Teléfono -->
				<div>
					<label for="phone" class="block text-sm font-bold text-gray-700 mb-2">
						Teléfono <span class="text-red-500">*</span>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						value={data.profile?.phone || ''}
						required
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
						placeholder="+593 99 999 9999"
					/>
				</div>

				<!-- Tipo de Documento y Número (OBLIGATORIO) -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="document_type" class="block text-sm font-bold text-gray-700 mb-2">
							Tipo de Documento <span class="text-red-500">*</span>
						</label>
						<select
							id="document_type"
							name="document_type"
							value={data.profile?.document_type || 'cedula'}
							required
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
						>
							<option value="cedula">Cédula</option>
							<option value="pasaporte">Pasaporte</option>
							<option value="ruc">RUC</option>
						</select>
					</div>

					<div>
						<label for="document_number" class="block text-sm font-bold text-gray-700 mb-2">
							Número de Documento <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="document_number"
							name="document_number"
							value={data.profile?.document_number || ''}
							required
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							placeholder="1234567890"
						/>
					</div>
				</div>

				<!-- Campos opcionales -->
				<details class="border border-gray-200 rounded-lg p-4">
					<summary class="font-bold text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors">
						Información adicional (opcional)
					</summary>
					
					<div class="mt-6 space-y-6">
						<!-- Fecha de Nacimiento -->
						<div>
							<label for="birth_date" class="block text-sm font-medium text-gray-700 mb-2">
								Fecha de Nacimiento
							</label>
							<input
								type="date"
								id="birth_date"
								name="birth_date"
								value={data.profile?.birth_date || ''}
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							/>
						</div>

						<!-- Ciudad y País -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="city" class="block text-sm font-medium text-gray-700 mb-2">
									Ciudad
								</label>
								<input
									type="text"
									id="city"
									name="city"
									value={data.profile?.city || ''}
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Quito"
								/>
							</div>

							<div>
								<label for="country" class="block text-sm font-medium text-gray-700 mb-2">
									País
								</label>
								<input
									type="text"
									id="country"
									name="country"
									value={data.profile?.country || 'Ecuador'}
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Ecuador"
								/>
							</div>
						</div>
					</div>
				</details>

				<!-- Botón de envío -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Guardando...
					{:else}
						Completar Perfil
					{/if}
				</button>
			</form>

			<!-- Nota informativa -->
			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<div class="flex gap-3">
					<svg class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
					</svg>
					<div class="text-sm text-blue-800">
						<p class="font-medium mb-1">¿Por qué necesitamos esta información?</p>
						<p class="text-blue-700">Los datos personales son requeridos para la emisión de tus entradas y verificación en los eventos.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
