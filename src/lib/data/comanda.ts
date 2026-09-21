import { createClient } from "@/lib/supabase/server";

export type ItemComanda = {
  id: string;
  produto_id: string | null;
  nome_produto: string;
  preco_unit: number;
  quantidade: number;
  observacao: string | null;
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
    .select("id, produto_id, nome_produto, preco_unit, quantidade, observacao")
    .eq("comanda_id", comandaId)
    .order("criado_em");
  return data ?? [];
}

export async function getCardapio(): Promise<CategoriaCardapio[]> {
  const supabase = await createClient();

  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    supabase.from("categorias").select("id, nome, ordem").order("ordem"),
    supabase.from("produtos").select("id, nome, descricao, preco, categoria_id").eq("ativo", true).order("ordem"),
  ]);

  return (categorias ?? [])
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      produtos: (produtos ?? [])
        .filter((p) => p.categoria_id === categoria.id)
        .map((p) => ({ id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco })),
    }))
    .filter((categoria) => categoria.produtos.length > 0);
}
