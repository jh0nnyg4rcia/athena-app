# Roteiro de Conferência Humana — Candidata Integrada ATHENA (Ambiente Isolado Emulado)

Este roteiro orienta a validação humana da candidata web e dos fluxos integrados do sistema ATHENA em ambiente local estritamente emulado, sem necessidade de criação de contas reais nem alteração de progresso em produção.

---

## 1. Distinção de Autenticação e Blindagem do Banco Real

> [!IMPORTANT]
> **Distinção Fundamental de Escopo**:
> - **Autenticação Google Real (Homologada Anteriormente em `763ab35`)**: O fluxo com o provedor real Google (`authDomain: gen-lang-client-0822763072.firebaseapp.com`) e o isolamento de sessões por UID já foram tecnicamente homologados nas etapas anteriores e permanecem preservados no código oficial de produção.
> - **Demonstração Isolada Atual das Funcionalidades Novas**: Para a conferência das novas entregas (revisões Dia 1, stepper, Caderno de Erros e marcações de texto em 5 cores), a instância local `http://localhost:3000` está **estritamente vinculada aos emuladores locais** (Firestore na porta `8197` e Auth na porta `9099`) sob o projeto `demo-athena-client-safe`.
> - **Proteção Fail-Closed Ativa**: A ausência dos emuladores locais aborta imediatamente o servidor (`process.exit(1)`). **É tecnicamente impossível que uma falha ou ausência do emulador provoque conexão acidental com o Firestore de produção**.

---

## 2. Inicialização do Ambiente Local e Preservação de Cache

### A. Preservação do Cache do Navegador
> [!TIP]
> **Conferência em Perfil Separado / Janela Anônima**:
> Para garantir que nenhum dado, cookie ou armazenamento de suas contas reais seja apagado ou contaminado, **abra uma Janela Anônima (`Ctrl + Shift + N` no Windows) ou utilize um Perfil Separado de Navegador** para acessar `http://localhost:3000`.

### B. Inicialização dos Emuladores e do Servidor
O ambiente requer os emuladores locais ativos e o servidor da candidata:

```powershell
# 1. Iniciar os Emuladores Locais (Auth 9099 e Firestore 8197):
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npx.cmd -p firebase-tools firebase emulators:start --only auth,firestore --project demo-athena-client-safe

# 2. Popular o acervo do Dia 1 e as contas sintéticas no emulador (em outro terminal):
node scripts/seed-emulator-demo.mjs

# 3. Iniciar o servidor integrado da candidata:
node dist/server.cjs

# URL de Acesso:
# http://localhost:3000
```

---

## 3. Contas Sintéticas Disponíveis para a Conferência

O ambiente emulado dispõe de dois perfis sintéticos pré-configurados e auditados. No modal de login de `http://localhost:3000`, você pode digitar as credenciais ou clicar diretamente nos botões de preenchimento rápido:

| Perfil | E-mail Sintético | Senha Sintética | Privilégios no Emulador |
| :--- | :--- | :--- | :--- |
| **Aluno Sintético** | `aluno.sintetico@athena.local` | `AthenaDemo2026!` | Sem privilégio de CEO. Acesso liberado ao Dia 1. Dias subsequentes bloqueados por progressão contígua. |
| **CEO Sintético** | `jhonny.spider@gmail.com` | `AthenaDemo2026!` | Privilégio de CEO ativo no Firestore emulado (`access_admins/synthetic-ceo-01`). Acesso integral a todos os 100 dias. |

---

## 2. Checklist de Verificação por Componente

### A. Navegação e Responsividade (Computador vs. Celular)

1. **Visão Desktop (Largura ≥ 1024px)**:
   - O menu lateral (*Sidebar*) permanece fixo e visível à esquerda.
   - Os itens de menu exibem ícones e labels claros:
     - `Página Inicial`
     - `Fluxo de Estudo`
     - `Trilha 100 Dias`
     - `Cronogramas`
     - `Estatística`
     - `Caderno de Erros` (com badge vermelho contendo o número de erros pendentes)
     - `Revisão Comprimida` (com badge dourado contendo o número de revisões disponíveis)
   - A transição entre abas ocorre sem recarregar a página e preserva o estado de leitura.

2. **Visão Celular / Mobile (Largura < 1024px ou Emulador Mobile do Navegador)**:
   - A sidebar recolhe automaticamente e não sobrepõe o conteúdo principal.
   - O cabeçalho mobile exibe o botão hambúrguer dourado.
   - **Gesto de Deslizar (Edge Swipe)**: Arraste a partir da borda esquerda da tela para abrir o menu.
   - **Fechamento Ágil**: Toque no backdrop escuro, no botão `X` ou selecione qualquer item do menu para fechar a sidebar automaticamente.

---

### B. Revisões Comprimidas (Dia 1 — 5 Partes Distintas)

1. No menu lateral, selecione **Revisão Comprimida**.
2. **Resultado Esperado**:
   - Devem constar **5 cartões de revisão distintos** correspondentes às 5 matérias do Dia 1 (ex.: Direito Constitucional, Direito Administrativo, Direito Ambiental, Direito Tributário, etc.).
   - Não deve haver texto truncado nem contaminação por prompts do sistema ou instruções internas (`[INSTRUÇÃO]`, `[SIMULADOR]`).
   - O botão `Copiar` copia o resumo sem artefatos.

---

### C. Contador de Revisões (Stepper `− 1x +`)

1. Em cada cartão de revisão, localize o controle numérico de revisões realizadas (`−`, `X vezes`, `+`).
2. **Ações e Resultados Esperados**:
   - Toque em `+`: o valor incrementa para `1x`, `2x`...
   - Toque em `−`: o valor decrementa.
   - Ao atingir `0x`, o botão `−` fica desabilitado (clamping seguro, nunca atinge valores negativos).
   - Recarregue a página (F5): a contagem é preservada localmente no navegador (`localStorage`), isolada por conta do usuário.

