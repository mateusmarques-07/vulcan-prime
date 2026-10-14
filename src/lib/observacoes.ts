import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Grava as observacoes que vieram junto no form (campos "obs_<itemId>",
// ver FormComObservacoes) - so de itens dessa comanda.
export async function salvarObservacoesDoForm(
  supabase: Supabase,
  formData: FormData,
  comandaId: string
) {
  const atualizacoes = [...formData.entries()]
    .filter(([chave]) => chave.startsWith("obs_"))
    .map(([chave, valor]) =>
      supabase
        .from("itens_comanda")
        .update({ observacao: String(valor).trim() || null })
        .eq("id", chave.slice(4))
        .eq("comanda_id", comandaId)
    );
  await Promise.all(atualizacoes);
}
