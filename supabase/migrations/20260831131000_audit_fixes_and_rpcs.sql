-- ==========================================
-- FASE 1: Políticas de Segurança (RLS)
-- ==========================================

-- Assinaturas Prestador (Insert/Update para donos, Admin tem acesso total)
CREATE POLICY "Prestadores podem criar assinaturas." ON public.assinaturas_prestador 
  FOR INSERT WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));

CREATE POLICY "Prestadores podem ver suas assinaturas." ON public.assinaturas_prestador 
  FOR SELECT USING (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));

-- Destaques Pagos (Insert/Update para donos)
CREATE POLICY "Prestadores podem criar destaques." ON public.destaques_pagos 
  FOR INSERT WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));

CREATE POLICY "Destaques são visíveis por todos." ON public.destaques_pagos 
  FOR SELECT USING (true);

-- Convites de Avaliação
CREATE POLICY "Prestadores podem gerenciar convites." ON public.convites_avaliacao 
  FOR ALL USING (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));

-- Eventos Transacionais
CREATE POLICY "Prestadores podem ver seus eventos." ON public.eventos_transacionais
  FOR SELECT USING (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));

-- Avaliações Sinais (Admins podem ver tudo)
CREATE POLICY "Admins podem gerenciar sinais de fraude" ON public.avaliacoes_sinais
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Criar as de INSERT explícitas para garantir a segurança no nível `WITH CHECK`:
CREATE POLICY "Insert Propostas" ON public.propostas_prestador
  FOR INSERT WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));
CREATE POLICY "Insert Compromissos" ON public.compromissos
  FOR INSERT WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));
CREATE POLICY "Insert CRM" ON public.crm_contatos
  FOR INSERT WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE profile_id = auth.uid()));


