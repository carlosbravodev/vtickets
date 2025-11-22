import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

/**
 * Script de migración para actualizar holder_name en tickets existentes
 * Obtiene el nombre desde el perfil del comprador (buyer_id)
 */
export const POST = async ({ locals }: any) => {
	try {
		// Verificar autenticación (solo administradores)
		const session = await locals.supabase.auth.getSession();
		
		if (!session.data.session) {
			return json({ error: 'No autenticado' }, { status: 401 });
		}

		const userId = session.data.session.user.id;

		// Verificar que el usuario sea organizador/admin
		// (puedes agregar validación adicional aquí si tienes un sistema de roles)

		console.log('🔄 Iniciando actualización de holder_name en tickets...');

		// 1. Obtener todos los tickets sin holder_name que tengan buyer_id
		const { data: ticketsToUpdate, error: ticketsError } = await supabaseAdmin
			.from('tickets')
			.select(`
				id,
				holder_email,
				order:orders!inner (
					id,
					buyer_id
				)
			`)
			.is('holder_name', null)
			.not('order.buyer_id', 'is', null);

		if (ticketsError) {
			console.error('❌ Error obteniendo tickets:', ticketsError);
			return json({ 
				error: 'Error al obtener tickets',
				details: ticketsError 
			}, { status: 500 });
		}

		if (!ticketsToUpdate || ticketsToUpdate.length === 0) {
			return json({ 
				message: 'No hay tickets para actualizar',
				updated: 0 
			});
		}

		console.log(`📊 Encontrados ${ticketsToUpdate.length} tickets para actualizar`);

		// 2. Agrupar tickets por buyer_id para optimizar consultas
		const buyerIds = [...new Set(
			ticketsToUpdate
				.map((t: any) => t.order?.buyer_id)
				.filter(Boolean)
		)];

		console.log(`👥 Consultando perfiles de ${buyerIds.length} compradores...`);

		// 3. Obtener perfiles de todos los compradores
		const { data: profiles, error: profilesError } = await supabaseAdmin
			.from('profiles')
			.select('id, first_name, last_name')
			.in('id', buyerIds);

		if (profilesError) {
			console.error('❌ Error obteniendo perfiles:', profilesError);
			return json({ 
				error: 'Error al obtener perfiles',
				details: profilesError 
			}, { status: 500 });
		}

		// 4. Crear mapa de buyer_id -> nombre completo
		const buyerNames = new Map(
			profiles?.map(p => [
				p.id, 
				`${p.first_name} ${p.last_name}`.trim()
			]) || []
		);

		console.log(`✅ Perfiles cargados: ${buyerNames.size}`);

		// 5. Actualizar tickets en lotes
		let updatedCount = 0;
		let errorCount = 0;
		const updates = [];

		for (const ticket of ticketsToUpdate as any[]) {
			const buyerId = ticket.order?.buyer_id;
			const buyerName = buyerNames.get(buyerId);

			if (buyerName) {
				updates.push({
					id: ticket.id,
					holder_name: buyerName
				});
			}
		}

		console.log(`📝 Preparando actualización de ${updates.length} tickets...`);

		// Actualizar en lotes de 100
		const BATCH_SIZE = 100;
		for (let i = 0; i < updates.length; i += BATCH_SIZE) {
			const batch = updates.slice(i, i + BATCH_SIZE);
			
			// Usar upsert con onConflict para actualizar solo holder_name
			const { error: updateError } = await supabaseAdmin
				.from('tickets')
				.upsert(
					batch.map(u => ({ id: u.id, holder_name: u.holder_name })),
					{ onConflict: 'id', ignoreDuplicates: false }
				);

			if (updateError) {
				console.error(`❌ Error en lote ${i / BATCH_SIZE + 1}:`, updateError);
				errorCount += batch.length;
			} else {
				updatedCount += batch.length;
				console.log(`✅ Lote ${i / BATCH_SIZE + 1} actualizado (${batch.length} tickets)`);
			}
		}

		console.log('🎉 Migración completada!');
		console.log(`   ✅ Actualizados: ${updatedCount}`);
		console.log(`   ❌ Errores: ${errorCount}`);

		return json({ 
			success: true,
			message: 'Migración completada',
			stats: {
				total: ticketsToUpdate.length,
				updated: updatedCount,
				errors: errorCount,
				profiles_found: buyerNames.size
			}
		});

	} catch (err) {
		console.error('❌ Error en migración:', err);
		return json({ 
			error: 'Error inesperado',
			details: err instanceof Error ? err.message : String(err)
		}, { status: 500 });
	}
};
