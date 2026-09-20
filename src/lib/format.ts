export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function round2(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
