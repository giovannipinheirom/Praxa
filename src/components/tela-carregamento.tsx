import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Overlay de transição entre páginas.
 * Delays padrão de mercado: só aparece se a navegação passar de 300ms
 * (evita flash em rotas rápidas) e, uma vez visível, fica no mínimo 500ms
 * (evita piscada). Mesma régua usada por Next.js/TanStack por padrão.
 */
const DELAY_ANTES_DE_MOSTRAR = 300;
const TEMPO_MINIMO_VISIVEL = 500;

export function TelaCarregamento() {
  const status = useRouterState({ select: (s) => s.status });
  const carregando = status === "pending";
  const [visivel, setVisivel] = useState(false);
  const mostradoEm = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (carregando) {
      timer = setTimeout(() => {
        mostradoEm.current = Date.now();
        setVisivel(true);
      }, DELAY_ANTES_DE_MOSTRAR);
    } else if (visivel) {
      const decorrido = Date.now() - (mostradoEm.current ?? Date.now());
      const restante = Math.max(0, TEMPO_MINIMO_VISIVEL - decorrido);
      timer = setTimeout(() => {
        mostradoEm.current = null;
        setVisivel(false);
      }, restante);
    }

    return () => clearTimeout(timer);
  }, [carregando, visivel]);

  if (!visivel) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5",
        "bg-background/95 backdrop-blur-sm animate-in fade-in duration-200",
      )}
    >
      <span className="relative grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Hexagon className="size-7 animate-pulse" strokeWidth={2.4} />
        <span className="absolute inset-0 rounded-2xl border border-primary/40 animate-ping" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">Praxa</span>
      <span className="h-px w-28 overflow-hidden rounded-full bg-border">
        <span className="block h-full w-1/3 animate-[carregando-barra_1.1s_ease-in-out_infinite] bg-primary" />
      </span>
    </div>
  );
}