import { createClient } from "@/lib/supabase/server";

export type ProdutoAdmin = {
  id: string;
  nome: string;
  preco: number;
  ordem: number;
  ativo: boolean;
  categoria_id: string;
  categoria_nome: string;
};

export async function getProdutosAdmin(): Promise<ProdutoAdmin[]> {
  const supabase = await createClient();

  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, preco, ordem, ativo, categoria_id")
    .order("ordem");

  const { data: categorias } = await supabase.from("categorias").select("id, nome");
  const nomePorId = new Map((categorias ?? []).map((c) => [c.id, c.nome]));

  return (produtos ?? []).map((produto) => ({
    ...produto,
    categoria_nome: nomePorId.get(produto.categoria_id) ?? "—",
  }));
}
