"use client";

import { useState } from "react";

// Campo de observacao do item. Alem do botao Salvar, grava sozinho quando o
// caixa sai do campo (13/10/2026: "mal passada" digitado e nao salvo nao
// saiu no papel da cozinha). O data-obs-item deixa o FormComObservacoes
// mandar junto o que estiver digitado, caso o clique em Enviar/Fechar
// aconteca antes de gravar.
export function ObservacaoItem({
  itemId,
  numero,
  inicial,
}: {
  itemId: string;
  numero: number;
  inicial: string;
}) {
  const [salvo, setSalvo] = useState(inicial);
  const [mostrarOk, setMostrarOk] = useState(false);

  async function salvarSozinho(valor: string) {
    if (valor.trim() === salvo.trim()) return;
    const dados = new FormData();
    dados.set("itemId", itemId);
    dados.set("numero", String(numero));
    dados.set("observacao", valor);
    dados.set("silencioso", "1");
    const resposta = await fetch("/api/itens/observacao", { method: "POST", body: dados });
    if (resposta.ok) {
      setSalvo(valor);
      setMostrarOk(true);
      setTimeout(() => setMostrarOk(false), 2000);
    }
  }

  return (
    <form method="POST" action="/api/itens/observacao" className="mt-2 flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="numero" value={numero} />
      <input
        type="text"
        name="observacao"
        data-obs-item={itemId}
        defaultValue={inicial}
        onBlur={(e) => salvarSozinho(e.target.value)}
        placeholder="Observação (ex: sem cebola)"
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500"
      />
      {mostrarOk && <span className="shrink-0 text-xs text-green-400">✓ salvo</span>}
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-500"
      >
        Salvar
      </button>
    </form>
  );
}
