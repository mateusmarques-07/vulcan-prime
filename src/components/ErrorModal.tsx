import Link from "next/link";

export function ErrorModal({ mensagem, voltarHref }: { mensagem?: string; voltarHref: string }) {
  if (!mensagem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-red-900 bg-neutral-900 p-6 text-center shadow-xl">
        <p className="mb-4 text-base text-neutral-100">{mensagem}</p>
        <Link
          href={voltarHref}
          className="inline-block rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
        >
          Entendi
        </Link>
      </div>
    </div>
  );
}
