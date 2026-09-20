import Link from "next/link";
import { getCategorias } from "@/lib/data/categorias";
import { ErrorModal } from "@/components/ErrorModal";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const categorias = await getCategorias();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/produtos" className="text-sm text-neutral-400 hover:text-orange-500">
        ← Produtos
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Categorias</h1>

      <div className="mb-6 space-y-2">
        {categorias.map((categoria) => (
          <div
            key={categoria.id}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
          >
            <form method="POST" action="/api/categorias/editar" className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={categoria.id} />
              <input
                type="text"
                name="nome"
                defaultValue={categoria.nome}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
              />
              <input
                type="number"
                name="ordem"
                defaultValue={categoria.ordem}
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

            <span className="text-xs text-neutral-500">
              {categoria.totalProdutos} produto{categoria.totalProdutos !== 1 ? "s" : ""}
            </span>

            <form method="POST" action="/api/categorias/remover">
              <input type="hidden" name="id" value={categoria.id} />
              <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                Remover
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Nova categoria</h2>
        <form method="POST" action="/api/categorias/criar" className="flex items-center gap-2">
          <input
            type="text"
            name="nome"
            placeholder="Nome da categoria"
            required
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <input
            type="number"
            name="ordem"
            placeholder="Ordem"
            defaultValue={categorias.length + 1}
            className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-center text-white outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Adicionar
          </button>
        </form>
      </div>

      <ErrorModal mensagem={erro} voltarHref="/produtos/categorias" />
    </div>
  );
}
