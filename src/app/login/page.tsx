import Image from "next/image";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt="Vulcan Prime"
            width={72}
            height={72}
            className="rounded-full border-2 border-orange-600/60"
            priority
          />
          <h1 className="text-2xl font-black tracking-tight text-orange-500">
            VULCAN PRIME
          </h1>
          <p className="text-sm text-neutral-400">Controle de salão</p>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <div className="space-y-2">
          <label htmlFor="usuario" className="block text-sm font-medium text-neutral-300">
            Usuário
          </label>
          <input
            id="usuario"
            name="usuario"
            type="text"
            required
            autoFocus
            autoComplete="username"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-base text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="senha" className="block text-sm font-medium text-neutral-300">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-base text-white outline-none focus:border-orange-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-500"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
