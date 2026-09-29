import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/src/infrastructure/supabase/server';
import { API_BASE_URL } from '@/src/shared/constants';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/companies';

  if (code) {
    const { supabase } = createClient(request);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }).catch(() => {});

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
