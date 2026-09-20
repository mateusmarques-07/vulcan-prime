import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const ordem = Number(formData.get("ordem")) || 0;

  if (nome) {
    const supabase = await createClient();
    await supabase.from("categorias").update({ nome, ordem }).eq("id", id);
  }

  return NextResponse.redirect(redirectUrl("/produtos/categorias", request), 303);
}
