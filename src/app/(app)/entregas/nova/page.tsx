import Link from "next/link";
import { getCardapio } from "@/lib/data/comanda";
import { getFormasPagamentoAtivas } from "@/lib/data/pagamentos";
import { ErrorModal } from "@/components/ErrorModal";
import { NovaEntregaForm } from "./NovaEntregaForm";

export default async function NovaEntregaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const [cardapio, formas] = await Promise.all([getCardapio(), getFormasPagamentoAtivas()]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <Link href="/entregas" className="text-sm text-neutral-400 hover:text-orange-500">
          ← Entregas
        </Link>
        <h1 className="text-2xl font-bold text-white">Nova Entrega</h1>
      </header>

      <NovaEntregaForm cardapio={cardapio} formas={formas} />

      <ErrorModal mensagem={erro} voltarHref="/entregas/nova" />
    </div>
  );
}
