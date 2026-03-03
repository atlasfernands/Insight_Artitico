import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadTracksByUserId, parseRangeDays } from "@/lib/dashboard/queries";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rangeDays = parseRangeDays(url.searchParams.get("range"));
  const tracks = await loadTracksByUserId(user.id, rangeDays);
  return NextResponse.json(tracks);
}
