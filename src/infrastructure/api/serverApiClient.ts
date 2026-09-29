import { createServerClient } from '@/src/infrastructure/supabase/server';
import { createApiClientWithToken } from '@/src/infrastructure/api/apiClient';

export async function createServerApiClient() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  return createApiClientWithToken(session?.access_token ?? '');
}
