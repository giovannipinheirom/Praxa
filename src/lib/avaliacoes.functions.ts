import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables in server function.");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (supabaseKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supabaseKey}`) {
          h.delete("Authorization");
        }
        h.set("apikey", supabaseKey);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Impressão digital do IP: só o hash é persistido, nunca o IP em claro. */
async function hashIp() {
  try {
    const req = getRequest();
    const bruto =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip");
    if (!bruto) return null;
    const bytes = new TextEncoder().encode(`praxa:${bruto}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export const obterConvite = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows } = await supabase.rpc("convite_avaliacao_info", { _token: data.token });
    const convite = rows?.[0];
    if (!convite) return null;
    return {
      prestadorSlug: convite.prestador_slug,
      prestadorNome: convite.prestador_nome,
      clienteNome: convite.cliente_nome,
      valido: convite.valido,
    };
  });

const avaliacaoSchema = z
  .object({
    prestadorSlug: z.string().min(1).max(160),
    nota: z.number().int().min(1).max(5),
    comentario: z.string().trim().min(20).max(2000),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    cnpj: z.string().trim().max(20).optional().or(z.literal("")),
    token: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.token || v.cnpj || v.email), {
    message: "Informe convite, CNPJ ou e-mail corporativo",
  });

export const enviarAvaliacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => avaliacaoSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.rpc("registrar_avaliacao", {
      _prestador_slug: data.prestadorSlug,
      _nota: data.nota,
      _comentario: data.comentario,
      _cliente_email: data.email || undefined,
      _cliente_cnpj: data.cnpj || undefined,
      _token_convite: data.token || undefined,
      _ip_hash: (await hashIp()) ?? undefined,
    });

    if (error) {
      // A mensagem das exceções da RPC é escrita para o cliente final.
      const msg = error.message?.replace(/^.*?:\s*/, "") ?? "";
      return {
        ok: false as const,
        erro: msg.length > 4 && msg.length < 220 ? msg : "Não foi possível registrar a avaliação.",
      };
    }
    return { ok: true as const };
  });
