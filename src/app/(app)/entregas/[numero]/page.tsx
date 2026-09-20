import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntregaPorNumero } from "@/lib/data/entregas";
import { getFormasPagamentoAtivas } from "@/lib/data/pagamentos";
import { formatBRL } from "@/lib/format";
import { formatDataHoraSaoPaulo } from "@/lib/timezone";
import { ErrorModal } from "@/components/ErrorModal";

const LABEL_STATUS = {
  aberta: "🟡 ABERTA",
  em_rota: "🔵 EM ROTA",
  finalizada: "✅ FINALIZADA",
} as const;

export default async function EntregaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const { erro } = await searchParams;
  const numero = Number(numeroParam);

  const [entrega, formas] = await Promise.all([
    getEntregaPorNumero(numero),
    getFormasPagamentoAtivas(),
  ]);
  if (!entrega) notFound();

  const finalizada = entrega.status === "finalizada";
  const numeroFormatado = String(entrega.numero).padStart(2, "0");

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <Link href="/entregas" className="text-sm text-neutral-400 hover:text-orange-500">
          ← Entregas
        </Link>
        <h1 className="text-2xl font-bold text-white">
          Entrega #{numeroFormatado} — {entrega.cliente_nome}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">{entrega.endereco}</p>
        <p className="mt-1 text-sm">{LABEL_STATUS[entrega.status]}</p>
      </header>

      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-200">Produtos</h2>
          <ul className="space-y-1">
            {entrega.itens.map((item) => (
              <li key={item.id} className="flex justify-between text-sm text-neutral-300">
                <span>
                  {item.quantidade}× {item.nome_produto}
                </span>
                <span>{formatBRL(item.preco_unit * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-neutral-800 pt-3">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span>
              <span>{formatBRL(entrega.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Taxa de entrega</span>
              <span>{formatBRL(entrega.taxa_entrega)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>{formatBRL(entrega.total)}</span>
            </div>
          </div>
        </div>

        {finalizada ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
            <p>Forma de pagamento: {entrega.forma_pagamento_nome}</p>
            {entrega.observacao && <p className="mt-1">Observação: {entrega.observacao}</p>}
            <p className="mt-1 text-neutral-500">
              Finalizada em {formatDataHoraSaoPaulo(new Date(entrega.finalizada_em!))}
            </p>
          </div>
        ) : (
          <form method="POST" action="/api/entregas/editar" className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <input type="hidden" name="numero" value={entrega.numero} />

            <label className="block text-sm font-medium text-neutral-300">Taxa de entrega</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="taxa_entrega"
              defaultValue={entrega.taxa_entrega.toFixed(2)}
              className="mt-2 w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
            />

            <label className="mt-4 block text-sm font-medium text-neutral-300">
              Forma de pagamento
            </label>
            <select
              name="forma_pagamento_id"
              defaultValue={entrega.forma_pagamento_id}
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              {formas.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {forma.nome}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-medium text-neutral-300">Observação</label>
            <input
              type="text"
              name="observacao"
              defaultValue={entrega.observacao ?? ""}
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
            />

            <button
              type="submit"
              className="mt-4 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-orange-500 hover:text-orange-500"
            >
              Salvar alterações
            </button>
          </form>
        )}

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-wrap gap-3">
            <a
              href={`/recibo/entrega/${entrega.numero}`}
              target="_blank"
              rel="noopener"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-orange-500 hover:text-orange-500"
            >
              Imprimir comprovante
            </a>

            {!finalizada && (
              <>
                <form method="POST" action="/api/entregas/status">
                  <input type="hidden" name="numero" value={entrega.numero} />
                  <input type="hidden" name="status" value="em_rota" />
                  <button
                    type="submit"
                    disabled={entrega.status === "em_rota"}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
                  >
                    Marcar como Em Rota
                  </button>
                </form>

                <form method="POST" action="/api/entregas/status">
                  <input type="hidden" name="numero" value={entrega.numero} />
                  <input type="hidden" name="status" value="finalizada" />
                  <button
                    type="submit"
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
                  >
                    Finalizar (pagamento confirmado)
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <ErrorModal mensagem={erro} voltarHref={`/entregas/${entrega.numero}`} />
    </div>
  );
}
