import { getRecebimentos } from "@/lib/data/recebimentos";
import { getFormasPagamentoTodas } from "@/lib/data/pagamentos";
import { formatBRL } from "@/lib/format";
import { hojeSaoPauloISO, formatDataHoraSaoPaulo } from "@/lib/timezone";
import { rotuloMesa } from "@/lib/mesa-label";

export default async function RecebimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; forma?: string }>;
}) {
  const { de, ate, forma } = await searchParams;

  const hoje = hojeSaoPauloISO();
  const dataDe = de || hoje;
  const dataAte = ate || hoje;

  const inicio = new Date(`${dataDe}T00:00:00-03:00`);
  const fimExclusivo = new Date(new Date(`${dataAte}T00:00:00-03:00`).getTime() + 24 * 60 * 60 * 1000);

  const [{ resumo, porForma, fechamentos }, formasPagamento] = await Promise.all([
    getRecebimentos(inicio, fimExclusivo),
    getFormasPagamentoTodas(),
  ]);

  const porFormaFiltrado = forma ? porForma.filter((p) => p.nome === forma) : porForma;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Recebimentos</h1>

      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-400">Data de</label>
          <input
            type="date"
            name="de"
            defaultValue={dataDe}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Data até</label>
          <input
            type="date"
            name="ate"
            defaultValue={dataAte}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Forma de pagamento</label>
          <select
            name="forma"
            defaultValue={forma ?? ""}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.nome}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
        >
          Filtrar
        </button>
        <a
          href="/recebimentos"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          Hoje
        </a>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Subtotal vendido</p>
          <p className="text-2xl font-bold text-white">{formatBRL(resumo.subtotalVendido)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Gorjetas</p>
          <p className="text-2xl font-bold text-white">{formatBRL(resumo.gorjetas)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Total recebido</p>
          <p className="text-2xl font-bold text-white">{formatBRL(resumo.totalRecebido)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Por forma de pagamento</h2>
        {porFormaFiltrado.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum recebimento no período.</p>
        ) : (
          <ul className="space-y-1">
            {porFormaFiltrado.map((p) => (
              <li key={p.nome} className="flex justify-between text-sm text-neutral-200">
                <span>{p.nome}</span>
                <span>{formatBRL(p.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Fechamentos individuais</h2>
        {fechamentos.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum fechamento no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400">
                  <th className="py-2 pr-3">Data/Hora</th>
                  <th className="py-2 pr-3">Mesa</th>
                  <th className="py-2 pr-3">Forma de pagamento</th>
                  <th className="py-2 pr-3 text-right">Subtotal</th>
                  <th className="py-2 pr-3 text-right">Gorjeta</th>
                  <th className="py-2 pr-3 text-right">Entrega</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {fechamentos.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-900 text-neutral-200">
                    <td className="py-2 pr-3">{formatDataHoraSaoPaulo(new Date(f.fechado_em))}</td>
                    <td className="py-2 pr-3">{rotuloMesa(f.tipoMesa, f.mesa_numero)}</td>
                    <td className="py-2 pr-3">{f.formaTexto}</td>
                    <td className="py-2 pr-3 text-right">{formatBRL(f.subtotal)}</td>
                    <td className="py-2 pr-3 text-right">{formatBRL(f.gorjeta)}</td>
                    <td className="py-2 pr-3 text-right">
                      {f.taxaEntrega > 0 ? formatBRL(f.taxaEntrega) : "—"}
                    </td>
                    <td className="py-2 text-right font-semibold">{formatBRL(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