-- ==========================================
-- FASE 2: Índices de Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_prestadores_profile ON public.prestadores(profile_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador ON public.avaliacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_crm_contatos_prestador ON public.crm_contatos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON public.demandas(categoria);
CREATE INDEX IF NOT EXISTS idx_assinaturas_prestador ON public.assinaturas_prestador(prestador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_sinais_prestador ON public.avaliacoes_sinais(prestador_id);
CREATE INDEX IF NOT EXISTS idx_convites_prestador ON public.convites_avaliacao(prestador_id);


-- ==========================================
-- FASE 3: Funções (RPCs) - Lógica de Negócio
-- ==========================================

-- 1. has_role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2. owns_prestador
CREATE OR REPLACE FUNCTION public.owns_prestador(_prestador_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores 
    WHERE id = _prestador_id AND profile_id = auth.uid()
  );
$$;

-- 3. prestador_publico (Prestador ativo?)
CREATE OR REPLACE FUNCTION public.prestador_publico(_prestador_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores 
    WHERE id = _prestador_id AND status_conta = 'ativo' AND deleted_at IS NULL
  );
$$;

-- 4. cnpj_valido 
CREATE OR REPLACE FUNCTION public.cnpj_valido(_cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN length(regexp_replace(_cnpj, '\D', '', 'g')) = 14;
END;
$$;

-- 5. email_corporativo
CREATE OR REPLACE FUNCTION public.email_corporativo(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_dominio TEXT;
BEGIN
  v_dominio := split_part(_email, '@', 2);
  RETURN NOT EXISTS (
    SELECT 1 FROM public.dominios_email_genericos WHERE dominio = v_dominio
  );
END;
$$;

-- 6. ensure_user_bootstrap
CREATE OR REPLACE FUNCTION public.ensure_user_bootstrap(
  _account_type public.account_type DEFAULT 'cliente',
  _company_name TEXT DEFAULT NULL,
  _full_name TEXT DEFAULT NULL
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, account_type, full_name, company_name)
    VALUES (v_uid, _account_type, COALESCE(_full_name, 'Novo Usuário'), _company_name)
    RETURNING * INTO v_profile;
  ELSE
    UPDATE public.profiles 
    SET 
      account_type = COALESCE(_account_type, account_type),
      company_name = COALESCE(_company_name, company_name),
      full_name = COALESCE(_full_name, full_name),
      updated_at = NOW()
    WHERE id = v_uid
    RETURNING * INTO v_profile;
  END IF;

  RETURN NEXT v_profile;
END;
$$;

-- 7. convite_avaliacao_info
CREATE OR REPLACE FUNCTION public.convite_avaliacao_info(_token TEXT)
RETURNS TABLE (
  cliente_nome TEXT,
  prestador_nome TEXT,
  prestador_slug TEXT,
  valido BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cliente_nome,
    p.nome_negocio AS prestador_nome,
    p.slug AS prestador_slug,
    (c.usado = FALSE AND c.expira_em > NOW()) AS valido
  FROM public.convites_avaliacao c
  JOIN public.prestadores p ON p.id = c.prestador_id
  WHERE c.token = _token
  LIMIT 1;
END;
$$;

-- 8. pipeline_resumo
CREATE OR REPLACE FUNCTION public.pipeline_resumo(_prestador_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Segurança
  IF NOT public.owns_prestador(_prestador_id) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT json_build_object(
    'total_leads', COUNT(*),
    'novos', COUNT(*) FILTER (WHERE status = 'novo'),
    'em_conversa', COUNT(*) FILTER (WHERE status = 'em_conversa'),
    'propostas_enviadas', COUNT(*) FILTER (WHERE status = 'proposta_enviada'),
    'fechados', COUNT(*) FILTER (WHERE status = 'fechado'),
    'perdidos', COUNT(*) FILTER (WHERE status = 'perdido'),
    'valor_potencial', COALESCE(SUM(valor_estimado) FILTER (WHERE status != 'perdido' AND status != 'fechado'), 0),
    'valor_fechado', COALESCE(SUM(valor_fechado) FILTER (WHERE status = 'fechado'), 0)
  ) INTO v_result
  FROM public.crm_contatos
  WHERE prestador_id = _prestador_id AND deleted_at IS NULL;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- 9. registrar_avaliacao
CREATE OR REPLACE FUNCTION public.registrar_avaliacao(
  _comentario TEXT,
  _nota NUMERIC,
  _prestador_slug TEXT,
  _cliente_cnpj TEXT DEFAULT NULL,
  _cliente_email TEXT DEFAULT NULL,
  _ip_hash TEXT DEFAULT NULL,
  _token_convite TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prestador_id UUID;
  v_cliente_profile_id UUID := auth.uid();
  v_avaliacao_id UUID;
  v_metodo public.metodo_verificacao := NULL;
  v_flags TEXT[] := '{}';
BEGIN
  -- 1. Achar o prestador
  SELECT id INTO v_prestador_id FROM public.prestadores WHERE slug = _prestador_slug;
  IF v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'Prestador não encontrado';
  END IF;

  -- 2. Validar token se existir
  IF _token_convite IS NOT NULL THEN
    UPDATE public.convites_avaliacao 
    SET usado = TRUE 
    WHERE token = _token_convite AND prestador_id = v_prestador_id AND usado = FALSE AND expira_em > NOW()
    RETURNING metodo_verificacao INTO v_metodo;
  END IF;

  -- 3. Definir método se não for convite
  IF v_metodo IS NULL THEN
    IF _cliente_cnpj IS NOT NULL AND public.cnpj_valido(_cliente_cnpj) THEN
      v_metodo := 'cnpj';
    ELSIF _cliente_email IS NOT NULL AND public.email_corporativo(_cliente_email) THEN
      v_metodo := 'email_corporativo';
    END IF;
  END IF;

  -- 4. Inserir avaliação
  INSERT INTO public.avaliacoes (
    prestador_id, cliente_profile_id, cliente_email, nota, comentario, verificado, metodo_verificacao
  ) VALUES (
    v_prestador_id, v_cliente_profile_id, COALESCE(_cliente_email, (SELECT email FROM auth.users WHERE id = v_cliente_profile_id)),
    _nota, _comentario, (v_metodo IS NOT NULL), v_metodo
  ) RETURNING id INTO v_avaliacao_id;

  -- 5. Atualizar médias do prestador
  UPDATE public.prestadores 
  SET 
    total_avaliacoes = total_avaliacoes + 1,
    nota_media = (
      SELECT ROUND(AVG(nota)::numeric, 1) 
      FROM public.avaliacoes 
      WHERE prestador_id = v_prestador_id AND deleted_at IS NULL
    )
  WHERE id = v_prestador_id;

  -- 6. Inserir sinais antifraude
  IF _ip_hash IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM public.avaliacoes_sinais WHERE ip_hash = _ip_hash AND prestador_id = v_prestador_id AND created_at > NOW() - INTERVAL '1 day') THEN
      v_flags := array_append(v_flags, 'mesmo_ip');
    END IF;
  END IF;
  
  IF (SELECT COUNT(*) FROM public.avaliacoes WHERE prestador_id = v_prestador_id AND created_at > NOW() - INTERVAL '1 day') > 5 THEN
    v_flags := array_append(v_flags, 'muitas_no_mesmo_dia');
  END IF;

  INSERT INTO public.avaliacoes_sinais (avaliacao_id, prestador_id, flags, ip_hash)
  VALUES (v_avaliacao_id, v_prestador_id, v_flags, _ip_hash);

  RETURN v_avaliacao_id;
END;
$$;

-- 10. posicao_ranking_categoria
CREATE OR REPLACE FUNCTION public.posicao_ranking_categoria(_prestador_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY nota_media DESC, total_avaliacoes DESC) as pos
    FROM public.prestadores
    WHERE categoria_principal = (SELECT categoria_principal FROM public.prestadores WHERE id = _prestador_id)
      AND status_conta = 'ativo'
  )
  SELECT pos::integer FROM ranked WHERE id = _prestador_id;
$$;

-- 11. demandas_compativeis_count
CREATE OR REPLACE FUNCTION public.demandas_compativeis_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(DISTINCT d.id)::integer
  FROM public.demandas d
  JOIN public.prestadores p ON d.categoria = p.categoria_principal
  WHERE p.profile_id = auth.uid() AND d.status = 'aberta';
$$;

-- 12. limite_avaliacoes_semana
CREATE OR REPLACE FUNCTION public.limite_avaliacoes_semana()
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT 10;
$$;

-- 13. tem_acesso_pool
CREATE OR REPLACE FUNCTION public.tem_acesso_pool()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assinaturas_prestador ap
    JOIN public.prestadores p ON ap.prestador_id = p.id
    WHERE p.profile_id = auth.uid() AND ap.status = 'ativa'
  );
$$;

-- 14. vagas_promocionais_restantes
CREATE OR REPLACE FUNCTION public.vagas_promocionais_restantes()
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT 15;
$$;

-- 15. rotacao_destaque
CREATE OR REPLACE FUNCTION public.rotacao_destaque(_categoria TEXT, _regiao TEXT)
RETURNS TABLE (
  concorrentes INTEGER,
  ja_ativo BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ativo BOOLEAN;
  v_concorrentes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_concorrentes FROM public.destaques_pagos WHERE categoria = _categoria AND regiao = _regiao AND ativo = TRUE;
  SELECT EXISTS(
    SELECT 1 FROM public.destaques_pagos d
    JOIN public.prestadores p ON d.prestador_id = p.id
    WHERE d.categoria = _categoria AND d.regiao = _regiao AND d.ativo = TRUE AND p.profile_id = auth.uid()
  ) INTO v_ativo;
  RETURN QUERY SELECT v_concorrentes, v_ativo;
END;
$$;
