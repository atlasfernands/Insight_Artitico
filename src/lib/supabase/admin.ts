import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function createSupabaseAdminClient() {
  if (!adminClient) {
    const supabaseUrl = requireServerEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");

    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}
