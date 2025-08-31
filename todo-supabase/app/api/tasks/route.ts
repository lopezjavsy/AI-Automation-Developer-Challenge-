// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function sanitize(value: any): string {
  if (!value) return "";
  return String(value).trim().replace(/^=+/, "");
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.N8N_SHARED_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const email = sanitize(body.user_email || body.email);
  const title = sanitize(body.title_enhanced || body.title);

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert([{ user_email: email, title }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task: data });
}
