import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-black tracking-tight text-orange-500">VULCAN PRIME</h1>
      <p className="text-neutral-400">
        Logado como <span className="text-neutral-200">{user?.email}</span>
      </p>
      <p className="text-sm text-neutral-500">
        Etapa 1 (autenticação e banco) concluída — o Salão entra na Etapa 2.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="mt-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:border-orange-500 hover:text-orange-500"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
