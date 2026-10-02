import { createClient } from "@/lib/supabase/server";
import { inicioFimHojeSaoPaulo } from "@/lib/timezone";
import { round2 } from "@/lib/format";
import type { TipoMesa } from "@/lib/mesa-label";

export type MesaComTotal = {
  id: string;
  numero: number;
  status: "livre" | "ocupada" | "conta";
  tipo: TipoMesa;
  total: number;
};

export async function getSalaoData() {
  const supabase = await createClient();

  // mesas, comandas abertas e recebido hoje não dependem uma da outra -
  // buscadas em paralelo (01/10/2026)
  const { inicio, fim } = inicioFimHojeSaoPaulo();
  const [{ data: mesas }, { data: comandasAbertas }, { data: fechamentosHoje }] =
    await Promise.all([
      supabase
        .from("mesas")
        .select("id, numero, status, tipo, gorjeta_ativa, gorjeta_pct")
        .order("numero"),
      supabase.from("comandas").select("id, mesa_id, aberta_em").eq("status", "aberta"),
      supabase
        .from("fechamentos")
        .select("total")
        .gte("fechado_em", inicio.toISOString())
        .lt("fechado_em", fim.toISOString()),
    ]);

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
  //
  // SEM folga de tempo (22/09/2026, pedido do Mateus): a folga de 60s
  // (depois 10s) existia so por causa do acesso do garcom pelo celular
  // (tempo real escutando mesas/comandas, que cria a corrida). Enquanto o
  // atendimento for por comanda de papel (sem garcom no celular), essa
  // corrida nao existe de verdade - clicou na mesa, nao lancou nada, volta
  // pro Salao, libera na hora (com F5 manual, ja que so itens_comanda esta
  // sendo escutado). Se o acesso do garcom pelo celular voltar a ser usado
  // no futuro, reavaliar se precisa de folga de novo antes de reativar.
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

  const subtotalPorMesa = new Map<string, number>();
  for (const comanda of comandasAbertas ?? []) {
    subtotalPorMesa.set(comanda.mesa_id, totalPorComanda.get(comanda.id) ?? 0);
  }

  const mesasComTotal: MesaComTotal[] = (mesas ?? []).map((mesa) => {
    if (mesaIdsLiberadas.has(mesa.id)) {
      return { ...mesa, status: "livre" as const, total: 0 };
    }
    const subtotal = subtotalPorMesa.get(mesa.id) ?? 0;
    const gorjeta = mesa.gorjeta_ativa ? round2((subtotal * mesa.gorjeta_pct) / 100) : 0;
    return { ...mesa, total: round2(subtotal + gorjeta) };
  });

  const ocupadas = mesasComTotal.filter((m) => m.status !== "livre").length;
  const emAberto = mesasComTotal.reduce((soma, m) => soma + m.total, 0);

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
