"use client";

import type { ReactNode } from "react";

// Formulario (Enviar pra cozinha / Fechar conta) que leva junto toda
// observacao digitada na comanda e ainda nao gravada - a rota grava antes
// de seguir. Sem isso, digitar a obs e clicar direto em Enviar perdia ela.
export function FormComObservacoes({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      method="POST"
      action={action}
      className={className}
      onSubmit={(e) => {
        const form = e.currentTarget;
        form.querySelectorAll("input[data-obs-copia]").forEach((el) => el.remove());
        document.querySelectorAll<HTMLInputElement>("input[data-obs-item]").forEach((campo) => {
          if (campo.value === campo.defaultValue) return;
          const copia = document.createElement("input");
          copia.type = "hidden";
          copia.name = `obs_${campo.dataset.obsItem}`;
          copia.value = campo.value;
          copia.dataset.obsCopia = "1";
          form.appendChild(copia);
        });
      }}
    >
      {children}
    </form>
  );
}
