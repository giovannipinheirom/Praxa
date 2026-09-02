import { Link } from "@tanstack/react-router";
import { Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Iniciais, type PrestadorResumo } from "@/components/prestador-card";
import { categoriaLabel } from "@/lib/marketplace";

function Chip({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3 shrink-0" />}
      {children}
    </span>
  );
}

export function LinhaPrestador({ prestador }: { prestador: PrestadorResumo }) {
  const local =
    [prestador.cidade, prestador.estado].filter(Boolean).join(" · ") ||
    prestador.regiao_atendimento ||
    "Atende remoto";

  const resposta = prestador.tempo_medio_resposta_horas
    ? `Responde em ~${Number(prestador.tempo_medio_resposta_horas).toFixed(0)}h`
    : "Tempo de resposta não medido";

  return (
    <article className="surface-panel grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-5 p-4 transition-shadow hover:shadow-[var(--shadow-elevated)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5">
      {prestador.foto_perfil_url ? (
        <img
          src={prestador.foto_perfil_url}
          alt={`Logo de ${prestador.nome_negocio}`}
          className="size-11 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <span className="shrink-0 [&>*]:size-11 [&>*]:rounded-lg [&>*]:text-sm">
          <Iniciais nome={prestador.nome_negocio} />
        </span>
      )}

      <div className="col-span-1 min-w-0 sm:col-span-1 sm:col-start-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="min-w-0 truncate text-base font-semibold">
            <Link
              to="/pro/$slug"
              params={{ slug: prestador.slug }}
              className="hover:text-primary"
            >
              {prestador.nome_negocio}
            </Link>
          </h3>
          {prestador.impulsionado && (
            <span
              title="Espaço pago, exibido por rotação entre elegíveis"
              className="inline-flex shrink-0 items-center rounded-full border border-[oklch(0.78_0.11_85)] bg-foreground/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-background"
            >
              Impulsionado
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {categoriaLabel(prestador.categoria_principal)} · {local}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Chip icon={Clock}>{resposta}</Chip>
          <Chip icon={Wallet}>{prestador.faixa_preco}</Chip>
          {(prestador.subcategorias ?? []).slice(0, 2).map((sub) => (
            <Chip key={sub}>{sub}</Chip>
          ))}
        </div>
      </div>

      <div className="col-start-2 row-start-1 flex flex-col items-end gap-2 sm:col-start-3 sm:row-span-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="font-mono text-2xl font-semibold leading-none tabular-nums">
              {Number(prestador.nota_media).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({prestador.total_avaliacoes})
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">avaliações verificadas</p>
        </div>
        <Button asChild size="sm" variant="outline" className="hidden shrink-0 sm:inline-flex">
          <Link to="/pro/$slug" params={{ slug: prestador.slug }}>
            Ver perfil
          </Link>
        </Button>
      </div>

      <Button asChild size="sm" variant="outline" className="col-span-2 sm:hidden">
        <Link to="/pro/$slug" params={{ slug: prestador.slug }}>
          Ver perfil
        </Link>
      </Button>
    </article>
  );
}
