import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const itemId = String(formData.get("itemId"));
  const numero = String(formData.get("numero"));
  const observacao = String(formData.get("observacao") ?? "").trim();

  const supabase = await createClient();
  await supabase
    .from("itens_comanda")
    .update({ observacao: observacao || null })
    .eq("id", itemId);

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}`, request), 303);
}
