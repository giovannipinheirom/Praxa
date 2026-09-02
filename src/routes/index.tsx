import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Globe,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Calculator,
  Target,
  Scale,
  Monitor,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BarraBusca } from "@/components/barra-busca";

import { PrestadorCard, type PrestadorResumo } from "@/components/prestador-card";
import { Revelar, useNaTela } from "@/components/revelar";
import { SeloAvaliacao } from "@/components/selo-avaliacao";
import { ArtefatosHero } from "@/components/artefatos-hero";
import { IlustracaoHeroPremium } from "@/components/ilustracao-hero-premium";

import {
  DiagramaBusca,
  DiagramaContato,
  DiagramaReputacao,
} from "@/components/diagramas-passos";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CATEGORIAS, METODO_VERIFICACAO_LABEL, categoriaLabel } from "@/lib/marketplace";
import { PLANO_RESUMO, formatarBRL, recursosAtivos } from "@/lib/planos";
import { obterEstatisticas, obterDadosLanding } from "@/lib/marketplace.functions";
import ilustraDemandas from "@/assets/ilustra-demandas.png";
import catContabilidade from "@/assets/cat-contabilidade.png";
import catMarketing from "@/assets/cat-marketing.png";
import catJuridico from "@/assets/cat-juridico.png";
import catTi from "@/assets/cat-ti.png";
import catRh from "@/assets/cat-rh.png";
import catOutros from "@/assets/cat-outros.png";

import bonecoAsset from "@/assets/boneco-hero.png.asset.json";

const ILUSTRACAO_CATEGORIA_MAP: Record<string, any> = {
  contabilidade: Calculator,
  marketing: Target,
  juridico: Scale,
  ti: Monitor,
  rh: Users,
  outros: Sparkles,
};

const CATEGORIA_CHIPS: Record<string, string[]> = {
  contabilidade: ["Fiscal", "BPO", "DP", "Tributário"],
  marketing: ["Performance", "SEO", "Branding", "Inbound"],
  juridico: ["Societário", "Trabalhista", "Contratos"],
  ti: ["Infra", "Software", "Dados", "Segurança"],
  rh: ["Recrutamento", "Treinamento", "DP"],
  outros: ["Consultoria", "Estratégia", "Assessoria"],
};

const ILUSTRACAO_CATEGORIA: Record<string, string> = {
  contabilidade: catContabilidade,
  marketing: catMarketing,
  juridico: catJuridico,
  ti: catTi,
  rh: catRh,
  outros: catOutros,
};

const PASSOS = [
  {
    diagrama: DiagramaBusca,
    icon: Search,
    titulo: "Busque por serviço e região",
    texto:
      "Escolha a categoria e onde você precisa de atendimento. Sem cadastro, sem login e sem paywall.",
  },
  {
    diagrama: DiagramaReputacao,
    icon: BadgeCheck,
    titulo: "Compare reputação verificada",
    texto:
      "Cada avaliação é vinculada a um cliente real — por CNPJ, e-mail corporativo ou convite do prestador.",
  },
  {
    diagrama: DiagramaContato,
    icon: MessagesSquare,
    titulo: "Fale direto com o prestador",
    texto:
      "O contato é seu. A Praxa não vende lead avulso nem cobra para você ver quem atende sua empresa.",
  },
];

const DIFERENCIAIS = [
  {
    icon: ShieldCheck,
    titulo: "estou querendo migrar esse projeto para o supabase",
    texto: "A migração completa garantirá maior escalabilidade e recursos de backend nativos.",
  },
  {
    icon: ShieldCheck,
    titulo: "Reputação que não se compra",
    texto:
      "Toda avaliação exige vínculo com um cliente real: CNPJ validado, e-mail corporativo ou convite único do prestador. Padrões suspeitos são sinalizados automaticamente.",
  },
  {
    icon: Globe,
    titulo: "Perfil aberto, sem paywall",
    texto:
      "Contato, serviços e histórico de avaliações ficam visíveis para qualquer visitante. Você nunca precisa pagar para descobrir quem atende sua empresa.",
  },
  {
    icon: MessagesSquare,
    titulo: "Zero venda de lead avulso",
    texto:
      "Não leiloamos o seu contato para dez prestadores. A demanda vai para quem realmente atende a categoria e a região que você indicou.",
  },
  {
    icon: Sparkles,
    titulo: "Destaque honesto",
    texto:
      "Anúncio pago aparece com selo “Impulsionado” e rotaciona entre os elegíveis — nunca fixo no topo, nunca disfarçado de resultado orgânico.",
  },
];


