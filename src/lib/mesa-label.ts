export type TipoMesa = "mesa" | "balcao" | "entrega";

export function rotuloMesa(tipo: TipoMesa, numero: number): string {
  if (tipo === "balcao") return "Balcão";
  if (tipo === "entrega") return "Entrega";
  return `Mesa ${String(numero).padStart(2, "0")}`;
}
