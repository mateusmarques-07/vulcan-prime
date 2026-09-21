import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getMesaPorNumero,
  getComandaAbertaDaMesa,
  getItensComanda,
  getCardapio,
} from "@/lib/data/comanda";
import { formatBRL } from "@/lib/format";
import { rotuloMesa } from "@/lib/mesa-label";
import { getPapelUsuario } from "@/lib/auth";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { CardapioSidebar } from "./CardapioSidebar";

export default async function ComandaPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const { categoria } = await searchParams;
  const numero = Number(numeroParam);

  // cardapio nao depende da mesa, entao ja busca em paralelo em vez de
  // esperar a mesa resolver primeiro - reduz o tempo de carregamento
  const [mesa, cardapio, papel] = await Promise.all([
    getMesaPorNumero(numero),
    getCardapio(),
    getPapelUsuario(),
  ]);
  if (!mesa) notFound();
  if (mesa.status === "livre") redirect("/");
  if (mesa.status === "conta") redirect(`/mesa/${numero}/fechamento`);

  const comanda = await getComandaAbertaDaMesa(mesa.id);
  if (!comanda) redirect("/");

  const itens = await getItensComanda(comanda.id);

  const total = itens.reduce((soma, item) => soma + item.preco_unit * item.quantidade, 0);
  const rotulo = rotuloMesa(mesa.tipo, mesa.numero);

  return (
    <div>
      <RealtimeRefresh tables={["itens_comanda", "comandas", "mesas"]} />

      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-400 hover:text-orange-500">
            ← Salão
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {rotulo} - {formatBRL(total)}
          </h1>
        </div>
        {papel !== "garcom" && (
          <form method="POST" action="/api/mesas/fechar-conta">
            <input type="hidden" name="numero" value={mesa.numero} />
            <button
              type="submit"
              disabled={itens.length === 0}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              Fechar conta
            </button>
          </form>
        )}
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-200">Cardápio</h2>
          <CardapioSidebar
            cardapio={cardapio}
            comandaId={comanda.id}
            numero={mesa.numero}
            categoriaInicial={categoria}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-200">Itens da comanda</h2>

          {itens.length === 0 ? (
            <p className="text-neutral-500">Nenhum item lançado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {itens.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{item.nome_produto}</p>
                      <p className="text-sm text-neutral-400">
                        {formatBRL(item.preco_unit)} cada
                      </p>
                    </div>
                    <p className="font-semibold text-orange-400">
                      {formatBRL(item.preco_unit * item.quantidade)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <form method="POST" action="/api/itens/diminuir">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="numero" value={mesa.numero} />
                      <button
                        type="submit"
                        className="h-8 w-8 rounded-lg border border-neutral-700 text-lg text-neutral-300 hover:border-orange-500 hover:text-orange-500"
                      >
                        −
                      </button>
                    </form>
                    <span className="w-6 text-center text-white">{item.quantidade}</span>
                    <form method="POST" action="/api/itens/aumentar">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="numero" value={mesa.numero} />
                      <button
                        type="submit"
                        className="h-8 w-8 rounded-lg border border-neutral-700 text-lg text-neutral-300 hover:border-orange-500 hover:text-orange-500"
                      >
                        +
                      </button>
                    </form>

                    <form method="POST" action="/api/itens/remover" className="ml-auto">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="numero" value={mesa.numero} />
                      <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                        Remover
                      </button>
                    </form>
                  </div>

                  <form method="POST" action="/api/itens/observacao" className="mt-2 flex gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="numero" value={mesa.numero} />
                    <input
                      type="text"
                      name="observacao"
                      defaultValue={item.observacao ?? ""}
                      placeholder="Observação (ex: sem cebola)"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
                    >
                      Salvar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-right">
            <span className="text-sm text-neutral-400">Total: </span>
            <span className="text-xl font-bold text-white">{formatBRL(total)}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
