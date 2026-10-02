import { createClient } from "@/lib/supabase/server";

// Mesas numeradas ativas, em ordem - usado pelo cadastro em Configuracoes.
// O Balcao (tipo "balcao") fica de fora: nao pode ser criado nem removido.
export async function getMesasAtivas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mesas")
    .select("id, numero, status")
    .eq("tipo", "mesa")
    .eq("ativa", true)
    .order("numero");
  return data ?? [];
}
