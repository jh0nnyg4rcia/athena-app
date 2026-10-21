# Documento de Retomada e Registro de Integração — Candidata Consolidada

Este documento registra os marcos consolidados, commits, arquivos alterados, resultados de verificação e pendências abertas, servindo de base para auditoria e continuidade sequencial.

---

## 1. Identificação do Marco

- **Branch de Integração**: `integration/candidate-consolidated`
- **Worktree Isolada**: `work/athena-candidate-consolidated`
- **Commit Consolidado (Comandos 1, 2, 3, Marcações, Sincronização e Isolamento por Emuladores)**: `83450e0` (anterior: `92c6ab5` / `d31d304` / `0c41c84` / `ae48b78`)
- **Base Ancestral**: `cfc566b` (que incorpora linearmente `669b66c`, `f0b67fb`, `2d3eb29`, `79564ba`, `763ab35`)
- **Estado de Trabalho**: Limpo, testado e sincronizado com Android e iOS.

---

## 2. Entregas Consolidadas e Integradas

### Comando 1 — Candidata para Conferência Humana
- **Login Google & Sessão**: Autenticação pop-up na web e integração nativa via `@capacitor-firebase/authentication`, isolamento total de storage e cache por UID.
- **Progressão Sequencial**: Requisito pedagógico contíguo inviolável (dias 3 a 100 exigem conclusão dos dias anteriores).
- **Convites de Testadores**: Mecanismo criptográfico com hash SHA-256 e rate limit contra força bruta (`tester_access`).
- **Proteção de Leitura & Saneadores**: Exclusão de aulas desabilitada em cache misses (`vaultCache`), evitando destruição de acervo.
- **5 Revisões Comprimidas do Dia 1**: Extração canônica de 5 matérias distintas, eliminação da armadilha de tamanho (`size trap`) e limpeza de prompts do modelo.
- **Contador Stepper (`− 1x +`)**: Clamping com piso zero, persistência local e isolamento entre contas.
- **Caderno de Erros & Estatísticas**: Registro de erros, re-estudo, resolução sem inflar métrica de questões únicas.

### Comando 2 — Preparação Android e iOS
- **Identidade Preservada**: `com.athena.mentoria` / `ATHENA - Mentoria Jurídica`.
- **Configuração Firebase Nativa**:
  - Android: `android/app/google-services.json` verificado e vinculado.
  - iOS: Projeto nativo inicializado via Capacitor (`@capacitor/ios@8.5.2`) e sincronizado (`npx cap sync`).
  - `ios/App/App/Info.plist` atualizado com permissões de microfone e reconhecimento de voz.
- **Roteamento de API**: `getApiUrl()` direciona chamadas nativas para o proxy oficial na Cloud Function (`https://southamerica-east1-gen-lang-client-0822763072.cloudfunctions.net/athenaApi`).
- **Etapas Separadas**: Documentação exata em `docs/GUIA_EXECUCAO_NATIVA.md` separando o que roda localmente no Windows do que depende de macOS/Xcode/certificados.

### Comando 3 — Pagamentos Exclusivamente pelas Lojas
- **Zero Checkout Web**: Não há formulários de cartão nem gateway web. Web informa que a assinatura é feita nas lojas e reconhece o benefício da mesma conta ATHENA automaticamente.
- **Interface e Adaptadores**:
  - `WebStoreSubscriptionAdapter`: Informativo com restauração de status via `/api/study/subscription-status`.
  - `NativeStoreSubscriptionAdapter`: Estruturado para o bridge nativo das lojas.
  - `SimulatedLocalStoreAdapter`: Restrito a `import.meta.env.DEV` com flag explícita `isSimulatedLocal: true`.
- **Validação no Servidor & Idempotência**:
  - `src/server/storeSubscriptionVerification.ts`: Valida compras e previne reuso de recibos entre UIDs diferentes.
  - `src/api/subscriptionRoutes.ts`: Endpoints `/api/study/subscription-verify`, `/api/study/subscription-status` e webhooks para Google Play (RTDN Pub/Sub) e App Store (Server Notifications V2).
  - Ciclo de vida: renovação (`active`), período de graça (`in_grace_period`), cancelamento (`canceled` — vigência preservada até o fim do ciclo) e reembolso (`refunded` — revogação imediata).
  - Supressão de eventos duplicados com chave de idempotência.
