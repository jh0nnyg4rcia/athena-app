/**
 * ATHENA — ETAPA 8.2: SUÍTE DE TESTES ADVERSARIAIS DE CONCORRÊNCIA E CONTROLE DE HASH
 *
 * Cobertura Obrigatória:
 * 1. Hash correto aceito com sucesso (decisão gravada com expectedCandidateHash e candidateHashAtDecision).
 * 2. Hash ausente rejeitado com HTTP 400 Bad Request.
 * 3. Hash em formato inválido (< 64 caracteres, caracteres não hexadecimais) rejeitado com HTTP 400 Bad Request.
 * 4. Hash desatualizado / divergente rejeitado com HTTP 409 Conflict e mensagem exata prescrita.
 * 5. Concorrência entre duas abas: edição do texto candidato em uma aba invalida deliberação com hash anterior na outra aba (HTTP 409).
 * 6. Histórico de deliberações anteriores 100% preservado com seus respectivos hashes.
 * 7. Tentativa de deliberação por usuário não-CEO rejeitada com HTTP 403 Forbidden.
 * 8. Tentativa de deliberação com Estágio A desabilitado rejeitada com HTTP 503 Fail-Closed.
 * 9. Bloqueios operacionais 503 dos Estágios B e C estritamente mantidos.
 * 10. Catálogo publicado de aulas 100% intocado e inalterado.
 *
 * RESTRIÇÕES ABSOLUTAS:
 * - 100% OFFLINE / ZERO FIRESTORE PRODUCTION WRITES
 * - ZERO CHAMADAS A MODELOS EXTERNOS
 * - ZERO DEPLOY / PUSH
 */

