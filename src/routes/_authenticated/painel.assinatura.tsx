import { PainelHeader } from "@/components/painel/painel-header";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Flame, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlanos, usePrestador, useVagasPromocionais } from "@/hooks/use-prestador";
import { formatarBRL, PLANO_RESUMO, recursosAtivos } from "@/lib/planos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel/assinatura")({
  head: () => ({
    meta: [
      { title: "Assinatura e faturamento | Praxa" },
      { name: "description", content: "Plano atual, upgrade, downgrade e histórico de cobranças." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Assinatura,
});

const STATUS_LABEL: Record<string, string> = {
  ativa: "Paga",
  trial: "Em teste",
  cancelada: "Cancelada",
};

function Assinatura() {
  const { data } = usePrestador();
  const { data: planos } = usePlanos();
  const { data: vagas } = useVagasPromocionais();
  const queryClient = useQueryClient();
  const [carimbo, setCarimbo] = useState<string | null>(null);

  const prestadorId = data?.prestador.id;
  const promoAtiva = (vagas ?? 0) > 0;

  const { data: historico } = useQuery({
    queryKey: ["assinaturas", prestadorId],
    enabled: Boolean(prestadorId),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("assinaturas_prestador")
        .select("id, status, preco_pago, data_inicio, data_fim_preco_promocional, plano_id")
        .eq("prestador_id", prestadorId!)
        .order("data_inicio", { ascending: false });
      return rows ?? [];
    },
  });

  const trocar = useMutation({
    mutationFn: async (planoId: string) => {
      const plano = (planos ?? []).find((p) => p.id === planoId)!;
      const promo = promoAtiva && plano.preco_promocional ? plano.preco_promocional : null;

      const { error: upErr } = await supabase
        .from("prestadores")
        .update({ plano_atual: planoId })
        .eq("id", prestadorId!);
      if (upErr) throw upErr;

      const { error } = await supabase.from("assinaturas_prestador").insert({
        prestador_id: prestadorId!,
        plano_id: planoId,
        status: Number(plano.preco_mensal) === 0 ? "ativa" : "trial",
        preco_pago: promo ?? plano.preco_mensal,
        data_fim_preco_promocional: promo
          ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
          : null,
      });
      if (error) throw error;
      return plano.nome;
    },
    onSuccess: async (nome) => {
      await queryClient.invalidateQueries();
      setCarimbo(nome);
    },
    onError: () => toast.error("Não foi possível alterar o plano."),
  });

  const nomePlano = (id: string) => (planos ?? []).find((p) => p.id === id)?.nome ?? "—";

  const baixarRecibo = (fatura: {
    id: string;
    plano_id: string;
    preco_pago: number | string;
    data_inicio: string;
    status: string;
  }) => {
    const linhas = [
      "PRAXA — Recibo de assinatura",
      "",
      `Documento: ${fatura.id}`,
      `Data: ${new Date(fatura.data_inicio).toLocaleDateString("pt-BR")}`,
      `Prestador: ${data?.prestador.nome_negocio ?? ""}`,
      `Plano: ${nomePlano(fatura.plano_id)}`,
      `Valor: ${formatarBRL(Number(fatura.preco_pago))}`,
      `Situação: ${STATUS_LABEL[fatura.status] ?? fatura.status}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([linhas], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `praxa-recibo-${fatura.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PainelHeader
        eyebrow="Conta"
        titulo="Assinatura e faturamento"
        descricao={
          <>
            Plano atual: <strong>{data?.plano?.nome ?? "Grátis"}</strong>
            {data?.assinatura?.preco_pago
              ? ` · ${formatarBRL(Number(data.assinatura.preco_pago))}/mês`
              : ""}
          </>
        }
      />

      {/* Carimbo cerimonial — momento oficial: assinatura confirmada */}
      {carimbo && (
        <div className="surface-panel animate-stamp-in flex flex-wrap items-center gap-4 p-6">
          <span className="selo-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase">
            <ShieldCheck className="size-3.5" />
            Assinatura confirmada
          </span>
          <p className="text-sm text-muted-foreground">
            Seu plano <strong>{carimbo}</strong> já está ativo.
          </p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCarimbo(null)}>
            Fechar
          </Button>
        </div>
      )}

      {promoAtiva && (
        <div className="surface-panel flex flex-wrap items-center gap-3 border-primary/40 p-5">
          <Flame className="size-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            <strong>Oferta de lançamento</strong> — restam {vagas} das 100 vagas. Profissional por
            R$ 47/mês e Business por R$ 147/mês, fixos por 12 meses.
          </p>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(planos ?? []).map((plano) => {
          const atual = data?.prestador.plano_atual === plano.id;
          const promo = promoAtiva && plano.preco_promocional;
          const fimPromo = new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString("pt-BR");
          return (
            <div
              key={plano.id}
              className={cn(
                "surface-panel flex flex-col p-6",
                atual && "border border-gold/70",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{plano.nome}</h2>
                {atual && (
                  <span className="rounded-full border border-gold/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gold uppercase">
                    Plano atual
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl leading-none tabular-nums">
                    {promo ? formatarBRL(plano.preco_promocional) : formatarBRL(plano.preco_mensal)}
                  </span>
                  {promo && (
                    <span className="font-mono text-sm text-muted-foreground line-through tabular-nums">
                      {formatarBRL(plano.preco_mensal)}
                    </span>
                  )}
                  {Number(plano.preco_mensal) > 0 && (
                    <span className="text-xs text-muted-foreground">/mês</span>
                  )}
                </div>
                {promo && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Preço de lançamento fixo até {fimPromo} — depois{" "}
                    {formatarBRL(plano.preco_mensal)}/mês.
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm text-muted-foreground">{PLANO_RESUMO[plano.nome] ?? ""}</p>

              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {recursosAtivos(plano.recursos as Record<string, unknown>).map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                {atual ? (
                  <p className="text-xs text-muted-foreground">Você está neste plano.</p>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={trocar.isPending}
                    onClick={() => trocar.mutate(plano.id)}
                  >
                    Mudar para {plano.nome}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico de faturas</h2>
        {(historico ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>
        ) : (
          <div className="surface-panel overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(historico ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">
                      {new Date(a.data_inicio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3">
                      {nomePlano(a.plano_id)}
                      {a.data_fim_preco_promocional && (
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          preço travado até{" "}
                          {new Date(a.data_fim_preco_promocional).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums">
                      {formatarBRL(Number(a.preco_pago))}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => baixarRecibo(a)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <Download className="size-3.5" />
                        Baixar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
