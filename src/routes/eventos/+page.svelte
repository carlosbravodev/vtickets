<script lang="ts">
  import { optimizeSupabaseImage } from "$lib/utils/image";
  import { fly } from "svelte/transition";
  import * as Card from "$lib/components/ui/card";
  import { Calendar, MapPin, Ticket } from "@lucide/svelte";

  let { data } = $props();

  // Ordenar eventos por fecha del evento (más próximos primero)
  let sortedEvents = $derived(
    [...data.events].sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    ),
  );
</script>

<section class="min-h-screen bg-gray-50/50 py-12 md:py-20">
  <div class="max-w-7xl mx-auto px-6">
    <!-- Header -->
    <div class="text-center mb-12 md:mb-16">
      <h1
        class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4"
      >
        Nuestros Eventos
      </h1>
      <div class="h-1.5 w-24 bg-buyer-600 rounded-full mx-auto mb-6"></div>
      <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
        Descubre los mejores eventos y compra tus entradas. ¡No te quedes fuera!
      </p>
    </div>

    <!-- Grid de eventos -->
    {#if data.error}
      <div
        class="text-center py-12 bg-red-50 border border-red-200 rounded-2xl"
      >
        <p class="text-red-600 font-semibold">Error: {data.error}</p>
      </div>
    {:else if sortedEvents.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each sortedEvents as event, i (event.id)}
          <div in:fly={{ y: 30, duration: 400, delay: Math.min(i * 50, 400) }}>
            <Card.Root
              class="group h-full border border-gray-100 shadow-md hover:shadow-2xl hover:shadow-buyer-600/5 transition-all duration-500 overflow-hidden bg-white flex flex-col relative"
            >
              <!-- Imagen del evento con overlay mejorado -->
              <a
                href={`/evento/${event.slug}`}
                class="block relative aspect-[4/3] overflow-hidden bg-gray-100"
              >
                <img
                  src={optimizeSupabaseImage(event.image_url, {
                    width: 600,
                    quality: 85,
                  })}
                  alt={event.title || "Evento"}
                  loading="lazy"
                  class="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                />
                <!-- Gradient overlay -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500"
                ></div>

                <!-- Badge de fecha -->
                <div class="absolute top-3 left-3">
                  <div
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md text-gray-900 rounded-full shadow-lg border border-white/20"
                  >
                    <Calendar class="w-3.5 h-3.5 text-buyer-600" />
                    <span class="text-xs font-bold">
                      {new Date(event.event_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </a>

              <!-- Contenido -->
              <Card.Content class="p-5 flex flex-col flex-1 gap-3">
                <!-- Título -->
                <a href={`/evento/${event.slug}`} class="group/title block">
                  <h3
                    class="text-lg font-black leading-tight line-clamp-2 min-h-14 text-gray-900 group-hover/title:text-buyer-600 transition-colors duration-200"
                  >
                    {event.title}
                  </h3>
                </a>

                <!-- Ubicación -->
                <div class="flex items-start gap-2.5 min-h-10">
                  <MapPin class="w-4 h-4 shrink-0 mt-0.5 text-buyer-500" />
                  <span
                    class="text-sm text-gray-600 line-clamp-2 leading-relaxed"
                  >
                    {#if event.venue}
                      <span class="font-semibold text-gray-900"
                        >{event.venue}</span
                      >
                      {#if event.location}
                        <span class="text-gray-500"> · {event.location}</span>
                      {/if}
                    {:else}
                      {event.location || "Ubicación por definir"}
                    {/if}
                  </span>
                </div>

                <!-- Separador -->
                <div
                  class="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-1"
                ></div>

                <!-- Footer -->
                <div class="mt-auto flex items-end justify-between gap-3">
                  <div class="flex flex-col">
                    <span
                      class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5"
                      >Desde</span
                    >
                    <div class="flex items-baseline gap-1">
                      <span
                        class="text-2xl font-black text-gray-900 tracking-tight"
                      >
                        ${(event.min_price || 0).toLocaleString("es-ES", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span class="text-xs text-gray-400 font-medium">USD</span>
                    </div>
                  </div>

                  <a
                    href={`/evento/${event.slug}`}
                    class="inline-flex items-center justify-center gap-1.5 h-10 px-5 text-sm font-bold rounded-full bg-buyer-600 hover:bg-buyer-700 text-white shadow-lg shadow-buyer-600/25 hover:shadow-buyer-600/40 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
                  >
                    <Ticket class="w-4 h-4" />
                    <span>Comprar</span>
                  </a>
                </div>
              </Card.Content>

              <!-- Efecto de brillo -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              ></div>
            </Card.Root>
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="text-center py-16 bg-white border border-gray-200 rounded-2xl"
      >
        <div class="max-w-md mx-auto">
          <div
            class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Ticket class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            No hay eventos disponibles
          </h3>
          <p class="text-gray-600">
            Vuelve pronto para descubrir nuevos eventos emocionantes.
          </p>
        </div>
      </div>
    {/if}
  </div>
</section>
