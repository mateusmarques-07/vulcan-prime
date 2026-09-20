import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, round2 } from "@/lib/format";

function erroRedirect(request: Request, numero: string, mensagem: string) {
  return NextResponse.redirect(
    redirectUrl(`/mesa/${numero}/fechamento?erro=${encodeURIComponent(mensagem)}`, request),
    303
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const comandaId = String(formData.get("comandaId"));
  const gorjetaPct = Number(formData.get("gorjetaPct")) || 0;
  const pessoasRaw = String(formData.get("pessoas") || "");
  const qtdPessoas = pessoasRaw ? Number(pessoasRaw) : null;
  const taxaEntrega = round2(Number(formData.get("taxaEntrega")) || 0);

  const supabase = await createClient();

  const { data: mesaAtual } = await supabase
    .from("mesas")
    .select("tipo")
    .eq("numero", Number(numero))
    .single();

  const { data: itens } = await supabase
    .from("itens_comanda")
    .select("preco_unit, quantidade")
    .eq("comanda_id", comandaId);

  const subtotal = round2(
    (itens ?? []).reduce((soma, i) => soma + i.preco_unit * i.quantidade, 0)
  );

  if (subtotal <= 0) {
    return erroRedirect(request, numero, "A comanda não tem itens.");
  }

  const gorjetaValor = round2((subtotal * gorjetaPct) / 100);
  const total = round2(subtotal + gorjetaValor + taxaEntrega);

  const { data: formasAtivas } = await supabase
    .from("formas_pagamento")
    .select("id, nome")
    .eq("ativo", true);

  const pagamentos: { forma_pagamento_id: string; forma_pagamento_nome: string; valor: number }[] =
    [];
  for (const forma of formasAtivas ?? []) {
    const valor = Number(formData.get(`valor_${forma.id}`)) || 0;
    if (valor > 0) {
      pagamentos.push({
        forma_pagamento_id: forma.id,
        forma_pagamento_nome: forma.nome,
        valor: round2(valor),
      });
    }
  }

  const somaFormas = round2(pagamentos.reduce((soma, p) => soma + p.valor, 0));

  // Valida contra o TOTAL (itens + gorjeta + taxa de entrega), nao so o
  // subtotal - decisao de 20/09/2026 depois do Mateus reportar que pagar
  // parte no cartao (comida) e parte em dinheiro (gorjeta) travava, porque
  // antes a soma so podia bater com o subtotal.
  if (Math.abs(somaFormas - total) > 0.01) {
    return erroRedirect(
      request,
      numero,
      `A soma das formas de pagamento (${formatBRL(somaFormas)}) precisa ser igual ao total (${formatBRL(total)}).`
    );
  }

  const { data: fechamento, error: fechamentoError } = await supabase
    .from("fechamentos")
    .insert({
      comanda_id: comandaId,
      mesa_numero: Number(numero),
      subtotal,
      gorjeta_pct: gorjetaPct,
      gorjeta_valor: gorjetaValor,
      taxa_entrega: taxaEntrega,
      qtd_pessoas: qtdPessoas,
      total,
    })
    .select("id")
    .single();

  if (fechamentoError || !fechamento) {
    throw new Error(fechamentoError?.message ?? "Erro ao criar fechamento");
  }

  if (pagamentos.length > 0) {
    await supabase
      .from("fechamento_pagamentos")
      .insert(pagamentos.map((p) => ({ ...p, fechamento_id: fechamento.id })));
  }

  await supabase
    .from("comandas")
    .update({ status: "fechada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId);

  // taxa de entrega volta pro padrao de R$ 5 so nas mesas do tipo entrega -
  // as demais ficam em 0 mesmo (nunca usam esse campo)
  const taxaEntregaPadrao = mesaAtual?.tipo === "entrega" ? 5 : 0;

  await supabase
    .from("mesas")
    .update({
      status: "livre",
      gorjeta_ativa: false,
      gorjeta_pct: 10,
      qtd_pessoas: null,
      taxa_entrega: taxaEntregaPadrao,
    })
    .eq("numero", Number(numero));

  return NextResponse.redirect(redirectUrl("/", request), 303);
}
