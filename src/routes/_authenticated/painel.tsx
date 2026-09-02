import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  Sparkles,
  Star,
  Users,
  UserSquare2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { usePrestador } from "@/hooks/use-prestador";
import { cn } from "@/lib/utils";

const ITENS = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true, grupo: "geral" },
  { to: "/painel/perfil", label: "Perfil público", icon: UserSquare2, exact: false, grupo: "geral" },
  { to: "/painel/avaliacoes", label: "Avaliações", icon: Star, exact: false, grupo: "geral" },
  { to: "/painel/pipeline", label: "Pipeline", icon: Users, exact: false, grupo: "trabalho" },
  { to: "/painel/crm", label: "CRM", icon: UserSquare2, exact: false, grupo: "trabalho" },
  { to: "/painel/agenda", label: "Agenda", icon: CalendarDays, exact: false, grupo: "trabalho" },
  { to: "/painel/propostas", label: "Propostas", icon: FileText, exact: false, grupo: "trabalho" },
  {
    to: "/painel/demandas",
    label: "Pool de demandas",
    icon: BadgeCheck,
    exact: false,
    grupo: "trabalho",
    requerPool: true,
  },
  { to: "/painel/destaque", label: "Destaque pago", icon: Sparkles, exact: false, grupo: "conta" },
  { to: "/painel/assinatura", label: "Assinatura", icon: CreditCard, exact: false, grupo: "conta" },
] as const;

const GRUPOS = [
  { id: "geral", label: "Credencial" },
  { id: "trabalho", label: "Operação" },
  { id: "conta", label: "Conta" },
] as const;

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelLayout,
});

function PainelLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = usePrestador();
  const temPool = Boolean(data?.recursos?.pool_demandas);

  const visiveis = ITENS.filter((i) => !("requerPool" in i && i.requerPool) || temPool);
  const nome = data?.prestador?.nome_negocio;
  const plano = data?.plano?.nome ?? "Grátis";
  const iniciais = (nome ?? "P")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="painel" />
      <div className="mx-auto grid w-full max-w-[clamp(1024px,90vw,1440px)] gap-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)] py-[clamp(1.5rem,4vh,3rem)] lg:grid-cols-[clamp(200px,18vw,260px)_minmax(0,1fr)] grid-cols-1">
        <aside className="h-fit lg:sticky lg:top-24">
          {/* Credencial compacta — identidade sempre visível na navegação */}
          <div className="mb-5 hidden items-center gap-3 rounded-xl border border-border/70 bg-secondary/50 p-3 lg:flex">
            {data?.prestador?.foto_perfil_url ? (
              <img
                src={data.prestador.foto_perfil_url}
                alt=""
                className="size-9 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-gold-ink">
                {iniciais}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{nome ?? "Seu negócio"}</p>
              <p className="truncate text-[11px] font-mono tracking-wide text-muted-foreground uppercase">
                Plano {plano}
              </p>
            </div>
          </div>

          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0">
            {GRUPOS.map((grupo) => {
              const itens = visiveis.filter((i) => i.grupo === grupo.id);
              if (!itens.length) return null;
              return (
                <div key={grupo.id} className="flex shrink-0 gap-1 lg:flex-col lg:gap-0.5">
                  <p className="hidden px-3 pb-2 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/70 uppercase lg:block">
                    {grupo.label}
                  </p>
                  {itens.map((item) => {
                    const ativo = item.exact
                      ? pathname === item.to
                      : pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "group relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
                          ativo
                            ? "bg-primary/10 font-medium text-gold-ink"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-2 bottom-2 -left-px w-[2px] rounded-full transition-colors",
                            ativo ? "bg-primary" : "bg-transparent",
                          )}
                        />
                        <item.icon
                          className={cn(
                            "size-4 shrink-0",
                            ativo ? "text-gold-ink" : "opacity-60 group-hover:opacity-90",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

