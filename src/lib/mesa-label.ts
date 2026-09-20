export type TipoMesa = "mesa" | "balcao";

export function rotuloMesa(tipo: TipoMesa, numero: number): string {
  if (tipo === "balcao") return "Balcão (Retirada)";
  return `Mesa ${String(numero).padStart(2, "0")}`;
}
