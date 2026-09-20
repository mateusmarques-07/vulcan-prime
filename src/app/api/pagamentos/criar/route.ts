import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();

  if (nome) {
    const supabase = await createClient();
    await supabase.from("formas_pagamento").insert({ nome });
  }

  return NextResponse.redirect(redirectUrl("/configuracoes/pagamentos", request), 303);
}
