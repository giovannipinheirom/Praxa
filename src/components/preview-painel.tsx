import { BadgeCheck, CalendarDays, LayoutDashboard, MessagesSquare, Star } from "lucide-react";

/**
 * Mini-preview do painel do prestador — mostra, sem screenshot,
 * o que a pessoa recebe já no cadastro gratuito.
 */
export function PreviewPainel() {
  return (
    <div className="rounded-[2rem] border border-border/60 bg-white p-4 shadow-elevated transition-transform hover:scale-[1.01]" role="img" aria-label="Prévia do painel do prestador: perfil público, avaliações e contatos">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
        </div>
        <span className="ml-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Dashboard Operacional</span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-0">
        <nav className="hidden flex-col gap-1 border-r border-border p-3 sm:flex" aria-hidden="true">
          {[LayoutDashboard, MessagesSquare, CalendarDays, Star].map((Icone, i) => (
            <span
              key={i}
              className={
                i === 0
                  ? "flex items-center gap-2 rounded-md border-l-2 border-gold bg-muted/60 px-2.5 py-2 text-xs font-medium"
                  : "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground"
              }
            >
              <Icone className="size-3.5" />
              <span className="hidden md:inline">
                {["Visão geral", "CRM", "Agenda", "Avaliações"][i]}
              </span>
            </span>
          ))}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground">
              CT
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Contábil Torres</p>
              <p className="font-mono text-[11px] text-muted-foreground">/pro/contabil-torres</p>
            </div>
            <span className="selo-gold ml-auto hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase sm:inline-flex">
              <BadgeCheck className="size-3" aria-hidden="true" />
              no ar
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { v: "4,8", l: "nota" },
              { v: "23", l: "avaliações" },
              { v: "6", l: "contatos" },
            ].map((m) => (
              <div key={m.l} className="rounded-lg border border-border px-3 py-2">
                <p className="font-mono text-lg font-semibold tabular-nums">{m.v}</p>
                <p className="text-[10px] text-muted-foreground">{m.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {["Novo contato · Marketing B2B", "Proposta enviada · R$ 2.400"].map((linha) => (
              <div
                key={linha}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground"
              >
                <span className="truncate">{linha}</span>
                <span className="font-mono">hoje</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
