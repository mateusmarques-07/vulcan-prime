"use client";

import { useEffect, useRef } from "react";

// Da feedback visual imediato em qualquer clique que envie um formulario
// (abrir mesa, lancar produto, fechar conta...): uma barra no topo que
// "anda" e o botao clicado fica meio apagado enquanto a pagina carrega a
// resposta. Como toda mutacao aqui e um POST com navegacao de pagina
// (decisao da secao 34 da spec), a barra nao precisa ser escondida
// manualmente - a troca de pagina substitui o DOM inteiro sozinha.
export function LoadingBar() {
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoEnviar(evento: SubmitEvent) {
      const barra = barraRef.current;
      if (barra) {
        barra.style.transition = "none";
        barra.style.width = "0%";
        barra.style.opacity = "1";
        requestAnimationFrame(() => {
          barra.style.transition = "width 1.1s cubic-bezier(0.1, 0.7, 0.4, 1)";
          barra.style.width = "75%";
        });
      }

      const alvo = evento.target as HTMLFormElement;
      const botao = alvo?.querySelector('button[type="submit"]:not(:disabled)') as HTMLButtonElement | null;
      if (botao) {
        botao.style.transition = "opacity 0.15s ease";
        botao.style.opacity = "0.55";
        botao.style.cursor = "wait";
      }
    }

    document.addEventListener("submit", aoEnviar, true);
    return () => document.removeEventListener("submit", aoEnviar, true);
  }, []);

  return (
    <div
      ref={barraRef}
      className="pointer-events-none fixed left-0 top-0 z-50 h-[3px] bg-gradient-to-r from-orange-500 to-red-500 opacity-0"
      style={{ width: "0%" }}
    />
  );
}
