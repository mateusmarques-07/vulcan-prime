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
  // getClaims(): mesma validação local do middleware, sem ida ao Supabase Auth
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.user_metadata?.papel === "garcom" ? "garcom" : "caixa";
}
