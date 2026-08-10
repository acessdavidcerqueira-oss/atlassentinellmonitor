import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface SharedViewRpcRow {
  token: string;
  monitored_entity_id: string;
  name: string | null;
  created_at: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não está configurado." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { monitoredEntityId?: unknown; name?: unknown }
    | null;
  const monitoredEntityId = typeof body?.monitoredEntityId === "string" ? body.monitoredEntityId.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : null;

  if (!monitoredEntityId) {
    return NextResponse.json({ error: "Monitorado não informado." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_or_get_shared_view", {
    p_monitored_entity_id: monitoredEntityId,
    p_name: name
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "42501" ? 403 : 400 });
  }

  const sharedView = Array.isArray(data) ? (data[0] as SharedViewRpcRow | undefined) : undefined;
  if (!sharedView?.token) {
    return NextResponse.json({ error: "Não foi possível gerar o link de visualização." }, { status: 500 });
  }

  const url = `${request.nextUrl.origin}/view/${sharedView.token}`;

  return NextResponse.json({
    token: sharedView.token,
    url,
    monitoredEntityId: sharedView.monitored_entity_id,
    name: sharedView.name,
    createdAt: sharedView.created_at
  });
}
