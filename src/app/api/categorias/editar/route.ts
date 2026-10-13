import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const ordem = Number(formData.get("ordem")) || 0;
  // configuracoes da cozinha (13/10/2026) - checkbox desmarcado nao vem no form
  const vai_cozinha = formData.get("vai_cozinha") === "on";
  const qtd_acompanhamentos = Math.max(0, Number(formData.get("qtd_acompanhamentos")) || 0);
  const lista_acompanhamentos = formData.get("lista_acompanhamentos") === "on";
  const config = { vai_cozinha, qtd_acompanhamentos, lista_acompanhamentos };

  if (nome) {
    const supabase = await createClient();
    await supabase.from("categorias").update({ nome, ordem, ...config }).eq("id", id);
  }

  return NextResponse.redirect(redirectUrl("/produtos/categorias", request), 303);
}
