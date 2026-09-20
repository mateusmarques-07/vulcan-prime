import { createClient } from "@/lib/supabase/server";
import { inicioFimHojeSaoPaulo } from "@/lib/timezone";

export type MesaComTotal = {
  id: string;
  numero: number;
  status: "livre" | "ocupada" | "conta";
  total: number;
};

export async function getSalaoData() {
  const supabase = await createClient();

  const { data: mesas } = await supabase
    .from("mesas")
    .select("id, numero, status")
    .order("numero");

  const { data: comandasAbertas } = await supabase
    .from("comandas")
    .select("id, mesa_id")
    .eq("status", "aberta");

  const comandaIds = (comandasAbertas ?? []).map((c) => c.id);

  const { data: itens } =
    comandaIds.length > 0
      ? await supabase
          .from("itens_comanda")
          .select("comanda_id, preco_unit, quantidade")
          .in("comanda_id", comandaIds)
      : { data: [] };

  const totalPorComanda = new Map<string, number>();
  for (const item of itens ?? []) {
    const atual = totalPorComanda.get(item.comanda_id) ?? 0;
    totalPorComanda.set(item.comanda_id, atual + item.preco_unit * item.quantidade);
  }

  // Mesa aberta sem nenhum item (abriu por engano e nao lancou nada) libera
  // sozinha - decisao de 20/09/2026, apos teste real. Reaproveita os dados
  // ja buscados acima em vez de fazer consultas extras.
  const comandasVazias = (comandasAbertas ?? []).filter((c) => !totalPorComanda.has(c.id));
  if (comandasVazias.length > 0) {
    await supabase
      .from("comandas")
      .delete()
      .in("id", comandasVazias.map((c) => c.id));
    await supabase
      .from("mesas")
      .update({ status: "livre", gorjeta_ativa: false, gorjeta_pct: 10, qtd_pessoas: null })
      .in("id", comandasVazias.map((c) => c.mesa_id));
  }
  const mesaIdsLiberadas = new Set(comandasVazias.map((c) => c.mesa_id));

  const totalPorMesa = new Map<string, number>();
  for (const comanda of comandasAbertas ?? []) {
    totalPorMesa.set(comanda.mesa_id, totalPorComanda.get(comanda.id) ?? 0);
  }

  const mesasComTotal: MesaComTotal[] = (mesas ?? []).map((mesa) => ({
    ...mesa,
    status: mesaIdsLiberadas.has(mesa.id) ? "livre" : mesa.status,
    total: mesaIdsLiberadas.has(mesa.id) ? 0 : (totalPorMesa.get(mesa.id) ?? 0),
  }));

  const ocupadas = mesasComTotal.filter((m) => m.status !== "livre").length;
  const emAberto = mesasComTotal.reduce((soma, m) => soma + m.total, 0);

  const { inicio, fim } = inicioFimHojeSaoPaulo();
  const { data: fechamentosHoje } = await supabase
    .from("fechamentos")
    .select("total")
    .gte("fechado_em", inicio.toISOString())
    .lt("fechado_em", fim.toISOString());

  const recebidoHoje = (fechamentosHoje ?? []).reduce((soma, f) => soma + f.total, 0);

  return {
    mesas: mesasComTotal,
    resumo: {
      ocupadas,
      totalMesas: mesasComTotal.length,
      emAberto,
      recebidoHoje,
    },
  };
}
