import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  MapPin,
  MessagesSquare,
  Phone,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Demo do produto que roda logo abaixo da hero (padrão "vídeo do Notion"):
 * um frame de navegador que percorre sozinho as três telas centrais da Praxa.
 * Sem arquivo de vídeo — é a própria UI animada, então fica nítida em qualquer tela.
 */

const DURACAO = 5200;

const CENAS = [
  { id: "busca", label: "Busque" },
  { id: "resultados", label: "Compare" },
  { id: "perfil", label: "Contrate" },
] as const;

export function DemoProduto() {
  const [cena, setCena] = useState(0);
  const [ativo, setAtivo] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReduzido(Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setAtivo(entries.some((e) => e.isIntersecting)),
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!ativo || reduzido) return;
    const t = setTimeout(() => setCena((c) => (c + 1) % CENAS.length), DURACAO);
    return () => clearTimeout(t);
  }, [ativo, reduzido, cena]);


  return (
    <div ref={ref} className="mx-auto w-full max-w-5xl">
      {/* Abas: navegação manual + indicação de progresso do loop */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
        {CENAS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCena(i)}
            aria-current={i === cena}
            className={cn(
              "relative overflow-hidden rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              i === cena
                ? "bg-primary/12 text-gold-ink"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="relative z-10">{c.label}</span>
            {i === cena && !reduzido && ativo && (
              <span
                key={cena}
                aria-hidden
                className="demo-progresso absolute inset-x-0 bottom-0 h-[2px] origin-left bg-primary"
                style={{ animationDuration: `${DURACAO}ms` }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="surface-panel overflow-hidden shadow-[0_40px_90px_-50px_oklch(0_0_0/0.45)]">



        <div className="relative bg-background">
          <div className="grid">
            {CENAS.map((c, i) => (
              <div
                key={c.id}
                aria-hidden={i !== cena}
                className={cn(
                  "col-start-1 row-start-1 grid content-center p-5 transition-all duration-700 sm:p-8",
                  i === cena
                    ? "z-10 translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                {c.id === "busca" && <CenaBusca ativa={i === cena && !reduzido} />}
                {c.id === "resultados" && <CenaResultados ativa={i === cena && !reduzido} />}
                {c.id === "perfil" && <CenaPerfil />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CenaBusca({ ativa }: { ativa: boolean }) {
  const termo = "contabilidade";
  const [n, setN] = useState(termo.length);

  useEffect(() => {
    if (!ativa) {
      setN(termo.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= termo.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [ativa]);

  return (
    <div className="mx-auto max-w-2xl py-6 text-center sm:py-12">
      <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
        sem cadastro · sem paywall
      </p>
      <p className="mt-3 text-xl font-semibold sm:text-2xl">
        Quem atende a sua empresa?
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2 text-left">
        <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">
          {termo.slice(0, n)}
          <span className="ml-px inline-block h-4 w-[1.5px] translate-y-0.5 bg-primary align-middle" />
        </span>
        <span className="hidden items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex">
          <MapPin className="size-3" />
          São Paulo · SP
        </span>
        <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Buscar
        </span>
      </div>

      <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
        {["Marketing", "Jurídico", "TI", "RH"].map((t) => (
          <li
            key={t}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const RESULTADOS = [
  {
    nome: "Nexa Contábil",
    headline: "Contabilidade para empresas de tecnologia",
    nota: "4,9",
    avaliacoes: 38,
    local: "São Paulo · SP",
    destaque: false,
  },
  {
    nome: "Fiscalis Assessoria",
    headline: "Regime tributário e folha para PMEs",
    nota: "4,7",
    avaliacoes: 21,
    local: "Campinas · SP",
    destaque: true,
  },
  {
    nome: "Órbita Consultoria",
    headline: "BPO financeiro e fechamento mensal",
    nota: "4,6",
    avaliacoes: 15,
    local: "Santo André · SP",
    destaque: false,
  },
];

function CenaResultados({ ativa }: { ativa: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          Contabilidade em São Paulo
          <span className="ml-2 font-normal text-muted-foreground">· 3 de 47 resultados</span>
        </p>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
          Ordenar por reputação
        </span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {RESULTADOS.map((r, i) => (
          <li
            key={r.nome}
            style={ativa ? { animationDelay: `${180 + i * 130}ms` } : undefined}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border p-3.5 sm:p-4",
              ativa && "hero-entra",
              i === 0 && "bg-secondary/40 ring-1 ring-primary/25",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-gold-ink">
              {r.nome.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {r.nome}
                <span className="selo-gold inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                  <BadgeCheck className="size-2.5" aria-hidden="true" />
                  verificado
                </span>
                {r.destaque && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                    <Sparkles className="size-2.5" aria-hidden="true" />
                    impulsionado
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.headline}</p>
              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                {r.local}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
                <Star className="size-3.5 fill-primary text-primary" />
                {r.nota}
              </p>
              <p className="text-[10px] text-muted-foreground">{r.avaliacoes} avaliações</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CenaPerfil() {
  return (
    <div className="grid gap-5 sm:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="flex gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-gold-ink">
            NC
          </span>
          <div className="min-w-0">
            <span className="selo-gold inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
              <BadgeCheck className="size-3" aria-hidden="true" />
              verificado
            </span>
            <p className="mt-1.5 text-base font-semibold">Nexa Contábil</p>
            <p className="text-xs text-muted-foreground">
              Contabilidade para empresas de tecnologia
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: "4,9", l: "reputação" },
            { v: "38", l: "avaliações" },
            { v: "2h", l: "resposta" },
          ].map((m) => (
            <div key={m.l} className="rounded-lg border border-border px-2 py-2">
              <p className="font-mono text-sm font-semibold tabular-nums">{m.v}</p>
              <p className="text-[10px] text-muted-foreground">{m.l}</p>
            </div>
          ))}
        </div>

        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          {[
            "CNPJ do cliente validado em cada avaliação",
            "Contato direto — sem leilão de lead",
            "Histórico público de trabalhos entregues",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border border-border p-3.5">
          <p className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            <Building2 className="size-3" />
            avaliação verificada
          </p>
          <p className="mt-2 inline-flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3 fill-primary text-primary" />
            ))}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            “Assumiram o fechamento atrasado em duas semanas e organizaram o regime tributário.
            Resposta no mesmo dia, sempre.”
          </p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            — Diretor financeiro · CNPJ validado
          </p>
        </div>

        <div className="flex gap-2">
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
            <MessagesSquare className="size-3.5" />
            Falar com o prestador
          </span>
          <span className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
