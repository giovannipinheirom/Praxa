/**
 * Diagramas simples dos três passos — desenhados com formas primitivas,
 * na paleta do produto. Sem clip-art genérico.
 */

const traco = "var(--color-border)";
const acento = "var(--color-primary)";
const tinta = "var(--color-foreground)";

export function DiagramaBusca() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="Campo de busca com resultados listados" className="h-24 w-full">
      <rect x="8" y="10" width="144" height="22" rx="11" fill="none" stroke={traco} strokeWidth="1.5" />
      <circle cx="26" cy="21" r="5" fill="none" stroke={acento} strokeWidth="1.8" />
      <line x1="30" y1="25" x2="34" y2="29" stroke={acento} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="44" y="18" width="52" height="6" rx="3" fill={traco} />
      <rect x="112" y="14" width="34" height="14" rx="7" fill={acento} opacity="0.85" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${44 + i * 18})`}>
          <rect x="8" y="0" width="144" height="14" rx="7" fill="none" stroke={traco} />
          <circle cx="20" cy="7" r="4" fill={traco} />
          <rect x="30" y="4" width="60" height="6" rx="3" fill={traco} opacity="0.7" />
          <rect x="120" y="4" width="24" height="6" rx="3" fill={acento} opacity={0.5 - i * 0.15} />
        </g>
      ))}
    </svg>
  );
}

export function DiagramaReputacao() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="Perfil com selo de verificação e nota" className="h-24 w-full">
      <rect x="8" y="8" width="144" height="80" rx="10" fill="none" stroke={traco} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="12" fill="none" stroke={traco} strokeWidth="1.5" />
      <rect x="52" y="22" width="52" height="7" rx="3.5" fill={tinta} opacity="0.65" />
      <rect x="52" y="35" width="34" height="6" rx="3" fill={traco} />
      <g transform="translate(112 22)">
        <rect width="30" height="16" rx="8" fill="var(--color-gold)" opacity="0.9" />
        <path d="M8 8.5l3 3 6-6" fill="none" stroke="var(--color-gold-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={24 + i * 12} cy="60" r="4" fill={acento} opacity={i < 4 ? 1 : 0.25} />
      ))}
      <rect x="24" y="72" width="92" height="6" rx="3" fill={traco} opacity="0.7" />
    </svg>
  );
}

export function DiagramaContato() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="Conversa direta entre empresa e prestador" className="h-24 w-full">
      <rect x="8" y="16" width="76" height="30" rx="10" fill="none" stroke={traco} strokeWidth="1.5" />
      <rect x="20" y="27" width="44" height="6" rx="3" fill={traco} />
      <path d="M20 46l0 10 12-10" fill="none" stroke={traco} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="76" y="52" width="76" height="30" rx="10" fill="none" stroke={acento} strokeWidth="1.5" />
      <rect x="88" y="63" width="40" height="6" rx="3" fill={acento} opacity="0.6" />
      <path d="M140 82l0 10-12-10" fill="none" stroke={acento} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
