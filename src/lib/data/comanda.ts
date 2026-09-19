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
  categoria: string;
  preco: number;
};

export async function getMesaPorNumero(numero: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mesas")
    .select("id, numero, status")
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

export async function getCardapio(): Promise<Record<string, ProdutoCardapio[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos")
    .select("id, nome, categoria, preco")
    .eq("ativo", true)
    .order("ordem");

  const porCategoria: Record<string, ProdutoCardapio[]> = {};
  for (const produto of data ?? []) {
    if (!porCategoria[produto.categoria]) porCategoria[produto.categoria] = [];
    porCategoria[produto.categoria].push(produto);
  }
  return porCategoria;
}
