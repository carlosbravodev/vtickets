<script lang="ts">
  import { untrack } from "svelte";

  // Estado reactivo para el slider
  let currentIndex = $state(0);
  let isTransitioning = $state(false);

  // Slides con contenido individual
  const slides = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80",
      alt: "Conciertos y Festivales",
      title: "Vive la Música en Vivo",
      subtitle: "Los mejores conciertos y festivales están aquí",
      buttonText: "Ver Conciertos",
      buttonLink: "/eventos?categoria=musica",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80",
      alt: "Eventos Corporativos",
      title: "Conferencias y Networking",
      subtitle: "Conecta con profesionales de tu industria",
      buttonText: "Ver Conferencias",
      buttonLink: "/eventos?categoria=conferencias",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80",
      alt: "Eventos Deportivos",
      title: "Deporte y Emoción",
      subtitle: "No te pierdas los eventos deportivos más importantes",
      buttonText: "Ver Deportes",
      buttonLink: "/eventos?categoria=deportes",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920&q=80",
      alt: "Arte y Cultura",
      title: "Cultura y Entretenimiento",
      subtitle: "Descubre exposiciones, teatro y mucho más",
      buttonText: "Ver Eventos",
      buttonLink: "/eventos",
    },
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
        class:prev={index ===
          (currentIndex - 1 + slides.length) % slides.length}
        class:next={index === (currentIndex + 1) % slides.length}
      >
        <img src={slide.image} alt={slide.alt} />
        <div class="overlay"></div>

        <!-- Contenido individual de cada slide -->
        <div class="hero-content">
          <h1 class="hero-title">{slide.title}</h1>
          <p class="hero-subtitle">{slide.subtitle}</p>
          <a
            href={slide.buttonLink}
            class="hero-cta"
            data-sveltekit-preload-data
          >
            {slide.buttonText}
          </a>
        </div>
      </div>
    {/each}

    <!-- Progress vertical a la derecha -->
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
              style="height: {index < currentIndex
                ? '100%'
                : index === currentIndex
                  ? `${100 - progress}%`
                  : '100%'}; top: {index < currentIndex
                ? '0'
                : index === currentIndex
                  ? `${progress}%`
                  : '0'}"
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
    height: calc(100vh - 72px);
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
    transform: scale(1.05);
    transition:
      opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
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
    transform: translateY(30px);
    transition:
      opacity 0.6s ease 0.2s,
      transform 0.6s ease 0.2s;
  }

  .slide.active .hero-content {
    opacity: 1;
    transform: translateY(0);
  }

  .slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  /* Overlay degradado negro desde abajo */
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.85) 20%,
      rgba(0, 0, 0, 0.65) 40%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0) 80%
    );
    z-index: 1;
  }

  /* Contenido posicionado abajo-izquierda */
  .hero-content {
    position: absolute;
    bottom: 3rem;
    left: 3rem;
    text-align: left;
    color: white;
    z-index: 5;
    max-width: 1200px;
  }

  .slide.active .hero-content {
    z-index: 10;
  }

  /* Título con letter-spacing reducido */
  .hero-title {
    font-size: clamp(2.25rem, 6vw, 5.5rem);
    font-weight: 900;
    margin-bottom: 0.75rem;
    text-shadow: 2px 4px 12px rgba(0, 0, 0, 0.4);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .hero-subtitle {
    font-size: clamp(1.125rem, 2.2vw, 1.75rem);
    font-weight: 400;
    margin-bottom: 1.25rem;
    text-shadow: 1px 2px 8px rgba(0, 0, 0, 0.3);
    opacity: 0.95;
    letter-spacing: -0.01em;
    line-height: 1.4;
  }

  /* Botón minimalista - ghost style más pequeño */
  .hero-cta {
    display: inline-block;
    padding: 0.625rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: white;
    background: transparent;
    border: 2px solid white;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s ease;
    letter-spacing: 0.02em;
    backdrop-filter: blur(4px);
  }

  .hero-cta:hover {
    background: white;
    color: oklch(51.1% 0.262 276.966); /* buyer-600 */
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
  }

  /* Progress bars verticales a la derecha - más pequeñas */
  .progress-bars-container {
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 10;
  }

  .progress-bar-wrapper {
    width: 2.5px;
    height: 45px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    position: relative;
    transition: all 0.3s ease;
  }

  .progress-bar-wrapper:hover {
    transform: scaleX(1.6);
  }

  .progress-bar-bg {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar-fill {
    width: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    transition: none;
    position: absolute;
  }

  .progress-bar-fill.animating {
    transition: all 0.05s linear;
  }

  .progress-bar-wrapper.completed .progress-bar-fill {
    height: 100% !important;
  }

  .progress-bar-wrapper.active .progress-bar-bg {
    background: rgba(255, 255, 255, 0.3);
  }

  .progress-bar-wrapper.active .progress-bar-fill {
    background: white;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      height: 60vh;
      min-height: 400px;
    }

    .hero-content {
      bottom: 1.5rem;
      left: 1.25rem;
      right: 1.25rem;
      max-width: none;
    }

    .hero-title {
      margin-bottom: 0.5rem;
    }

    .hero-subtitle {
      margin-bottom: 1rem;
    }

    .hero-cta {
      padding: 0.5rem 1.25rem;
      font-size: 0.9375rem;
    }

    .progress-bars-container {
      right: 1rem;
      gap: 0.375rem;
    }

    .progress-bar-wrapper {
      width: 2px;
      height: 35px;
    }
  }
</style>
