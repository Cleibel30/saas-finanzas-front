import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/src/infrastructure/supabase/server';
import { loginSchema } from '@/src/shared/schemas/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = loginSchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message || 'Datos inválidos';
    return NextResponse.json({ message }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const { error } = await supabase.auth.signInWithPassword({ email: result.data.email, password: result.data.password });

  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos'
        : error.message;
    return NextResponse.json({ message }, { status: 401 });
  }

  return NextResponse.json({ message: 'Inicio de sesión exitoso' });
}
