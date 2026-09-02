import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
};

/**
 * Cabeçalho canônico de todas as telas do painel.
 * Hierarquia fixa: sobrelinha (contexto) → título serifado (autoridade) → apoio.
 */
export function PainelHeader({ eyebrow, titulo, descricao, acoes, className }: Props) {
  return (
    <header
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border/70 pb-5",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/80 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 truncate font-serif text-[1.75rem] leading-tight font-semibold">
          {titulo}
        </h1>
        {descricao ? (
          <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{descricao}</div>
        ) : null}
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
