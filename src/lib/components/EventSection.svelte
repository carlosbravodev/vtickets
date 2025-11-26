<script lang="ts">
  import EventSkeleton from "./EventSkeleton.svelte";

  interface Event {
    id: string;
    title: string;
    description: string;
    event_date: string;
    venue?: string;
    location: string;
    image_url: string;
    slug: string;
    created_at: string;
    min_price?: number;
  }

  interface Props {
    title: string;
    events: Event[];
    maxCards?: number;
    isLoading?: boolean;
  }

  let { title, events, maxCards = 10, isLoading = false }: Props = $props();

  let scrollContainer: HTMLDivElement;

  // Ordenar eventos por fecha del evento (más próximos primero)
  let sortedEvents = $derived(
    [...events].sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  );

  // Limitar el número de eventos a mostrar
  let displayEvents = $derived(sortedEvents.slice(0, maxCards));

  // Funciones de scroll
  function scrollLeft() {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -340, behavior: "smooth" });
    }
  }

  function scrollRight() {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 340, behavior: "smooth" });
    }
  }
</script>

<section class="event-section">
  <div class="container">
    <div class="header-wrapper">
      <h2 class="section-title">{title}</h2>

      <div class="scroll-buttons">
        <button
          onclick={scrollLeft}
          class="scroll-btn scroll-btn-left"
          aria-label="Scroll izquierda"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          onclick={scrollRight}
          class="scroll-btn scroll-btn-right"
          aria-label="Scroll derecha"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <div class="events-grid" bind:this={scrollContainer}>
      {#if isLoading}
        {#each Array(Math.min(5, maxCards)) as _, i (i)}
          <EventSkeleton />
        {/each}
      {:else}
        {#each displayEvents as event (event.id)}
          <article class="event-card">
            <!-- Imagen del evento -->
            <a href={`/evento/${event.slug}`} class="event-image-link">
              <div class="event-image-wrapper">
                <img
                  src={event.image_url}
                  alt={event.title}
                  class="event-image"
                />
                <div class="event-overlay"></div>
              </div>
            </a>

            <!-- Contenido del evento -->
            <div class="event-content">
              <a href={`/evento/${event.slug}`} class="event-title-link">
                <h3 class="event-title">{event.title}</h3>
              </a>

              <p class="event-description">
                {event.description.length > 120
                  ? event.description.slice(0, 120) + "..."
                  : event.description}
              </p>

              <div class="event-meta">
                <div class="event-meta-item">
                  <svg
                    class="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span
                    >{new Date(event.event_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}</span
                  >
                </div>

                <div class="event-meta-item">
                  <svg
                    class="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    ></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>
                    {#if event.venue}
                      {event.venue}{event.location ? `, ${event.location}` : ""}
                    {:else}
                      {event.location || "Ubicación por definir"}
                    {/if}
                  </span>
                </div>
              </div>

              <div class="event-footer">
                <div class="event-price">
                  <span class="price-label">Desde</span>
                  <span class="price-amount"
                    >${(event.min_price || 0).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>

                <a href={`/evento/${event.slug}`} class="event-button">
                  Comprar entradas
                </a>
              </div>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>
</section>

<style>
  .event-section {
    padding: 2rem 0;
    background: white;
  }

  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.5rem;
    position: relative;
  }

  .container::after {
    content: "";
    position: absolute;
    top: 70px;
    right: 0;
    width: 100px;
    height: calc(100% - 70px);
    background: linear-gradient(
      to left,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 767px) {
    .container::after {
      display: none;
    }
  }

  .header-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: clamp(1.75rem, 4vw, 3rem);
    font-weight: 900;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .scroll-buttons {
    display: none;
    gap: 0.75rem;
  }

  .scroll-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1.5px solid #222;
    background: white;
    color: #000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .scroll-btn svg {
    width: 20px;
    height: 20px;
    stroke-width: 2.5;
  }

  .scroll-btn:hover {
    background: #000;
    color: white;
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.08);
  }

  .scroll-btn:active {
    transform: scale(0.92);
  }

  @media (min-width: 768px) {
    .scroll-buttons {
      display: flex;
    }
  }

  .events-grid {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding-bottom: 1.5rem;
    margin: 0 -1.5rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    /* Ocultar scrollbar en Chrome, Safari y Opera */
    -ms-overflow-style: none; /* IE y Edge */
    scrollbar-width: none; /* Firefox */
  }

  .events-grid::-webkit-scrollbar {
    display: none; /* Chrome, Safari y Opera */
  }

  .event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    max-width: 300px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 640px) {
    .event-card {
      min-width: 340px;
      max-width: 340px;
    }
  }

  .event-card:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .event-image-link {
    display: block;
    text-decoration: none;
  }

  .event-image-wrapper {
    position: relative;
    width: calc(100% - 24px);
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 12px;
    margin: 12px 12px 0 12px;
  }

  .event-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .event-card:hover .event-image {
    transform: scale(1.05);
  }

  .event-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.1) 100%
    );
    pointer-events: none;
  }

  .event-content {
    padding: 1rem 1.25rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
  }

  .event-title-link {
    text-decoration: none;
    color: inherit;
  }

  .event-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #000000;
    margin-bottom: 0.5rem;
    line-height: 1.35;
    transition: color 0.2s ease;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    letter-spacing: -0.015em;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-title-link:hover .event-title {
    color: #000000;
  }

  .event-description {
    font-size: 0.8125rem;
    color: #737373;
    margin-bottom: 0.5rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .event-meta {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 1rem;
  }

  .event-meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: black;
    font-weight: 500;
  }

  .icon {
    color: black;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  .event-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 0.75rem;
    gap: 0.75rem;
  }

  .event-price {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .price-label {
    font-size: 0.6875rem;
    font-weight: 500;
    color: #737373;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .price-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #737373;
    letter-spacing: -0.03em;
  }

  .event-button {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: white;
    background: #4f39f6;
    border-radius: 8px;
    letter-spacing: 0.01em;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .event-button:hover {
    background: #000000;
    color: #ffffff;
    transform: translateY(-1px);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .event-section {
      padding: 3rem 0;
    }

    .section-title {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .events-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .event-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .event-button {
      width: 100%;
      text-align: center;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .events-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
