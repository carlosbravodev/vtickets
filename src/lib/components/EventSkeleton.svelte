<script lang="ts">
	import { Skeleton } from "$lib/components/ui/skeleton";
	import * as Card from "$lib/components/ui/card";
</script>

<Card.Root
	class="h-full border-none shadow-sm overflow-hidden bg-white flex flex-col"
>
	<!-- Imagen skeleton -->
	<div class="relative aspect-[4/3] w-full">
		<Skeleton class="h-full w-full" />
	</div>

	<!-- Contenido skeleton -->
	<Card.Content class="p-5 flex flex-col flex-1 gap-4">
		<!-- Título -->
		<div class="space-y-2">
			<Skeleton class="h-6 w-3/4" />
			<Skeleton class="h-6 w-1/2" />
		</div>

		<!-- Ubicación -->
		<div class="flex items-center gap-2">
			<Skeleton class="h-4 w-4 rounded-full" />
			<Skeleton class="h-4 w-2/3" />
		</div>

		<!-- Footer -->
		<div
			class="mt-auto pt-4 flex items-end justify-between border-t border-gray-50"
		>
			<div class="flex flex-col gap-1">
				<Skeleton class="h-3 w-10" />
				<Skeleton class="h-7 w-20" />
			</div>

			<Skeleton class="h-9 w-28 rounded-full" />
		</div>
	</Card.Content>
</Card.Root>
