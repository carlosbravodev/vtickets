import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	return json({
		hasJwtSecret: !!env.JWT_SECRET_KEY,
		hasHashSalt: !!env.HASH_SALT,
		hasServiceRole: !!env.SUPABASE_SERVICE_ROLE_KEY,
		jwtSecretLength: env.JWT_SECRET_KEY?.length || 0,
		hashSaltLength: env.HASH_SALT?.length || 0,
		serviceRoleLength: env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
	});
};
