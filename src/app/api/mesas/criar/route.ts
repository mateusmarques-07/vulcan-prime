import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

const VOLTAR = "/configuracoes/mesas";
// Balcao usa o numero 99 (migration 0014) - mesas numeradas param antes dele.
const NUMERO_BALCAO = 99;

function erroRedirect(request: Request, mensagem: string) {
  return NextResponse.redirect(
    redirectUrl(`${VOLTAR}?erro=${encodeURIComponent(mensagem)}`, request),
    303
  );
}

// Cria a proxima mesa da sequencia. Se essa mesa ja existiu e foi removida
// (desativada), so reativa - o numero e unico na tabela.
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: ultima } = await supabase
    .from("mesas")
    .select("numero")
    .eq("tipo", "mesa")
    .eq("ativa", true)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const proximo = (ultima?.numero ?? 0) + 1;
  if (proximo >= NUMERO_BALCAO) {
    return erroRedirect(request, "Limite de mesas atingido.");
  }

  const { data: existente } = await supabase
    .from("mesas")
    .select("id")
    .eq("numero", proximo)
    .maybeSingle();

  const { error } = existente
    ? await supabase
        .from("mesas")
        .update({ ativa: true, status: "livre", gorjeta_ativa: false, gorjeta_pct: 10, qtd_pessoas: null })
        .eq("id", existente.id)
    : await supabase.from("mesas").insert({ numero: proximo, tipo: "mesa" });

  if (error) return erroRedirect(request, "Não foi possível criar a mesa. Tente de novo.");

  return NextResponse.redirect(redirectUrl(VOLTAR, request), 303);
}
