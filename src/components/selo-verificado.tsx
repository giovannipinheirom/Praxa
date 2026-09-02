import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selo de verificação do perfil público.
 * Usa a animação de carimbo (stamp-in) — reservada a marcos de oficialização.
 * Só anima na PRIMEIRA vez que o visitante vê aquele perfil na sessão;
 * nas visitas seguintes aparece já "assentado".
 */
export function SeloVerificado({
  chaveSessao,
  className,
}: {
  chaveSessao: string;
  className?: string;
}) {
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    const chave = `praxa:selo-visto:${chaveSessao}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // sessionStorage indisponível: mostra assentado, sem animar.
      return;
    }
    setAnimar(true);
  }, [chaveSessao]);

  return (
    <span
      className={cn(
        "selo-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase",
        animar && "animate-stamp-in",
        className,
      )}
    >
      <ShieldCheck className="size-3.5" />
      Prestador verificado
    </span>
  );
}
