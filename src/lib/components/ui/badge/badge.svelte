<script lang="ts">
	import { tv, type VariantProps } from "tailwind-variants";
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	const badgeVariants = tv({
		base: "inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
		variants: {
			variant: {
				default: "bg-buyer-600 text-white hover:bg-buyer-700",
				organizer: "bg-organizer-600 text-white hover:bg-organizer-700",
				secondary: "bg-gray-800 text-white border border-gray-700",
				outline: "border-2 border-buyer-600 text-buyer-600 bg-transparent",
				outlineOrganizer: "border-2 border-organizer-600 text-organizer-600 bg-transparent",
				success: "bg-green-600 text-white",
				warning: "bg-yellow-600 text-white",
				error: "bg-red-600 text-white",
				info: "bg-blue-600 text-white"
			},
			size: {
				default: "h-6",
				sm: "h-5 text-xs",
				lg: "h-7 text-sm"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	});

	type Variant = VariantProps<typeof badgeVariants>["variant"];
	type Size = VariantProps<typeof badgeVariants>["size"];

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: Variant;
		size?: Size;
	};

	let {
		class: className,
		variant = "default",
		size = "default",
		...restProps
	}: Props = $props();
</script>

<div
	class={cn(badgeVariants({ variant, size }), className)}
	{...restProps}
>
	{@render restProps.children?.()}
</div>