- **Separação de Privilégios**:
  - O papel CEO (`access_admins`) possui **acesso integral e imediato a todos os 100 dias**, sem exigência de progressão prévia (`if (ceo) return true`).
  - Para alunos (gratuitos, assinantes ou convidados de teste), a progressão pedagógica contígua é estritamente mantida (nenhum pagamento ou convite elimina a necessidade de concluir os dias anteriores).

### Nova Entrega — Marcações Pessoais de Texto nas Aulas (5 Cores)
- **5 Cores com Acessibilidade e Alto Contraste**: Amarelo (`yellow`), Vermelho (`red`), Verde (`green`), Rosa (`pink`) e Azul (`blue`). Tokens e regras adaptadas para tema escuro e claro em `src/visual.css`.
- **Seleção e Toolbar Flutuante**: Seleção nativa preservada no celular e computador; exibição de barra flutuante posicionada sobre o trecho com troca de cor e exclusão com 1 toque.
- **Armazenamento Desacoplado do Acervo**: Metadados persistidos isoladamente por conta (`uid`) e aula (`lessonId`), preservando intactos o Markdown original, os hashes SHA-256 e os arquivos do acervo oficial.
- **Reconciliação Inequívoca e Tolerância a Atualizações**:
  - Correspondência única ou desambiguada por contexto (prefixo/sufixo) aplicada automaticamente (`active`).
  - Trechos removidos ou ambíguos preservados em modo pendente (`pending_match`) com aviso expansível no leitor, sem corromper o texto da aula.
- **Autorização Fail-Closed**: O endpoint `/api/study/personal-highlights` valida os direitos de leitura (`progressiveDayAccess`); aulas bloqueadas recusam a entrega de marcações, impedindo vazamentos ou bypass de progressão.

### Resolução de Inconsistência — Sincronização Atômica de Versões da Aula e Catálogo
- **Auditoria do Código Compilado (`functions/lib/base-app.js`)**: Constatou-se que a gravação em `homologated_parts` (catálogo) omitia `version: published.version`, embora a aula em `homologated_lessons` recebesse a versão incrementada. Essa omissão também existia na base recuperada de produção (`active-backend-recovered/lib/base-app.js`).
- **Correção Mínima Aplicada**:
  - `src/services/legalReviewStore.ts`: inclusão de `version: published.version` na gravação de `homologated_parts` dentro da transação atômica de aprovação da revisão jurídica.
  - `src/services/persistCeoCatalogLesson.ts`: inclusão de `version: published.version` na gravação de `homologated_parts` dentro da transação de publicação direta do CEO.
  - `functions/lib/base-app.js`: recompilado via `npm --prefix functions run build`, refletindo a gravação transacional atômica idêntica em ambas as coleções.
- **Diferenciação Obrigatória de Escopo**:
  - A publicação e entrega foram validadas localmente via Firestore Emulator (`scripts/test-ceo-version-sync.mjs`).
  - A homologação remota externa pelo conector ChatGPT (Actions / GPT Customizado) **não ocorreu nesta rodada**, mantendo isolamento e integridade dos ambientes reais.

---

## 3. Arquivos Alterados e Criados

