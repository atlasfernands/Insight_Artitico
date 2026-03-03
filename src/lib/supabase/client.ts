"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicRuntimeConfig } from "@/lib/env.public";
import type { Database } from "@/lib/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = publicRuntimeConfig;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase public vars are missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }

    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
