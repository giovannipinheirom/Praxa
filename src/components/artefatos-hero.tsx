import { BadgeCheck, Star, ShieldCheck, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Artefatos de interface refinados que flutuam ao redor da busca na Hero.
 * Comunicam reputação e marketplace vivo sem o peso de um dashboard completo.
 */

export function ArtefatosHero() {
  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-visible">
      {/* 1. Card de Reputação - Superior Direita */}
      <div className="absolute -top-12 -right-40 animate-bounce-subtle" style={{ animationDelay: "0.8s" }}>
        <div className="surface-float flex items-center gap-2 px-4 py-2.5 rotate-[4deg] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="size-3.5 fill-primary text-primary" />
            ))}
          </div>
          <span className="text-sm font-bold text-ink ml-1">4.9</span>
        </div>
      </div>

      {/* 3. Tag de Categoria - Inferior Esquerda */}
      <div className="absolute -bottom-6 -left-40 animate-bounce-subtle" style={{ animationDelay: "1.2s" }}>
        <div className="chip-credencial flex items-center gap-2 px-4 py-2 rotate-[2deg] bg-white shadow-sm">
          <BadgeCheck className="size-3.5 text-gold" />
          <span className="text-[10px] font-bold uppercase tracking-wide font-sans">Marketing B2B</span>
        </div>
      </div>

      {/* 4. Métrica de Velocidade - Inferior Direita */}
      <div className="absolute -bottom-24 -right-16 animate-bounce-subtle" style={{ animationDelay: "0.5s" }}>
        <div className="surface-panel flex items-center gap-3 px-4 py-2.5 rotate-[-3deg] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl border-slate-100">
          <div className="relative flex size-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-500" />
            <span className="text-[11px] font-semibold text-ink font-sans">Responde em ~2h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
