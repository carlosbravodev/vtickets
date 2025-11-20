<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';
	import { compressImage, validateImageFile } from '$lib/utils/image';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: any } = $props();

	// Estados del formulario
	let currentStep = $state(1);
	let isSubmitting = $state(false);
	let isCompressingImage = $state(false);

	// Datos del evento
	let eventData = $state({
		name: '',
		description: '',
		venue: '',
		location: '',
		date: '',
		time: '',
		image: null as File | null,
		imagePreview: null as string | null
	});

	// Tipos de tickets
	let ticketTypes = $state<
		Array<{
			id: string;
			name: string;
			price: number;
			quantity: number;
			description: string;
		}>
	>([]);

	// Agregar primer ticket por defecto
	$effect(() => {
		if (ticketTypes.length === 0) {
			addTicketType();
		}
	});

	function addTicketType() {
		ticketTypes.push({
			id: crypto.randomUUID(),
			name: '',
			price: 0,
			quantity: 100,
			description: ''
		});
	}

	function removeTicketType(id: string) {
		if (ticketTypes.length > 1) {
			ticketTypes = ticketTypes.filter((t) => t.id !== id);
		} else {
			toast.error('Debe haber al menos un tipo de ticket');
		}
	}

	async function handleImageChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			const file = target.files[0];

			// Validar archivo
			const validation = validateImageFile(file, 5);
			if (!validation.valid) {
				toast.error(validation.error || 'Error al validar imagen');
				target.value = '';
				return;
			}

			try {
				isCompressingImage = true;
				toast.info('Optimizando imagen...');

				// Comprimir imagen antes de guardar
				const compressedFile = await compressImage(file, {
					maxWidth: 1920,
					maxHeight: 1080,
					quality: 0.85,
					targetFormat: 'webp'
			});

			// Mostrar información de compresión
			const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
			const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
			const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
			
			console.log('🖼️ Image compression:', {
				original: { name: file.name, size: file.size, type: file.type },
				compressed: { name: compressedFile.name, size: compressedFile.size, type: compressedFile.type },
				savings: savings + '%'
			});
			
			toast.success(
				`Imagen optimizada: ${originalSizeMB}MB → ${compressedSizeMB}MB (${savings}% reducido)`
			);				eventData.image = compressedFile;
				eventData.imagePreview = URL.createObjectURL(compressedFile);
			} catch (error) {
				console.error('Error comprimiendo imagen:', error);
				toast.error('Error al optimizar la imagen. Intenta con otra.');
				target.value = '';
			} finally {
				isCompressingImage = false;
			}
		}
	}

	function validateStep1(): boolean {
		if (!eventData.name || eventData.name.trim().length < 3) {
			toast.error('El nombre debe tener al menos 3 caracteres');
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
		if (!eventData.date) {
			toast.error('La fecha es obligatoria');
			return false;
		}
		if (!eventData.time) {
			toast.error('La hora es obligatoria');
			return false;
		}

		// Validar fecha futura
		const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
		if (eventDateTime <= new Date()) {
			toast.error('La fecha y hora deben ser futuras');
			return false;
		}

		return true;
	}

	function validateStep2(): boolean {
		if (!eventData.image) {
			toast.error('Debes seleccionar una imagen');
			return false;
		}
		return true;
	}

	function validateStep3(): boolean {
		if (ticketTypes.length === 0) {
			toast.error('Debes crear al menos un tipo de ticket');
			return false;
		}

		for (const ticket of ticketTypes) {
			if (!ticket.name || ticket.name.trim().length < 2) {
				toast.error('Todos los tickets deben tener un nombre');
				return false;
			}
			if (ticket.price < 0) {
				toast.error('El precio no puede ser negativo');
				return false;
			}
			if (ticket.quantity < 1) {
				toast.error('La cantidad debe ser al menos 1');
				return false;
			}
		}

		return true;
	}

	function nextStep() {
		if (currentStep === 1 && !validateStep1()) return;
		if (currentStep === 2 && !validateStep2()) return;

		if (currentStep < 3) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function handleFormSubmit(e: Event) {
		e.preventDefault();
		
		if (!validateStep3()) return;

		console.log('📝 Starting form submission');
		isSubmitting = true;

		// Validar imagen
		if (!eventData.image) {
			toast.error('Debes seleccionar una imagen');
			isSubmitting = false;
			return;
		}

		console.log('📤 About to upload image:', {
			name: eventData.image.name,
			size: eventData.image.size,
			sizeMB: (eventData.image.size / 1024 / 1024).toFixed(2) + 'MB',
			type: eventData.image.type
		});

		try {
			// Crear FormData manualmente con todos los campos
			const formData = new FormData();
			formData.append('name', eventData.name);
			formData.append('description', eventData.description);
			formData.append('venue', eventData.venue);
			formData.append('location', eventData.location);
			formData.append('date', eventData.date);
			formData.append('time', eventData.time);
			formData.append('image', eventData.image);
			formData.append('ticket_types', JSON.stringify(ticketTypes));

			console.log('📤 Sending FormData to server');

			// Enviar con fetch (sin el ?/default)
			const response = await fetch('', {
				method: 'POST',
				body: formData
			});

			console.log('📥 Response status:', response.status);

			// Si es redirect (303), SvelteKit lo maneja automáticamente
			if (response.redirected || response.status === 303) {
				toast.success('¡Evento creado exitosamente! 🎉');
				window.location.href = response.url;
				return;
			}

			const result = await response.json();
			console.log('📥 Response received:', result);

			if (response.ok) {
				toast.success('¡Evento creado exitosamente! 🎉');
				// Esperar un poco y navegar
				setTimeout(() => {
					goto('/organizador/eventos?success=created');
				}, 500);
			} else if (result.type === 'failure' || result.data) {
				console.error('❌ Failure:', result.data || result);
				toast.error(result.data?.message || result.message || 'Error al crear el evento');
				isSubmitting = false;
			} else {
				console.error('❌ Unknown error');
				toast.error('Error desconocido al crear el evento');
				isSubmitting = false;
			}
		} catch (error) {
			console.error('💥 Error in form submission:', error);
			toast.error('Error al enviar el formulario');
			isSubmitting = false;
		}
	}

	// Formatear fecha mínima (hoy)
	let minDate = $derived(new Date().toISOString().split('T')[0]);
</script>

<svelte:head>
	<title>Crear Evento | Panel de Organizadores</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-purple-50 via-white to-indigo-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="mb-8">
			<a
				href="/organizador/eventos"
				class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-4"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Volver a Mis Eventos
			</a>
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Crear Nuevo Evento</h1>
			<p class="text-gray-600">
				Completa los siguientes pasos para crear tu evento y empezar a vender tickets
			</p>
		</div>

		<!-- Progress Steps -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full {currentStep >= 1
							? 'bg-purple-600 text-white'
							: 'bg-gray-300 text-gray-600'} font-bold transition-all"
					>
						{currentStep > 1 ? '✓' : '1'}
					</div>
					<span class="text-sm font-semibold {currentStep === 1 ? 'text-purple-600' : 'text-gray-600'}"
						>Datos Básicos</span
					>
				</div>

				<div class="flex-1 h-1 mx-4 {currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-300'}"></div>

				<div class="flex items-center gap-2">
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full {currentStep >= 2
							? 'bg-purple-600 text-white'
							: 'bg-gray-300 text-gray-600'} font-bold transition-all"
					>
						{currentStep > 2 ? '✓' : '2'}
					</div>
					<span class="text-sm font-semibold {currentStep === 2 ? 'text-purple-600' : 'text-gray-600'}"
						>Imagen</span
					>
				</div>

				<div class="flex-1 h-1 mx-4 {currentStep >= 3 ? 'bg-purple-600' : 'bg-gray-300'}"></div>

				<div class="flex items-center gap-2">
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full {currentStep >= 3
							? 'bg-purple-600 text-white'
							: 'bg-gray-300 text-gray-600'} font-bold transition-all"
					>
						3
					</div>
					<span class="text-sm font-semibold {currentStep === 3 ? 'text-purple-600' : 'text-gray-600'}"
						>Tickets</span
					>
				</div>
			</div>
		</div>

		<!-- Form -->
		<form
			method="POST"
			enctype="multipart/form-data"
			onsubmit={handleFormSubmit}
			class="bg-white rounded-2xl shadow-xl p-8"
		>
			<!-- Los hidden inputs ya no son necesarios cuando usamos fetch manual -->
			<!-- Step 1: Datos Básicos -->
			{#if currentStep === 1}
				<div class="space-y-6">
					<h2 class="text-2xl font-bold text-gray-900 mb-6">Información del Evento</h2>

					<div>
						<label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
							Nombre del Evento *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={eventData.name}
							required
							minlength="3"
							class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
							placeholder="Ej: Concierto de Rock 2025"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
							Descripción *
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={eventData.description}
							required
							minlength="10"
							rows="5"
							class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
							placeholder="Describe tu evento, qué incluye, quién participa, etc."
						></textarea>
					<p class="text-xs text-gray-500 mt-1">
						{eventData.description.length} caracteres (mínimo 10)
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="venue" class="block text-sm font-semibold text-gray-700 mb-2">
							Lugar/Recinto *
						</label>
						<input
							type="text"
							id="venue"
							name="venue"
							bind:value={eventData.venue}
							required
							minlength="3"
							class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
							placeholder="Ej: Estadio Monumental, Teatro Nacional"
						/>
					</div>

					<div>
						<label for="location" class="block text-sm font-semibold text-gray-700 mb-2">
							Ciudad *
						</label>
						<input
							type="text"
							id="location"
							name="location"
							bind:value={eventData.location}
							required
							minlength="3"
							class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
							placeholder="Ej: Guayaquil, Quito, Cuenca"
						/>
					</div>
				</div>					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="date" class="block text-sm font-semibold text-gray-700 mb-2">
								Fecha del Evento *
							</label>
							<input
								type="date"
								id="date"
								name="date"
								bind:value={eventData.date}
								min={minDate}
								required
								class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
							/>
						</div>

						<div>
							<label for="time" class="block text-sm font-semibold text-gray-700 mb-2">
								Hora del Evento *
							</label>
							<input
								type="time"
								id="time"
								name="time"
								bind:value={eventData.time}
								required
								class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 2: Imagen -->
			{#if currentStep === 2}
				<div class="space-y-6">
					<h2 class="text-2xl font-bold text-gray-900 mb-6">Imagen del Evento</h2>

					<div>
						<label for="image" class="block text-sm font-semibold text-gray-700 mb-2">
							Selecciona una imagen atractiva *
						</label>
						<div
							class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-all"
						>
							{#if eventData.imagePreview}
								<div class="relative">
									<img
										src={eventData.imagePreview}
									alt="Preview"
									class="max-h-96 mx-auto rounded-lg shadow-lg"
								/>
								<button
									type="button"
									onclick={() => {
										eventData.image = null;
										eventData.imagePreview = null;
									}}
									aria-label="Eliminar imagen del evento"
									class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
								>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{:else}
								<svg
									class="w-16 h-16 mx-auto text-gray-400 mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<p class="text-gray-600 mb-2">Haz clic para seleccionar una imagen</p>
								<p class="text-sm text-gray-500">JPEG, PNG o WebP - Máximo 5MB</p>
							{/if}

							<input
								type="file"
								id="image"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onchange={handleImageChange}
								class="hidden"
							/>
							<label
								for="image"
								class="inline-block mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg cursor-pointer transition-all"
							>
								{eventData.image ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
							</label>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 3: Tickets -->
			{#if currentStep === 3}
				<div class="space-y-6">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h2 class="text-2xl font-bold text-gray-900">Tipos de Tickets</h2>
							<p class="text-gray-600 text-sm">
								Define los diferentes tipos de entradas que ofrecerás
							</p>
						</div>
						<button
							type="button"
							onclick={addTicketType}
							class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Agregar Tipo
						</button>
					</div>

					<div class="space-y-4">
						{#each ticketTypes as ticket, index (ticket.id)}
							<div class="border-2 border-gray-200 rounded-lg p-6 relative bg-gray-50">
								<div class="absolute top-4 right-4">
									{#if ticketTypes.length > 1}
										<button
											type="button"
											onclick={() => removeTicketType(ticket.id)}
											class="text-red-600 hover:text-red-700 p-2"
											title="Eliminar tipo de ticket"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									{/if}
								</div>

								<h3 class="text-lg font-bold text-gray-900 mb-4">Ticket #{index + 1}</h3>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="ticket-name-{index}" class="block text-sm font-semibold text-gray-700 mb-2">
								Nombre del Ticket *
							</label>
							<input
								id="ticket-name-{index}"
								type="text"
								bind:value={ticket.name}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								placeholder="Ej: General, VIP, Platino"
							/>
						</div>									<div>
										<label for="ticket-price-{index}" class="block text-sm font-semibold text-gray-700 mb-2"> Precio * </label>
										<div class="relative">
											<span class="absolute left-3 top-2.5 text-gray-600 font-semibold">S/</span>
											<input
												id="ticket-price-{index}"
												type="number"
												bind:value={ticket.price}
												min="0"
												step="0.01"
												required
												class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												placeholder="0.00"
											/>
										</div>
									</div>

									<div>
										<label for="ticket-quantity-{index}" class="block text-sm font-semibold text-gray-700 mb-2">
											Cantidad *
										</label>
										<input
											id="ticket-quantity-{index}"
											type="number"
											bind:value={ticket.quantity}
											min="1"
											required
											class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											placeholder="100"
										/>
									</div>
								</div>

								<div class="mt-4">
									<label for="ticket-desc-{index}" class="block text-sm font-semibold text-gray-700 mb-2">
										Descripción (opcional)
									</label>
									<textarea
										id="ticket-desc-{index}"
										bind:value={ticket.description}
										rows="2"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
										placeholder="Ej: Incluye acceso preferencial y bebida gratis"
									></textarea>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="flex items-center justify-between mt-8 pt-6 border-t">
				{#if currentStep > 1}
					<button
						type="button"
						onclick={prevStep}
						class="px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Anterior
					</button>
				{:else}
					<div></div>
				{/if}

				{#if currentStep < 3}
					<button
						type="button"
						onclick={nextStep}
						class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
					>
						Siguiente
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				{:else}
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if isSubmitting}
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Creando Evento...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Crear Evento
						{/if}
					</button>
				{/if}
			</div>
		</form>

		<!-- Preview Card (Step 3) -->
		{#if currentStep === 3 && eventData.name}
			<div class="mt-8 bg-white rounded-2xl shadow-xl p-6">
				<h3 class="text-xl font-bold text-gray-900 mb-4">Vista Previa</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#if eventData.imagePreview}
						<img
							src={eventData.imagePreview}
							alt={eventData.name}
							class="w-full h-64 object-cover rounded-lg"
						/>
					{/if}
					<div>
						<h4 class="text-2xl font-bold text-gray-900 mb-2">{eventData.name}</h4>
						<p class="text-gray-600 mb-4">{eventData.description}</p>
						<div class="space-y-2 text-sm">
							<p class="flex items-center gap-2">
								<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
								<span class="font-semibold">{eventData.location}</span>
							</p>
							<p class="flex items-center gap-2">
								<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span class="font-semibold"
									>{new Date(`${eventData.date}T${eventData.time}`).toLocaleString('es-PE', {
										dateStyle: 'full',
										timeStyle: 'short'
									})}</span
								>
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
