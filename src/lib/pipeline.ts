import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EstagioPipeline =
  | "novo"
  | "em_conversa"
  | "proposta_enviada"
  | "fechado"
  | "perdido";

export const ESTAGIOS: {
  status: EstagioPipeline;
  label: string;
  descricao: string;
  trilho: string;
}[] = [
  {
    status: "novo",
    label: "Lead",
    descricao: "Sem primeiro contato",
    trilho: "bg-border",
  },
  {
    status: "em_conversa",
    label: "Qualificação",
    descricao: "Conversa em andamento",
    trilho: "bg-primary/40",
  },
  {
    status: "proposta_enviada",
    label: "Proposta",
    descricao: "Documento em análise",
    trilho: "bg-primary",
  },
  {
    status: "fechado",
    label: "Ganho",
    descricao: "Contrato fechado",
    trilho: "bg-success",
  },
];

export type ContatoPipeline = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  anotacoes: string | null;
  status: EstagioPipeline;
  origem: string;
  valor_estimado: number | null;
  valor_fechado: number | null;
  probabilidade: number;
  proxima_acao: string | null;
  proxima_acao_em: string | null;
  motivo_perda: string | null;
  fechado_em: string | null;
  created_at: string;
  updated_at: string;
  demandas: { categoria: string } | null;
};

export type ResumoPipeline = {
  ganho_total: number;
  ganho_mes: number;
  negocios_ganhos: number;
  negocios_perdidos: number;
  ticket_medio: number;
  ciclo_medio_dias: number;
  valor_aberto: number;
  previsao_ponderada: number;
  novos_mes: number;
  atrasados: number;
  propostas_enviadas: number;
  propostas_aceitas: number;
  valor_propostas_abertas: number;
};

const RESUMO_VAZIO: ResumoPipeline = {
  ganho_total: 0,
  ganho_mes: 0,
  negocios_ganhos: 0,
  negocios_perdidos: 0,
  ticket_medio: 0,
  ciclo_medio_dias: 0,
  valor_aberto: 0,
  previsao_ponderada: 0,
  novos_mes: 0,
  atrasados: 0,
  propostas_enviadas: 0,
  propostas_aceitas: 0,
  valor_propostas_abertas: 0,
};

export function usePipeline(prestadorId: string | undefined, habilitado: boolean) {
  const contatos = useQuery({
    queryKey: ["pipeline-contatos", prestadorId],
    enabled: Boolean(prestadorId) && habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contatos")
        .select("*, demandas(categoria)")
        .eq("prestador_id", prestadorId!)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ContatoPipeline[];
    },
  });

  const resumo = useQuery({
    queryKey: ["pipeline-resumo", prestadorId],
    enabled: Boolean(prestadorId) && habilitado,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("pipeline_resumo", {
        _prestador_id: prestadorId!,
      });
      if (error) throw error;
      const bruto = (data ?? {}) as Record<string, unknown>;
      const numero = (chave: keyof ResumoPipeline) => Number(bruto[chave] ?? 0);
      return {
        ganho_total: numero("ganho_total"),
        ganho_mes: numero("ganho_mes"),
        negocios_ganhos: numero("negocios_ganhos"),
        negocios_perdidos: numero("negocios_perdidos"),
        ticket_medio: numero("ticket_medio"),
        ciclo_medio_dias: numero("ciclo_medio_dias"),
        valor_aberto: numero("valor_aberto"),
        previsao_ponderada: numero("previsao_ponderada"),
        novos_mes: numero("novos_mes"),
        atrasados: numero("atrasados"),
        propostas_enviadas: numero("propostas_enviadas"),
        propostas_aceitas: numero("propostas_aceitas"),
        valor_propostas_abertas: numero("valor_propostas_abertas"),
      } satisfies ResumoPipeline;
    },
  });

  return {
    contatos: contatos.data ?? [],
    carregando: contatos.isLoading || resumo.isLoading,
    resumo: resumo.data ?? RESUMO_VAZIO,
  };
}

export function moeda(valor: number, compacto = false) {
  if (compacto && Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export function tempoRelativo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias >= 1) return `${dias}d`;
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas >= 1) return `${horas}h`;
  return "agora";
}

export function acaoAtrasada(contato: ContatoPipeline) {
  return Boolean(
    contato.proxima_acao_em &&
      contato.status !== "fechado" &&
      contato.status !== "perdido" &&
      new Date(contato.proxima_acao_em).getTime() < Date.now(),
  );
}