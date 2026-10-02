import Link from "next/link";
import { getMesasAtivas } from "@/lib/data/mesas";
import { rotuloMesa } from "@/lib/mesa-label";
import { ErrorModal } from "@/components/ErrorModal";

export default async function MesasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const mesas = await getMesasAtivas();
  const ultima = mesas.at(-1);
  const podeRemover = mesas.length > 1 && ultima?.status === "livre";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/configuracoes" className="text-sm text-neutral-400 hover:text-orange-500">
        ← Configurações
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">Mesas</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {mesas.length} {mesas.length === 1 ? "mesa" : "mesas"} no Salão, mais o Balcão (Retirada), que
        fica sempre por último.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-center text-sm text-neutral-200"
          >
            {rotuloMesa("mesa", mesa.numero)}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <form method="POST" action="/api/mesas/criar">
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            + Nova mesa
          </button>
        </form>

        {ultima && (
          <form method="POST" action="/api/mesas/remover">
            <button
              type="submit"
              disabled={!podeRemover}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-red-400 hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:border-neutral-700"
            >
              Remover {rotuloMesa("mesa", ultima.numero)}
            </button>
          </form>
        )}

        {ultima && ultima.status !== "livre" && (
          <p className="w-full text-xs text-neutral-500">
            A {rotuloMesa("mesa", ultima.numero)} está em uso. Feche a conta dela pra poder remover.
          </p>
        )}
      </div>

      <ErrorModal mensagem={erro} voltarHref="/configuracoes/mesas" />
    </div>
  );
}
