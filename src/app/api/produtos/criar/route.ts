import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const preco = Number(formData.get("preco")) || 0;

  if (nome && categoriaId) {
    const supabase = await createClient();

    // ordem e' automatica: proximo numero dentro da propria categoria,
    // ninguem precisa digitar isso na hora de cadastrar
    const { data: ultimoDaCategoria } = await supabase
      .from("produtos")
      .select("ordem")
      .eq("categoria_id", categoriaId)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ordem = (ultimoDaCategoria?.ordem ?? 0) + 1;

    await supabase.from("produtos").insert({
      nome,
      categoria_id: categoriaId,
      preco,
      ordem,
    });
  }

  return NextResponse.redirect(redirectUrl("/produtos", request), 303);
}
