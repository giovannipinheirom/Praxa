import { PainelHeader } from "@/components/painel/painel-header";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Clock,
  ImagePlus,
  Inbox,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Stamp,
  Star,
  TrendingUp,
  Ribbon,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { categoriaLabel, METODO_VERIFICACAO_LABEL } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

const CHAVE_VISITA = "praxa:painel:ultima-visita";
const CHAVE_LIDOS = "praxa:painel:feed-lidos";
const CHAVE_RANKING = "praxa:painel:ranking-anterior";

type TipoFeed = "avaliacao" | "demanda" | "contato" | "credencial" | "faturamento";

type ItemFeed = {
  id: string;
  tipo: TipoFeed;
  titulo: string;
  detalhe: string;
  data: string;
  to:
    | "/painel/avaliacoes"
    | "/painel/demandas"
    | "/painel/crm"
    | "/painel/destaque"
    | "/painel/assinatura";
};

/** Ícone por tipo de evento — cada acontecimento tem sua própria assinatura visual. */
const ICONE_FEED: Record<TipoFeed, LucideIcon> = {
  avaliacao: Star,
  demanda: ClipboardList,
  contato: MessageSquare,
  credencial: ShieldCheck,
  faturamento: ShieldCheck,
};

/** Rótulo do grupo de data do feed. */
function grupoData(iso: string) {
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const t = new Date(iso).getTime();
  const dia = 86400000;
  if (t >= inicioHoje) return "Hoje";
  if (t >= inicioHoje - dia) return "Ontem";
  if (t >= inicioHoje - 7 * dia) return "Esta semana";
  if (t >= inicioHoje - 30 * dia) return "Este mês";
  return "Antes";
}

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({
    meta: [
      { title: "Visão geral do prestador | Praxa" },
      {
        name: "description",
        content: "Reputação, avaliações recentes, tempo de resposta e ranking da sua categoria.",
      },
      { property: "og:title", content: "Visão geral do prestador | Praxa" },
      {
        property: "og:description",
        content: "Painel de controle do prestador: reputação, demandas e atividade recente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VisaoGeral,
});

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Hora do evento (grupos recentes) ou data curta, sem repetir "há X d". */
function horaCurta(iso: string) {
  const grupo = grupoData(iso);
  const d = new Date(iso);
  if (grupo === "Hoje" || grupo === "Ontem")
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Métrica da régua superior — rótulo em versalete, valor tabular, apoio curto.
 * Estado vazio nunca vira "0" cru: vira instrução.
 */
function Metrica({
  icon: Icon,
  label,
  children,
  nota,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  nota?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        <Icon className="size-3 shrink-0 text-grafite" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <div className="mt-1.5 font-mono">{children}</div>
      {nota && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{nota}</p>}
    </div>
  );
}

/** Barra de progresso horizontal fina da credencial — checklist de autoridade. */
function BarraProgressoCredencial({ feitos, total }: { feitos: number; total: number }) {
  const pct = total === 0 ? 0 : (feitos / total) * 100;
  return (
    <div className="flex items-center gap-3 w-full max-w-[240px]">
      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
        <div 
          className="h-full bg-gold transition-all duration-700 ease-out" 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
        {feitos}/{total} itens
      </span>
    </div>
  );
}



function VisaoGeral() {
  const { data, isLoading } = usePrestador();
  const prestadorId = data?.prestador.id;
  const temPool = Boolean(data?.recursos?.pool_demandas);

  // Marca de leitura: "desde a última visita".
  const [ultimaVisita, setUltimaVisita] = useState<string | null>(null);
  useEffect(() => {
    try {
      setUltimaVisita(localStorage.getItem(CHAVE_VISITA));
      localStorage.setItem(CHAVE_VISITA, new Date().toISOString());
    } catch {
      setUltimaVisita(null);
    }
  }, []);

  const { data: ranking } = useQuery({
    queryKey: ["ranking", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: pos } = await supabase.rpc("posicao_ranking_categoria", {
        _prestador_id: prestadorId!,
      });
      return (pos as number) ?? null;
    },
  });

  // Variação da posição desde a última verificação (posição vista na visita anterior).
  const [rankingAnterior, setRankingAnterior] = useState<number | null>(null);
  useEffect(() => {
    if (!prestadorId || typeof ranking !== "number") return;
    try {
      const bruto = localStorage.getItem(`${CHAVE_RANKING}:${prestadorId}`);
      const anterior = bruto ? Number(bruto) : NaN;
      setRankingAnterior(Number.isFinite(anterior) ? anterior : null);
      localStorage.setItem(`${CHAVE_RANKING}:${prestadorId}`, String(ranking));
    } catch {
      setRankingAnterior(null);
    }
  }, [prestadorId, ranking]);

  // Positivo = subiu de posição (número menor é melhor).
  const variacaoRanking =
    typeof ranking === "number" && rankingAnterior !== null ? rankingAnterior - ranking : 0;

  const { data: avaliacoes } = useQuery({
    queryKey: ["avaliacoes-recentes", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, metodo_verificacao, verificado, created_at")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false })
        .limit(8);
      return rows ?? [];
    },
  });

  const categoria = data?.prestador.categoria_principal;
  const { data: demandas } = useQuery({
    queryKey: ["demandas-compativeis", categoria, temPool],
    enabled: Boolean(categoria) && temPool,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("demandas")
        .select("id, categoria, regiao, descricao_necessidade, created_at")
        .eq("status", "aberta")
        .eq("categoria", categoria as never)
        .order("created_at", { ascending: false })
        .limit(8);
      return rows ?? [];
    },
  });

  const { data: contatos } = useQuery({
    queryKey: ["contatos-recentes", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("crm_contatos")
        .select("id, nome, origem, status, created_at")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false })
        .limit(8);
      return rows ?? [];
    },
  });

  // Marcos de credencial (destaque pago ativado, assinatura/plano confirmado).
  const { data: marcos } = useQuery({
    queryKey: ["marcos-credencial", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const [{ data: destaques }, { data: assinaturas }] = await Promise.all([
        supabase
          .from("destaques_pagos")
          .select("id, categoria, regiao, ativo, created_at")
          .eq("prestador_id", prestadorId!)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("assinaturas_prestador")
          .select("id, status, preco_pago, created_at")
          .eq("prestador_id", prestadorId!)
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      return { destaques: destaques ?? [], assinaturas: assinaturas ?? [] };
    },
  });

  // Avaliações verificadas: a métrica de maior impacto no ranking.
  const { data: verificadas } = useQuery({
    queryKey: ["avaliacoes-verificadas", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { count } = await supabase
        .from("avaliacoes")
        .select("id", { count: "exact", head: true })
        .eq("prestador_id", prestadorId!)
        .eq("verificado", true);
      return count ?? 0;
    },
  });

  // Volume de demandas compatíveis (contagem segura, sem expor as demandas).
  const { data: demandasCompativeis } = useQuery({
    queryKey: ["demandas-compativeis-count", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: total } = await supabase.rpc("demandas_compativeis_count");
      return (total as number) ?? 0;
    },
  });

  // Total de contratos fechados no pipeline.
  const { data: totalContratos } = useQuery({
    queryKey: ["total-contratos", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { count } = await supabase
        .from("crm_contatos")
        .select("id", { count: "exact", head: true })
        .eq("prestador_id", prestadorId!)
        .eq("status", "fechado");
      return count ?? 0;
    },
  });



  const novasAvaliacoes = useMemo(() => {
    if (!ultimaVisita) return 0;
    return (avaliacoes ?? []).filter((a) => a.created_at > ultimaVisita).length;
  }, [avaliacoes, ultimaVisita]);

  const novasDemandas = useMemo(() => {
    if (!ultimaVisita) return (demandas ?? []).length;
    return (demandas ?? []).filter((d) => d.created_at > ultimaVisita).length;
  }, [demandas, ultimaVisita]);

  // Itens já abertos pelo prestador: o ponto dourado desaparece na hora.
  const [lidos, setLidos] = useState<string[]>([]);
  useEffect(() => {
    try {
      setLidos(JSON.parse(localStorage.getItem(CHAVE_LIDOS) ?? "[]"));
    } catch {
      setLidos([]);
    }
  }, []);
  const marcarLido = (id: string) => {
    setLidos((atual) => {
      if (atual.includes(id)) return atual;
      const proximo = [...atual, id].slice(-200);
      try {
        localStorage.setItem(CHAVE_LIDOS, JSON.stringify(proximo));
      } catch {
        /* storage indisponível: só estado em memória */
      }
      return proximo;
    });
  };

  const feed = useMemo(() => {
    const itens: ItemFeed[] = [
      ...(avaliacoes ?? []).map((a) => ({
        id: `a-${a.id}`,
        tipo: "avaliacao" as const,
        titulo: `Nova avaliação · nota ${a.nota}`,
        detalhe: a.verificado
          ? (METODO_VERIFICACAO_LABEL[a.metodo_verificacao ?? ""] ?? "Verificada")
          : "Aguardando verificação",
        data: a.created_at,
        to: "/painel/avaliacoes" as const,
      })),
      ...(demandas ?? []).map((d) => ({
        id: `d-${d.id}`,
        tipo: "demanda" as const,
        titulo: "Demanda compatível no pool",
        detalhe: `${categoriaLabel(d.categoria)} · ${d.regiao}`,
        data: d.created_at,
        to: "/painel/demandas" as const,
      })),
      ...(contatos ?? []).map((c) => ({
        id: `c-${c.id}`,
        tipo: "contato" as const,
        titulo: `Contato de ${c.nome}`,
        detalhe: `Origem ${c.origem.replace(/_/g, " ")} · ${c.status.replace(/_/g, " ")}`,
        data: c.created_at,
        to: "/painel/crm" as const,
      })),
      ...(marcos?.destaques ?? []).map((d) => ({
        id: `x-${d.id}`,
        tipo: "credencial" as const,
        titulo: d.ativo ? "Destaque pago ativado" : "Destaque pago encerrado",
        detalhe: `${categoriaLabel(d.categoria)} · ${d.regiao}`,
        data: d.created_at,
        to: "/painel/destaque" as const,
      })),
      ...(marcos?.assinaturas ?? []).map((s) => ({
        id: `s-${s.id}`,
        tipo: "faturamento" as const,
        titulo: "Assinatura confirmada",
        detalhe: `Status ${s.status.replace(/_/g, " ")} · <span class="font-mono">R$ ${Number(s.preco_pago).toFixed(0)}/mês</span>`,
        data: s.created_at,
        to: "/painel/assinatura" as const,
      })),
    ];

    /**
     * Reordenação por relevância ao propósito do produto:
     * 1. avaliacao (mais importante)
     * 2. demanda
     * 3. contato
     * 4. credencial (destaque pago)
     * 5. faturamento (assinatura/cobrança)
     */
    const PESO_RELEVANCIA: Record<TipoFeed, number> = {
      avaliacao: 1,
      demanda: 2,
      contato: 3,
      credencial: 4,
      faturamento: 5,
    };

    return itens
      .sort((a, b) => {
        const pesoA = PESO_RELEVANCIA[a.tipo];
        const pesoB = PESO_RELEVANCIA[b.tipo];
        if (pesoA !== pesoB) return pesoA - pesoB;
        return b.data.localeCompare(a.data);
      })
      .slice(0, 14);
  }, [avaliacoes, demandas, contatos, marcos]);

  // Agrupamento por data: um cabeçalho por bloco, sem repetir "há 1 d" em cada linha.
  const grupos = useMemo(() => {
    const ordem = ["Hoje", "Ontem", "Esta semana", "Este mês", "Antes"] as const;
    const mapa = new Map<string, ItemFeed[]>();
    for (const item of feed) {
      const chave = grupoData(item.data);
      const lista = mapa.get(chave);
      if (lista) lista.push(item);
      else mapa.set(chave, [item]);
    }
    return ordem
      .filter((chave) => mapa.has(chave))
      .map((chave) => ({ titulo: chave, itens: mapa.get(chave)! }));
  }, [feed]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando painel…</p>;

  if (!data) {
    return (
      <div className="surface-panel space-y-4 p-8">
        <h1 className="text-xl font-semibold">Sua vitrine ainda não foi criada</h1>
        <p className="text-sm text-muted-foreground">
          Complete o onboarding para publicar seu perfil e escolher um plano.
        </p>
        <Button asChild>
          <Link to="/onboarding">Começar onboarding</Link>
        </Button>
      </div>
    );
  }

  const { prestador, plano } = data;
  const incompleto = !prestador.descricao || !prestador.cnpj || prestador.status_conta !== "ativo";

  const nota = Number(prestador.nota_media);
  const semNota = !nota || prestador.total_avaliacoes === 0;
  const verificado = prestador.status_conta === "ativo" && Boolean(prestador.cnpj);

  const temFoto = Boolean(prestador.foto_perfil_url);
  const temVerificada = (verificadas ?? 0) > 0;
  const planoGratis = !plano || plano.nome === "Grátis";
  const demandasPerdidas = demandasCompativeis ?? 0;

  /** Itens que compõem a credencial completa — base do anel de progresso. */
  const itensCredencial = [
    { label: "Dados do negócio", ok: Boolean(prestador.descricao) },
    { label: "CNPJ verificado", ok: Boolean(prestador.cnpj) },
    { label: "Foto / portfólio", ok: temFoto },
    { label: "Primeira avaliação verificada", ok: temVerificada },
    { label: "Perfil publicado", ok: prestador.status_conta === "ativo" },
  ];
  const feitos = itensCredencial.filter((i) => i.ok).length;

  /** Próxima ação de maior impacto, em ordem de prioridade. */
  const passoCredencial = incompleto
    ? {
        icon: ShieldCheck,
        titulo: "Complete os dados do negócio",
        detalhe: "Descrição, CNPJ e região liberam sua vitrine na busca pública.",
        acao: "Completar cadastro",
        to: "/onboarding" as const,
      }
    : !temVerificada
      ? {
          icon: Star,
          titulo: "Solicite sua primeira avaliação verificada",
          detalhe:
            "É a ação de maior impacto no ranking: uma nota verificada pesa mais que qualquer outro campo do perfil.",
          acao: "Enviar convite de avaliação",
          variant: "dourado" as const,
          to: "/painel/avaliacoes" as const,
        }
      : !temFoto
        ? {
            icon: ImagePlus,
            titulo: "Adicione fotos do seu portfólio",
            detalhe:
              "Perfis com imagem do trabalho recebem mais pedidos de orçamento na busca da categoria.",
            acao: "Editar perfil",
            to: "/painel/perfil" as const,
          }
        : planoGratis && demandasPerdidas > 0
          ? {
              icon: TrendingUp,
              titulo: `${demandasPerdidas} ${demandasPerdidas === 1 ? "demanda aberta" : "demandas abertas"} em ${categoriaLabel(prestador.categoria_principal)}`,
              detalhe:
                "No plano Grátis você não vê o pool. Veja quantas demandas está perdendo sem o plano Business.",
              acao: "Comparar planos",
              to: "/painel/assinatura" as const,
            }
          : !semNota && nota >= 4
            ? {
                icon: Ribbon,
                titulo: "Impulsione sua categoria",
                detalhe: "Com nota acima de 4.0 você pode ativar destaque pago na busca.",
                acao: "Ver destaque",
                to: "/painel/destaque" as const,
              }
            : null;


  return (
    <div className="space-y-8">
      <PainelHeader
        eyebrow={`${saudacao()}, ${prestador.nome_negocio}`}
        titulo="Visão geral"
        acoes={
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/pro/$slug" params={{ slug: prestador.slug }}>
              Ver perfil público
            </Link>
          </Button>
        }
      />

      {/* Painel de credencial: identidade + régua de métricas em um só bloco. */}
      <section className="surface-float relative overflow-hidden">
        <span className="absolute top-4 right-4 flex gap-3">
          <span className="text-[10px] font-mono tracking-tight text-muted-foreground/60 uppercase">
            Desde {new Date(prestador.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
          </span>
          {Number(totalContratos) > 0 && (
            <span className="text-[10px] font-mono tracking-tight text-muted-foreground/60 uppercase">
              {totalContratos} {totalContratos === 1 ? "Contrato" : "Contratos"}
            </span>
          )}
        </span>

        <div className="flex flex-col gap-8 p-6 pt-12 sm:p-8 sm:pt-14 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4 lg:w-[16rem] lg:shrink-0">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 font-display text-lg font-semibold text-primary">
              {prestador.foto_perfil_url ? (
                <img
                  src={prestador.foto_perfil_url}
                  alt={`Logotipo de ${prestador.nome_negocio}`}
                  className="size-full object-cover"
                />
              ) : (
                prestador.nome_negocio.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-serif text-xl font-semibold sm:text-2xl">
                {prestador.nome_negocio}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="truncate">{categoriaLabel(prestador.categoria_principal)}</span>
                {(prestador.cidade || prestador.estado) && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">
                      {[prestador.cidade, prestador.estado].filter(Boolean).join(", ")}
                    </span>
                  </>
                )}
              </p>
              {verificado ? (
                <span className="selo-gold mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase">
                  <ShieldCheck className="size-3" />
                  Prestador verificado
                </span>
              ) : (
                <span className="chip-neutro mt-2 inline-flex max-w-full items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.1em] whitespace-nowrap uppercase">
                  <ShieldCheck className="size-3 text-grafite" />
                  Verificação pendente
                </span>
              )}
            </div>
          </div>

          {/* Régua de métricas — leitura horizontal, sem cards soltos. */}
          <div
            className={cn(
              "grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8",
              temPool ? "xl:grid-cols-5" : "xl:grid-cols-4",
            )}
          >
            <Metrica icon={Star} label="Reputação">
              {semNota ? (
                <>
                  <p className="font-mono text-2xl leading-none font-semibold tabular-nums text-grafite/40">
                    —
                  </p>
                  <Link
                    to="/painel/avaliacoes"
                    className="mt-2 inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-gold underline-offset-4 hover:underline"
                  >
                    Pedir avaliação
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </>
              ) : (
                <p className="font-mono text-2xl leading-none font-semibold tabular-nums text-success">
                  {nota.toFixed(1)}
                </p>
              )}
            </Metrica>

            <Metrica
              icon={Ribbon}
              label="Ranking"
              nota={ranking ? `em ${categoriaLabel(prestador.categoria_principal)}` : undefined}
            >
              {ranking ? (
                <p className="flex items-end gap-1.5 font-mono text-2xl leading-none font-semibold tabular-nums text-ink">
                  <span>
                    {ranking}
                    <span className="font-sans text-xs font-normal align-super">º</span>
                  </span>
                  {variacaoRanking !== 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-sans text-[11px] font-semibold",
                        variacaoRanking > 0 ? "text-success" : "text-grafite",
                      )}
                      title={
                        variacaoRanking > 0
                          ? `Subiu ${variacaoRanking} desde a última verificação`
                          : `Caiu ${Math.abs(variacaoRanking)} desde a última verificação`
                      }
                    >
                      {variacaoRanking > 0 ? (
                        <ArrowUp className="size-3" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <ArrowDown className="size-3" strokeWidth={2.5} aria-hidden />
                      )}
                      {Math.abs(variacaoRanking)}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm leading-snug font-medium text-muted-foreground">
                  Sem posição
                </p>
              )}
            </Metrica>

            <Metrica
              icon={Sparkles}
              label="Avaliações"
              nota={ultimaVisita ? "novas desde a última visita" : "nesta primeira visita"}
            >
              <p
                className={cn(
                  "font-mono text-2xl leading-none font-semibold tabular-nums",
                  novasAvaliacoes === 0 && "text-grafite/60",
                )}
              >
                {novasAvaliacoes}
              </p>
            </Metrica>

            <Metrica icon={Clock} label="Resposta">
              {prestador.tempo_medio_resposta_horas ? (
                <p className="font-mono text-2xl leading-none font-semibold tabular-nums">
                  {Number(prestador.tempo_medio_resposta_horas).toFixed(0)}
                  <span className="ml-0.5 font-sans text-xs font-normal text-muted-foreground">
                    h
                  </span>
                </p>
              ) : (
                <p className="text-sm leading-snug font-medium text-success">Disponível</p>
              )}
            </Metrica>

            {temPool && (
              <Metrica
                icon={Inbox}
                label="Pool"
                nota={`demandas em ${categoriaLabel(prestador.categoria_principal)}`}
              >
                <p
                  className={cn(
                    "font-mono text-2xl leading-none font-semibold tabular-nums",
                    novasDemandas === 0 && "text-grafite/60",
                  )}
                >
                  {novasDemandas}
                </p>
              </Metrica>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Atividade recente
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/painel/avaliacoes">Solicitar avaliação</Link>
            </Button>
          </div>

          <div className="surface-panel p-6">
            {feed.length === 0 || (!feed.some(i => i.tipo !== "faturamento") && feed.length > 0) ? (
              <div className="py-4 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nenhuma atividade de negócio ainda — assim que você receber uma avaliação ou um
                  cliente entrar em contato, vai aparecer aqui.
                </p>
                <Button asChild variant="dourado" className="mt-4" size="sm">
                  <Link to="/painel/avaliacoes">Enviar convite de avaliação</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {grupos.map((grupo) => (
                  <div key={grupo.titulo}>
                    <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {grupo.titulo}
                    </h3>
                    <ul className="relative mt-3">
                      {/* Trilho da linha do tempo. */}
                      <span
                        aria-hidden
                        className="absolute top-2 bottom-2 left-[7px] w-px bg-border"
                      />
                      {grupo.itens.map((item) => {
                        const Icone = ICONE_FEED[item.tipo];
                        const naoVisto =
                          !lidos.includes(item.id) &&
                          Boolean(ultimaVisita && item.data > ultimaVisita);
                        return (
                          <li key={item.id} className="relative">
                            <Link
                              to={item.to}
                              onClick={() => marcarLido(item.id)}
                              className="group flex items-start gap-3 rounded-lg py-2.5 pr-2 pl-6 transition-colors hover:bg-secondary"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute top-4 left-0 size-3.5 rounded-full border-[3px] border-card",
                                  naoVisto ? "bg-primary" : "bg-border",
                                )}
                              />
                              <Icone className="mt-0.5 size-4 shrink-0 text-grafite" />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block truncate text-sm font-semibold",
                                    item.tipo === "faturamento" && "text-muted-foreground font-medium",
                                  )}
                                >
                                  {item.titulo}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {item.detalhe}
                                </span>
                              </span>
                              <time
                                className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
                                dateTime={item.data}
                              >
                                {horaCurta(item.data)}
                              </time>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Credencial em construção: progresso + a única próxima ação que importa agora. */}
        <aside className="flex flex-col gap-6">
          <div className="surface-panel flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Sua credencial</h2>
              <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                {Math.round((feitos / itensCredencial.length) * 100)}%
              </span>
            </div>

            <div className="flex justify-center py-1">
              <BarraProgressoCredencial feitos={feitos} total={itensCredencial.length} />
            </div>

            {passoCredencial ? (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Ação prioritária
                </p>
                <div className="flex items-start gap-2.5">
                  <passoCredencial.icon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <p className="text-sm leading-snug font-semibold">{passoCredencial.titulo}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {passoCredencial.detalhe}
                </p>
                {/* Se for a ação de pedir avaliação e já estiver no card principal, mostramos um link mais discreto aqui para não duplicar o botão dourado gigante */}
                {passoCredencial.acao === "Enviar convite de avaliação" ? (
                  <Link 
                    to={passoCredencial.to}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                  >
                    {passoCredencial.acao}
                    <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <Button asChild className="w-full">
                    <Link to={passoCredencial.to}>
                      {passoCredencial.acao}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                Credencial completa. Continue respondendo os contatos para manter o tempo médio
                baixo.
              </p>
            )}

            {feitos < itensCredencial.length && (
              <ul className="space-y-1.5 border-t border-border pt-4">
                {itensCredencial.map((i) => (
                  <li
                    key={i.label}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      i.ok ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        i.ok ? "bg-success" : "border border-border",
                      )}
                    />
                    {i.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="rounded-xl border border-gold/30 bg-background p-4 text-[11px] leading-relaxed font-medium text-ink">
            Perfis com 5 ou mais avaliações verificadas recebem muito mais contatos na busca da
            categoria.
          </p>
        </aside>
      </div>
    </div>
  );
}
