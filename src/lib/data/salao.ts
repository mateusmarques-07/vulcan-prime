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

  const { data: mesas } = await supabase
    .from("mesas")
    .select("id, numero, status, tipo, gorjeta_ativa, gorjeta_pct")
    .order("numero");

  const { data: comandasAbertas } = await supabase
    .from("comandas")
    .select("id, mesa_id, aberta_em")
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
  //
  // Folga (21/09/2026): sem isso, uma mesa que acabou de ser aberta (ainda
  // sem o 1o item) podia ser apagada por essa limpeza rodando por causa de
  // tempo real disparado por QUALQUER outra mesa - o garcom abre a mesa,
  // antes de escolher o produto alguem mexe em outra comanda, o Salao
  // atualiza sozinho, a limpeza varre tudo e derruba a mesa que acabou de
  // abrir. A folga da tempo pro primeiro item chegar antes da comanda ser
  // considerada "esquecida vazia" de verdade.
  // REVERTIDO 22/09/2026: chegou a ir pra 10s + Salao escutando
  // mesas/comandas tambem (nao so itens_comanda), mas isso gerou refresh
  // demais e bateu rate limit (429) do Supabase em uso real. Voltou pro
  // estado estavel: 60s, Salao só escuta itens_comanda (mesa vazia só
  // libera na tela depois de F5 manual, nao mais sozinha ao vivo).
  const AGORA = Date.now();
  const FOLGA_MESA_VAZIA_MS = 60_000;
  const comandasVazias = (comandasAbertas ?? []).filter(
    (c) =>
      !totalPorComanda.has(c.id) &&
      AGORA - new Date(c.aberta_em).getTime() > FOLGA_MESA_VAZIA_MS
  );
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
