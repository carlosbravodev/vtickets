<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import type { ActionData } from "./$types";
  import { supabase } from "$lib/supabaseClient";
  import { toast } from "$lib/stores/toast.svelte";

  let { form }: { form: ActionData } = $props();

  let mode: "login" | "registro" = $state("login");
  let isLoading = $state(false);
  let showPassword = $state(false);

  let message = $derived(form?.message || "");
  let messageType = $derived(form?.success ? "success" : "error");

  // Rastrear el último form para evitar duplicados en el mismo render
  let lastFormTimestamp = $state(0);

  // Mostrar toast cuando hay un mensaje del servidor
  $effect(() => {
    if (form?.message) {
      // Crear un identificador único basado en el contenido del form
      const currentTimestamp = Date.now();

      // Solo mostrar si ha pasado al menos 100ms desde el último (evita duplicados en mismo render)
      if (currentTimestamp - lastFormTimestamp > 100) {
        lastFormTimestamp = currentTimestamp;

        if (form.success) {
          toast.success(form.message);
        } else {
          toast.error(form.message);
        }
      }
    }
  });

  // Obtener el parámetro redirectTo de la URL
  let redirectTo = $derived($page.url.searchParams.get("redirectTo") || "/");

  function toggleMode() {
    mode = mode === "login" ? "registro" : "login";
  }

  async function handleOAuthLogin(provider: "google" | "facebook") {
    isLoading = true;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}&authType=buyer`,
        },
      });

      if (error) {
        console.error("Error con OAuth:", error.message);
        toast.error(
          `Error al iniciar sesión con ${provider}: ${error.message}`
        );
        isLoading = false;
      }
      // Si no hay error, la redirección a OAuth se hace automáticamente
      // No seteamos isLoading = false porque la página se va a recargar
    } catch (err) {
      console.error("Error inesperado con OAuth:", err);
      toast.error("Error al conectar con el proveedor");
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title
    >{mode === "login" ? "Iniciar Sesión" : "Registrarse"} | v•tickets</title
  >
</svelte:head>

<div
  class="min-h-screen bg-buyer-600 flex items-center justify-center p-4"
>
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          {mode === "login" ? "¡Bienvenido de nuevo!" : "¡Únete a nosotros!"}
        </h1>
        <p class="text-gray-600">
          {mode === "login"
            ? "Ingresa tus credenciales para continuar"
            : "Crea tu cuenta para empezar"}
        </p>
      </div>

      <form
        method="POST"
        action="?/{mode}"
        use:enhance={() => {
          isLoading = true;
          return async ({ update, result }) => {
            await update();
            isLoading = false;
            if (result.type === "redirect") {
              // Mostrar toast de éxito antes de redirigir
              const successMessage =
                mode === "login"
                  ? "¡Bienvenido de nuevo! Sesión iniciada correctamente 🎉"
                  : "¡Cuenta creada exitosamente! Bienvenido a v•tickets 🎉";
              toast.success(successMessage);
              await invalidateAll();
              // Pequeño delay para que se vea el toast
              setTimeout(() => goto(result.location), 800);
            }
          };
        }}
      >
        <!-- Campo oculto para redirección -->
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div class="mb-4">
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-2"
            >Correo electrónico</label
          >
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="tu@email.com"
            value={form?.email ?? ""}
          />
        </div>

        <div class="mb-6">
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 mb-2"
            >Contraseña</label
          >
          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              required
              autocomplete={mode === "login"
                ? "current-password"
                : "new-password"}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
              placeholder="••••••••"
              minlength="6"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {#if showPassword}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  /><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  /></svg
                >
              {:else}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  /></svg
                >
              {/if}
            </button>
          </div>
          {#if mode === "registro"}
            <p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {#if isLoading}
            <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"
              ><circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              /><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              /></svg
            >
            Procesando...
          {:else}
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          {/if}
        </button>
      </form>

      <div class="my-6 flex items-center">
        <div class="flex-1 border-t border-gray-300"></div>
        <span class="px-4 text-sm text-gray-500">o continúa con</span>
        <div class="flex-1 border-t border-gray-300"></div>
      </div>

      <div class="space-y-3">
        <button
          type="button"
          onclick={() => handleOAuthLogin("google")}
          disabled={isLoading}
          class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isLoading}
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
            Conectando...
          {:else}
            <svg class="w-5 h-5" viewBox="0 0 24 24"
              ><path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              /><path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              /><path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              /><path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              /></svg
            >
            Google
          {/if}
        </button>

        <button
          type="button"
          onclick={() => handleOAuthLogin("facebook")}
          disabled={isLoading}
          class="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isLoading}
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
            Conectando...
          {:else}
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Facebook
          {/if}
        </button>
      </div>
      <div class="mt-6 text-center">
        <p class="text-gray-600">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          <button
            type="button"
            onclick={toggleMode}
            class="text-indigo-600 hover:text-indigo-700 font-semibold ml-1"
          >
            {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>

    <p class="mt-4 text-center text-sm text-buyer-900">
      Al continuar, aceptas nuestros Términos de Servicio y Política de
      Privacidad
    </p>
  </div>
</div>
