import { notFound } from "next/navigation";
import { getEntregaPorNumero } from "@/lib/data/entregas";
import { formatBRL } from "@/lib/format";
import { formatDataHoraSaoPaulo } from "@/lib/timezone";
import { AutoPrint } from "../../[numero]/AutoPrint";

export default async function ReciboEntregaPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero: numeroParam } = await params;
  const numero = Number(numeroParam);

  const entrega = await getEntregaPorNumero(numero);
  if (!entrega) notFound();

  return (
    <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[13px] font-bold text-black print:w-full">
      <style>{`
        @page { margin: 0; }
        @media print {
          html, body { width: 80mm; }
          /* impressora térmica: texto preto puro, letra fina sai clara (01/10/2026) */
          * { color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <AutoPrint />

      <div className="text-center">
        <p className="text-base font-bold">VULCAN PRIME</p>
        <p>Entrega #{String(entrega.numero).padStart(2, "0")}</p>
        <p>{formatDataHoraSaoPaulo(new Date(entrega.aberta_em))}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <p>{entrega.cliente_nome}</p>
      <p>{entrega.endereco}</p>

      <div className="my-2 border-t border-dashed border-black" />

      {entrega.itens.map((item) => (
        <div key={item.id} className="flex justify-between">
          <span>
            {item.quantidade}x {item.nome_produto}
          </span>
          <span>{formatBRL(item.preco_unit * item.quantidade)}</span>
        </div>
      ))}

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatBRL(entrega.subtotal)}</span>
      </div>

      {entrega.taxa_entrega > 0 && (
        <div className="flex justify-between">
          <span>Taxa de entrega</span>
          <span>{formatBRL(entrega.taxa_entrega)}</span>
        </div>
      )}

      <div className="flex justify-between text-base font-bold">
        <span>Total</span>
        <span>{formatBRL(entrega.total)}</span>
      </div>

      <p className="mt-1">Pagamento: {entrega.forma_pagamento_nome}</p>
      {entrega.observacao && <p>Obs: {entrega.observacao}</p>}

      <div className="my-2 border-t border-dashed border-black" />

      <p className="text-center font-bold">RECIBO NÃO FISCAL</p>
    </div>
  );
}
