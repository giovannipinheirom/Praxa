
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables in server function.");
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseKey,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const PRESTADOR_CARD_FIELDS =
  "id, slug, nome_negocio, categoria_principal, subcategorias, descricao, regiao_atendimento, cidade, estado, foto_perfil_url, nota_media, total_avaliacoes, total_clientes_atendidos, tempo_medio_resposta_horas, faixa_preco, headline, tipo_prestador";

const PRESTADOR_FIELDS =
  "id, slug, nome_negocio, categoria_principal, subcategorias, descricao, regiao_atendimento, cidade, estado, foto_perfil_url, nota_media, total_avaliacoes, total_clientes_atendidos, tempo_medio_resposta_horas, faixa_preco, headline, ano_fundacao, tamanho_equipe, modelo_trabalho, modelo_precificacao, email_contato, whatsapp, site_url, linkedin_url, instagram_url, tipo_prestador, portfolio, empresa_verificada, cnpj_verificado, socios_identificados, equipe, perguntas_frequentes";

const buscaSchema = z.object({
  categoria: z.string().optional(),
  regiao: z.string().optional(),
  subcategoria: z.string().optional(),
  faixaPreco: z.string().optional(),
  notaMinima: z.number().optional(),
  tipoPrestador: z.string().optional(),
  ordenacao: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const buscarPrestadores = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => buscaSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let query = supabase
      .from("prestadores")
      .select(PRESTADOR_CARD_FIELDS, { count: "exact" })
      .eq("status_conta", "ativo");

    if (data.categoria && data.categoria !== "todas")
      query = query.eq("categoria_principal", data.categoria as never);
    if (data.regiao && data.regiao !== "todos") {
      const termo = data.regiao.replace(/-/g, " ");
      query = query.or(
        `regiao_atendimento.ilike.%${termo}%,cidade.ilike.%${termo}%,regiao_atendimento.ilike.%brasil%`,
      );
    }
    if (data.subcategoria) {
      const termo = data.subcategoria.trim().toLowerCase();
      // Em arrays textuais não podemos usar .ilike.any facilmente no PostgREST sem db function, 
      // mas se o filtro for exato podemos usar contains. Como a UI diz "Ex: folha de pagamento", vamos usar contains mas o usuário precisa escrever exato, ou usar texto pleno.
      // Para manter a lógica antiga (que era no JS e fazia string.includes), precisaremos de uma busca textual (FTS) futuramente. Por ora, vamos usar `cs` (contains) e esperar match exato, ou um `ilike` na descricao.
      // Vamos usar textSearch para buscar na descrição e subcategorias se existir.
      query = query.or(`subcategorias.cs.{"${termo}"},descricao.ilike.%${termo}%`);
    }
    if (data.faixaPreco && data.faixaPreco !== "todas") query = query.eq("faixa_preco", data.faixaPreco as never);
    if (data.notaMinima && data.notaMinima > 0) query = query.gte("nota_media", data.notaMinima);
    if (data.tipoPrestador && data.tipoPrestador !== "todos")
      query = query.eq("tipo_prestador", data.tipoPrestador as never);

    if (data.ordenacao === "nota") {
      query = query.order("nota_media", { ascending: false }).order("total_avaliacoes", { ascending: false }).order("id");
    } else if (data.ordenacao === "resposta") {
      query = query.order("tempo_medio_resposta_horas", { ascending: true, nullsFirst: false }).order("id");
    } else {
      // Relevância
      query = query.order("nota_media", { ascending: false }).order("total_avaliacoes", { ascending: false }).order("id");
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: prestadores, count } = await query;
    const ids = (prestadores ?? []).map((p) => p.id);

    let impulsionados: string[] = [];
    if (ids.length > 0) {
      const { data: destaques } = await supabase
          .from("destaques_pagos")
          .select("prestador_id")
          .eq("ativo", true)
          .in("prestador_id", ids);
      impulsionados = (destaques ?? []).map((d) => d.prestador_id);
    }

    return {
      prestadores: (prestadores ?? []).map((p) => ({
        ...p,
        impulsionado: impulsionados.includes(p.id),
      })),
      totalCount: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const obterPrestador = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: prestador } = await supabase
      .from("prestadores")
      .select(PRESTADOR_FIELDS)
      .eq("slug", data.slug)
      .eq("status_conta", "ativo")
      .maybeSingle();

    if (!prestador) return null;

    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select("id, nota, comentario, metodo_verificacao, cliente_recorrente, resposta_prestador, created_at, verificado")
      .eq("prestador_id", prestador.id)
      .eq("verificado", true)
      .order("created_at", { ascending: false })
      .limit(50);

    return { prestador, avaliacoes: avaliacoes ?? [] };
  });

