"use client";

import { useState } from "react";
import { formatBRL, round2 } from "@/lib/format";
import type { ItemComanda } from "@/lib/data/comanda";
import type { FormaPagamento } from "@/lib/data/pagamentos";

export function FechamentoForm({
  numero,
  comandaId,
  itens,
  subtotal,
  formas,
  gorjetaAtivaInicial,
  gorjetaPctInicial,
  pessoasInicial,
}: {
  numero: number;
  comandaId: string;
  itens: ItemComanda[];
  subtotal: number;
  formas: FormaPagamento[];
  gorjetaAtivaInicial: boolean;
  gorjetaPctInicial: number;
  pessoasInicial: number | null;
}) {
  const opcaoInicial =
    gorjetaPctInicial === 10 || gorjetaPctInicial === 15 ? String(gorjetaPctInicial) : "outra";

  const [gorjetaAtiva, setGorjetaAtiva] = useState(gorjetaAtivaInicial);
  const [gorjetaOpcao, setGorjetaOpcao] = useState<"10" | "15" | "outra">(
    opcaoInicial as "10" | "15" | "outra"
  );
  const [gorjetaCustom, setGorjetaCustom] = useState(
    opcaoInicial === "outra" ? String(gorjetaPctInicial) : ""
  );
  const [pessoas, setPessoas] = useState(pessoasInicial ? String(pessoasInicial) : "");
  const [valores, setValores] = useState<Record<string, string>>({});

  const gorjetaPct = gorjetaAtiva
    ? gorjetaOpcao === "outra"
      ? Number(gorjetaCustom.replace(",", ".")) || 0
      : Number(gorjetaOpcao)
    : 0;
  const gorjetaValor = round2((subtotal * gorjetaPct) / 100);
  const total = round2(subtotal + gorjetaValor);

  const somaFormas = round2(
    Object.values(valores).reduce((soma, v) => soma + (Number(v.replace(",", ".")) || 0), 0)
  );
  const faltaCobrir = round2(subtotal - somaFormas);

  const numPessoas = Number(pessoas) || 0;
  const valorPorPessoa = numPessoas > 0 ? total / numPessoas : null;

  const podeConfirmar = Math.abs(faltaCobrir) < 0.005;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">Itens</h2>
        <ul className="space-y-1">
          {itens.map((item) => (
            <li key={item.id} className="flex justify-between text-sm text-neutral-300">
              <span>
                {item.quantidade}× {item.nome_produto}
              </span>
              <span>{formatBRL(item.preco_unit * item.quantidade)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-800 pt-3 text-base font-semibold text-white">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <label className="block text-sm font-medium text-neutral-300">
          Nº de pessoas (opcional, só informativo)
        </label>
        <input
          type="number"
          min={1}
          value={pessoas}
          onChange={(e) => setPessoas(e.target.value)}
          className="mt-2 w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
        />
        {valorPorPessoa !== null && (
          <p className="mt-2 text-sm text-neutral-400">
            Dividido por {numPessoas} pessoas: {formatBRL(valorPorPessoa)} cada
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <input
            type="checkbox"
            checked={gorjetaAtiva}
            onChange={(e) => setGorjetaAtiva(e.target.checked)}
            className="h-4 w-4"
          />
          Incluir taxa de serviço do garçom
        </label>

        {gorjetaAtiva && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              {(["10", "15", "outra"] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setGorjetaOpcao(opcao)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    gorjetaOpcao === opcao
                      ? "border-orange-500 bg-orange-600 text-white"
                      : "border-neutral-700 text-neutral-300"
                  }`}
                >
                  {opcao === "outra" ? "Outra" : `${opcao}%`}
                </button>
              ))}
              {gorjetaOpcao === "outra" && (
                <input
                  type="number"
                  placeholder="%"
                  value={gorjetaCustom}
                  onChange={(e) => setGorjetaCustom(e.target.value)}
                  className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-white outline-none focus:border-orange-500"
                />
              )}
            </div>

            <p className="text-sm text-neutral-300">
              Taxa de serviço ({gorjetaPct}%): {formatBRL(gorjetaValor)}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 space-y-1 border-b border-neutral-800 pb-3">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Itens</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {gorjetaAtiva && (
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Gorjeta ({gorjetaPct}%)</span>
              <span>{formatBRL(gorjetaValor)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        <form method="POST" action="/api/mesas/imprimir-recibo" target="_blank" className="mb-4">
          <input type="hidden" name="numero" value={numero} />
          <input type="hidden" name="gorjetaAtiva" value={gorjetaAtiva.toString()} />
          <input type="hidden" name="gorjetaPct" value={gorjetaPct} />
          <input type="hidden" name="pessoas" value={pessoas} />
          <button
            type="submit"
            className="inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-orange-500 hover:text-orange-500"
          >
            Fechar conta e imprimir recibo
          </button>
        </form>

        <h3 className="mb-2 text-sm font-semibold text-neutral-200">
          Pagamento do subtotal ({formatBRL(subtotal)})
        </h3>
        <div className="space-y-2">
          {formas.map((forma) => (
            <div key={forma.id} className="flex items-center gap-3">
              <span className="w-28 text-sm text-neutral-300">{forma.nome}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valores[forma.id] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [forma.id]: e.target.value }))}
                placeholder="R$ 0,00"
                className="w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
              />
            </div>
          ))}
        </div>

        <p
          className={`mt-3 text-sm font-medium ${
            Math.abs(faltaCobrir) < 0.005 ? "text-green-400" : "text-orange-400"
          }`}
        >
          {Math.abs(faltaCobrir) < 0.005
            ? "Valor cobrado confere com o subtotal."
            : faltaCobrir > 0
              ? `Falta cobrir: ${formatBRL(faltaCobrir)}`
              : `Valor digitado passa do subtotal em ${formatBRL(-faltaCobrir)}`}
        </p>

        <form method="POST" action="/api/mesas/encerrar" className="mt-4 flex gap-3">
          <input type="hidden" name="numero" value={numero} />
          <input type="hidden" name="comandaId" value={comandaId} />
          <input type="hidden" name="gorjetaPct" value={gorjetaPct} />
          <input type="hidden" name="pessoas" value={pessoas} />
          {formas.map((forma) => (
            <input
              key={forma.id}
              type="hidden"
              name={`valor_${forma.id}`}
              value={valores[forma.id] ?? ""}
            />
          ))}
          <button
            type="submit"
            disabled={!podeConfirmar}
            className="rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            Confirmar pagamento
          </button>
        </form>

        <form method="POST" action="/api/mesas/reabrir" className="mt-3">
          <input type="hidden" name="numero" value={numero} />
          <button type="submit" className="text-sm text-neutral-400 hover:text-neutral-200">
            Cancelar e voltar pra comanda
          </button>
        </form>
      </div>
    </div>
  );
}
