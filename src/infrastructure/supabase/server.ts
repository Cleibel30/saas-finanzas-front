import { createServerClient as createSupabaseServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

// For Server Components (App Router)
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// For API Routes and Middleware (Pages Router compatible)
export function createClient(req: NextRequest) {
  const headers = new Headers();

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(req.headers.get('Cookie') ?? '').filter(
            (c): c is { name: string; value: string } => c.value !== undefined
          );
        },
        setAll(cookiesToSet, setHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options));
          });
          Object.entries(setHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });
        },
      },
    }
  );

  return { supabase, headers };
}

export async function getSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}