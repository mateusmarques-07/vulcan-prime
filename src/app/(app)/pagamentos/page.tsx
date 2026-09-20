import { getFormasPagamentoTodas } from "@/lib/data/pagamentos";
import { ErrorModal } from "@/components/ErrorModal";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const formas = await getFormasPagamentoTodas();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Formas de pagamento</h1>

      <div className="mb-6 space-y-2">
        {formas.map((forma) => (
          <div
            key={forma.id}
            className={`flex items-center gap-2 rounded-xl border p-3 ${
              forma.ativo ? "border-neutral-800 bg-neutral-900" : "border-neutral-900 bg-neutral-950 opacity-60"
            }`}
          >
            <form method="POST" action="/api/pagamentos/editar" className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={forma.id} />
              <input
                type="text"
                name="nome"
                defaultValue={forma.nome}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
              >
                Salvar
              </button>
            </form>

            <form method="POST" action="/api/pagamentos/alternar-ativo">
              <input type="hidden" name="id" value={forma.id} />
              <input type="hidden" name="ativo" value={(!forma.ativo).toString()} />
              <button
                type="submit"
                className={`text-sm ${forma.ativo ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
              >
                {forma.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Nova forma de pagamento</h2>
        <form method="POST" action="/api/pagamentos/criar" className="flex items-center gap-2">
          <input
            type="text"
            name="nome"
            placeholder="Ex: Vale Refeição"
            required
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Adicionar
          </button>
        </form>
      </div>

      <ErrorModal mensagem={erro} voltarHref="/pagamentos" />
    </div>
  );
}
