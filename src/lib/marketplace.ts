export const CATEGORIAS = [
  { slug: "contabilidade", label: "Contabilidade", desc: "Fiscal, folha, societário e BPO financeiro." },
  { slug: "marketing", label: "Marketing", desc: "Performance, conteúdo, branding e inbound B2B." },
  { slug: "juridico", label: "Jurídico", desc: "Societário, trabalhista, tributário e contratos." },
  { slug: "ti", label: "TI", desc: "Infraestrutura, software, dados e segurança." },
  { slug: "rh", label: "RH", desc: "Recrutamento, treinamento e departamento pessoal." },
  { slug: "outros", label: "Outros serviços", desc: "Consultorias e serviços especializados." },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]["slug"];

export const CATEGORIA_SLUGS = CATEGORIAS.map((c) => c.slug) as string[];

export function categoriaLabel(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug)?.label ?? "Serviços";
}

export const FAIXAS_PRECO = [
  { value: "$", label: "$ · entrada" },
  { value: "$$", label: "$$ · intermediário" },
  { value: "$$$", label: "$$$ · premium" },
] as const;

export const METODO_VERIFICACAO_LABEL: Record<string, string> = {
  cnpj: "Verificado por CNPJ",
  email_corporativo: "Verificado por e-mail corporativo",
  convite_prestador: "Verificado por convite do prestador",
};

export const MODELOS_TRABALHO = [
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "presencial", label: "Presencial" },
] as const;

export const MODELOS_PRECIFICACAO = [
  { value: "mensal", label: "Mensalidade / retainer" },
  { value: "projeto", label: "Por projeto" },
  { value: "hora", label: "Por hora" },
  { value: "misto", label: "Modelo misto" },
] as const;

export const TAMANHOS_EQUIPE = [
  { value: "1", label: "Profissional autônomo" },
  { value: "2-5", label: "2 a 5 pessoas" },
  { value: "6-20", label: "6 a 20 pessoas" },
  { value: "21-50", label: "21 a 50 pessoas" },
  { value: "50+", label: "Mais de 50 pessoas" },
] as const;

export function modeloTrabalhoLabel(value?: string | null) {
  return MODELOS_TRABALHO.find((m) => m.value === value)?.label ?? null;
}

export function modeloPrecificacaoLabel(value?: string | null) {
  return MODELOS_PRECIFICACAO.find((m) => m.value === value)?.label ?? null;
}

export function tamanhoEquipeLabel(value?: string | null) {
  return TAMANHOS_EQUIPE.find((t) => t.value === value)?.label ?? value ?? null;
}

export function regiaoLabel(slug?: string | null) {
  if (!slug || slug === "todos") return "Todo o Brasil";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugifyRegiao(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Rotação de impulsionados: os prestadores com destaque pago ativo são
 * distribuídos entre os resultados (nunca fixos no topo). A semente muda a cada
 * hora, então todos os elegíveis passam pelas mesmas posições ao longo do dia.
 */
export function rotacionarImpulsionados<T extends { impulsionado: boolean }>(
  items: T[],
  seed = Math.floor(Date.now() / 3_600_000),
): T[] {
  const boosted = items.filter((i) => i.impulsionado);
  const organic = items.filter((i) => !i.impulsionado);
  if (boosted.length === 0) return organic;

  const offset = seed % boosted.length;
  const rotated = [...boosted.slice(offset), ...boosted.slice(0, offset)];
  const result: T[] = [];
  const step = Math.max(2, Math.ceil((organic.length + 1) / (rotated.length + 1)));

  let b = 0;
  organic.forEach((item, index) => {
    result.push(item);
    if (b < rotated.length && (index + 1) % step === 0) {
      result.push(rotated[b]);
      b += 1;
    }
  });
  while (b < rotated.length) {
    result.push(rotated[b]);
    b += 1;
  }
  return result;
}
