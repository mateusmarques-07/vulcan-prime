import Link from "next/link";
import { alterarSenha } from "./actions";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { erro, sucesso } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-white">Configurações</h1>

      <Link
        href="/configuracoes/pagamentos"
        className="mb-6 block rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm font-medium text-neutral-200 transition hover:border-orange-500 hover:text-orange-500"
      >
        Formas de pagamento →
      </Link>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-200">Alterar senha</h2>

        {erro && (
          <p className="mb-3 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{erro}</p>
        )}
        {sucesso && (
          <p className="mb-3 rounded-lg bg-green-950 px-3 py-2 text-sm text-green-400">
            Senha alterada com sucesso.
          </p>
        )}

        <form action={alterarSenha} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-300">Nova senha</label>
            <input
              type="password"
              name="novaSenha"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-300">Confirmar nova senha</label>
            <input
              type="password"
              name="confirmar"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white transition hover:bg-orange-500"
          >
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  );
}
