<script lang="ts">
	import { untrack } from 'svelte';

	// Estado reactivo para el slider
	let currentIndex = $state(0);
	let isTransitioning = $state(false);
	
	// Slides con contenido individual
	const slides = [
		{
			id: 1,
			image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80',
			alt: 'Conciertos y Festivales',
			title: 'Vive la Música en Vivo',
			subtitle: 'Los mejores conciertos y festivales están aquí',
			buttonText: 'Ver Conciertos',
			buttonLink: '/eventos?categoria=musica'
		},
		{
			id: 2,
			image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
			alt: 'Eventos Corporativos',
			title: 'Conferencias y Networking',
			subtitle: 'Conecta con profesionales de tu industria',
			buttonText: 'Ver Conferencias',
			buttonLink: '/eventos?categoria=conferencias'
		},
		{
			id: 3,
			image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80',
			alt: 'Eventos Deportivos',
			title: 'Deporte y Emoción',
			subtitle: 'No te pierdas los eventos deportivos más importantes',
			buttonText: 'Ver Deportes',
			buttonLink: '/eventos?categoria=deportes'
		},
		{
			id: 4,
			image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920&q=80',
			alt: 'Arte y Cultura',
			title: 'Cultura y Entretenimiento',
			subtitle: 'Descubre exposiciones, teatro y mucho más',
			buttonText: 'Ver Eventos',
			buttonLink: '/eventos'
		}
	];

	// Progreso de la animación (0-100) - usando un objeto para evitar el warning
	let progressState = $state({ value: 0 });
	let progress = $derived(progressState.value);

	// Función para cambiar a la siguiente imagen
	function nextSlide() {
		if (isTransitioning) return;
		isTransitioning = true;
		currentIndex = (currentIndex + 1) % slides.length;
		setTimeout(() => {
			isTransitioning = false;
		}, 800);
	}

	// Función para cambiar a la imagen anterior
	function prevSlide() {
		if (isTransitioning) return;
		isTransitioning = true;
		currentIndex = (currentIndex - 1 + slides.length) % slides.length;
		setTimeout(() => {
			isTransitioning = false;
		}, 800);
	}

	// Función para ir a una imagen específica
	function goToSlide(index: number) {
		if (isTransitioning || index === currentIndex) return;
		isTransitioning = true;
		currentIndex = index;
		setTimeout(() => {
			isTransitioning = false;
		}, 800);
	}

	// Efecto para la barra de progreso - se reinicia cada vez que cambia currentIndex
	$effect(() => {
		// Esta línea hace que el efecto se reactive cuando cambia currentIndex
		currentIndex;
		
		// Reset del progreso
		progressState.value = 0;
		
		const duration = 5000;
		const interval = 50;
		const increment = (interval / duration) * 100;

		// Interval para el progreso
		const progressInterval = setInterval(() => {
			if (progressState.value < 100) {
				progressState.value += increment;
			}
		}, interval);

		// Interval para el autoplay
		const autoplayInterval = setInterval(() => {
			nextSlide();
		}, duration);

		return () => {
			clearInterval(progressInterval);
			clearInterval(autoplayInterval);
		};
	});
</script>

