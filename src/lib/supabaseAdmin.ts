import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

/**
 * Cliente de Supabase con Service Role Key
 * 
 * ⚠️ SOLO USAR EN EL SERVIDOR (nunca en el cliente)
 * 
 * Este cliente bypasea Row Level Security (RLS) y tiene acceso completo
 * a todas las tablas y operaciones. Úsalo solo en contextos seguros del servidor
 * como webhooks, API routes, y procesos del backend.
 */
export const supabaseAdmin = createClient(
	PUBLIC_SUPABASE_URL,
	env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key (privada)
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
