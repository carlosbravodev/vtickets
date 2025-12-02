<script lang="ts">
	import { goto } from '$app/navigation';
	import { compressImage, validateImageFile } from '$lib/utils/image';
	import { toast } from '$lib/stores/toast.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Estado del formulario
	let currentStep = $state(1);
	let isSubmitting = $state(false);
	let isCompressingImage = $state(false);

	// Datos del evento pre-poblados
	const eventDateTime = $derived.by(() => new Date(data.event.event_date));
	const eventDate = $derived.by(() => eventDateTime.toISOString().split('T')[0]);
	const eventTime = $derived.by(() => eventDateTime.toTimeString().slice(0, 5));

	let eventData = $state({
		name: '',
		description: '',
		venue: '',
		location: '',
		date: '',
		time: '',
		image: null as File | null,
		keepCurrentImage: true
	});

	let ticketTypes = $state<any[]>([]);

	let currentImageUrl = $state('');
	let imagePreview = $state<string | null>(null);

	// Inicializar datos desde data cuando se monta
	let isInitialized = $state(false);

	onMount(() => {
		if (!isInitialized) {
			eventData = {
				name: data.event.title,
				description: data.event.description,
				venue: data.event.venue,
				location: data.event.location,
				date: eventDate,
				time: eventTime,
				image: null,
				keepCurrentImage: true
			};

			ticketTypes = (data.event.ticket_types || []).map((ticket: any) => ({
				id: `existing-${ticket.id}`,
				name: ticket.name,
				price: ticket.price,
				quantity: ticket.initial_quantity,
				description: ''
			}));

			currentImageUrl = data.event.image_url || '';
			isInitialized = true;
		}
	});

	// Validaciones por paso
	function validateStep1() {
		if (!eventData.name || eventData.name.trim().length < 3) {
			toast.error('El nombre del evento debe tener al menos 3 caracteres');
			return false;
		}

		if (!eventData.description || eventData.description.trim().length < 10) {
			toast.error('La descripción debe tener al menos 10 caracteres');
			return false;
		}

		if (!eventData.venue || eventData.venue.trim().length < 3) {
			toast.error('El lugar/recinto debe tener al menos 3 caracteres');
			return false;
		}

		if (!eventData.location || eventData.location.trim().length < 3) {
			toast.error('La ciudad debe tener al menos 3 caracteres');
			return false;
		}

		if (!eventData.date || !eventData.time) {
			toast.error('La fecha y hora del evento son obligatorias');
			return false;
		}

		const selectedDateTime = new Date(`${eventData.date}T${eventData.time}`);
		if (selectedDateTime <= new Date()) {
			toast.error('La fecha y hora deben ser futuras');
			return false;
		}

		return true;
	}

	function validateStep2() {
		// Si mantiene la imagen actual o subió una nueva, está bien
		if (eventData.keepCurrentImage || eventData.image) {
			return true;
		}

		toast.error('Debes mantener la imagen actual o subir una nueva');
		return false;
	}

	function validateStep3() {
		if (ticketTypes.length === 0) {
			toast.error('Debes agregar al menos un tipo de ticket');
			return false;
		}

		for (let i = 0; i < ticketTypes.length; i++) {
			const ticket = ticketTypes[i];

			if (!ticket.name || ticket.name.trim().length < 2) {
				toast.error(`El nombre del ticket ${i + 1} debe tener al menos 2 caracteres`);
				return false;
			}

			if (!ticket.price || ticket.price < 0) {
				toast.error(`El precio del ticket ${i + 1} debe ser mayor o igual a 0`);
				return false;
			}

			if (!ticket.quantity || ticket.quantity < 1) {
				toast.error(`La cantidad del ticket ${i + 1} debe ser al menos 1`);
				return false;
			}
		}

		return true;
	}

	function nextStep() {
		if (currentStep === 1 && !validateStep1()) return;
		if (currentStep === 2 && !validateStep2()) return;
		if (currentStep === 3) return;

		currentStep++;
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const validation = validateImageFile(file);
		if (!validation.valid) {
			toast.error(validation.error || 'Archivo no válido');
			input.value = '';
			return;
		}

		isCompressingImage = true;
		try {
			const compressedFile = await compressImage(file);
			eventData.image = compressedFile;
			eventData.keepCurrentImage = false;

			// Crear preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(compressedFile);

			toast.success('Imagen optimizada correctamente');
		} catch (error) {
			toast.error('Error al procesar la imagen');
			input.value = '';
		} finally {
			isCompressingImage = false;
		}
	}

	function removeNewImage() {
		eventData.image = null;
		imagePreview = null;
		eventData.keepCurrentImage = true;
	}

	function addTicketType() {
		ticketTypes.push({
			id: `new-${Date.now()}`,
			name: '',
			price: 0,
			quantity: 1,
			description: ''
		});
	}

	function removeTicketType(index: number) {
		ticketTypes.splice(index, 1);
	}

	async function handleSubmit() {
		if (!validateStep3()) return;

		isSubmitting = true;

		const formData = new FormData();
		formData.append('name', eventData.name);
		formData.append('description', eventData.description);
		formData.append('venue', eventData.venue);
		formData.append('location', eventData.location);
		formData.append('date', eventData.date);
		formData.append('time', eventData.time);
		formData.append('keepCurrentImage', String(eventData.keepCurrentImage));

		if (eventData.image) {
			formData.append('image', eventData.image);
		}

		formData.append('ticket_types', JSON.stringify(ticketTypes));

		try {
			const response = await fetch('', {
				method: 'POST',
				body: formData
			});

			// Si hubo éxito, redirigir
			if (response.ok || response.redirected) {
				toast.success('Evento actualizado exitosamente');
				// Pequeña pausa para que se vea el toast
				setTimeout(() => {
					goto('/organizador/eventos');
				}, 800);
				return;
			}

			// Si hay error, intentar obtener el mensaje
			try {
				const result = await response.json();
				toast.error(result.message || 'Error al actualizar el evento');
			} catch {
				toast.error('Error al actualizar el evento');
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			toast.error('Error al actualizar el evento');
			isSubmitting = false;
		}
	}

	function cancel() {
		goto(`/organizador/eventos/${data.event.slug}`);
	}
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<button
				onclick={cancel}
				class="text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center gap-2"
			>
				← Volver al evento
			</button>
			<h1 class="text-3xl font-bold text-gray-900">Editar Evento</h1>
			<p class="text-gray-600 mt-2">Actualiza la información de tu evento</p>
		</div>

		<!-- Progress Steps -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 {currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}">
						1
					</div>
					<span class="font-medium">Información</span>
				</div>
				<div class="flex-1 h-1 mx-4 {currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}"></div>
				<div class="flex items-center gap-2 {currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}">
						2
					</div>
					<span class="font-medium">Imagen</span>
				</div>
				<div class="flex-1 h-1 mx-4 {currentStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}"></div>
				<div class="flex items-center gap-2 {currentStep >= 3 ? 'text-purple-600' : 'text-gray-400'}">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}">
						3
					</div>
					<span class="font-medium">Tickets</span>
				</div>
			</div>
		</div>

		<!-- Form Content -->
		<div class="bg-white rounded-lg shadow-sm p-8">
			<!-- Step 1: Información básica -->
			{#if currentStep === 1}
				<div class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							Nombre del evento *
						</label>
						<input
							type="text"
							id="name"
							bind:value={eventData.name}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="Ej: Concierto de Rock 2024"
							required
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
							Descripción *
						</label>
						<textarea
							id="description"
							bind:value={eventData.description}
							rows="4"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
							placeholder="Describe tu evento..."
							required
						></textarea>
					</div>

					<div>
						<label for="venue" class="block text-sm font-medium text-gray-700 mb-2">
							Lugar/Recinto *
						</label>
						<input
							type="text"
							id="venue"
							bind:value={eventData.venue}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="Ej: Estadio Nacional, Teatro Municipal"
							required
						/>
					</div>

					<div>
						<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
							Ciudad *
						</label>
						<input
							type="text"
							id="location"
							bind:value={eventData.location}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="Ej: Santiago, Valparaíso"
							required
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="date" class="block text-sm font-medium text-gray-700 mb-2">
								Fecha *
							</label>
							<input
								type="date"
								id="date"
								bind:value={eventData.date}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label for="time" class="block text-sm font-medium text-gray-700 mb-2">
								Hora *
							</label>
							<input
								type="time"
								id="time"
								bind:value={eventData.time}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 2: Imagen -->
			{#if currentStep === 2}
				<div class="space-y-6">
					<div>
						<label for="event-image" class="block text-sm font-medium text-gray-700 mb-2">
							Imagen del evento
						</label>

						<!-- Imagen actual -->
						{#if eventData.keepCurrentImage && !imagePreview}
							<div class="mb-4">
								<p class="text-sm text-gray-600 mb-2">Imagen actual:</p>
								<img 
									src={currentImageUrl} 
									alt="Imagen actual del evento" 
									class="w-full max-w-md rounded-lg shadow-sm"
								/>
								<button
									type="button"
									onclick={() => { eventData.keepCurrentImage = false; }}
									class="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
								>
									Cambiar imagen
								</button>
							</div>
						{/if}

						<!-- Nueva imagen -->
						{#if !eventData.keepCurrentImage}
							<div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
								{#if isCompressingImage}
									<div class="py-8">
										<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
										<p class="mt-4 text-gray-600">Optimizando imagen...</p>
									</div>
								{:else if imagePreview}
									<div class="space-y-4">
										<img src={imagePreview} alt="Preview" class="max-w-md mx-auto rounded-lg" />
										<button
											type="button"
											onclick={removeNewImage}
											class="text-red-600 hover:text-red-700 font-medium"
										>
											Usar imagen actual
										</button>
									</div>
								{:else}
									<input
										type="file"
										id="image"
										accept="image/*"
										onchange={handleImageUpload}
										class="hidden"
									/>
									<label for="image" class="cursor-pointer">
										<div class="space-y-2">
											<svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
												<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<div class="text-gray-600">
												<span class="text-purple-600 font-medium">Haz clic para subir</span> una nueva imagen
											</div>
											<p class="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
										</div>
									</label>
									<button
										type="button"
										onclick={() => { eventData.keepCurrentImage = true; }}
										class="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
									>
										Mantener imagen actual
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Step 3: Tipos de tickets -->
			{#if currentStep === 3}
				<div class="space-y-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-medium text-gray-900">Tipos de Tickets</h3>
						<button
							type="button"
							onclick={addTicketType}
							class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							+ Agregar Ticket
						</button>
					</div>

					{#if ticketTypes.length === 0}
						<div class="text-center py-12 bg-gray-50 rounded-lg">
							<p class="text-gray-600">No hay tipos de tickets. Agrega al menos uno.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each ticketTypes as ticket, index}
								<div class="border border-gray-200 rounded-lg p-6 relative">
									<button
										type="button"
										onclick={() => removeTicketType(index)}
										class="absolute top-4 right-4 text-red-600 hover:text-red-700"
										title="Eliminar tipo de ticket"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label for="ticket-name-{ticket.id}" class="block text-sm font-medium text-gray-700 mb-2">
											Nombre *
										</label>
										<input
											id="ticket-name-{ticket.id}"
											type="text"
											bind:value={ticket.name}
												class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												placeholder="Ej: General, VIP"
												required
											/>
										</div>

									<div>
										<label for="ticket-price-{ticket.id}" class="block text-sm font-medium text-gray-700 mb-2">
											Precio ($) *
										</label>
										<input
											id="ticket-price-{ticket.id}"
											type="number"
											bind:value={ticket.price}
												min="0"
												step="1"
												class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												placeholder="0"
												required
											/>
										</div>

									<div>
										<label for="ticket-quantity-{ticket.id}" class="block text-sm font-medium text-gray-700 mb-2">
											Cantidad *
										</label>
										<input
											id="ticket-quantity-{ticket.id}"
											type="number"
											bind:value={ticket.quantity}
												min="1"
												step="1"
												class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												placeholder="1"
												required
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
				<div>
					{#if currentStep > 1}
						<button
							type="button"
							onclick={prevStep}
							class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Anterior
						</button>
					{:else}
						<button
							type="button"
							onclick={cancel}
							class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancelar
						</button>
					{/if}
				</div>

				<div>
					{#if currentStep < 3}
						<button
							type="button"
							onclick={nextStep}
							class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							Siguiente
						</button>
					{:else}
						<button
							type="button"
							onclick={handleSubmit}
							disabled={isSubmitting}
							class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Actualizando...' : 'Actualizar Evento'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
