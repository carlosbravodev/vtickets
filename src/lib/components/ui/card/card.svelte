<script lang="ts">
	import { tv, type VariantProps } from "tailwind-variants";
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	const cardVariants = tv({
		base: "rounded-xl transition-all",
		variants: {
			variant: {
				default: "bg-white border border-gray-200",
				dark: "bg-gray-900 border border-gray-800 text-white",
				elevated: "bg-white border-transparent"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	type Variant = VariantProps<typeof cardVariants>["variant"];

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: Variant;
	};

	let {
		class: className,
		variant = "default",
		...restProps
	}: Props = $props();
</script>

<div
	class={cn(cardVariants({ variant }), className)}
	{...restProps}
>
	{@render restProps.children?.()}
</div>
