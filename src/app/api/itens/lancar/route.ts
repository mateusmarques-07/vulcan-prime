import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const comandaId = String(formData.get("comandaId"));
  const produtoId = String(formData.get("produtoId"));
  const numero = String(formData.get("numero"));
  const categoria = String(formData.get("categoria") ?? "");
  // vem do popup de acompanhamentos (Executivos/Rodizio); vazio nos demais
  const acompanhamentos = String(formData.get("acompanhamentos") ?? "").trim();

  const supabase = await createClient();
  await supabase.rpc("lancar_produto_comanda", {
    p_comanda_id: comandaId,
    p_produto_id: produtoId,
    p_acompanhamentos: acompanhamentos || null,
  });

  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
  return NextResponse.redirect(redirectUrl(`/mesa/${numero}${query}`, request), 303);
}
