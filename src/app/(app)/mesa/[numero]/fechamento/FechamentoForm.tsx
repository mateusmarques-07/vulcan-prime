"use client";

import { useEffect, useRef, useState } from "react";
import { formatBRL, formatarInputMoeda, round2 } from "@/lib/format";
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

  // Troco (01/10/2026, v2): no Dinheiro o caixa digita quanto o cliente
  // ENTREGOU. O que passar do que falta pagar (depois das outras formas)
  // vira troco - so aparece na tela; pro banco vai so o valor cobrado.
  // Troco so existe na forma com "dinheiro" no nome.
  const valorDe = (id: string) => Number((valores[id] ?? "").replace(",", ".")) || 0;
  const formaDinheiro = formas.find((forma) => forma.nome.toLowerCase().includes("dinheiro"));

  function calcularPagamento(ignorarFormaId?: string) {
    const somaOutras = round2(
      formas
        .filter((f) => f.id !== formaDinheiro?.id && f.id !== ignorarFormaId)
        .reduce((soma, f) => soma + valorDe(f.id), 0)
    );
    const entregue =
      formaDinheiro && formaDinheiro.id !== ignorarFormaId ? valorDe(formaDinheiro.id) : 0;
    const cobrado = round2(Math.min(entregue, Math.max(0, round2(total - somaOutras))));
    return { somaOutras, entregue, cobrado };
  }

  const pagamento = calcularPagamento();
  const dinheiroCobrado = pagamento.cobrado;
  const troco = round2(pagamento.entregue - dinheiroCobrado);
  const somaFormas = round2(pagamento.somaOutras + dinheiroCobrado);
  const faltaCobrir = round2(total - somaFormas);

  // "Exato": preenche a forma com o que ainda falta pagar, desconsiderando
  // o que ja estava digitado nela mesma.
  function preencherExato(formaId: string) {
    const semEssa = calcularPagamento(formaId);
    const resto = Math.max(0, round2(total - semEssa.somaOutras - semEssa.cobrado));
    setValores((v) => ({ ...v, [formaId]: resto.toFixed(2) }));
  }

  const numPessoas = Number(pessoas) || 0;
  const valorPorPessoa = numPessoas > 0 ? total / numPessoas : null;

  const podeConfirmar = Math.abs(faltaCobrir) < 0.005;

  // Salva gorjeta/pessoas automaticamente (com um pequeno atraso) assim que
  // algum desses campos muda - nao depende de clicar em nenhum botao
  // especifico pra sobreviver a espera do garcom voltar com o pagamento.
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const body = new URLSearchParams({
        numero: String(numero),
        gorjetaAtiva: String(gorjetaAtiva),
        gorjetaPct: String(gorjetaPct),
        pessoas,
      });
      fetch("/api/mesas/salvar-parcial", { method: "POST", body }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [numero, gorjetaAtiva, gorjetaPct, pessoas]);

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
          Pagamento ({formatBRL(total)})
        </h3>
        <div className="space-y-2">
          {formas.map((forma) => (
            <div key={forma.id} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="w-28 text-sm text-neutral-300">{forma.nome}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valores[forma.id] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [forma.id]: e.target.value }))}
                onBlur={() =>
                  setValores((v) => ({ ...v, [forma.id]: formatarInputMoeda(v[forma.id] ?? "") }))
                }
                placeholder="R$ 0,00"
                className="w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-white outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => preencherExato(forma.id)}
                className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Exato
              </button>
              {forma.id === formaDinheiro?.id && troco > 0 && (
                <span className="text-base font-bold tabular-nums text-green-400" aria-live="polite">
                  Troco: {formatBRL(troco)}
                </span>
              )}
            </div>
          ))}
        </div>

        <p
          className={`mt-3 text-sm font-medium ${
            Math.abs(faltaCobrir) < 0.005 ? "text-green-400" : "text-orange-400"
          }`}
        >
          {Math.abs(faltaCobrir) < 0.005
            ? "Valor cobrado confere com o total."
            : faltaCobrir > 0
              ? `Falta cobrir: ${formatBRL(faltaCobrir)}`
              : `Valor digitado passa do total em ${formatBRL(-faltaCobrir)}. Só o dinheiro pode ter troco.`}
        </p>
        {podeConfirmar && troco > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            Vai pro financeiro: {formatBRL(dinheiroCobrado)} em dinheiro (o troco não entra).
          </p>
        )}

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
              // no Dinheiro vai so o valor cobrado, nunca o entregue (com troco)
              value={forma.id === formaDinheiro?.id ? (dinheiroCobrado > 0 ? dinheiroCobrado.toFixed(2) : "") : (valores[forma.id] ?? "")}
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
