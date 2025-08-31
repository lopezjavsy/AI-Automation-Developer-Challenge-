import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  // 1) Seguridad: validar token compartido con n8n
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.N8N_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Leer el body
  const body = await req.json().catch(() => null);
  if (!body?.user_email || !body?.title_enhanced) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { user_email, title_enhanced } = body;

  // 3) Insertar en Supabase
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({ user_email, title: title_enhanced })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task: data });
}
