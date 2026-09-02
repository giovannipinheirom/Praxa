-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Enums
CREATE TYPE public.account_type AS ENUM ('cliente', 'prestador', 'freelancer');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.categoria_servico AS ENUM ('contabilidade', 'marketing', 'juridico', 'ti', 'rh', 'outros');
CREATE TYPE public.faixa_preco AS ENUM ('$', '$$', '$$$');
CREATE TYPE public.metodo_verificacao AS ENUM ('cnpj', 'email_corporativo', 'convite_prestador');
CREATE TYPE public.status_assinatura AS ENUM ('ativa', 'cancelada', 'trial');
CREATE TYPE public.status_conta_prestador AS ENUM ('ativo', 'suspenso', 'pendente_verificacao');
CREATE TYPE public.status_contato AS ENUM ('novo', 'em_conversa', 'proposta_enviada', 'fechado', 'perdido');
CREATE TYPE public.status_demanda AS ENUM ('aberta', 'em_contato', 'fechada');
CREATE TYPE public.status_proposta AS ENUM ('rascunho', 'enviada', 'aceita', 'recusada');
CREATE TYPE public.tipo_evento_transacional AS ENUM ('reuniao_agendada', 'contrato_assinado', 'pagamento_processado');
CREATE TYPE public.tipo_prestador AS ENUM ('freelancer', 'agencia');

-- 2. Create Tables

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type public.account_type NOT NULL DEFAULT 'cliente',
  full_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.planos_assinatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco_mensal NUMERIC NOT NULL,
  preco_promocional NUMERIC,
  recursos JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.prestadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  nome_negocio TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria_principal public.categoria_servico NOT NULL,
  subcategorias TEXT[] NOT NULL DEFAULT '{}',
  regiao_atendimento TEXT NOT NULL,
  tipo_prestador public.tipo_prestador,
  faixa_preco public.faixa_preco NOT NULL DEFAULT '$',
  
  cnpj TEXT,
  cnpj_verificado BOOLEAN DEFAULT FALSE,
  empresa_verificada BOOLEAN DEFAULT FALSE,
  socios_identificados BOOLEAN DEFAULT FALSE,
  ano_fundacao INTEGER,
  
  cidade TEXT,
  estado TEXT,
  
  headline TEXT,
  foto_perfil_url TEXT,
  modelo_trabalho TEXT,
  modelo_precificacao TEXT,
  tamanho_equipe TEXT,
  equipe JSONB,
  portfolio JSONB,
  perguntas_frequentes JSONB,
  
  email_contato TEXT,
  whatsapp TEXT,
  site_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  
  tempo_medio_resposta_horas NUMERIC,
  nota_media NUMERIC NOT NULL DEFAULT 0,
  total_avaliacoes INTEGER NOT NULL DEFAULT 0,
  total_clientes_atendidos INTEGER NOT NULL DEFAULT 0,
  
  status_conta public.status_conta_prestador NOT NULL DEFAULT 'pendente_verificacao',
  plano_atual UUID REFERENCES public.planos_assinatura(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.assinaturas_prestador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos_assinatura(id),
  status public.status_assinatura NOT NULL DEFAULT 'ativa',
  preco_pago NUMERIC NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim_preco_promocional TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.demandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contato_email TEXT,
  descricao_necessidade TEXT NOT NULL,
  categoria public.categoria_servico NOT NULL,
  regiao TEXT NOT NULL,
  orcamento_estimado NUMERIC,
  status public.status_demanda NOT NULL DEFAULT 'aberta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.crm_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  demanda_id UUID REFERENCES public.demandas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  origem TEXT NOT NULL DEFAULT 'direto',
  status public.status_contato NOT NULL DEFAULT 'novo',
  anotacoes TEXT,
  probabilidade NUMERIC NOT NULL DEFAULT 0,
  valor_estimado NUMERIC,
  valor_fechado NUMERIC,
  proxima_acao TEXT,
  proxima_acao_em TIMESTAMPTZ,
  fechado_em TIMESTAMPTZ,
  motivo_perda TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.compromissos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.crm_contatos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ,
  local TEXT,
  link_reuniao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  cliente_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cliente_email TEXT,
  nota NUMERIC NOT NULL,
  comentario TEXT NOT NULL,
  resposta_prestador TEXT,
  verificado BOOLEAN NOT NULL DEFAULT FALSE,
  metodo_verificacao public.metodo_verificacao,
  cliente_recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.avaliacoes_sinais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE UNIQUE,
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  flags TEXT[] NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  conta_criada_em TIMESTAMPTZ,
  revisado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.convites_avaliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  cliente_email TEXT,
  cliente_nome TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  metodo_verificacao public.metodo_verificacao NOT NULL DEFAULT 'convite_prestador',
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  expira_em TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.propostas_prestador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.crm_contatos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  cliente_nome TEXT NOT NULL,
  escopo TEXT NOT NULL,
  condicoes TEXT,
  valor NUMERIC,
  prazo_dias INTEGER,
  validade_dias INTEGER NOT NULL DEFAULT 7,
  status public.status_proposta NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.destaques_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  regiao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.dominios_email_genericos (
  dominio TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.eventos_transacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  demanda_id UUID REFERENCES public.demandas(id) ON DELETE SET NULL,
  tipo_evento public.tipo_evento_transacional NOT NULL,
  valor_taxa NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  acao TEXT NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  ator_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);


-- 3. Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_prestador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compromissos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_sinais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas_prestador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destaques_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dominios_email_genericos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_transacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (public) but only edit their own.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Prestadores: Viewable by all, editable by the owner profile
CREATE POLICY "Prestadores are viewable by everyone." ON public.prestadores FOR SELECT USING (true);
CREATE POLICY "Users can insert their own prestador." ON public.prestadores FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their own prestador." ON public.prestadores FOR UPDATE USING (auth.uid() = profile_id);

-- Planos: Viewable by all
CREATE POLICY "Planos are viewable by everyone." ON public.planos_assinatura FOR SELECT USING (true);

-- CRM & Propostas: Only accessible by the prestador owner
CREATE POLICY "Prestadores can manage their own crm_contatos" ON public.crm_contatos FOR ALL USING (
  prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid())
);

