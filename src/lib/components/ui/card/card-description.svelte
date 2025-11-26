<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLParagraphElement>;

	let { class: className, ...restProps }: Props = $props();
</script>

<p class={cn("text-body-sm text-gray-400", className)} {...restProps}>
	{@render restProps.children?.()}
</p>
