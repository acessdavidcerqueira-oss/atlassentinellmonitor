import { NextResponse, type NextRequest } from "next/server";
import type { AtlasState } from "@/types/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface SharedViewStateResponse {
  sharedView: {
    token: string;
    monitoredEntityId: string;
    name: string | null;
    createdAt: string;
  };
  state: AtlasState;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase não está configurado." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("get_shared_view_state", { p_token: token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Link de visualização não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data as SharedViewStateResponse, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    }
  });
}
