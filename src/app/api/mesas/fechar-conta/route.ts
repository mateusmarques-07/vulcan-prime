import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const comandaId = String(formData.get("comandaId") ?? "");
  const confirmado = String(formData.get("confirmado") ?? "") === "1";

  const supabase = await createClient();

  // Comida que ainda nao foi pro papel da cozinha: pergunta antes de fechar
  // (13/10/2026) - evita a mesa pagar algo que a cozinha nunca recebeu.
  if (!confirmado && comandaId) {
    const { count } = await supabase
      .from("itens_comanda")
      .select("id", { count: "exact", head: true })
      .eq("comanda_id", comandaId)
      .eq("vai_cozinha", true)
      .is("enviado_cozinha_em", null);
    if (count && count > 0) {
      return NextResponse.redirect(redirectUrl(`/mesa/${numero}?aviso=cozinha`, request), 303);
    }
  }

  await supabase.from("mesas").update({ status: "conta" }).eq("numero", Number(numero));

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}/fechamento`, request), 303);
}
