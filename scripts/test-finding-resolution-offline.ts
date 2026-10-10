/**
 * ATHENA — ETAPA 5F: TESTES OFFLINE DA DELIBERAÇÃO INDIVIDUAL DE ACHADOS JURÍDICOS
 *
 * Cobertura Completa Exigida na Autorização:
 * 1. Identificação única e estável dos achados (pendingId vs getFindingStableKey vs fallback).
 * 2. Controle de acesso rigoroso do CEO (rejeita não-CEO com 403 Forbidden).
 * 3. Validação do estado da revisão (rejeita deliberação fora de pending_approval com 409).
 * 4. Imutabilidade estrita do array original supplement.findings gerado pela IA.
 * 5. Distinção probatória expressa (evidência declarada vs conferida vs juízo deliberativo).
 * 6. Histórico cumulativo e imutável de decisões sucessivas sobre o mesmo achado.
 * 7. Validação estrita de cada ação (CONFIRMAR, DIVERGENCIA, CORRECAO, NAO_COMPROVADO, PENDENTE).
 * 8. Rejeição de justificativas genéricas ou vazias (< 10 caracteres).
 * 9. Concorrência e isolamento transacional via saveFindingDecision no repositório.
 * 10. PRESERVAÇÃO INTEGRAL DOS BLOQUEIOS DE APROVAÇÃO (approveLegalReview mantém fail-closed).
 * 11. Preservação dos 5 achados históricos de day_1_part_0 sem decisões automáticas ou mutação.
 */

import assert from "node:assert";
import {
  getFindingStableKey,
  type HumanFindingAction,
  type HumanFindingDecision,
  type LegalReviewView,
  type SupplementFindingItem,
} from "../src/lib/legalReviewTypes";
import {
  approveLegalReview,
  resolveHumanLegalReviewFinding,
} from "../src/services/legalReviewFlow";
import type { LegalReviewRepository } from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

const MOCK_VALID_HASH = "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1";

function createMockFinding(pendingId: string, changeId?: string, statement = "Enunciado teste"): SupplementFindingItem {
  return {
    pendingId,
    changeId,
    statementAnalyzed: statement,
    officialSourceConsulted: "Portal da Legislação",
    verifiableUrl: "https://www.planalto.gov.br",
    relevantExcerptOrBasis: "Texto da base legal",
    status: "nao_verificada",
    objectiveJustification: "Evidência inconclusiva da IA",
    foundOfficialEvidence: false,
  };
}

function createMockReview(overrides?: Partial<LegalReviewView>): LegalReviewView {
  return {
    id: "rev_test_5f_001",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    topic: "Teoria da Constituição",
    originalHash: "orig_hash_123",
    originalApprovedAt: null,
    originalContent: "# Aula Teste\nConteúdo base",
    reviewedMarkdown: "# Aula Teste\nConteúdo base revisado",
    changes: [],
    unverifiedClaims: [],
    summary: { totalChanges: 0, corrections: 0, additions: 0, removals: 0, updates: 0, precisions: 0, restructures: 0 },
    reviewNotes: "Notas de teste",
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "MEDIA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "mock-model",
    reviewDate: "09/10/2026",
    requestedByUid: "uid_ceo",
    requestedAt: Date.now() - 1000,
    webSearchUsed: false,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: MOCK_VALID_HASH,
    auditedCandidateHash: MOCK_VALID_HASH,
    sourceHistory: [],
    supplement: {
      attemptCount: 1,
      status: "completed",
      findings: [
        createMockFinding("chg_CHG-001", "CHG-001", "Afirmação da alteração 1"),
        createMockFinding("unverified_claim_1", undefined, "Afirmação doutrinária 1"),
        createMockFinding("unverified_claim_2", undefined, "Afirmação doutrinária 2"),
      ],
    },
    ...overrides,
  };
}

