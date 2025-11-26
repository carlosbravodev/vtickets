<script lang="ts">
  import logoNavbar from "$lib/assets/logo-navbar.png";
  import userIcon from "$lib/assets/icons/user.svg";
  import { supabase } from "$lib/supabaseClient";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import type { User } from "@supabase/supabase-js";

  let { user, profile, availableRoles = [] } = $props<{
    user: User | null;
    profile: { first_name?: string; last_name?: string; email?: string } | null;
    availableRoles?: string[];
  }>();

  let isMenuOpen = $state(false);
  let showUserMenu = $state(false);

  // Usuario autenticado
  let isAuthenticated = $derived(!!user);

  // Detectar si el usuario también tiene rol de comprador
  let hasBuyerRole = $derived(availableRoles.includes("buyer"));

  // Obtener ruta actual para links activos
  let currentPath = $derived($page.url.pathname);

  // Nombre a mostrar
  let displayName = $derived(
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name || user?.email?.split("@")[0] || user?.email || ""
  );

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
      goto("/organizador/iniciar-sesion");
    }
  }
</script>

<header class="bg-linear-to-r from-purple-900 to-indigo-900 shadow-lg sticky top-0 z-50">
  <nav class="flex justify-between items-center max-w-7xl mx-auto px-4 py-4">
    <div class="flex items-center gap-6">
      <a href="/organizador" class="flex items-center gap-2">
        <img
          src={logoNavbar}
          alt="Logo de vtickets"
          class="h-10 w-auto min-w-28 brightness-0 invert"
        />
        <span class="hidden lg:inline-block text-purple-200 text-sm font-semibold border-l border-purple-400 pl-3 ml-1">
          Panel de Organizadores
        </span>
      </a>
      {#if isAuthenticated}
        <div class="hidden md:flex items-center gap-6">
          <a
            href="/organizador/eventos"
            class="text-lg font-bold {currentPath.startsWith('/organizador/eventos') ? 'text-white border-b-2 border-white pb-1' : 'text-purple-100 hover:text-white'} transition-colors duration-300"
          >
            Mis Eventos
          </a>
          <a
            href="/organizador/verificar"
            class="text-lg font-bold {currentPath.startsWith('/organizador/verificar') ? 'text-white border-b-2 border-white pb-1' : 'text-purple-100 hover:text-white'} transition-colors duration-300"
          >
            Verificar Tickets
          </a>
        </div>
      {:else}
        <div class="hidden md:flex items-center gap-6">
          <a
            href="/"
            class="text-sm font-semibold text-purple-200 hover:text-white transition-colors duration-300"
          >
            ← Ir a Tienda
          </a>
        </div>
      {/if}
    </div>

    <div class="hidden md:flex items-center gap-4">
      {#if isAuthenticated}
        <div class="relative">
          <button
            onclick={toggleUserMenu}
            class="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors duration-300 font-bold text-lg text-white py-2 px-4 rounded cursor-pointer"
          >
            <img
              src={userIcon}
              alt="Icono de usuario"
              class="h-6 w-6"
            />
            <span class="max-w-[150px] truncate">{displayName}</span>
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
              class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50"
            >
              <div class="px-4 py-2 border-b border-gray-200">
                <p class="text-sm text-gray-500">Organizador</p>
                <p class="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                {#if profile?.first_name && profile?.last_name}
                  <p class="text-xs text-gray-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                {/if}
              </div>
              <a
                href="/organizador/perfil"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onclick={() => (showUserMenu = false)}
              >
                Mi perfil
              </a>
              <a
                href="/organizador/configuracion"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onclick={() => (showUserMenu = false)}
              >
                Configuración
              </a>
              {#if hasBuyerRole}
                <a
                  href="/"
                  class="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                  onclick={() => (showUserMenu = false)}
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Cambiar a Comprador</span>
                  </div>
                </a>
              {/if}
              <button
                onclick={handleLogout}
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200"
              >
                Cerrar sesión
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <button
          onclick={() => goto("/organizador/iniciar-sesion")}
          class="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors duration-300 font-bold text-lg text-white py-2 px-4 rounded cursor-pointer"
        >
          <img
            src={userIcon}
            alt="Icono de usuario"
            class="h-6 w-6 brightness-0 invert"
          />
          Entrar
        </button>
      {/if}
    </div>

    <!-- Mobile menu button -->
    <div class="md:hidden flex items-center">
      <button onclick={toggleMenu} class="text-white focus:outline-none">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
        {#if isAuthenticated}
          <a 
            href="/organizador/eventos" 
            class="menu-link {currentPath.startsWith('/organizador/eventos') ? 'font-bold text-purple-600' : ''}" 
            onclick={toggleMenu}
          >
            Mis Eventos
          </a>
          <a 
            href="/organizador/verificar" 
            class="menu-link {currentPath.startsWith('/organizador/verificar') ? 'font-bold text-purple-600' : ''}" 
            onclick={toggleMenu}
          >
            Verificar Tickets
          </a>
        {:else}
          <a href="/" class="menu-link-secondary" onclick={toggleMenu}>
            ← Ir a Tienda
          </a>
        {/if}

        {#if isAuthenticated}
          <div class="menu-divider"></div>
          <div class="user-info">
            <p class="user-label">Organizador</p>
            <p class="user-email">{user?.email}</p>
          </div>
          <a href="/organizador/perfil" class="menu-link" onclick={toggleMenu}>
            Mi perfil
          </a>
          <a href="/organizador/configuracion" class="menu-link" onclick={toggleMenu}>
            Configuración
          </a>
          {#if hasBuyerRole}
            <a href="/" class="menu-link-switch" onclick={toggleMenu}>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Cambiar a Comprador
            </a>
          {/if}
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
              goto("/organizador/iniciar-sesion");
              toggleMenu();
            }}
            class="login-button-mobile"
          >
            <img src={userIcon} alt="Icono de usuario" class="icon-mobile brightness-0 invert" />
            Entrar como Organizador
          </button>
        {/if}
      </div>
    </div>
  {/if}
</header>

<style>
  .mobile-menu-container {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0.75rem;
    animation: menuFadeIn 0.3s ease-out forwards;
    background: rgba(88, 28, 135, 0.95);
  }

  .mobile-menu-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    padding: 1.25rem;
    width: 100%;
    margin: 0 auto;
    animation: menuSlideDown 0.3s ease-out forwards;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

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
    color: #7c3aed;
  }

  /* Link secundario (ir a tienda) */
  .menu-link-secondary {
    display: block;
    padding: 0.75rem 1rem;
    color: #7c3aed;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: #faf5ff;
    border: 1px solid #e9d5ff;
    text-align: center;
  }

  .menu-link-secondary:hover {
    background: #f3e8ff;
    color: #6b21a8;
    border-color: #c084fc;
  }

  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
  }

  .user-info {
    padding: 0.875rem 1rem;
    background: #faf5ff;
    border-radius: 10px;
    margin-bottom: 0.25rem;
  }

  .user-label {
    font-size: 0.75rem;
    color: #7c3aed;
    font-weight: 600;
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

  .logout-link {
    color: #dc2626;
    font-weight: 600;
  }

  .logout-link:hover {
    background: #fef2f2;
    color: #b91c1c;
  }

  /* Link de cambio de contexto (cambiar a comprador) */
  .menu-link-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    color: #2563eb;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    border-radius: 10px;
    transition: all 0.2s ease;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    margin: 0.25rem 0;
  }

  .menu-link-switch:hover {
    background: #dbeafe;
    color: #1d4ed8;
    border-color: #93c5fd;
  }

  .login-button-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
  }

  .login-button-mobile:active {
    transform: translateY(0);
  }

  .icon-mobile {
    height: 1.25rem;
    width: 1.25rem;
  }
</style>
