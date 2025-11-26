<script lang="ts">
  import { optimizeSupabaseImage } from "$lib/utils/image";
  import { fade, fly } from "svelte/transition";

  let { data } = $props();

  // Ordenar eventos por fecha del evento (más próximos primero)
  let sortedEvents = $derived(
    [...data.events].sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  );

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return date.toLocaleDateString("es-ES", options);
  }
</script>

<section class="bg-white">
  <div class="py-8 px-4 mx-auto max-w-7xl lg:py-16 lg:px-6">
    <div class="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8">
      <h2
        class="mb-4 text-3xl lg:text-5xl tracking-tight font-black text-gray-900"
        style="letter-spacing: -0.02em;"
      >
        Nuestros Eventos
      </h2>
      <p class="font-normal text-gray-600 sm:text-lg">
        Descubre los mejores eventos y compra tus entradas. ¡No te quedes fuera!
      </p>
    </div>
    <div class="grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
      {#if data.error}
        <p class="text-red-500">Error: {data.error}</p>
      {:else if sortedEvents.length > 0}
        {#each sortedEvents as event, i (event.id)}
          <article
            in:fly={{ y: 50, duration: 400, delay: i * 100 }}
            class="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-black/6"
          >
            <!-- Imagen con ratio 3:4 -->
            <a
              href={`/evento/${event.slug}`}
              class="relative overflow-hidden block"
            >
              <div
                class="w-full aspect-4/3 overflow-hidden rounded-xl m-3"
                style="width: calc(100% - 24px);"
              >
                <img
                  class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  src={optimizeSupabaseImage(event.image_url, {
                    width: 600,
                    quality: 85,
                  })}
                  alt={event.title || "Evento"}
                  loading="lazy"
                />
              </div>
            </a>

            <!-- Contenido -->
            <div class="px-5 pb-5 flex flex-col grow" style="gap: 0.5rem;">
              <!-- Título -->
              <a href={`/evento/${event.slug}`} class="group/title">
                <h3
                  class="text-lg font-bold text-black mb-2 line-clamp-2 group-hover/title:text-black transition-colors duration-200"
                  style="letter-spacing: -0.015em; line-height: 1.35;"
                >
                  {event.title}
                </h3>
              </a>

              <!-- Descripción -->
              <p
                class="text-sm text-gray-500 mb-2 line-clamp-2"
                style="line-height: 1.5;"
              >
                {event.description.length > 120
                  ? event.description.slice(0, 120) + "..."
                  : event.description}
              </p>

              <!-- Fecha y ubicación -->
              <div class="flex flex-col mb-4" style="gap: 0.375rem;">
                <div
                  class="flex items-center text-gray-600 text-sm font-medium"
                >
                  <svg
                    class="w-3.5 h-3.5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <time datetime={event.event_date}>
                    {new Date(event.event_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                {#if event.location || event.venue}
                  <div
                    class="flex items-center text-gray-600 text-sm font-medium"
                  >
                    <svg
                      class="w-3.5 h-3.5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      ></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span class="line-clamp-1">
                      {#if event.venue}
                        {event.venue}{event.location
                          ? `, ${event.location}`
                          : ""}
                      {:else}
                        {event.location || "Ubicación por definir"}
                      {/if}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Footer con precio y botón -->
              <div
                class="flex items-end justify-between mt-auto pt-3"
                style="gap: 0.75rem;"
              >
                <div class="flex flex-col" style="gap: 0.125rem;">
                  <span
                    class="text-xs font-medium text-gray-600 uppercase"
                    style="letter-spacing: 0.5px;">Desde</span
                  >
                  <span
                    class="text-2xl font-bold text-gray-600"
                    style="letter-spacing: -0.02em;"
                    >${(event.min_price || 0).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>

                <a
                  href={`/evento/${event.slug}`}
                  class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-black hover:text-white transition-all duration-200"
                  style="letter-spacing: 0.01em; white-space: nowrap;"
                >
                  Comprar entradas
                </a>
              </div>
            </div>
          </article>
        {/each}
      {:else}
        <p>No hay eventos disponibles en este momento.</p>
      {/if}
    </div>
  </div>
</section>