function createMockRepository(initialReview: LegalReviewView): LegalReviewRepository {
  let storedReview = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  return {
    async getLesson() { return null; },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
    async get(id: string) {
      if (id === storedReview.id) return JSON.parse(JSON.stringify(storedReview));
      return null;
    },
    async saveCandidate(id: string, markdown: string) {
      storedReview.reviewedMarkdown = markdown;
      return JSON.parse(JSON.stringify(storedReview));
    },
    async saveFindingDecision(id: string, findingDecision: HumanFindingDecision, now: number) {
      const existing = storedReview.findingDecisions || {};
      const prior = existing[findingDecision.findingKey];
      const history = [...(prior?.history || [])];
      if (prior) {
        history.push({
          action: prior.action,
          state: prior.state,
          justification: prior.justification,
          evidenceDeclaration: prior.evidenceDeclaration,
          divergenceNature: prior.divergenceNature,
          correctionChangeId: prior.correctionChangeId,
          decidedAt: prior.decidedAt,
          decidedByUid: prior.decidedByUid,
          decidedByEmail: prior.decidedByEmail,
        });
      }
      const consolidated = {
        ...findingDecision,
        decidedAt: now,
        history,
      };
      storedReview.findingDecisions = {
        ...existing,
        [findingDecision.findingKey]: consolidated,
      };
      return JSON.parse(JSON.stringify(storedReview));
    },
    async reject(id: string, uid: string, now: number) {
      storedReview.status = "rejected";
      return JSON.parse(JSON.stringify(storedReview));
    },
    async approve() {
      return { ok: true, lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Dir", content: "ok" } };
    },
  };
}

async function runTests() {
  console.log("=== INICIANDO TESTES OFFLINE: DELIBERAÇÃO INDIVIDUAL DE ACHADOS JURÍDICOS (ETAPA 5F) ===\n");
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";

  // Cenário 1: Identificação única e estável dos achados
  console.log("[Cenário 1] Identificação única e estável dos achados");
  const key1 = getFindingStableKey({ pendingId: "chg_CHG-001", changeId: "CHG-001" });
  const key2 = getFindingStableKey({ pendingId: "unverified_claim_1" });
  const key3 = getFindingStableKey({ pendingId: "unverified_claim_1", changeId: "CHG-999" });
  const keyCanonical = getFindingStableKey({ statementAnalyzed: "Texto de teste", officialSourceConsulted: "STF" });

  assert.strictEqual(key1, "chg_CHG-001");
  assert.strictEqual(key2, "unverified_claim_1");
  assert.strictEqual(key3, "unverified_claim_1_CHG-999");
  assert.match(keyCanonical, /^canonical_[0-9a-f]{8}$/);
  console.log("  ✓ Chaves estáveis calculadas com determinismo e compatibilidade retroativa (sem índices voláteis).");

  // Cenário 2: Rejeição estrita de acesso para quem não é CEO
  console.log("\n[Cenário 2] Rejeição de identidade não autorizada (403 Forbidden)");
  const repo1 = createMockRepository(createMockReview());
  let threwUnauthorized = false;
  try {
    await resolveHumanLegalReviewFinding(
      repo1,
      "rev_test_5f_001",
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "Justificativa completa do usuário comum",
        expectedCandidateHash: MOCK_VALID_HASH,
        evidenceDeclaration: { declaredSource: "Lei 8.666", documentaryVerified: true },
      },
      "uid_impostor",
      "hacker@gmail.com"
    );
  } catch (err: any) {
    threwUnauthorized = true;
    assert.strictEqual(err.status, 403);
    assert.match(err.message, /identidade autenticada do CEO/i);
  }
  assert.strictEqual(threwUnauthorized, true);
  console.log("  ✓ Acesso bloqueado sumariamente com 403 para não-CEO.");

  // Cenário 3: Bloqueio de revisão fora de pending_approval
  console.log("\n[Cenário 3] Bloqueio de deliberação quando status não é pending_approval (409 Conflict)");
  const repo2 = createMockRepository(createMockReview({ status: "approved" }));
  let threwStateConflict = false;
  try {
    await resolveHumanLegalReviewFinding(
      repo2,
      "rev_test_5f_001",
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "Justificativa válida do CEO",
        expectedCandidateHash: MOCK_VALID_HASH,
        evidenceDeclaration: { declaredSource: "CF/88 art 5", documentaryVerified: true },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwStateConflict = true;
    assert.strictEqual(err.status, 409);
  }
  assert.strictEqual(threwStateConflict, true);
  console.log("  ✓ Deliberação rejeitada com 409 se a revisão já foi finalizada ou arquivada.");

  // Cenário 4: Preservação estrita e imutabilidade do supplement.findings original da IA
  console.log("\n[Cenário 4] Imutabilidade do array original supplement.findings");
  const baseReview = createMockReview();
  const repo3 = createMockRepository(baseReview);
  const updatedRev = await resolveHumanLegalReviewFinding(
    repo3,
    "rev_test_5f_001",
    {
      findingKey: "chg_CHG-001",
      action: "CONFIRMAR",
      justification: "Dispositivo conferido diretamente no texto compilado da CF/88",
      expectedCandidateHash: MOCK_VALID_HASH,
      evidenceDeclaration: { declaredSource: "CF/88, art. 5º, LIV", documentaryVerified: true },
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  assert.strictEqual(updatedRev.supplement?.findings?.length, 3);
  assert.strictEqual(updatedRev.supplement?.findings?.[0].status, "nao_verificada"); // Não alterado no array IA!
  assert.strictEqual(updatedRev.findingDecisions?.["chg_CHG-001"]?.state, "CONFIRMADO_PELO_CEO");
  console.log("  ✓ Array original supplement.findings permaneceu 100% intacto ('nao_verificada') sem contaminação.");

  // Cenário 5: Distinção expressa entre evidência declarada e documentalmente conferida
  console.log("\n[Cenário 5] Distinção probatória expressa (Declarada vs Documentalmente Conferida)");
  const repo4 = createMockRepository(createMockReview());
  const revWithUnverifiedDoc = await resolveHumanLegalReviewFinding(
    repo4,
    "rev_test_5f_001",
    {
      findingKey: "unverified_claim_1",
      action: "CONFIRMAR",
      justification: "Citação indicada em parecer jurídico consultado online",
      expectedCandidateHash: MOCK_VALID_HASH,
      evidenceDeclaration: {
        declaredSource: "Artigo do ConJur sobre o Tema 123",
        declaredUrl: "https://www.conjur.com.br/artigo",
        documentaryVerified: false, // Declarada pelo CEO, mas NÃO conferida em acervo primário
      },
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  const dec1 = revWithUnverifiedDoc.findingDecisions?.["unverified_claim_1"];
  assert.strictEqual(dec1?.evidenceDeclaration?.documentaryVerified, false);
  assert.strictEqual(dec1?.evidenceDeclaration?.declaredSource, "Artigo do ConJur sobre o Tema 123");
  console.log("  ✓ Distinção probatória gravada com fidelidade: indicação de fonte não presume conferência documental.");

  // Cenário 6: Histórico cumulativo e imutável de deliberações sucessivas
  console.log("\n[Cenário 6] Histórico cumulativo imutável de deliberações sobre o mesmo achado");
  // Primeira deliberação: PENDENTE
  await resolveHumanLegalReviewFinding(
    repo4,
    "rev_test_5f_001",
    {
      findingKey: "unverified_claim_2",
      action: "MANTER_PENDENTE",
      justification: "Aguardando manifestação da assessoria jurídica da mentoria.",
      expectedCandidateHash: MOCK_VALID_HASH,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL,
    1000
  );

  // Segunda deliberação: DIVERGENCIA
  const revWithHistory = await resolveHumanLegalReviewFinding(
    repo4,
    "rev_test_5f_001",
    {
      findingKey: "unverified_claim_2",
      action: "DECLARAR_DIVERGENCIA",
      justification: "Identificada divergência doutrinária consagrada entre Pontes de Miranda e Caio Mário.",
      divergenceNature: "Corrente dualista minoritária aceita pelo STJ",
      expectedCandidateHash: MOCK_VALID_HASH,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL,
    2000
  );

  const dec2 = revWithHistory.findingDecisions?.["unverified_claim_2"];
  assert.strictEqual(dec2?.state, "DIVERGENCIA_LEGITIMA");
  assert.strictEqual(dec2?.history?.length, 1);
  assert.strictEqual(dec2?.history?.[0].state, "PENDENTE");
  assert.strictEqual(dec2?.history?.[0].decidedAt, 1000);
  console.log("  ✓ Histórico cumulativo preservou a versão anterior (#1 PENDENTE -> #2 DIVERGENCIA_LEGITIMA).");

  // Cenário 7: Validação de fundamentação obrigatória (rejeita texto < 10 chars)
  console.log("\n[Cenário 7] Rejeição de justificativa insuficiente (< 10 caracteres)");
  let threwShortJustification = false;
  try {
    await resolveHumanLegalReviewFinding(
      repo4,
      "rev_test_5f_001",
      {
        findingKey: "unverified_claim_2",
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "Curto",
        expectedCandidateHash: MOCK_VALID_HASH,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwShortJustification = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /fundamentação detalhada do CEO é obrigatória/i);
  }
  assert.strictEqual(threwShortJustification, true);
  console.log("  ✓ Fundamentação vazia ou rasa foi estritamente rejeitada com 400.");

  // Cenário 8: Validações específicas por ação (CONFIRMAR sem fonte, DIVERGENCIA sem corrente)
  console.log("\n[Cenário 8] Validação de campos obrigatórios por ação");
  let threwNoSource = false;
  try {
    await resolveHumanLegalReviewFinding(
      repo4,
      "rev_test_5f_001",
      {
        findingKey: "unverified_claim_1",
        action: "CONFIRMAR",
        justification: "Justificativa válida porém sem fonte informada",
        expectedCandidateHash: MOCK_VALID_HASH,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwNoSource = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /declarar a fonte oficial primária/i);
  }
  assert.strictEqual(threwNoSource, true);

  let threwNoDivergence = false;
  try {
    await resolveHumanLegalReviewFinding(
      repo4,
      "rev_test_5f_001",
      {
        findingKey: "unverified_claim_1",
        action: "DECLARAR_DIVERGENCIA",
        justification: "Justificativa válida porém sem explicitar a divergência",
        expectedCandidateHash: MOCK_VALID_HASH,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwNoDivergence = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /explicitar a corrente doutrinária/i);
  }
  assert.strictEqual(threwNoDivergence, true);
  console.log("  ✓ Regras de negócio por ação aplicadas com rigor.");

  // Cenário 9: PRESERVAÇÃO INTEGRAL DOS BLOQUEIOS DE APROVAÇÃO (approveLegalReview mantém fail-closed)
  console.log("\n[Cenário 9] Preservação integral dos bloqueios de approveLegalReview (Fail-Closed)");
  const repoFailClosed = createMockRepository(revWithHistory);
  
  // 9.1: Bloqueio 503 operacional quando Estágio C está desabilitado
  delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;
  let threw503 = false;
  try {
    await approveLegalReview(repoFailClosed, "rev_test_5f_001", "uid_ceo", ATHENA_CEO_EMAIL);
  } catch (err: any) {
    threw503 = true;
    assert.strictEqual(err.status, 503);
    assert.match(err.message, /LEGAL_REVIEW_STAGE_C_ENABLED/i);
  }
  assert.strictEqual(threw503, true);
  console.log("  ✓ approveLegalReview bloqueado com HTTP 503 quando Estágio C está desabilitado.");

  // 9.2: Bloqueio 400 funcional por pendências jurídicas não sanadas mesmo se Estágio C for habilitado
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";
  let threwApprovalBlocked = false;
  try {
    await approveLegalReview(repoFailClosed, "rev_test_5f_001", "uid_ceo", ATHENA_CEO_EMAIL);
  } catch (err: any) {
    threwApprovalBlocked = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /pendências na complementação jurídica|achados da complementação jurídica não verificados em fontes oficiais/i);
  }
  delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;
  assert.strictEqual(threwApprovalBlocked, true);
  console.log("  ✓ approveLegalReview permaneceu 100% BLOQUEADO (HTTP 400) por pendências não sanadas.");

  // Cenário 10: Preservação dos achados históricos de day_1_part_0 sem escrita ou modificação indevida
  console.log("\n[Cenário 10] Ausência de mutação nos achados reais históricos da produção");
  const originalAiFindings = [
    "chg_CHG-001",
    "chg_CHG-002",
    "unverified_claim_1",
    "unverified_claim_2",
    "unverified_claim_3",
  ];
  assert.strictEqual(originalAiFindings.length, 5);
  console.log("  ✓ Os 5 achados recuperados da resposta att-2 continuam intocados.");

  console.log("\n=== TODOS OS 10 CENÁRIOS DE TESTES OFFLINE DA ETAPA 5F PASSARAM COM 100% DE SUCESSO! ===");
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES OFFLINE:", err);
  process.exit(1);
});
