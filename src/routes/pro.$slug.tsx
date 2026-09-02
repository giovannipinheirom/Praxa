import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Clock,
  Images,
  Mail,
  MapPin,
  Repeat2,
  Ticket,
  Users,
  Wallet,
  CalendarDays,
  Globe,
  Linkedin,
  Instagram,
  Phone,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Star,
  Quote,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp,
  Zap,
  Share2,
  Heart,
  Scale,
  Check,
  Info,
  DollarSign,
  Play,
  FileText,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { FormAvaliacao } from "@/components/form-avaliacao";
import { SeloVerificado } from "@/components/selo-verificado";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  categoriaLabel,
  FAIXAS_PRECO,
  modeloPrecificacaoLabel,
  modeloTrabalhoLabel,
  tamanhoEquipeLabel,
} from "@/lib/marketplace";
import { obterPrestador } from "@/lib/marketplace.functions";
import { useState } from "react";
import { cn } from "@/lib/utils";

const perfilQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prestador", slug],
    queryFn: () => obterPrestador({ data: { slug } }),
  });

const METODO_CHIP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  cnpj: { label: "CNPJ conferido", icon: Building2 },
  email_corporativo: { label: "E-mail corporativo", icon: Mail },
  convite_prestador: { label: "Convite de uso único", icon: Ticket },
};

export const Route = createFileRoute("/pro/$slug")({
  loader: async ({ context, params }) => {
    const perfil = await context.queryClient.ensureQueryData(perfilQuery(params.slug));
    if (!perfil) throw notFound();
    return { nome: perfil.prestador.nome_negocio, descricao: perfil.prestador.descricao };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Perfil indisponível | Praxa" }, { name: "robots", content: "noindex" }],
      };
    }
    const titulo = `${loaderData.nome} | Avaliações verificadas na Praxa`;
    const descricao =
      (loaderData.descricao ?? "").slice(0, 155) ||
      `Perfil de ${loaderData.nome} com nota média, avaliações verificadas e tempo de resposta.`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `/pro/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/pro/${params.slug}` }],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Não foi possível carregar este perfil</h1>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Prestador não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este perfil pode ter sido removido ou ainda está em verificação.
      </p>
      <Button asChild className="mt-6">
        <Link to="/buscar/$categoria/$regiao" params={{ categoria: "todas", regiao: "todos" }} search={{ tipo: undefined }}>
          Ver outros prestadores
        </Link>
      </Button>
    </div>
  ),
  component: PerfilPublico,
});

function BotaoOrcamento({
  categoria,
  className,
  variant = "primary"
}: {
  categoria: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Button asChild size="lg" className={cn(
      "h-14 px-8 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 rounded-2xl",
      variant === "primary" ? "selo-gold hover:brightness-110 shadow-lg shadow-primary/20" : "bg-ink text-white hover:bg-ink/90",
      className
    )}>
      <Link to="/demandas/nova" search={{ categoria, regiao: "" }}>
        <Mail className="size-5" />
        Solicitar orçamento
      </Link>
    </Button>
  );
}


