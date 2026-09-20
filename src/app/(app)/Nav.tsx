"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Salão" },
  { href: "/produtos", label: "Produtos" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/recebimentos", label: "Recebimentos" },
];

export function Nav({ logout }: { logout: (formData: FormData) => void }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-8">
          <span className="text-lg font-black tracking-tight text-orange-500">VULCAN PRIME</span>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
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
          <Link
            href="/configuracoes"
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-orange-500 hover:text-orange-500"
          >
            Configurações
          </Link>
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
