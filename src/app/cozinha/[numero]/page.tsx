import Link from "next/link";
import { notFound } from "next/navigation";
import { getMesaPorNumero, getComandaAbertaDaMesa, getEnvioCozinha } from "@/lib/data/comanda";
import { formatDataHoraSaoPaulo } from "@/lib/timezone";
import { rotuloMesa } from "@/lib/mesa-label";
import { ImprimirEVoltar } from "./ImprimirEVoltar";

// Papel da cozinha (13/10/2026): so comida, sem preco, com acompanhamentos
// e observacao em linhas separadas. Mostra um envio especifico (?em=), o
// mesmo usado pelo "Reimprimir".
export default async function CozinhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ em?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const { em } = await searchParams;
  const numero = Number(numeroParam);
  if (!em) notFound();

  const mesa = await getMesaPorNumero(numero);
  if (!mesa) notFound();

  const comanda = await getComandaAbertaDaMesa(mesa.id);
  if (!comanda) notFound();

  const { itens, numeroEnvio } = await getEnvioCozinha(comanda.id, em);
  const voltarHref = `/mesa/${numero}`;

  return (
    <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[13px] font-bold text-black print:w-full">
      <style>{`
        @page { margin: 0; }
        @media print {
          html, body { width: 80mm; }
          * { color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .nao-imprimir { display: none !important; }
        }
      `}</style>

      <ImprimirEVoltar voltarHref={voltarHref} />

      <div className="text-center">
        <p className="text-lg font-bold">COZINHA - {rotuloMesa(mesa.tipo, mesa.numero).toUpperCase()}</p>
        <p>{formatDataHoraSaoPaulo(new Date(em))}</p>
        {numeroEnvio > 1 && <p>{numeroEnvio}º pedido da mesa</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {itens.length === 0 ? (
        <p className="text-center">Nenhum item nesse envio.</p>
      ) : (
        itens.map((item) => (
          <div key={item.id} className="mb-2">
            <p className="text-base font-bold uppercase">
              {item.quantidade}x {item.nome_produto}
            </p>
            {item.acompanhamentos && <p className="pl-4">Acomp: {item.acompanhamentos}</p>}
            {item.observacao && <p className="pl-4">OBS: {item.observacao}</p>}
          </div>
        ))
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <Link
        href={voltarHref}
        className="nao-imprimir mt-4 block rounded-lg bg-neutral-900 py-2 text-center text-sm text-white"
      >
        ← Voltar pra comanda
      </Link>
    </div>
  );
}
