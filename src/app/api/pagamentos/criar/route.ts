import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();

  if (nome) {
    const supabase = await createClient();
    await supabase.from("formas_pagamento").insert({ nome });
  }

  return NextResponse.redirect(new URL("/pagamentos", request.url), 303);
}
