import { createClient } from "@/lib/supabase/server";

export type Categoria = {
  id: string;
  nome: string;
  ordem: number;
  totalProdutos: number;
};

export async function getCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, ordem")
    .order("ordem");

  const { data: produtos } = await supabase.from("produtos").select("categoria_id");

  const contagem = new Map<string, number>();
  for (const produto of produtos ?? []) {
    contagem.set(produto.categoria_id, (contagem.get(produto.categoria_id) ?? 0) + 1);
  }

  return (categorias ?? []).map((categoria) => ({
    ...categoria,
    totalProdutos: contagem.get(categoria.id) ?? 0,
  }));
}

export async function getCategoriasParaSelect() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("id, nome").order("ordem");
  return data ?? [];
}
