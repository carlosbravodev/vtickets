import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { supabaseAdmin } from '$lib/supabaseAdmin';

const supabase: Handle = async ({ event, resolve }) => {
event.locals.supabase = createServerClient(
env.PUBLIC_SUPABASE_URL,
env.PUBLIC_SUPABASE_ANON_KEY,
{
cookies: {
getAll: () => event.cookies.getAll(),
setAll: (cookiesToSet) => {
cookiesToSet.forEach(({ name, value, options }) => {
event.cookies.set(name, value, { ...options, path: '/' });
});
}
}
}
);

event.locals.safeGetSession = async () => {
const {
data: { session }
} = await event.locals.supabase.auth.getSession();
if (!session) {
return { session: null, user: null };
}

const {
data: { user },
error
} = await event.locals.supabase.auth.getUser();
if (error) {
return { session: null, user: null };
}

return { session, user };
};

return resolve(event, {
filterSerializedResponseHeaders(name) {
return name === 'content-range' || name === 'x-supabase-api-version';
}
});
};

const authGuard: Handle = async ({ event, resolve }) => {
const { session, user } = await event.locals.safeGetSession();
event.locals.session = session;
event.locals.user = user;

if (event.url.pathname.startsWith('/cuenta')) {
if (!session) {
redirect(303, '/iniciar-sesion');
}
}

if (event.url.pathname.startsWith('/iniciar-sesion')) {
if (session) {
redirect(303, '/');
}
}

return resolve(event);
};

const profileGuard: Handle = async ({ event, resolve }) => {
const { session } = await event.locals.safeGetSession();

if (session?.user) {
const excludedRoutes = ['/iniciar-sesion', '/auth', '/api', '/completar-perfil'];
const isExcluded = excludedRoutes.some((route) => event.url.pathname.startsWith(route));

if (!isExcluded) {
try {
const { data: profile } = await supabaseAdmin
.from('profiles')
.select('first_name, last_name, phone, document_number')
.eq('id', session.user.id)
.single();

if (!profile?.first_name || !profile?.last_name || !profile?.phone || !profile?.document_number) {
throw redirect(303, '/completar-perfil');
}
} catch (error) {
if (error && typeof error === 'object' && 'status' in error) {
throw error;
}
throw redirect(303, '/completar-perfil');
}
}
}

return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard, profileGuard);
