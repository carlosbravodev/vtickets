<script lang="ts">
  import favicon from "$lib/assets/favicon.png";
  import logoNavbar from "$lib/assets/logo-navbar.png";
  import userIcon from "$lib/assets/icons/user.svg";
  import { supabase } from "$lib/supabaseClient";

  let { children, data } = $props();
  import "../app.css";
  import { goto, invalidateAll, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";

  let isMenuOpen = $state(false);
  let showUserMenu = $state(false);

  // Usuario y sesión reactivos
  let user = $derived(data.user);
  let isAuthenticated = $derived(!!user);

  // Obtener la URL actual para redirección
  let currentPath = $derived($page.url.pathname);

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      showUserMenu = false;
      await invalidateAll();
      goto("/");
    }
  }

  // View Transitions API
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:head>
  <title>v•tickets | Tus eventos favoritos.</title>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="bg-white shadow sticky top-0 z-50">
  <nav class="flex justify-between items-center max-w-7xl mx-auto px-4 py-4">
    <div class="flex items-end gap-8">
      <a href="/">
        <img
          src={logoNavbar}
          alt="Logo de vtickets"
          class="h-10 w-auto min-w-28"
        />
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a
          href="/eventos"
          class="text-xl font-bold hover:text-gray-600 transition-colors duration-300"
          >Eventos</a
        >
      </div>
    </div>

    <div class="hidden md:flex items-center gap-4">
      {#if isAuthenticated}
        <div class="relative">
          <button
            onclick={toggleUserMenu}
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 font-bold text-xl text-white py-2 px-4 rounded cursor-pointer"
          >
            <img
              src={userIcon}
              alt="Icono de usuario"
              class="inline-block h-6 w-6"
            />
            <span class="max-w-[150px] truncate"
              >{user?.email?.split("@")[0]}</span
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
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {#if showUserMenu}
            <div
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50"
            >
              <div class="px-4 py-2 border-b border-gray-200">
                <p class="text-sm text-gray-500">Cuenta</p>
                <p class="text-sm font-semibold text-gray-900 truncate">
                  {user?.email}
                </p>
              </div>
              <a
                href="/cuenta"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onclick={() => (showUserMenu = false)}
              >
                Mi cuenta
              </a>
              <button
                onclick={handleLogout}
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <button
          onclick={() =>
            goto(`/login?redirectTo=${encodeURIComponent(currentPath)}`)}
          class="flex items-center bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 font-bold text-xl text-white py-2 px-4 rounded cursor-pointer"
        >
          <img
            src={userIcon}
            alt="Icono de usuario"
            class="inline-block mr-2"
          />
          Entrar
        </button>
      {/if}
    </div>

    <div class="md:hidden flex items-center">
      <button onclick={toggleMenu} class="text-gray-800 focus:outline-none">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {#if isMenuOpen}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          {/if}
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile Menu -->
  {#if isMenuOpen}
    <div class="mobile-menu-container">
      <div class="mobile-menu-content">
        <a href="/eventos" class="menu-link" onclick={toggleMenu}>Eventos</a>

        {#if isAuthenticated}
          <div class="menu-divider"></div>
          <div class="user-info">
            <p class="user-label">Cuenta</p>
            <p class="user-email">{user?.email}</p>
          </div>
          <a href="/cuenta" class="menu-link" onclick={toggleMenu}>
            Mi cuenta
          </a>
          <button
            onclick={() => {
              handleLogout();
              toggleMenu();
            }}
            class="menu-link logout-link"
          >
            Cerrar sesión
          </button>
        {:else}
          <button
            onclick={() => {
              goto(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
              toggleMenu();
            }}
            class="login-button-mobile"
          >
            <img src={userIcon} alt="Icono de usuario" class="icon-mobile" />
            Entrar
          </button>
        {/if}
      </div>
    </div>
  {/if}
</header>

{@render children?.()}

<style>
  /* Mobile Menu Container - Fondo con backdrop */
  .mobile-menu-container {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0.75rem;
    animation: menuFadeIn 0.3s ease-out forwards;
  }

  /* Contenido del menú - Card flotante */
  .mobile-menu-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    padding: 1.25rem;
    width: 100%;
    margin: 0 auto;
    animation: menuSlideDown 0.3s ease-out forwards;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Animación del menú - Fade in + Slide down */
  @keyframes menuFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes menuSlideDown {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Links del menú */
  .menu-link {
    display: block;
    padding: 0.875rem 1rem;
    color: #1a1a1a;
    font-weight: 500;
    font-size: 1rem;
    text-decoration: none;
    border-radius: 10px;
    transition: all 0.2s ease;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .menu-link:hover {
    background: #f3f4f6;
    color: #667eea;
  }

  /* Divisor */
  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
  }

  /* Información de usuario */
  .user-info {
    padding: 0.875rem 1rem;
    background: #f9fafb;
    border-radius: 10px;
    margin-bottom: 0.25rem;
  }

  .user-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .user-email {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Link de logout */
  .logout-link {
    color: #dc2626;
    font-weight: 600;
  }

  .logout-link:hover {
    background: #fef2f2;
    color: #b91c1c;
  }

  /* Botón de login móvil */
  .login-button-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    margin-top: 0.25rem;
  }

  .login-button-mobile:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .login-button-mobile:active {
    transform: translateY(0);
  }

  .icon-mobile {
    height: 1.25rem;
    width: 1.25rem;
  }
</style>
