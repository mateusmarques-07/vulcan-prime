import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const itemId = String(formData.get("itemId"));
  const numero = String(formData.get("numero"));

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("itens_comanda")
    .select("quantidade")
    .eq("id", itemId)
    .single();

  if (item) {
    if (item.quantidade <= 1) {
      await supabase.from("itens_comanda").delete().eq("id", itemId);
    } else {
      await supabase
        .from("itens_comanda")
        .update({ quantidade: item.quantidade - 1 })
        .eq("id", itemId);
    }
  }

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}`, request), 303);
}
