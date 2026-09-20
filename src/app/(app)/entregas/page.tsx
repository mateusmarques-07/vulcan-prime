import Link from "next/link";
import { getEntregasAtivas, getEntregaPorNumero } from "@/lib/data/entregas";
import { getFormasPagamentoAtivas } from "@/lib/data/pagamentos";
import { formatBRL } from "@/lib/format";
import { formatDataHoraSaoPaulo, formatHoraSaoPaulo } from "@/lib/timezone";
import { ErrorModal } from "@/components/ErrorModal";

const ESTILO_STATUS = {
  aberta: "border-yellow-600 bg-yellow-950/30 text-yellow-100",
  em_rota: "border-blue-600 bg-blue-950/40 text-blue-100",
} as const;

const LABEL_STATUS = {
  aberta: "🟡 ABERTA",
  em_rota: "🔵 EM ROTA",
  finalizada: "✅ FINALIZADA",
} as const;

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string; erro?: string }>;
}) {
  const { numero: numeroParam, erro } = await searchParams;

  const [ativas, formas] = await Promise.all([getEntregasAtivas(), getFormasPagamentoAtivas()]);

  const numeroSelecionado = numeroParam ? Number(numeroParam) : ativas[0]?.numero;
  const selecionada = numeroSelecionado ? await getEntregaPorNumero(numeroSelecionado) : null;
  const finalizada = selecionada?.status === "finalizada";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* ---------- Coluna da esquerda: lista de ativas ---------- */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Entregas</h1>
            <Link
              href="/entregas/historico"
              className="text-sm text-neutral-400 hover:text-orange-500"
            >
              Histórico
            </Link>
          </div>

          <Link
            href="/entregas/nova"
            className="mb-4 block w-full rounded-lg bg-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-500"
          >
            + Nova Entrega
          </Link>

          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Entregas em andamento
          </h2>

          {ativas.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma entrega em aberto no momento.</p>
          ) : (
            <ul className="space-y-2">
              {ativas.map((entrega) => (
                <li key={entrega.id}>
                  <Link
                    href={`/entregas?numero=${entrega.numero}`}
                    className={`block rounded-xl border-2 p-3 transition ${
                      entrega.numero === numeroSelecionado
                        ? "border-orange-500 bg-orange-950/20"
                        : `${ESTILO_STATUS[entrega.status]} hover:border-orange-500/60`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">
                          #{String(entrega.numero).padStart(2, "0")} {entrega.cliente_nome}
                        </p>
                        <p className="text-xs text-neutral-400">{entrega.endereco}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-white">
                        {formatBRL(entrega.total)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>{LABEL_STATUS[entrega.status]}</span>
                      <span className="text-neutral-500">{formatHoraSaoPaulo(new Date(entrega.aberta_em))}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Coluna da direita: detalhe da entrega selecionada ---------- */}
        <div>
          {!selecionada ? (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-neutral-800 text-sm text-neutral-500">
              Selecione uma entrega na lista ao lado.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Entrega #{String(selecionada.numero).padStart(2, "0")} — {selecionada.cliente_nome}
                  </h2>
                  <p className="text-sm text-neutral-400">{selecionada.endereco}</p>
                </div>
                <span className="text-sm">{LABEL_STATUS[selecionada.status]}</span>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <h3 className="mb-3 text-sm font-semibold text-neutral-200">Itens do pedido</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-neutral-500">
                      <th className="pb-2 font-normal">Produto</th>
                      <th className="pb-2 text-right font-normal">Qtd</th>
                      <th className="pb-2 text-right font-normal">Valor</th>
                      <th className="pb-2 text-right font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selecionada.itens.map((item) => (
                      <tr key={item.id} className="border-t border-neutral-800 text-neutral-300">
                        <td className="py-1.5">{item.nome_produto}</td>
                        <td className="py-1.5 text-right">{item.quantidade}</td>
                        <td className="py-1.5 text-right">{formatBRL(item.preco_unit)}</td>
                        <td className="py-1.5 text-right">{formatBRL(item.preco_unit * item.quantidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 space-y-1 border-t border-neutral-800 pt-3">
                  <div className="flex justify-between text-sm text-neutral-400">
                    <span>Subtotal</span>
                    <span>{formatBRL(selecionada.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-400">
                    <span>Taxa de entrega</span>
                    <span>{formatBRL(selecionada.taxa_entrega)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span>{formatBRL(selecionada.total)}</span>
                  </div>
                </div>
              </div>

              {finalizada ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
                  <p>Forma de pagamento: {selecionada.forma_pagamento_nome}</p>
                  {selecionada.observacao && <p className="mt-1">Observação: {selecionada.observacao}</p>}
                  <p className="mt-1 text-neutral-500">
                    Finalizada em {formatDataHoraSaoPaulo(new Date(selecionada.finalizada_em!))}
                  </p>
                </div>
              ) : (
                <form
                  method="POST"
                  action="/api/entregas/editar"
                  className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="numero" value={selecionada.numero} />

                  <div>
                    <label className="block text-sm font-medium text-neutral-300">
                      Forma de pagamento
                    </label>
                    <select
                      name="forma_pagamento_id"
                      defaultValue={selecionada.forma_pagamento_id}
                      className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                    >
                      {formas.map((forma) => (
                        <option key={forma.id} value={forma.id}>
                          {forma.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300">Taxa de entrega</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="taxa_entrega"
                      defaultValue={selecionada.taxa_entrega.toFixed(2)}
                      className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-neutral-300">
                      Observação (opcional)
                    </label>
                    <input
                      type="text"
                      name="observacao"
                      defaultValue={selecionada.observacao ?? ""}
                      className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-orange-500 hover:text-orange-500"
                  >
                    Salvar alterações
                  </button>
                </form>
              )}

              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="mb-3 flex flex-wrap gap-3">
                  <a
                    href={`/recibo/entrega/${selecionada.numero}`}
                    target="_blank"
                    rel="noopener"
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-orange-500 hover:text-orange-500"
                  >
                    Imprimir comprovante
                  </a>
                </div>

                {!finalizada && (
                  <>
                    <div className="mb-3 flex overflow-hidden rounded-lg border border-neutral-700">
                      <form method="POST" action="/api/entregas/status" className="flex-1">
                        <input type="hidden" name="numero" value={selecionada.numero} />
                        <input type="hidden" name="status" value="aberta" />
                        <button
                          type="submit"
                          disabled={selecionada.status === "aberta"}
                          className={`w-full px-4 py-2 text-sm font-semibold transition ${
                            selecionada.status === "aberta"
                              ? "bg-yellow-600 text-white"
                              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          Aberta
                        </button>
                      </form>
                      <form method="POST" action="/api/entregas/status" className="flex-1">
                        <input type="hidden" name="numero" value={selecionada.numero} />
                        <input type="hidden" name="status" value="em_rota" />
                        <button
                          type="submit"
                          disabled={selecionada.status === "em_rota"}
                          className={`w-full border-l border-neutral-700 px-4 py-2 text-sm font-semibold transition ${
                            selecionada.status === "em_rota"
                              ? "bg-blue-600 text-white"
                              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          Em rota
                        </button>
                      </form>
                    </div>

                    <form method="POST" action="/api/entregas/status">
                      <input type="hidden" name="numero" value={selecionada.numero} />
                      <input type="hidden" name="status" value="finalizada" />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500"
                      >
                        Finalizar (pagamento confirmado)
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ErrorModal mensagem={erro} voltarHref={`/entregas${numeroSelecionado ? `?numero=${numeroSelecionado}` : ""}`} />
    </div>
  );
}
