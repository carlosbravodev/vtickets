<script lang="ts">
  import { page } from "$app/stores";
  import { toastStore } from "$lib/stores/toastNotifications.svelte";
  import { syncStore } from "$lib/stores/sync.svelte";
  import QrScanner from "$lib/components/QrScanner.svelte";
  import type { PageData } from "./$types";
  import { onMount, onDestroy, tick } from "svelte";
  import {
    cacheEvent,
    cacheTickets,
    findTicketByCode,
    addToVerificationQueue,
    isOnline,
    getCachedTickets,
  } from "$lib/utils/offline";
  import {
    triggerSuccessFeedback,
    triggerErrorFeedback,
    triggerProcessingFeedback,
  } from "$lib/utils/audio";
  import type { RealtimeChannel } from "@supabase/supabase-js";

  let { data }: { data: PageData } = $props();

  // Referencias
  let scannerRef: any = $state(null);

  // Estado del scanner (bindable con QrScanner)
  let scannerState: "idle" | "processing" | "success" | "error" =
    $state("idle");

  // Estado
  let isScanning = $state(false);
  let isProcessing = $state(false);
  let offlineMode = $state(!isOnline());

  // Estadísticas reactivas
  let stats = $state({
    total: 0,
    verified: 0,
    pending: 0,
    percentage: 0,
  });

  // Inicializar stats en onMount
  onMount(() => {
    stats = {
      total: data.stats.total,
      verified: data.stats.verified,
      pending: data.stats.pending,
      percentage: data.stats.percentage,
    };
  });

  // Canal de Realtime para actualizaciones en vivo
  let realtimeChannel: RealtimeChannel | null = null;

  // Función para actualizar estadísticas desde la BD
  async function refreshStats() {
    try {
      const response = await fetch(`/api/verificar/stats/${data.event.id}`);
      if (response.ok) {
        const newStats = await response.json();
        stats.total = newStats.total;
        stats.verified = newStats.verified;
        stats.pending = newStats.pending;
        stats.percentage = newStats.percentage;
        console.log("📊 Estadísticas actualizadas desde BD:", stats);
      }
    } catch (error) {
      console.error("Error actualizando estadísticas:", error);
    }
  }

  // Inicializar
  onMount(() => {
    // Cachear el evento actual
    cacheEvent(data.event).then(() => {
      // Cargar tickets del evento para cache offline
      return fetch(`/api/verificar/tickets/${data.event.id}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("No se pudo cargar tickets");
        })
        .then((tickets) => cacheTickets(data.event.id, tickets))
        .then(() => {
          console.log("✅ Tickets cacheados para uso offline");
        })
        .catch(() => {
          console.log("ℹ️ No se pudieron cachear tickets (modo offline?)");
        });
    });

    // Inicializar store de sincronización
    syncStore.init();

    // Suscribirse a cambios en tiempo real en tickets
    import("$lib/supabaseClient").then(({ supabase }) => {
      realtimeChannel = supabase
        .channel(`tickets-${data.event.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Escuchar INSERT, UPDATE, DELETE
            schema: "public",
            table: "tickets",
            filter: `event_id=eq.${data.event.id}`,
          },
          (payload) => {
            console.log("🔄 Cambio detectado en tickets:", payload);
            // Actualizar estadísticas cuando hay cambios
            refreshStats();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Suscrito a actualizaciones en tiempo real");
          }
        });
    });

    // Listener para detectar cambios en conexión
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  // Limpiar al desmontar
  onDestroy(() => {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      console.log("🔌 Desuscrito de actualizaciones en tiempo real");
    }
  });

  // Manejar cambio a online
  function handleOnline() {
    offlineMode = false;
    toastStore.add("Conexión restaurada", "success");
    syncStore.syncAll();
  }

  // Manejar cambio a offline
  function handleOffline() {
    offlineMode = true;
    toastStore.add("Modo offline activado", "warning");
  }

  // Formatear fecha
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  // Formatear precio
  function formatPrice(price: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(price / 100);
  }

  // Iniciar escaneo
  async function startScan() {
    try {
      isScanning = true;

      // Esperar a que el componente se monte en el DOM
      await tick();

      // Ahora sí podemos iniciar el escáner
      if (scannerRef) {
        await scannerRef.start();
      } else {
        throw new Error("El escáner no se pudo inicializar");
      }
    } catch (error) {
      console.error("Error al iniciar escaneo:", error);
      toastStore.add("Error al acceder a la cámara", "error");
      isScanning = false;
    }
  }

  // Detener escaneo
  async function stopScan() {
    try {
      if (scannerRef) {
        await scannerRef.stop();
      }
      isScanning = false;
    } catch (error) {
      console.error("Error al detener escaneo:", error);
    }
  }

  // Manejar QR escaneado (MODO CONTINUO - NO DETIENE SCANNER)
  async function handleScanSuccess(decodedText: string) {
    // Si ya estamos procesando, ignorar (el cooldown ya está en QrScanner)
    if (isProcessing) return;

    isProcessing = true;
    scannerState = "processing"; // Estado visual amarillo
    triggerProcessingFeedback(); // Vibración al detectar QR

    try {
      console.log("[SCAN] QR detectado:", decodedText.substring(0, 50));

      let ticketId: string | null = null;
      let qrData: string = decodedText;

      // Intentar parsear como JSON primero (retrocompatibilidad)
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.ticket_id) {
          ticketId = parsed.ticket_id;
        }
      } catch {
        // No es JSON, es JWT o UUID directo
      }

      // NO DETENER EL SCANNER - procesamos en background

      // ========== MODO OFFLINE ==========
      if (offlineMode || !isOnline()) {
        console.log("📵 Modo offline: validando localmente");

        // En modo offline, necesitamos el ticket_id
        // Si solo tenemos JWT, no podemos validar offline sin decodificarlo
        if (!ticketId) {
          toastStore.add(
            "No se puede validar JWT en modo offline. Conéctate a internet.",
            "error"
          );
          triggerErrorFeedback();

          setTimeout(() => {
            scannerState = "idle";
            isProcessing = false;
          }, 3000);
          return;
        }

        // Buscar ticket en caché por ID
        const cachedTicket = await findTicketByCode(ticketId);

        if (!cachedTicket) {
          toastStore.add("Ticket no encontrado en caché offline", "error");
          triggerErrorFeedback();

          setTimeout(() => {
            scannerState = "idle";
            isProcessing = false;
          }, 3000);
          return;
        }

        // Validar que pertenece al evento
        if (cachedTicket.event_id !== data.event.id) {
          toastStore.add("⚠️ Ticket de otro evento", "error");
          triggerErrorFeedback();

          setTimeout(() => {
            scannerState = "idle";
            isProcessing = false;
          }, 3000);
          return;
        }

        // Validar que no esté ya verificado
        if (cachedTicket.verified) {
          toastStore.add(
            `⏮️ Ticket ya verificado (offline)`,
            "warning"
          );

          setTimeout(() => {
            scannerState = "idle";
            isProcessing = false;
          }, 3000);
          return;
        }

        // Agregar a la cola de sincronización
        const userId = data.event.created_by; // Asumimos que está disponible
        await addToVerificationQueue(
          cachedTicket.id,
          data.event.id,
          userId,
          undefined,
          { user_agent: navigator.userAgent }
        );

        // Incrementar contador en el store
        syncStore.incrementPending();

        // Actualizar estadísticas localmente
        stats.verified += 1;
        stats.pending -= 1;
        stats.percentage = Math.round((stats.verified / stats.total) * 100);

        // Toast de éxito offline
        toastStore.add(
          `✅ ${cachedTicket.holder_name || "Entrada"} verificada (pendiente de sincronización)`,
          "success"
        );
        triggerSuccessFeedback();

        setTimeout(() => {
          scannerState = "idle";
          isProcessing = false;
        }, 2000);

        return;
      }

      // ========== MODO ONLINE (OPTIMIZADO) ==========
      // Llamar al nuevo endpoint unificado /api/verificar/scan
      const scanResponse = await fetch("/api/verificar/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          qr_data: qrData,
          event_id: data.event.id,
          device_info: { user_agent: navigator.userAgent },
        }),
      });

      const scanResult = await scanResponse.json();

      if (scanResult.success) {
        // ✅ ÉXITO - Ticket verificado
        scannerState = "success";
        triggerSuccessFeedback(); // Sonido + vibración de éxito

        // Actualizar estadísticas
        stats.verified += 1;
        stats.pending -= 1;
        stats.percentage = Math.round((stats.verified / stats.total) * 100);

        // Toast de éxito
        toastStore.add(
          `✅ ${scanResult.ticket.holder_name || "Entrada"} verificada`,
          "success"
        );

        console.log("✅ Ticket verificado:", scanResult.ticket.code);

        // Volver a idle después de 1 segundo
        setTimeout(() => {
          scannerState = "idle";
          isProcessing = false;
        }, 1000);
      } else {
        // ❌ ERROR - Ticket inválido o ya verificado
        const isAlreadyVerified = scanResult.error_type === "already_verified";
        const isWrongEvent = scanResult.error_type === "wrong_event";
        const isCancelled = scanResult.error_type === "cancelled";
        const isInvalid = scanResult.error_type === "invalid";

        scannerState = "error";
        triggerErrorFeedback(); // Sonido + vibración de error

        // Toast por tipo de error
        if (isWrongEvent) {
          toastStore.add("⚠️ Ticket de otro evento", "error");
        } else if (isCancelled) {
          toastStore.add("❌ Ticket cancelado", "error");
        } else if (isAlreadyVerified) {
          toastStore.add(
            `⏮️ Ticket ya verificado por ${scanResult.ticket?.holder_name || "usuario desconocido"}`,
            "warning"
          );
        } else if (isInvalid) {
          toastStore.add("❌ Código QR inválido", "error");
        } else {
          toastStore.add("❌ Error al verificar ticket", "error");
        }

        console.log("❌ Error en verificación:", scanResult.error_type);

        // Volver a idle después de 1.5 segundos
        setTimeout(() => {
          scannerState = "idle";
          isProcessing = false;
        }, 1500);
      }
    } catch (error) {
      console.error("[SCAN] Error procesando QR:", error);

      scannerState = "error";
      triggerErrorFeedback();
      toastStore.add("Error al procesar el código QR", "error");

      setTimeout(() => {
        scannerState = "idle";
        isProcessing = false;
      }, 1500);
    }
  }

  // Manejar error de escaneo
  function handleScanError(error: string) {
    console.error("Error de escaneo:", error);
  }
