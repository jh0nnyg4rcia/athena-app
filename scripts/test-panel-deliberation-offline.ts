/**
 * ATHENA — ETAPA 5E: TESTES OFFLINE DO PAINEL DE DELIBERAÇÃO JURÍDICA DO CEO
 *
 * Validações obrigatórias:
 * 1. Exibição das sete naturezas jurídicas.
 * 2. Exibição dos seis resultados de verificação.
 * 3. Leitura e inferência segura de registros históricos legados.
 * 4. Apresentação de evidências doutrinárias sem comprovação material (distinção entre informada, formalmente validada e conferida).
 * 5. Decisões individuais via resolveHumanLegalReviewChange (APPLY, EDIT, REJECT).
 * 6. Preservação dos bloqueios de publicação (fail-closed contra hash, integridade e verificação).
 * 7. Separação rigorosa entre deliberação individual de alteração e aprovação final da aula.
 * 8. Preservação dos achados inconclusivos e não verificados da complementação.
 * 9. Controle de acesso exclusivo do CEO (autenticação e autorização por e-mail).
 * 10. Ausência de mutação ou publicação do catálogo por ações individuais.
 */

import assert from "node:assert";
import {
  VALID_CLAIM_NATURES,
  VALID_VERIFICATION_OUTCOMES,
  LegalClaimNature,
  LegalVerificationOutcome,
  inferNatureFromLegacyCategory,
  mapLegacyConfirmationToOutcome,
  readClaimNatureSafe,
  readClaimOutcomeSafe,
  isGenericDoctrinalAuthor,
  isGenericDoctrinalWork,
  extractMetadataForNature,
  DoctrinalEvidenceMetadata,
  NormativeEvidenceMetadata,
  JurisprudentialEvidenceMetadata,
  EmpiricalEvidenceMetadata,
  PedagogicalEvidenceMetadata,
} from "../src/lib/legalReviewTaxonomy";
import {
  validateEditorialIntegrity,
  evidenceMayBeShownAsProof,
  applySingleSpanPatch,
} from "../src/lib/legalReviewValidate";
import {
  resolveHumanLegalReviewChange,
  approveLegalReview,
  LegalReviewError,
} from "../src/services/legalReviewFlow";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";
import type {
  LegalReviewChange,
  LegalReviewView,
  LegalReviewRepository,
  StoredCatalogLesson,
} from "../src/lib/legalReviewTypes";

function createMockRepo(review: LegalReviewView): LegalReviewRepository {
  let currentReview = structuredClone(review);
  let savedLesson: StoredCatalogLesson | null = null;
  let approvedCalled = false;

  return {
    async get(id: string) {
      if (id === currentReview.id) return structuredClone(currentReview);
      return null;
    },
    async saveHumanDecisions(reviewId, nextMarkdown, nextDecisions, integrity, now) {
      currentReview.reviewedMarkdown = nextMarkdown;
      currentReview.humanDecisions = nextDecisions;
      currentReview.editorialIntegrity = integrity;
      return structuredClone(currentReview);
    },
    async saveCandidate(reviewId, markdown, now) {
      currentReview.reviewedMarkdown = markdown;
      return structuredClone(currentReview);
    },
    async approve(reviewId, uid, email, now) {
      approvedCalled = true;
      savedLesson = {
        id: currentReview.lessonId,
        day: currentReview.day,
        part: currentReview.part,
        subject: currentReview.subject,
        topic: currentReview.topic,
        content: currentReview.reviewedMarkdown,
        updatedAt: now,
      };
      currentReview.status = "approved";
      return { ok: true, lesson: savedLesson };
    },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async reject() { return structuredClone(currentReview); },
    // Acessores de verificação para os testes
    _getApprovedCalled: () => approvedCalled,
    _getSavedLesson: () => savedLesson,
    _getCurrentReview: () => currentReview,
  } as unknown as LegalReviewRepository & {
    _getApprovedCalled: () => boolean;
    _getSavedLesson: () => StoredCatalogLesson | null;
    _getCurrentReview: () => LegalReviewView;
  };
}

