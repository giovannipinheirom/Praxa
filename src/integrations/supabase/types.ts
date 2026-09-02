export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assinaturas_prestador: {
        Row: {
          created_at: string
          data_fim_preco_promocional: string | null
          data_inicio: string
          id: string
          plano_id: string
          preco_pago: number
          prestador_id: string
          status: Database["public"]["Enums"]["status_assinatura"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_preco_promocional?: string | null
          data_inicio?: string
          id?: string
          plano_id: string
          preco_pago?: number
          prestador_id: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_preco_promocional?: string | null
          data_inicio?: string
          id?: string
          plano_id?: string
          preco_pago?: number
          prestador_id?: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_prestador_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_assinatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_prestador_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          ator_id: string | null
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: number
          registro_id: string | null
          tabela: string
        }
        Insert: {
          acao: string
          ator_id?: string | null
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: number
          registro_id?: string | null
          tabela: string
        }
        Update: {
          acao?: string
          ator_id?: string | null
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: number
          registro_id?: string | null
          tabela?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          cliente_email: string | null
          cliente_profile_id: string | null
          cliente_recorrente: boolean
          comentario: string
          created_at: string
          deleted_at: string | null
          id: string
          metodo_verificacao:
            | Database["public"]["Enums"]["metodo_verificacao"]
            | null
          nota: number
          prestador_id: string
          resposta_prestador: string | null
          updated_at: string
          verificado: boolean
        }
        Insert: {
          cliente_email?: string | null
          cliente_profile_id?: string | null
          cliente_recorrente?: boolean
          comentario?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          metodo_verificacao?:
            | Database["public"]["Enums"]["metodo_verificacao"]
            | null
          nota: number
          prestador_id: string
          resposta_prestador?: string | null
          updated_at?: string
          verificado?: boolean
        }
        Update: {
          cliente_email?: string | null
          cliente_profile_id?: string | null
          cliente_recorrente?: boolean
          comentario?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          metodo_verificacao?:
            | Database["public"]["Enums"]["metodo_verificacao"]
            | null
          nota?: number
          prestador_id?: string
          resposta_prestador?: string | null
          updated_at?: string
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_cliente_profile_id_fkey"
            columns: ["cliente_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_sinais: {
        Row: {
          avaliacao_id: string
          conta_criada_em: string | null
          created_at: string
          flags: string[]
          id: string
          ip_hash: string | null
          prestador_id: string
          revisado: boolean
          updated_at: string
        }
        Insert: {
          avaliacao_id: string
          conta_criada_em?: string | null
          created_at?: string
          flags?: string[]
          id?: string
          ip_hash?: string | null
          prestador_id: string
          revisado?: boolean
          updated_at?: string
        }
        Update: {
          avaliacao_id?: string
          conta_criada_em?: string | null
          created_at?: string
          flags?: string[]
          id?: string
          ip_hash?: string | null
          prestador_id?: string
          revisado?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_sinais_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: true
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_sinais_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      compromissos: {
        Row: {
          contato_id: string | null
          created_at: string
          deleted_at: string | null
          descricao: string | null
          fim: string | null
          id: string
          inicio: string
          link_reuniao: string | null
          local: string | null
          prestador_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio: string
          link_reuniao?: string | null
          local?: string | null
          prestador_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          link_reuniao?: string | null
          local?: string | null
          prestador_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_avaliacao: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          created_at: string
          expira_em: string
          id: string
          metodo_verificacao: Database["public"]["Enums"]["metodo_verificacao"]
          prestador_id: string
          token: string
          usado: boolean
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          expira_em?: string
          id?: string
          metodo_verificacao?: Database["public"]["Enums"]["metodo_verificacao"]
          prestador_id: string
          token?: string
          usado?: boolean
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          expira_em?: string
          id?: string
          metodo_verificacao?: Database["public"]["Enums"]["metodo_verificacao"]
          prestador_id?: string
          token?: string
          usado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "convites_avaliacao_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contatos: {
        Row: {
          anotacoes: string | null
          created_at: string
          deleted_at: string | null
          demanda_id: string | null
          email: string | null
          fechado_em: string | null
          id: string
          motivo_perda: string | null
          nome: string
          origem: string
          prestador_id: string
          probabilidade: number
          proxima_acao: string | null
          proxima_acao_em: string | null
          status: Database["public"]["Enums"]["status_contato"]
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
          valor_fechado: number | null
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string
          deleted_at?: string | null
          demanda_id?: string | null
          email?: string | null
          fechado_em?: string | null
          id?: string
          motivo_perda?: string | null
          nome: string
          origem?: string
          prestador_id: string
          probabilidade?: number
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          status?: Database["public"]["Enums"]["status_contato"]
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
        }
        Update: {
          anotacoes?: string | null
          created_at?: string
          deleted_at?: string | null
          demanda_id?: string | null
          email?: string | null
          fechado_em?: string | null
          id?: string
          motivo_perda?: string | null
          nome?: string
          origem?: string
          prestador_id?: string
          probabilidade?: number
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          status?: Database["public"]["Enums"]["status_contato"]
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contatos_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contatos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_servico"]
          cliente_profile_id: string | null
          contato_email: string | null
          created_at: string
          deleted_at: string | null
          descricao_necessidade: string
          id: string
          orcamento_estimado: number | null
          regiao: string
          status: Database["public"]["Enums"]["status_demanda"]
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_servico"]
          cliente_profile_id?: string | null
          contato_email?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao_necessidade?: string
          id?: string
          orcamento_estimado?: number | null
          regiao?: string
          status?: Database["public"]["Enums"]["status_demanda"]
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_servico"]
          cliente_profile_id?: string | null
          contato_email?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao_necessidade?: string
          id?: string
          orcamento_estimado?: number | null
          regiao?: string
          status?: Database["public"]["Enums"]["status_demanda"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_cliente_profile_id_fkey"
            columns: ["cliente_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      destaques_pagos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          id: string
          prestador_id: string
          regiao: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          id?: string
          prestador_id: string
          regiao?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          prestador_id?: string
          regiao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destaques_pagos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      dominios_email_genericos: {
        Row: {
          created_at: string
          dominio: string
        }
        Insert: {
          created_at?: string
          dominio: string
        }
        Update: {
          created_at?: string
          dominio?: string
        }
        Relationships: []
      }
      eventos_transacionais: {
        Row: {
          created_at: string
          demanda_id: string | null
          id: string
          prestador_id: string
          tipo_evento: Database["public"]["Enums"]["tipo_evento_transacional"]
          valor_taxa: number
        }
        Insert: {
          created_at?: string
          demanda_id?: string | null
          id?: string
          prestador_id: string
          tipo_evento: Database["public"]["Enums"]["tipo_evento_transacional"]
          valor_taxa?: number
        }
        Update: {
          created_at?: string
          demanda_id?: string | null
          id?: string
          prestador_id?: string
          tipo_evento?: Database["public"]["Enums"]["tipo_evento_transacional"]
          valor_taxa?: number
        }
        Relationships: [
          {
            foreignKeyName: "eventos_transacionais_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_transacionais_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_assinatura: {
        Row: {
          created_at: string
          id: string
          nome: string
          preco_mensal: number
          preco_promocional: number | null
          recursos: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          preco_mensal?: number
          preco_promocional?: number | null
          recursos?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          preco_mensal?: number
          preco_promocional?: number | null
          recursos?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      prestadores: {
        Row: {
          ano_fundacao: number | null
          categoria_principal: Database["public"]["Enums"]["categoria_servico"]
          cidade: string | null
          cnpj: string | null
          cnpj_verificado: boolean | null
          created_at: string
          deleted_at: string | null
          descricao: string
          email_contato: string | null
          empresa_verificada: boolean | null
          equipe: Json | null
          estado: string | null
          faixa_preco: Database["public"]["Enums"]["faixa_preco"]
          foto_perfil_url: string | null
          headline: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          modelo_precificacao: string | null
          modelo_trabalho: string | null
          nome_negocio: string
          nota_media: number
          perguntas_frequentes: Json | null
          plano_atual: string | null
          portfolio: Json | null
          profile_id: string
          regiao_atendimento: string
          site_url: string | null
          slug: string
          socios_identificados: boolean | null
          status_conta: Database["public"]["Enums"]["status_conta_prestador"]
          subcategorias: string[]
          tamanho_equipe: string | null
          tempo_medio_resposta_horas: number | null
          tipo_prestador: Database["public"]["Enums"]["tipo_prestador"] | null
          total_avaliacoes: number
          total_clientes_atendidos: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ano_fundacao?: number | null
          categoria_principal?: Database["public"]["Enums"]["categoria_servico"]
          cidade?: string | null
          cnpj?: string | null
          cnpj_verificado?: boolean | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string
          email_contato?: string | null
          empresa_verificada?: boolean | null
          equipe?: Json | null
          estado?: string | null
          faixa_preco?: Database["public"]["Enums"]["faixa_preco"]
          foto_perfil_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          modelo_precificacao?: string | null
          modelo_trabalho?: string | null
          nome_negocio: string
          nota_media?: number
          perguntas_frequentes?: Json | null
          plano_atual?: string | null
          portfolio?: Json | null
          profile_id: string
          regiao_atendimento?: string
          site_url?: string | null
          slug: string
          socios_identificados?: boolean | null
          status_conta?: Database["public"]["Enums"]["status_conta_prestador"]
          subcategorias?: string[]
          tamanho_equipe?: string | null
          tempo_medio_resposta_horas?: number | null
          tipo_prestador?: Database["public"]["Enums"]["tipo_prestador"] | null
          total_avaliacoes?: number
          total_clientes_atendidos?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ano_fundacao?: number | null
          categoria_principal?: Database["public"]["Enums"]["categoria_servico"]
          cidade?: string | null
          cnpj?: string | null
          cnpj_verificado?: boolean | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string
          email_contato?: string | null
          empresa_verificada?: boolean | null
          equipe?: Json | null
          estado?: string | null
          faixa_preco?: Database["public"]["Enums"]["faixa_preco"]
          foto_perfil_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          modelo_precificacao?: string | null
          modelo_trabalho?: string | null
          nome_negocio?: string
          nota_media?: number
          perguntas_frequentes?: Json | null
          plano_atual?: string | null
          portfolio?: Json | null
          profile_id?: string
          regiao_atendimento?: string
          site_url?: string | null
          slug?: string
          socios_identificados?: boolean | null
          status_conta?: Database["public"]["Enums"]["status_conta_prestador"]
          subcategorias?: string[]
          tamanho_equipe?: string | null
          tempo_medio_resposta_horas?: number | null
          tipo_prestador?: Database["public"]["Enums"]["tipo_prestador"] | null
          total_avaliacoes?: number
          total_clientes_atendidos?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_plano_atual_fkey"
            columns: ["plano_atual"]
            isOneToOne: false
            referencedRelation: "planos_assinatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      propostas_prestador: {
        Row: {
          cliente_nome: string
          condicoes: string | null
          contato_id: string | null
          created_at: string
          deleted_at: string | null
          escopo: string
          id: string
          prazo_dias: number | null
          prestador_id: string
          status: Database["public"]["Enums"]["status_proposta"]
          titulo: string
          updated_at: string
          validade_dias: number
          valor: number | null
        }
        Insert: {
          cliente_nome: string
          condicoes?: string | null
          contato_id?: string | null
          created_at?: string
          deleted_at?: string | null
          escopo: string
          id?: string
          prazo_dias?: number | null
          prestador_id: string
          status?: Database["public"]["Enums"]["status_proposta"]
          titulo: string
          updated_at?: string
          validade_dias?: number
          valor?: number | null
        }
        Update: {
          cliente_nome?: string
          condicoes?: string | null
          contato_id?: string | null
          created_at?: string
          deleted_at?: string | null
          escopo?: string
          id?: string
          prazo_dias?: number | null
          prestador_id?: string
          status?: Database["public"]["Enums"]["status_proposta"]
          titulo?: string
          updated_at?: string
          validade_dias?: number
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_prestador_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_prestador_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cnpj_valido: { Args: { _cnpj: string }; Returns: boolean }
      convite_avaliacao_info: {
        Args: { _token: string }
        Returns: {
          cliente_nome: string
          prestador_nome: string
          prestador_slug: string
          valido: boolean
        }[]
      }
      demandas_compativeis_count: { Args: never; Returns: number }
      email_corporativo: { Args: { _email: string }; Returns: boolean }
      ensure_user_bootstrap: {
        Args: {
          _account_type?: Database["public"]["Enums"]["account_type"]
          _company_name?: string
          _full_name?: string
        }
        Returns: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      limite_avaliacoes_semana: { Args: never; Returns: number }
      owns_prestador: { Args: { _prestador_id: string }; Returns: boolean }
      pipeline_resumo: { Args: { _prestador_id: string }; Returns: Json }
      posicao_ranking_categoria: {
        Args: { _prestador_id: string }
        Returns: number
      }
      prestador_publico: { Args: { _prestador_id: string }; Returns: boolean }
      registrar_avaliacao: {
        Args: {
          _cliente_cnpj?: string
          _cliente_email?: string
          _comentario: string
          _ip_hash?: string
          _nota: number
          _prestador_slug: string
          _token_convite?: string
        }
        Returns: string
      }
      rotacao_destaque: {
        Args: { _categoria: string; _regiao: string }
        Returns: {
          concorrentes: number
          ja_ativo: boolean
        }[]
      }
      tem_acesso_pool: { Args: never; Returns: boolean }
      vagas_promocionais_restantes: { Args: never; Returns: number }
    }
    Enums: {
      account_type: "cliente" | "prestador" | "freelancer"
      app_role: "admin" | "moderator" | "user"
      categoria_servico:
        | "contabilidade"
        | "marketing"
        | "juridico"
        | "ti"
        | "rh"
        | "outros"
      faixa_preco: "$" | "$$" | "$$$"
      metodo_verificacao: "cnpj" | "email_corporativo" | "convite_prestador"
      status_assinatura: "ativa" | "cancelada" | "trial"
      status_conta_prestador: "ativo" | "suspenso" | "pendente_verificacao"
      status_contato:
        | "novo"
        | "em_conversa"
        | "proposta_enviada"
        | "fechado"
        | "perdido"
      status_demanda: "aberta" | "em_contato" | "fechada"
      status_proposta: "rascunho" | "enviada" | "aceita" | "recusada"
      tipo_evento_transacional:
        | "reuniao_agendada"
        | "contrato_assinado"
        | "pagamento_processado"
      tipo_prestador: "freelancer" | "agencia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["cliente", "prestador", "freelancer"],
      app_role: ["admin", "moderator", "user"],
      categoria_servico: [
        "contabilidade",
        "marketing",
        "juridico",
        "ti",
        "rh",
        "outros",
      ],
      faixa_preco: ["$", "$$", "$$$"],
      metodo_verificacao: ["cnpj", "email_corporativo", "convite_prestador"],
      status_assinatura: ["ativa", "cancelada", "trial"],
      status_conta_prestador: ["ativo", "suspenso", "pendente_verificacao"],
      status_contato: [
        "novo",
        "em_conversa",
        "proposta_enviada",
        "fechado",
        "perdido",
      ],
      status_demanda: ["aberta", "em_contato", "fechada"],
      status_proposta: ["rascunho", "enviada", "aceita", "recusada"],
      tipo_evento_transacional: [
        "reuniao_agendada",
        "contrato_assinado",
        "pagamento_processado",
      ],
      tipo_prestador: ["freelancer", "agencia"],
    },
  },
} as const
