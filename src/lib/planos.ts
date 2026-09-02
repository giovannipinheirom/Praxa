export const RECURSOS_LABEL: Record<string, string> = {
  perfil_completo: "Perfil público completo",
  avaliacoes: "Avaliações verificadas",
  busca_organica: "Presença na busca orgânica",
  destaque_busca: "Selo de destaque na busca da categoria",
  banner_categoria: "Banner de destaque na categoria",
  crm: "CRM de contatos",
  agenda: "Agenda de compromissos",
  pool_demandas: "Acesso ilimitado ao pool de demandas",
  unidades_multiplas: "Múltiplas unidades/filiais",
  gerente_conta: "Gerente de conta dedicado",
};

export const PLANO_RESUMO: Record<string, string> = {
  "Grátis": "Perfil completo, avaliações e presença na busca orgânica.",
  Profissional: "Selo de destaque na busca da categoria + CRM e agenda básicos.",
  Business: "Banner de destaque na categoria + acesso ilimitado ao pool de demandas.",
  Enterprise:
    "Múltiplas unidades/filiais, destaque em todas as categorias relevantes e gerente de conta dedicado.",
};

export const STATUS_CONTATO = [
  { value: "novo", label: "Novo" },
  { value: "em_conversa", label: "Em conversa" },
  { value: "proposta_enviada", label: "Proposta enviada" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
] as const;

export const NICHOS_DESTAQUE = [
  "MEI",
  "Indústria",
  "Clínicas e saúde",
  "Varejo",
  "Tecnologia",
  "Agronegócio",
  "Construção civil",
];

export function formatarBRL(valor?: number | null) {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function recursosAtivos(recursos: Record<string, unknown> | null | undefined) {
  return Object.entries(recursos ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => RECURSOS_LABEL[k] ?? k);
}
