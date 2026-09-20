import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));

  const supabase = await createClient();

  const { count } = await supabase
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);

  if (count && count > 0) {
    const mensagem = `Não é possível remover essa categoria porque ela ainda tem ${count} produto${count > 1 ? "s" : ""} cadastrado${count > 1 ? "s" : ""} nela. Mude a categoria desses produtos primeiro (na tela de Produtos) e tente de novo.`;
    return NextResponse.redirect(
      new URL(`/produtos/categorias?erro=${encodeURIComponent(mensagem)}`, request.url),
      303
    );
  }

  await supabase.from("categorias").delete().eq("id", id);

  return NextResponse.redirect(new URL("/produtos/categorias", request.url), 303);
}
