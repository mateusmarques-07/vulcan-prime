import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/format";

export type FechamentoResumo = {
  id: string;
  fechado_em: string;
  mesa_numero: number;
  formaTexto: string;
  subtotal: number;
  gorjeta: number;
  total: number;
};

export async function getRecebimentos(inicio: Date, fim: Date) {
  const supabase = await createClient();

  const { data: fechamentos } = await supabase
    .from("fechamentos")
    .select("id, mesa_numero, subtotal, gorjeta_valor, total, fechado_em")
    .gte("fechado_em", inicio.toISOString())
    .lt("fechado_em", fim.toISOString())
    .order("fechado_em", { ascending: false });

  const ids = (fechamentos ?? []).map((f) => f.id);

  const { data: pagamentos } =
    ids.length > 0
      ? await supabase
          .from("fechamento_pagamentos")
          .select("fechamento_id, forma_pagamento_nome, valor")
          .in("fechamento_id", ids)
      : { data: [] };

  const pagamentosPorFechamento = new Map<string, { nome: string; valor: number }[]>();
  for (const pagamento of pagamentos ?? []) {
    const lista = pagamentosPorFechamento.get(pagamento.fechamento_id) ?? [];
    lista.push({ nome: pagamento.forma_pagamento_nome, valor: pagamento.valor });
    pagamentosPorFechamento.set(pagamento.fechamento_id, lista);
  }

  // Por forma de pagamento so considera o subtotal (itens) - a gorjeta agora
  // e' sempre um valor a parte, sem forma de pagamento propria (decisao de
  // 20/09/2026, depois do teste real: nao faz sentido perguntar "gorjeta foi
  // em qual forma" toda vez).
  const porForma = new Map<string, number>();
  for (const pagamento of pagamentos ?? []) {
    porForma.set(
      pagamento.forma_pagamento_nome,
      round2((porForma.get(pagamento.forma_pagamento_nome) ?? 0) + pagamento.valor)
    );
  }

  const lista: FechamentoResumo[] = (fechamentos ?? []).map((f) => {
    const partes = (pagamentosPorFechamento.get(f.id) ?? []).map(
      (p) => `${p.nome} R$ ${p.valor.toFixed(2).replace(".", ",")}`
    );
    let formaTexto = partes.join(" + ");
    if (f.gorjeta_valor > 0) {
      formaTexto += ` + Gorjeta R$ ${f.gorjeta_valor.toFixed(2).replace(".", ",")}`;
    }
    return {
      id: f.id,
      fechado_em: f.fechado_em,
      mesa_numero: f.mesa_numero,
      formaTexto,
      subtotal: f.subtotal,
      gorjeta: f.gorjeta_valor,
      total: f.total,
    };
  });

  const resumo = {
    subtotalVendido: round2((fechamentos ?? []).reduce((soma, f) => soma + f.subtotal, 0)),
    gorjetas: round2((fechamentos ?? []).reduce((soma, f) => soma + f.gorjeta_valor, 0)),
    totalRecebido: round2((fechamentos ?? []).reduce((soma, f) => soma + f.total, 0)),
  };

  return {
    resumo,
    porForma: Array.from(porForma.entries()).map(([nome, valor]) => ({ nome, valor })),
    fechamentos: lista,
  };
}
