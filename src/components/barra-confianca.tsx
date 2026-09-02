import { cn } from "@/lib/utils";

/**
 * Barra de confiança — números reais da rede, em tipografia monoespaçada,
 * apresentados como dados certificados e não como estatística de marketing.
 */
export function BarraConfianca({
  prestadores,
  avaliacoesVerificadas,
  tempoMedioRespostaHoras,
  notaMediaRede,
  className,
}: {
  prestadores: number;
  avaliacoesVerificadas: number;
  tempoMedioRespostaHoras: number | null;
  notaMediaRede: number | null;
  className?: string;
}) {
  const numero = new Intl.NumberFormat("pt-BR");

  const dados = [
    { valor: numero.format(prestadores), label: "prestadores com vitrine ativa" },
    { valor: numero.format(avaliacoesVerificadas), label: "avaliações verificadas" },
    {
      valor: tempoMedioRespostaHoras ? `${tempoMedioRespostaHoras.toFixed(1)}h` : "—",
      label: "tempo médio de resposta da rede",
    },
    {
      valor: notaMediaRede ? notaMediaRede.toFixed(2).replace(".", ",") : "—",
      label: "nota média ponderada",
    },
  ];

  return (
    <section
      aria-label="Números da rede Praxa"
      className={cn("border-y border-border bg-card", className)}
    >
      <dl className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-6 px-6 py-6 md:grid-cols-4">
        {dados.map((d) => (
          <div key={d.label} className="flex flex-col gap-1">
            <dt className="order-2 text-[11px] leading-snug text-muted-foreground">{d.label}</dt>
            <dd className="order-1 font-mono text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
              {d.valor}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mx-auto -mt-1 w-full max-w-7xl px-4 sm:px-6 pb-5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        dados apurados diretamente da base · atualizados a cada carregamento
      </p>
    </section>
  );
}
