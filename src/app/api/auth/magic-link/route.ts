import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverRuntimeConfig } from "@/lib/env";

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email inválido" },
      {
        status: 400,
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${serverRuntimeConfig.appUrl}/auth/callback?next=/`,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 400,
      },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
