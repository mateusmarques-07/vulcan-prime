import { createClient } from "@/lib/supabase/server";

export type ItemComanda = {
  id: string;
  produto_id: string | null;
  nome_produto: string;
  preco_unit: number;
  quantidade: number;
  observacao: string | null;
  vai_cozinha: boolean;
  acompanhamentos: string | null;
  enviado_cozinha_em: string | null;
};

export type ProdutoCardapio = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
};

export type CategoriaCardapio = {
  id: string;
  nome: string;
  // > 0: ao lancar, abre o popup pra escolher essa quantidade de
  // acompanhamentos (Executivos = 4, Rodizio = 1)
  qtdAcompanhamentos: number;
  // produtos dessa categoria viram os botoes do popup (Adicionais)
  listaAcompanhamentos: boolean;
  produtos: ProdutoCardapio[];
};

export async function getMesaPorNumero(numero: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mesas")
    .select("id, numero, status, tipo, gorjeta_ativa, gorjeta_pct, qtd_pessoas")
    .eq("numero", numero)
    .single();
  return data;
}

export async function getComandaAbertaDaMesa(mesaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, status")
    .eq("mesa_id", mesaId)
    .eq("status", "aberta")
    .order("aberta_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getItensComanda(comandaId: string): Promise<ItemComanda[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("itens_comanda")
    .select(
      "id, produto_id, nome_produto, preco_unit, quantidade, observacao, vai_cozinha, acompanhamentos, enviado_cozinha_em"
    )
    .eq("comanda_id", comandaId)
    .order("criado_em");
  return data ?? [];
}

export async function getCardapio(): Promise<CategoriaCardapio[]> {
  const supabase = await createClient();

  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nome, ordem, qtd_acompanhamentos, lista_acompanhamentos")
      .order("ordem"),
    supabase.from("produtos").select("id, nome, descricao, preco, categoria_id").eq("ativo", true).order("ordem"),
  ]);

  return (categorias ?? [])
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      qtdAcompanhamentos: categoria.qtd_acompanhamentos,
      listaAcompanhamentos: categoria.lista_acompanhamentos,
      produtos: (produtos ?? [])
        .filter((p) => p.categoria_id === categoria.id)
        .map((p) => ({ id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco })),
    }))
    .filter((categoria) => categoria.produtos.length > 0);
}

// Itens de um envio pra cozinha (todos os itens do mesmo envio tem o mesmo
// enviado_cozinha_em) + qual envio da comanda ele foi (1o, 2o...).
export async function getEnvioCozinha(comandaId: string, enviadoEm: string) {
  const supabase = await createClient();
  const [{ data: itens }, { data: horarios }] = await Promise.all([
    supabase
      .from("itens_comanda")
      .select("id, nome_produto, quantidade, observacao, acompanhamentos, enviado_cozinha_em")
      .eq("comanda_id", comandaId)
      .eq("enviado_cozinha_em", enviadoEm)
      .order("criado_em"),
    supabase
      .from("itens_comanda")
      .select("enviado_cozinha_em")
      .eq("comanda_id", comandaId)
      .not("enviado_cozinha_em", "is", null),
  ]);

  const enviados = new Set((horarios ?? []).map((h) => new Date(h.enviado_cozinha_em).getTime()));
  const alvo = new Date(enviadoEm).getTime();
  const numeroEnvio = [...enviados].filter((t) => t <= alvo).length;

  return { itens: itens ?? [], numeroEnvio };
}
