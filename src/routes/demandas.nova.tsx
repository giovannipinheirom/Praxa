import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS, categoriaLabel } from "@/lib/marketplace";
import { registrarDemanda } from "@/lib/marketplace.functions";
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

const TOTAL_PASSOS = 4;

export const Route = createFileRoute("/demandas/nova")({
  validateSearch: (search: Record<string, unknown>) => ({
    categoria: typeof search.categoria === "string" ? search.categoria : "",
    regiao: typeof search.regiao === "string" ? search.regiao : "",
  }),
  head: () => ({
    meta: [
      { title: "Preciso de um serviço | Praxa" },
      {
        name: "description",
        content:
          "Conte em poucos passos o que sua empresa precisa e receba contato de prestadores verificados da sua categoria e região. Sem login obrigatório.",
      },
      { property: "og:title", content: "Preciso de um serviço | Praxa" },
      {
        property: "og:description",
        content: "Registre sua demanda em menos de um minuto e receba propostas de verificados.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/demandas/nova" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/demandas/nova" }],
  }),
  component: NovaDemanda,
});

function NovaDemanda() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const enviar = useServerFn(registrarDemanda);

  const categoriaInicial = CATEGORIAS.some((c) => c.slug === search.categoria)
    ? search.categoria
    : "";

  const [passo, setPasso] = useState(1);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  const [enviada, setEnviada] = useState(false);

  const [categoria, setCategoria] = useState(categoriaInicial);
  const [regiao, setRegiao] = useState(search.regiao.replace(/-/g, " "));
  const [descricao, setDescricao] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [email, setEmail] = useState("");
  const [semConta, setSemConta] = useState(true);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const completo: Record<number, boolean> = {
    1: categoria !== "",
    2: regiao.trim().length >= 2,
    3: descricao.trim().length >= 20,
    4: emailValido,
  };

  const mutation = useMutation({
    mutationFn: () =>
      enviar({
        data: {
          categoria: categoria as never,
          regiao: regiao.trim(),
          descricao_necessidade: descricao.trim(),
          orcamento_estimado: orcamento ? Number(orcamento) : null,
          contato_email: email.trim(),
        },
      }),
    onSuccess: () => {
      if (!semConta) {
        navigate({ to: "/auth", search: { modo: "entrar" } });
      } else {
        setEnviada(true);
      }
    },
    onError: () => toast.error("Não foi possível registrar sua demanda. Tente novamente."),
  });

  function avancar() {
    if (!completo[passo]) return;
    if (passo === TOTAL_PASSOS) {
      mutation.mutate();
      return;
    }
    setDirecao("frente");
    setPasso((p) => p + 1);
  }

  function voltar() {
    setDirecao("tras");
    setPasso((p) => Math.max(1, p - 1));
  }

  if (enviada) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-20">
          <div className="surface-panel animate-in fade-in space-y-5 p-10 text-center duration-300">
            <CheckCircle2 className="mx-auto size-9 text-primary" />
            <h1 className="font-display text-2xl font-semibold">Sua demanda foi registrada</h1>
            <p className="mx-auto max-w-md text-muted-foreground">
              Prestadores verificados da categoria escolhida podem entrar em contato. Você recebe as
              respostas em <strong className="text-foreground">{email.trim()}</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild variant="outline">
                <Link to="/buscar/$categoria/$regiao" params={{ categoria, regiao: "todos" }} search={{ tipo: undefined }}>
                  Ver prestadores de {categoriaLabel(categoria).toLowerCase()}
                </Link>
              </Button>
              <Button onClick={() => navigate({ to: "/auth" })}>
                Criar conta para acompanhar
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const animacao =
    direcao === "frente"
      ? "animate-in fade-in slide-in-from-right-8 duration-300"
      : "animate-in fade-in slide-in-from-left-8 duration-300";

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-14">
        {/* Barra de progresso fina */}
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASSOS}
          aria-valuenow={passo}
          aria-label="Progresso do pedido"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${(passo / TOTAL_PASSOS) * 100}%` }}
          />
        </div>

        <div className="mt-10 overflow-hidden">
          <div key={passo} className={animacao}>
            {passo === 1 && (
              <section>
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                  Do que sua empresa precisa?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Escolha a área. Dá para detalhar melhor no próximo passo.
                </p>

                <div className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {CATEGORIAS.map((c) => {
                    const ativo = categoria === c.slug;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          setCategoria(c.slug);
                          setDirecao("frente");
                          setPasso(2);
                        }}
                        aria-pressed={ativo}
                        className={cn(
                          "surface-panel flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
                          ativo && "ring-2 ring-primary",
                        )}
                      >
                        <img
                          src={ILUSTRACAO_CATEGORIA[c.slug] ?? catOutros}
                          alt=""
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{c.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {c.desc}
                          </span>
                        </span>
                        {ativo && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {passo === 2 && (
              <section>
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                  Onde você precisa de atendimento?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Cidade e estado, ou remoto se tanto faz onde o prestador está.
                </p>

                <div className="mt-8 space-y-4">
                  <Label htmlFor="regiao" className="sr-only">
                    Região
                  </Label>
                  <Input
                    id="regiao"
                    autoFocus
                    maxLength={120}
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && avancar()}
                    placeholder="Ex.: Campinas, SP"
                    className="h-12 text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {REGIOES_RAPIDAS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegiao(r)}
                        className={cn(
                          "rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                          regiao === r && "border-primary/60 bg-accent text-accent-foreground",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {passo === 3 && (
              <section>
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                  Conte o que precisa ser feito
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Quanto mais concreto, melhores as propostas que você recebe.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <Textarea
                      id="descricao"
                      autoFocus
                      rows={6}
                      maxLength={2000}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Ex.: Precisamos migrar a contabilidade de uma empresa de serviços com 18 funcionários, incluindo folha e obrigações acessórias."
                      className="text-base"
                    />
                    <p
                      className={cn(
                        "text-xs transition-colors",
                        completo[3] ? "text-muted-foreground" : "text-primary",
                      )}
                    >
                      {completo[3]
                        ? `${descricao.length}/2000 caracteres`
                        : `Faltam ${20 - descricao.trim().length} caracteres para avançar`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orcamento">Orçamento estimado (opcional)</Label>
                    <Input
                      id="orcamento"
                      type="number"
                      min={0}
                      step="100"
                      value={orcamento}
                      onChange={(e) => setOrcamento(e.target.value)}
                      placeholder="R$ 2.500"
                      className="h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ajuda a filtrar propostas fora da sua realidade. Pode deixar em branco.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {passo === 4 && (
              <section>
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                  Para onde enviamos as respostas?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Só o e-mail. Criar conta é opcional — e nunca cobramos de quem contrata.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de contato</Label>
                    <Input
                      id="email"
                      type="email"
                      autoFocus
                      maxLength={160}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && avancar()}
                      placeholder="voce@suaempresa.com.br"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    {[
                      { valor: true, titulo: "Continuar sem criar conta", desc: "Você recebe as propostas por e-mail. Leva 0 passos a mais." },
                      { valor: false, titulo: "Criar conta depois de enviar", desc: "Acompanhe respostas e histórico em um painel." },
                    ].map((opcao) => (
                      <button
                        key={String(opcao.valor)}
                        type="button"
                        onClick={() => setSemConta(opcao.valor)}
                        aria-pressed={semConta === opcao.valor}
                        className={cn(
                          "surface-panel flex w-full items-start gap-3 p-4 text-left transition-all",
                          semConta === opcao.valor
                            ? "ring-2 ring-primary"
                            : "hover:border-primary/40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                            semConta === opcao.valor
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {semConta === opcao.valor && <Check className="size-2.5" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{opcao.titulo}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {opcao.desc}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Navegação */}
        <div className="mt-10 flex items-center gap-4">
          {passo > 1 && (
            <Button type="button" variant="ghost" onClick={voltar}>
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {!completo[passo] && (
              <span className="text-xs text-muted-foreground">
                {passo === 1 && "Escolha uma categoria"}
                {passo === 2 && "Informe a região"}
                {passo === 3 && "Descreva a necessidade"}
                {passo === 4 && "Informe um e-mail válido"}
              </span>
            )}
            <Button
              type="button"
              onClick={avancar}
              disabled={!completo[passo] || mutation.isPending}
              className={cn(
                "flex-1 sm:flex-none transition-opacity",
                !completo[passo] && "opacity-45 saturate-50",
              )}
            >
              {passo === TOTAL_PASSOS
                ? mutation.isPending
                  ? "Enviando..."
                  : "Enviar demanda"
                : "Avançar"}
              {passo < TOTAL_PASSOS && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
