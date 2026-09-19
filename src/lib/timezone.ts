const TZ = "America/Sao_Paulo";

// Brasil aboliu o horário de verão em 2019, então -03:00 é o offset fixo
// de America/Sao_Paulo hoje em dia (sem variação sazonal a considerar).
export function inicioFimHojeSaoPaulo() {
  const hojeSP = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const inicio = new Date(`${hojeSP}T00:00:00-03:00`);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fim };
}
