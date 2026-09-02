import { PainelHeader } from "@/components/painel/painel-header";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { formatarBRL } from "@/lib/planos";

export const Route = createFileRoute("/_authenticated/painel/propostas")({
  head: () => ({
    meta: [
      { title: "Gerador de propostas | Praxa" },
      { name: "description", content: "Monte propostas e contratos com preview de documento em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Propostas,
});

const ESCOPO_PADRAO = `Diagnóstico inicial e levantamento de necessidades.
Execução das entregas acordadas, com pontos de revisão.
Relatório final e passagem de conhecimento.`;

const CONDICOES_PADRAO = `Pagamento em até 5 dias úteis após o aceite.
Alterações fora do escopo serão orçadas à parte.
Sigilo sobre todas as informações trocadas durante o projeto.`;

function linhas(texto: string) {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function Propostas() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const prestador = data?.prestador;

  const [form, setForm] = useState({
    titulo: "",
    cliente_nome: "",
    escopo: ESCOPO_PADRAO,
    prazo_dias: "30",
    valor: "",
    condicoes: CONDICOES_PADRAO,
    validade_dias: "15",
  });

  const { data: propostas } = useQuery({
    queryKey: ["propostas", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("propostas_prestador")
        .select("id, titulo, cliente_nome, valor, status, created_at")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false })
        .limit(8);
      return rows ?? [];
    },
  });

  const salvar = useMutation({
    mutationFn: async (status: "rascunho" | "enviada") => {
      const { error } = await supabase.from("propostas_prestador").insert({
        prestador_id: prestadorId!,
        titulo: form.titulo.trim() || "Proposta de serviço",
        cliente_nome: form.cliente_nome.trim(),
        escopo: form.escopo.trim(),
        valor: form.valor ? Number(form.valor) : null,
        prazo_dias: form.prazo_dias ? Number(form.prazo_dias) : null,
        condicoes: form.condicoes.trim() || null,
        validade_dias: Number(form.validade_dias || 15),
        status,
      });
      if (error) throw error;
      return status;
    },
    onSuccess: async (status) => {
      await queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast.success(status === "enviada" ? "Proposta registrada como enviada." : "Rascunho salvo.");
    },
    onError: () => toast.error("Não foi possível salvar a proposta."),
  });

  const hoje = useMemo(
    () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    [],
  );

  const numero = useMemo(
    () => `PRX-${new Date().getFullYear()}-${String(((propostas?.length ?? 0) + 1)).padStart(3, "0")}`,
    [propostas],
  );

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Operação"
        titulo="Proposta / contrato"
        descricao="Preencha à esquerda; o documento à direita é o que o cliente recebe."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="surface-panel flex max-h-[calc(100vh-9rem)] flex-col xl:sticky xl:top-6">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do documento</Label>
              <Input
                id="titulo"
                maxLength={140}
                placeholder="Proposta de consultoria contábil"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                maxLength={140}
                placeholder="Nome da empresa"
                value={form.cliente_nome}
                onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escopo">Escopo — uma entrega por linha</Label>
              <Textarea
                id="escopo"
                rows={7}
                maxLength={3000}
                value={form.escopo}
                onChange={(e) => setForm({ ...form, escopo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo (dias)</Label>
                <Input
                  id="prazo"
                  type="number"
                  min={1}
                  value={form.prazo_dias}
                  onChange={(e) => setForm({ ...form, prazo_dias: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condicoes">Condições — uma por linha</Label>
              <Textarea
                id="condicoes"
                rows={6}
                maxLength={3000}
                value={form.condicoes}
                onChange={(e) => setForm({ ...form, condicoes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validade">Validade da proposta (dias)</Label>
              <Input
                id="validade"
                type="number"
                min={1}
                value={form.validade_dias}
                onChange={(e) => setForm({ ...form, validade_dias: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card p-4">
            <Button
              className="selo-gold flex-1 hover:brightness-105"
              onClick={() => {
                salvar.mutate("enviada");
                setTimeout(() => window.print(), 300);
              }}
              disabled={salvar.isPending || !form.cliente_nome.trim()}
            >
              <FileDown className="size-4" />
              Gerar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => salvar.mutate("rascunho")}
              disabled={salvar.isPending || !form.cliente_nome.trim()}
            >
              <Save className="size-4" />
              Rascunho
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="min-w-0">
          <div
            id="documento-proposta"
            className="folha-papel mx-auto max-w-[52rem] rounded-sm px-10 py-14 sm:px-16 sm:py-20"
          >
            <header className="flex items-start justify-between gap-6 border-b border-current/15 pb-6">
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">
                  {prestador?.nome_negocio ?? "Seu negócio"}
                </p>
                {prestador?.cnpj && (
                  <p className="mt-0.5 font-mono text-[11px] opacity-60">CNPJ {prestador.cnpj}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">{numero}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-60">{hoje}</p>
              </div>
            </header>

            <h2 className="font-display mt-12 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {form.titulo.trim() || "Proposta de serviço"}
            </h2>
            <p className="mt-3 text-sm opacity-70">
              Preparada para{" "}
              <span className="font-medium opacity-100">
                {form.cliente_nome.trim() || "—"}
              </span>
            </p>

            <section className="mt-12">
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
                Escopo
              </h3>
              <ol className="mt-4 space-y-3">
                {linhas(form.escopo).map((l, i) => (
                  <li key={i} className="flex gap-4 text-[15px] leading-relaxed">
                    <span className="font-mono text-xs opacity-45">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
                {linhas(form.escopo).length === 0 && (
                  <li className="text-[15px] italic opacity-40">Descreva as entregas incluídas.</li>
                )}
              </ol>
            </section>

            <section className="mt-12 grid gap-6 border-y border-current/15 py-6 sm:grid-cols-3">
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.18em] opacity-55">
                  Investimento
                </p>
                <p className="mt-1 font-mono text-2xl">
                  {form.valor ? formatarBRL(Number(form.valor)) : "—"}
                </p>
              </div>
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.18em] opacity-55">
                  Prazo
                </p>
                <p className="mt-1 font-mono text-2xl">
                  {form.prazo_dias ? `${form.prazo_dias} dias` : "—"}
                </p>
              </div>
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.18em] opacity-55">
                  Validade
                </p>
                <p className="mt-1 font-mono text-2xl">{form.validade_dias || "—"} dias</p>
              </div>
            </section>

            <section className="mt-10">
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
                Condições
              </h3>
              <ul className="mt-4 space-y-2.5">
                {linhas(form.condicoes).map((l, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-current opacity-40" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </section>

            <footer className="mt-20 grid gap-10 sm:grid-cols-2">
              {[prestador?.nome_negocio ?? "Prestador", form.cliente_nome.trim() || "Cliente"].map(
                (nome, i) => (
                  <div key={i}>
                    <div className="h-10 border-b border-current/30" />
                    <p className="mt-2 text-xs opacity-60">{nome}</p>
                  </div>
                ),
              )}
            </footer>
          </div>
        </div>
      </div>

      {(propostas ?? []).length > 0 && (
        <section className="surface-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            Propostas recentes
          </h2>
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {(propostas ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  {p.titulo} <span className="text-muted-foreground">· {p.cliente_nome}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatarBRL(p.valor)}
                  </span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[11px] capitalize text-muted-foreground">
                    {p.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