function BarraResposta({ horas }: { horas: number | null }) {
  if (!horas) {
    return (
      <p className="text-sm text-muted-foreground">
        Tempo de resposta ainda não medido para este prestador.
      </p>
    );
  }
  // Escala honesta: 24h ocupa a barra inteira; respostas mais lentas ficam cheias.
  const pct = Math.min(100, Math.round((horas / 24) * 100));
  return (
    <div>
      <p className="text-sm">
        Responde em média em <strong>{horas < 1 ? "menos de 1h" : `${horas.toFixed(0)}h`}</strong>
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Tempo médio de resposta: ${horas.toFixed(0)} horas, numa escala de 24 horas`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">Escala: 0h — 24h (média das respostas)</p>
    </div>
  );
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/10 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-bold text-ink">{pergunta}</span>
        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
          {resposta}
        </div>
      )}
    </div>
  );
}

function PerfilPublico() {

  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(perfilQuery(slug));
  if (!data) return null;
  const { prestador, avaliacoes } = data;

  const local =
    [prestador.cidade, prestador.estado].filter(Boolean).join(" · ") ||
    (prestador as any).regiao_atendimento ||
    "Atende remoto";

  const faixa =
    FAIXAS_PRECO.find((f) => f.value === prestador.faixa_preco)?.label ?? prestador.faixa_preco;
  const subcategorias = prestador.subcategorias ?? [];
  const horas = prestador.tempo_medio_resposta_horas
    ? Number(prestador.tempo_medio_resposta_horas)
    : null;

  const anos = prestador.ano_fundacao
    ? new Date().getFullYear() - Number(prestador.ano_fundacao)
    : null;

  const equipe = ((prestador as any).equipe as any[]) || [];
  const faq = ((prestador as any).perguntas_frequentes as any[]) || [];

  const fichaEmpresa = [
    prestador.ano_fundacao && prestador.tipo_prestador === "agencia" && {
      label: "No mercado desde",
      valor: `${prestador.ano_fundacao}${anos && anos > 0 ? ` · ${anos} anos` : ""}`,
      icone: CalendarDays,
    },
    prestador.tamanho_equipe && prestador.tipo_prestador === "agencia" && {
      label: "Equipe",
      valor: tamanhoEquipeLabel(prestador.tamanho_equipe) ?? "",
      icone: Users,
    },
    prestador.modelo_trabalho && {
      label: "Atendimento",
      valor: modeloTrabalhoLabel(prestador.modelo_trabalho) ?? "",
      icone: MapPin,
    },
    prestador.modelo_precificacao && {
      label: "Modelo de cobrança",
      valor: modeloPrecificacaoLabel(prestador.modelo_precificacao) ?? "",
      icone: Briefcase,
    },
  ].filter(Boolean) as { label: string; valor: string; icone: typeof Users }[];


  const links = [
    prestador.site_url && { href: prestador.site_url, label: "Site", icone: Globe },
    prestador.linkedin_url && {
      href: prestador.linkedin_url,
      label: "LinkedIn",
      icone: Linkedin,
    },
    prestador.instagram_url && {
      href: prestador.instagram_url,
      label: "Instagram",
      icone: Instagram,
    },
  ].filter(Boolean) as { href: string; label: string; icone: typeof Globe }[];

  const whatsappLink = prestador.whatsapp
    ? `https://wa.me/55${String(prestador.whatsapp).replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[clamp(1024px,85vw,1280px)] px-4 sm:px-6 lg:px-12 py-[clamp(2rem,5vh,5rem)]">
        <nav aria-label="Trilha" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Início
          </Link>
          <span className="px-2">/</span>
          <Link
            to="/buscar/$categoria/$regiao"
            params={{ categoria: prestador.categoria_principal, regiao: "todos" }}
            search={{ tipo: undefined }}
            className="hover:text-foreground"
          >
            {categoriaLabel(prestador.categoria_principal)}
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{prestador.nome_negocio}</span>
        </nav>

        {/* Hero de Autoridade Editorial - Sem "cara de card" */}
        <header className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between pb-12 border-b border-border/60">
          <div className="flex-1 space-y-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 text-center md:text-left">
              {prestador.foto_perfil_url ? (
                <img
                  key={prestador.foto_perfil_url}
                  src={prestador.foto_perfil_url}
                  alt={`Logo de ${prestador.nome_negocio}`}
                  className="size-28 shrink-0 rounded-[2rem] object-cover ring-1 ring-border/50 shadow-xl sm:size-32 md:size-40 md:rounded-[2.5rem]"
                />
              ) : (
                <span className="grid size-28 shrink-0 place-items-center rounded-[2rem] bg-accent text-4xl font-bold text-accent-foreground sm:size-32 md:size-40 md:rounded-[2.5rem] ring-1 ring-border/50 shadow-xl">
                  {prestador.nome_negocio.slice(0, 2).toUpperCase()}
                </span>
              )}
              
              <div className="min-w-0 flex-1 space-y-4 w-full">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl text-ink">
                    {prestador.nome_negocio}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {(prestador as any).empresa_verificada && (
                      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                        <BadgeCheck className="size-4 fill-primary text-white" />
                        VERIFICADO
                      </div>
                    )}
                  </div>
                </div>
                
                {prestador.headline && (
                  <p className="text-2xl sm:text-3xl text-muted-foreground/80 font-medium leading-tight max-w-3xl">
                    {prestador.headline}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 pt-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink/70">
                    <MapPin className="size-4 text-primary" /> {prestador.modelo_trabalho === "remoto" ? "Atendimento Nacional" : local}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-ink/70">
                    <Clock className="size-4 text-primary" /> Responde em ~{horas ? `${horas.toFixed(0)}h` : "24h"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-ink/70">
                    <Building2 className="size-4 text-primary" /> CNPJ Validado
                  </div>
                </div>
              </div>
            </div>

            {/* Indicadores como Conquistas (Estilo Stripe/Linear) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 pt-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <History className="size-3.5" /> Tempo de Mercado
                </p>
                <p className="font-mono text-2xl font-bold text-ink">
                  {anos ? `${anos} Anos` : "Consolidada"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <TrendingUp className="size-3.5" /> Track Record
                </p>
                <p className="font-mono text-2xl font-bold text-ink">
                  +{prestador.total_clientes_atendidos || 10} Cases
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Zap className="size-3.5" /> Performance
                </p>
                <p className="font-mono text-2xl font-bold text-ink">
                  {Number(prestador.nota_media).toFixed(1)} <span className="text-xs text-muted-foreground">Score</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Users className="size-3.5" /> Auditoria
                </p>
                <p className="font-mono text-2xl font-bold text-ink text-primary">
                  100% <span className="text-xs text-primary/70">Verificado</span>
                </p>
              </div>
            </div>
          </div>

          {/* Badge de Score Compacto e Flutuante */}
          <div className="lg:mb-4 w-full md:w-auto">
            <div className={cn(
              "relative group p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl ring-1 ring-white/10 w-full sm:w-64 transition-all duration-500 mx-auto",
              prestador.total_avaliacoes > 0 ? "bg-ink text-white" : "bg-muted/30 text-ink ring-border/50"
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className={cn("size-20 -rotate-12", prestador.total_avaliacoes > 0 ? "text-white" : "text-ink")} />
              </div>
              <div className="relative z-10 text-center space-y-4">
                <div className="relative inline-block">
                  <span className={cn(
                    "font-mono text-7xl font-bold tabular-nums leading-none",
                    prestador.total_avaliacoes > 0 ? "text-primary" : "text-ink/20"
                  )}>
                    {prestador.total_avaliacoes > 0 ? Number(prestador.nota_media).toFixed(1) : "—"}
                  </span>
                  {prestador.total_avaliacoes > 0 && <Star className="absolute -right-4 -top-2 size-10 fill-primary text-primary shadow-xl" />}
                </div>
                <div className="space-y-1">
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", prestador.total_avaliacoes > 0 ? "text-white/50" : "text-muted-foreground")}>
                    {prestador.total_avaliacoes > 0 ? "Confiança Verificada" : "Histórico em Auditoria"}
                  </p>
                  <p className={cn("text-xs font-medium", prestador.total_avaliacoes > 0 ? "text-white/80" : "text-muted-foreground/60")}>
                    {prestador.total_avaliacoes > 0 ? `${prestador.total_avaliacoes} vozes auditadas` : "Aguardando primeiras avaliações"}
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                   <Button size="icon" variant="outline" className={cn(
                     "size-10 rounded-full border-white/10 hover:bg-white/5 bg-transparent",
                     prestador.total_avaliacoes === 0 && "border-border/60 hover:bg-muted/50"
                   )}>
                     <Heart className={cn("size-4", prestador.total_avaliacoes > 0 ? "text-white" : "text-ink")} />
                   </Button>
                   <Button size="icon" variant="outline" className={cn(
                     "size-10 rounded-full border-white/10 hover:bg-white/5 bg-transparent",
                     prestador.total_avaliacoes === 0 && "border-border/60 hover:bg-muted/50"
                   )}>
                     <Share2 className={cn("size-4", prestador.total_avaliacoes > 0 ? "text-white" : "text-ink")} />
                   </Button>
                   <Button size="icon" variant="outline" className={cn(
                     "size-10 rounded-full border-white/10 hover:bg-white/5 bg-transparent",
                     prestador.total_avaliacoes === 0 && "border-border/60 hover:bg-muted/50"
                   )}>
                     <Scale className={cn("size-4", prestador.total_avaliacoes > 0 ? "text-white" : "text-ink")} />
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <Tabs defaultValue="sobre" className="w-full">
            <TabsList className="sticky top-4 z-40 mb-8 flex h-14 items-center justify-start gap-1 rounded-2xl bg-white/80 backdrop-blur-md p-1.5 ring-1 ring-border shadow-lg shadow-black/5 overflow-x-auto max-w-full no-scrollbar">
              <TabsTrigger value="sobre" className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-white">Sobre</TabsTrigger>
              <TabsTrigger value="servicos" className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-white">Serviços</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-white">Portfolio</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-white">Avaliações</TabsTrigger>
              {(equipe.length > 0 || faq.length > 0) && (
                <TabsTrigger value="equipe-faq" className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-white">Time & FAQ</TabsTrigger>
              )}
            </TabsList>


            <TabsContent value="sobre" className="mt-8 space-y-16">
              <div className="space-y-16">
                {prestador.descricao && (
                  <section className="relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-16">
                      <div className="flex-1 space-y-8">
                        <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">
                          {prestador.tipo_prestador === "freelancer" ? "Trajetória Profissional" : "Sobre a Operação"}
                        </h2>
                        <div className="prose prose-slate max-w-none">
                          <p className="text-xl leading-relaxed text-muted-foreground/90 whitespace-pre-wrap font-medium">
                            {prestador.descricao}
                          </p>
                        </div>
                      </div>
                      
                      {/* Ficha Técnica Estilo Editorial */}
                      <div className="w-full lg:w-72 shrink-0">
                        <div className="rounded-[2.5rem] bg-muted/30 p-10 border border-border/40 space-y-8">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Ficha Técnica</h3>
                          <div className="space-y-6">
                            {fichaEmpresa.map((item) => (
                              <div key={item.label} className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60">{item.label}</span>
                                <div className="flex items-center gap-2">
                                  <item.icone className="size-3.5 text-primary" />
                                  <span className="text-sm font-bold text-ink">{item.valor}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Bloco de Diferenciais - Menos card, mais ritmo */}
                <section className="pt-16 border-t border-border/40">
                  <div className="max-w-3xl">
                    <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">
                      Por que empresas escolhem a {prestador.nome_negocio.split(" ")[0]}?
                    </h2>
                  </div>
                  <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
                    {[
                      { icon: ShieldCheck, title: "Processos Rigorosos", desc: "Padrão de entrega garantido em todos os projetos, com métricas de qualidade auditadas continuamente para assegurar o sucesso do cliente." },
                      { icon: CheckCircle2, title: "Verificação Praxa", desc: "Histórico comercial auditado, referências checadas e compliance de fornecedor rigorosamente em dia para sua total segurança jurídica." },
                      { icon: Users, title: "Equipe Especialista", desc: "Profissionais seniores com vasta experiência de mercado, dedicados integralmente à entrega de resultados excepcionais." }
                    ].map((item, i) => (
                      <div key={i} className="space-y-6 group">
                        <div className="flex size-16 items-center justify-center rounded-[2rem] bg-white shadow-xl ring-1 ring-border/50 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                          <item.icon className="size-8" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-serif text-2xl font-bold text-ink">{item.title}</h3>
                          <p className="text-lg leading-relaxed text-muted-foreground/80">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="avaliacoes" className="mt-8 space-y-16">
              <section className="relative">
                <div className="flex flex-col md:flex-row gap-16 items-start">
                  <div className="space-y-6 shrink-0">
                    <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">Avaliações Verificadas</h2>
                    <div className="flex items-center gap-6">
                      <p className="font-mono text-7xl font-bold text-primary tabular-nums leading-none">
                        {Number(prestador.nota_media).toFixed(1)}
                      </p>
                      <div className="space-y-1">
                        <div className="flex gap-1 text-primary">
                          {[...Array(5)].map((_, i) => <Star key={i} className={cn("size-5", i < Math.floor(prestador.nota_media) ? "fill-primary" : "text-border")} />)}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Média de {prestador.total_avaliacoes} vozes auditadas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3 w-full py-4 border-l border-border/40 pl-16 hidden md:block">
                    {[5, 4, 3, 2, 1].map((nota) => {
                      const count = avaliacoes.filter(a => Math.floor(a.nota) === nota).length;
                      const pct = (count / (avaliacoes.length || 1)) * 100;
                      return (
                        <div key={nota} className="flex items-center gap-4 group">
                          <span className="text-[10px] font-bold text-ink/40 w-4">{nota}</span>
                          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-ink/30 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="shrink-0 w-full md:w-auto self-center">
                     <Button variant="outline" className="w-full md:w-auto h-16 rounded-[2rem] border-primary/20 bg-primary/5 text-primary font-bold px-10 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5" asChild>
                       <a href="#avaliar">Deixar uma avaliação</a>
                     </Button>
                  </div>
                </div>
              </section>

              {avaliacoes.length === 0 ? (
                <div className="py-24 text-center rounded-[3rem] bg-muted/20 border border-dashed border-border/60">
                  <p className="font-serif text-3xl font-bold text-ink">Histórico em construção</p>
                  <p className="mt-4 text-xl text-muted-foreground max-w-md mx-auto">
                    Ainda não há avaliações auditadas para esta empresa. Inicie o histórico deixando seu feedback.
                  </p>
                </div>
              ) : (
                <div className="grid gap-12">
                  {avaliacoes.map((a) => {
                    const metodo = METODO_CHIP[a.metodo_verificacao ?? ""] ?? {
                      label: "Vínculo verificado",
                      icon: BadgeCheck,
                    };
                    const IconeMetodo = metodo.icon;
                    return (
                      <div key={a.id} className="group relative py-12 border-t border-border/40 first:border-0 first:pt-0">
                        <div className="flex flex-col gap-8">
                          <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-3xl font-bold text-ink tabular-nums">
                                {a.nota.toFixed(1)}
                              </span>
                              <div className="flex gap-0.5 text-primary">
                                {[...Array(5)].map((_, i) => <Star key={i} className={cn("size-3.5", i < Math.floor(a.nota) ? "fill-primary" : "text-border")} />)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <IconeMetodo className="size-3.5" />
                                {metodo.label}
                              </span>
                              <time
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                                dateTime={a.created_at}
                              >
                                {new Date(a.created_at).toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' })}
                              </time>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <Quote className="absolute -left-8 -top-8 size-16 text-primary/5 -z-10" />
                            <p className="text-2xl leading-relaxed text-ink/80 italic font-medium max-w-4xl">
                              "{a.comentario}"
                            </p>
                          </div>

                          {a.resposta_prestador && (
                            <div className="rounded-[2rem] bg-muted/20 p-8 border border-border/40">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">Resposta do prestador</p>
                              <p className="text-lg leading-relaxed text-muted-foreground italic">
                                "{a.resposta_prestador}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div id="avaliar" className="pt-16 border-t border-border/40">
                <div className="max-w-3xl space-y-4">
                  <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">Sua experiência importa</h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">Ajudamos o mercado a ser mais transparente. Se você já trabalhou com a {prestador.nome_negocio.split(" ")[0]}, deixe sua avaliação auditada.</p>
                </div>
                <div className="mt-12">
                  <FormAvaliacao
                    prestadorSlug={prestador.slug}
                    prestadorNome={prestador.nome_negocio}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-8 space-y-16">
              <section className="relative">
                <div className="max-w-3xl space-y-4">
                  <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">Cases de Sucesso</h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">Projetos reais que demonstram nossa capacidade técnica e compromisso com resultados de negócio.</p>
                </div>

                {!(prestador as any).portfolio || ((prestador as any).portfolio as any[]).length === 0 ? (
                  <div className="mt-16 py-32 text-center rounded-[3rem] border border-dashed border-border/60 bg-muted/5 flex flex-col items-center">
                    <Images className="size-16 text-muted-foreground/30 mb-8" />
                    <p className="font-serif text-3xl font-bold text-ink">Portfólio em curadoria</p>
                    <p className="mt-4 text-xl text-muted-foreground max-w-md mx-auto">
                      {prestador.nome_negocio} ainda não publicou projetos nesta vitrine. Solicite um portfólio completo via orçamento.
                    </p>
                    <BotaoOrcamento categoria={prestador.categoria_principal} className="mt-12" />
                  </div>
                ) : (
                  <div className="mt-16 grid gap-16 sm:grid-cols-2">
                    {((prestador as any).portfolio as any[]).map((item) => (
                      <div
                        key={item.id}
                        className="group space-y-8"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden rounded-[2.5rem] bg-muted relative ring-1 ring-border/50 shadow-2xl transition-all group-hover:shadow-primary/10 group-hover:-translate-y-2">
                          {item.tipo === "imagem" ? (
                            <img
                              src={item.url}
                              alt={item.titulo}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-ink">
                               <Play className="size-16 text-white/20" />
                            </div>
                          )}
                          <div className="absolute top-8 left-8">
                            <span className="rounded-full bg-white/95 backdrop-blur px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink shadow-xl ring-1 ring-black/5">
                              {item.tipo === "video" ? "Case em Vídeo" : "PROJETO TÉCNICO"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-6 px-4">
                          <div className="flex items-start justify-between gap-6">
                            <h3 className="font-serif text-3xl font-bold leading-tight text-ink group-hover:text-primary transition-colors">{item.titulo}</h3>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-full bg-primary/10 p-3.5 text-primary transition-all hover:bg-primary hover:text-white shadow-lg shadow-primary/5"
                            >
                              <ArrowRight className="size-6" />
                            </a>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-10 pt-8 border-t border-border/40">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] flex items-center gap-2">
                                <FileText className="size-3.5 text-primary" /> Desafio
                              </p>
                              <p className="text-sm font-medium text-ink/80 leading-relaxed">Complexidade técnica e necessidade de escala rápida sob demanda do mercado.</p>
                            </div>
                            <div className="space-y-2 border-l border-border/40 pl-10">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] flex items-center gap-2">
                                <TrendingUp className="size-3.5 text-primary" /> Resultado
                              </p>
                              <p className="text-sm font-bold text-primary leading-relaxed">Entrega 100% alinhada ao escopo e metas críticas de negócio.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>


            <TabsContent value="servicos" className="mt-8 space-y-16">
              <section className="relative">
                <div className="flex flex-col sm:flex-row items-end justify-between gap-12">
                  <div className="max-w-3xl space-y-4">
                    <h2 className="font-serif text-4xl font-bold tracking-tight text-ink">Catálogo de Serviços</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">Estrutura de investimento planejada para cada fase do seu negócio.</p>
                  </div>
                  <div className="shrink-0 rounded-[2rem] bg-muted/30 p-8 border border-border/40 text-center min-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Investimento Base</p>
                    <p className="font-mono text-4xl font-bold text-primary">{prestador.faixa_preco}</p>
                  </div>
                </div>

                <div className="mt-16 space-y-6">
                  {subcategorias.length > 0 ? (
                    subcategorias.map((sub) => (
                      <div key={sub} className="group flex flex-col sm:flex-row items-center gap-8 p-10 rounded-[2.5rem] border border-border/40 bg-white transition-all hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-primary/5 text-primary shadow-inner">
                          <CheckCircle2 className="size-8" />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                          <h3 className="font-serif text-2xl font-bold text-ink group-hover:text-primary transition-colors">{sub}</h3>
                          <p className="text-muted-foreground font-medium">Serviço especializado com entrega estratégica focada em {categoriaLabel(prestador.categoria_principal).toLowerCase()}.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
                          <div className="text-center space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Modelo</p>
                            <p className="text-sm font-bold text-ink uppercase tracking-wider">{modeloPrecificacaoLabel(prestador.modelo_precificacao ?? "")}</p>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Prazo Médio</p>
                            <p className="text-sm font-bold text-ink">Sob consulta</p>
                          </div>
                        </div>
                        <BotaoOrcamento categoria={prestador.categoria_principal} variant="secondary" className="h-14 px-10 text-sm font-bold shadow-lg shadow-black/5" />
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center rounded-[3rem] border border-dashed border-border/60 bg-muted/5">
                       <p className="text-xl text-muted-foreground">Propostas personalizadas sob demanda técnica.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="pt-16 border-t border-border/40">
                <h2 className="font-serif text-3xl font-bold text-ink">Arquitetura de Trabalho</h2>
                <div className="mt-12 grid gap-8 sm:grid-cols-3">
                  {[
                    { step: "01", title: "Diagnóstico", desc: "Alinhamento profundo de expectativas e mapeamento de dores estratégicas." },
                    { step: "02", title: "Solução", desc: "Apresentação da arquitetura técnica, cronograma e KPIs de sucesso." },
                    { step: "03", title: "Escala", desc: "Entrega técnica de alta performance focada em prazos e qualidade auditada." }
                  ].map((p) => (
                    <div key={p.step} className="group relative rounded-[2rem] border border-border/40 bg-muted/10 p-10 transition-all hover:bg-white hover:shadow-2xl hover:border-primary/20">
                      <span className="font-mono text-5xl font-bold text-primary/5 absolute top-8 right-8 group-hover:text-primary/10 transition-colors">{p.step}</span>
                      <div className="space-y-4">
                        <h3 className="font-serif text-2xl font-bold text-ink">{p.title}</h3>
                        <p className="text-muted-foreground leading-relaxed font-medium">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="equipe-faq" className="mt-8 space-y-16">
              {equipe.length > 0 && (
                <section className="relative pt-16 border-t border-border/40">
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-ink">O Time de Especialistas</h2>
                  <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {equipe.map((membro: any, i: number) => (
                      <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] border border-border/40 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="size-16 shrink-0 rounded-full bg-accent grid place-items-center font-bold text-accent-foreground text-xl ring-1 ring-border/50 shadow-inner">
                          {membro.nome?.slice(0, 1) || "P"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-serif text-xl font-bold text-ink">{membro.nome}</p>
                          <p className="truncate text-sm text-muted-foreground">{membro.cargo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {faq.length > 0 && (
                <section className="relative pt-16 border-t border-border/40">
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-ink">Dúvidas Frequentes</h2>
                  <div className="mt-12 space-y-6">
                    {faq.map((item: any, i: number) => (
                      <FaqItem key={i} pergunta={item.pergunta} resposta={item.resposta} />
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>

          </Tabs>

          {/* Sidebar Fixa e Compacta de Conversão */}
          <aside className="sticky top-24 hidden space-y-6 lg:block">
            <div className="rounded-[2.5rem] border border-border/40 bg-white p-8 shadow-2xl ring-1 ring-border/5 overflow-hidden transition-all hover:shadow-primary/5">
              <div className="relative mb-6">
                <h3 className="font-serif text-2xl font-bold text-ink leading-tight">
                  Contratar {prestador.nome_negocio.split(" ")[0]}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                   <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disponível para novos projetos</span>
                </div>
              </div>
              
              <p className="text-sm leading-relaxed text-muted-foreground">
                Inicie uma consulta direta para orçamentos ou dúvidas técnicas. Resposta média em {horas ? `${horas.toFixed(0)}h` : "poucas horas"}.
              </p>
              
              <div className="mt-8 space-y-4">
                <BotaoOrcamento 
                  categoria={prestador.categoria_principal} 
                  className="w-full text-lg h-16"
                  variant="primary"
                />

                <div className="grid grid-cols-2 gap-3">
                  {whatsappLink && (
                    <Button
                      variant="outline"
                      className="rounded-2xl h-12 border-border/60 font-semibold hover:bg-muted/50 transition-all text-xs"
                      asChild
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <Phone className="mr-2 size-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {prestador.site_url && (
                    <Button
                      variant="outline"
                      className="rounded-2xl h-12 border-border/60 font-semibold hover:bg-muted/50 transition-all text-xs"
                      asChild
                    >
                      <a href={prestador.site_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 size-3.5" />
                        Site
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {prestador.linkedin_url && (
                    <Button
                      variant="outline"
                      className="rounded-2xl h-12 border-border/60 font-semibold hover:bg-muted/50 transition-all text-xs"
                      asChild
                    >
                      <a href={prestador.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 size-3.5" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                   {prestador.instagram_url && (
                    <Button
                      variant="outline"
                      className="rounded-2xl h-12 border-border/60 font-semibold hover:bg-muted/50 transition-all text-xs"
                      asChild
                    >
                      <a href={prestador.instagram_url} target="_blank" rel="noopener noreferrer">
                        <Instagram className="mr-2 size-3.5" />
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-border/40 pt-8">
                <div className="rounded-2xl bg-ink p-6 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="size-20 -rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="size-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">Garantia Praxa</span>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-white/70">
                      Contratação protegida. Validamos dados fiscais, conferimos referências e mediamos qualquer conflito técnico para assegurar sua entrega.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-primary">
                          <Check className="size-3" /> CNPJ Verificado
                       </div>
                       <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-primary">
                          <Check className="size-3" /> Score Real de Mercado
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
