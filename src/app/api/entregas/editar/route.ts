import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/format";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const taxaEntrega = round2(Number(formData.get("taxa_entrega")) || 0);
  const formaPagamentoId = String(formData.get("forma_pagamento_id") || "");
  const observacao = String(formData.get("observacao") || "").trim();

  const supabase = await createClient();

  const { data: forma } = await supabase
    .from("formas_pagamento")
    .select("nome")
    .eq("id", formaPagamentoId)
    .single();

  await supabase
    .from("entregas")
    .update({
      taxa_entrega: taxaEntrega,
      forma_pagamento_id: formaPagamentoId,
      forma_pagamento_nome: forma?.nome,
      observacao: observacao || null,
    })
    .eq("numero", Number(numero))
    .neq("status", "finalizada");

  return NextResponse.redirect(redirectUrl(`/entregas?numero=${numero}`, request), 303);
}
