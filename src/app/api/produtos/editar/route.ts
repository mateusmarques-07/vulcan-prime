import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const preco = Number(formData.get("preco")) || 0;
  const ordem = Number(formData.get("ordem")) || 0;

  if (nome && categoriaId) {
    const supabase = await createClient();
    await supabase
      .from("produtos")
      .update({ nome, categoria_id: categoriaId, preco, ordem })
      .eq("id", id);
  }

  return NextResponse.redirect(redirectUrl("/produtos", request), 303);
}