import assert from "node:assert/strict";
import {
  type LegalReviewView,
  type StoredCatalogLesson,
  type SupplementFindingItem,
  type HumanFindingDecision,
  getFindingStableKey,
  LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE,
} from "../src/lib/legalReviewTypes.js";
import {
  resolveHumanLegalReviewFinding,
  approveLegalReview,
  closeLegalReviewSupplementFlow,
} from "../src/services/legalReviewFlow.js";
import {
  LegalReviewError,
  hashCatalogSnapshot,
  hashLessonContent,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository.js";

const CEO_EMAIL = "jhonny.spider@gmail.com";
const NON_CEO_EMAIL = "aluno@projetoathena.app.br";

const EXPECTED_CONFLICT_MESSAGE =
  "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de deliberar.";

function buildMockBaseline(): { lesson: StoredCatalogLesson; review: LegalReviewView } {
  const originalMarkdown = `# Direito Administrativo — Licitações e Contratos

A Lei nº 14.133/2021 estabelece normas gerais de licitação e contratação para as Administrações Públicas.
O diálogo competitivo é modalidade de licitação para contratação de obras, serviços e compras em que a Administração realiza diálogos com licitantes previamente selecionados.
`;

  const lesson: StoredCatalogLesson = {
    id: "day_2_part_1",
    day: 2,
    part: 1,
    subject: "Direito Administrativo",
    topic: "Nova Lei de Licitações",
    content: originalMarkdown,
    version: 1,
    approvedAt: 1720000000000,
    approvedBy: CEO_EMAIL,
  };

  const findings: SupplementFindingItem[] = [
    {
      pendingId: "chg_CHG-101",
      statementAnalyzed: "O diálogo competitivo é modalidade de licitação para contratação de obras, serviços e compras.",
      status: "nao_verificada",
      classification: "nao_verificada",
      officialSourceSearched: "Lei 14.133/2021",
      officialEvidenceFound: "Art. 6º, XLII e art. 32 da Lei 14.133/2021",
      confidence: "ALTA",
      justification: "Dispositivo expresso da nova lei de licitações pendente de conferência pelo CEO.",
    },
    {
      pendingId: "unverified_claim_202",
      statementAnalyzed: "Critério de julgamento por maior desconto aplica-se exclusivamente a obras públicas.",
      status: "nao_verificada",
      classification: "nao_verificada",
      officialSourceSearched: "Lei 14.133/2021",
      officialEvidenceFound: "Art. 34 da Lei 14.133/2021",
      confidence: "ALTA",
      justification: "Afirmação questionável pendente de deliberação.",
    },
  ];

  const candHash = hashLessonContent(originalMarkdown);

  const review: LegalReviewView = {
    id: "rev_stage_a_concurrency_001",
    lessonId: "day_2_part_1",
    day: 2,
    part: 1,
    subject: "Direito Administrativo",
    topic: "Nova Lei de Licitações",
    originalHash: hashCatalogSnapshot(lesson),
    candidateHash: candHash,
    auditedCandidateHash: candHash,
    originalContent: originalMarkdown,
    reviewedMarkdown: originalMarkdown,
    changes: [],
    unverifiedClaims: [],
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "ALTA",
    outcome: "SEM_ALTERACOES_RELEVANTES",
    model: "gpt-5.4-preview",
    webSearchUsed: true,
    testMode: false,
    status: "pending_approval",
    editorialIntegrity: {
      passed: true,
      appliedChanges: [],
      missingChanges: [],
      problematicChanges: [],
      status: "INTEGRITY_VERIFIED",
    },
    supplement: {
      attemptCount: 1,
      status: "inconclusive",
      findings,
    },
    findingDecisions: {},
  };

  return { lesson, review };
}

function createConcurrentTokenRepository(initialReview: LegalReviewView, initialLesson: StoredCatalogLesson): LegalReviewRepository {
  let reviewState = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  let lessonState = JSON.parse(JSON.stringify(initialLesson)) as StoredCatalogLesson;

  return {
    async getLesson(id: string) {
      if (id === lessonState.id) return JSON.parse(JSON.stringify(lessonState));
      return null;
    },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
    async get(id: string) {
      if (id === reviewState.id) return JSON.parse(JSON.stringify(reviewState));
      return null;
    },
    async saveCandidate(_id: string, markdown: string) {
      reviewState.reviewedMarkdown = markdown;
      reviewState.candidateHash = hashLessonContent(markdown);
      return JSON.parse(JSON.stringify(reviewState));
    },
    async saveFindingDecision(_reviewId: string, findingDecision: HumanFindingDecision, now: number) {
      // Simulação fiel de transação Firestore (legalReviewStore.ts)
      const expectedHash = (findingDecision.expectedCandidateHash || "").trim().toLowerCase();
      const currentHash = (reviewState.candidateHash || "").trim().toLowerCase();
      if (!expectedHash) {
        throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório.", 400);
      }
      if (!/^[a-f0-9]{64}$/i.test(expectedHash)) {
        throw new LegalReviewError("O formato de expectedCandidateHash é inválido.", 400);
      }
      if (currentHash && expectedHash !== currentHash) {
        throw new LegalReviewError(EXPECTED_CONFLICT_MESSAGE, 409);
      }

      const existing = reviewState.findingDecisions || {};
      const prior = existing[findingDecision.findingKey];
      const priorHistory = prior?.history || [];
      const newHistory = [...priorHistory];
      if (prior) {
        newHistory.push({
          action: prior.action,
          state: prior.state,
          justification: prior.justification,
          evidenceDeclaration: prior.evidenceDeclaration,
          divergenceNature: prior.divergenceNature,
          correctionChangeId: prior.correctionChangeId,
          expurgationConfirmed: prior.expurgationConfirmed,
          expectedCandidateHash: prior.expectedCandidateHash,
          candidateHashAtDecision: prior.candidateHashAtDecision,
          decidedAt: prior.decidedAt,
          decidedByUid: prior.decidedByUid,
          decidedByEmail: prior.decidedByEmail,
        });
      }

      const consolidatedDecision: HumanFindingDecision = {
        ...findingDecision,
        expectedCandidateHash: expectedHash,
        decidedAt: now,
        candidateHashAtDecision: reviewState.candidateHash,
        history: newHistory,
      };

      reviewState.findingDecisions = {
        ...existing,
        [findingDecision.findingKey]: consolidatedDecision,
      };

      return JSON.parse(JSON.stringify(reviewState));
    },
    async closeSupplementResolution(_reviewId: string, resolution: any, now: number) {
      const flags = (await import("../src/lib/legalReviewTypes.js")).getLegalReviewOperationalFlags();
      if (!flags.stageBEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE, 503);
      }
      if (!reviewState.supplement) throw new LegalReviewError("Sem complementação", 404);
      reviewState.supplement.resolution = resolution;
      return JSON.parse(JSON.stringify(reviewState));
    },
    async reject(_id: string, uid: string, now: number) {
      reviewState.status = "rejected";
      return JSON.parse(JSON.stringify(reviewState));
    },
    async approve(_reviewId: string, uid: string, email: string, now: number) {
      const flags = (await import("../src/lib/legalReviewTypes.js")).getLegalReviewOperationalFlags();
      if (!flags.stageCEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE, 503);
      }
      if (email !== CEO_EMAIL) throw new LegalReviewError("Apenas o CEO pode aprovar", 403);
      lessonState.content = reviewState.reviewedMarkdown;
      reviewState.status = "approved";
      return { ok: true as const, lesson: JSON.parse(JSON.stringify(lessonState)) };
    },
  };
}

