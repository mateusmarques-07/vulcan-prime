"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import type { CategoriaCardapio, ProdutoCardapio } from "@/lib/data/comanda";

// "Arroz (adicional)" vira so "Arroz" no botao do popup
function rotuloAcompanhamento(nome: string) {
  return nome.replace(/\s*\(adicional\)\s*$/i, "");
}

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
  const [escolhendo, setEscolhendo] = useState<ProdutoCardapio | null>(null);

  if (cardapio.length === 0) {
    return <p className="text-neutral-500">Nenhum produto cadastrado ainda.</p>;
  }

  const categoriaAtiva = cardapio.find((c) => c.id === ativaId) ?? cardapio[0];
  const opcoesAcompanhamento = cardapio
    .filter((c) => c.listaAcompanhamentos)
    .flatMap((c) => c.produtos.map((p) => rotuloAcompanhamento(p.nome)));
  const pedeAcompanhamento = categoriaAtiva.qtdAcompanhamentos > 0;

  const conteudoProduto = (produto: ProdutoCardapio) => (
    <>
      <span className="flex flex-col">
        <span className="text-base font-semibold text-white">{produto.nome}</span>
        {produto.descricao && (
          <span className="mt-0.5 text-xs text-neutral-400">{produto.descricao}</span>
        )}
      </span>
      <span className="shrink-0 font-medium text-orange-400">{formatBRL(produto.preco)}</span>
    </>
  );
  const classeProduto =
    "flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left transition hover:border-orange-500";

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
        {categoriaAtiva.produtos.map((produto) =>
          pedeAcompanhamento ? (
            <button
              key={produto.id}
              type="button"
              onClick={() => setEscolhendo(produto)}
              className={classeProduto}
            >
              {conteudoProduto(produto)}
            </button>
          ) : (
            <form key={produto.id} method="POST" action="/api/itens/lancar">
              <input type="hidden" name="comandaId" value={comandaId} />
              <input type="hidden" name="produtoId" value={produto.id} />
              <input type="hidden" name="numero" value={numero} />
              <input type="hidden" name="categoria" value={categoriaAtiva.id} />
              <button type="submit" className={classeProduto}>
                {conteudoProduto(produto)}
              </button>
            </form>
          )
        )}
      </div>

      {escolhendo && (
        <PopupAcompanhamentos
          produto={escolhendo}
          quantidade={categoriaAtiva.qtdAcompanhamentos}
          opcoes={opcoesAcompanhamento}
          comandaId={comandaId}
          numero={numero}
          categoriaId={categoriaAtiva.id}
          onCancelar={() => setEscolhendo(null)}
        />
      )}
    </div>
  );
}

// Escolha rapida de acompanhamentos (Executivos = 4, Rodizio = 1): um clique
// por botao, "Outro" pra casos fora do padrao. O texto vai junto com o item
// e sai no papel da cozinha.
function PopupAcompanhamentos({
  produto,
  quantidade,
  opcoes,
  comandaId,
  numero,
  categoriaId,
  onCancelar,
}: {
  produto: ProdutoCardapio;
  quantidade: number;
  opcoes: string[];
  comandaId: string;
  numero: number;
  categoriaId: string;
  onCancelar: () => void;
}) {
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [outro, setOutro] = useState("");

  const cheio = escolhidos.length >= quantidade;
  const texto = [...escolhidos, outro.trim()].filter(Boolean).join(", ");

  function alternar(opcao: string) {
    setEscolhidos((atual) => {
      if (atual.includes(opcao)) return atual.filter((o) => o !== opcao);
      // so 1 permitido (rodizio): clicar em outro troca a escolha
      if (quantidade === 1) return [opcao];
      if (atual.length >= quantidade) return atual;
      return [...atual, opcao];
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">{produto.nome}</h3>
        <p className="mb-4 text-sm text-neutral-400">
          Escolha {quantidade === 1 ? "1 acompanhamento" : `${quantidade} acompanhamentos`}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {opcoes.map((opcao) => {
            const marcado = escolhidos.includes(opcao);
            const bloqueado = !marcado && cheio && quantidade > 1;
            return (
              <button
                key={opcao}
                type="button"
                onClick={() => alternar(opcao)}
                disabled={bloqueado}
                className={`rounded-xl border-2 px-3 py-3 text-base font-semibold transition ${
                  marcado
                    ? "border-orange-500 bg-orange-600 text-white"
                    : "border-neutral-700 text-neutral-200 hover:border-orange-500 disabled:opacity-40"
                }`}
              >
                {opcao}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
          placeholder="Outro (ex: arroz dobrado)"
          className="mb-3 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />

        <p className="mb-4 text-sm text-neutral-400">
          Escolhidos: <span className="font-semibold text-white">{escolhidos.length} de {quantidade}</span>
        </p>

        <form method="POST" action="/api/itens/lancar" className="flex justify-end gap-2">
          <input type="hidden" name="comandaId" value={comandaId} />
          <input type="hidden" name="produtoId" value={produto.id} />
          <input type="hidden" name="numero" value={numero} />
          <input type="hidden" name="categoria" value={categoriaId} />
          <input type="hidden" name="acompanhamentos" value={texto} />
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
