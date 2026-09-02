import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selo de verificação usado nos depoimentos da landing.
 * Dispara o carimbo cerimonial (stamp-in) quando a seção entra na tela,
 * em sequência escalonada — é o momento de "opinião virou dado verificado".
 */
export function SeloAvaliacao({
  rotulo,
  animar,
  delay = 0,
  className,
}: {
  rotulo: string;
  animar: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <span
      aria-label={`Avaliação verificada — ${rotulo}`}
      style={animar ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        "selo-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        animar ? "animate-stamp-in" : "opacity-100",
        className,
      )}
    >
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      {rotulo}
    </span>
  );
}