| Arquivo | Ação | Finalidade |
| :--- | :---: | :--- |
| `package.json` | Modificado | Adição da dependência `@capacitor/ios@8.5.2`. |
| `ios/` | Criado | Estrutura nativa iOS gerada pelo Capacitor e sincronizada com assets web. |
| `ios/App/App/Info.plist` | Modificado | Inclusão de `NSMicrophoneUsageDescription` e `NSSpeechRecognitionUsageDescription`. |
| `src/types.ts` | Modificado | Definição de `PersonalHighlight` e `HighlightColor`. |
| `src/visual.css` | Modificado | Tokens de cor, contraste para temas claro/escuro e classes `.athena-highlight-*`. |
| `src/server/personalHighlightsVerification.ts` | Criado | Backend seguro de validação e isolamento de marcações com checagem de leitura fail-closed. |
| `src/api/personalHighlightsRoutes.ts` | Criado | Rotas `/api/study/personal-highlights` com autenticação por token Bearer. |
| `src/services/personalHighlightsClient.ts` | Criado | Cliente de marcações com cache local, sincronização de rede e algoritmo de reconciliação inequívoca. |
| `src/components/HighlightToolbar.tsx` | Criado | Toolbar flutuante acessível para aplicar cor, trocar cor ou excluir marcação. |
| `src/components/HighlightableContent.tsx` | Criado | Wrapper que renderiza Markdown com `<mark>` nos trechos inequívocos e gaveta de pendências. |
| `src/components/ReviewList.tsx` | Modificado | Integração de `HighlightableContent` nas revisões comprimidas. |
| `src/App.tsx` | Modificado | Conexão de `MemoizedMarkdown` com `HighlightableContent` nos blocos de aula. |
| `src/server/storeSubscriptionVerification.ts` | Criado | Serviço de validação no servidor, controle de vigência, idempotência e webhooks. |
| `src/api/subscriptionRoutes.ts` | Criado | Rotas Express para verificação, status e webhooks de Google Play e App Store. |
| `src/api/createAthenaApiApp.ts` | Modificado | Registro das rotas de assinatura e marcações no servidor. |
| `src/services/storeSubscriptionClient.ts` | Criado | Contratos, interfaces e adaptadores web, nativo e simulado local. |
| `scripts/verify-personal-highlights.mjs` | Criado | Suíte de testes focados para marcações, cores, isolamento e tolerância a mudanças. |
| `scripts/verify-store-subscriptions.mjs` | Criado | Suíte de testes automatizados para validação de assinaturas e webhooks. |
| `docs/ROTEIRO_CONFERENCIA_HUMANA.md` | Modificado | Roteiro prático para conferência humana incluindo seção de marcações. |
| `docs/GUIA_EXECUCAO_NATIVA.md` | Criado | Instruções de execução nativa para Android e etapas de macOS para iOS. |
| `docs/CHECKLIST_CONSOLES_LOJAS.md` | Criado | Especificação exata dos produtos e acessos nos consoles das lojas. |
| `docs/RETOMADA_INTEGRACAO.md` | Modificado | Este documento de controle e auditoria. |

---

## 4. Resultados de Verificação

1. **TypeScript Typecheck (`npx tsc --noEmit`)**:
   - **Resultado**: 0 erros.
2. **Build Web & Backend (`npm run build`)**:
   - **Resultado**: Concluído em 20s. `dist/index.html` (3.6 MB) e `dist/server.cjs` (1.3 MB) gerados.
3. **Sincronização Nativa (`npx cap sync`)**:
   - **Resultado**: Concluído com sucesso tanto para `android` quanto para `ios`.
4. **Suíte de Marcações Pessoais (`scripts/verify-personal-highlights.mjs`)**:
   - **Resultado**: 13/13 testes passaram (5 cores, isolamento entre contas, troca de cor, remoção, reconciliação inequívoca vs. pendente e bloqueio de leitura).
5. **Suíte de Entrega (`scripts/verify-delivery.mjs`)**:
   - **Resultado**: 5/5 testes passaram (5 revisões distintas, size trap eliminado, stepper min 0, isolamento de contas, preservação de questões únicas).
6. **Suíte de Assinaturas das Lojas (`scripts/verify-store-subscriptions.mjs`)**:
   - **Resultado**: 16/16 asserções passaram (verificação de token, idempotência, bloqueio de recibo compartilhado, status consolidado, renovação, cancelamento, reembolso e dedup de webhook).
7. **Sincronização de Versões do CEO (`scripts/test-ceo-version-sync.mjs`)**:
   - **Resultado**: 3/3 casos passaram com 100% de sucesso (publicação direta `persistCeoCatalogLesson` sincroniza aula e catálogo na versão 2; aprovação de revisão jurídica sincroniza aula e catálogo na versão 3; validação com `studyProgressCore` e `internalCatalogRoutes` confirma versões idênticas sem erro `CATALOG_INCONSISTENT`).

---

## 5. Impedimentos e Pendências Registradas (Sem Violação de Controles)

1. **Pendência Editorial do Acervo (`day_4_part_1`)**:
   - A matéria do Dia 4, Parte 1 permanece com divergência de desafio no acervo homologado e **NÃO** foi forçada como resolvida (mantida em aberto conforme `LESSON-INTEGRITY-PENDENCIES.md`).
2. **Configuração de Console e Credenciais Reais**:
   - Produtos `athena_mensal_100dias` e `athena_anual_100dias`, tópicos Pub/Sub e chaves privadas da Apple dependem de intervenção humana nos consoles das lojas e estão catalogados em `docs/CHECKLIST_CONSOLES_LOJAS.md`.
3. **Ambiente macOS para Assinatura iOS**:
   - A geração do binário final do iOS (arquivo `.ipa` / TestFlight) requer máquina com macOS e Xcode para assinatura de código.
