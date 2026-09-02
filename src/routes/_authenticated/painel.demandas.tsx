import { PainelHeader } from "@/components/painel/painel-header";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { CATEGORIAS, categoriaLabel } from "@/lib/marketplace";
import { formatarBRL } from "@/lib/planos";

export const Route = createFileRoute("/_authenticated/painel/demandas")({
  head: () => ({
    meta: [
      { title: "Pool de demandas | Praxa" },
      { name: "description", content: "Demandas cadastradas por clientes, filtráveis por categoria e região." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Demandas,
});

function Demandas() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const temPool = Boolean(data?.recursos?.pool_demandas);
  const [categoria, setCategoria] = useState("todas");
  const [regiao, setRegiao] = useState("");

  const { data: demandas, isLoading } = useQuery({
    queryKey: ["pool-demandas", categoria, regiao],
    enabled: temPool,
    queryFn: async () => {
      let q = supabase
        .from("demandas")
        .select("id, categoria, regiao, descricao_necessidade, orcamento_estimado, status, created_at, contato_email")
        .eq("status", "aberta")
        .order("created_at", { ascending: false })
        .limit(60);
      if (categoria !== "todas") q = q.eq("categoria", categoria as never);
      if (regiao.trim()) q = q.ilike("regiao", `%${regiao.trim()}%`);
      const { data: rows } = await q;
      return rows ?? [];
    },
  });

  const importar = useMutation({
    mutationFn: async (demanda: { id: string; contato_email: string | null; regiao: string }) => {
      const { error } = await supabase.from("crm_contatos").insert({
        prestador_id: data!.prestador.id,
        nome: demanda.contato_email ?? `Demanda ${demanda.regiao}`,
        email: demanda.contato_email,
        demanda_id: demanda.id,
        origem: "pool_demandas",
        status: "novo",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["crm"] });
      toast.success("Demanda enviada para o seu CRM.");
    },
    onError: () => toast.error("Não foi possível importar a demanda."),
  });

  if (!temPool) {
    return (
      <div className="surface-panel space-y-3 p-8">
        <Lock className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Pool de demandas é do plano Business</h1>
        <p className="text-sm text-muted-foreground">
          Assine o plano Business ou Enterprise para acessar, sem limite, as demandas cadastradas
          pelos clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Operação"
        titulo="Pool de demandas"
        descricao="Demandas abertas cadastradas por clientes. Acesso ilimitado no seu plano."
      />

      <div className="surface-panel flex flex-wrap gap-4 p-5">
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-56"
          placeholder="Filtrar por região"
          maxLength={80}
          value={regiao}
          onChange={(e) => setRegiao(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando demandas…</p>}
      {!isLoading && (demandas ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma demanda aberta com esses filtros.</p>
      )}

      <div className="space-y-3">
        {(demandas ?? []).map((d) => (
          <article key={d.id} className="surface-panel space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {categoriaLabel(d.categoria)}
              </span>
              <span className="text-xs text-muted-foreground">{d.regiao}</span>
              <span className="ml-auto font-semibold">
                {formatarBRL(d.orcamento_estimado ? Number(d.orcamento_estimado) : null)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{d.descricao_necessidade}</p>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  importar.mutate({
                    id: d.id,
                    contato_email: d.contato_email,
                    regiao: d.regiao,
                  })
                }
              >
                Adicionar ao CRM
              </Button>
              <time className="text-xs text-muted-foreground" dateTime={d.created_at}>
                {new Date(d.created_at).toLocaleDateString("pt-BR")}
              </time>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
