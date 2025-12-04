<script lang="ts">
	import { onMount } from 'svelte';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { Calendar, MapPin, QrCode, CheckCircle2 } from 'lucide-svelte';
	
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
	<!-- Tickets - each on its own page -->
	{#each data.tickets as ticket, index}
		<div class="ticket-page" class:page-break={index < data.tickets.length - 1}>
			<div class="ticket-card">
				<!-- Header section with branding -->
				<div class="ticket-header">
					<div class="header-top">
						<div class="brand-badge">
							<CheckCircle2 class="w-5 h-5" />
							<span>ENTRADA CONFIRMADA</span>
						</div>
						<div class="order-info">
							<span class="order-label">Orden #{data.order.order_number || data.order.lemon_squeezy_order_id}</span>
							<span class="ticket-counter">Entrada {index + 1} de {data.tickets.length}</span>
						</div>
					</div>

					<!-- Event banner -->
					{#if data.event.image_url}
						<div class="event-banner">
							<img 
								src={optimizeSupabaseImage(data.event.image_url, { width: 800, height: 400 })} 
								alt={data.event.title}
							/>
							<div class="banner-overlay"></div>
							<div class="banner-content">
								<h1>{data.event.title}</h1>
							</div>
						</div>
					{/if}
				</div>

				<!-- Event details -->
				<div class="event-section">
					<div class="event-details">
						{#if data.event.event_date}
							<div class="detail-item">
								<div class="detail-icon">
									<Calendar class="w-5 h-5" />
								</div>
								<div class="detail-content">
									<div class="detail-label">Fecha y Hora</div>
									<div class="detail-value">{formatDate(data.event.event_date)}</div>
								</div>
							</div>
						{/if}
						
						{#if data.event.location || data.event.venue}
							<div class="detail-item">
								<div class="detail-icon">
									<MapPin class="w-5 h-5" />
								</div>
								<div class="detail-content">
									<div class="detail-label">Ubicación</div>
									<div class="detail-value">
										{#if data.event.venue}
											{data.event.venue}{data.event.location ? `, ${data.event.location}` : ''}
										{:else}
											{data.event.location}
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Holder information -->
				<div class="holder-section">
					<h2 class="section-title">Información del Titular</h2>
					<div class="holder-details">
						<div class="holder-item">
							<span class="holder-label">Nombre Completo</span>
							<span class="holder-value">{ticket.holder_name || 'No especificado'}</span>
						</div>
						<div class="holder-item">
							<span class="holder-label">Correo Electrónico</span>
							<span class="holder-value">{ticket.holder_email || 'No especificado'}</span>
						</div>
						<div class="holder-item">
							<span class="holder-label">Tipo de Entrada</span>
							<span class="holder-value ticket-type">{ticket.ticket_type.name}</span>
						</div>
					</div>
				</div>

				<!-- QR Code section -->
				<div class="qr-section">
					<div class="qr-header">
						<QrCode class="w-6 h-6" />
						<h2>Código QR de Entrada</h2>
					</div>
					<div class="qr-container">
						<img 
							src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={encodeURIComponent(ticket.qr_token)}"
							alt="QR Code"
							class="qr-code"
						/>
					</div>
					<div class="ticket-code">
						<div class="code-label">Código del Ticket</div>
						<div class="code-value">{ticket.ticket_code}</div>
					</div>
				</div>

				<!-- Footer with warning -->
				<div class="ticket-footer">
					<div class="footer-content">
						<svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						<p>Este código QR es único e intransferible. No lo compartas con nadie. ¡Disfruta tu evento!</p>
					</div>
				</div>
			</div>
		</div>
	{/each}

	<!-- Close button (only visible on screen) -->
	<div class="no-print close-button-container">
		<button onclick={() => window.close()} class="close-button">
			← Cerrar
		</button>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #f3f4f6;
	}

	.print-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px;
	}

	.ticket-page {
		margin-bottom: 40px;
	}

	.page-break {
		page-break-after: always;
	}

	.ticket-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	/* Header Section */
	.ticket-header {
		background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
		color: white;
		padding: 20px 24px;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 12px;
	}

	.brand-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.2);
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		backdrop-filter: blur(10px);
	}

	.order-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		font-size: 13px;
	}

	.order-label {
		font-weight: 600;
		opacity: 0.95;
	}

	.ticket-counter {
		font-size: 11px;
		opacity: 0.8;
	}

	/* Event Banner */
	.event-banner {
		position: relative;
		width: 100%;
		height: 280px;
		overflow: hidden;
		border-radius: 8px;
		margin-top: 16px;
	}

	.event-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.banner-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
	}

	.banner-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20px 24px;
		color: white;
	}

	.banner-content h1 {
		font-size: 28px;
		font-weight: 900;
		margin: 0;
		line-height: 1.2;
	}

	/* Event Section */
	.event-section {
		border-top: 2px dashed #e5e7eb;
		border-bottom: 2px dashed #e5e7eb;
	}

	.event-details {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.detail-item {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.detail-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: #f0f4ff;
		border-radius: 8px;
		color: #4f46e5;
		flex-shrink: 0;
	}

	.detail-content {
		flex: 1;
	}

	.detail-label {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.detail-value {
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
	}

	/* Holder Section */
	.holder-section {
		padding: 24px;
		background: #f9fafb;
		border-bottom: 2px dashed #e5e7eb;
	}

	.section-title {
		font-size: 14px;
		font-weight: 700;
		color: #4f46e5;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0 0 16px 0;
	}

	.holder-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.holder-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.holder-label {
		font-size: 13px;
		font-weight: 500;
		color: #6b7280;
	}

	.holder-value {
		font-size: 14px;
		font-weight: 600;
		color: #1f2937;
	}

	.ticket-type {
		display: inline-block;
		padding: 4px 12px;
		background: #dbeafe;
		color: #1e40af;
		border-radius: 20px;
		font-size: 12px;
	}

	/* QR Section */
	.qr-section {
		padding: 32px 24px;
		background: #ffffff;
		border-bottom: 2px dashed #e5e7eb;
		text-align: center;
	}

	.qr-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-bottom: 20px;
		color: #4f46e5;
	}

	.qr-header h2 {
		font-size: 16px;
		font-weight: 700;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.qr-container {
		display: flex;
		justify-content: center;
		margin-bottom: 24px;
		padding: 12px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.qr-code {
		width: 280px;
		height: 280px;
		border: 3px solid #4f46e5;
		border-radius: 4px;
		image-rendering: crisp-edges;
	}

	.ticket-code {
		background: #f3f4f6;
		padding: 16px;
		border-radius: 8px;
	}

	.code-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
	}

	.code-value {
		display: block;
		font-size: 22px;
		font-weight: 900;
		color: #1f2937;
		font-family: 'Courier New', monospace;
		letter-spacing: 3px;
		word-spacing: 8px;
	}

	/* Footer Section */
	.ticket-footer {
		padding: 16px 24px;
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-top: 1px solid #fcd34d;
	}

	.footer-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.warning-icon {
		width: 20px;
		height: 20px;
		color: #d97706;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.footer-content p {
		margin: 0;
		font-size: 13px;
		color: #92400e;
		line-height: 1.5;
		font-weight: 500;
	}

	/* Close Button (Screen only) */
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
		background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
	}

	.close-button:hover {
		background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
		box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
		transform: translateY(-2px);
	}

	/* Print styles */
	@media print {
		:global(body) {
			background: white;
		}

		.print-container {
			padding: 0;
			max-width: 100%;
		}

		.no-print {
			display: none !important;
		}

		.ticket-page {
			margin-bottom: 0;
			page-break-inside: avoid;
		}

		.page-break {
			page-break-after: always;
		}

		.ticket-card {
			box-shadow: none;
			border: 1px solid #000;
			page-break-inside: avoid;
		}

		/* Optimize colors for printing */
		.ticket-header {
			background: #1f2937 !important;
			color: white !important;
		}

		.event-section {
			border-color: #000 !important;
		}

		.ticket-footer {
			background: #fef3c7 !important;
			border-color: #000 !important;
		}
	}
</style>
