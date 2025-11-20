<script lang="ts">
	import { onMount } from 'svelte';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	
	let { data } = $props();
	
	const formatDate = (dateString: string) => {
		if (!dateString) return 'Fecha por confirmar';
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
	
	// Auto-abrir diálogo de impresión cuando la página carga
	onMount(() => {
		// Esperar un momento para que se renderice todo
		setTimeout(() => {
			window.print();
		}, 500);
	});
</script>

<svelte:head>
	<title>Imprimir Tickets - {data.event.title}</title>
</svelte:head>

<div class="print-container">
	<!-- Header para impresión -->
	<div class="print-header">
		<h1>{data.event.title}</h1>
		<p class="order-number">Orden #{data.order.order_number || data.order.lemon_squeezy_order_id}</p>
	</div>

	<!-- Grid de tickets - cada ticket en su propia sección -->
	{#each data.tickets as ticket, index}
		<div class="ticket-page" class:page-break={index < data.tickets.length - 1}>
			<div class="ticket-card">
				<!-- Banner del evento -->
				{#if data.event.image_url}
					<div class="ticket-banner">
						<img 
							src={optimizeSupabaseImage(data.event.image_url, { width: 800, height: 300 })} 
							alt={data.event.title}
						/>
					</div>
				{/if}

				<!-- Información del evento -->
				<div class="ticket-info">
					<h2 class="event-title">{data.event.title}</h2>
					
					<div class="event-details">
						{#if data.event.event_date}
							<div class="detail-row">
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							<span>{formatDate(data.event.event_date)}</span>
						</div>
					{/if}
					
					{#if data.event.location || data.event.venue}
						<div class="detail-row">
							<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span>
								{#if data.event.venue}
									{data.event.venue}{data.event.location ? `, ${data.event.location}` : ''}
								{:else}
									{data.event.location}
								{/if}
							</span>
						</div>
					{/if}
				</div>
			</div>				<!-- Información del ticket -->
				<div class="ticket-holder">
					<h3>Información del Titular</h3>
					<div class="holder-details">
						<div class="holder-row">
							<span class="label">Nombre:</span>
							<span class="value">{ticket.holder_name || 'No especificado'}</span>
						</div>
				<div class="holder-row">
					<span class="label">Email:</span>
					<span class="value">{ticket.holder_email || 'No especificado'}</span>
				</div>
				<div class="holder-row">
					<span class="label">Tipo de Entrada:</span>
					<span class="value">{ticket.ticket_type.name}</span>
				</div>
					</div>
				</div>

				<!-- QR Code y código del ticket -->
				<div class="ticket-qr">
					<div class="qr-container">
						<img 
							src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={encodeURIComponent(ticket.qr_token)}"
							alt="QR Code"
							class="qr-code"
						/>
					</div>
					<div class="ticket-code">
						<span class="code-label">Código del Ticket:</span>
						<span class="code-value">{ticket.ticket_code}</span>
					</div>
				</div>

				<!-- Footer del ticket -->
				<div class="ticket-footer">
					<p class="ticket-number">Ticket {index + 1} de {data.tickets.length}</p>
					<p class="important-note">
						⚠️ Este código QR es único e intransferible. No lo compartas con nadie.
					</p>
				</div>
			</div>
		</div>
	{/each}

	<!-- Botón para cerrar (solo visible en pantalla) -->
	<div class="no-print close-button-container">
		<button onclick={() => window.close()} class="close-button">
			Cerrar
		</button>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.print-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}

	.print-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.print-header h1 {
		font-size: 24px;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 8px;
	}

	.order-number {
		color: #6b7280;
		font-size: 14px;
	}

	.ticket-page {
		margin-bottom: 40px;
	}

	.page-break {
		page-break-after: always;
	}

	.ticket-card {
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
		background: white;
	}

	.ticket-banner {
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: #f3f4f6;
	}

	.ticket-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ticket-info {
		padding: 24px;
		border-bottom: 2px dashed #e5e7eb;
	}

	.event-title {
		font-size: 22px;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 16px;
	}

	.event-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.detail-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		color: #4b5563;
	}

	.icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.ticket-holder {
		padding: 24px;
		background: #f9fafb;
		border-bottom: 2px dashed #e5e7eb;
	}

	.ticket-holder h3 {
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 12px;
	}

	.holder-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.holder-row {
		display: flex;
		gap: 8px;
	}

	.label {
		font-weight: 600;
		color: #4b5563;
		min-width: 120px;
	}

	.value {
		color: #1f2937;
	}

	.ticket-qr {
		padding: 32px 24px;
		text-align: center;
		border-bottom: 2px dashed #e5e7eb;
	}

	.qr-container {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	.qr-code {
		width: 250px;
		height: 250px;
		border: 4px solid #1f2937;
		border-radius: 8px;
	}

	.ticket-code {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.code-label {
		font-size: 14px;
		color: #6b7280;
		font-weight: 500;
	}

	.code-value {
		font-size: 20px;
		font-weight: bold;
		color: #1f2937;
		font-family: monospace;
		letter-spacing: 2px;
	}

	.ticket-footer {
		padding: 20px 24px;
		background: #f9fafb;
		text-align: center;
	}

	.ticket-number {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 12px;
	}

	.important-note {
		font-size: 13px;
		color: #dc2626;
		font-weight: 500;
	}

	.no-print {
		display: block;
	}

	.close-button-container {
		text-align: center;
		margin-top: 40px;
		padding-bottom: 40px;
	}

	.close-button {
		padding: 12px 32px;
		background: #4f46e5;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.close-button:hover {
		background: #4338ca;
	}

	/* Estilos para impresión */
	@media print {
		.print-container {
			padding: 0;
			max-width: 100%;
		}

		.no-print {
			display: none !important;
		}

		.print-header {
			display: none !important;
		}

		.ticket-page {
			margin-bottom: 0;
		}

		.page-break {
			page-break-after: always;
		}

		.ticket-card {
			border: 2px solid #000;
		}
	}
</style>
