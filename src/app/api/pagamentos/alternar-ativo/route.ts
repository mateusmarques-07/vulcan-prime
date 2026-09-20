import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const novoAtivo = String(formData.get("ativo")) === "true";

  const supabase = await createClient();

  if (!novoAtivo) {
    const { count } = await supabase
      .from("formas_pagamento")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true);

    if ((count ?? 0) <= 1) {
      const mensagem =
        "Não é possível desativar essa forma de pagamento porque ela é a última ativa. O sistema precisa ter pelo menos uma forma de pagamento disponível pra fechar contas.";
      return NextResponse.redirect(
        redirectUrl(`/pagamentos?erro=${encodeURIComponent(mensagem)}`, request),
        303
      );
    }
  }

  await supabase.from("formas_pagamento").update({ ativo: novoAtivo }).eq("id", id);

  return NextResponse.redirect(redirectUrl("/pagamentos", request), 303);
}
