import { PainelHeader } from "@/components/painel/painel-header";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, ChevronLeft, ChevronRight, Trash2, MapPin, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Praxa" },
      { name: "description", content: "Calendário de reuniões agendadas com seus clientes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Agenda,
});

type Compromisso = {
  id: string;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  local: string | null;
  link_reuniao: string | null;
  contato_id: string | null;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HORA_INICIO = 7;
const HORA_FIM = 21;

function inicioDaSemana(d: Date) {
  const base = new Date(d);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay());
  return base;
}

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function paraInputLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Agenda() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const temAgenda = Boolean(data?.recursos?.agenda);

  const [modo, setModo] = useState<"semana" | "mes">("semana");
  const [ancora, setAncora] = useState(() => new Date());
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<Compromisso | null>(null);

  const vazio = {
    titulo: "",
    inicio: "",
    duracao: "60",
    contato_id: "",
    local: "",
    notas: "",
  };
  const [form, setForm] = useState(vazio);

  const { inicioIntervalo, fimIntervalo, diasSemana, celulasMes } = useMemo(() => {
    if (modo === "semana") {
      const ini = inicioDaSemana(ancora);
      const dias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ini);
        d.setDate(ini.getDate() + i);
        return d;
      });
      const fim = new Date(ini);
      fim.setDate(ini.getDate() + 7);
      return { inicioIntervalo: ini, fimIntervalo: fim, diasSemana: dias, celulasMes: [] as Date[] };
    }
    const primeiro = new Date(ancora.getFullYear(), ancora.getMonth(), 1);
    const ini = inicioDaSemana(primeiro);
    const celulas = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(ini);
      d.setDate(ini.getDate() + i);
      return d;
    });
    const fim = new Date(celulas[41]);
    fim.setDate(fim.getDate() + 1);
    return { inicioIntervalo: ini, fimIntervalo: fim, diasSemana: [], celulasMes: celulas };
  }, [ancora, modo]);

  const { data: compromissos } = useQuery({
    queryKey: ["compromissos", prestadorId, inicioIntervalo.toISOString(), fimIntervalo.toISOString()],
    enabled: Boolean(prestadorId) && temAgenda,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("compromissos")
        .select("id, titulo, descricao, inicio, fim, local, link_reuniao, contato_id")
        .eq("prestador_id", prestadorId!)
        .gte("inicio", inicioIntervalo.toISOString())
        .lt("inicio", fimIntervalo.toISOString())
        .order("inicio", { ascending: true });
      return (rows ?? []) as Compromisso[];
    },
  });

  const { data: contatos } = useQuery({
    queryKey: ["crm-lista", prestadorId],
    enabled: Boolean(prestadorId) && temAgenda,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("crm_contatos")
        .select("id, nome")
        .eq("prestador_id", prestadorId!)
        .order("nome");
      return rows ?? [];
    },
  });

  const nomeContato = (id: string | null) =>
    contatos?.find((c) => c.id === id)?.nome ?? null;

  const criar = useMutation({
    mutationFn: async () => {
      const inicio = new Date(form.inicio);
      const fim = new Date(inicio.getTime() + Number(form.duracao || 60) * 60_000);
      const { error } = await supabase.from("compromissos").insert({
        prestador_id: prestadorId!,
        titulo: form.titulo.trim(),
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        contato_id: form.contato_id || null,
        local: form.local.trim() || null,
        descricao: form.notas.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setForm(vazio);
      setAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      toast.success("Reunião agendada.");
    },
    onError: () => toast.error("Não foi possível agendar a reunião."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compromissos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setDetalhe(null);
      await queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      toast.success("Reunião removida.");
    },
  });

  function abrirNova(dataSugerida?: Date) {
    const base = dataSugerida ?? new Date();
    if (!dataSugerida) base.setMinutes(0, 0, 0);
    setForm({ ...vazio, inicio: paraInputLocal(base) });
    setAberto(true);
  }

  function navegar(dir: -1 | 1) {
    const d = new Date(ancora);
    if (modo === "semana") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setAncora(d);
  }

  if (!temAgenda) {
    return (
      <div className="surface-panel space-y-3 p-8">
        <Lock className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Agenda disponível no plano Profissional</h1>
        <p className="text-sm text-muted-foreground">
          Faça upgrade para organizar reuniões e compromissos com seus clientes.
        </p>
      </div>
    );
  }

  const hoje = new Date();
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);
  const rotuloPeriodo =
    modo === "semana"
      ? `${inicioIntervalo.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${new Date(
          inicioIntervalo.getTime() + 6 * 86_400_000,
        ).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
      : ancora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <PainelHeader
        eyebrow="Operação"
        titulo="Agenda"
        descricao="Reuniões agendadas com seus clientes."
        acoes={
          <Button onClick={() => abrirNova()}>
            <Plus className="size-4" />
            Nova reunião
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => navegar(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Próximo" onClick={() => navegar(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAncora(new Date())}>
            Hoje
          </Button>
          <span className="ml-2 text-sm font-medium capitalize">{rotuloPeriodo}</span>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["semana", "mes"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                modo === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "mes" ? "Mês" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {modo === "semana" ? (
        <div className="surface-panel overflow-x-auto">
          <div className="min-w-[46rem]">
            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border">
              <div />
              {diasSemana.map((d) => {
                const eHoje = mesmoDia(d, hoje);
                return (
                  <div key={d.toISOString()} className="border-l border-border px-2 py-2 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {DIAS[d.getDay()]}
                    </p>
                    <p
                      className={cn(
                        "mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full font-mono text-sm",
                        eHoje && "bg-foreground text-background",
                      )}
                    >
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div>
              {horas.map((h) => (
                <div
                  key={h}
                  className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/60 last:border-b-0"
                >
                  <div className="py-1 pr-2 text-right font-mono text-[11px] text-muted-foreground">
                    {String(h).padStart(2, "0")}:00
                  </div>
                  {diasSemana.map((d) => {
                    const eventos = (compromissos ?? []).filter((c) => {
                      const i = new Date(c.inicio);
                      return mesmoDia(i, d) && i.getHours() === h;
                    });
                    const slot = new Date(d);
                    slot.setHours(h, 0, 0, 0);
                    return (
                      <button
                        key={d.toISOString() + h}
                        type="button"
                        onClick={() => abrirNova(slot)}
                        className="min-h-[3rem] space-y-1 border-l border-border/60 p-1 text-left transition-colors hover:bg-muted/40"
                      >
                        {eventos.map((e) => (
                          <span
                            key={e.id}
                            role="button"
                            tabIndex={0}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setDetalhe(e);
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") {
                                ev.stopPropagation();
                                setDetalhe(e);
                              }
                            }}
                            className="block rounded border border-border bg-muted/70 px-1.5 py-1 text-[11px] leading-tight hover:border-foreground/30"
                          >
                            <span className="block font-mono text-[10px] text-muted-foreground">
                              {hhmm(e.inicio)}
                            </span>
                            <span className="block truncate font-medium">
                              {nomeContato(e.contato_id) ?? e.titulo}
                            </span>
                          </span>
                        ))}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-panel overflow-x-auto">
          <div className="min-w-[34rem]">
          <div className="grid grid-cols-7 border-b border-border">
            {DIAS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celulasMes.map((d) => {
              const doMes = d.getMonth() === ancora.getMonth();
              const eventos = (compromissos ?? []).filter((c) => mesmoDia(new Date(c.inicio), d));
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    const slot = new Date(d);
                    slot.setHours(9, 0, 0, 0);
                    abrirNova(slot);
                  }}
                  className={cn(
                    "min-h-[6rem] space-y-1 border-b border-l border-border/60 p-1.5 text-left align-top transition-colors hover:bg-muted/40",
                    !doMes && "bg-muted/20 text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full font-mono text-xs",
                      mesmoDia(d, hoje) && "bg-foreground text-background",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {eventos.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setDetalhe(e);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") {
                          ev.stopPropagation();
                          setDetalhe(e);
                        }
                      }}
                      className="block truncate rounded border border-border bg-muted/70 px-1 py-0.5 text-[11px] text-foreground"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {hhmm(e.inicio)}
                      </span>{" "}
                      {nomeContato(e.contato_id) ?? e.titulo}
                    </span>
                  ))}
                  {eventos.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{eventos.length - 3}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          </div>
        </div>
      )}


      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova reunião</DialogTitle>
            <DialogDescription>Agende um encontro com um cliente.</DialogDescription>
          </DialogHeader>
          <form
            id="form-reuniao"
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              criar.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                required
                maxLength={140}
                placeholder="Reunião de alinhamento"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inicio">Data e horário</Label>
                <Input
                  id="inicio"
                  type="datetime-local"
                  required
                  value={form.inicio}
                  onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração</Label>
                <Select
                  value={form.duracao}
                  onValueChange={(duracao) => setForm({ ...form, duracao })}
                >
                  <SelectTrigger id="duracao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["30", "60", "90", "120"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato">Cliente vinculado</Label>
              <Select
                value={form.contato_id || "nenhum"}
                onValueChange={(v) => setForm({ ...form, contato_id: v === "nenhum" ? "" : v })}
              >
                <SelectTrigger id="contato">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {(contatos ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="local">Local ou link</Label>
              <Input
                id="local"
                maxLength={200}
                placeholder="Escritório, Google Meet…"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                rows={3}
                maxLength={600}
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-reuniao" disabled={criar.isPending}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detalhe)} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent>
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle>{detalhe.titulo}</DialogTitle>
                <DialogDescription className="font-mono">
                  {new Date(detalhe.inicio).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  · {hhmm(detalhe.inicio)}
                  {detalhe.fim ? ` – ${hhmm(detalhe.fim)}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                {nomeContato(detalhe.contato_id) && (
                  <p className="text-muted-foreground">
                    Cliente: <span className="text-foreground">{nomeContato(detalhe.contato_id)}</span>
                  </p>
                )}
                {detalhe.local && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    {detalhe.local}
                  </p>
                )}
                {detalhe.link_reuniao && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="size-4" />
                    {detalhe.link_reuniao}
                  </p>
                )}
                {detalhe.descricao && <p className="text-muted-foreground">{detalhe.descricao}</p>}
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => remover.mutate(detalhe.id)}
                  disabled={remover.isPending}
                >
                  <Trash2 className="size-4" />
                  Remover
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