</script>

<svelte:head>
  <title>Verificar: {data.event.title} - VTickets</title>
</svelte:head>

{#if isScanning || isProcessing}
  <!-- Vista Minimalista Extremo (Modo Escaneando) -->
  <div class="h-screen flex flex-col bg-gray-900">
    <!-- Header compacto -->
    <header
      class="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700"
    >
      <button
        onclick={stopScan}
        class="text-white hover:text-gray-300 transition"
        aria-label="Cerrar escáner"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div class="flex-1 text-center">
        <h1 class="text-white font-semibold text-lg truncate">
          {data.event.title}
        </h1>
      </div>

      <div class="text-white font-mono text-sm">
        {stats.verified}/{stats.total}
      </div>
    </header>

    <!-- Cámara fullscreen -->
    <main class="flex-1 relative bg-black">
      <QrScanner
        bind:this={scannerRef}
        bind:scannerState
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </main>
  </div>
{:else}
  <!-- Vista Normal (Modo No Escaneando) -->
  <div class="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <a
          href="/organizador/verificar"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Volver a eventos
        </a>

        <div class="bg-white rounded-lg shadow-md p-6">
          <!-- Indicador Online/Offline -->
          <div class="mb-4 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">{data.event.title}</h1>

            <div class="flex items-center gap-3">
              <!-- Botón Historial -->
              <a
                href="/organizador/verificar/{data.event.id}/historial"
                class="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition"
              >
                <svg
                  class="w-4 h-4 mr-1.5"
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
                Historial
              </a>

              <!-- Estado de conexión -->
              {#if offlineMode}
                <div
                  class="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm"
                >
                  <svg
                    class="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                    />
                  </svg>
                  Offline
                </div>
              {:else}
                <div
                  class="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm"
                >
                  <div
                    class="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"
                  ></div>
                  Online
                </div>
              {/if}

              <!-- Contador de pendientes -->
              {#if syncStore.pendingCount > 0}
                <button
                  onclick={() => syncStore.syncAll()}
                  disabled={syncStore.isSyncing}
                  class="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm hover:bg-blue-100 disabled:opacity-50"
                >
                  {#if syncStore.isSyncing}
                    <svg
                      class="animate-spin w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Sincronizando...
                  {:else}
                    <svg
                      class="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {syncStore.pendingCount} pendiente{syncStore.pendingCount !==
                    1
                      ? "s"
                      : ""}
                  {/if}
                </button>
              {/if}
            </div>
          </div>

          <div class="mt-2 flex items-center text-sm text-gray-600">
            <svg
              class="w-4 h-4 mr-2"
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
            {formatDate(data.event.event_date)}
          </div>
          <div class="mt-1 flex items-center text-sm text-gray-600">
            <svg
              class="w-4 h-4 mr-2"
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
            {data.event.venue || data.event.location}
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div class="text-sm text-gray-600 mt-1">Total</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-3xl font-bold text-green-600">{stats.verified}</div>
          <div class="text-sm text-gray-600 mt-1">Verificados</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-3xl font-bold text-orange-600">{stats.pending}</div>
          <div class="text-sm text-gray-600 mt-1">Pendientes</div>
        </div>
      </div>

      <!-- Escáner QR -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">
            Escanear Ticket
          </h2>
          {#if !isScanning && !isProcessing}
            <button
              onclick={startScan}
              class="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Iniciar Escaneo
            </button>
          {:else if isProcessing}
            <div class="text-center py-8">
              <div
                class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
              ></div>
              <p class="mt-4 text-gray-600">Verificando ticket...</p>
            </div>
          {/if}
        </div>

        <!-- Botón detener -->
        {#if isScanning && !isProcessing}
          <button
            onclick={stopScan}
            class="mt-4 w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Detener Escaneo
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
</style>
