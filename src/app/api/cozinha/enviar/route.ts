import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { salvarObservacoesDoForm } from "@/lib/observacoes";

// Marca a comida pendente da comanda como enviada e abre o papel da
// cozinha (que imprime sozinho e volta pra comanda). A mesa continua
// ocupada - da pra lancar mais e enviar de novo quantas vezes precisar.
export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const comandaId = String(formData.get("comandaId"));

  const supabase = await createClient();
  if (comandaId) await salvarObservacoesDoForm(supabase, formData, comandaId);
  const { data: enviadoEm } = await supabase.rpc("enviar_cozinha", { p_comanda_id: comandaId });

  if (!enviadoEm) {
    return NextResponse.redirect(redirectUrl(`/mesa/${numero}`, request), 303);
  }

  const params = new URLSearchParams({ em: String(enviadoEm) });
  return NextResponse.redirect(redirectUrl(`/cozinha/${numero}?${params}`, request), 303);
}
