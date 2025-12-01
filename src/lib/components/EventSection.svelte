<script lang="ts">
  import EventSkeleton from "./EventSkeleton.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import {
    Calendar,
    MapPin,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Ticket,
  } from "@lucide/svelte";

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
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    ),
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

<section class="py-12 md:py-20 bg-gray-50/50 relative overflow-hidden">
  <!-- Decorative background element -->
  <div
    class="absolute top-0 right-0 w-1/3 h-1/3 bg-buyer-100/30 blur-[100px] rounded-full pointer-events-none"
  ></div>
  <div
    class="absolute bottom-0 left-0 w-1/4 h-1/4 bg-organizer-100/30 blur-[100px] rounded-full pointer-events-none"
  ></div>

  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="flex justify-between items-end mb-10">
      <div>
        <h2
          class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2"
        >
          {title}
        </h2>
        <div class="h-1.5 w-20 bg-buyer-600 rounded-full"></div>
      </div>

      <div class="hidden md:flex gap-3">
        <button
          onclick={scrollLeft}
          class="inline-flex items-center justify-center size-10 rounded-full border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-buyer-50 hover:text-buyer-600 hover:border-buyer-200 transition-all duration-300 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-buyer-500"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button
          onclick={scrollRight}
          class="inline-flex items-center justify-center size-10 rounded-full border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-buyer-50 hover:text-buyer-600 hover:border-buyer-200 transition-all duration-300 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-buyer-500"
          aria-label="Scroll derecha"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div
      class="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:snap-none"
      bind:this={scrollContainer}
    >
      {#if isLoading}
        {#each Array(Math.min(4, maxCards)) as _, i (i)}
          <div class="snap-center shrink-0 w-[300px] xl:w-auto">
            <EventSkeleton />
          </div>
        {/each}
      {:else}
        {#each displayEvents as event (event.id)}
          <div class="snap-center shrink-0 w-[300px] xl:w-auto h-full">
            <Card.Root
              class="group h-full border border-gray-100 shadow-md hover:shadow-2xl hover:shadow-buyer-600/5 transition-all duration-500 overflow-hidden bg-white flex flex-col relative"
            >
              <!-- Imagen del evento con overlay mejorado -->
              <a
                href={`/evento/${event.slug}`}
                class="block relative aspect-[4/3] overflow-hidden bg-gray-100"
              >
                <img
                  src={event.image_url}
                  alt={event.title}
                  class="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                />
                <!-- Gradient overlay más sofisticado -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500"
                ></div>

                <!-- Badge de fecha con glassmorphism -->
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
                    class="text-lg font-black leading-tight line-clamp-2 min-h-[3.5rem] text-gray-900 group-hover/title:text-buyer-600 transition-colors duration-200"
                  >
                    {event.title}
                  </h3>
                </a>

                <!-- Ubicación con icono -->
                <div class="flex items-start gap-2.5 min-h-[2.5rem]">
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

                <!-- Separador sutil -->
                <div
                  class="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-1"
                ></div>

                <!-- Footer con precio y botón -->
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

              <!-- Efecto de brillo en hover -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              ></div>
            </Card.Root>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</section>

<style>
  /* Ocultar scrollbar pero permitir scroll */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
