<script lang="ts">
  import { optimizeSupabaseImage } from "$lib/utils/image";
  import { fade, fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { logger } from "$lib/logger";
  import { toast } from "$lib/stores/toast.svelte";

  let { data } = $props();
  const event = $derived(data.event);
  const user = $derived(data.user);

  // Verificar si el usuario está autenticado
  let isAuthenticated = $derived(!!user);

  // Verificar si el evento ya pasó
  let isEventPast = $derived(new Date(event.event_date) < new Date());

  // Obtener la URL actual para redirección después del login
  let currentPath = $derived($page.url.pathname);

  // Configurar Lemon Squeezy event listener
  onMount(() => {
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Setup({
        eventHandler: (event: any) => {
          if (event.event === "Checkout.Success") {
            // Redirigir a página de éxito cuando el pago se completa
            goto("/exito");
          }
        },
      });
    }

    // Resetear el estado de checkout cuando el usuario vuelve a la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Si el usuario vuelve a la página y el estado está en "procesando", resetearlo
        if (isCreatingCheckout) {
          isCreatingCheckout = false;
        }
      }
    };

    // Resetear cuando la página se carga desde el caché (botón back del navegador)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // La página fue restaurada desde el caché (bfcache)
        isCreatingCheckout = false;
      }
    };

    // Escuchar cuando el usuario regresa a la pestaña
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      if (checkoutTimeout) clearTimeout(checkoutTimeout);
    };
  });

  // Estado para las cantidades de tickets seleccionados
  type TicketSelection = {
    [ticketId: string]: number;
  };

  let selectedTickets = $state<TicketSelection>({});

  // Calcular el total
  let totalAmount = $derived.by(() => {
    let total = 0;
    if (event.ticket_types) {
      for (const ticket of event.ticket_types) {
        const quantity = selectedTickets[ticket.id] || 0;
        total += quantity * parseFloat(ticket.price);
      }
    }
    return total;
  });

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

  function goBack() {
    goto("/eventos");
  }

  function selectTicket(ticketId: string) {
    if (!selectedTickets[ticketId]) {
      selectedTickets[ticketId] = 1;
    }
  }

  function increaseQuantity(ticketId: string, maxTickets: number) {
    const currentQuantity = selectedTickets[ticketId] || 0;
    if (currentQuantity < maxTickets && currentQuantity < 10) {
      selectedTickets[ticketId] = currentQuantity + 1;
    }
  }

  function decreaseQuantity(ticketId: string) {
    const currentQuantity = selectedTickets[ticketId] || 0;
    if (currentQuantity > 1) {
      selectedTickets[ticketId] = currentQuantity - 1;
    } else {
      delete selectedTickets[ticketId];
    }
  }

  // Estado de loading para el checkout
  let isCreatingCheckout = $state(false);
  let checkoutTimeout: number | null = null;

  // Función para proceder al pago
  async function proceedToPayment() {
    // Verificar autenticación antes de proceder
    if (!isAuthenticated) {
      toast.warning("Debes iniciar sesión para comprar entradas", 4000);
      setTimeout(() => {
        goto(`/iniciar-sesion?redirectTo=${encodeURIComponent(currentPath)}`);
      }, 500);
      return;
    }

    if (totalAmount <= 0) return;

    isCreatingCheckout = true;

    // Timeout de seguridad: resetear después de 3 minutos si no se completa
    checkoutTimeout = window.setTimeout(() => {
      if (isCreatingCheckout) {
        logger.log("Checkout timeout - resetting state");
        isCreatingCheckout = false;
      }
    }, 180000); // 3 minutos

    try {
      // Construir descripción detallada de los tickets
      const ticketDetails = event.ticket_types
        .filter((ticket: any) => selectedTickets[ticket.id])
        .map((ticket: any) => {
          const qty = selectedTickets[ticket.id];
          return `${ticket.name} x${qty} ($${ticket.price} c/u)`;
        })
        .join("\n");

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          tickets: selectedTickets,
          totalAmount: totalAmount,
          ticketDetails: ticketDetails,
        }),
      });

      const data = await response.json();

      if (data.error) {
        // Si hay un redirectTo, redirigir a esa página
        if (data.redirectTo) {
          logger.log("Redirecting to:", data.redirectTo);
          toast.warning(data.message || "Redirigiendo...", 5000);
          goto(data.redirectTo);
          return;
        }

        // Si no hay redirectTo, mostrar error
        logger.error("Error details:", data.details);
        toast.error(
          data.message ||
            "Error al crear el checkout. Por favor verifica tu configuración.",
          6000
        );
        isCreatingCheckout = false;
        if (checkoutTimeout) clearTimeout(checkoutTimeout);
        return;
      }

      // Redirigir al checkout de Lemon Squeezy (sin parámetro de redirección)
      // La redirección se manejará manualmente después del pago
      window.location.href = data.checkoutUrl;
    } catch (error) {
      logger.error("Error:", error);
      toast.error(
        "Error al procesar el pago. Por favor intenta de nuevo.",
        5000
      );
      isCreatingCheckout = false;
      if (checkoutTimeout) clearTimeout(checkoutTimeout);
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Sticky Header with Back Button -->
  <div class="top-0 z-50">
    <div class="container max-w-7xl mx-auto px-6 py-3">
      <button
        onclick={goBack}
        class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 bg-gray-100 border border-gray-400 hover:text-black hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
        aria-label="Volver a eventos"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span>Volver</span>
      </button>
    </div>
  </div>

  <!-- Hero Section - Modern & Bold -->
  <div class="relative overflow-hidden bg-linear-to-b from-gray-50 to-white">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-0 right-0 w-96 h-96 bg-buyer-500/5 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-20 left-1/4 w-80 h-80 bg-organizer-500/5 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="relative z-10 container max-w-7xl mx-auto px-6 py-8 md:py-12">
      <div class="grid lg:grid-cols-5 gap-12 items-center">
        <!-- Image - Dominant Left Side -->
        <div
          class="lg:col-span-2 xl:col-span-3"
          in:fly={{ x: -40, duration: 300, delay: 0 }}
        >
          <div class="relative group flex flex-col gap-4">
            <!-- Status & Category -->
            <div class="flex items-center gap-3 flex-wrap">
              {#if isEventPast}
                <span
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wide rounded-full"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Evento Finalizado
                </span>
              {:else if event.is_active}
                <span
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full ring-1 ring-gree-200"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Entradas Disponibles
                </span>
              {/if}
            </div>

            <!-- Event Image -->
            <img
              class="relative w-full aspect-video object-cover rounded-3xl shadow-2xl ring-1 ring-gray-100"
              src={optimizeSupabaseImage(event.image_url, {
                width: 600,
                quality: 95,
              })}
              alt={event.title}
            />
          </div>
        </div>

        <!-- Content - Right Side -->
        <div
          class="lg:col-span-3 xl:col-span-2 space-y-8"
          in:fly={{ x: 40, duration: 300, delay: 0 }}
        >
          <!-- Main Title -->
          <div>
            <h1
              class="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-4 tracking-tight"
            >
              {event.title}
            </h1>
          </div>

          <!-- Key Details Cards -->
          <div class="grid gap-4">
            <!-- Date & Time -->
            <div
              class="flex gap-4 items-start p-4 rounded-2xl bg-linear-to-br from-buyer-50 to-buyer-50/50 border border-buyer-100"
            >
              <div
                class="shrink-0 w-14 h-14 rounded-xl bg-buyer-600 flex items-center justify-center shadow-lg shadow-buyer-600/30"
              >
                <svg
                  class="w-7 h-7 text-white"
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
              </div>
              <div>
                <p
                  class="text-xs font-bold text-buyer-600 uppercase tracking-widest mb-1"
                >
                  Fecha y Hora
                </p>
                <p class="text-lg font-bold text-gray-900">
                  {formatDateTime(event.event_date)}
                </p>
              </div>
            </div>

            <!-- Location -->
            {#if event.location || event.venue}
              <div
                class="flex gap-4 items-start p-4 rounded-2xl bg-linear-to-br from-buyer-50 to-buyer-50/50 border border-buyer-100"
              >
                <div
                  class="shrink-0 w-14 h-14 rounded-xl bg-buyer-600 flex items-center justify-center shadow-lg shadow-buyer-600/30"
                >
                  <svg
                    class="w-7 h-7 text-white"
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
                </div>
                <div>
                  <p
                    class="text-xs font-bold text-buyer-600 uppercase tracking-widest mb-1"
                  >
                    Ubicación
                  </p>
                  {#if event.venue}
                    <p class="text-lg font-bold text-gray-900">{event.venue}</p>
                    {#if event.location}
                      <p class="text-sm text-gray-600">{event.location}</p>
                    {/if}
                  {:else}
                    <p class="text-lg font-bold text-gray-900">
                      {event.location}
                    </p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Description -->
          {#if event.description}
            <div class="pt-6 border-t border-gray-200">
              <p
                class="text-base text-gray-700 leading-relaxed font-normal whitespace-pre-line"
              >
                {event.description}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Tickets Section - Clean & Modern -->
  <div class="container max-w-7xl mx-auto px-6 py-16 md:py-24">
    <!-- Section Header -->
    <div class="mb-16" in:fly={{ y: 30, duration: 250, delay: 0 }}>
      <h2
        class="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
      >
        Elige tus Entradas
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl">
        Selecciona la cantidad de entradas que necesitas y completa tu compra de
        forma segura.
      </p>
      <div
        class="h-1.5 w-20 bg-linear-to-r from-buyer-600 to-organizer-600 rounded-full mt-4"
      ></div>
    </div>

    {#if event.ticket_types && event.ticket_types.length > 0}
      <!-- Event Past State -->
      {#if isEventPast}
        <div class="relative mb-12" in:fade={{ duration: 200, delay: 0 }}>
          <div
            class="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl z-10"
          ></div>
          <div
            class="absolute inset-0 flex items-center justify-center z-20 rounded-3xl"
            in:fly={{ y: 20, duration: 150, delay: 0 }}
          >
            <div
              class="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center border border-gray-200"
            >
              <div
                class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  class="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="text-3xl font-black text-gray-900 mb-3">
                Evento Finalizado
              </h3>
              <p class="text-gray-600 mb-8 text-lg">
                Lo sentimos, este evento ya ha pasado y las entradas ya no están
                disponibles.
              </p>
              <button
                onclick={goBack}
                class="w-full px-6 py-4 bg-linear-to-r from-buyer-600 to-buyer-700 hover:from-buyer-700 hover:to-buyer-800 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Ver Otros Eventos
              </button>
            </div>
          </div>
          <div class="h-96"></div>
        </div>
      {/if}

      <!-- Tickets & Checkout Section - Horizontal Layout -->
      <div class="flex flex-col lg:flex-row gap-8 items-start">
        <!-- Tickets Column -->
        <div class="w-full lg:flex-1">
          <div class="space-y-2 lg:space-y-3">
            {#each event.ticket_types as ticket, i (ticket.id)}
              <div
                in:fly={{ y: 20, duration: 250, delay: i * 20 }}
                class="group flex gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 hover:border-buyer-300 hover:shadow-lg transition-all duration-150"
              >
                <!-- Ticket Name & Price -->
                <div class="flex-1 min-w-0">
                  <h3
                    class="text-xl sm:text-2xl font-black text-gray-900 mb-1"
                  >
                    {ticket.name}
                  </h3>
                  <p class="text-base sm:text-lg font-bold text-buyer-600">
                    ${ticket.price}
                  </p>
                </div>

                <!-- Quantity Controls -->
                <div
                  class="flex items-center gap-2 bg-gray-50 rounded-lg p-2 shrink-0"
                >
                  <button
                    type="button"
                    onclick={() => {
                      const current = selectedTickets[ticket.id] || 0;
                      if (current > 0) {
                        selectedTickets[ticket.id] = current - 1;
                      }
                    }}
                    disabled={!selectedTickets[ticket.id] ||
                      selectedTickets[ticket.id] <= 0}
                    class="w-8 h-8 rounded-md flex items-center justify-center text-lg font-black text-gray-500 hover:text-buyer-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    −
                  </button>
                  <div class="w-9 text-center">
                    <span class="text-sm font-black text-gray-900">
                      {selectedTickets[ticket.id] || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onclick={() => {
                      const current = selectedTickets[ticket.id] || 0;
                      const maxAllowed = 10;
                      if (current < maxAllowed) {
                        selectedTickets[ticket.id] = current + 1;
                      }
                    }}
                    disabled={(selectedTickets[ticket.id] || 0) >= 10}
                    class="w-8 h-8 rounded-md flex items-center justify-center text-lg font-black text-buyer-600 hover:bg-buyer-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    +
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Checkout Sidebar -->
        <div
          class="w-full lg:w-96 relative"
          in:fly={{ x: 30, duration: 300, delay: 0 }}
        >
          <div
            class="sticky top-24 bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6 lg:p-8 h-fit"
          >
            <!-- Order Summary -->
            <div class="mb-6 lg:mb-8 pb-6 lg:pb-8 border-b-2 border-gray-100">
              <p
                class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 lg:mb-4"
              >
                Resumen de Compra
              </p>

              <!-- Tickets Summary -->
              <div
                class="space-y-1 lg:space-y-2 mb-4 lg:mb-6 max-h-40 lg:max-h-48 overflow-y-auto"
              >
                {#each event.ticket_types as ticket}
                  {#if selectedTickets[ticket.id] > 0}
                    <div
                      class="flex justify-between items-center text-xs lg:text-sm"
                    >
                      <span class="text-gray-600 truncate pr-2">
                        {ticket.name}
                        <span class="font-bold text-gray-900"
                          >×{selectedTickets[ticket.id]}</span
                        >
                      </span>
                      <span class="font-bold text-gray-900 shrink-0">
                        ${(
                          selectedTickets[ticket.id] * parseFloat(ticket.price)
                        ).toFixed(2)}
                      </span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>

            <!-- Total Amount -->
            <div class="mb-6 lg:mb-8 pb-6 lg:pb-8 border-b-2 border-gray-100">
              <p
                class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 lg:mb-3"
              >
                Total a pagar
              </p>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl lg:text-5xl font-black text-gray-900"
                  >${totalAmount.toFixed(2)}</span
                >
                <span class="text-xs lg:text-sm text-gray-500 font-semibold"
                  >USD</span
                >
              </div>
              {#if Object.values(selectedTickets).some((v) => v > 0)}
                <p class="text-xs lg:text-sm text-gray-600 mt-2 lg:mt-3">
                  <span class="font-bold"
                    >{Object.values(selectedTickets).reduce(
                      (a, b) => a + b,
                      0
                    )}</span
                  >
                  {Object.values(selectedTickets).reduce((a, b) => a + b, 0) ===
                  1
                    ? "entrada"
                    : "entradas"} seleccionada(s)
                </p>
              {/if}
            </div>

            <!-- CTA Button -->
            {#if Object.values(selectedTickets).some((v) => v > 0)}
              <button
                onclick={proceedToPayment}
                disabled={isCreatingCheckout}
                class="w-full py-3 lg:py-4 px-4 lg:px-6 bg-linear-to-r from-buyer-600 to-buyer-700 hover:from-buyer-700 hover:to-buyer-800 disabled:from-gray-300 disabled:to-gray-300 text-white font-black text-base lg:text-lg rounded-2xl transition-all duration-150 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl disabled:shadow-none"
              >
                {#if isCreatingCheckout}
                  <svg
                    class="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Procesando...</span>
                {:else}
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span
                    >{isAuthenticated
                      ? "Continuar a Pago"
                      : "Inicia Sesión"}</span
                  >
                {/if}
              </button>
            {:else}
              <button
                disabled
                class="w-full py-3 lg:py-4 px-4 lg:px-6 bg-gray-200 text-gray-400 font-black text-base lg:text-lg rounded-2xl cursor-not-allowed"
              >
                Selecciona Entradas
              </button>
            {/if}

            <!-- Payment Methods -->
            <div
              class="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t-2 border-gray-100 space-y-2 lg:space-y-3"
            >
              <div class="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                <svg
                  class="w-4 lg:w-5 h-4 lg:h-5 text-buyer-600 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700 font-semibold">Pago 100% seguro</span
                >
              </div>
              <div class="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                <div class="flex gap-1 lg:gap-2 shrink-0">
                  <!-- Visa -->
                  <div
                    class="w-6 lg:w-8 h-4 lg:h-5 bg-linear-to-r from-blue-600 to-blue-700 rounded-sm flex items-center justify-center text-white text-xs font-bold"
                  >
                    VISA
                  </div>
                  <!-- Mastercard -->
                  <div
                    class="w-6 lg:w-8 h-4 lg:h-5 bg-gray-100 rounded-sm flex items-center justify-center relative"
                  >
                    <div
                      class="absolute w-2 lg:w-3 h-2 lg:h-3 bg-red-600 rounded-full"
                    ></div>
                    <div
                      class="absolute w-2 lg:w-3 h-2 lg:h-3 bg-orange-600 rounded-full ml-1.5 lg:ml-2"
                    ></div>
                  </div>
                  <!-- Amex -->
                  <div
                    class="w-6 lg:w-8 h-4 lg:h-5 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold"
                  >
                    AE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- No Tickets State -->
      <div class="text-center py-20">
        <div
          class="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4a1 1 0 011-1h16a1 1 0 011 1v2.757a1 1 0 01-.808.983L2.817 6.57A1 1 0 012 5.757V4z"
            />
          </svg>
        </div>
        <h3 class="text-3xl font-black text-gray-900 mb-3">
          No hay entradas disponibles
        </h3>
        <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Pronto habrá más información sobre este evento. Por favor intenta más
          tarde.
        </p>
        <button
          onclick={goBack}
          class="inline-flex items-center gap-2 px-8 py-4 bg-buyer-600 hover:bg-buyer-700 text-white font-bold rounded-xl transition-all duration-150"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Ver Otros Eventos
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background: #f9fafb;
  }
</style>
