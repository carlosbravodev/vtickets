<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<style>
		/* Ocultar todo excepto el contenido de impresión */
		nav, header, footer {
			display: none !important;
		}
	</style>
</svelte:head>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
