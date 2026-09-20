import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const numero = String(formData.get("numero"));
  const status = String(formData.get("status"));

  const supabase = await createClient();

  if (status === "finalizada") {
    const { data: entrega } = await supabase
      .from("entregas")
      .select("id")
      .eq("numero", Number(numero))
      .single();

    if (entrega) {
      const { error } = await supabase.rpc("finalizar_entrega", { p_entrega_id: entrega.id });
      if (error) throw new Error(error.message);
    }
  } else {
    await supabase.from("entregas").update({ status }).eq("numero", Number(numero));
  }

  return NextResponse.redirect(redirectUrl(`/entregas?numero=${numero}`, request), 303);
}
