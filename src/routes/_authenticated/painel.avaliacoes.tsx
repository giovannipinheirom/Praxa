import { PainelHeader } from "@/components/painel/painel-header";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import { METODO_VERIFICACAO_LABEL } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/painel/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações verificadas | Praxa" },
      { name: "description", content: "Convide clientes e acompanhe suas avaliações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Avaliacoes,
});

function Avaliacoes() {
  const { data } = usePrestador();
  const queryClient = useQueryClient();
  const prestadorId = data?.prestador.id;
  const [email, setEmail] = useState("");

  const { data: convites } = useQuery({
    queryKey: ["convites", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("convites_avaliacao")
        .select("id, token, cliente_email, usado, created_at")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  const { data: avaliacoes } = useQuery({
    queryKey: ["avaliacoes-prestador", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, metodo_verificacao, verificado, resposta_prestador, created_at")
        .eq("prestador_id", prestadorId!)
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  const gerar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("convites_avaliacao").insert({
        prestador_id: prestadorId!,
        cliente_email: email.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["convites"] });
      toast.success("Convite gerado.");
    },
    onError: () => toast.error("Não foi possível gerar o convite."),
  });

  const responder = useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { error } = await supabase
        .from("avaliacoes")
        .update({ resposta_prestador: texto })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["avaliacoes-prestador"] });
      toast.success("Resposta publicada.");
    },
  });

  const origem = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="space-y-8">
      <PainelHeader
        eyebrow="Credencial"
        titulo="Avaliações verificadas"
        descricao="Gere um convite para o cliente avaliar. Convites e e-mails corporativos com o mesmo domínio do seu CNPJ entram na fila de verificação."
      />

      <section className="surface-panel space-y-4 p-6">
        <h2 className="text-lg font-semibold">Solicitar avaliação</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!prestadorId) return;
            gerar.mutate();
          }}
        >
          <div className="min-w-[240px] flex-1 space-y-2">
            <Label htmlFor="email">E-mail do cliente (opcional)</Label>
            <Input
              id="email"
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@empresa.com.br"
            />
          </div>
          <Button type="submit" disabled={gerar.isPending}>
            Gerar convite
          </Button>
        </form>

        <ul className="space-y-2">
          {(convites ?? []).map((c) => {
            const link = `${origem}/avaliar/${c.token}`;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{link}</code>
                <span className="text-xs text-muted-foreground">
                  {c.cliente_email ?? "sem e-mail"} · {c.usado ? "usado" : "pendente"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copiado.");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Suas avaliações</h2>
        {(avaliacoes ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação recebida ainda.</p>
        )}
        {(avaliacoes ?? []).map((a) => (
          <article key={a.id} className="surface-panel space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-semibold">
                <Star className="size-4 text-primary" />
                {a.nota}
              </span>
              <span className="text-xs text-muted-foreground">
                {a.verificado
                  ? (METODO_VERIFICACAO_LABEL[a.metodo_verificacao ?? ""] ?? "Verificada")
                  : "Aguardando verificação"}
              </span>
              <time className="ml-auto text-xs text-muted-foreground" dateTime={a.created_at}>
                {new Date(a.created_at).toLocaleDateString("pt-BR")}
              </time>
            </div>
            <p className="text-sm text-muted-foreground">{a.comentario}</p>

            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const texto = new FormData(e.currentTarget).get("resposta") as string;
                if (!texto?.trim()) return;
                responder.mutate({ id: a.id, texto: texto.trim() });
              }}
            >
              <Input
                name="resposta"
                maxLength={1000}
                defaultValue={a.resposta_prestador ?? ""}
                placeholder="Responder publicamente"
                className="min-w-[240px] flex-1"
              />
              <Button type="submit" size="sm" variant="outline">
                Responder
              </Button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
