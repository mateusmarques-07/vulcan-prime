import Link from "next/link";
import { getEntregasAtivas } from "@/lib/data/entregas";
import { formatBRL } from "@/lib/format";

const ESTILO_STATUS = {
  aberta: "border-yellow-600 bg-yellow-950/30 text-yellow-100",
  em_rota: "border-blue-600 bg-blue-950/40 text-blue-100",
} as const;

const LABEL_STATUS = {
  aberta: "🟡 ABERTA",
  em_rota: "🔵 EM ROTA",
} as const;

export default async function EntregasPage() {
  const entregas = await getEntregasAtivas();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Entregas</h1>
        <div className="flex gap-3">
          <Link
            href="/entregas/historico"
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
          >
            Ver histórico
          </Link>
          <Link
            href="/entregas/nova"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            + Nova Entrega
          </Link>
        </div>
      </div>

      {entregas.length === 0 ? (
        <p className="text-neutral-500">Nenhuma entrega em aberto no momento.</p>
      ) : (
        <ul className="space-y-3">
          {entregas.map((entrega) => (
            <li
              key={entrega.id}
              className={`rounded-2xl border-2 p-4 ${ESTILO_STATUS[entrega.status as "aberta" | "em_rota"]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">
                    #{String(entrega.numero).padStart(2, "0")} — {entrega.cliente_nome}
                  </p>
                  <p className="text-sm opacity-80">{entrega.endereco}</p>
                  <p className="mt-1 text-base font-semibold">{formatBRL(entrega.total)}</p>
                  <p className="mt-1 text-sm">{LABEL_STATUS[entrega.status as "aberta" | "em_rota"]}</p>
                </div>
                <Link
                  href={`/entregas/${entrega.numero}`}
                  className="shrink-0 rounded-lg border border-current px-4 py-2 text-sm font-semibold hover:opacity-80"
                >
                  ABRIR
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
