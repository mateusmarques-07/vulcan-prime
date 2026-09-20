import { createClient } from "@/lib/supabase/server";

export type FormaPagamento = {
  id: string;
  nome: string;
  ativo: boolean;
};

export async function getFormasPagamentoAtivas(): Promise<FormaPagamento[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formas_pagamento")
    .select("id, nome, ativo")
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
}

export async function getFormasPagamentoTodas(): Promise<FormaPagamento[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formas_pagamento")
    .select("id, nome, ativo")
    .order("nome");
  return data ?? [];
}
