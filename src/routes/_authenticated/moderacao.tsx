import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FLAG_LABEL: Record<string, string> = {
  muitas_no_mesmo_dia: "Muitas avaliações no mesmo dia",
  mesmo_ip: "Mesmo IP de outra avaliação",
  conta_recem_criada: "Conta muito recente",
  pico_semanal: "Pico semanal de avaliações",
};

export const Route = createFileRoute("/_authenticated/moderacao")({
  head: () => ({
    meta: [
      { title: "Moderação de avaliações | Praxa" },
      {
        name: "description",
        content: "Painel interno de sinais de fraude em avaliações da Praxa.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Moderação de avaliações | Praxa" },
      {
        property: "og:description",
        content: "Painel interno de sinais de fraude em avaliações da Praxa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Moderacao,
});

function Moderacao() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["moderacao-sinais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes_sinais")
        .select(
          "id, flags, ip_hash, conta_criada_em, revisado, created_at, avaliacoes(nota, comentario, cliente_email, verificado), prestadores(nome_negocio, slug)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const revisar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("avaliacoes_sinais")
        .update({ revisado: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sinal marcado como revisado.");
      qc.invalidateQueries({ queryKey: ["moderacao-sinais"] });
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <ShieldCheck className="size-6 text-primary" />
        Moderação de avaliações
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sinais internos de padrão suspeito. Esta lista é visível apenas para administradores — os
        prestadores e o público nunca veem estas marcações.
      </p>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhum sinal registrado (ou seu usuário não tem permissão de administrador).
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {(data ?? []).map((s) => (
          <li key={s.id} className="surface-panel space-y-3 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle className="size-4 text-primary" />
              <strong>{s.prestadores?.nome_negocio ?? "Prestador"}</strong>
              <span className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString("pt-BR")}
              </span>
              {s.revisado && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Revisado
                </span>
              )}
            </div>

            <ul className="flex flex-wrap gap-2">
              {s.flags.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-primary/40 bg-accent px-2.5 py-1 text-xs text-accent-foreground"
                >
                  {FLAG_LABEL[f] ?? f}
                </li>
              ))}
            </ul>

            {s.avaliacoes && (
              <p className="text-sm text-muted-foreground">
                Nota {s.avaliacoes.nota} — {s.avaliacoes.comentario}
              </p>
            )}

            {!s.revisado && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => revisar.mutate(s.id)}
                disabled={revisar.isPending}
              >
                Marcar como revisado
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
