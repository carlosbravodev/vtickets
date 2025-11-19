<script lang="ts">
  import NavbarOrganizer from "$lib/components/NavbarOrganizer.svelte";
  import RoleWarningBanner from "$lib/components/RoleWarningBanner.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { onNavigate } from "$app/navigation";
  
  let { children, data } = $props();
  
  // Datos del usuario y roles
  let availableRoles = $derived(data.availableRoles || []);
  let hasOrganizerRole = $derived(data.hasOrganizerRole || false);

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

<!-- Banner de advertencia si no tiene rol de organizador -->
{#if data.user}
  <RoleWarningBanner 
    currentSection="organizer"
    userHasRole={hasOrganizerRole}
    availableRoles={availableRoles}
  />
{/if}

<NavbarOrganizer 
  user={data.user} 
  profile={data.profile}
  availableRoles={availableRoles}
/>

{@render children?.()}

<Toast />