<section class="hero">
	<!-- Contenedor del slider -->
	<div class="slider-container">
		<!-- Slides con imágenes y contenido -->
		{#each slides as slide, index (slide.id)}
			<div
				class="slide"
				class:active={index === currentIndex}
				class:prev={index === (currentIndex - 1 + slides.length) % slides.length}
				class:next={index === (currentIndex + 1) % slides.length}
			>
				<img src={slide.image} alt={slide.alt} />
				<div class="overlay"></div>
				
				<!-- Contenido individual de cada slide -->
				<div class="hero-content">
					<h1 class="hero-title">{slide.title}</h1>
					<p class="hero-subtitle">{slide.subtitle}</p>
					<a href={slide.buttonLink} class="hero-cta" data-sveltekit-preload-data>
						{slide.buttonText}
					</a>
				</div>
			</div>
		{/each}

		<!-- Controles de navegación -->
		<button class="nav-button prev" onclick={prevSlide} aria-label="Anterior">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>
		
		<button class="nav-button next" onclick={nextSlide} aria-label="Siguiente">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>

		<!-- Indicadores de líneas -->
		<div class="progress-bars-container">
			{#each slides as slide, index (slide.id)}
				<button
					class="progress-bar-wrapper"
					class:active={index === currentIndex}
					class:completed={index < currentIndex}
					onclick={() => goToSlide(index)}
					aria-label={`Ir a slide ${index + 1}: ${slide.title}`}
				>
					<div class="progress-bar-bg">
						<div 
							class="progress-bar-fill"
							class:animating={index === currentIndex}
							style="width: {index < currentIndex ? '100%' : (index === currentIndex ? `${progress}%` : '0%')}"
						></div>
					</div>
				</button>
			{/each}
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		width: 100%;
		height: 70vh;
		min-height: 500px;
		overflow: hidden;
	}

	.slider-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transform: scale(1.1);
		transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
		            transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	.slide.active {
		opacity: 1;
		transform: scale(1);
		pointer-events: auto;
		z-index: 2;
	}

	.slide .hero-content {
		opacity: 0;
		transform: translate(-50%, calc(-50% + 30px));
		transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
	}

	.slide.active .hero-content {
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	.slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 100%
		);
		z-index: 1;
	}

	.hero-content {
		position: absolute;
		top: 50%;
		left: 50%;
		text-align: center;
		color: white;
		z-index: 5;
		width: 90%;
		max-width: 800px;
		padding: 2rem;
		/* El transform se aplica en .slide .hero-content */
	}

	.slide.active .hero-content {
		z-index: 10;
	}

	.hero-title {
		font-size: clamp(2rem, 5vw, 4rem);
		font-weight: 900; /* Roboto Black */
		margin-bottom: 1rem;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.hero-subtitle {
		font-size: clamp(1rem, 2vw, 1.5rem);
		font-weight: 400; /* Roboto Regular */
		margin-bottom: 2rem;
		text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
		opacity: 0.95;
		letter-spacing: 0.01em;
	}

	.hero-cta {
		display: inline-block;
		padding: 1rem 2.5rem;
		font-size: 1.125rem;
		font-weight: 700; /* Roboto Bold */
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50px;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
		letter-spacing: 0.02em;
	}

	.hero-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
	}

	/* Botones de navegación */
	.nav-button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		z-index: 10;
		opacity: 0;
	}

	.slider-container:hover .nav-button {
		opacity: 1;
	}

	.nav-button:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-50%) scale(1.1);
	}

	.nav-button.prev {
		left: 2rem;
	}

	.nav-button.next {
		right: 2rem;
	}

	/* Indicadores de líneas de progreso */
	.progress-bars-container {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.375rem;
		z-index: 10;
		width: 80%;
		max-width: 500px;
	}

	.progress-bar-wrapper {
		flex: 1;
		height: 3px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		position: relative;
		transition: all 0.3s ease;
	}

	.progress-bar-wrapper:hover {
		transform: scaleY(1.4);
	}

	.progress-bar-bg {
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.25);
		border-radius: 3px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar-fill {
		height: 100%;
		background: white;
		border-radius: 3px;
		box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
		transition: none;
	}

	.progress-bar-fill.animating {
		transition: width 0.05s linear;
	}

	.progress-bar-wrapper.completed .progress-bar-fill {
		width: 100% !important;
	}

	.progress-bar-wrapper.active .progress-bar-bg {
		background: rgba(255, 255, 255, 0.35);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero {
			height: 60vh;
			min-height: 400px;
		}

		.nav-button {
			width: 40px;
			height: 40px;
			opacity: 1;
		}

		.nav-button.prev {
			left: 1rem;
		}

		.nav-button.next {
			right: 1rem;
		}

		.hero-content {
			padding: 1rem;
		}

		.progress-bars-container {
			bottom: 1rem;
			width: 90%;
			gap: 0.25rem;
		}

		.progress-bar-wrapper {
			height: 2.5px;
		}
	}
</style>
