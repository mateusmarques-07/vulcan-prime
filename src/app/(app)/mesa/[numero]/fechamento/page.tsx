import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMesaPorNumero, getComandaAbertaDaMesa, getItensComanda } from "@/lib/data/comanda";
import { getFormasPagamentoAtivas } from "@/lib/data/pagamentos";
import { ErrorModal } from "@/components/ErrorModal";
import { rotuloMesa } from "@/lib/mesa-label";
import { FechamentoForm } from "./FechamentoForm";

export default async function FechamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const { erro } = await searchParams;
  const numero = Number(numeroParam);

  const mesa = await getMesaPorNumero(numero);
  if (!mesa) notFound();
  if (mesa.status === "livre") redirect("/");
  if (mesa.status === "ocupada") redirect(`/mesa/${numero}`);

  const comanda = await getComandaAbertaDaMesa(mesa.id);
  if (!comanda) redirect("/");

  const [itens, formas] = await Promise.all([
    getItensComanda(comanda.id),
    getFormasPagamentoAtivas(),
  ]);

  const subtotal = itens.reduce((soma, item) => soma + item.preco_unit * item.quantidade, 0);
  const rotulo = rotuloMesa(mesa.tipo, mesa.numero);

  return (
    <div>
      <header className="mx-auto mb-6 max-w-2xl">
        <Link href={`/mesa/${numero}`} className="text-sm text-neutral-400 hover:text-orange-500">
          ← Voltar pra comanda
        </Link>
        <h1 className="text-2xl font-bold text-white">Fechar {rotulo}</h1>
      </header>

      <FechamentoForm
        numero={mesa.numero}
        comandaId={comanda.id}
        itens={itens}
        subtotal={subtotal}
        formas={formas}
        tipo={mesa.tipo}
        gorjetaAtivaInicial={mesa.gorjeta_ativa}
        gorjetaPctInicial={mesa.gorjeta_pct}
        pessoasInicial={mesa.qtd_pessoas}
        taxaEntregaInicial={mesa.taxa_entrega}
      />

      <ErrorModal mensagem={erro} voltarHref={`/mesa/${numero}/fechamento`} />
    </div>
  );
}
