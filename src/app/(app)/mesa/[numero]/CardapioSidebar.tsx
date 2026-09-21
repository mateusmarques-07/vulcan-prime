"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import type { CategoriaCardapio } from "@/lib/data/comanda";

export function CardapioSidebar({
  cardapio,
  comandaId,
  numero,
  categoriaInicial,
}: {
  cardapio: CategoriaCardapio[];
  comandaId: string;
  numero: number;
  categoriaInicial?: string;
}) {
  const [ativaId, setAtivaId] = useState(
    cardapio.find((c) => c.id === categoriaInicial)?.id ?? cardapio[0]?.id ?? ""
  );

  if (cardapio.length === 0) {
    return <p className="text-neutral-500">Nenhum produto cadastrado ainda.</p>;
  }

  const categoriaAtiva = cardapio.find((c) => c.id === ativaId) ?? cardapio[0];

  return (
    <div className="flex gap-4">
      <nav className="flex w-36 shrink-0 flex-col gap-1">
        {cardapio.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            onClick={() => setAtivaId(categoria.id)}
            className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              categoria.id === categoriaAtiva.id
                ? "bg-orange-600 text-white"
                : "border border-neutral-800 text-neutral-300 hover:border-neutral-600"
            }`}
          >
            {categoria.nome}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 flex-col gap-2">
        {categoriaAtiva.produtos.map((produto) => (
          <form key={produto.id} method="POST" action="/api/itens/lancar">
            <input type="hidden" name="comandaId" value={comandaId} />
            <input type="hidden" name="produtoId" value={produto.id} />
            <input type="hidden" name="numero" value={numero} />
            <input type="hidden" name="categoria" value={categoriaAtiva.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left transition hover:border-orange-500"
            >
              <span className="flex flex-col">
                <span className="text-base font-semibold text-white">{produto.nome}</span>
                {produto.descricao && (
                  <span className="mt-0.5 text-xs text-neutral-400">{produto.descricao}</span>
                )}
              </span>
              <span className="shrink-0 font-medium text-orange-400">{formatBRL(produto.preco)}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
