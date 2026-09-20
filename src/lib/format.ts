export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function round2(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// Formata o texto de um campo digitado livremente (preço, valor pago) pra
// "30.00" assim que o usuário sai do campo - mantém o texto original se não
// for um número válido, em vez de zerar o que a pessoa digitou.
export function formatarInputMoeda(valorDigitado: string): string {
  const n = Number(valorDigitado.replace(",", "."));
  return Number.isNaN(n) || valorDigitado.trim() === "" ? valorDigitado : n.toFixed(2);
}