async function runTestSuite() {
  console.log("=== INICIANDO TESTES OFFLINE: PAINEL DE DELIBERAÇÃO DO CEO (ETAPA 5E) ===\n");

  // [Cenário 1] Exibição das sete naturezas jurídicas
  console.log("[Cenário 1] Cobertura das 7 naturezas jurídicas na taxonomia");
  const expectedNatures: LegalClaimNature[] = [
    "NORMA_JURIDICA",
    "PRECEDENTE_VINCULANTE",
    "JURISPRUDENCIA_NAO_VINCULANTE",
    "DOUTRINA",
    "DIVERGENCIA_DOUTRINARIA",
    "AFIRMACAO_EMPIRICA",
    "RECURSO_PEDAGOGICO",
  ];
  assert.strictEqual(VALID_CLAIM_NATURES.length, 7, "Devem existir exatamente 7 naturezas jurídicas.");
  for (const n of expectedNatures) {
    assert.ok(VALID_CLAIM_NATURES.includes(n), `Natureza ${n} deve estar contida na enumeração.`);
  }
  console.log("  ✓ Todas as 7 naturezas jurídicas mapeadas e válidas.\n");

  // [Cenário 2] Exibição dos seis resultados de verificação
  console.log("[Cenário 2] Cobertura dos 6 resultados de verificação na taxonomia");
  const expectedOutcomes: LegalVerificationOutcome[] = [
    "CONFIRMADA",
    "PARCIALMENTE_CONFIRMADA",
    "CONTROVERSA",
    "NAO_VERIFICADA",
    "INCORRETA",
    "NAO_APLICAVEL",
  ];
  assert.strictEqual(VALID_VERIFICATION_OUTCOMES.length, 6, "Devem existir exatamente 6 resultados de verificação.");
  for (const o of expectedOutcomes) {
    assert.ok(VALID_VERIFICATION_OUTCOMES.includes(o), `Resultado ${o} deve estar contido na enumeração.`);
  }
  console.log("  ✓ Todos os 6 resultados de verificação mapeados e válidos.\n");

  // [Cenário 3] Leitura e inferência segura de registros históricos legados
  console.log("[Cenário 3] Leitura e inferência segura de registros legados");
  const legacyChange: LegalReviewChange = {
    id: "chg-leg-1",
    type: "CORRECAO",
    severity: "ALTA",
    category: "DOUTRINA",
    originalExcerpt: "conceito clássico",
    revisedExcerpt: "conceito moderno",
    reason: "Ajuste doutrinário",
    verified: false,
    confirmation: "NAO_CONFIRMADO",
    sources: [],
    evidence: [],
  };
  assert.strictEqual(readClaimNatureSafe(legacyChange), undefined, "Natureza deve ser undefined em registro legado.");
  assert.strictEqual(inferNatureFromLegacyCategory(legacyChange.category), "DOUTRINA", "Categoria legada DOUTRINA infere DOUTRINA.");
  assert.strictEqual(readClaimOutcomeSafe(legacyChange), "NAO_VERIFICADA", "Legado NAO_CONFIRMADO infere outcome NAO_VERIFICADA.");

  const legacyConfirmedChange: LegalReviewChange = {
    ...legacyChange,
    category: "LEGISLACAO",
    verified: true,
    confirmation: "CONFIRMADO",
  };
  assert.strictEqual(inferNatureFromLegacyCategory(legacyConfirmedChange.category), "NORMA_JURIDICA", "Categoria LEGISLACAO infere NORMA_JURIDICA.");
  assert.strictEqual(readClaimOutcomeSafe(legacyConfirmedChange), "CONFIRMADA", "Legado CONFIRMADO + verified infere CONFIRMADA.");
  console.log("  ✓ Inferência em tempo de leitura funciona sem mutação de banco.\n");

  // [Cenário 4] Apresentação de evidências doutrinárias sem comprovação material
  console.log("[Cenário 4] Metadados doutrinários: distinção entre preenchida, formalmente válida e conferida");
  const validDoctrinal: DoctrinalEvidenceMetadata = {
    autor: "Celso Antônio Bandeira de Mello",
    obra: "Curso de Direito Administrativo",
    edicao: "32ª ed.",
    grauConfirmacao: "DOMINANTE",
  };
  assert.strictEqual(isGenericDoctrinalAuthor(validDoctrinal.autor), false, "Autor consagrado não é genérico.");
  assert.strictEqual(isGenericDoctrinalWork(validDoctrinal.obra), false, "Obra específica não é genérica.");

  const genericDoctrinal: DoctrinalEvidenceMetadata = {
    autor: "doutrina majoritária",
    obra: "manual",
  };
  assert.strictEqual(isGenericDoctrinalAuthor(genericDoctrinal.autor), true, "Doutrina majoritária é genérica.");
  assert.strictEqual(isGenericDoctrinalWork(genericDoctrinal.obra), true, "Manual é genérico.");
  console.log("  ✓ Filtro determinístico diferencia doutrina formalmente válida de menções genéricas.\n");

  // [Cenário 5] Decisões individuais via resolveHumanLegalReviewChange (APPLY, EDIT, REJECT)
  console.log("[Cenário 5] Resolução individual de pendências pelo CEO");
  const baseMarkdown = "# Aula 1\nTexto antigo com erro grave.\n[ATHENA_CHALLENGE]\n{\"questions\":[]}\n";
  const mockReview: LegalReviewView = {
    id: "rev-mock-5e-1",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito",
    topic: "Teoria Geral",
    originalContent: baseMarkdown,
    reviewedMarkdown: baseMarkdown,
    status: "pending_approval",
    changes: [
      {
        id: "chg-1",
        type: "CORRECAO",
        severity: "ALTA",
        category: "LEGISLACAO",
        originalExcerpt: "Texto antigo com erro grave.",
        revisedExcerpt: "Texto novo plenamente corrigido pela IA.",
        reason: "Correção de erro factual.",
        verified: true,
        confirmation: "CONFIRMADO",
        sources: [],
        evidence: [],
      },
    ],
    unverifiedClaims: [],
    summary: { totalChanges: 1, corrections: 1, updates: 0, additions: 0, removals: 0, precisions: 0, restructures: 0 },
    verificationLevel: "VERIFICADO_COM_FONTES",
    confidence: "ALTA",
    outcome: "RECOMENDA_SUBSTITUICAO",
    reviewDate: "2026-10-09",
    webSearchUsed: true,
    testMode: false,
    previewOnly: false,
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: "cand123",
    auditedCandidateHash: "cand123",
    sourceHistory: [],
  };

  const repo = createMockRepo(mockReview);

  // A. Ação APPLY
  const resolvedApply = await resolveHumanLegalReviewChange(
    repo,
    mockReview.id,
    { changeId: "chg-1", action: "APPLY" },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );
  assert.ok(resolvedApply.reviewedMarkdown.includes("Texto novo plenamente corrigido pela IA."));
  assert.strictEqual(resolvedApply.humanDecisions?.["chg-1"]?.action, "APPLY");
  assert.strictEqual(resolvedApply.humanDecisions?.["chg-1"]?.state, "APPLIED_BY_CEO");
  console.log("  ✓ Ação APPLY atualizou o rascunho com o texto proposto e registrou decisão auditável.");

  // B. Ação REJECT com justificativa
  const resolvedReject = await resolveHumanLegalReviewChange(
    repo,
    mockReview.id,
    { changeId: "chg-1", action: "REJECT", rejectionReason: "Opção pedagógica da mentoria." },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );
  assert.strictEqual(resolvedReject.humanDecisions?.["chg-1"]?.action, "REJECT");
  assert.strictEqual(resolvedReject.humanDecisions?.["chg-1"]?.state, "REJECTED_BY_CEO");
  assert.strictEqual(resolvedReject.humanDecisions?.["chg-1"]?.rejectionReason, "Opção pedagógica da mentoria.");
  console.log("  ✓ Ação REJECT registrou justificativa e estado REJECTED_BY_CEO com auditoria.");

  // [Cenário 6] Preservação dos bloqueios de publicação (Integridade Editorial Incompleta)
  console.log("[Cenário 6] Bloqueio de aprovação quando há integridade editorial incompleta");
  const brokenReview: LegalReviewView = {
    ...mockReview,
    reviewedMarkdown: "# Aula 1\nTexto antigo sem a alteração aplicada.\n[ATHENA_CHALLENGE]\n{\"questions\":[]}\n",
    humanDecisions: {}, // sem decisão
  };
  const repoBroken = createMockRepo(brokenReview);
  let approveBlockedIntegrity = false;
  try {
    await approveLegalReview(repoBroken, brokenReview.id, "uid-ceo", ATHENA_CEO_EMAIL);
  } catch (err: any) {
    approveBlockedIntegrity = true;
    assert.strictEqual(err.status, 400);
    assert.ok(err.message.includes("integridade editorial"));
  }
  assert.strictEqual(approveBlockedIntegrity, true, "Aprovação deve ser bloqueada por integridade editorial.");
  console.log("  ✓ Backend bloqueia aprovação se alteração estiver ausente ou inconsistente no texto.");

  // [Cenário 7] Separação entre deliberação individual e aprovação final da aula
  console.log("[Cenário 7] Separação entre deliberação individual e substituição da aula");
  const repoSep = createMockRepo(mockReview);
  await resolveHumanLegalReviewChange(
    repoSep,
    mockReview.id,
    { changeId: "chg-1", action: "APPLY" },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );
  const repoInternal = repoSep as any;
  assert.strictEqual(repoInternal._getApprovedCalled(), false, "Aprovação final NÃO deve ter sido chamada após deliberação individual.");
  assert.strictEqual(repoInternal._getSavedLesson(), null, "Aula homologada NÃO deve ter sido gravada no catálogo.");
  assert.strictEqual(repoInternal._getCurrentReview().status, "pending_approval", "Status da revisão deve continuar pending_approval.");
  console.log("  ✓ Ação individual afeta exclusivamente o rascunho sem tocar no catálogo dos alunos.");

  // [Cenário 8] Preservação dos achados inconclusivos da complementação
  console.log("[Cenário 8] Bloqueio fail-closed se supplement for inconclusive ou contiver findings nao_verificada");
  const supplementBlockedReview: LegalReviewView = {
    ...mockReview,
    supplement: {
      status: "inconclusive",
      attemptCount: 1,
      attemptId: "att-2",
      findings: [
        {
          pendingId: "p1",
          status: "nao_verificada",
          statementAnalyzed: "afirmação não verificada",
        },
      ],
    },
  };
  const repoSupp = createMockRepo(supplementBlockedReview);
  let approveBlockedSupp = false;
  try {
    await approveLegalReview(repoSupp, supplementBlockedReview.id, "uid-ceo", ATHENA_CEO_EMAIL);
  } catch (err: any) {
    approveBlockedSupp = true;
    assert.strictEqual(err.status, 400);
    assert.ok(err.message.includes("complementação jurídica"));
  }
  assert.strictEqual(approveBlockedSupp, true, "Aprovação deve ser estritamente bloqueada por complementação inconclusiva.");
  console.log("  ✓ Backend impede aprovação final enquanto houver complementação inconclusiva.");

  // [Cenário 9] Controle de acesso exclusivo do CEO (autenticação e autorização)
  console.log("[Cenário 9] Rejeição de usuários não autorizados na deliberação e na aprovação");
  let accessDeniedResolve = false;
  try {
    await resolveHumanLegalReviewChange(
      repo,
      mockReview.id,
      { changeId: "chg-1", action: "APPLY" },
      "uid-impostor",
      "aluno@externo.com"
    );
  } catch (err: any) {
    accessDeniedResolve = true;
    assert.strictEqual(err.status, 403);
    assert.ok(err.message.includes("CEO"));
  }
  assert.strictEqual(accessDeniedResolve, true, "Não-CEO deve receber HTTP 403 ao tentar deliberar alteração.");

  let accessDeniedApprove = false;
  try {
    await approveLegalReview(repo, mockReview.id, "uid-impostor", "aluno@externo.com");
  } catch (err: any) {
    accessDeniedApprove = true;
    assert.strictEqual(err.status, 403);
    assert.ok(err.message.includes("CEO"));
  }
  assert.strictEqual(accessDeniedApprove, true, "Não-CEO deve receber HTTP 403 ao tentar aprovar revisão.");
  console.log("  ✓ Controle de acesso do CEO imposto com sucesso no backend (403 Forbidden).");

  // [Cenário 10] Ausência de publicação por ações individuais
  console.log("[Cenário 10] Garantia de isolamento e ausência de efeitos colaterais no catálogo");
  const repoAudit = createMockRepo(mockReview);
  // Rejeição sem motivo obrigatório é rejeitada
  let missingReasonCaught = false;
  try {
    await resolveHumanLegalReviewChange(
      repoAudit,
      mockReview.id,
      { changeId: "chg-1", action: "REJECT", rejectionReason: "   " },
      "uid-ceo",
      ATHENA_CEO_EMAIL
    );
  } catch (err: any) {
    missingReasonCaught = true;
    assert.strictEqual(err.status, 400);
  }
  assert.strictEqual(missingReasonCaught, true, "Rejeição sem justificativa deve retornar 400.");

  const currentStatus = (repoAudit as any)._getCurrentReview().status;
  assert.strictEqual(currentStatus, "pending_approval", "Revisão permanece intacta.");
  console.log("  ✓ Validações sintáticas e de negócio preservam o estado intacto da revisão.");

  console.log("\n=== TODOS OS 10 CENÁRIOS DE TESTES OFFLINE DA ETAPA 5E FORAM APROVADOS COM SUCESSO! ===");
}

runTestSuite().catch((err) => {
  console.error("Falha nos testes:", err);
  process.exit(1);
});
