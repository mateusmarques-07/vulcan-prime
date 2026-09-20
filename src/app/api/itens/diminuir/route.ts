import { NextResponse } from "next/server";
import { redirectUrl } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const itemId = String(formData.get("itemId"));
  const numero = String(formData.get("numero"));

  const supabase = await createClient();
  await supabase.rpc("ajustar_quantidade_item", { p_item_id: itemId, p_delta: -1 });

  return NextResponse.redirect(redirectUrl(`/mesa/${numero}`, request), 303);
}
