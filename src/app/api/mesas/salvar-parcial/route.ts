import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Salva gorjeta/pessoas/taxa de entrega assim que o operador muda algum
// desses campos na tela de fechamento - nao depende de clicar em "Imprimir
// recibo" pra sobreviver a espera do garcom/entregador voltar com o
// pagamento. Chamado via fetch em segundo plano (sem navegar a pagina).
export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const gorjetaAtiva = String(formData.get("gorjetaAtiva")) === "true";
  const gorjetaPct = Number(formData.get("gorjetaPct")) || 0;
  const pessoasRaw = String(formData.get("pessoas") || "");
  const qtdPessoas = pessoasRaw ? Number(pessoasRaw) : null;
  const taxaEntregaRaw = String(formData.get("taxaEntrega") || "");
  const taxaEntrega = taxaEntregaRaw ? Number(taxaEntregaRaw) || 0 : 0;

  const supabase = await createClient();
  await supabase
    .from("mesas")
    .update({
      gorjeta_ativa: gorjetaAtiva,
      gorjeta_pct: gorjetaPct,
      qtd_pessoas: qtdPessoas,
      taxa_entrega: taxaEntrega,
    })
    .eq("numero", Number(numero));

  return NextResponse.json({ ok: true });
}
