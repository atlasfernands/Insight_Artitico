import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = requireServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read but not always set cookies.
        }
      },
    },
  });
}
