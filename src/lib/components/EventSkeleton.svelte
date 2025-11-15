<script lang="ts">
	// Componente Skeleton para cards de eventos
	// Coincide exactamente con el diseño de EventSection
</script>

<div class="event-skeleton">
	<!-- Imagen skeleton con shimmer -->
	<div class="skeleton-image"></div>
	
	<!-- Contenido -->
	<div class="skeleton-content">
		<!-- Título -->
		<div class="skeleton-title"></div>
		
		<!-- Meta información (fecha y ubicación) -->
		<div class="skeleton-meta">
			<div class="skeleton-meta-item"></div>
			<div class="skeleton-meta-item"></div>
		</div>
		
		<!-- Descripción -->
		<div class="skeleton-description">
			<div class="skeleton-desc-line"></div>
			<div class="skeleton-desc-line short"></div>
		</div>
		
		<!-- Footer con precio y botón -->
		<div class="skeleton-footer">
			<div class="skeleton-price"></div>
			<div class="skeleton-button"></div>
		</div>
	</div>
</div>

<style>
	.event-skeleton {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		min-width: 280px;
		max-width: 280px;
		flex-shrink: 0;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@media (min-width: 640px) {
		.event-skeleton {
			min-width: 320px;
			max-width: 320px;
		}
	}

	.skeleton-image {
		position: relative;
		width: 100%;
		height: 200px;
		background: linear-gradient(
			90deg,
			#e5e7eb 0%,
			#f3f4f6 50%,
			#e5e7eb 100%
		);
		background-size: 200% 100%;
		animation: shimmer 2s infinite linear;
	}

	.skeleton-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.75rem;
	}

	.skeleton-title {
		height: 1.625rem; /* ~26px para coincidir con font-size 1.25rem */
		background-color: #e5e7eb;
		border-radius: 4px;
		width: 75%;
	}

	.skeleton-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.skeleton-meta-item {
		height: 0.875rem; /* 14px para coincidir con font-size 0.875rem */
		background-color: #e5e7eb;
		border-radius: 4px;
		width: 60%;
	}

	.skeleton-meta-item:last-child {
		width: 70%;
	}

	.skeleton-description {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.skeleton-desc-line {
		height: 0.75rem; /* 12px */
		background-color: #e5e7eb;
		border-radius: 4px;
		width: 100%;
	}

	.skeleton-desc-line.short {
		width: 85%;
	}

	.skeleton-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
		padding-top: 1rem;
	}

	.skeleton-price {
		height: 1.5rem; /* 24px */
		background-color: #e5e7eb;
		border-radius: 4px;
		width: 80px;
	}

	.skeleton-button {
		height: 2.5rem; /* 40px para coincidir con botones */
		background-color: #e5e7eb;
		border-radius: 8px;
		width: 120px;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}
</style>

