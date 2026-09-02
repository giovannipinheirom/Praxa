import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Image as ImageIcon, ShieldCheck, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { PreviewVitrine } from "@/components/preview-vitrine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePlanos, usePrestador, useVagasPromocionais } from "@/hooks/use-prestador";
import {
  CATEGORIAS,
  FAIXAS_PRECO,
  MODELOS_PRECIFICACAO,
  MODELOS_TRABALHO,
  TAMANHOS_EQUIPE,
} from "@/lib/marketplace";
import { formatarBRL, PLANO_RESUMO, recursosAtivos } from "@/lib/planos";
import { ensureProfile, slugify, cnpjValido } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import catContabilidade from "@/assets/cat-contabilidade.png";
import catMarketing from "@/assets/cat-marketing.png";
import catJuridico from "@/assets/cat-juridico.png";
import catTi from "@/assets/cat-ti.png";
import catRh from "@/assets/cat-rh.png";
import catOutros from "@/assets/cat-outros.png";

const ILUSTRACAO_CATEGORIA: Record<string, string> = {
  contabilidade: catContabilidade,
  marketing: catMarketing,
  juridico: catJuridico,
  ti: catTi,
  rh: catRh,
  outros: catOutros,
};

const REGIOES_RAPIDAS = [
  "Remoto (todo o Brasil)",
  "São Paulo, SP",
  "Campinas, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Porto Alegre, RS",
];

const PASSOS = [
  { titulo: "Dados do negócio", legenda: "Como você se apresenta" },
  { titulo: "Categoria e especialidades", legenda: "Onde você aparece na busca" },
  { titulo: "Região de atendimento", legenda: "Quem consegue te contratar" },
  { titulo: "Portfólio", legenda: "Seus melhores trabalhos" },
  { titulo: "CNPJ", legenda: "Base da validação de avaliações" },
  { titulo: "Plano", legenda: "Alcance da sua credencial" },
];