async function runStageAHashConcurrencyTests() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 8.2: TESTES ADVERSARIAIS DE CONCORRÊNCIA E CONTROLE DE HASH");
  console.log("MODO: 100% OFFLINE / ISOLAMENTO COMPLETO");
  console.log("================================================================================\n");

  const origA = process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
  const origB = process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
  const origC = process.env.LEGAL_REVIEW_STAGE_C_ENABLED;

  try {
    const { lesson: initialLesson, review: initialReview } = buildMockBaseline();
    const correctCandidateHash = initialReview.candidateHash!;
    assert.strictEqual(correctCandidateHash.length, 64, "Hash inicial deve ter 64 caracteres SHA-256");

    // ---------------------------------------------------------------------------
    // TESTE 1: Bloqueio 503 Fail-Closed quando Estágio A desabilitado
    // ---------------------------------------------------------------------------
    console.log("[Teste 1] Bloqueio HTTP 503 quando Estágio A está ausente ou false");
    delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;

    const repo1 = createConcurrentTokenRepository(initialReview, initialLesson);
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          initialReview.id,
          {
            findingKey: "chg_CHG-101",
            action: "CONFIRMAR",
            justification: "Tentativa com flag desabilitada",
            expectedCandidateHash: correctCandidateHash,
            evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
          },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503 && err.message.includes("LEGAL_REVIEW_STAGE_A_ENABLED=false"),
      "Deveria falhar com HTTP 503 Fail-Closed"
    );
    console.log("  ✓ Bloqueio 503 confirmado na ausência da flag.");

    // Habilita Estágio A para os testes funcionais de concorrência e integridade
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";

    // ---------------------------------------------------------------------------
    // TESTE 2: Rejeição de Não-CEO (HTTP 403 Forbidden)
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 2] Rejeição de Não-CEO (HTTP 403 Forbidden)");
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          initialReview.id,
          {
            findingKey: "chg_CHG-101",
            action: "CONFIRMAR",
            justification: "Tentativa de deliberação por aluno",
            expectedCandidateHash: correctCandidateHash,
            evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
          },
          "uid_aluno",
          NON_CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 403,
      "Deveria rejeitar não-CEO com HTTP 403"
    );
    console.log("  ✓ Acesso rejeitado com 403 para identidade não-CEO.");

    // ---------------------------------------------------------------------------
    // TESTE 3: Hash ausente rejeitado com HTTP 400 Bad Request
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 3] Hash ausente rejeitado com HTTP 400 Bad Request");
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          initialReview.id,
          {
            findingKey: "chg_CHG-101",
            action: "CONFIRMAR",
            justification: "Justificativa válida do CEO sem hash informado",
            expectedCandidateHash: "",
            evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
          },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 400 && err.message.includes("expectedCandidateHash"),
      "Deveria falhar com 400 por ausência de expectedCandidateHash"
    );
    console.log("  ✓ Hash ausente rejeitado com 400.");

    // ---------------------------------------------------------------------------
    // TESTE 4: Hash em formato inválido rejeitado com HTTP 400 Bad Request
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 4] Hash em formato inválido (< 64 caracteres ou caracteres não-hex)");
    const invalidHashes = [
      "curto_demais",
      "1234567890abcdef",
      "g".repeat(64), // caractere 'g' não é hexadecimal
      " ".repeat(64),
      correctCandidateHash.slice(0, 63), // 63 caracteres
      correctCandidateHash + "a", // 65 caracteres
    ];

    for (const badHash of invalidHashes) {
      await assert.rejects(
        async () => {
          await resolveHumanLegalReviewFinding(
            repo1,
            initialReview.id,
            {
              findingKey: "chg_CHG-101",
              action: "CONFIRMAR",
              justification: "Justificativa válida com hash malformado",
              expectedCandidateHash: badHash,
              evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
            },
            "uid_ceo",
            CEO_EMAIL
          );
        },
        (err: any) => err instanceof LegalReviewError && err.status === 400 && (err.message.includes("inválido") || err.message.includes("obrigatório")),
        `Deveria rejeitar hash inválido '${badHash}' com 400`
      );
    }
    console.log("  ✓ Todos os 6 formatos inválidos de hash foram rejeitados com HTTP 400.");

    // ---------------------------------------------------------------------------
    // TESTE 5: Hash divergente / desatualizado rejeitado com HTTP 409 Conflict
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 5] Hash divergente / desatualizado rejeitado com HTTP 409 Conflict");
    const staleHash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          initialReview.id,
          {
            findingKey: "chg_CHG-101",
            action: "CONFIRMAR",
            justification: "Tentativa com hash antigo ou divergente",
            expectedCandidateHash: staleHash,
            evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
          },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => {
        const matchesStatus = err instanceof LegalReviewError && err.status === 409;
        const matchesMessage = err.message === EXPECTED_CONFLICT_MESSAGE;
        assert.ok(matchesStatus, `Status deve ser 409, recebido: ${err?.status}`);
        assert.ok(matchesMessage, `Mensagem exata esperada. Recebida: '${err?.message}'`);
        return true;
      },
      "Deveria falhar com 409 Conflict e mensagem exata prescrita"
    );
    console.log("  ✓ Hash divergente rejeitado com HTTP 409 e mensagem prescrita validada.");

    // ---------------------------------------------------------------------------
    // TESTE 6: Deliberação com Hash Correto aceita com sucesso (HTTP 200)
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 6] Deliberação legítima com hash correto aceita e persistida");
    const resolved1 = await resolveHumanLegalReviewFinding(
      repo1,
      initialReview.id,
      {
        findingKey: "chg_CHG-101",
        action: "CONFIRMAR",
        justification: "Dispositivo conferido no Art. 32 da Lei 14.133/2021 pelo CEO.",
        expectedCandidateHash: correctCandidateHash,
        evidenceDeclaration: {
          declaredSource: "Lei nº 14.133/2021",
          bibliographicReference: "Art. 32, caput",
          declaredExcerpt: "diálogo competitivo",
          semanticJustification: "Definição legal explícita",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      CEO_EMAIL,
      1720000001000
    );

    const dec1 = resolved1.findingDecisions?.["chg_CHG-101"];
    assert.ok(dec1, "Decisão deve estar persistida");
    assert.strictEqual(dec1.state, "CONFIRMADO_PELO_CEO");
    assert.strictEqual(dec1.expectedCandidateHash, correctCandidateHash);
    assert.strictEqual(dec1.candidateHashAtDecision, correctCandidateHash);
    assert.strictEqual(dec1.decidedAt, 1720000001000);
    console.log("  ✓ Deliberação gravada com sucesso contendo expectedCandidateHash e candidateHashAtDecision.");

    // ---------------------------------------------------------------------------
    // TESTE 7: Concorrência entre Abas — alteração no texto invalida aba com hash antigo
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 7] Concorrência entre duas abas (Aba 1 edita texto -> Aba 2 tenta deliberar)");
    // Aba 1: Edita a candidata, alterando o candidateHash do documento
    const newMarkdown = initialReview.reviewedMarkdown + "\n\n### Seção Adicional sobre Sanções Administrativas\n";
    await repo1.saveCandidate(initialReview.id, newMarkdown);
    const updatedReviewInRepo = await repo1.get(initialReview.id);
    const newCandidateHash = updatedReviewInRepo?.candidateHash!;
    assert.notStrictEqual(newCandidateHash, correctCandidateHash, "O hash deve ter mudado após a edição do texto");

    // Aba 2: Operador ainda tem em tela a versão anterior (correctCandidateHash) e tenta deliberar sobre o segundo achado
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          initialReview.id,
          {
            findingKey: "unverified_claim_202",
            action: "DECLARAR_NAO_COMPROVADO",
            justification: "Critério de maior desconto não se limita a obras.",
            expectedCandidateHash: correctCandidateHash, // HASH ANTIGO DA ABA 2!
            expurgationConfirmed: true,
          },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => {
        assert.strictEqual(err.status, 409);
        assert.strictEqual(err.message, EXPECTED_CONFLICT_MESSAGE);
        return true;
      },
      "Deliberação da Aba 2 com hash obsoleto deve ser sumariamente bloqueada com 409"
    );
    console.log("  ✓ Aba 2 bloqueada com 409 Conflict ao tentar deliberar sobre versão de texto desatualizada.");

    // Aba 2: Após recarregar a tela (obtendo newCandidateHash), a deliberação é aceita!
    const resolved2 = await resolveHumanLegalReviewFinding(
      repo1,
      initialReview.id,
      {
        findingKey: "unverified_claim_202",
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "Critério de maior desconto não se limita a obras nos termos do art. 34 da Lei 14.133.",
        expectedCandidateHash: newCandidateHash, // HASH ATUALIZADO APÓS RECARGA!
        expurgationConfirmed: true,
      },
      "uid_ceo",
      CEO_EMAIL,
      1720000002000
    );
    const dec2 = resolved2.findingDecisions?.["unverified_claim_202"];
    assert.ok(dec2, "Decisão 2 deve ter sido gravada após recarregar");
    assert.strictEqual(dec2.state, "NAO_COMPROVADO");
    assert.strictEqual(dec2.expectedCandidateHash, newCandidateHash);
    console.log("  ✓ Aba 2 aceita após recarregar a página com o hash atualizado.");

    // ---------------------------------------------------------------------------
    // TESTE 8: Preservação cumulativa e imutável do histórico com hashes
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 8] Preservação de histórico cumulativo com hashes de cada deliberação");
    // Nova deliberação sobre o achado 1 com nova justificativa
    const resolved1Update = await resolveHumanLegalReviewFinding(
      repo1,
      initialReview.id,
      {
        findingKey: "chg_CHG-101",
        action: "DECLARAR_DIVERGENCIA",
        justification: "Identificada controvérsia sobre a aplicabilidade em empresas estatais.",
        divergenceNature: "Divergência entre doutrina da Lei 13.303 vs 14.133",
        expectedCandidateHash: newCandidateHash,
      },
      "uid_ceo",
      CEO_EMAIL,
      1720000003000
    );

    const dec1Updated = resolved1Update.findingDecisions?.["chg_CHG-101"];
    assert.strictEqual(dec1Updated?.state, "DIVERGENCIA_LEGITIMA");
    assert.strictEqual(dec1Updated?.expectedCandidateHash, newCandidateHash);
    assert.strictEqual(dec1Updated?.history?.length, 1);
    // Histórico deve conter a primeira deliberação com o hash antigo preservado
    assert.strictEqual(dec1Updated?.history?.[0].state, "CONFIRMADO_PELO_CEO");
    assert.strictEqual(dec1Updated?.history?.[0].expectedCandidateHash, correctCandidateHash);
    assert.strictEqual(dec1Updated?.history?.[0].candidateHashAtDecision, correctCandidateHash);
    console.log("  ✓ Histórico cumulativo preservou 100% das decisões anteriores com seus respectivos hashes.");

    // ---------------------------------------------------------------------------
    // TESTE 9: Garantia de isolamento dos Estágios B e C (Fail-Closed 503)
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 9] Garantia de bloqueio dos Estágios B e C durante execução do Estágio A");
    await assert.rejects(
      async () => {
        await closeLegalReviewSupplementFlow(
          repo1,
          initialReview.id,
          { overallJustification: "Tentando encerrar B com flag desligada." },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Estágio B deve retornar 503"
    );
    console.log("  ✓ Estágio B bloqueado com 503.");

    await assert.rejects(
      async () => {
        await approveLegalReview(repo1, initialReview.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Estágio C deve retornar 503"
    );
    console.log("  ✓ Estágio C bloqueado com 503.");

    // ---------------------------------------------------------------------------
    // TESTE 10: Garantia de imutabilidade do Catálogo de Alunos
    // ---------------------------------------------------------------------------
    console.log("\n[Teste 10] Garantia de imutabilidade do catálogo de alunos");
    const lessonInRepo = await repo1.getLesson(initialLesson.id);
    assert.strictEqual(lessonInRepo?.content, initialLesson.content);
    assert.strictEqual(lessonInRepo?.version, 1);
    assert.strictEqual(lessonInRepo?.approvedAt, 1720000000000);
    console.log("  ✓ Catálogo de alunos permaneceu 100% inalterado (v1) e intocado.");

    console.log("\n================================================================================");
    console.log("✓ TODOS OS 10 TESTES ADVERSARIAIS DA ETAPA 8.2 FORAM APROVADOS COM 100% DE SUCESSO!");
    console.log("================================================================================\n");
  } finally {
    // Restaura flags originais
    if (origA !== undefined) process.env.LEGAL_REVIEW_STAGE_A_ENABLED = origA;
    else delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;

    if (origB !== undefined) process.env.LEGAL_REVIEW_STAGE_B_ENABLED = origB;
    else delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;

    if (origC !== undefined) process.env.LEGAL_REVIEW_STAGE_C_ENABLED = origC;
    else delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;
  }
}

runStageAHashConcurrencyTests().catch((err) => {
  console.error("FALHA NA SUÍTE DE TESTES DA ETAPA 8.2:", err);
  process.exit(1);
});