const FAQ = [
  {
    q: "Buscar prestadores na Praxa é gratuito?",
    a: "Sim. A busca, os filtros e os perfis completos são gratuitos e não exigem cadastro. Só prestadores pagam, e apenas se quiserem recursos avançados de vitrine.",
  },
  {
    q: "Como vocês garantem que as avaliações são reais?",
    a: "Cada avaliação precisa de um vínculo verificável com o cliente: CNPJ validado, e-mail corporativo do domínio da empresa ou convite único enviado pelo prestador. Também aplicamos limites por período e sinalização de padrões suspeitos.",
  },
  {
    q: "A Praxa vende meu contato para vários prestadores?",
    a: "Não. Você fala direto com o prestador escolhido. Quando registra uma demanda, ela é encaminhada apenas para quem atende aquela categoria e região.",
  },
  {
    q: "O que o selo “Impulsionado” significa?",
    a: "É um anúncio pago. Ele aparece sempre identificado e em posições rotativas entre os prestadores elegíveis, para não distorcer o ranking orgânico baseado em reputação.",
  },
  {
    q: "Quanto custa para o prestador?",
    a: "Existe um plano gratuito com perfil completo, avaliações e presença na busca orgânica. Os planos pagos adicionam destaque, CRM, agenda e acesso ao pool de demandas.",
  },
  {
    q: "Quanto tempo leva para publicar minha vitrine?",
    a: "Menos de 5 minutos: crie a conta, informe categoria, região e descrição do serviço. O perfil já entra na busca assim que é publicado.",
  },
];

const PRECO_PROMOCIONAL: Record<string, number> = {
  Profissional: 47,
  Business: 147,
};


const landingQuery = queryOptions({
  queryKey: ["landing-dados"],
  queryFn: () => obterDadosLanding(),
});

const statsQuery = queryOptions({
  queryKey: ["estatisticas-publicas"],
  queryFn: () => obterEstatisticas(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(statsQuery);
    context.queryClient.ensureQueryData(landingQuery);
  },
  head: () => ({
    meta: [
      { title: "Praxa | Encontre prestadores de serviço B2B com reputação verificada" },
      {
        name: "description",
        content:
          "Busque contabilidade, marketing, jurídico, TI e RH para sua empresa. Perfis abertos, avaliações verificadas e nenhuma venda de lead avulso.",
      },
      { property: "og:title", content: "Praxa | Encontre prestadores de serviço B2B com reputação verificada" },
      {
        property: "og:description",
        content: "Busque contabilidade, marketing, jurídico, TI e RH para sua empresa. Perfis abertos, avaliações verificadas e nenhuma venda de lead avulso.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://praxa.com.br/#organization",
              name: "Praxa",
              url: "https://praxa.com.br/",
              description:
                "Marketplace B2B de serviços profissionais com reputação verificada.",
              areaServed: "BR",
            },
            {
              "@type": "WebSite",
              "@id": "https://praxa.com.br/#website",
              name: "Praxa",
              url: "https://praxa.com.br/",
              inLanguage: "pt-BR",
              publisher: { "@id": "https://praxa.com.br/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://praxa.com.br/buscar/{search_term_string}/todos",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "ItemList",
              name: "Categorias de serviços B2B",
              itemListElement: CATEGORIAS.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.label,
                url: `https://praxa.com.br/buscar/${c.slug}/todos`,
              })),
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ],
        }),
      },
    ],

  }),
  component: Index,
});

