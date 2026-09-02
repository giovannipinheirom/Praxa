import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RecursosPlano = {
  destaque_busca?: boolean;
  banner_categoria?: boolean;
  crm?: boolean;
  agenda?: boolean;
  pool_demandas?: boolean;
  unidades_multiplas?: boolean;
  gerente_conta?: boolean;
};

export function usePrestador() {
  return useQuery({
    queryKey: ["meu-prestador"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;

      const { data: prestador, error } = await supabase
        .from("prestadores")
        .select("*")
        .eq("profile_id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!prestador) return null;

      const { data: plano } = prestador.plano_atual
        ? await supabase
            .from("planos_assinatura")
            .select("id, nome, preco_mensal, preco_promocional, recursos")
            .eq("id", prestador.plano_atual)
            .maybeSingle()
        : { data: null };

      const { data: assinatura } = await supabase
        .from("assinaturas_prestador")
        .select("id, status, preco_pago, data_inicio, data_fim_preco_promocional, plano_id")
        .eq("prestador_id", prestador.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        prestador,
        plano,
        assinatura,
        recursos: (plano?.recursos ?? {}) as RecursosPlano,
        userId: auth.user.id,
      };
    },
  });
}

export function usePlanos() {
  return useQuery({
    queryKey: ["planos-assinatura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_assinatura")
        .select("id, nome, preco_mensal, preco_promocional, recursos, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVagasPromocionais() {
  return useQuery({
    queryKey: ["vagas-promocionais"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("vagas_promocionais_restantes");
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}
