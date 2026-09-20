import { notFound } from "next/navigation";
import { getMesaPorNumero, getComandaAbertaDaMesa, getItensComanda } from "@/lib/data/comanda";
import { formatBRL, round2 } from "@/lib/format";
import { formatDataHoraSaoPaulo } from "@/lib/timezone";
import { rotuloMesa } from "@/lib/mesa-label";
import { AutoPrint } from "./AutoPrint";

export default async function ReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ gorjetaPct?: string; pessoas?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const { gorjetaPct: gorjetaPctParam, pessoas: pessoasParam } = await searchParams;
  const numero = Number(numeroParam);

  const mesa = await getMesaPorNumero(numero);
  if (!mesa) notFound();

  const comanda = await getComandaAbertaDaMesa(mesa.id);
  if (!comanda) notFound();

  const itens = await getItensComanda(comanda.id);
  const subtotal = round2(itens.reduce((soma, item) => soma + item.preco_unit * item.quantidade, 0));

  const gorjetaPct = Number(gorjetaPctParam) || 0;
  const gorjetaValor = round2((subtotal * gorjetaPct) / 100);
  const total = round2(subtotal + gorjetaValor);

  const pessoas = Number(pessoasParam) || 0;
  const valorPorPessoa = pessoas > 0 ? total / pessoas : null;

  const rotulo = rotuloMesa(mesa.tipo, mesa.numero);

  return (
    <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-xs text-black print:w-full">
      <style>{`
        @page { margin: 0; }
        @media print {
          html, body { width: 80mm; }
        }
      `}</style>

      <AutoPrint />

      <div className="text-center">
        <p className="text-sm font-bold">VULCAN PRIME</p>
        <p>{rotulo}</p>
        <p>{formatDataHoraSaoPaulo(new Date())}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {itens.map((item) => (
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
        <span>{formatBRL(subtotal)}</span>
      </div>

      {gorjetaPct > 0 && (
        <div className="flex justify-between">
          <span>Taxa de serviço ({gorjetaPct}%)</span>
          <span>{formatBRL(gorjetaValor)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm font-bold">
        <span>Total</span>
        <span>{formatBRL(total)}</span>
      </div>

      {valorPorPessoa !== null && (
        <p className="mt-1 text-center">
          Dividido por {pessoas} pessoas: {formatBRL(valorPorPessoa)} cada
        </p>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <p className="text-center font-bold">RECIBO NÃO FISCAL</p>
    </div>
  );
}
