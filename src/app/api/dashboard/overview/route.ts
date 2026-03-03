import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadOverviewByUserId, parseRangeDays } from "@/lib/dashboard/queries";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  parseRangeDays(url.searchParams.get("range"));

  const overview = await loadOverviewByUserId(user.id);
  return NextResponse.json(overview);
}
