<script lang="ts">
	import { Button as ButtonPrimitive } from "bits-ui";
	import { type WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { buttonVariants } from "./index.js";
	import type { ButtonProps } from "./index.js";

	let {
		ref = $bindable(),
		class: className,
		variant = "default",
		size = "default",
		...restProps
	}: WithElementRef<ButtonProps> = $props();
</script>

<ButtonPrimitive.Root
	bind:ref
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
>
	{@render restProps.children?.()}
</ButtonPrimitive.Root>
