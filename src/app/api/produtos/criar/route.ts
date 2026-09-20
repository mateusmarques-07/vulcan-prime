import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const preco = Number(formData.get("preco")) || 0;
  const ordem = Number(formData.get("ordem")) || 0;

  if (nome && categoriaId) {
    const supabase = await createClient();
    await supabase.from("produtos").insert({
      nome,
      categoria_id: categoriaId,
      preco,
      ordem,
    });
  }

  return NextResponse.redirect(new URL("/produtos", request.url), 303);
}
