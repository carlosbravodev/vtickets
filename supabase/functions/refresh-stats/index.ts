// Edge Function para refrescar la vista materializada de estadísticas
// Se puede llamar manualmente o mediante un cron job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Verificar que tenga autenticación válida (service_role key para cron)
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) {
			return new Response(
				JSON.stringify({ error: 'No authorization header' }),
				{ 
					status: 401,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		// Crear cliente de Supabase con service_role
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
			{
				auth: {
					persistSession: false,
				},
			}
		);

		console.log('🔄 Refreshing event statistics materialized view...');
		const startTime = Date.now();

		// Ejecutar el refresh de la vista materializada
		const { error } = await supabase.rpc('refresh_event_statistics');

		if (error) {
			console.error('❌ Error refreshing statistics:', error);
			return new Response(
				JSON.stringify({ 
					success: false, 
					error: error.message 
				}),
				{ 
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const duration = Date.now() - startTime;
		console.log(`✅ Statistics refreshed successfully in ${duration}ms`);

		// Obtener información sobre cuántos eventos fueron actualizados
		const { data: stats, error: statsError } = await supabase
			.from('event_statistics')
			.select('event_id, last_updated', { count: 'exact' });

		return new Response(
			JSON.stringify({
				success: true,
				duration_ms: duration,
				events_updated: stats?.length || 0,
				timestamp: new Date().toISOString()
			}),
			{ 
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);

	} catch (error) {
		console.error('💥 Unexpected error:', error);
		return new Response(
			JSON.stringify({ 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error' 
			}),
			{ 
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
});
