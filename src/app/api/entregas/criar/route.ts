import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/format";

function erroRedirect(request: Request, mensagem: string) {
  return NextResponse.redirect(
    redirectUrl(`/entregas/nova?erro=${encodeURIComponent(mensagem)}`, request),
    303
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const clienteNome = String(formData.get("cliente_nome") || "").trim();
  const endereco = String(formData.get("endereco") || "").trim();
  const taxaEntrega = round2(Number(formData.get("taxa_entrega")) || 0);
  const formaPagamentoId = String(formData.get("forma_pagamento_id") || "");
  const observacao = String(formData.get("observacao") || "").trim();

  if (!clienteNome || !endereco || !formaPagamentoId) {
    return erroRedirect(request, "Preencha cliente, endereço e forma de pagamento.");
  }

  const itens: { produto_id: string; quantidade: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qtd_")) continue;
    const quantidade = Number(value);
    if (quantidade > 0) {
      itens.push({ produto_id: key.slice(4), quantidade });
    }
  }

  if (itens.length === 0) {
    return erroRedirect(request, "Selecione pelo menos um produto.");
  }

  const supabase = await createClient();
  const { data: numero, error } = await supabase.rpc("criar_entrega", {
    p_cliente_nome: clienteNome,
    p_endereco: endereco,
    p_taxa_entrega: taxaEntrega,
    p_forma_pagamento_id: formaPagamentoId,
    p_observacao: observacao,
    p_itens: itens,
  });

  if (error) throw new Error(error.message);

  return NextResponse.redirect(redirectUrl(`/entregas/${numero}`, request), 303);
}
