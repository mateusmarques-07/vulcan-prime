import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { rotuloMesa } from "@/lib/mesa-label";

const VOLTAR = "/configuracoes/mesas";

function erroRedirect(request: Request, mensagem: string) {
  return NextResponse.redirect(
    redirectUrl(`${VOLTAR}?erro=${encodeURIComponent(mensagem)}`, request),
    303
  );
}

// Remove sempre a ULTIMA mesa, e so se estiver livre. Nao apaga: desativa
// (ativa = false), porque comandas antigas apontam pra ela.
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: mesas } = await supabase
    .from("mesas")
    .select("id, numero, status")
    .eq("tipo", "mesa")
    .eq("ativa", true)
    .order("numero", { ascending: false })
    .limit(2);

  const ultima = mesas?.[0];
  if (!ultima) return erroRedirect(request, "Não há mesa para remover.");
  if ((mesas?.length ?? 0) < 2) {
    return erroRedirect(request, "O Salão precisa ter pelo menos 1 mesa.");
  }

  const rotulo = rotuloMesa("mesa", ultima.numero);
  if (ultima.status !== "livre") {
    return erroRedirect(request, `A ${rotulo} está em uso. Feche a conta dela antes de remover.`);
  }

  const { count: comandasAbertas } = await supabase
    .from("comandas")
    .select("id", { count: "exact", head: true })
    .eq("mesa_id", ultima.id)
    .eq("status", "aberta");
  if (comandasAbertas) {
    return erroRedirect(request, `A ${rotulo} tem uma comanda aberta. Feche a conta dela antes de remover.`);
  }

  const { error } = await supabase.from("mesas").update({ ativa: false }).eq("id", ultima.id);
  if (error) return erroRedirect(request, "Não foi possível remover a mesa. Tente de novo.");

  return NextResponse.redirect(redirectUrl(VOLTAR, request), 303);
}
