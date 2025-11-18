<script lang="ts">
  import NavbarOrganizer from "$lib/components/NavbarOrganizer.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { onNavigate } from "$app/navigation";
  
  let { children, data } = $props();

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

<NavbarOrganizer user={data.user} profile={data.profile} />

{@render children?.()}

<Toast />
