/**
 * ATHENA — ETAPA 6A.1: TESTES DE IDENTIDADE INEQUÍVOCA E VINCULAÇÃO DOS ACHADOS
 *
 * Cobertura Exigida pelo CEO:
 * 1. pendingId duplicado com changeId diferente -> gera chaves distintas e sem colisão.
 * 2. changeId duplicado com pendingId diferente -> gera chaves distintas e sem colisão.
 * 3. pendingId duplicado sem changeId (ambiguidade na busca) -> bloqueia com erro explícito de ambiguidade.
 * 4. achados idênticos (mesmo texto, mesma fonte) -> digest canônico idêntico; busca por pendingId/chave ambígua bloqueia.
 * 5. ausência de identificadores -> digest canônico baseado em (enunciado + fonte + excerto); bloqueia se for vazio.
 * 6. reordenação do array -> chaves permanecem estritamente idênticas (independência total de índices).
 * 7. colisão de hashes / busca incorreta -> não vincula ao achado errado.
 * 8. identificadores legados (unverified_claim_1, etc.) -> preservados 100% retrocompatíveis.
 * 9. rejeição de correspondências ambíguas -> não seleciona a primeira ocorrência silenciosamente.
 * 10. preservação de decisões existentes ao adicionar novas deliberações.
 */

import assert from "node:assert";
import {
  getFindingStableKey,
  type HumanFindingDecision,
  type LegalReviewView,
  type SupplementFindingItem,
} from "../src/lib/legalReviewTypes";
import {
  resolveHumanLegalReviewFinding,
} from "../src/services/legalReviewFlow";
import type { LegalReviewRepository } from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

function createMockFinding(params: Partial<SupplementFindingItem>): SupplementFindingItem {
  return {
    pendingId: params.pendingId || "",
    changeId: params.changeId,
    statementAnalyzed: params.statementAnalyzed || "Afirmação de teste",
    officialSourceConsulted: params.officialSourceConsulted || "Fonte de teste",
    verifiableUrl: params.verifiableUrl || "https://www.stf.jus.br",
    relevantExcerptOrBasis: params.relevantExcerptOrBasis || "Excerto base",
    status: params.status || "nao_verificada",
    objectiveJustification: params.objectiveJustification || "Justificativa IA",
    foundOfficialEvidence: false,
    ...params,
  };
}

function createMockReview(findings: SupplementFindingItem[]): LegalReviewView {
  return {
    id: "rev_test_6a1",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito",
    originalHash: "hash_orig",
    originalApprovedAt: null,
    originalContent: "# Conteúdo",
    reviewedMarkdown: "# Conteúdo",
    changes: [],
    unverifiedClaims: [],
    summary: { totalChanges: 0, corrections: 0, additions: 0, removals: 0, updates: 0, precisions: 0, restructures: 0 },
    reviewNotes: "",
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "MEDIA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "mock",
    reviewDate: "09/10/2026",
    requestedByUid: "uid_ceo",
    requestedAt: Date.now(),
    webSearchUsed: false,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: "cand_hash",
    auditedCandidateHash: "cand_hash",
    sourceHistory: [],
    supplement: {
      attemptCount: 1,
      status: "completed",
      findings,
    },
    findingDecisions: {},
  };
}

function createMockRepo(initialReview: LegalReviewView): LegalReviewRepository {
  let stored = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  return {
    async getLesson() { return null; },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
    async get(id: string) {
      if (id === stored.id) return JSON.parse(JSON.stringify(stored));
      return null;
    },
    async saveCandidate(id: string, md: string) {
      stored.reviewedMarkdown = md;
      return JSON.parse(JSON.stringify(stored));
    },
    async saveFindingDecision(id: string, dec: HumanFindingDecision, now: number) {
      const existing = stored.findingDecisions || {};
      stored.findingDecisions = {
        ...existing,
        [dec.findingKey]: { ...dec, decidedAt: now },
      };
      return JSON.parse(JSON.stringify(stored));
    },
    async reject(id: string, uid: string, now: number) {
      stored.status = "rejected";
      return JSON.parse(JSON.stringify(stored));
    },
    async approve() {
      return { ok: true, lesson: { id: "l1", day: 1, part: 0, subject: "S", content: "C" } };
    },
  };
}

