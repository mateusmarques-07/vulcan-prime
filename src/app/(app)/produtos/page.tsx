import Link from "next/link";
import { getProdutosAdmin } from "@/lib/data/produtos";
import { getCategoriasParaSelect } from "@/lib/data/categorias";
import { MoneyInput } from "@/components/MoneyInput";

export default async function ProdutosPage() {
  const [produtos, categorias] = await Promise.all([
    getProdutosAdmin(),
    getCategoriasParaSelect(),
  ]);

  const produtosPorCategoria = categorias.map((categoria) => ({
    categoria,
    produtos: produtos.filter((produto) => produto.categoria_id === categoria.id),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
        <Link
          href="/produtos/categorias"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
        >
          Gerenciar categorias
        </Link>
      </div>

      <div className="mb-6 space-y-6">
        {produtosPorCategoria.map(({ categoria, produtos: produtosDaCategoria }) => (
          <div key={categoria.id}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-orange-500">
              {categoria.nome}
            </h2>

            {produtosDaCategoria.length === 0 ? (
              <p className="text-sm text-neutral-600">Nenhum produto nessa categoria ainda.</p>
            ) : (
              <div className="space-y-2">
                {produtosDaCategoria.map((produto) => (
                  <div
                    key={produto.id}
                    className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 ${
                      produto.ativo
                        ? "border-neutral-800 bg-neutral-900"
                        : "border-neutral-900 bg-neutral-950 opacity-60"
                    }`}
                  >
                    <form
                      method="POST"
                      action="/api/produtos/editar"
                      className="flex flex-1 flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={produto.id} />
                      <input
                        type="text"
                        name="nome"
                        defaultValue={produto.nome}
                        className="min-w-[10rem] flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        name="descricao"
                        placeholder="Descrição (opcional)"
                        defaultValue={produto.descricao ?? ""}
                        className="min-w-[12rem] flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500"
                      />
                      <select
                        name="categoria_id"
                        defaultValue={produto.categoria_id}
                        className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-white outline-none focus:border-orange-500"
                      >
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                      <MoneyInput
                        name="preco"
                        defaultValue={produto.preco.toFixed(2)}
                        className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-white outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        name="ordem"
                        defaultValue={produto.ordem}
                        title="Ordem de exibição"
                        className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-center text-white outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
                      >
                        Salvar
                      </button>
                    </form>

                    <form method="POST" action="/api/produtos/alternar-ativo">
                      <input type="hidden" name="id" value={produto.id} />
                      <input type="hidden" name="ativo" value={(!produto.ativo).toString()} />
                      <button
                        type="submit"
                        className={`text-sm ${produto.ativo ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                      >
                        {produto.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Novo produto</h2>
        <form method="POST" action="/api/produtos/criar" className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="nome"
            placeholder="Nome do produto"
            required
            className="min-w-[10rem] flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <input
            type="text"
            name="descricao"
            placeholder="Descrição (opcional)"
            className="min-w-[12rem] flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
          />
          <select
            name="categoria_id"
            required
            defaultValue=""
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-white outline-none focus:border-orange-500"
          >
            <option value="" disabled>
              Categoria
            </option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          <MoneyInput
            name="preco"
            placeholder="Preço"
            required
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-white outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Adicionar
          </button>
        </form>
      </div>

      {categorias.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          Cadastre uma categoria antes de adicionar produtos.{" "}
          <Link href="/produtos/categorias" className="text-orange-400 hover:underline">
            Ir pra Categorias
          </Link>
        </p>
      )}
    </div>
  );
}
