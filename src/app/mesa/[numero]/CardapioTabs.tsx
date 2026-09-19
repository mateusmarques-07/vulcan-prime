"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import type { ProdutoCardapio } from "@/lib/data/comanda";

export function CardapioTabs({
  cardapio,
  comandaId,
  numero,
  categoriaInicial,
}: {
  cardapio: Record<string, ProdutoCardapio[]>;
  comandaId: string;
  numero: number;
  categoriaInicial?: string;
}) {
  const categorias = Object.keys(cardapio).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const [ativa, setAtiva] = useState(
    categoriaInicial && cardapio[categoriaInicial] ? categoriaInicial : categorias[0] ?? ""
  );

  if (categorias.length === 0) {
    return <p className="text-neutral-500">Nenhum produto cadastrado ainda.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            type="button"
            onClick={() => setAtiva(categoria)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              ativa === categoria
                ? "border-orange-500 bg-orange-600 text-white"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cardapio[ativa]?.map((produto) => (
          <form key={produto.id} method="POST" action="/api/itens/lancar">
            <input type="hidden" name="comandaId" value={comandaId} />
            <input type="hidden" name="produtoId" value={produto.id} />
            <input type="hidden" name="numero" value={numero} />
            <input type="hidden" name="categoria" value={ativa} />
            <button
              type="submit"
              className="flex w-full flex-col items-start gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-left transition hover:border-orange-500"
            >
              <span className="font-medium text-white">{produto.nome}</span>
              <span className="text-orange-400">{formatBRL(produto.preco)}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