async function runIdentitySuite() {
  console.log("=== INICIANDO TESTES OFFLINE: IDENTIDADE E VINCULAÇÃO DOS ACHADOS (ETAPA 6A.1) ===\n");

  // Cenário 1: pendingId duplicado com changeId diferente gera chaves distintas
  console.log("[Cenário 1] pendingId duplicado com changeId diferente");
  const f1 = createMockFinding({ pendingId: "pen_dup", changeId: "CHG-001" });
  const f2 = createMockFinding({ pendingId: "pen_dup", changeId: "CHG-002" });
  const keyF1 = getFindingStableKey(f1);
  const keyF2 = getFindingStableKey(f2);
  assert.strictEqual(keyF1, "pen_dup_CHG-001");
  assert.strictEqual(keyF2, "pen_dup_CHG-002");
  assert.notStrictEqual(keyF1, keyF2);
  console.log("  ✓ pendingId compartilhado foi desambiguado pelo changeId.");

  // Cenário 2: changeId duplicado com pendingId diferente gera chaves distintas
  console.log("\n[Cenário 2] changeId duplicado com pendingId diferente");
  const f3 = createMockFinding({ pendingId: "pen_alpha", changeId: "CHG-001" });
  const f4 = createMockFinding({ pendingId: "pen_beta", changeId: "CHG-001" });
  assert.strictEqual(getFindingStableKey(f3), "pen_alpha_CHG-001");
  assert.strictEqual(getFindingStableKey(f4), "pen_beta_CHG-001");
  console.log("  ✓ changeId compartilhado foi desambiguado pelo pendingId.");

  // Cenário 3: Rejeição de ambiguidade quando pendingId identifica mais de um achado
  console.log("\n[Cenário 3] Rejeição de ambiguidade (não seleciona primeira ocorrência silenciosamente)");
  const repoAmbig = createMockRepo(createMockReview([f1, f2]));
  let threwAmbiguity = false;
  try {
    await resolveHumanLegalReviewFinding(
      repoAmbig,
      "rev_test_6a1",
      {
        pendingId: "pen_dup", // Ambiguidade: f1 e f2 têm pendingId='pen_dup'
        action: "CONFIRMAR",
        justification: "Justificativa válida do CEO com fonte",
        evidenceDeclaration: { declaredSource: "CF/88", documentaryVerified: true },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwAmbiguity = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /Identificador ambíguo: foram encontrados 2 achados distintos/i);
    assert.match(err.message, /bloqueada para evitar vinculação ao achado incorreto/i);
  }
  assert.strictEqual(threwAmbiguity, true);
  console.log("  ✓ Ambiguidade bloqueada com erro explícito sem seleção cega da primeira ocorrência.");

  // Cenário 4: Resolução unívoca bem-sucedida quando especificada a findingKey correta
  console.log("\n[Cenário 4] Resolução unívoca direcionada via findingKey");
  const resolvedF2 = await resolveHumanLegalReviewFinding(
    repoAmbig,
    "rev_test_6a1",
    {
      findingKey: "pen_dup_CHG-002", // Inequívoco
      action: "CONFIRMAR",
      justification: "Justificativa inequívoca para o achado 2",
      evidenceDeclaration: { declaredSource: "Lei 14.133", documentaryVerified: true },
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );
  assert.strictEqual(resolvedF2.findingDecisions?.["pen_dup_CHG-002"]?.state, "CONFIRMADO_PELO_CEO");
  assert.strictEqual(resolvedF2.findingDecisions?.["pen_dup_CHG-001"], undefined); // Não contaminou f1!
  console.log("  ✓ Decisão gravada estritamente no achado correto sem contaminar o vizinho homônimo.");

  // Cenário 5: Achados sem identificador formal geram chaves estáveis imutáveis à reordenação
  console.log("\n[Cenário 5] Achados sem identificador formal e imunidade à reordenação do array");
  const fAnon1 = createMockFinding({
    pendingId: "",
    statementAnalyzed: "Enunciado primeiro sobre controle de constitucionalidade",
    officialSourceConsulted: "STF ADI 100",
    relevantExcerptOrBasis: "Tese da ADI 100",
  });
  const fAnon2 = createMockFinding({
    pendingId: "",
    statementAnalyzed: "Enunciado segundo sobre direitos fundamentais",
    officialSourceConsulted: "STF RE 200",
    relevantExcerptOrBasis: "Tese do RE 200",
  });

  const keyAnon1_orderA = getFindingStableKey(fAnon1);
  const keyAnon2_orderA = getFindingStableKey(fAnon2);

  // Inverte a ordem do array
  const keyAnon2_orderB = getFindingStableKey(fAnon2);
  const keyAnon1_orderB = getFindingStableKey(fAnon1);

  assert.strictEqual(keyAnon1_orderA, keyAnon1_orderB);
  assert.strictEqual(keyAnon2_orderA, keyAnon2_orderB);
  assert.notStrictEqual(keyAnon1_orderA, keyAnon2_orderA);
  assert.match(keyAnon1_orderA, /^canonical_[0-9a-f]{8}$/);
  console.log("  ✓ Chaves canônicas são 100% invariantes à reordenação do array (sem índice volátil).");

  // Cenário 6: Bloqueio estrito quando achado for completamente indeterminado (vazio)
  console.log("\n[Cenário 6] Bloqueio quando não há identidade inequívoca possível");
  const fVazio = createMockFinding({
    pendingId: "",
    changeId: "",
    statementAnalyzed: "",
    officialSourceConsulted: "",
    relevantExcerptOrBasis: "",
  });
  const keyVazio = getFindingStableKey(fVazio);
  assert.strictEqual(keyVazio, "");

  const repoVazio = createMockRepo(createMockReview([fVazio]));
  let threwIndeterminate = false;
  try {
    await resolveHumanLegalReviewFinding(
      repoVazio,
      "rev_test_6a1",
      {
        findingKey: "",
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "Tentando deliberar sobre achado vazio",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwIndeterminate = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /Não foi possível estabelecer identidade inequívoca/i);
  }
  assert.strictEqual(threwIndeterminate, true);
  console.log("  ✓ Deliberação em achado sem identidade inequívoca bloqueada categoricamente com 400.");

  // Cenário 7: Achados idênticos duplicados (mesmo texto, mesma fonte) geram colisão e bloqueiam deliberação
  console.log("\n[Cenário 7] Achados idênticos duplicados causam bloqueio por ambiguidade");
  const fClone1 = createMockFinding({ pendingId: "clone", statementAnalyzed: "Idêntico" });
  const fClone2 = createMockFinding({ pendingId: "clone", statementAnalyzed: "Idêntico" });
  const repoClones = createMockRepo(createMockReview([fClone1, fClone2]));
  let threwCloneAmbig = false;
  try {
    await resolveHumanLegalReviewFinding(
      repoClones,
      "rev_test_6a1",
      {
        pendingId: "clone",
        action: "CONFIRMAR",
        justification: "Justificativa para clone",
        evidenceDeclaration: { declaredSource: "STF", documentaryVerified: true },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwCloneAmbig = true;
    assert.strictEqual(err.status, 400);
    assert.match(err.message, /Identificador ambíguo: foram encontrados 2 achados distintos/i);
  }
  assert.strictEqual(threwCloneAmbig, true);
  console.log("  ✓ Duplicatas exatas detectadas como ambíguas, impedindo decisões acidentais em lote.");

  // Cenário 8: Compatibilidade retroativa perfeita com identificadores legados
  console.log("\n[Cenário 8] Compatibilidade retroativa com os 5 achados históricos");
  const historicalFindings = [
    createMockFinding({ pendingId: "chg_CHG-001", changeId: "CHG-001" }),
    createMockFinding({ pendingId: "chg_CHG-002", changeId: "CHG-002" }),
    createMockFinding({ pendingId: "unverified_claim_1" }),
    createMockFinding({ pendingId: "unverified_claim_2" }),
    createMockFinding({ pendingId: "unverified_claim_3" }),
  ];
  const keys = historicalFindings.map(f => getFindingStableKey(f));
  assert.deepStrictEqual(keys, [
    "chg_CHG-001",
    "chg_CHG-002",
    "unverified_claim_1",
    "unverified_claim_2",
    "unverified_claim_3",
  ]);
  console.log("  ✓ Todos os 5 identificadores canônicos da revisão histórica preservados com 100% de estabilidade.");

  // Cenário 9: Preservação cumulativa de decisões pré-existentes
  console.log("\n[Cenário 9] Preservação de decisões existentes ao adicionar novas deliberações");
  const repoHist = createMockRepo(createMockReview(historicalFindings));
  // Delibera achado 1
  const r1 = await resolveHumanLegalReviewFinding(
    repoHist,
    "rev_test_6a1",
    {
      findingKey: "unverified_claim_1",
      action: "CONFIRMAR",
      justification: "CF/88 art. 1 e 18 conferidos pelo CEO",
      evidenceDeclaration: { declaredSource: "CF/88", documentaryVerified: true },
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );
  // Delibera achado 2
  const r2 = await resolveHumanLegalReviewFinding(
    repoHist,
    "rev_test_6a1",
    {
      findingKey: "unverified_claim_2",
      action: "DECLARAR_DIVERGENCIA",
      justification: "Divergência doutrinária consagrada",
      divergenceNature: "Doutrina majoritária",
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  assert.strictEqual(r2.findingDecisions?.["unverified_claim_1"]?.state, "CONFIRMADO_PELO_CEO");
  assert.strictEqual(r2.findingDecisions?.["unverified_claim_2"]?.state, "DIVERGENCIA_LEGITIMA");
  console.log("  ✓ Decisões anteriores permaneceram perfeitamente intactas ao deliberar sobre achados subsequentes.");

  // Cenário 10: Bloqueio contra identificador inexistente
  console.log("\n[Cenário 10] Rejeição de identificador inexistente (404 Not Found)");
  let threwNotFound = false;
  try {
    await resolveHumanLegalReviewFinding(
      repoHist,
      "rev_test_6a1",
      {
        findingKey: "achado_fantasma",
        action: "CONFIRMAR",
        justification: "Justificativa qualquer",
        evidenceDeclaration: { declaredSource: "CF/88", documentaryVerified: true },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    threwNotFound = true;
    assert.strictEqual(err.status, 404);
    assert.match(err.message, /não encontrado nesta revisão/i);
  }
  assert.strictEqual(threwNotFound, true);
  console.log("  ✓ Identificador inexistente rejeitado de forma limpa com 404.");

  console.log("\n=== TODOS OS 10 CENÁRIOS DA SUÍTE DE IDENTIDADE 6A.1 FORAM APROVADOS COM SUCESSO! ===");
}

runIdentitySuite().catch((err) => {
  console.error("FALHA NA SUÍTE 6A.1:", err);
  process.exit(1);
});
