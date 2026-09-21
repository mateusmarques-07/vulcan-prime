import { createClient } from "@/lib/supabase/server";

const AUTH_EMAIL_DOMAIN = "vulcanprime.local";

export function toAuthEmail(usuario: string) {
  const trimmed = usuario.trim();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${AUTH_EMAIL_DOMAIN}`;
}

// "garcom" = acesso restrito (só Salão e Comanda, ver middleware.ts).
// Qualquer outro valor (ou ausente, caso dos logins criados antes dessa
// mudança) continua com acesso total - comportamento de sempre.
export async function getPapelUsuario(): Promise<"garcom" | "caixa"> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.user_metadata?.papel === "garcom" ? "garcom" : "caixa";
}
