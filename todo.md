# GymHub SaaS - TODO

## Configuração Base
- [x] Configurar tema escuro com acentos em laranja
- [x] Criar esquema do banco de dados (membros, pagamentos, check-ins, avaliações)
- [x] Configurar navegação lateral persistente (DashboardLayout)

## Autenticação
- [x] Sistema de login/logout via Manus OAuth
- [x] Proteção de rotas autenticadas

## Dashboard Principal
- [x] Cards de métricas (total membros, membros ativos, check-ins hoje, inadimplentes)
- [x] Seção de check-ins recentes
- [x] Botões de ação rápida (cadastrar membro, fazer check-in)

## Gestão de Membros
- [x] Listagem de membros com busca e filtros
- [x] Cadastro de novo membro
- [x] Edição de membro existente
- [x] Visualização de perfil do membro
- [x] Status de membro (ativo/inativo/inadimplente)

## Sistema de Check-in
- [x] Registro de entrada de membros
- [x] Histórico de check-ins
- [x] Busca de membro para check-in

## Módulo Financeiro
- [x] Controle de pagamentos e mensalidades
- [x] Listagem de transações
- [x] Registro de pagamentos manuais
- [x] Visualização de inadimplentes
- [x] Métricas de receita

## Integração Stripe
- [x] Configurar integração Stripe
- [x] Processamento de pagamentos
- [x] Gestão de assinaturas

## Avaliações Físicas
- [x] Cadastro de avaliação física
- [x] Histórico de avaliações por membro
- [x] Métricas corporais (peso, altura, IMC, etc.)

## Notificações
- [x] Notificação de novo cadastro de membro
- [x] Notificação de pagamento recebido
- [x] Notificação de mensalidade vencida

## Relatórios
- [x] Relatório financeiro em PDF
- [x] Análise de receitas e despesas
- [x] Relatório de inadimplência


## Integração Tecnofit
- [x] Configurar chaves de API Tecnofit
- [x] Criar cliente HTTP para Tecnofit
- [x] Implementar sincronização de clientes
- [x] Sincronizar frequências/check-ins
- [x] Sincronizar dados financeiros
- [ ] Criar dashboard de sincronização

## Integração OpenAI
- [x] Configurar chave OpenAI
- [x] Criar router de IA
- [x] Implementar análise de dados
- [x] Criar assistente de atendimento
- [x] Gerar planos de treino automáticos
- [x] Análise de feedback de clientes

## Aprimoramentos de IA
- [x] Recomendações personalizadas
- [x] Previsão de churn
- [x] Análise de padrões
- [x] Relatórios inteligentes
- [ ] Alertas automáticos


## Sistema de Notificações Personalizadas
- [x] Criar schema de notificações no banco de dados
- [x] Criar schema de preferências de notificação
- [x] Implementar router tRPC para notificações
- [x] Criar componentes de UI (bell icon, centro de notificações)
- [x] Implementar toast notifications
- [x] Criar modal de preferências de notificação
- [ ] Integrar notificações em eventos (novo membro, pagamento, etc)
- [ ] Adicionar notificações em tempo real com WebSocket
- [ ] Testar sistema de notificações


## WebSockets em Tempo Real
- [x] Instalar Socket.io no servidor e cliente
- [x] Configurar Socket.io no servidor
- [x] Criar contexto React para WebSocket
- [x] Atualizar NotificationBell para usar WebSocket
- [ ] Integrar notificações em eventos (novo membro, pagamento, etc)
- [x] Testar WebSockets em tempo real
