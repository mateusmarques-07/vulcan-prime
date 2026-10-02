import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Papel "garcom" (ver scripts/criar-usuario.mjs) só pode ver Salão e a
// Comanda de uma mesa - nada de Fechar conta, Produtos, Entregas,
// Recebimentos ou Configurações. Sem esse papel no login (caso de todo
// login criado antes dessa mudança), a rota abaixo nem é consultada.
const APIS_PERMITIDAS_GARCOM = new Set([
  "/api/mesas/abrir",
  "/api/itens/lancar",
  "/api/itens/aumentar",
  "/api/itens/diminuir",
  "/api/itens/remover",
  "/api/itens/observacao",
]);

function permitidoParaGarcom(pathname: string) {
  if (pathname === "/" || pathname === "/login") return true;
  if (/^\/mesa\/\d+$/.test(pathname)) return true;
  return APIS_PERMITIDAS_GARCOM.has(pathname);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() valida o login localmente (chave ES256 do projeto), sem ir
  // ao Supabase Auth a cada tela como o getUser() fazia - 01/10/2026.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user?.user_metadata?.papel === "garcom" && !permitidoParaGarcom(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
