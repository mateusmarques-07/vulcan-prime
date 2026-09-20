import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/format";
import type { TipoMesa } from "@/lib/mesa-label";

export type TipoFechamento = TipoMesa | "entrega";

export type FechamentoResumo = {
  id: string;
  fechado_em: string;
  tipo: TipoFechamento;
  mesaNumero: number | null;
  entregaNumero: number | null;
  formaTexto: string;
  subtotal: number;
  gorjeta: number;
  taxaEntrega: number;
  total: number;
};

export async function getRecebimentos(
  inicio: Date,
  fim: Date,
  filtros: { forma?: string; tipo?: string } = {}
) {
  const supabase = await createClient();

  const { data: fechamentos } = await supabase
    .from("fechamentos")
    .select("id, tipo, mesa_numero, subtotal, gorjeta_valor, taxa_entrega, total, fechado_em")
    .gte("fechado_em", inicio.toISOString())
    .lt("fechado_em", fim.toISOString())
    .order("fechado_em", { ascending: false });

  const idsTodos = (fechamentos ?? []).map((f) => f.id);

  const { data: entregas } =
    idsTodos.length > 0
      ? await supabase.from("entregas").select("numero, fechamento_id").in("fechamento_id", idsTodos)
      : { data: [] };
  const entregaNumeroPorFechamento = new Map((entregas ?? []).map((e) => [e.fechamento_id, e.numero]));

  const { data: pagamentos } =
    idsTodos.length > 0
      ? await supabase
          .from("fechamento_pagamentos")
          .select("fechamento_id, forma_pagamento_nome, valor")
          .in("fechamento_id", idsTodos)
      : { data: [] };

  const pagamentosPorFechamento = new Map<string, { nome: string; valor: number }[]>();
  const formasPorFechamento = new Map<string, Set<string>>();
  for (const pagamento of pagamentos ?? []) {
    const lista = pagamentosPorFechamento.get(pagamento.fechamento_id) ?? [];
    lista.push({ nome: pagamento.forma_pagamento_nome, valor: pagamento.valor });
    pagamentosPorFechamento.set(pagamento.fechamento_id, lista);

    const formas = formasPorFechamento.get(pagamento.fechamento_id) ?? new Set<string>();
    formas.add(pagamento.forma_pagamento_nome);
    formasPorFechamento.set(pagamento.fechamento_id, formas);
  }

  // Os filtros (tipo e forma) valem pra tela inteira - cards do topo, "por
  // forma" e a lista individual - em vez de cada um mexer só numa parte,
  // que confundia (pedido do Mateus, 20/09/2026). Um fechamento entra no
  // filtro de forma se ALGUMA das formas usadas nele bater (pagamento
  // dividido conta inteiro, não rateado).
  const fechamentosFiltrados = (fechamentos ?? []).filter((f) => {
    if (filtros.tipo && f.tipo !== filtros.tipo) return false;
    if (filtros.forma && !formasPorFechamento.get(f.id)?.has(filtros.forma)) return false;
    return true;
  });
  const idsFiltrados = new Set(fechamentosFiltrados.map((f) => f.id));

  const porForma = new Map<string, number>();
  for (const pagamento of pagamentos ?? []) {
    if (!idsFiltrados.has(pagamento.fechamento_id)) continue;
    porForma.set(
      pagamento.forma_pagamento_nome,
      round2((porForma.get(pagamento.forma_pagamento_nome) ?? 0) + pagamento.valor)
    );
  }

  const lista: FechamentoResumo[] = fechamentosFiltrados.map((f) => {
    const formaTexto = (pagamentosPorFechamento.get(f.id) ?? [])
      .map((p) => `${p.nome} R$ ${p.valor.toFixed(2).replace(".", ",")}`)
      .join(" + ");
    return {
      id: f.id,
      fechado_em: f.fechado_em,
      tipo: f.tipo,
      mesaNumero: f.mesa_numero,
      entregaNumero: entregaNumeroPorFechamento.get(f.id) ?? null,
      formaTexto,
      subtotal: f.subtotal,
      gorjeta: f.gorjeta_valor,
      taxaEntrega: f.taxa_entrega,
      total: f.total,
    };
  });

  const resumo = {
    subtotalVendido: round2(fechamentosFiltrados.reduce((soma, f) => soma + f.subtotal, 0)),
    gorjetas: round2(fechamentosFiltrados.reduce((soma, f) => soma + f.gorjeta_valor, 0)),
    taxaEntrega: round2(fechamentosFiltrados.reduce((soma, f) => soma + f.taxa_entrega, 0)),
    totalRecebido: round2(fechamentosFiltrados.reduce((soma, f) => soma + f.total, 0)),
  };

  return {
    resumo,
    porForma: Array.from(porForma.entries()).map(([nome, valor]) => ({ nome, valor })),
    fechamentos: lista,
  };
}