---

### D. Caderno de Erros e Estatísticas Separadas

1. **Geração do Erro de Teste**:
   - No `Fluxo de Estudo` ou `Trilha 100 Dias`, responda a uma questão de desafio escolhendo propositalmente uma alternativa incorreta.
2. **Conferência no Caderno de Erros**:
   - No menu lateral, acesse **Caderno de Erros**.
   - A questão errada aparece listada com o enunciado, a alternativa marcada e a fundamentação legal do erro.
   - Toque em **Re-estudar Questão**: a questão é recarregada para nova tentativa.
   - Ao acertar na segunda tentativa, a questão é marcada como **Resolvida** no caderno.
3. **Conferência na Aba de Estatísticas**:
   - Acesse **Estatística**.
   - **Resultado Esperado**:
     - O total de **Questões Únicas Respondidas** NÃO infla quando você repete a questão errada (permanece contando a questão original).
     - A taxa de acerto é calculada com coerência entre primeira tentativa e resolução do erro.
     - As métricas de *Erros Pendentes* e *Erros Superados* são exibidas em cartões separados e transparentes.

---

### E. Assinaturas e Reconhecimento de Acesso Web

1. **Bloqueio de Checkout Web**:
   - A página web NÃO oferece campo de cartão de crédito, Stripe ou checkout direto.
   - É apresentada a orientação de que assinaturas são geridas pelas lojas **Google Play** e **App Store**.
2. **Reconhecimento Multiplataforma**:
   - Ao autenticar na web com a mesma conta ATHENA que possui benefício ativo contratado na loja (ou convite de testador), o servidor (`/api/study/access`) valida o direito e desbloqueia os dias da trilha conforme a progressão pedagógica cumprida.
3. **Separação de Papéis e Acesso**:
   - O papel CEO (`access_admins`) possui **acesso integral e imediato a todos os 100 dias**, sem exigência de cumprimento prévio de progressão (`if (ceo) return true`).
   - Para alunos (gratuitos, assinantes pagos via `access_subscriptions` ou testadores via `tester_access`), a progressão pedagógica contígua é estritamente mantida (nenhum pagamento ou convite dispensa a conclusão dos dias anteriores).

---

### F. Marcações Pessoais de Texto (5 Cores)

1. **Seleção de Texto e Toolbar Flutuante**:
   - No `Fluxo de Estudo` (ou nas `Revisões Comprimidas`), selecione com o mouse (computador) ou segure/arraste (celular) qualquer trecho de texto da aula.
   - **Resultado Esperado**: Surge imediatamente uma barra flutuante com as **5 cores** (🟡 Amarelo, 🔴 Vermelho, 🟢 Verde, 🌸 Rosa, 🔵 Azul) e botão fechar.
2. **Aplicação do Destaque**:
   - Toque em uma das cores (ex.: 🟡 Amarelo).
   - O trecho selecionado é envelopado com a cor correspondente, preservando o contraste e a formatação semântica do Markdown.
3. **Alteração de Cor e Remoção**:
   - Clique ou toque sobre o trecho já marcado.
   - Um menu contextual flutuante abre com as 5 cores (indicando a cor atual com um visto) e o botão com ícone de lixeira (Remover marcação).
   - Toque em outra cor (ex.: 🔵 Azul): a marcação muda imediatamente.
   - Toque no botão de lixeira: o destaque é removido e o texto volta ao normal.
4. **Contraste nos Dois Temas (Escuro e Claro)**:
   - Alterne o tema no seletor de aparência (sol/lua).
   - **Resultado Esperado**: O fundo e o texto do destaque se adaptam mantendo legibilidade perfeita e contraste acessível em ambos os modos.
5. **Reconciliação e Preservação de Aulas Bloqueadas**:
   - As marcações são salvas por conta (`uid`) e aula (`lessonId`), sem alterar os hashes ou arquivos Markdown do acervo.
   - Caso a aula sofra alterações incompatíveis, as marcações são preservadas e listadas como pendentes de conferência, sem quebrar o layout.
   - Aulas bloqueadas recusam a entrega de marcações (`fail-closed`), impedindo vazamento de conteúdo.

---

## 3. Resumo de Testes Automatizados Já Aprovados

| Suíte | Comando | Status | Verificações |
| :--- | :--- | :---: | :--- |
| **Marcações Pessoais de Texto** | `npx tsx scripts/verify-personal-highlights.mjs` | **13/13 APROVADO** | Suporte às 5 cores, isolamento entre contas, troca de cor, remoção, reconciliação inequívoca vs. pendente, e bloqueio em aulas não autorizadas. |
| **Revisões & Caderno de Erros** | `npx tsx scripts/verify-delivery.mjs` | **5/5 APROVADO** | 5 revisões Dia 1, eliminação de armadilha de tamanho, stepper min 0, isolamento de contas, preservação estatística de questões únicas. |
| **Contratos de Assinatura das Lojas** | `npx tsx scripts/verify-store-subscriptions.mjs` | **16/16 APROVADO** | Verificação de token, idempotência, rejeição de recibo compartilhado, status consolidado, webhooks (renovação, cancelamento, reembolso). |
| **Compilação TypeScript** | `npx tsc --noEmit` | **0 ERROS** | Tipagem estrita completa. |
| **Build Web & Backend** | `npm run build` | **0 ERROS** | Bundle web (`dist/`) e executável backend (`dist/server.cjs`) gerados com sucesso. |
