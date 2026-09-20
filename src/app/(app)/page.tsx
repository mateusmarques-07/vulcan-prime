import Link from "next/link";
import { getSalaoData } from "@/lib/data/salao";
import { formatBRL } from "@/lib/format";

const ESTILO_STATUS = {
  livre: "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600",
  ocupada: "border-orange-600 bg-orange-950/40 text-orange-100",
  conta: "border-red-600 bg-red-950/40 text-red-100",
} as const;

const LABEL_STATUS = {
  livre: "Livre",
  ocupada: "Ocupada",
  conta: "Conta",
} as const;

export default async function SalaoPage() {
  const { mesas, resumo } = await getSalaoData();

  return (
    <div>
      <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Mesas ocupadas</p>
          <p className="text-2xl font-bold text-white">
            {resumo.ocupadas} / {resumo.totalMesas}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Em aberto</p>
          <p className="text-2xl font-bold text-white">{formatBRL(resumo.emAberto)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Recebido hoje</p>
          <p className="text-2xl font-bold text-white">{formatBRL(resumo.recebidoHoje)}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {mesas.map((mesa) => {
          const numeroFormatado = String(mesa.numero).padStart(2, "0");
          const classe = `flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 text-center transition ${ESTILO_STATUS[mesa.status]}`;

          const conteudo = (
            <>
              <span className="text-lg font-bold">Mesa {numeroFormatado}</span>
              <span className="text-sm">{LABEL_STATUS[mesa.status]}</span>
              {mesa.status !== "livre" && (
                <span className="text-base font-semibold">{formatBRL(mesa.total)}</span>
              )}
            </>
          );

          if (mesa.status === "livre") {
            return (
              <form key={mesa.id} method="POST" action="/api/mesas/abrir">
                <input type="hidden" name="numero" value={mesa.numero} />
                <button type="submit" className={`${classe} w-full cursor-pointer`}>
                  {conteudo}
                </button>
              </form>
            );
          }

          const destino =
            mesa.status === "conta" ? `/mesa/${mesa.numero}/fechamento` : `/mesa/${mesa.numero}`;

          return (
            <Link key={mesa.id} href={destino} className={classe}>
              {conteudo}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
