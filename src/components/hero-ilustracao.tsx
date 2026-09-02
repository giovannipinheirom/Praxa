import { BadgeCheck, Star, ShieldCheck, TrendingUp, Users } from "lucide-react";

/**
 * Ilustração contextual que substitui a screenshot genérica/fria.
 * Foca em credibilidade (dados, selos, métricas) e estética moderna (profundidade, glassmorphism).
 */
export function HeroIlustracao() {
  return (
    <div className="relative h-full w-full py-12" role="img" aria-label="Ilustração de credibilidade: métricas de confiança, selos verificados e crescimento">
      {/* Círculos de luz de fundo para profundidade */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Peça Principal: Card de Reputação (Perspective Skew) */}
      <div className="relative mx-auto max-w-sm rotate-[4deg] skew-y-[-2deg] transition-transform hover:rotate-0 hover:skew-y-0 duration-700">
        <div className="surface-float overflow-hidden p-6 backdrop-blur-sm bg-white/90">
          <div className="flex items-center gap-4 border-b border-border/40 pb-5">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="size-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Score de Confiança</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="size-4 fill-primary text-primary" />
                <Star className="size-4 fill-primary text-primary" />
                <Star className="size-4 fill-primary text-primary" />
                <Star className="size-4 fill-primary text-primary" />
                <Star className="size-4 fill-primary text-primary" />
                <span className="text-xs font-mono ml-2 text-primary font-bold">9.8</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Clientes Atendidos</span>
              <span className="font-mono font-bold text-ink">128+</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-primary rounded-full" />
            </div>
            
            <div className="flex items-center justify-between text-xs mt-4">
              <span className="text-muted-foreground">Taxa de Resposta</span>
              <span className="font-mono font-bold text-ink">~45min</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[98%] bg-success rounded-full" />
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-border/40">
            <div className="flex -space-x-3 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="inline-block size-8 rounded-full ring-2 ring-white bg-muted flex items-center justify-center text-[10px] font-bold">
                  {i}
                </div>
              ))}
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-2 ring-white">
                +120
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground font-medium">
              Avaliações verificadas por CNPJ este mês
            </p>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-6 -right-6 rotate-[12deg] bg-success text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-subtle">
          <BadgeCheck className="size-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Auditado</span>
        </div>

        <div className="absolute -bottom-8 -left-8 -rotate-[8deg] surface-panel px-4 py-3 shadow-elevated bg-white/80 backdrop-blur-md flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-ink uppercase tracking-tighter">Retenção B2B</p>
            <p className="text-sm font-mono font-bold text-success">94.2%</p>
          </div>
        </div>
      </div>
      
      {/* Decorative Dots Pattern */}
      <div className="absolute bottom-0 right-0 size-32 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--color-ink) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
    </div>
  );
}
