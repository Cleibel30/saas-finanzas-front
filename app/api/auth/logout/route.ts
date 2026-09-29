import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/src/infrastructure/supabase/server';

export async function POST(request: NextRequest) {
  const { supabase } = createClient(request);
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'Sesión cerrada exitosamente' });
}
