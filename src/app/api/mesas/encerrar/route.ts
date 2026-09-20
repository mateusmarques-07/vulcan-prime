import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, round2 } from "@/lib/format";

function erroRedirect(request: Request, numero: string, mensagem: string) {
  return NextResponse.redirect(
    new URL(`/mesa/${numero}/fechamento?erro=${encodeURIComponent(mensagem)}`, request.url),
    303
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const comandaId = String(formData.get("comandaId"));
  const gorjetaPct = Number(formData.get("gorjetaPct")) || 0;
  const gorjetaFormaId = String(formData.get("gorjetaFormaId") || "");
  const pessoasRaw = String(formData.get("pessoas") || "");
  const qtdPessoas = pessoasRaw ? Number(pessoasRaw) : null;

  const supabase = await createClient();

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

  if (Math.abs(somaFormas - subtotal) > 0.01) {
    return erroRedirect(
      request,
      numero,
      `A soma das formas de pagamento (${formatBRL(somaFormas)}) precisa ser igual ao subtotal (${formatBRL(subtotal)}).`
    );
  }

  const gorjetaValor = round2((subtotal * gorjetaPct) / 100);
  let gorjetaFormaNome: string | null = null;

  if (gorjetaPct > 0) {
    const forma = (formasAtivas ?? []).find((f) => f.id === gorjetaFormaId);
    if (!forma) {
      return erroRedirect(request, numero, "Selecione a forma de pagamento da gorjeta.");
    }
    gorjetaFormaNome = forma.nome;
  }

  const total = round2(subtotal + gorjetaValor);

  const { data: fechamento, error: fechamentoError } = await supabase
    .from("fechamentos")
    .insert({
      comanda_id: comandaId,
      mesa_numero: Number(numero),
      subtotal,
      gorjeta_pct: gorjetaPct,
      gorjeta_valor: gorjetaValor,
      gorjeta_forma_pagamento_id: gorjetaPct > 0 ? gorjetaFormaId : null,
      gorjeta_forma_pagamento_nome: gorjetaFormaNome,
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

  await supabase.from("mesas").update({ status: "livre" }).eq("numero", Number(numero));

  return NextResponse.redirect(new URL("/", request.url), 303);
}
