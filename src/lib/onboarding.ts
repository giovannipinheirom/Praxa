import { supabase } from "@/integrations/supabase/client";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Valida os dígitos verificadores de um CNPJ (espelha `cnpj_valido` no banco). */
export function cnpjValido(valor: string) {
  const d = valor.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const dv = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, i) => acc + Number(d[i]) * peso, 0);
    const resto = 11 - (soma % 11);
    return resto >= 10 ? 0 : resto;
  };

  return (
    dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
    dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}

/**
 * Garante que exista uma linha em `profiles` para o usuário logado.
 * Nenhuma outra tabela pode referenciar o usuário sem esse registro.
 */
export async function ensureProfile(params?: {
  fullName?: string;
  companyName?: string;
  accountType?: "cliente" | "prestador" | "freelancer";
  telefone?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("sessão expirada, entre novamente");

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const payload = {
    id: user.id,
    full_name: params?.fullName || meta.full_name || meta.name || user.email || "",
    email: user.email ?? null,
    phone: params?.telefone || meta.phone || null,
    account_type: (params?.accountType ??
      (meta.account_type as "cliente" | "prestador" | "freelancer" | undefined) ??
      "cliente") as never,
    company_name: params?.companyName || meta.company_name || null,
  };

  if (existing) {
    const patch: {
      full_name?: string;
      company_name?: string;
      phone?: string;
      account_type?: "cliente" | "prestador" | "freelancer";
    } = {};
    if (params?.fullName) patch.full_name = params.fullName;
    if (params?.companyName) patch.company_name = params.companyName;
    if (params?.telefone) patch.phone = params.telefone;
    if (params?.accountType) patch.account_type = params.accountType;
    if (Object.keys(patch).length) {
      await supabase.from("profiles").update(patch).eq("id", user.id);
    }

    return user.id;
  }

  const { error } = await supabase.from("profiles").insert(payload);
  if (error && error.code !== "23505") throw error;
  return user.id;
}

/**
 * Garante que o prestador logado tenha um registro em `prestadores`.
 */
export async function ensurePrestadorRecord(params: {
  userId: string;
  nomeNegocio: string;
  tipo?: "agencia" | "freelancer";
}) {
  await ensureProfile({ 
    accountType: params.tipo === "freelancer" ? "freelancer" : "prestador", 
    companyName: params.nomeNegocio 
  });

  const { data: existing } = await supabase
    .from("prestadores")
    .select("id, slug")
    .eq("profile_id", params.userId)
    .maybeSingle();

  if (existing) return existing;

  const base = slugify(params.nomeNegocio) || "prestador";
  const slug = `${base}-${params.userId.slice(0, 6)}`;

  const { data, error } = await supabase
    .from("prestadores")
    .insert({
      profile_id: params.userId,
      nome_negocio: params.nomeNegocio,
      slug,
      status_conta: "pendente_verificacao",
      tipo_prestador: params.tipo ?? "agencia",
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfileContact(params: {
  userId: string;
  telefone?: string;
}) {
  await ensureProfile({ telefone: params.telefone });
}
