import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateTickets } from '$lib/ticketGenerator';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	try {
		console.log('🧪 Testing ticket generation...');
		
		// Verificar variables de entorno
		const checks = {
			hasJwtSecret: !!env.JWT_SECRET_KEY,
			hasHashSalt: !!env.HASH_SALT,
			hasServiceRole: !!env.SUPABASE_SERVICE_ROLE_KEY,
			jwtSecretLength: env.JWT_SECRET_KEY?.length || 0,
			hashSaltLength: env.HASH_SALT?.length || 0
		};
		
		console.log('📋 Environment checks:', checks);
		
		if (!checks.hasJwtSecret || !checks.hasHashSalt || !checks.hasServiceRole) {
			return json({ 
				success: false, 
				error: 'Missing environment variables',
				checks
			});
		}
		
		// Datos de prueba
		const testData = {
			orderId: '00000000-0000-0000-0000-000000000000',
			eventId: '00000000-0000-0000-0000-000000000001',
			eventTitle: 'Test Event',
			ticketTypeId: '00000000-0000-0000-0000-000000000002',
			ticketTypeName: 'Test Ticket',
			holderEmail: 'test@example.com',
			eventDate: new Date(Date.now() + 86400000).toISOString() // Mañana
		};
		
		console.log('🔧 Generating test ticket...');
		const tickets = await generateTickets(testData, 1);
		
		console.log('✅ Generated ticket:', tickets[0]);
		
		// Intentar insertar en la base de datos
		console.log('📝 Testing database insert...');
		const ticketInsert = {
			id: tickets[0].id,
			order_id: testData.orderId,
			ticket_type_id: testData.ticketTypeId,
			event_id: testData.eventId,
			ticket_code: tickets[0].ticket_code,
			qr_token: tickets[0].qr_token,
			qr_hash: tickets[0].qr_hash,
			holder_email: testData.holderEmail,
			status: 'active'
		};
		
		console.log('📝 Inserting:', ticketInsert);
		
		const { data: insertedData, error: insertError } = await supabaseAdmin
			.from('tickets')
			.insert(ticketInsert)
			.select();
		
		if (insertError) {
			console.error('❌ Insert error:', insertError);
			return json({
				success: false,
				error: 'Database insert failed',
				errorDetails: insertError,
				generatedTicket: tickets[0],
				checks
			});
		}
		
		console.log('✅ Insert successful:', insertedData);
		
		// Limpiar el ticket de prueba
		await supabaseAdmin
			.from('tickets')
			.delete()
			.eq('id', tickets[0].id);
		
		return json({
			success: true,
			message: 'Ticket generation and insert test passed!',
			generatedTicket: tickets[0],
			insertedData,
			checks
		});
		
	} catch (error) {
		console.error('❌ Test failed:', error);
		return json({
			success: false,
			error: 'Exception occurred',
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined
		});
	}
};
