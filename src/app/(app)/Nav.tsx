"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Salão" },
  { href: "/produtos", label: "Produtos" },
  // Entregas escondida do menu (01/10/2026): cliente não vai usar por enquanto.
  // Tela, banco e recibo continuam prontos - pra voltar, é só descomentar.
  // { href: "/entregas", label: "Entregas" },
  { href: "/recebimentos", label: "Recebimentos" },
];

export function Nav({
  logout,
  isGarcom = false,
}: {
  logout: (formData: FormData) => void;
  isGarcom?: boolean;
}) {
  const pathname = usePathname();
  const links = isGarcom ? LINKS.filter((link) => link.href === "/") : LINKS;

  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vulcan Prime" width={36} height={36} className="rounded-full" />
            <span className="text-lg font-black tracking-tight text-orange-500">VULCAN PRIME</span>
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => {
              const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    ativo
                      ? "bg-orange-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isGarcom && (
            <Link
              href="/configuracoes"
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-orange-500 hover:text-orange-500"
            >
              Configurações
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-orange-500 hover:text-orange-500"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
