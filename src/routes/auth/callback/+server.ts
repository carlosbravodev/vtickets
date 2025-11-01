import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
const code = url.searchParams.get('code');
const redirectTo = url.searchParams.get('redirectTo') ?? '/';

if (code) {
const { error } = await supabase.auth.exchangeCodeForSession(code);
if (!error) {
redirect(303, redirectTo);
}
}

// Si hay error o no hay código, redirigir al login con mensaje de error
redirect(303, '/login?error=auth_callback_error');
};
