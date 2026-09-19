const AUTH_EMAIL_DOMAIN = "vulcanprime.local";

export function toAuthEmail(usuario: string) {
  const trimmed = usuario.trim();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${AUTH_EMAIL_DOMAIN}`;
}
