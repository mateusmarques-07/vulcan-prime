"use client";

import { useState } from "react";
import { formatBRL, formatarInputMoeda, round2 } from "@/lib/format";
import type { CategoriaCardapio } from "@/lib/data/comanda";
import type { FormaPagamento } from "@/lib/data/pagamentos";

export function NovaEntregaForm({
  cardapio,
  formas,
}: {
  cardapio: CategoriaCardapio[];
  formas: FormaPagamento[];
}) {
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [taxaEntrega, setTaxaEntrega] = useState("5.00");

  const precoPorProduto = new Map(
    cardapio.flatMap((c) => c.produtos.map((p) => [p.id, p.preco] as const))
  );

  const subtotal = round2(
    Object.entries(quantidades).reduce((soma, [produtoId, qtd]) => {
      const preco = precoPorProduto.get(produtoId) ?? 0;
      return soma + preco * (Number(qtd) || 0);
    }, 0)
  );
  const taxaEntregaValor = round2(Number(taxaEntrega.replace(",", ".")) || 0);
  const total = round2(subtotal + taxaEntregaValor);

  return (
    <form method="POST" action="/api/entregas/criar" className="space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <label className="block text-sm font-medium text-neutral-300">Nome do cliente</label>
        <input
          type="text"
          name="cliente_nome"
          required
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />

        <label className="mt-4 block text-sm font-medium text-neutral-300">Endereço</label>
        <input
          type="text"
          name="endereco"
          required
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">Produtos</h2>
        <div className="space-y-4">
          {cardapio.map((categoria) => (
            <div key={categoria.id}>
              <h3 className="mb-2 text-sm font-semibold text-orange-500">{categoria.nome}</h3>
              <div className="space-y-2">
                {categoria.produtos.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-neutral-200">
                      {produto.nome}{" "}
                      <span className="text-neutral-500">{formatBRL(produto.preco)}</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      name={`qtd_${produto.id}`}
                      value={quantidades[produto.id] ?? ""}
                      onChange={(e) =>
                        setQuantidades((q) => ({ ...q, [produto.id]: e.target.value }))
                      }
                      className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <label className="block text-sm font-medium text-neutral-300">Taxa de entrega</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="taxa_entrega"
          value={taxaEntrega}
          onChange={(e) => setTaxaEntrega(e.target.value)}
          onBlur={() => setTaxaEntrega((v) => formatarInputMoeda(v))}
          className="mt-2 w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />

        <label className="mt-4 block text-sm font-medium text-neutral-300">
          Forma de pagamento
        </label>
        <select
          name="forma_pagamento_id"
          required
          defaultValue=""
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        >
          <option value="" disabled>
            Selecione
          </option>
          {formas.map((forma) => (
            <option key={forma.id} value={forma.id}>
              {forma.nome}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium text-neutral-300">
          Observação (opcional)
        </label>
        <input
          type="text"
          name="observacao"
          placeholder="Ex: sem cebola, portão azul"
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="space-y-1 border-b border-neutral-800 pb-3">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Produtos</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Taxa de entrega</span>
            <span>{formatBRL(taxaEntregaValor)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-500"
        >
          Criar entrega
        </button>
      </div>
    </form>
  );
}
