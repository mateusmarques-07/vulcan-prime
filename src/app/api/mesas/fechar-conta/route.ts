import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));

  const supabase = await createClient();
  await supabase.from("mesas").update({ status: "conta" }).eq("numero", Number(numero));

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}/fechamento`, request), 303);
}
