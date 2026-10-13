"use client";

import { useEffect } from "react";

// Imprime o papel da cozinha e, assim que a janela de impressao fecha,
// volta sozinho pra comanda - o caixa nao precisa clicar em nada.
export function ImprimirEVoltar({ voltarHref }: { voltarHref: string }) {
  useEffect(() => {
    const voltar = () => window.location.replace(voltarHref);
    window.addEventListener("afterprint", voltar);
    window.print();
    return () => window.removeEventListener("afterprint", voltar);
  }, [voltarHref]);
  return null;
}
