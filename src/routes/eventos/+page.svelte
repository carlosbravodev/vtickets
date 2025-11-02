<script lang="ts">
  import { optimizeSupabaseImage } from "$lib/utils/image";
  import { generateEventSlug } from "$lib/utils/slug";
  import { fade, fly } from "svelte/transition";

  let { data } = $props();

  // Ordenar eventos por fecha de creación para generar slugs consistentes
  let sortedEvents = $derived(
    [...data.events].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

<section class="bg-gray-50 dark:bg-gray-900">
  <div class="py-8 px-4 mx-auto max-w-7xl lg:py-16 lg:px-6">
    <div class="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8">
      <h2
        class="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white"
      >
        Nuestros Eventos
      </h2>
      <p class="font-light text-gray-500 sm:text-xl dark:text-gray-400">
        Descubre los mejores eventos y compra tus entradas. ¡No te quedes fuera!
      </p>
    </div>
    <div class="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
      {#if data.error}
        <p class="text-red-500">Error: {data.error}</p>
      {:else if sortedEvents.length > 0}
        {#each sortedEvents as event, i (event.id)}
          <article
            in:fly={{ y: 50, duration: 400, delay: i * 100 }}
            class="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            <!-- Imagen con overlay en hover -->
            <a
              href={`/evento/${generateEventSlug(event, sortedEvents)}`}
              class="relative overflow-hidden block"
            >
              <div
                class="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              ></div>
              <img
                class="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
                src={optimizeSupabaseImage(event.image_url, {
                  width: 600,
                  quality: 85,
                })}
                alt={event.title || "Evento"}
                loading="lazy"
              />
              <!-- Badge de estado activo -->
              {#if event.is_active}
                <div
                  class="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20"
                >
                  Activo
                </div>
              {/if}
            </a>

            <!-- Contenido -->
            <div class="p-6 flex flex-col grow">
              <!-- Título -->
              <a
                href={`/evento/${generateEventSlug(event, sortedEvents)}`}
                class="group/title"
              >
                <h3
                  class="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover/title:text-indigo-600 transition-colors duration-200"
                >
                  {event.title}
                </h3>
              </a>

              <!-- Fecha y ubicación -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center text-gray-600 text-sm">
                  <svg
                    class="w-5 h-5 mr-2 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <time datetime={event.event_date}
                    >{formatDateTime(event.event_date)}</time
                  >
                </div>
                {#if event.location}
                  <div class="flex items-center text-gray-600 text-sm">
                    <svg
                      class="w-5 h-5 mr-2 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                    <span class="line-clamp-1">{event.location}</span>
                  </div>
                {/if}
              </div>

              <!-- Descripción -->
              <p class="text-gray-600 text-sm mb-6 line-clamp-3 grow">
                {event.description}
              </p>

              <!-- Botón -->
              <a
                href={`/evento/${generateEventSlug(event, sortedEvents)}`}
                class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 shadow-md hover:shadow-lg mt-auto"
              >
                Ver detalles
                <svg
                  class="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          </article>
        {/each}
      {:else}
        <p>No hay eventos disponibles en este momento.</p>
      {/if}
    </div>
  </div>
</section>
