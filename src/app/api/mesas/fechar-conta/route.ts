import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));

  const supabase = await createClient();
  await supabase.from("mesas").update({ status: "conta" }).eq("numero", Number(numero));

  return NextResponse.redirect(new URL(`/mesa/${numero}/fechamento`, request.url), 303);
}
