import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const comandaId = String(formData.get("comandaId"));
  const produtoId = String(formData.get("produtoId"));
  const numero = String(formData.get("numero"));
  const categoria = String(formData.get("categoria") ?? "");

  const supabase = await createClient();

  const { data: itemExistente } = await supabase
    .from("itens_comanda")
    .select("id, quantidade")
    .eq("comanda_id", comandaId)
    .eq("produto_id", produtoId)
    .maybeSingle();

  if (itemExistente) {
    await supabase
      .from("itens_comanda")
      .update({ quantidade: itemExistente.quantidade + 1 })
      .eq("id", itemExistente.id);
  } else {
    const { data: produto } = await supabase
      .from("produtos")
      .select("nome, preco")
      .eq("id", produtoId)
      .single();

    if (produto) {
      await supabase.from("itens_comanda").insert({
        comanda_id: comandaId,
        produto_id: produtoId,
        nome_produto: produto.nome,
        preco_unit: produto.preco,
        quantidade: 1,
      });
    }
  }

  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
  return NextResponse.redirect(new URL(`/mesa/${numero}${query}`, request.url), 303);
}
