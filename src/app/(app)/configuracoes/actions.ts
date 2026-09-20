"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function alterarSenha(formData: FormData) {
  const novaSenha = String(formData.get("novaSenha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (novaSenha.length < 6) {
    redirect(
      `/configuracoes?erro=${encodeURIComponent("A senha precisa ter pelo menos 6 caracteres.")}`
    );
  }

  if (novaSenha !== confirmar) {
    redirect(`/configuracoes?erro=${encodeURIComponent("As senhas digitadas não coincidem.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    redirect(`/configuracoes?erro=${encodeURIComponent(error.message)}`);
  }

  redirect("/configuracoes?sucesso=1");
}
