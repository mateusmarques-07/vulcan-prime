import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();
  const ordem = Number(formData.get("ordem")) || 0;

  if (nome) {
    const supabase = await createClient();
    await supabase.from("categorias").insert({ nome, ordem });
  }

  return NextResponse.redirect(new URL("/produtos/categorias", request.url), 303);
}
