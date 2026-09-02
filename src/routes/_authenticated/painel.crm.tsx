import { PainelHeader } from "@/components/painel/painel-header";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, Mail, Phone, Clock, ChevronRight } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { categoriaLabel } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel/crm")({
  head: () => ({
    meta: [
      { title: "CRM de contatos | Praxa" },
      { name: "description", content: "Kanban de contatos: do primeiro contato ao negócio fechado." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Crm,
});

type StatusContato = "novo" | "em_conversa" | "proposta_enviada" | "fechado" | "perdido";

const COLUNAS: {
  status: StatusContato;
  label: string;
  descricao: string;
  /** superfície da coluna */
  coluna: string;
  /** tratamento do card */
  card: string;
}[] = [
  {
    status: "novo",
    label: "Novo",
    descricao: "Ainda sem resposta",
    coluna: "bg-muted/25",
    card: "border-border",
  },
  {
    status: "em_conversa",
    label: "Em conversa",
    descricao: "Negociação aberta",
    coluna: "bg-muted/45",
    card: "border-border bg-muted/30",
  },
  {
    status: "proposta_enviada",
    label: "Proposta enviada",
    descricao: "Documento em processo",
    coluna: "bg-muted/25",
    card: "border-border border-l-[3px] border-l-gold",
  },
  {
    status: "fechado",
    label: "Fechado",
    descricao: "Negócio ganho",
    coluna: "bg-muted/25",
    card: "border-border border-l-[3px] border-l-success",
  },
];

type Contato = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  anotacoes: string | null;
  status: StatusContato;
  origem: string;
  valor_estimado: number | null;
  updated_at: string;
  created_at: string;
  demandas: { categoria: string } | null;
};

function desdeUltimoContato(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / 86_400_000);
  if (dias >= 1) return `há ${dias}d`;
  const horas = Math.floor(ms / 3_600_000);
  if (horas >= 1) return `há ${horas}h`;
  const min = Math.max(1, Math.floor(ms / 60_000));
  return `há ${min}min`;
}

function Crm() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const temCrm = Boolean(data?.recursos?.crm);

  const [novo, setNovo] = useState({ nome: "", email: "", telefone: "", observacoes: "" });
  const [formAberto, setFormAberto] = useState(false);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusContato | null>(null);

  const { data: contatos } = useQuery({
    queryKey: ["crm", prestadorId],
    enabled: Boolean(prestadorId) && temCrm,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("crm_contatos")
        .select("*, demandas(categoria)")
        .eq("prestador_id", prestadorId!)
        .order("updated_at", { ascending: false });
      return (rows ?? []) as unknown as Contato[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_contatos").insert({
        prestador_id: prestadorId!,
        nome: novo.nome.trim(),
        email: novo.email.trim() || null,
        telefone: novo.telefone.trim() || null,
        anotacoes: novo.observacoes.trim() || null,
        status: "novo",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNovo({ nome: "", email: "", telefone: "", observacoes: "" });
      setFormAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["crm"] });
      toast.success("Contato adicionado.");
    },
    onError: () => toast.error("Não foi possível adicionar o contato."),
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusContato }) => {
      const { error } = await supabase
        .from("crm_contatos")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: async (status) => {
      await queryClient.invalidateQueries({ queryKey: ["crm"] });
      if (status === "fechado") toast.success("Contato movido para Fechado.");
      else if (status === "perdido") toast("Contato marcado como perdido.");
    },
    onError: () => toast.error("Não foi possível mover o contato."),
  });

  const porStatus = useMemo(() => {
    const mapa = new Map<StatusContato, Contato[]>();
    for (const col of COLUNAS) mapa.set(col.status, []);
    mapa.set("perdido", []);
    for (const c of contatos ?? []) mapa.get(c.status)?.push(c);
    return mapa;
  }, [contatos]);

  function mover(id: string, status: StatusContato, atual: StatusContato) {
    if (status === atual) return;
    atualizarStatus.mutate({ id, status });
  }

  if (!temCrm) {
    return (
      <div className="surface-panel space-y-3 p-8">
        <Lock className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">CRM disponível no plano Profissional</h1>
        <p className="text-sm text-muted-foreground">
          Faça upgrade para organizar contatos e demandas recebidas por status.
        </p>
      </div>
    );
  }

  const perdidos = porStatus.get("perdido") ?? [];

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Operação"
        titulo="CRM"
        descricao="Arraste os cards entre as colunas para atualizar o status."
        acoes={
          <Button
            variant={formAberto ? "outline" : "default"}
            onClick={() => setFormAberto((v) => !v)}
          >
            <Plus className="size-4" />
            {formAberto ? "Cancelar" : "Novo contato"}
          </Button>
        }
      />

      {formAberto && (
        <form
          className="surface-panel grid gap-4 p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              required
              maxLength={120}
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              maxLength={255}
              value={novo.email}
              onChange={(e) => setNovo({ ...novo, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              maxLength={30}
              value={novo.telefone}
              onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={3}
              maxLength={1000}
              value={novo.observacoes}
              onChange={(e) => setNovo({ ...novo, observacoes: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={criar.isPending}>
            Adicionar contato
          </Button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUNAS.map((col) => {
          const itens = porStatus.get(col.status) ?? [];
          const ativo = colunaAlvo === col.status;
          return (
            <section
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(col.status);
              }}
              onDragLeave={() => setColunaAlvo((s) => (s === col.status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setColunaAlvo(null);
                const id = e.dataTransfer.getData("text/plain") || arrastando;
                const atual = (contatos ?? []).find((c) => c.id === id)?.status;
                if (id && atual) mover(id, col.status, atual);
              }}
              className={cn(
                "flex min-h-[16rem] flex-col rounded-xl border border-border/70 p-3 transition-colors",
                col.coluna,
                ativo && "border-dashed border-primary/60 bg-primary/5",
              )}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <div>
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <p className="text-[11px] text-muted-foreground">{col.descricao}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{itens.length}</span>
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {itens.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum contato
                  </p>
                )}
                {itens.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastando(c.id);
                    }}
                    onDragEnd={() => setArrastando(null)}
                    className={cn(
                      "group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all active:cursor-grabbing",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      col.card,
                      arrastando === c.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium">{c.nome}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Mover contato"
                            className="rounded p-0.5 text-muted-foreground opacity-60 transition hover:bg-muted hover:opacity-100"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {COLUNAS.filter((d) => d.status !== c.status).map((d) => (
                            <DropdownMenuItem
                              key={d.status}
                              onSelect={() => mover(c.id, d.status, c.status)}
                            >
                              Mover para {d.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onSelect={() => mover(c.id, "perdido", c.status)}>
                            Marcar como perdido
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.demandas?.categoria && (
                        <span className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {categoriaLabel(c.demandas.categoria)}
                        </span>
                      )}
                      {c.origem && (
                        <span className="rounded border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {c.origem === "pool" ? "Pool" : "Direto"}
                        </span>
                      )}
                    </div>

                    {(c.email || c.telefone) && (
                      <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        {c.email ? <Mail className="size-3 shrink-0" /> : <Phone className="size-3 shrink-0" />}
                        <span className="truncate">{c.email ?? c.telefone}</span>
                      </p>
                    )}

                    <footer className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {desdeUltimoContato(c.updated_at)}
                      </span>
                      {c.valor_estimado != null && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          R$ {Number(c.valor_estimado).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </footer>
                  </article>
                ))}
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
                <span className="truncate text-muted-foreground line-through">{c.nome}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => mover(c.id, "novo", "perdido")}
                >
                  Reabrir
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
