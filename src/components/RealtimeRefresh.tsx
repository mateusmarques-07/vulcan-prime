"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Escuta mudanca nas tabelas passadas (ex: garcom lancando item pelo
// celular) e manda o Next.js buscar dado novo do servidor - sem isso a
// tela so atualiza quando alguem clica em algo ou da F5. Nao renderiza
// nada, e so um "ouvido" ligado na tela.
export function RealtimeRefresh({ tables }: { tables: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelado = false;

    // O canal so recebe as mudancas se o Realtime souber quem esta
    // perguntando (RLS exige "authenticated") - sem isso ele assina como
    // visitante anonimo e nenhum evento chega, sem erro nenhum.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelado) return;
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);

      channel = supabase.channel(`refresh-${tables.join("-")}`);
      for (const table of tables) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, () => router.refresh());
      }
      channel.subscribe();
    });

    return () => {
      cancelado = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);

  return null;
}
