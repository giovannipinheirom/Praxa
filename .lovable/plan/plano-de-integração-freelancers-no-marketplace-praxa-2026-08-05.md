# Plano de Integração: Freelancers no Marketplace Praxa

Este plano detalha as alterações necessárias para integrar contas de freelancers (profissionais autônomos) como uma categoria distinta e otimizada dentro da plataforma, que atualmente foca em empresas prestadoras de serviço.

## 1. Estrutura de Dados (Banco de Dados)

Atualmente, o sistema diferencia apenas entre `cliente` e `prestador`. Freelancers serão tratados como `prestadores`, mas com metadados específicos.

### Alterações Sugeridas:
- **Enum `tipo_prestador`**: Adicionar um novo enum no banco: `freelancer` | `agencia`.
- **Tabela `prestadores`**:
    - Adicionar coluna `tipo_prestador` (default: 'agencia').
    - Ajustar `tamanho_equipe` para que, se for freelancer, o valor seja fixo em "1 (Eu mesmo)".
- **Migração SQL**: 
    - Criar o enum e adicionar a coluna.
    - Atualizar registros existentes (se houver) para 'agencia'.

## 2. Fluxo de Autenticação e Onboarding (`/auth` e `/onboarding`)

O objetivo é que o freelancer se sinta "em casa" desde o primeiro contato.

### `/auth`:
- Adicionar uma terceira opção de tipo de conta: **"Sou Profissional Autônomo (Freelancer)"**.
- Se selecionado, o campo "Nome da empresa" muda para "Nome Profissional" (ou usa o Nome Completo).

### `/onboarding`:
- **Lógica Condicional**: Se for freelancer, ocultar ou simplificar campos de "Tamanho da equipe" e "Ano de fundação".
- **Labels Dinâmicas**: Trocar "Nome do negócio" por "Nome de exibição" e "Sua empresa" por "Sua marca/nome".
- **Identidade**: Permitir que o freelancer use uma foto de perfil pessoal em vez de um logo empresarial (isso já é possível, mas a instrução visual deve ser clara).

## 3. Painel de Controle (Dashboard)

O painel deve ser levemente adaptado para a realidade de quem trabalha sozinho.

- **Painel de Perfil**: Ajustar os mesmos campos dinâmicos do onboarding.
- **Destaques**: Freelancers podem ter planos de assinatura com valores ou benefícios ligeiramente diferentes (opcional).

## 4. Experiência de Busca e Vitrine (`/buscar` e `/pro/$slug`)

Como os clientes verão os freelancers?

- **Busca**: 
    - Adicionar um filtro "Tipo de Prestador" (Freelancer vs. Empresa).
    - Adicionar um badge visual no `PrestadorCard` para identificar o perfil.
- **Perfil Público (`pro.$slug.tsx`)**:
    - Layout ligeiramente diferente: o foco para freelancers deve ser a **pessoa** e suas **especialidades individuais**, enquanto para agências o foco é o **portfólio coletivo** e **escala**.
    - Badge de "Profissional Verificado" em vez de apenas "Empresa Verificada".

## 5. Próximos Passos Sugeridos (Implementação)

1. **Fase 1: Schema**: Rodar migração para adicionar `tipo_prestador`.
2. **Fase 2: Auth**: Atualizar a tela de login/cadastro com a nova opção.
3. **Fase 3: Onboarding**: Adaptar o formulário de 5 passos.
4. **Fase 4: UI Marketplace**: Atualizar os cards de resultado e filtros de busca.

---
**Pergunta para o usuário**: Você prefere que o Freelancer seja uma opção de conta separada logo no início (3 botões no login) ou que ele escolha se é Freelancer/Empresa dentro do Onboarding de Prestador?