export const obterEstatisticas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [{ count: prestadores }, { count: avaliacoes }, { data: tempos }] = await Promise.all([
    supabase
      .from("prestadores")
      .select("id", { count: "exact", head: true })
      .eq("status_conta", "ativo"),
    supabase
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .eq("verificado", true),
    supabase
      .from("prestadores")
      .select("tempo_medio_resposta_horas, nota_media")
      .eq("status_conta", "ativo")
      .not("tempo_medio_resposta_horas", "is", null)
      .limit(500),
  ]);

  const horas = (tempos ?? [])
    .map((t) => Number(t.tempo_medio_resposta_horas))
    .filter((n) => Number.isFinite(n) && n > 0);
  const notas = (tempos ?? [])
    .map((t) => Number(t.nota_media))
    .filter((n) => Number.isFinite(n) && n > 0);

  return {
    prestadores: prestadores ?? 0,
    avaliacoesVerificadas: avaliacoes ?? 0,
    tempoMedioRespostaHoras:
      horas.length > 0 ? horas.reduce((a, b) => a + b, 0) / horas.length : null,
    notaMediaRede: notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
  };
});


export const obterDadosLanding = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();

  const [{ data: destaques }, { data: planos }, { count: totalPrestadores }, { data: depoimentos }] =
    await Promise.all([
      supabase
        .from("prestadores")
        .select(PRESTADOR_CARD_FIELDS)
        .eq("status_conta", "ativo")
        .gte("total_avaliacoes", 1)
        .order("nota_media", { ascending: false })
        .order("total_avaliacoes", { ascending: false })
        .limit(3),
      supabase
        .from("planos_assinatura")
        .select("id, nome, preco_mensal, preco_promocional, recursos, sort_order")
        .order("sort_order"),
      supabase.from("prestadores").select("id", { count: "exact", head: true }),
      supabase
        .from("avaliacoes")
        .select("id, nota, comentario, metodo_verificacao, created_at, prestadores(nome_negocio, slug, categoria_principal)")
        .eq("verificado", true)
        .gte("nota", 5)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  return {
    destaques: destaques ?? [],
    planos: planos ?? [],
    vagasPromocionais: Math.max(0, 100 - (totalPrestadores ?? 0)),
    depoimentos: (depoimentos ?? []).map((d) => ({
      id: d.id,
      nota: d.nota,
      comentario: d.comentario,
      metodo_verificacao: d.metodo_verificacao,
      prestador_nome: d.prestadores?.nome_negocio ?? "Prestador",
      prestador_slug: d.prestadores?.slug ?? "",
      prestador_categoria: d.prestadores?.categoria_principal ?? "outros",
    })),
  };
});

export const registrarDemanda = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        categoria: z.enum(["contabilidade", "marketing", "juridico", "ti", "rh", "outros"]),
        regiao: z.string().min(2).max(120),
        descricao_necessidade: z.string().min(20).max(2000),
        orcamento_estimado: z.number().nonnegative().max(10_000_000).nullable().optional(),
        contato_email: z.string().email().max(160),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const isAllowed = await checkRateLimit("demanda", 3, 60 * 60 * 1000); // Max 3 demands per hour per IP
    if (!isAllowed) {
      throw new Error("Muitas requisições. Tente novamente mais tarde.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demandas").insert({
      categoria: data.categoria,
      regiao: data.regiao,
      descricao_necessidade: data.descricao_necessidade,
      orcamento_estimado: data.orcamento_estimado ?? null,
      contato_email: data.contato_email,
      status: "aberta",
      cliente_profile_id: null, // Lead anônimo inicialmente
    });
    if (error) {
      console.error("Erro ao registrar demanda:", error);
      throw new Error("Falha ao registrar demanda");
    }
    return { ok: true };
  });
