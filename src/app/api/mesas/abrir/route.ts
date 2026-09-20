import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("abrir_mesa", { p_numero: Number(numero) });
  if (error) throw new Error(error.message);

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}`, request), 303);
}
