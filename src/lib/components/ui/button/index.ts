import type { Button as ButtonPrimitive } from "bits-ui";
import { tv, type VariantProps } from "tailwind-variants";
import Root from "./button.svelte";

/**
 * Variantes de botones para VTickets
 * - default: Botón principal para compradores (indigo)
 * - organizer: Botón principal para organizadores (purple)
 * - destructive: Botón para acciones destructivas (rojo)
 * - outline: Botón con borde para compradores
 * - outlineOrganizer: Botón con borde para organizadores
 * - secondary: Botón secundario (gris oscuro)
 * - ghost: Botón sin fondo para compradores
 * - ghostOrganizer: Botón sin fondo para organizadores
 * - link: Botón estilo enlace
 */
const buttonVariants = tv({
	base: "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default:
				"bg-buyer-600 text-white hover:bg-buyer-700 focus-visible:ring-buyer-500",
			organizer:
				"bg-organizer-600 text-white hover:bg-organizer-700 focus-visible:ring-organizer-500",
			destructive:
				"bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
			outline:
				"border-2 border-buyer-600 bg-transparent text-buyer-600 hover:bg-buyer-50 focus-visible:ring-buyer-500",
			outlineOrganizer:
				"border-2 border-organizer-600 bg-transparent text-organizer-600 hover:bg-organizer-50 focus-visible:ring-organizer-500",
			secondary:
				"bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-gray-600 focus-visible:ring-gray-500",
			ghost:
				"text-buyer-600 hover:bg-buyer-50 hover:text-buyer-700 focus-visible:ring-buyer-500",
			ghostOrganizer:
				"text-organizer-600 hover:bg-organizer-50 hover:text-organizer-700 focus-visible:ring-organizer-500",
			link: "text-buyer-600 underline-offset-4 hover:underline focus-visible:ring-buyer-500"
		},
		size: {
			default: "h-11 px-6 py-2.5 text-base rounded-lg",
			sm: "h-9 px-4 py-2 text-sm rounded-md",
			lg: "h-12 px-8 py-3 text-lg rounded-xl",
			xl: "h-14 px-10 py-4 text-xl rounded-xl",
			icon: "size-10 rounded-lg"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});

type Variant = VariantProps<typeof buttonVariants>["variant"];
type Size = VariantProps<typeof buttonVariants>["size"];

type ButtonProps = ButtonPrimitive.RootProps & {
	variant?: Variant;
	size?: Size;
};

export {
	Root,
	buttonVariants,
	//
	Root as Button,
	type ButtonProps
};
