"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toAuthEmail } from "@/lib/auth";

export async function login(formData: FormData) {
  const usuario = String(formData.get("usuario") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(usuario),
    password: senha,
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent("Usuário ou senha inválidos")}`);
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
