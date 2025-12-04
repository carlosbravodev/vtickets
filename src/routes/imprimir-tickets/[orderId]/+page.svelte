<script lang="ts">
	import { onMount } from 'svelte';
	import { optimizeSupabaseImage } from '$lib/utils/image';
	import { Calendar, MapPin, QrCode, CheckCircle2, AlertCircle } from 'lucide-svelte';
	
	let { data } = $props();
	let qrImages: Record<string, string> = {};
	
	const formatDate = (dateString: string) => {
		if (!dateString) return 'Fecha por confirmar';
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};
	
	// Generar URLs de QR para cada ticket
	const generateQrUrl = (token: string) => {
		return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`;
	};
	
	// Auto-abrir diálogo de impresión cuando la página carga
	onMount(() => {
		// Esperar un momento para que se renderice todo
		setTimeout(() => {
			window.print();
		}, 800);
	});
</script>

<svelte:head>
	<title>Imprimir Tickets - {data.event.title}</title>
</svelte:head>

<div class="print-container">
	<!-- Tickets - each on its own page -->
	{#each data.tickets as ticket, index}
		<div class="ticket-page">
			<div class="ticket-card">
				<!-- Header section -->
				<div class="ticket-header">
					<div class="header-content">
						<div class="header-left">
							<div class="badge">
								<CheckCircle2 class="w-4 h-4" />
								<span>CONFIRMADO</span>
							</div>
							<div class="ticket-number">Entrada {index + 1} de {data.tickets.length}</div>
						</div>
						<div class="order-number">Orden #{data.order.order_number || data.order.lemon_squeezy_order_id}</div>
					</div>
				</div>

				<!-- Main content area -->
				<div class="ticket-content">
					<!-- Left side: Event info -->
					<div class="content-left">
						<!-- Event Banner - 16:9 ratio -->
						{#if data.event.image_url}
							<div class="event-banner">
								<img 
									src={optimizeSupabaseImage(data.event.image_url, { width: 600, height: 337 })} 
									alt={data.event.title}
									loading="eager"
								/>
							</div>
						{:else}
							<div class="event-banner-placeholder">
								<div class="placeholder-content">{data.event.title}</div>
							</div>
						{/if}

						<!-- Event Details -->
						<div class="event-info">
							<div class="event-title">{data.event.title}</div>
							
							{#if data.event.event_date}
								<div class="info-row">
									<Calendar class="w-4 h-4" />
									<span>{formatDate(data.event.event_date)}</span>
								</div>
							{/if}
							
							{#if data.event.location || data.event.venue}
								<div class="info-row">
									<MapPin class="w-4 h-4" />
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

						<!-- Holder Info -->
						<div class="holder-section">
							<div class="section-label">TITULAR</div>
							<div class="holder-data">
								<div class="data-row">
									<span class="data-label">Nombre:</span>
									<span class="data-value">{ticket.holder_name || 'N/A'}</span>
								</div>
								<div class="data-row">
									<span class="data-label">Email:</span>
									<span class="data-value">{ticket.holder_email || 'N/A'}</span>
								</div>
								<div class="data-row">
									<span class="data-label">Tipo:</span>
									<span class="data-value ticket-type">{ticket.ticket_type.name}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Right side: QR Code -->
					<div class="content-right">
						<div class="qr-section">
							<div class="qr-label">CÓDIGO QR</div>
							<div class="qr-box">
								<img 
									src={generateQrUrl(ticket.qr_token)}
									alt="QR Code"
									class="qr-image"
									loading="eager"
								/>
							</div>
							<div class="ticket-code">
								<div class="code-label">Código</div>
								<div class="code-value">{ticket.ticket_code}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="ticket-footer">
					<AlertCircle class="w-4 h-4" />
					<span>Código QR único e intransferible</span>
				</div>
			</div>
		</div>
	{/each}

	<!-- Close button -->
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
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
	}

	.ticket-page {
		margin-bottom: 40px;
	}

	.ticket-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		height: auto;
	}

	/* HEADER */
	.ticket-header {
		background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
		color: white;
		padding: 16px 20px;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.2);
		padding: 4px 10px;
		border-radius: 16px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		backdrop-filter: blur(10px);
	}

	.ticket-number {
		font-size: 12px;
		font-weight: 600;
		opacity: 0.9;
	}

	.order-number {
		font-size: 13px;
		font-weight: 600;
	}

	/* CONTENT LAYOUT */
	.ticket-content {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 20px;
		padding: 20px;
		align-items: flex-start;
	}

	.content-left {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.content-right {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* EVENT BANNER - 16:9 */
	.event-banner {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 8px;
		background: #f3f4f6;
	}

	.event-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.event-banner-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
	}

	.placeholder-content {
		font-size: 14px;
		font-weight: 600;
		color: #4f46e5;
		text-align: center;
		padding: 20px;
	}

	/* EVENT INFO */
	.event-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.event-title {
		font-size: 16px;
		font-weight: 700;
		color: #1f2937;
		line-height: 1.3;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #4b5563;
	}

	.info-row :global(svg) {
		color: #4f46e5;
		flex-shrink: 0;
	}

	/* HOLDER SECTION */
	.holder-section {
		padding: 14px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.section-label {
		font-size: 11px;
		font-weight: 700;
		color: #4f46e5;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin-bottom: 10px;
		display: block;
	}

	.holder-data {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.data-row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-size: 12px;
	}

	.data-label {
		font-weight: 600;
		color: #6b7280;
		min-width: 60px;
	}

	.data-value {
		color: #1f2937;
		font-weight: 500;
		text-align: right;
	}

	.ticket-type {
		display: inline-block;
		padding: 2px 8px;
		background: #dbeafe;
		color: #1e40af;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 600;
	}

	/* QR SECTION */
	.qr-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: center;
		padding: 14px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.qr-label {
		font-size: 11px;
		font-weight: 700;
		color: #4f46e5;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	.qr-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 200px;
		height: 200px;
		background: white;
		border: 2px solid #4f46e5;
		border-radius: 6px;
		padding: 8px;
	}

	.qr-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		image-rendering: crisp-edges;
	}

	.ticket-code {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 100%;
	}

	.code-label {
		font-size: 10px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.code-value {
		font-size: 14px;
		font-weight: 900;
		color: #1f2937;
		font-family: 'Courier New', monospace;
		letter-spacing: 2px;
	}

	/* FOOTER */
	.ticket-footer {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 20px;
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-top: 1px solid #fcd34d;
		font-size: 12px;
		color: #92400e;
		font-weight: 500;
	}

	.ticket-footer :global(svg) {
		color: #d97706;
		flex-shrink: 0;
		width: 16px;
		height: 16px;
	}

	/* BUTTONS */
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

	/* PRINT STYLES */
	@media print {
		:global(body) {
			background: white;
			margin: 0;
			padding: 0;
		}

		.print-container {
			padding: 0;
			margin: 0;
			max-width: 100%;
		}

		.ticket-page {
			page-break-inside: avoid;
			margin-bottom: 0;
		}

		.no-print {
			display: none !important;
		}

		.ticket-card {
			box-shadow: none;
			border: 1px solid #ccc;
			margin: 0;
		}

		.ticket-content {
			grid-template-columns: 1fr 260px;
			padding: 16px;
			gap: 16px;
		}

		/* Optimize for printing */
		.event-banner img {
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		.qr-image {
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}

	/* RESPONSIVE for screen view */
	@media screen and (max-width: 768px) {
		.ticket-content {
			grid-template-columns: 1fr;
		}

		.content-right {
			grid-column: 1;
		}
	}
</style>
