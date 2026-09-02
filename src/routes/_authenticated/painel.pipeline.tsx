import { PainelHeader } from "@/components/painel/painel-header";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  Phone,
  Plus,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { categoriaLabel } from "@/lib/marketplace";
import {
  acaoAtrasada,
  ESTAGIOS,
  moeda,
  tempoRelativo,
  usePipeline,
  type ContatoPipeline,
  type EstagioPipeline,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline comercial | Praxa" },
      {
        name: "description",
        content:
          "Funil único do prestador: lead, qualificação, proposta e contrato, com receita, ticket médio e conversão.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pipeline,
});

function Indicador({
  label,
  valor,
  nota,
  destaque,
}: {
  label: string;
  valor: string;
  nota?: string;
  destaque?: "positivo" | "alerta";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate font-mono text-xl leading-none font-semibold tabular-nums",
          destaque === "positivo" && "text-success",
          destaque === "alerta" && "text-destructive",
        )}
      >
        {valor}
      </p>
      {nota && <p className="mt-1 truncate text-[11px] text-muted-foreground">{nota}</p>}
    </div>
  );
}

function Pipeline() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const temCrm = Boolean(data?.recursos?.crm);
  const mensalidade = Number(data?.assinatura?.preco_pago ?? data?.plano?.preco_mensal ?? 0);

  const { contatos, resumo } = usePipeline(prestadorId, temCrm);

  const [formAberto, setFormAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", telefone: "", valor: "" });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<EstagioPipeline | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const invalidar = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pipeline-contatos"] });
    await queryClient.invalidateQueries({ queryKey: ["pipeline-resumo"] });
    await queryClient.invalidateQueries({ queryKey: ["crm"] });
  };

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_contatos").insert({
        prestador_id: prestadorId!,
        nome: novo.nome.trim(),
        email: novo.email.trim() || null,
        telefone: novo.telefone.trim() || null,
        valor_estimado: novo.valor ? Number(novo.valor) : null,
        status: "novo",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNovo({ nome: "", email: "", telefone: "", valor: "" });
      setFormAberto(false);
      await invalidar();
      toast.success("Negócio adicionado ao funil.");
    },
    onError: () => toast.error("Não foi possível adicionar o negócio."),
  });

  const atualizar = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, string | number | null>;
    }) => {
      const { error } = await supabase
        .from("crm_contatos")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: () => toast.error("Não foi possível salvar a alteração."),
  });

  const porEstagio = useMemo(() => {
    const mapa = new Map<EstagioPipeline, ContatoPipeline[]>();
    for (const e of ESTAGIOS) mapa.set(e.status, []);
    mapa.set("perdido", []);
    for (const c of contatos) mapa.get(c.status)?.push(c);
    return mapa;
  }, [contatos]);

  const contatoAberto = contatos.find((c) => c.id === selecionado) ?? null;

  const decididos = resumo.negocios_ganhos + resumo.negocios_perdidos;
  const conversao = decididos ? Math.round((resumo.negocios_ganhos / decididos) * 100) : null;
  const custoPorLead = mensalidade > 0 && resumo.novos_mes > 0 ? mensalidade / resumo.novos_mes : null;

  if (!temCrm) {
    return (
      <div className="surface-panel space-y-3 p-8">
        <Lock className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Pipeline disponível no plano Profissional</h1>
        <p className="text-sm text-muted-foreground">
          Faça upgrade para acompanhar leads, propostas e receita fechada em um funil único.
        </p>
      </div>
    );
  }

  const perdidos = porEstagio.get("perdido") ?? [];
  const totalFunil = ESTAGIOS.reduce((t, e) => t + (porEstagio.get(e.status)?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Operação"
        titulo="Pipeline"
        descricao="Do lead ao contrato, com o valor de cada estágio."
        acoes={
          <Button
            variant={formAberto ? "outline" : "default"}
            className="shrink-0"
            onClick={() => setFormAberto((v) => !v)}
          >
            <Plus className="size-4" />
            {formAberto ? "Cancelar" : "Novo negócio"}
          </Button>
        }
      />

      {/* Régua de receita */}
      <section className="surface-float grid grid-cols-2 gap-x-6 gap-y-5 p-6 sm:grid-cols-4 lg:grid-cols-7">
        <Indicador
          label="Ganho no mês"
          valor={moeda(resumo.ganho_mes, true)}
          nota={`${resumo.negocios_ganhos} fechados no total`}
          destaque={resumo.ganho_mes > 0 ? "positivo" : undefined}
        />
        <Indicador label="Receita total" valor={moeda(resumo.ganho_total, true)} nota="via Praxa" />
        <Indicador
          label="Ticket médio"
          valor={resumo.ticket_medio ? moeda(resumo.ticket_medio, true) : "—"}
          nota={resumo.ticket_medio ? "por contrato" : "sem contrato fechado"}
        />
        <Indicador
          label="Conversão"
          valor={conversao === null ? "—" : `${conversao}%`}
          nota={decididos ? `${resumo.negocios_ganhos}/${decididos} decididos` : "sem histórico"}
        />
        <Indicador
          label="Ciclo médio"
          valor={resumo.ciclo_medio_dias ? `${Math.round(resumo.ciclo_medio_dias)}d` : "—"}
          nota="lead até contrato"
        />
        <Indicador
          label="Custo por lead"
          valor={custoPorLead === null ? "—" : moeda(custoPorLead)}
          nota={
            custoPorLead === null
              ? "plano grátis ou sem leads"
              : `${resumo.novos_mes} leads no mês`
          }
        />
        <Indicador
          label="Previsão"
          valor={moeda(resumo.previsao_ponderada, true)}
          nota={`${moeda(resumo.valor_aberto, true)} em aberto`}
        />
      </section>

      {resumo.atrasados > 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {resumo.atrasados} {resumo.atrasados === 1 ? "negócio está" : "negócios estão"} com a
          próxima ação vencida.
        </p>
      )}

      {formAberto && (
        <form
          className="surface-panel grid gap-4 p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="p-nome">Nome do cliente</Label>
            <Input
              id="p-nome"
              required
              maxLength={120}
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-valor">Valor estimado (R$)</Label>
            <Input
              id="p-valor"
              type="number"
              min={0}
              value={novo.valor}
              onChange={(e) => setNovo({ ...novo, valor: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">E-mail</Label>
            <Input
              id="p-email"
              type="email"
              maxLength={255}
              value={novo.email}
              onChange={(e) => setNovo({ ...novo, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-tel">Telefone</Label>
            <Input
              id="p-tel"
              maxLength={30}
              value={novo.telefone}
              onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={criar.isPending}>
            Adicionar ao funil
          </Button>
        </form>
      )}

      {/* Funil */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ESTAGIOS.map((estagio) => {
          const itens = porEstagio.get(estagio.status) ?? [];
          const valor = itens.reduce(
            (t, c) => t + Number(c.valor_fechado ?? c.valor_estimado ?? 0),
            0,
          );
          const alvo = colunaAlvo === estagio.status;
          return (
            <section
              key={estagio.status}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(estagio.status);
              }}
              onDragLeave={() =>
                setColunaAlvo((s) => (s === estagio.status ? null : s))
              }
              onDrop={(e) => {
                e.preventDefault();
                setColunaAlvo(null);
                const id = e.dataTransfer.getData("text/plain") || arrastando;
                const atual = contatos.find((c) => c.id === id)?.status;
                if (id && atual && atual !== estagio.status) {
                  atualizar.mutate({ id, patch: { status: estagio.status } });
                }
              }}
              className={cn(
                "flex min-h-[18rem] flex-col rounded-xl border border-border/70 bg-muted/25 p-3 transition-colors",
                alvo && "border-dashed border-primary/60 bg-primary/5",
              )}
            >
              <span className={cn("mb-3 h-[3px] w-full rounded-full", estagio.trilho)} />
              <header className="mb-3 flex items-start justify-between gap-2 px-1">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{estagio.label}</h2>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {estagio.descricao}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs font-semibold tabular-nums">
                    {moeda(valor, true)}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {itens.length}
                    {totalFunil > 0 && ` · ${Math.round((itens.length / totalFunil) * 100)}%`}
                  </p>
                </div>
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {itens.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum negócio
                  </p>
                )}
                {itens.map((c) => {
                  const atrasado = acaoAtrasada(c);
                  return (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setArrastando(c.id);
                      }}
                      onDragEnd={() => setArrastando(null)}
                      onClick={() => setSelecionado(c.id)}
                      className={cn(
                        "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                        atrasado && "border-destructive/40",
                        arrastando === c.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium">{c.nome}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Mover negócio"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded p-0.5 text-muted-foreground opacity-60 transition hover:bg-muted hover:opacity-100"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ESTAGIOS.filter((d) => d.status !== c.status).map((d) => (
                              <DropdownMenuItem
                                key={d.status}
                                onSelect={() =>
                                  atualizar.mutate({ id: c.id, patch: { status: d.status } })
                                }
                              >
                                Mover para {d.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              onSelect={() =>
                                atualizar.mutate({ id: c.id, patch: { status: "perdido" } })
                              }
                            >
                              Marcar como perdido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between gap-2">
                        <span className="font-mono text-sm font-semibold tabular-nums">
                          {c.valor_fechado ?? c.valor_estimado
                            ? moeda(Number(c.valor_fechado ?? c.valor_estimado))
                            : "sem valor"}
                        </span>
                        {c.status !== "fechado" && c.status !== "perdido" && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {c.probabilidade}%
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {c.demandas?.categoria && (
                          <span className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {categoriaLabel(c.demandas.categoria)}
                          </span>
                        )}
                        <span className="rounded border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {c.origem === "pool" ? "Pool" : "Direto"}
                        </span>
                      </div>

                      {(c.email || c.telefone) && (
                        <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                          {c.email ? (
                            <Mail className="size-3 shrink-0" />
                          ) : (
                            <Phone className="size-3 shrink-0" />
                          )}
                          <span className="truncate">{c.email ?? c.telefone}</span>
                        </p>
                      )}

                      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <Clock className="size-3" />
                          {tempoRelativo(c.updated_at)}
                        </span>
                        {c.proxima_acao && (
                          <span
                            className={cn(
                              "flex min-w-0 items-center gap-1 text-[11px]",
                              atrasado ? "text-destructive" : "text-muted-foreground",
                            )}
                          >
                            <Target className="size-3 shrink-0" />
                            <span className="truncate">{c.proxima_acao}</span>
                          </span>
                        )}
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {perdidos.length > 0 && (
        <section className="surface-panel p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Perdidos <span className="font-mono">({perdidos.length})</span>
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {perdidos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground line-through">
                  {c.nome}
                  {c.motivo_perda && (
                    <span className="ml-2 no-underline">· {c.motivo_perda}</span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => atualizar.mutate({ id: c.id, patch: { status: "novo" } })}
                >
                  Reabrir
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DetalheNegocio
        contato={contatoAberto}
        onFechar={() => setSelecionado(null)}
        onSalvar={(patch) => {
          if (contatoAberto) atualizar.mutate({ id: contatoAberto.id, patch });
          setSelecionado(null);
          toast.success("Negócio atualizado.");
        }}
      />
    </div>
  );
}

function DetalheNegocio({
  contato,
  onFechar,
  onSalvar,
}: {
  contato: ContatoPipeline | null;
  onFechar: () => void;
  onSalvar: (patch: Record<string, string | number | null>) => void;
}) {
  if (!contato) return null;
  return (
    <Sheet open onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="truncate">{contato.nome}</SheetTitle>
          <SheetDescription>
            Atualize valor, probabilidade e a próxima ação deste negócio.
          </SheetDescription>
        </SheetHeader>
        <FormularioNegocio contato={contato} onSalvar={onSalvar} />
      </SheetContent>
    </Sheet>
  );
}

function FormularioNegocio({
  contato,
  onSalvar,
}: {
  contato: ContatoPipeline;
  onSalvar: (patch: Record<string, string | number | null>) => void;
}) {
  const fechado = contato.status === "fechado";
  const perdido = contato.status === "perdido";
  const [valor, setValor] = useState(
    String(contato.valor_fechado ?? contato.valor_estimado ?? ""),
  );
  const [probabilidade, setProbabilidade] = useState(String(contato.probabilidade));
  const [acao, setAcao] = useState(contato.proxima_acao ?? "");
  const [acaoEm, setAcaoEm] = useState(contato.proxima_acao_em?.slice(0, 10) ?? "");
  const [motivo, setMotivo] = useState(contato.motivo_perda ?? "");
  const [anotacoes, setAnotacoes] = useState(contato.anotacoes ?? "");

  return (
    <form
      className="space-y-4 px-4 pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar({
          [fechado ? "valor_fechado" : "valor_estimado"]: valor ? Number(valor) : null,
          probabilidade: Number(probabilidade),
          proxima_acao: acao.trim() || null,
          proxima_acao_em: acaoEm ? new Date(`${acaoEm}T09:00:00`).toISOString() : null,
          motivo_perda: perdido ? motivo.trim() || null : null,
          anotacoes: anotacoes.trim() || null,
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="d-valor">{fechado ? "Valor fechado (R$)" : "Valor estimado (R$)"}</Label>
        <Input
          id="d-valor"
          type="number"
          min={0}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>

      {!fechado && !perdido && (
        <div className="space-y-2">
          <Label htmlFor="d-prob">Probabilidade (%)</Label>
          <Input
            id="d-prob"
            type="number"
            min={0}
            max={100}
            value={probabilidade}
            onChange={(e) => setProbabilidade(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Usada na previsão ponderada do funil.
          </p>
        </div>
      )}

      {!fechado && !perdido && (
        <>
          <div className="space-y-2">
            <Label htmlFor="d-acao">Próxima ação</Label>
            <Input
              id="d-acao"
              maxLength={120}
              placeholder="Ex.: enviar proposta revisada"
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-acao-em">Data da próxima ação</Label>
            <Input
              id="d-acao-em"
              type="date"
              value={acaoEm}
              onChange={(e) => setAcaoEm(e.target.value)}
            />
          </div>
        </>
      )}

      {perdido && (
        <div className="space-y-2">
          <Label htmlFor="d-motivo">Motivo da perda</Label>
          <Input
            id="d-motivo"
            maxLength={160}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="d-obs">Anotações</Label>
        <Textarea
          id="d-obs"
          rows={4}
          maxLength={1000}
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        Salvar negócio
      </Button>
    </form>
  );
}