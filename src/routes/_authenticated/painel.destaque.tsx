import { PainelHeader } from "@/components/painel/painel-header";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Repeat, Sparkles, Star, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { NICHOS_DESTAQUE } from "@/lib/planos";

export const Route = createFileRoute("/_authenticated/painel/destaque")({
  head: () => ({
    meta: [
      { title: "Destaque pago | Praxa" },
      {
        name: "description",
        content: "Compre destaque em nichos específicos com rotação transparente entre elegíveis.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Destaque,
});

const NOTA_MINIMA = 4;

/** Anel de proporção simples — sem gráfico de pizza. */
function AnelRotacao({ participantes }: { participantes: number }) {
  const fatia = 1 / Math.max(participantes, 1);
  const graus = Math.round(fatia * 360);
  return (
    <div className="relative size-28 shrink-0">
      <div
        className="size-28 rounded-full"
        style={{
          background: `conic-gradient(var(--color-gold) 0deg ${graus}deg, color-mix(in oklab, var(--color-muted-foreground) 22%, transparent) ${graus}deg 360deg)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
        <span className="font-mono text-xl leading-none tabular-nums">
          {Math.round(fatia * 100)}%
        </span>
        <span className="mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">
          exposição
        </span>
      </div>
    </div>
  );
}

function Destaque() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const nota = Number(data?.prestador.nota_media ?? 0);
  const contaAtiva = data?.prestador.status_conta === "ativo";
  const elegivel = nota >= NOTA_MINIMA && contaAtiva;

  const [nicho, setNicho] = useState(NICHOS_DESTAQUE[0]);
  const [regiao, setRegiao] = useState("");
  const [carimbo, setCarimbo] = useState<string | null>(null);

  const regiaoAlvo = regiao.trim() || "Todo o Brasil";

  const { data: destaques } = useQuery({
    queryKey: ["destaques", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("destaques_pagos")
        .select("*")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  const { data: rotacao } = useQuery({
    queryKey: ["rotacao-destaque", nicho, regiaoAlvo, destaques?.length],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc(
        "rotacao_destaque" as never,
        { _categoria: nicho, _regiao: regiaoAlvo } as never,
      );
      if (error) throw error;
      const linha = (rows as unknown as { concorrentes: number; ja_ativo: boolean }[] | null)?.[0];
      return { concorrentes: linha?.concorrentes ?? 0, jaAtivo: Boolean(linha?.ja_ativo) };
    },
  });

  const naRotacao = rotacao?.concorrentes ?? 0;
  const jaAtivo = rotacao?.jaAtivo ?? false;
  // Participantes após a sua entrada (se ainda não estiver na rotação, você soma 1).
  const participantes = useMemo(
    () => Math.max(1, naRotacao + (jaAtivo ? 0 : 1)),
    [naRotacao, jaAtivo],
  );

  const comprar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("destaques_pagos").insert({
        prestador_id: prestadorId!,
        categoria: nicho,
        regiao: regiaoAlvo,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      const rotulo = `${nicho} · ${regiaoAlvo}`;
      setRegiao("");
      await queryClient.invalidateQueries({ queryKey: ["destaques"] });
      await queryClient.invalidateQueries({ queryKey: ["rotacao-destaque"] });
      setCarimbo(rotulo);
    },
    onError: (e: unknown) =>
      toast.error(
        e instanceof Error && e.message.includes("nota")
          ? "Somente prestadores ativos com nota a partir de 4,0 podem ativar destaques."
          : "Não foi possível ativar o destaque.",
      ),
  });

  const alternar = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("destaques_pagos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["destaques"] });
      await queryClient.invalidateQueries({ queryKey: ["rotacao-destaque"] });
    },
    onError: () => toast.error("Não foi possível alterar o destaque."),
  });

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Conta"
        titulo="Destaque pago"
        descricao="Rotação transparente entre elegíveis — sempre marcado como “Impulsionado” nos resultados."
        acoes={<Sparkles className="size-5 text-primary" />}
      />

      <div className="surface-panel flex items-start gap-3 p-5">
        <Repeat className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Não é leilão e não é posição fixa no topo. Todos os destaques ativos de um nicho e região
          entram no mesmo rodízio, com <strong>participação igual</strong> de exibição, e nunca se
          misturam ao resultado orgânico.
        </p>
      </div>

      {/* Carimbo cerimonial — momento oficial: destaque ativado */}
      {carimbo && (
        <div className="surface-panel animate-stamp-in flex flex-wrap items-center gap-4 p-6">
          <span className="selo-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            Destaque ativado
          </span>
          <p className="text-sm text-muted-foreground">
            Seu perfil entrou na rotação de <strong>{carimbo}</strong>.
          </p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCarimbo(null)}>
            Fechar
          </Button>
        </div>
      )}

      {!elegivel ? (
        <div className="surface-panel space-y-3 p-8">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Star className="size-4 text-gold" />
            Destaque pago é liberado a partir de nota 4.0
          </span>
          <p className="font-mono text-3xl tabular-nums">{nota.toFixed(1)}</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Sua nota atual é <strong>{nota.toFixed(1)}</strong>.{" "}
            {contaAtiva
              ? "Assim que ela alcançar 4.0, o destaque é liberado automaticamente nesta tela."
              : "Sua conta também precisa estar ativa."}{" "}
            Essa regra existe porque quem aparece em destaque na busca precisa sustentar a mesma
            credibilidade de quem aparece no resultado orgânico — dinheiro não compra reputação
            aqui.
          </p>
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${Math.min(100, (nota / NOTA_MINIMA) * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <form
            className="surface-panel space-y-5 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              comprar.mutate();
            }}
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="nicho">Nicho</Label>
                <Select value={nicho} onValueChange={setNicho}>
                  <SelectTrigger id="nicho" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHOS_DESTAQUE.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  className="w-56"
                  maxLength={80}
                  value={regiao}
                  onChange={(e) => setRegiao(e.target.value)}
                  placeholder="Todo o Brasil"
                />
              </div>
            </div>

            <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Nicho escolhido</dt>
                <dd className="text-sm font-medium">{nicho}</dd>
                <dd className="text-xs text-muted-foreground">{regiaoAlvo}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Elegíveis na rotação hoje</dt>
                <dd className="font-mono text-2xl tabular-nums">{naRotacao}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Com você</dt>
                <dd className="font-mono text-2xl tabular-nums">{participantes}</dd>
              </div>
            </dl>

            <Button type="submit" disabled={comprar.isPending} className="selo-gold">
              Ativar destaque
            </Button>
          </form>

          <aside className="surface-panel flex flex-col items-center gap-4 p-6 text-center">
            <AnelRotacao participantes={participantes} />
            <p className="text-sm">
              Seu perfil apareceria em destaque aproximadamente{" "}
              <strong>1 a cada {participantes}</strong>{" "}
              {participantes === 1 ? "busca" : "buscas"} nesse nicho.
            </p>
            <p className="flex items-start gap-2 text-left text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Estimativa baseada nos destaques ativos agora. Se outro prestador elegível entrar na
              rotação, a participação de todos cai na mesma proporção — e você vê isso aqui.
            </p>
          </aside>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Seus destaques</h2>
        {(destaques ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum destaque contratado.</p>
        )}
        {(destaques ?? []).map((d) => (
          <div key={d.id} className="surface-panel flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.categoria}</p>
              <p className="text-xs text-muted-foreground">{d.regiao}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{d.ativo ? "Ativo" : "Pausado"}</span>
              <Switch
                checked={d.ativo}
                onCheckedChange={(ativo) => alternar.mutate({ id: d.id, ativo })}
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
