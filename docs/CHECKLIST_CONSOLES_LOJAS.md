# Checklist de Configurações das Lojas — Google Play & App Store

Este documento lista **exatamente** os produtos de assinatura, acessos de API e configurações de console necessários para ativação comercial, **sem executá-los** antecipadamente.

> [!IMPORTANT]
> **Propostas Técnicas Preliminares (Aguardando Decisão Humana)**:
> Os planos mensal/anual, preços sugeridos e identificadores comerciais (`athena_mensal_100dias`, `athena_anual_100dias`) são **estritamente propostas técnicas** para estruturação dos contratos e adaptadores no código. **Não são decisões comerciais aprovadas**. A definição de preços, modelos de cobrança e identificadores finais cabe exclusivamente a decisão deliberada do CEO antes de qualquer publicação nas lojas.

---

## 1. Google Play Console

### A. Criação de Assinaturas (In-App Subscriptions)
Acesse: **Google Play Console** -> Selecionar App (`com.athena.mentoria`) -> **Monetizar com o Play** -> **Produtos** -> **Assinaturas**.

1. **Produto 1 — Mensal**:
   - **ID do Produto**: `athena_mensal_100dias`
   - **Nome**: `ATHENA Pro Mensal`
   - **Descrição**: `Acesso completo aos 100 dias da Trilha Jurídica, revisões e simuladores.`
   - **Preço Base**: R$ 47,99
   - **Período de Faturamento**: 1 mês (renovação automática)
   - **Período de Graça**: 7 dias (recomendado para reter alunos com falha temporária no cartão)

2. **Produto 2 — Anual**:
   - **ID do Produto**: `athena_anual_100dias`
   - **Nome**: `ATHENA Pro Anual`
   - **Descrição**: `Acesso anual completo aos 100 dias da Trilha Jurídica e conteúdos avançados.`
   - **Preço Base**: R$ 479,90
   - **Período de Faturamento**: 1 ano (renovação automática)
   - **Período de Graça**: 16 dias

### B. Notificações em Tempo Real do Desenvolvedor (RTDN via Cloud Pub/Sub)
1. **Google Cloud Platform (GCP)**:
   - Criar um tópico no Cloud Pub/Sub (ex.: `projects/gen-lang-client-0822763072/topics/play-billing-notifications`).
   - Conceder a role `Pub/Sub Publisher` para a conta de serviço do Google Play: `google-play-developer-notifications@system.gserviceaccount.com`.
2. **Google Play Console**:
   - Ir para: **Monetização** -> **Configuração de monetização** -> **Notificações em tempo real do desenvolvedor**.
   - Inserir o nome do tópico Pub/Sub criado.
3. **Assinatura do Pub/Sub para o Webhook**:
   - Criar uma subscrição Push apontando para:
     ```
     https://southamerica-east1-gen-lang-client-0822763072.cloudfunctions.net/athenaApi/api/study/webhooks/google-play
     ```

### C. Conta de Serviço do Google Play Developer API
- No Google Cloud Console, habilitar a **Google Play Android Developer API**.
- Vincular a conta de serviço no Play Console (**Acesso à API**) com permissões de visualização e gerenciamento de pedidos e assinaturas financeiras.

---

## 2. Apple App Store Connect

### A. Criação do Grupo de Assinaturas e Produtos
Acesse: **App Store Connect** -> **Apps** -> `ATHENA - Mentoria Jurídica` -> **Monetização** -> **Assinaturas**.

1. **Criar Grupo de Assinatura**: `ATHENA Acesso Premium`
2. **Assinatura 1 — Mensal**:
   - **ID do Produto**: `athena_mensal_100dias`
   - **Nome de Referência**: `ATHENA Pro Mensal`
   - **Duração da Assinatura**: 1 mês
   - **Preço**: Tier equivalente a R$ 47,90 / R$ 49,90 na tabela de preços da Apple
   - **Período de Graça da Faturação**: Ativar (16 dias)
3. **Assinatura 2 — Anual**:
   - **ID do Produto**: `athena_anual_100dias`
   - **Nome de Referência**: `ATHENA Pro Anual`
   - **Duração da Assinatura**: 1 ano
   - **Preço**: Tier equivalente a R$ 479,90 na tabela de preços da Apple

### B. App Store Server Notifications V2
1. Ir para: **Geral** -> **Informações sobre o app** -> **Notificações do App Store Server**.
2. **URL do Servidor de Produção**:
   ```
   https://southamerica-east1-gen-lang-client-0822763072.cloudfunctions.net/athenaApi/api/study/webhooks/app-store
   ```
3. **Versão**: Selecionar **Versão 2** (Server Notifications V2).

### C. Chave de API do App Store Server
1. Ir para: **Usuários e Acessos** -> **Chaves** -> **In-App Purchase**.
2. Gerar uma Chave de API de Compra no Aplicativo:
   - Registrar o **Key ID** e o **Issuer ID**.
   - Baixar a chave privada `.p8` de forma segura (não versionada em repositório público).

---

## 3. Resumo da Arquitetura de Pagamentos

```
  [Dispositivo Android]               [Dispositivo iOS]
   (Google Play Billing)              (StoreKit / Apple)
            │                                  │
            ▼                                  ▼
      purchaseToken                     receipt / JWS
            │                                  │
            └───────────────┬──────────────────┘
                            │
                            ▼
              POST /api/study/subscription-verify
                            │
                            ▼
             Validação no Servidor ATHENA
             (Gravação em access_subscriptions/{uid})
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
    App Nativo                            Web ATHENA
(Acesso Liberado)                  (Mesma conta: Acesso Reconhecido)
                                  (Sem checkout web / Seguro)
```
