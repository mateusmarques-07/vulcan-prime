import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();

  if (nome) {
    const supabase = await createClient();
    await supabase.from("formas_pagamento").update({ nome }).eq("id", id);
  }

  return NextResponse.redirect(new URL("/pagamentos", request.url), 303);
}