function formatarCnpj(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Anel de progresso: "completando o perfil". */
function AnelProgresso({ valor }: { valor: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-border"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * valor) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl leading-none font-semibold tabular-nums">
          {Math.round(valor)}%
        </span>
        <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
          perfil
        </span>
      </div>
    </div>
  );
}

/** Bloco temático dentro do cartão do passo — dá hierarquia ao formulário. */
function Secao({
  titulo,
  legenda,
  children,
}: {
  titulo: string;
  legenda: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-6 first:border-0 first:pt-0">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{legenda}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Emissão da credencial de prestador | Praxa" },
      {
        name: "description",
        content:
          "Complete os cinco passos do cadastro e coloque seu perfil verificado de prestador no ar na Praxa.",
      },
      { property: "og:title", content: "Emissão da credencial de prestador | Praxa" },
      {
        property: "og:description",
        content: "Cinco passos para colocar seu perfil de prestador no ar na Praxa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePrestador();
  const { data: planos } = usePlanos();
  const { data: vagas } = useVagasPromocionais();

  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  const [concluido, setConcluido] = useState(false);

  const [form, setForm] = useState({
    nome_negocio: "",
    headline: "",
    categoria_principal: "contabilidade",
    subcategorias: "",
    descricao: "",
    regiao_atendimento: "",
    cidade: "",
    estado: "",
    cnpj: "",
    faixa_preco: "$$",
    total_clientes_atendidos: "0",
    foto_perfil_url: "",
    ano_fundacao: "",
    tamanho_equipe: "",
    modelo_trabalho: "remoto",
    modelo_precificacao: "projeto",
    email_contato: "",
    whatsapp: "",
    site_url: "",
    linkedin_url: "",
    instagram_url: "",
    tipo_prestador: "agencia" as "agencia" | "freelancer",
    portfolio: [] as any[],
    equipe: [] as any[],
    perguntas_frequentes: [] as any[],
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [planoId, setPlanoId] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const p = data.prestador;
    setForm({
      nome_negocio: p.nome_negocio ?? "",
      headline: p.headline ?? "",
      categoria_principal: p.categoria_principal ?? "contabilidade",
      subcategorias: (p.subcategorias ?? []).join(", "),
      descricao: p.descricao ?? "",
      regiao_atendimento: p.regiao_atendimento ?? "",
      cidade: p.cidade ?? "",
      estado: p.estado ?? "",
      cnpj: p.cnpj ? formatarCnpj(p.cnpj) : "",
      faixa_preco: p.faixa_preco ?? "$$",
      total_clientes_atendidos: String(p.total_clientes_atendidos ?? 0),
      foto_perfil_url: p.foto_perfil_url ?? "",
      ano_fundacao: p.ano_fundacao ? String(p.ano_fundacao) : "",
      tamanho_equipe: p.tamanho_equipe ?? "",
      modelo_trabalho: p.modelo_trabalho ?? "remoto",
      modelo_precificacao: p.modelo_precificacao ?? "projeto",
      email_contato: p.email_contato ?? "",
      whatsapp: p.whatsapp ?? "",
      site_url: p.site_url ?? "",
      linkedin_url: p.linkedin_url ?? "",
      instagram_url: p.instagram_url ?? "",
      tipo_prestador: (p as any).tipo_prestador ?? "agencia",
      portfolio: (p as any).portfolio ?? [],
      equipe: (p as any).equipe ?? [],
      perguntas_frequentes: (p as any).perguntas_frequentes ?? [],
    });
    setPlanoId(p.plano_atual);
  }, [data]);

  const promoAtiva = (vagas ?? 0) > 0;
  const cnpjLimpo = form.cnpj.replace(/\D/g, "");
  const cnpjOk = cnpjLimpo.length === 0 || cnpjValido(cnpjLimpo);
  const emailOk =
    form.email_contato.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email_contato.trim());

  /** Completude do perfil — os mesmos sinais que o visitante vê depois. */
  const completude = useMemo(() => {
    const sinais = [
      form.nome_negocio.trim().length > 2,
      form.descricao.trim().length >= 80,
      !!form.categoria_principal,
      form.subcategorias.trim().length > 0,
      form.regiao_atendimento.trim().length > 2,
      !!form.cidade.trim() && form.estado.trim().length === 2,
      cnpjLimpo.length === 14 && cnpjOk,
      Number(form.total_clientes_atendidos) > 0,
      !!planoId,
      form.headline.trim().length > 5,
      !!form.foto_perfil_url.trim(),
      !!form.email_contato.trim() && emailOk,
      !!form.ano_fundacao.trim() && !!form.tamanho_equipe,
    ];
    return (sinais.filter(Boolean).length / sinais.length) * 100;
  }, [form, planoId, cnpjLimpo, cnpjOk, emailOk]);

  const podeAvancar = [
    form.nome_negocio.trim().length > 2 && form.descricao.trim().length >= 40 && emailOk,
    !!form.categoria_principal,
    form.regiao_atendimento.trim().length > 2,
    true, // Portfólio é opcional
    true, // CNPJ agora permite avançar (opcional ou validado)
    !!planoId,
  ][passo];

  const irPara = (destino: number) => {
    setDirecao(destino > passo ? "frente" : "tras");
    setPasso(destino);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("sessão expirada, entre novamente");

      const campos = {
        nome_negocio: form.nome_negocio.trim(),
        headline: form.headline.trim() || null,
        categoria_principal: form.categoria_principal as never,
        subcategorias: form.subcategorias
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        descricao: form.descricao.trim(),
        regiao_atendimento: form.regiao_atendimento.trim(),
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim() || null,
        cnpj: cnpjLimpo || null,
        faixa_preco: form.faixa_preco as never,
        total_clientes_atendidos: Number(form.total_clientes_atendidos) || 0,
        foto_perfil_url: form.foto_perfil_url.trim() || null,
        ano_fundacao: form.ano_fundacao.trim() ? Number(form.ano_fundacao) : null,
        tamanho_equipe: form.tamanho_equipe || null,
        modelo_trabalho: form.modelo_trabalho || null,
        modelo_precificacao: form.modelo_precificacao || null,
        email_contato: form.email_contato.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        site_url: form.site_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        plano_atual: planoId,
        status_conta: "ativo" as const,
        tipo_prestador: form.tipo_prestador,
        portfolio: form.portfolio,
        equipe: form.equipe,
        perguntas_frequentes: form.perguntas_frequentes,
      };

      let prestadorId = data?.prestador.id;

      if (prestadorId) {
        const { error } = await supabase
          .from("prestadores")
          .update(campos)
          .eq("id", prestadorId);
        if (error) throw error;
      } else {
        await ensureProfile({
          accountType: "prestador",
          companyName: campos.nome_negocio,
        });
        const base = slugify(campos.nome_negocio) || "prestador";
        const { data: criado, error } = await supabase
          .from("prestadores")
          .insert({
            ...campos,
            profile_id: auth.user.id,
            slug: `${base}-${auth.user.id.slice(0, 6)}-${Math.random().toString(36).slice(2, 6)}`,
          })
          .select("id, slug")
          .single();
        if (error) throw error;
        prestadorId = criado.id;
      }

      const plano = (planos ?? []).find((p) => p.id === planoId);
      if (plano) {
        const precoPromo = promoAtiva && plano.preco_promocional ? plano.preco_promocional : null;
        const { error: assinaturaError } = await supabase.from("assinaturas_prestador").insert({
          prestador_id: prestadorId,
          plano_id: plano.id,
          status: Number(plano.preco_mensal) === 0 ? "ativa" : "trial",
          preco_pago: precoPromo ?? plano.preco_mensal,
          data_fim_preco_promocional: precoPromo
            ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
            : null,
        });
        if (assinaturaError) throw assinaturaError;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setConcluido(true);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message
          ? `Não foi possível salvar: ${error.message}`
          : "Não foi possível salvar. Revise os campos obrigatórios.",
      ),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (concluido) {
    return <PerfilNoAr slug={data?.prestador.slug} onIr={() => navigate({ to: "/painel" })} />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 pb-32">
        <header className="flex flex-wrap items-center gap-6">
          <AnelProgresso valor={completude} />
          <div className="min-w-[16rem] flex-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Emissão da credencial · passo {passo + 1} de {PASSOS.length}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{PASSOS[passo].titulo}</h1>
            <p className="mt-1 text-muted-foreground">{PASSOS[passo].legenda}</p>
          </div>
        </header>

        <ol className="mt-8 grid gap-2 sm:grid-cols-5">
          {PASSOS.map((p, i) => (
            <li key={p.titulo}>
              <button
                type="button"
                onClick={() => i < passo && irPara(i)}
                disabled={i > passo}
                className={cn(
                  "w-full border-t-2 pt-2 text-left text-xs transition-colors",
                  i < passo && "cursor-pointer border-primary text-foreground",
                  i === passo && "border-primary font-semibold text-foreground",
                  i > passo && "border-border text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {i < passo ? (
                    <Check className="size-3.5 text-primary" aria-label="concluído" />
                  ) : (
                    <span className="font-mono tabular-nums">0{i + 1}</span>
                  )}
                  {p.titulo}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <form
          className="min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (passo < PASSOS.length - 1) {
              if (podeAvancar) irPara(passo + 1);
              return;
            }
            if (!planoId) {
              toast.error("Escolha um plano para continuar.");
              return;
            }
            salvar.mutate();
          }}
        >
          <div className="overflow-hidden">
            <div
              key={passo}
              className={cn(
                "surface-panel space-y-6 p-8",
                direcao === "frente"
                  ? "animate-in slide-in-from-right-8 fade-in"
                  : "animate-in slide-in-from-left-8 fade-in",
                "duration-300",
              )}
            >
              {passo === 0 && (
                <>
                  <Secao
                    titulo="Identidade"
                    legenda="Nome, logo e a frase que aparece embaixo do nome na vitrine."
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="flex flex-col items-center gap-2">
                        <div className="group relative flex flex-col items-center gap-2">
                          {form.foto_perfil_url.trim() ? (
                            <img
                              src={form.foto_perfil_url}
                              alt="Logo do negócio"
                              className="size-20 rounded-2xl object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="grid size-20 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground bg-muted/20">
                              <ImageIcon className="size-6" />
                            </div>
                          )}
                          <label 
                            className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform"
                            title={uploadingLogo ? "Enviando..." : "Upload de imagem"}
                          >
                            <Upload className={cn("size-3.5", uploadingLogo && "animate-pulse")} />
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingLogo}
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                try {
                                  setUploadingLogo(true);
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${crypto.randomUUID()}.${fileExt}`;
                                  const filePath = `logos/${fileName}`;

                                  const { error: uploadError } = await supabase.storage
                                    .from("prestadores")
                                    .upload(filePath, file);

                                  if (uploadError) throw uploadError;

                                  const { data: { publicUrl } } = supabase.storage
                                    .from("prestadores")
                                    .getPublicUrl(filePath);

                                  setForm({ ...form, foto_perfil_url: publicUrl });
                                  toast.success("Logo atualizado!");
                                } catch (error) {
                                  console.error("Upload error:", error);
                                  toast.error(error instanceof Error ? error.message : "Erro no upload da imagem");
                                } finally {
                                  setUploadingLogo(false);
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-muted-foreground">logo</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="nome">
                            {form.tipo_prestador === "freelancer" ? "Seu nome profissional" : "Nome do negócio"}
                          </Label>
                          <Input
                            id="nome"
                            autoFocus
                            maxLength={120}
                            value={form.nome_negocio}
                            onChange={(e) => setForm({ ...form, nome_negocio: e.target.value })}
                            placeholder={form.tipo_prestador === "freelancer" ? "Ex: Ana Design" : "Contabilidade Andrade & Associados"}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="foto">URL do logo ou foto de perfil</Label>
                          <Input
                            id="foto"
                            type="url"
                            maxLength={500}
                            value={form.foto_perfil_url}
                            onChange={(e) => setForm({ ...form, foto_perfil_url: e.target.value })}
                            placeholder="https://…/logo.png"
                          />
                          <p className="text-xs text-muted-foreground">
                            Perfis com logo recebem mais cliques na busca. Imagem quadrada, mínimo
                            256×256.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline">Frase de apresentação</Label>
                      <Input
                        id="headline"
                        maxLength={120}
                        value={form.headline}
                        onChange={(e) => setForm({ ...form, headline: e.target.value })}
                        placeholder="BPO financeiro e contábil para empresas de serviço"
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.headline.trim().length}/120 · aparece logo abaixo do nome, na busca e
                        no topo da vitrine.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição completa</Label>
                      <Textarea
                        id="descricao"
                        rows={6}
                        maxLength={2000}
                        value={form.descricao}
                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        placeholder="Explique o que sua empresa faz, para quem e com qual diferencial."
                      />
                      <p
                        className={cn(
                          "text-xs",
                          form.descricao.trim().length > 0 && form.descricao.trim().length < 40
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {form.descricao.trim().length}/2000 · mínimo de 40 caracteres. Acima de 80
                        conta ponto de completude.
                      </p>
                    </div>
                  </Secao>

                  <Secao
                    titulo="Sinais de confiança"
                    legenda="Dados que o contratante procura antes de pedir orçamento."
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      {form.tipo_prestador === "agencia" && (
                        <div className="space-y-2">
                          <Label htmlFor="ano">Ano de fundação</Label>
                          <Input
                            id="ano"
                            type="number"
                            min={1900}
                            max={new Date().getFullYear()}
                            value={form.ano_fundacao}
                            onChange={(e) => setForm({ ...form, ano_fundacao: e.target.value })}
                            placeholder="2018"
                          />
                        </div>
                      )}
                      {form.tipo_prestador === "agencia" && (
                        <div className="space-y-2">
                          <Label htmlFor="equipe">Tamanho da equipe</Label>
                        <Select
                          value={form.tamanho_equipe}
                          onValueChange={(v) => setForm({ ...form, tamanho_equipe: v })}
                        >
                          <SelectTrigger id="equipe">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAMANHOS_EQUIPE.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="clientes">Clientes já atendidos</Label>
                        <Input
                          id="clientes"
                          type="number"
                          min={0}
                          value={form.total_clientes_atendidos}
                          onChange={(e) =>
                            setForm({ ...form, total_clientes_atendidos: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modo">Modo de atendimento</Label>
                        <Select
                          value={form.modelo_trabalho}
                          onValueChange={(v) => setForm({ ...form, modelo_trabalho: v })}
                        >
                          <SelectTrigger id="modo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODELOS_TRABALHO.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Secao>

                  <Secao
                    titulo="Preço"
                    legenda="Como você cobra. Nenhum valor fechado é exigido aqui."
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="faixa">Faixa de preço</Label>
                        <Select
                          value={form.faixa_preco}
                          onValueChange={(v) => setForm({ ...form, faixa_preco: v })}
                        >
                          <SelectTrigger id="faixa">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FAIXAS_PRECO.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="precificacao">Modelo de cobrança</Label>
                        <Select
                          value={form.modelo_precificacao}
                          onValueChange={(v) => setForm({ ...form, modelo_precificacao: v })}
                        >
                          <SelectTrigger id="precificacao">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODELOS_PRECIFICACAO.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Secao>

                  <Secao
                    titulo="Contato e presença digital"
                    legenda="Por onde o cliente fala com você depois de ver a vitrine."
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email_contato">E-mail comercial</Label>
                        <Input
                          id="email_contato"
                          type="email"
                          maxLength={160}
                          value={form.email_contato}
                          onChange={(e) => setForm({ ...form, email_contato: e.target.value })}
                          placeholder="contato@suaempresa.com.br"
                          className={cn(!emailOk && "border-destructive")}
                        />
                        {!emailOk && (
                          <p className="text-xs text-destructive">
                            Informe um e-mail válido ou deixe o campo em branco.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp comercial</Label>
                        <Input
                          id="whatsapp"
                          inputMode="tel"
                          maxLength={20}
                          value={form.whatsapp}
                          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                          placeholder="(11) 99999-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site">Site</Label>
                        <Input
                          id="site"
                          type="url"
                          maxLength={300}
                          value={form.site_url}
                          onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                          placeholder="https://suaempresa.com.br"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          type="url"
                          maxLength={300}
                          value={form.linkedin_url}
                          onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/company/…"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          type="url"
                          maxLength={300}
                          value={form.instagram_url}
                          onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                          placeholder="https://instagram.com/…"
                        />
                      </div>
                    </div>
                  </Secao>
                </>
              )}

              {passo === 1 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIAS.map((c) => {
                      const ativa = form.categoria_principal === c.slug;
                      return (
                        <button
                          type="button"
                          key={c.slug}
                          onClick={() => setForm({ ...form, categoria_principal: c.slug })}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                            ativa
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <img
                            src={ILUSTRACAO_CATEGORIA[c.slug] ?? catOutros}
                            alt=""
                            className="size-12 shrink-0 rounded-lg object-cover"
                          />
                          <span>
                            <span className="block text-sm font-semibold">{c.label}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {c.desc}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategorias">Especialidades (separadas por vírgula)</Label>
                    <Input
                      id="subcategorias"
                      maxLength={300}
                      value={form.subcategorias}
                      onChange={(e) => setForm({ ...form, subcategorias: e.target.value })}
                      placeholder="folha de pagamento, abertura de empresa, BPO financeiro"
                    />
                    <p className="text-xs text-muted-foreground">
                      As especialidades aparecem como chips no seu perfil e ajudam nos filtros de
                      busca.
                    </p>
                  </div>
                </>
              )}

              {passo === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="regiao">Região de atendimento</Label>
                    <Input
                      id="regiao"
                      autoFocus
                      maxLength={120}
                      value={form.regiao_atendimento}
                      onChange={(e) => setForm({ ...form, regiao_atendimento: e.target.value })}
                      placeholder="Todo o Brasil, Remoto ou Campinas"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {REGIOES_RAPIDAS.map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setForm({ ...form, regiao_atendimento: r })}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            form.regiao_atendimento === r
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade (sede)</Label>
                      <Input
                        id="cidade"
                        maxLength={80}
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado (UF)</Label>
                      <Input
                        id="estado"
                        maxLength={2}
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </>
              )}

              {passo === 3 && (
                <div className="space-y-8">
                  <Secao
                    titulo="Itens do portfólio"
                    legenda="Adicione links de trabalhos, vídeos (YouTube/Vimeo) ou URLs de imagens."
                  >
                    <div className="space-y-4">
                      {form.portfolio.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs">Título do trabalho</Label>
                              <Input
                                value={item.titulo}
                                onChange={(e) => {
                                  const novo = [...form.portfolio];
                                  novo[idx].titulo = e.target.value;
                                  setForm({ ...form, portfolio: novo });
                                }}
                                placeholder="Ex: Campanha Verão 2024"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Tipo</Label>
                              <Select
                                value={item.tipo}
                                onValueChange={(v) => {
                                  const novo = [...form.portfolio];
                                  novo[idx].tipo = v;
                                  setForm({ ...form, portfolio: novo });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="imagem">Imagem</SelectItem>
                                  <SelectItem value="video">Vídeo</SelectItem>
                                  <SelectItem value="link">Link externo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                             <div className="sm:col-span-2 space-y-2">
                               <Label className="text-xs">Conteúdo</Label>
                               <div className="flex gap-2">
                                 <Input
                                   className="flex-1"
                                   value={item.url}
                                   onChange={(e) => {
                                     const novo = [...form.portfolio];
                                     novo[idx].url = e.target.value;
                                     setForm({ ...form, portfolio: novo });
                                   }}
                                   placeholder={item.tipo === "link" ? "https://..." : "URL ou faça upload"}
                                 />
                                 {(item.tipo === "imagem" || item.tipo === "video") && (
                                   <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition-colors">
                                     <Upload className="size-4 text-muted-foreground" />
                                     <input
                                       type="file"
                                       accept={item.tipo === "imagem" ? "image/*" : "video/*"}
                                       className="sr-only"
                                       onChange={async (e) => {
                                         const file = e.target.files?.[0];
                                         if (!file) return;

                                         const promise = (async () => {
                                           const fileExt = file.name.split('.').pop();
                                           const fileName = `${Math.random()}.${fileExt}`;
                                           const filePath = `portfolio/${fileName}`;

                                           const { error: uploadError } = await supabase.storage
                                             .from("prestadores")
                                             .upload(filePath, file);

                                           if (uploadError) throw uploadError;

                                           const { data: { publicUrl } } = supabase.storage
                                             .from("prestadores")
                                             .getPublicUrl(filePath);

                                           const novo = [...form.portfolio];
                                           novo[idx].url = publicUrl;
                                           setForm({ ...form, portfolio: novo });
                                           return publicUrl;
                                         })();

                                         toast.promise(promise, {
                                           loading: 'Fazendo upload...',
                                           success: 'Arquivo enviado!',
                                           error: 'Erro no upload',
                                         });
                                       }}
                                     />
                                   </label>
                                 )}
                               </div>
                             </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const novo = form.portfolio.filter((_: any, i: number) => i !== idx);
                              setForm({ ...form, portfolio: novo });
                            }}
                            className="absolute -right-2 -top-2 hidden size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => {
                          setForm({
                            ...form,
                            portfolio: [
                              ...form.portfolio,
                              { id: Math.random().toString(36), titulo: "", tipo: "imagem", url: "" },
                            ],
                          });
                        }}
                      >
                        + Adicionar item ao portfólio
                      </Button>
                    </div>
                  </Secao>

                  <Secao
                    titulo="Time e Perguntas Frequentes"
                    legenda="Aumente sua autoridade mostrando quem faz e tirando dúvidas comuns."
                  >
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-wider">Membros do Time</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setForm({
                                ...form,
                                equipe: [...form.equipe, { nome: "", cargo: "" }],
                              });
                            }}
                          >
                            + Adicionar membro
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {form.equipe.map((membro: any, idx: number) => (
                            <div key={idx} className="group relative rounded-xl border border-border bg-card p-4">
                              <div className="space-y-3">
                                <Input
                                  placeholder="Nome"
                                  value={membro.nome}
                                  onChange={(e) => {
                                    const nova = [...form.equipe];
                                    nova[idx].nome = e.target.value;
                                    setForm({ ...form, equipe: nova });
                                  }}
                                />
                                <Input
                                  placeholder="Cargo / Especialidade"
                                  value={membro.cargo}
                                  onChange={(e) => {
                                    const nova = [...form.equipe];
                                    nova[idx].cargo = e.target.value;
                                    setForm({ ...form, equipe: nova });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nova = form.equipe.filter((_: any, i: number) => i !== idx);
                                  setForm({ ...form, equipe: nova });
                                }}
                                className="absolute -right-2 -top-2 hidden size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-wider">FAQ (Perguntas Comuns)</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setForm({
                                ...form,
                                perguntas_frequentes: [
                                  ...form.perguntas_frequentes,
                                  { pergunta: "", resposta: "" },
                                ],
                              });
                            }}
                          >
                            + Adicionar FAQ
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {form.perguntas_frequentes.map((item: any, idx: number) => (
                            <div key={idx} className="group relative rounded-xl border border-border bg-card p-4">
                              <div className="space-y-3">
                                <Input
                                  placeholder="Pergunta"
                                  value={item.pergunta}
                                  onChange={(e) => {
                                    const nova = [...form.perguntas_frequentes];
                                    nova[idx].pergunta = e.target.value;
                                    setForm({ ...form, perguntas_frequentes: nova });
                                  }}
                                />
                                <Textarea
                                  placeholder="Resposta"
                                  rows={2}
                                  value={item.resposta}
                                  onChange={(e) => {
                                    const nova = [...form.perguntas_frequentes];
                                    nova[idx].resposta = e.target.value;
                                    setForm({ ...form, perguntas_frequentes: nova });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nova = form.perguntas_frequentes.filter((_: any, i: number) => i !== idx);
                                  setForm({ ...form, perguntas_frequentes: nova });
                                }}
                                className="absolute -right-2 -top-2 hidden size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Secao>
                </div>
              )}

              {passo === 4 && (
                <div className="space-y-8">
                  <div className="max-w-sm space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      autoFocus
                      inputMode="numeric"
                      maxLength={18}
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: formatarCnpj(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      className={cn(!cnpjOk && "border-destructive")}
                    />
                    {cnpjLimpo.length === 14 && cnpjOk && (
                      <p className="flex items-center gap-1.5 text-xs text-primary">
                        <Check className="size-3.5" /> CNPJ com dígitos verificadores válidos.
                      </p>
                    )}
                    {!cnpjOk && (
                      <p className="text-xs text-destructive">
                        Este CNPJ não passa na verificação de dígitos. Revise os números.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Por que pedimos o CNPJ</p>
                    <p className="mt-2">
                      É o que permite validar depois que quem avaliou você é um cliente real. Sem
                      ele, seu perfil ainda vai ao ar, mas as avaliações recebidas dependem de
                      convite ou e-mail corporativo para serem marcadas como verificadas.
                    </p>
                  </div>
                </div>
              )}

              {passo === 5 && (
                <>
                  {promoAtiva && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Oferta de lançamento — preço fixo por 12 meses
                      <span className="font-mono tabular-nums">
                        · {vagas}/100 vagas
                      </span>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {(planos ?? []).map((plano) => {
                      const promo = promoAtiva && plano.preco_promocional;
                      const selecionado = planoId === plano.id;
                      return (
                        <button
                          type="button"
                          key={plano.id}
                          onClick={() => setPlanoId(plano.id)}
                          className={cn(
                            "rounded-xl border p-6 text-left transition-colors",
                            selecionado
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">{plano.nome}</h3>
                            {selecionado && <Check className="size-4 text-primary" />}
                          </div>
                          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
                            {promo
                              ? formatarBRL(plano.preco_promocional)
                              : formatarBRL(plano.preco_mensal)}
                            <span className="font-sans text-sm font-normal text-muted-foreground">
                              {Number(plano.preco_mensal) > 0 ? "/mês" : ""}
                            </span>
                          </p>
                          {promo ? (
                            <p className="text-xs text-primary">
                              Preço fixo por 12 meses · depois {formatarBRL(plano.preco_mensal)}/mês
                            </p>
                          ) : (
                            plano.nome === "Enterprise" && (
                              <p className="text-xs text-muted-foreground">a partir de</p>
                            )
                          )}
                          <p className="mt-3 text-sm text-muted-foreground">
                            {PLANO_RESUMO[plano.nome] ?? ""}
                          </p>
                          <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                            {recursosAtivos(plano.recursos as Record<string, unknown>).map((r) => (
                              <li key={r} className="flex items-center gap-2">
                                <Check className="size-3 text-primary" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => irPara(Math.max(0, passo - 1))}
                disabled={passo === 0 || salvar.isPending}
              >
                <ArrowLeft className="size-4" /> Voltar
              </Button>

              <p className="hidden flex-1 text-xs text-muted-foreground sm:block">
                Passo {passo + 1} de {PASSOS.length} · nada é publicado antes do último passo.
              </p>

              {passo < PASSOS.length - 1 ? (
                <Button type="submit" size="lg" className="ml-auto" disabled={!podeAvancar}>
                  Avançar <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className="ml-auto"
                  disabled={!planoId || salvar.isPending}
                >
                  {salvar.isPending ? "Emitindo…" : "Colocar perfil no ar"}
                </Button>
              ) /* Corrigido: Removido ponto de interrupção no CNPJ */ }
            </div>
          </div>
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Prévia da vitrine
          </p>
          <PreviewVitrine
            dados={{
              nome_negocio: form.nome_negocio,
              headline: form.headline,
              descricao: form.descricao,
              categoria_principal: form.categoria_principal,
              faixa_preco: form.faixa_preco,
              cidade: form.cidade,
              estado: form.estado,
              regiao_atendimento: form.regiao_atendimento,
              foto_perfil_url: form.foto_perfil_url,
              modelo_trabalho: form.modelo_trabalho,
              total_clientes_atendidos: form.total_clientes_atendidos,
              subcategorias: form.subcategorias
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            }}
          />
        </aside>
        </div>
      </main>
    </div>
  );
}

/** Momento oficial: o perfil vai ao ar pela primeira vez. Carimbo cerimonial. */
function PerfilNoAr({ slug, onIr }: { slug?: string | null; onIr: () => void }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
        <span className="selo-gold animate-stamp-in inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <ShieldCheck className="size-4" />
          Prestador verificado
        </span>

        <h1 className="mt-8 text-3xl font-semibold">Seu perfil está no ar.</h1>
        <p className="mt-3 text-muted-foreground">
          Sua credencial foi emitida e já aparece na busca da categoria. A partir daqui, avaliações
          verificadas de clientes reais é o que move sua posição.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onIr}>
            Ir para o painel
          </Button>
          {slug && (
            <Button size="lg" variant="outline" asChild>
              <a href={`/pro/${slug}`}>Ver perfil público</a>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