CREATE POLICY "Prestadores can manage their own compromissos" ON public.compromissos FOR ALL USING (
  prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid())
);

CREATE POLICY "Prestadores can manage their own propostas" ON public.propostas_prestador FOR ALL USING (
  prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid())
);

-- Avaliacoes: Viewable by all. 
CREATE POLICY "Avaliacoes are viewable by everyone." ON public.avaliacoes FOR SELECT USING (true);

-- Demandas: Viewable by the creator or by all if it's open (depending on rules, let's keep it simple for now)
CREATE POLICY "Demandas are viewable by everyone." ON public.demandas FOR SELECT USING (true);
CREATE POLICY "Users can insert their own demandas." ON public.demandas FOR INSERT WITH CHECK (auth.uid() = cliente_profile_id OR cliente_profile_id IS NULL);
CREATE POLICY "Users can update their own demandas." ON public.demandas FOR UPDATE USING (auth.uid() = cliente_profile_id);


-- 4. Triggers

-- Trigger to create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, account_type, company_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário ' || new.id),
    new.email,
    COALESCE((new.raw_user_meta_data->>'account_type')::public.account_type, 'cliente'),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to main tables
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER set_updated_at_prestadores BEFORE UPDATE ON public.prestadores FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER set_updated_at_demandas BEFORE UPDATE ON public.demandas FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER set_updated_at_crm_contatos BEFORE UPDATE ON public.crm_contatos FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER set_updated_at_avaliacoes BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER set_updated_at_propostas BEFORE UPDATE ON public.propostas_prestador FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Add generic email domains (example list, modify as needed)
INSERT INTO public.dominios_email_genericos (dominio) VALUES
('gmail.com'), ('hotmail.com'), ('outlook.com'), ('yahoo.com'), ('yahoo.com.br'), ('uol.com.br'), ('bol.com.br');
