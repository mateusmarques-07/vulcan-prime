import { createClient } from "@/lib/supabase/server";

export type StatusEntrega = "aberta" | "em_rota" | "finalizada";

export type EntregaResumo = {
  id: string;
  numero: number;
  cliente_nome: string;
  endereco: string;
  status: Exclude<StatusEntrega, "finalizada">;
  total: number;
  aberta_em: string;
};

export type ItemEntrega = {
  id: string;
  produto_id: string | null;
  nome_produto: string;
  preco_unit: number;
  quantidade: number;
};

export type EntregaDetalhe = {
  id: string;
  numero: number;
  cliente_nome: string;
  endereco: string;
  taxa_entrega: number;
  forma_pagamento_id: string;
  forma_pagamento_nome: string;
  observacao: string | null;
  status: StatusEntrega;
  aberta_em: string;
  finalizada_em: string | null;
  itens: ItemEntrega[];
  subtotal: number;
  total: number;
};

export type EntregaHistorico = {
  id: string;
  numero: number;
  cliente_nome: string;
  forma_pagamento_nome: string;
  total: number;
  finalizada_em: string;
};

export async function getEntregasAtivas(): Promise<EntregaResumo[]> {
  const supabase = await createClient();

  const { data: entregas } = await supabase
    .from("entregas")
    .select("id, numero, cliente_nome, endereco, status, taxa_entrega, aberta_em")
    .neq("status", "finalizada")
    .order("numero");

  const ids = (entregas ?? []).map((e) => e.id);

  const { data: itens } =
    ids.length > 0
      ? await supabase
          .from("entrega_itens")
          .select("entrega_id, preco_unit, quantidade")
          .in("entrega_id", ids)
      : { data: [] };

  const subtotalPorEntrega = new Map<string, number>();
  for (const item of itens ?? []) {
    const atual = subtotalPorEntrega.get(item.entrega_id) ?? 0;
    subtotalPorEntrega.set(item.entrega_id, atual + item.preco_unit * item.quantidade);
  }

  return (entregas ?? []).map((e) => ({
    id: e.id,
    numero: e.numero,
    cliente_nome: e.cliente_nome,
    endereco: e.endereco,
    status: e.status,
    total: (subtotalPorEntrega.get(e.id) ?? 0) + e.taxa_entrega,
    aberta_em: e.aberta_em,
  }));
}

export async function getEntregaPorNumero(numero: number): Promise<EntregaDetalhe | null> {
  const supabase = await createClient();

  const { data: entrega } = await supabase
    .from("entregas")
    .select(
      "id, numero, cliente_nome, endereco, taxa_entrega, forma_pagamento_id, forma_pagamento_nome, observacao, status, aberta_em, finalizada_em"
    )
    .eq("numero", numero)
    .maybeSingle();

  if (!entrega) return null;

  const { data: itens } = await supabase
    .from("entrega_itens")
    .select("id, produto_id, nome_produto, preco_unit, quantidade")
    .eq("entrega_id", entrega.id);

  const subtotal = (itens ?? []).reduce((soma, i) => soma + i.preco_unit * i.quantidade, 0);

  return {
    ...entrega,
    itens: itens ?? [],
    subtotal,
    total: subtotal + entrega.taxa_entrega,
  };
}

export async function getHistoricoEntregas(): Promise<EntregaHistorico[]> {
  const supabase = await createClient();

  const { data: entregas } = await supabase
    .from("entregas")
    .select("id, numero, cliente_nome, forma_pagamento_nome, taxa_entrega, finalizada_em")
    .eq("status", "finalizada")
    .order("finalizada_em", { ascending: false });

  const ids = (entregas ?? []).map((e) => e.id);

  const { data: itens } =
    ids.length > 0
      ? await supabase
          .from("entrega_itens")
          .select("entrega_id, preco_unit, quantidade")
          .in("entrega_id", ids)
      : { data: [] };

  const subtotalPorEntrega = new Map<string, number>();
  for (const item of itens ?? []) {
    const atual = subtotalPorEntrega.get(item.entrega_id) ?? 0;
    subtotalPorEntrega.set(item.entrega_id, atual + item.preco_unit * item.quantidade);
  }

  return (entregas ?? []).map((e) => ({
    id: e.id,
    numero: e.numero,
    cliente_nome: e.cliente_nome,
    forma_pagamento_nome: e.forma_pagamento_nome,
    total: (subtotalPorEntrega.get(e.id) ?? 0) + e.taxa_entrega,
    finalizada_em: e.finalizada_em,
  }));
}
