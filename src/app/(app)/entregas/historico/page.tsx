import Link from "next/link";
import { getHistoricoEntregas } from "@/lib/data/entregas";
import { formatBRL } from "@/lib/format";
import { formatDataHoraSaoPaulo } from "@/lib/timezone";

export default async function HistoricoEntregasPage() {
  const historico = await getHistoricoEntregas();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Link href="/entregas" className="text-sm text-neutral-400 hover:text-orange-500">
          ← Entregas
        </Link>
        <h1 className="text-2xl font-bold text-white">Histórico de entregas</h1>
      </header>

      {historico.length === 0 ? (
        <p className="text-neutral-500">Nenhuma entrega finalizada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="py-2 pr-3">Número</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3 text-right">Valor</th>
                <th className="py-2 pr-3">Pagamento</th>
                <th className="py-2">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((e) => (
                <tr key={e.id} className="border-b border-neutral-900 text-neutral-200">
                  <td className="py-2 pr-3">
                    <Link href={`/entregas/${e.numero}`} className="hover:text-orange-500">
                      #{String(e.numero).padStart(2, "0")}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{e.cliente_nome}</td>
                  <td className="py-2 pr-3 text-right">{formatBRL(e.total)}</td>
                  <td className="py-2 pr-3">{e.forma_pagamento_nome}</td>
                  <td className="py-2">{formatDataHoraSaoPaulo(new Date(e.finalizada_em))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
