import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

// Alem de abrir o recibo, salva a gorjeta/pessoas escolhidas na mesa -
// assim, se o garcom demorar pra voltar com o pagamento e o operador sair e
// voltar pra essa tela, a escolha continua la (nao precisa refazer tudo).
export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const gorjetaAtiva = String(formData.get("gorjetaAtiva")) === "true";
  const gorjetaPct = Number(formData.get("gorjetaPct")) || 0;
  const pessoasRaw = String(formData.get("pessoas") || "");
  const qtdPessoas = pessoasRaw ? Number(pessoasRaw) : null;

  const supabase = await createClient();
  await supabase
    .from("mesas")
    .update({
      gorjeta_ativa: gorjetaAtiva,
      gorjeta_pct: gorjetaPct,
      qtd_pessoas: qtdPessoas,
    })
    .eq("numero", Number(numero));

  const params = new URLSearchParams({
    gorjetaPct: String(gorjetaPct),
    pessoas: pessoasRaw,
  });

  return NextResponse.redirect(redirectUrl(`/recibo/${numero}?${params}`, request), 303);
}