function Index() {
  const { data: landing } = useSuspenseQuery(landingQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-[1440px] overflow-hidden">
        <section className="relative min-h-[clamp(500px,80vh,1000px)] flex items-center bg-background px-4 sm:px-8 lg:px-20">
          {/* Ilustração de Fundo (Boneco) - Agora contida e escalonada proporcionalmente */}
          <div className="pointer-events-none absolute top-1/2 -right-[10vw] hidden -translate-y-1/2 lg:block">
            <div className="relative h-[clamp(600px,65vw,1000px)] w-[clamp(600px,65vw,1000px)]">
              {/* Blur de fundo para suavizar a integração */}
              <div className="absolute inset-0 bg-radial-[at_center_right] from-primary/10 to-transparent blur-3xl opacity-30" />
              <IlustracaoHeroPremium />
            </div>
          </div>

          <div className="relative z-10 w-full pt-[clamp(2rem,8vh,6rem)] pb-[clamp(3rem,10vh,8rem)]">
            <div className="max-w-[clamp(600px,60vw,900px)] text-left">
              <Revelar delay={60} className="relative inline-block">
                <div className="absolute -top-[clamp(1rem,3vh,2rem)] left-0 flex size-5 items-center justify-center rounded-full bg-primary/20">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
                <h1 className="text-[clamp(2.5rem,7vw,5.75rem)] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink font-display">
                  <span className="text-primary">Compare</span> empresas
                  <br className="hidden md:block" /> antes de contratar.
                </h1>
              </Revelar>

              <Revelar delay={160}>
                <p className="mt-[clamp(1.5rem,3vh,2.5rem)] max-w-2xl text-[clamp(1rem,1.2vw,1.25rem)] leading-[1.6] text-muted-foreground">
                  Compare reputação, especialidades e avaliações verificadas — e fale direto
                  com a empresa antes de fechar.
                </p>
              </Revelar>

              <Revelar delay={240} className="mt-[clamp(2rem,5vh,4rem)] w-full sm:max-w-xl lg:max-w-full">
                <div className="relative z-10">
                  <BarraBusca />
                </div>
              </Revelar>

              <Revelar delay={320} className="mt-[clamp(1.5rem,3vh,2.5rem)] flex flex-wrap gap-[clamp(0.5rem,1vw,0.75rem)]">
                {[
                  { ...CATEGORIAS[0], icon: Calculator },
                  { slug: "marketing", label: "Marketing B2B", icon: Target },
                  { ...CATEGORIAS[2], icon: Scale },
                  { ...CATEGORIAS[3], icon: Monitor },
                ].map((c) => (
                  <Link
                    key={c.slug}
                    to="/buscar/$categoria/$regiao"
                    params={{ categoria: c.slug, regiao: "todos" }}
                    search={{ tipo: undefined }}
                    className="group flex items-center gap-2.5 rounded-full border border-slate-100 bg-white px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vh,0.75rem)] text-[clamp(0.75rem,0.9vw,0.875rem)] font-semibold text-ink shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <c.icon className="size-3" strokeWidth={3} />
                    </div>
                    {c.label}
                  </Link>
                ))}
              </Revelar>
            </div>
          </div>
        </section>


        <section id="como-funciona" className="bg-muted/30 py-[clamp(4rem,10vh,8rem)]">
          <div className="mx-auto w-full max-w-[1440px] px-[clamp(1.5rem,5vw,5rem)]">
            <div className="flex flex-col items-center text-center">
              <Revelar>
                <h2 className="text-[clamp(0.75rem,0.9vw,0.875rem)] font-bold uppercase tracking-widest text-primary/80">
                  O Caminho da Confiança
                </h2>
                <h3 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-tight text-ink">
                  Três passos para a escolha certa.
                </h3>
                <p className="mt-6 max-w-2xl text-[clamp(1rem,1.2vw,1.25rem)] text-muted-foreground">
                  Sem formulários infinitos ou leilão de leads. Você tem o controle total da busca ao primeiro contato.
                </p>
              </Revelar>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-3">
              {PASSOS.map((passo, i) => (
                <Revelar key={passo.titulo} delay={i * 100}>
                  <div className="group relative flex flex-col rounded-[2rem] border border-border/50 bg-white p-8 transition-all hover:border-primary/20 hover:shadow-elevated">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="mt-8 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 p-2 sm:p-4 transition-transform group-hover:scale-[1.02]">
                      <passo.diagrama />
                    </div>
                    <h4 className="mt-8 text-xl font-bold text-ink">{passo.titulo}</h4>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{passo.texto}</p>
                  </div>
                </Revelar>
              ))}
            </div>
          </div>
        </section>

        <section id="para-prestadores" className="py-[clamp(4rem,10vh,8rem)]">
          <div className="mx-auto w-full max-w-[1440px] px-[clamp(1.5rem,5vw,5rem)]">
            <div className="grid items-center gap-[clamp(2rem,6vw,4rem)] lg:grid-cols-2">
              <Revelar>
                <h2 className="text-[clamp(0.75rem,0.9vw,0.875rem)] font-bold uppercase tracking-widest text-primary/80">
                  Para o seu Negócio
                </h2>
                <h3 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-tight text-ink">
                  Transforme sua reputação em novos contratos.
                </h3>
                <p className="mt-6 text-[clamp(1rem,1.2vw,1.25rem)] text-muted-foreground leading-relaxed">
                  A Praxa é a vitrine que sua empresa merece. Um perfil público moderno que atrai os clientes certos, aliado a ferramentas que simplificam sua operação.
                </p>
                <div className="mt-10 space-y-4">
                  {[
                    "Perfil indexável: apareça no Google sem barreiras",
                    "CRM Integrado: gerencie leads e propostas num só lugar",
                    "Avaliações Verificadas: sua credibilidade à prova de fraudes",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-4" strokeWidth={3} />
                      </div>
                      <span className="text-muted-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-12 flex flex-wrap gap-4">
                  <Button asChild size="lg" className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
                    <Link to="/auth" search={{ modo: "criar" }}>
                      Começar agora
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8 font-bold">
                    <a href="#planos">Conhecer planos</a>
                  </Button>
                </div>
              </Revelar>

              <Revelar delay={200} className="relative">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-primary/5 blur-2xl" />
                <div className="surface-float overflow-hidden aspect-video bg-white/50 backdrop-blur-sm flex items-center justify-center border border-hairline w-full">
                  <span className="text-sm font-medium text-muted-foreground italic">Visualização do Painel</span>
                </div>
              </Revelar>
            </div>
          </div>
        </section>

        {landing.destaques.length > 0 && (
          <section id="prestadores" className="bg-muted/30 py-24 sm:py-32">
            <div className="mx-auto w-full max-w-[1440px] px-6">
              <div className="flex flex-col items-center text-center">
                <Revelar>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80">
                    Excelência Verificada
                  </h2>
                  <h3 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                    Reputação que fala por si só.
                  </h3>
                  <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                    Os prestadores mais bem avaliados da nossa rede, com histórico 100% auditado.
                  </p>
                </Revelar>
              </div>

              <div className="mt-16 space-y-6">
                {(landing.destaques as PrestadorResumo[]).map((p, i) => (
                  <Revelar key={p.id} delay={i * 80}>
                    <PrestadorCard prestador={p} />
                  </Revelar>
                ))}
              </div>

              <div className="mt-16 flex justify-center">
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-10 font-bold">
                  <Link to="/buscar/$categoria/$regiao" params={{ categoria: "todas", regiao: "todos" }} search={{ tipo: undefined }}>
                    Explorar todos os prestadores
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {landing.depoimentos.length > 0 && (
          <SecaoDepoimentos depoimentos={landing.depoimentos} />
        )}

        <section id="categorias" className="relative overflow-hidden bg-white py-[clamp(4rem,10vh,8rem)]">
          {/* Elementos gráficos de fundo discretos */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
            <svg className="absolute -top-24 -left-24 h-96 w-96 text-ink" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
            </svg>
            <svg className="absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-y-1/2 text-ink" viewBox="0 0 100 100">
              <path d="M10,50 Q40,10 90,50 T170,50" fill="none" stroke="currentColor" strokeWidth="0.2" />
            </svg>
            <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(#14213D_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          <div className="relative mx-auto w-full max-w-[1440px] px-[clamp(1.5rem,5vw,5rem)]">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              <Revelar>
                <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] font-bold uppercase tracking-[0.2em] text-primary">
                  Especialidades
                </p>
                <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight text-ink">
                  Categorias em destaque
                </h2>
                <p className="mt-6 max-w-2xl text-[clamp(1rem,1.2vw,1.25rem)] leading-relaxed text-muted-foreground">
                  Cada categoria conta com filtros avançados por região, especialidade e faixa de preço, facilitando sua busca pelo parceiro ideal.
                </p>
              </Revelar>
              <Revelar delay={100}>
                <Button asChild variant="outline" className="h-12 rounded-xl px-8 font-bold border-slate-200 hover:bg-slate-50">
                  <Link
                    to="/buscar/$categoria/$regiao"
                    params={{ categoria: "todas", regiao: "todos" }}
                    search={{ tipo: undefined }}
                  >
                    Ver todas
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </Revelar>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIAS.map((categoria, i) => {
                const Icon = ILUSTRACAO_CATEGORIA_MAP[categoria.slug] || Monitor;
                const chips = CATEGORIA_CHIPS[categoria.slug] || ["Consultoria", "Estratégia"];
                
                return (
                  <Revelar key={categoria.slug} delay={i * 50}>
                    <Link
                      to="/buscar/$categoria/$regiao"
                      params={{ categoria: categoria.slug, regiao: "todos" }}
                      search={{ tipo: undefined }}
                      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E8EDF2] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      {/* Icone Premium */}
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors duration-300 group-hover:bg-primary/10">
                        <Icon className="size-8 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                      </div>

                      <h3 className="mt-6 font-display text-xl font-bold text-ink transition-colors group-hover:text-primary">
                        {categoria.label}
                      </h3>
                      
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {categoria.desc}
                      </p>

                      {/* Chips de Especialidade */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {chips.map((chip) => (
                          <span key={chip} className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border border-slate-100">
                            {chip}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto pt-8">
                        {/* Linha de Indicadores */}
                        <div className="flex items-center justify-between border-t border-slate-50 pt-5 text-[13px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-primary" />
                            <span>{12 + (i * 4)}+ empresas</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="size-3.5 text-primary fill-primary/10" />
                            <span>4.{8 + (i % 2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessagesSquare className="size-3.5 text-primary" />
                            <span>~{24 - (i * 2)}h</span>
                          </div>
                        </div>

                        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                          Ver prestadores
                          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </Revelar>
                );
              })}
            </div>
          </div>
        </section>

        <section id="por-que-praxa" className="mx-auto w-full max-w-[1440px] px-6 py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Por que a Praxa
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
            Um marketplace B2B que não vive de vender o seu contato
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            As regras são públicas e valem para todo mundo — inclusive para quem anuncia.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {DIFERENCIAIS.map((item) => (
              <div
                key={item.titulo}
                className="surface-panel group flex gap-5 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="demandas" className="mx-auto w-full max-w-[1440px] px-6 py-24">
          <div className="surface-panel flex flex-col items-center gap-8 p-10 md:flex-row">
            <img
              src={ilustraDemandas}
              alt="Cliente recebendo respostas de prestadores"
              loading="lazy"
              width={896}
              height={768}
              className="w-full max-w-xs object-contain md:order-2"
            />
            <div className="flex-1 md:order-1">
              <h2 className="text-3xl font-semibold">Prefere que venham até você?</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Descreva sua necessidade uma única vez. Prestadores qualificados da categoria e da
                região recebem o pedido e respondem. Não é preciso criar conta.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link to="/demandas/nova" search={{ categoria: "", regiao: "" }}>
                  Registrar demanda
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="planos" className="border-y border-border bg-muted/30">
          <div className="mx-auto w-full max-w-[1440px] px-[clamp(1.5rem,5vw,5rem)] py-[clamp(4rem,10vh,6rem)]">
            <div className="flex flex-col items-center text-center mb-[clamp(2rem,6vh,4rem)]">
              <Revelar>
                <p className="text-[clamp(0.65rem,0.8vw,0.75rem)] font-bold uppercase tracking-[0.15em] text-primary mb-3">
                  Para prestadores
                </p>
                <h2 className="mt-2 text-[clamp(2rem,5vw,3.75rem)] font-extrabold tracking-tight text-ink max-w-3xl mx-auto">
                  Planos simples, sem comissão por contrato fechado
                </h2>
                {landing.vagasPromocionais > 0 && (
                  <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#E6F6F1] px-5 py-2 text-sm font-bold text-primary border border-primary/10">
                    <Sparkles className="size-4" />
                    Oferta de lançamento · {landing.vagasPromocionais} vagas restantes
                  </div>
                )}
                <p className="mt-8 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed">
                  Os 100 primeiros cadastros travam R$ 47 (Profissional) ou R$ 147 (Business) por 12
                  meses. O plano Grátis continua com perfil completo e avaliações.
                </p>
              </Revelar>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {landing.planos.map((plano) => {
                const promo = PRECO_PROMOCIONAL[plano.nome];
                const destaque = plano.nome === "Business";
                const recursos = recursosAtivos(
                  plano.recursos as Record<string, unknown> | null,
                ).slice(0, 5);
                
                return (
                  <Revelar key={plano.id} delay={plano.nome === "Grátis" ? 0 : 100}>
                    <div
                      className={`relative flex h-full flex-col rounded-3xl p-8 transition-all duration-300 ${
                        destaque
                          ? "bg-white shadow-2xl ring-2 ring-primary scale-105 z-10"
                          : "bg-white/50 border border-border/50 hover:bg-white hover:shadow-xl"
                      }`}
                    >
                      {destaque && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-lg">
                          Mais escolhido
                        </div>
                      )}
                      
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-ink">{plano.nome}</h3>
                        <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">
                          {PLANO_RESUMO[plano.nome] ?? ""}
                        </p>
                      </div>

                      <div className="mb-8">
                        {promo && landing.vagasPromocionais > 0 ? (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground line-through opacity-60">
                              {formatarBRL(Number(plano.preco_mensal))}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-ink">
                                {formatarBRL(promo)}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">/mês</span>
                            </div>
                            <div className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                              Preço travado
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight text-ink">
                              {Number(plano.preco_mensal) === 0
                                ? "Grátis"
                                : formatarBRL(Number(plano.preco_mensal))}
                            </span>
                            {Number(plano.preco_mensal) > 0 && (
                              <span className="text-sm font-medium text-muted-foreground">/mês</span>
                            )}
                          </div>
                        )}
                      </div>

                      <ul className="mb-8 flex-1 space-y-4 text-sm">
                        {recursos.map((r) => (
                          <li key={r} className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Check className="size-3" strokeWidth={3} />
                            </div>
                            <span className="text-muted-foreground font-medium leading-tight">{r}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        asChild
                        size="lg"
                        className={`w-full rounded-xl font-bold ${
                          destaque 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]" 
                            : ""
                        }`}
                        variant={destaque ? "default" : "outline"}
                      >
                        <Link to="/auth" search={{ modo: "criar" }}>
                          Começar agora
                        </Link>
                      </Button>
                    </div>
                  </Revelar>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-[1440px] px-6 py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dúvidas</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Perguntas frequentes</h2>
          <p className="mt-3 text-muted-foreground">
            Se ficou alguma dúvida, fale com a gente antes de criar sua vitrine.
          </p>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="avaliar" className="mx-auto w-full max-w-[1440px] px-6 pb-8">
          <div className="surface-panel flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="selo-gold rounded-full p-3">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Já contratou? Deixe uma avaliação verificada</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Encontre o prestador, comprove o vínculo com CNPJ, e-mail corporativo ou convite
                  recebido — e sua nota entra no perfil com peso de cliente real.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/buscar/$categoria/$regiao" params={{ categoria: "todas", regiao: "todos" }} search={{ tipo: undefined }}>
                Encontrar prestador
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-6 py-20">

          <div className="rounded-[2rem] bg-primary px-8 py-14 text-center text-primary-foreground md:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold md:text-4xl">
              Comece agora: encontre um prestador ou coloque sua empresa na vitrine
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Buscar é grátis e sem cadastro. Criar vitrine leva menos de 5 minutos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/buscar/$categoria/$regiao" params={{ categoria: "todas", regiao: "todos" }} search={{ tipo: undefined }}>
                  Buscar prestadores
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/auth" search={{ modo: "criar" }}>
                  Criar minha vitrine
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/30 text-[13px]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <p className="text-sm font-semibold">Praxa</p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Marketplace B2B de serviços profissionais com reputação verificada. Perfis abertos,
                sem venda de lead avulso.
              </p>
            </div>


            <nav aria-label="Categorias">
              <h2 className="text-xs font-semibold uppercase tracking-wide">Categorias</h2>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                {CATEGORIAS.map((c) => (
                  <li key={c.slug}>
                    <Link
                        to="/buscar/$categoria/$regiao"
                        params={{ categoria: c.slug, regiao: "todos" }}
                        search={{ tipo: undefined }}
                      className="hover:text-foreground"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Regiões">
              <h2 className="text-xs font-semibold uppercase tracking-wide">Regiões</h2>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                {[
                  { slug: "sao-paulo", label: "São Paulo" },
                  { slug: "campinas", label: "Campinas" },
                  { slug: "belo-horizonte", label: "Belo Horizonte" },
                  { slug: "curitiba", label: "Curitiba" },
                  { slug: "remoto", label: "Atendimento remoto" },
                ].map((r) => (
                  <li key={r.slug}>
                    <Link
                      to="/buscar/$categoria/$regiao"
                      params={{ categoria: "todas", regiao: r.slug }}
                      search={{ tipo: undefined }}
                      className="hover:text-foreground"
                    >
                      Serviços em {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Praxa">
              <h2 className="text-xs font-semibold uppercase tracking-wide">Praxa</h2>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#como-funciona" className="hover:text-foreground">
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="#planos" className="hover:text-foreground">
                    Planos para prestadores
                  </a>
                </li>
                <li>
                  <Link
                    to="/demandas/nova"
                    search={{ categoria: "", regiao: "" }}
                    className="hover:text-foreground"
                  >
                    Registrar demanda
                  </Link>
                </li>
                <li>
                  <a href="#avaliar" className="hover:text-foreground">
                    Avaliar um prestador
                  </a>
                </li>

                <li>
                  <Link to="/auth" search={{ modo: "entrar" }} className="hover:text-foreground">
                    Entrar
                  </Link>
                </li>
                <li>
                  <a href="mailto:contato@praxa.com.br" className="hover:text-foreground">
                    contato@praxa.com.br
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Praxa · Marketplace B2B de serviços profissionais</p>
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Avaliações vinculadas a clientes reais
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

type Depoimento = {
  id: string;
  nota: number;
  comentario: string;
  metodo_verificacao: string | null;
  prestador_nome: string;
  prestador_slug: string;
  prestador_categoria: string;
};

function SecaoDepoimentos({ depoimentos }: { depoimentos: Depoimento[] }) {
  const { ref, naTela } = useNaTela<HTMLDivElement>();

  return (
    <section id="depoimentos" className="border-y border-border bg-muted/30">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-20">
        <Revelar>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            O que dizem os clientes
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
            Avaliações que só existem com vínculo comprovado
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cada selo abaixo indica como o vínculo daquele cliente foi confirmado.
          </p>
        </Revelar>

        <div ref={ref} className="mt-10 grid gap-6 md:grid-cols-3">
          {depoimentos.map((d, i) => (
            <Revelar key={d.id} delay={i * 90}>
              <figure className="surface-panel flex h-full flex-col p-8">
                <div className="flex text-primary" aria-label={`Nota ${d.nota} de 5`}>
                  {Array.from({ length: d.nota }).map((_, s) => (
                    <Star key={s} className="size-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{d.comentario}”
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                  <Link
                    to="/pro/$slug"
                    params={{ slug: d.prestador_slug }}
                    className="font-semibold hover:text-primary"
                  >
                    {d.prestador_nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {categoriaLabel(d.prestador_categoria)}
                  </p>
                  <SeloAvaliacao
                    className="mt-3"
                    animar={naTela}
                    delay={i * 220}
                    rotulo={
                      METODO_VERIFICACAO_LABEL[d.metodo_verificacao ?? ""] ?? "Avaliação verificada"
                    }
                  />
                </figcaption>
              </figure>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}
