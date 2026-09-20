import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id"));
  const novoAtivo = String(formData.get("ativo")) === "true";

  const supabase = await createClient();
  await supabase.from("produtos").update({ ativo: novoAtivo }).eq("id", id);

  return NextResponse.redirect(redirectUrl("/produtos", request), 303);
}
