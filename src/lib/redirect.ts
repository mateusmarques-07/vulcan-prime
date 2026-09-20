// Em dev, o Next.js as vezes normaliza `request.url` pro host "localhost"
// mesmo quando o acesso real veio por outro host (ex: o IP do VPS) - isso
// faz `new URL(path, request.url)` gerar um redirect pro host errado, o
// navegador troca de origem e perde o cookie de sessao (derruba o login).
// O header Host reflete o que o navegador realmente usou pra conectar,
// entao construir a partir dele evita esse problema.
export function redirectUrl(path: string, request: Request) {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return new URL(path, `${proto}://${host}`);
}
