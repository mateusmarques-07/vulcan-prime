"use client";

import type { ReactNode } from "react";

// Botao de envio de formulario que pede confirmacao antes (so quando
// `mensagem` vem preenchida) - ex: tirar item que ja foi pra cozinha.
export function BotaoConfirmar({
  mensagem,
  className,
  children,
}: {
  mensagem?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (mensagem && !window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
