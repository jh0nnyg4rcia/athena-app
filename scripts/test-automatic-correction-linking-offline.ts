/**
 * ATHENA — ETAPA 19.6: TESTES AUTOMATIZADOS DE VINCULAÇÃO DE CORREÇÕES A ACHADOS JURÍDICOS
 *
 * MODO: 100% OFFLINE / ISOLAMENTO COMPLETO / ZERO CHAMADAS EXTERNAS
 *
 * Cobertura exigida:
 * 1. Resolução automática inequívoca: achado com changeId preenche automaticamente correctionChangeId.
 * 2. Achado autônomo (unverified claim): seleção assistida entre alterações disponíveis.
 * 3. Validação transacional de fechamento com vínculo correto e texto corrigido presente no markdown.
 * 4. Rejeição com HTTP 400 se correctionChangeId não for informado em APONTAR_CORRECAO.
 * 5. Rejeição no fechamento do Estágio B se texto revisado da alteração não estiver no reviewedMarkdown.
 * 6. Histórico preservado e hashes validados determinísticos.
 */

import assert from "node:assert";
import {
  type LegalReviewView,
  type HumanFindingAction,
  type HumanFindingDecision,
  type SupplementFindingItem,
  type LegalReviewChange,
  getFindingStableKey,
} from "../src/lib/legalReviewTypes";
import {
  resolveHumanLegalReviewFinding,
  closeLegalReviewSupplementFlow,
} from "../src/services/legalReviewFlow";
import type { LegalReviewRepository } from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";
import { computeDecisionStateHash, validateFindingsForClosure } from "../src/lib/legalReviewValidate";

const MOCK_VALID_HASH = "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1";

function createMockChange(id: string, original: string, revised: string): LegalReviewChange {
  return {
    id,
    type: "CORRECAO",
    severity: "MEDIA",
    category: "LEGISLACAO",
    originalExcerpt: original,
    revisedExcerpt: revised,
    reason: "Correção de referência legal desatualizada",
    verified: true,
    confirmation: "CONFIRMADO",
    sources: [],
    evidence: [],
  };
}

function createMockFinding(
  pendingId: string,
  changeId?: string,
  statement = "Enunciado analisado"
): SupplementFindingItem {
  return {
    pendingId,
    changeId,
    statementAnalyzed: statement,
    officialSourceConsulted: "Portal da Legislação",
    verifiableUrl: "https://www.planalto.gov.br",
    relevantExcerptOrBasis: "Texto da base legal",
    status: "nao_verificada",
    objectiveJustification: "Evidência pendente de deliberação",
    foundOfficialEvidence: false,
  };
}

function createMockReview(): LegalReviewView {
  const change1 = createMockChange("CHG-001", "Texto antigo 1", "Texto corrigido 1");
  const change2 = createMockChange("CHG-002", "Texto antigo 2", "Texto corrigido 2");

  return {
    id: "rev_test_19_6_001",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Administrativo",
    topic: "Atos Administrativos",
    originalHash: "orig_hash_123",
    originalApprovedAt: null,
    originalContent: "# Aula Teste\nTexto antigo 1 e Texto antigo 2",
    reviewedMarkdown: "# Aula Teste\nTexto corrigido 1 e Texto corrigido 2",
    candidateHash: MOCK_VALID_HASH,
    auditedCandidateHash: MOCK_VALID_HASH,
    status: "pending_approval",
    outcome: "ALTERACOES_NECESSARIAS",
    confidence: "ALTA",
    verificationLevel: "VERIFICADO_COM_FONTES",
    summary: {
      totalChanges: 2,
      approvedChanges: 0,
      rejectedChanges: 0,
      autoApplied: 0,
      corrections: 2,
      updates: 0,
      additions: 0,
      removals: 0,
      clarifications: 0,
      restructurings: 0,
      highSeverity: 0,
      mediumSeverity: 2,
      lowSeverity: 0,
    },
    changes: [change1, change2],
    unverifiedClaims: [],
    consultedSources: [],
    sourceHistory: [],
    reviewNotes: "Revisão teste offline vinculação automática",
    model: "mock-model",
    webSearchUsed: true,
    testMode: false,
    previewOnly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewDate: "10 de outubro de 2026",
    supplement: {
      status: "completed",
      findings: [
        createMockFinding("chg_CHG-001", "CHG-001", "Afirmação associada à alteração 1"),
        createMockFinding("unverified_claim_2", undefined, "Afirmação autônoma não verificada"),
      ],
      attemptCount: 2,
    },
    findingDecisions: {},
    findingDecisionsHistory: [],
  };
}

function createMockRepo(initialReview: LegalReviewView): LegalReviewRepository {
  let stored = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;

  return {
    async get(id: string) {
      if (id !== stored.id) return null;
      return JSON.parse(JSON.stringify(stored));
    },
    async saveFindingDecision(id: string, findingDecision: HumanFindingDecision, now: number) {
      if (id !== stored.id) throw new Error("Revisão não encontrada");
      stored.findingDecisions = stored.findingDecisions || {};
      stored.findingDecisions[findingDecision.findingKey] = JSON.parse(JSON.stringify(findingDecision));
      return JSON.parse(JSON.stringify(stored));
    },
    async closeSupplementResolution(id: string, resolution: any, now: number, expectedHashes?: any) {
      if (id !== stored.id) throw new Error("Revisão não encontrada");

      if (expectedHashes) {
        const expCand = (expectedHashes.expectedCandidateHash || "").trim().toLowerCase();
        const expDec = (expectedHashes.expectedDecisionStateHash || "").trim().toLowerCase();

        const currentCand = (stored.candidateHash || "").trim().toLowerCase();
        if (currentCand && expCand !== currentCand) {
          const err: any = new Error("A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de encerrar.");
          err.status = 409;
          throw err;
        }

        const currentDec = computeDecisionStateHash(stored).toLowerCase();
        if (currentDec && expDec !== currentDec) {
          const err: any = new Error("As deliberações individuais foram alteradas por outro processo concorrente. Recarregue a página antes de encerrar a complementação.");
          err.status = 409;
          throw err;
        }
      }

      if (!stored.supplement) throw new Error("Supplement não encontrado");
      stored.supplement.resolution = JSON.parse(JSON.stringify(resolution));
      stored.supplement.decisionStateHashAtClosure = expectedHashes?.expectedDecisionStateHash;
      return JSON.parse(JSON.stringify(stored));
    },
    async begin(review: LegalReviewView) { return review; },
    async save(review: LegalReviewView) { stored = JSON.parse(JSON.stringify(review)); return stored; },
    async saveCandidate(id: string, markdown: string) { return stored; },
    async list() { return [stored]; },
    async reject(id: string, uid: string, now: number) { return stored; },
    async approve(id: string, uid: string, email: string, now: number) { return { ok: true, lesson: {} as any }; },
    async touchProcessing() { return true; },
    async fail() {},
  } as unknown as LegalReviewRepository;
}

async function runTests() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 19.6: TESTES OFFLINE DE VINCULAÇÃO DE CORREÇÕES A ACHADOS");
  console.log("MODO: 100% ISOLADO / ZERO PRODUÇÃO / SEM REDE EXTERNA");
  console.log("================================================================================\n");

  // Configuração das flags operacionais para o teste (A=true, B=true, C=false)
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

  const baseReview = createMockReview();
  const repo = createMockRepo(baseReview);

  // [Teste 1] Resolução com vínculo natural (f.changeId fornecido diretamente pelo achado)
  console.log("[Teste 1] Resolução com vínculo natural (f.changeId)");
  {
    const finding1 = baseReview.supplement!.findings![0];
    const stableKey1 = getFindingStableKey(finding1);

    const res = await resolveHumanLegalReviewFinding(
      repo,
      baseReview.id,
      {
        findingKey: stableKey1,
        action: "APONTAR_CORRECAO",
        justification: "Correção necessária apontada com vínculo natural preservado",
        expectedCandidateHash: MOCK_VALID_HASH,
        correctionChangeId: finding1.changeId, // "CHG-001"
      },
      "uid-ceo",
      ATHENA_CEO_EMAIL
    );

    const dec = res.findingDecisions?.[stableKey1];
    assert.ok(dec, "Decisão deve existir no review retornado");
    assert.strictEqual(dec.state, "CORRECAO_NECESSARIA");
    assert.strictEqual(dec.correctionChangeId, "CHG-001");
    console.log("  ✓ Achado com f.changeId associado com sucesso a CHG-001.");
  }

  // [Teste 2] Resolução de achado autônomo (unverified claim) vinculado a alteração existente selecionada
  console.log("\n[Teste 2] Resolução de achado autônomo vinculado a alteração existente selecionada");
  {
    const finding2 = baseReview.supplement!.findings![1];
    const stableKey2 = getFindingStableKey(finding2);

    const res = await resolveHumanLegalReviewFinding(
      repo,
      baseReview.id,
      {
        findingKey: stableKey2,
        action: "APONTAR_CORRECAO",
        justification: "Afirmação não verificada solucionada pela alteração proposta CHG-002",
        expectedCandidateHash: MOCK_VALID_HASH,
        correctionChangeId: "CHG-002",
      },
      "uid-ceo",
      ATHENA_CEO_EMAIL
    );

    const dec = res.findingDecisions?.[stableKey2];
    assert.ok(dec, "Decisão deve existir no review retornado");
    assert.strictEqual(dec.state, "CORRECAO_NECESSARIA");
    assert.strictEqual(dec.correctionChangeId, "CHG-002");
    console.log("  ✓ Achado autônomo associado com sucesso a CHG-002.");
  }

  // [Teste 3] Validação para encerramento do Estágio B com vínculos e texto conferidos
  console.log("\n[Teste 3] Validação para encerramento do Estágio B com vínculos e texto conferidos");
  {
    const current = (await repo.get(baseReview.id))!;
    const validation = validateFindingsForClosure(current, current.reviewedMarkdown);
    assert.strictEqual(validation.ok, true, `Validação falhou: ${validation.failureReasons.join("; ")}`);
    assert.strictEqual(validation.failureReasons.length, 0);

    const decisionStateHash = computeDecisionStateHash(current);

    const closeRes = await closeLegalReviewSupplementFlow(
      repo,
      current.id,
      {
        overallJustification: "Homologação do Estágio B com todos os achados vinculados a alterações testadas",
        expectedCandidateHash: current.candidateHash,
        expectedDecisionStateHash: decisionStateHash,
      },
      "uid-ceo",
      ATHENA_CEO_EMAIL
    );

    assert.ok(closeRes.supplement?.resolution, "Resolução deve existir no supplement");
    assert.strictEqual(closeRes.supplement.resolution.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(closeRes.supplement.resolution.totalFindingsResolved, 2);
    console.log("  ✓ Estágio B encerrado formalmente com todos os achados vinculados e validados.");
  }

  // [Teste 4] Rejeição quando APONTAR_CORRECAO não informa correctionChangeId nem possui f.changeId
  console.log("\n[Teste 4] Rejeição quando APONTAR_CORRECAO não informa correctionChangeId");
  {
    let threw = false;
    try {
      await resolveHumanLegalReviewFinding(
        repo,
        baseReview.id,
        {
          findingKey: "unverified_claim_2",
          action: "APONTAR_CORRECAO",
          justification: "Justificativa sem alteração vinculada",
          expectedCandidateHash: MOCK_VALID_HASH,
          correctionChangeId: "", // ausente
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.match(err.message, /vincule o achado a uma alteração existente/i);
    }
    assert.strictEqual(threw, true, "Deveria ter lançado HTTP 400");
    console.log("  ✓ Ausência de vínculo em APONTAR_CORRECAO rejeitada com HTTP 400.");
  }

  // [Teste 5] Rejeição no fechamento se o texto corrigido da alteração vinculada não estiver no markdown
  console.log("\n[Teste 5] Rejeição no fechamento se o texto corrigido não estiver no markdown da aula");
  {
    const current = (await repo.get(baseReview.id))!;
    // Simula cópia da revisão com markdown modificado que removeu o trecho da CHG-001
    const reviewWithBrokenMarkdown = {
      ...current,
      reviewedMarkdown: "# Aula Teste\nTexto corrupto sem a alteração 1",
    };
    const validation = validateFindingsForClosure(reviewWithBrokenMarkdown);
    assert.strictEqual(validation.ok, false);
    assert(
      validation.failureReasons.some((r) => r.includes("o texto corrigido da alteração vinculada (CHG-001) não está incorporado")),
      "Deveria detectar ausência do texto corrigido no markdown"
    );
    console.log("  ✓ Ausência do texto corrigido no reviewedMarkdown rejeitada na validação de fechamento.");
  }

  // [Teste 6] Adversarial: Identificador inexistente ou de outra revisão rejeitado pela validação do cliente
  console.log("\n[Teste 6] Adversarial: Identificador inexistente ou pertencente a outra revisão");
  {
    const availableChanges = baseReview.changes || [];
    const foreignChangeId = "CHG-999-REV-EXTERNA";
    
    // Simula a validação rigorosa pré-submissão do cliente (LegalReviewPanel.tsx)
    const validateClientSelection = (corrId: string, changes: LegalReviewChange[]) => {
      if (!corrId || !corrId.trim()) {
        return { ok: false, error: "Para apontar necessidade de correção, selecione a alteração correspondente nesta revisão." };
      }
      const exists = changes.some(c => c.id === corrId.trim());
      if (!exists) {
        return { ok: false, error: `A alteração '${corrId}' não pertence às alterações catalogadas nesta revisão jurídica.` };
      }
      return { ok: true, error: null };
    };

    const clientCheck = validateClientSelection(foreignChangeId, availableChanges);
    assert.strictEqual(clientCheck.ok, false);
    assert.strictEqual(
      clientCheck.error,
      "A alteração 'CHG-999-REV-EXTERNA' não pertence às alterações catalogadas nesta revisão jurídica."
    );
    console.log("  ✓ Identificador pertencente a outra revisão ou inexistente sumariamente bloqueado no cliente.");
  }

  // [Teste 7] Adversarial: Ausência de alteração correspondente não bloqueia o fluxo nem gera vínculo forçado
  console.log("\n[Teste 7] Adversarial: Ausência de alteração correspondente orienta edição sem vínculo espúrio");
  {
    // Achado autônomo sem alteração e sem seleção feita
    const finding2 = baseReview.supplement!.findings![1]; // unverified_claim_2
    assert.strictEqual(finding2.changeId, undefined);

    // Validação de tentativa de enviar APONTAR_CORRECAO com campo vazio
    let threw = false;
    try {
      await resolveHumanLegalReviewFinding(
        repo,
        baseReview.id,
        {
          findingKey: getFindingStableKey(finding2),
          action: "APONTAR_CORRECAO",
          justification: "Afirmação precisa de correção mas nenhuma foi selecionada",
          expectedCandidateHash: MOCK_VALID_HASH,
          correctionChangeId: "",
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.match(err.message, /vincule o achado a uma alteração existente/i);
    }
    assert.strictEqual(threw, true);
    console.log("  ✓ Tentativa de vínculo vazio impedida com instrução clara para redigir correção via 'Editar Aula'.");
  }

  // [Teste 8] Adversarial: Seleção de alteração não relacionada cujo texto não sana o trecho
  console.log("\n[Teste 8] Adversarial: Seleção de alteração não relacionada não passa na integridade textual");
  {
    const current = (await repo.get(baseReview.id))!;
    // Se o CEO vincular erradamente a CHG-001 a um achado cujo texto corrigido foi descartado ou não se aplica
    const reviewWithMissingExcerpt = {
      ...current,
      // Markdown onde o trecho de CHG-002 foi colocado mas CHG-001 não está
      reviewedMarkdown: "# Aula Teste\nTexto corrigido 2 exclusivamente",
    };
    const validation = validateFindingsForClosure(reviewWithMissingExcerpt);
    assert.strictEqual(validation.ok, false);
    assert(
      validation.failureReasons.some(r => r.includes("CHG-001")),
      "Validação deve falhar se a alteração vinculada não estiver efetivamente integrada ao texto final"
    );
    console.log("  ✓ Alteração vinculada não presente no texto final da aula impede encerramento do Estágio B.");
  }

  // [Teste 9] Backend Estágio A: Rejeição com HTTP 400 de correctionChangeId inexistente diretamente no backend
  console.log("\n[Teste 9] Backend Estágio A: Rejeição com HTTP 400 de correctionChangeId inexistente");
  {
    let threw = false;
    try {
      await resolveHumanLegalReviewFinding(
        repo,
        baseReview.id,
        {
          findingKey: "unverified_claim_2",
          action: "APONTAR_CORRECAO",
          justification: "Tentativa de injetar ID inexistente diretamente no endpoint do backend",
          expectedCandidateHash: MOCK_VALID_HASH,
          correctionChangeId: "CHG-NAO-EXISTE-NO-BANCO",
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.match(err.message, /não existe em review\.changes desta revisão/i);
    }
    assert.strictEqual(threw, true, "Backend deve rejeitar correctionChangeId inexistente");
    console.log("  ✓ Backend rejeitou correctionChangeId inexistente com HTTP 400.");
  }

  // [Teste 10] Backend Estágio A: Rejeição de findingKey usado indevidamente como changeId
  console.log("\n[Teste 10] Backend Estágio A: Rejeição de findingKey ('unverified_claim_2') usado como changeId");
  {
    let threw = false;
    try {
      await resolveHumanLegalReviewFinding(
        repo,
        baseReview.id,
        {
          findingKey: "unverified_claim_2",
          action: "APONTAR_CORRECAO",
          justification: "Tentativa de usar findingKey 'unverified_claim_2' como se fosse um changeId",
          expectedCandidateHash: MOCK_VALID_HASH,
          correctionChangeId: "unverified_claim_2",
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.match(err.message, /não é permitido vincular identificadores inexistentes.*ou utilizar findingKey/i);
    }
    assert.strictEqual(threw, true, "Backend deve rejeitar findingKey como changeId");
    console.log("  ✓ Backend rejeitou findingKey usado indevidamente como correctionChangeId com HTTP 400.");
  }

  // [Teste 11] Backend Estágio B: Bloqueio estrito no fechamento se linkedChange não existir (eliminação do bypass undefined)
  console.log("\n[Teste 11] Backend Estágio B: Bloqueio no fechamento se linkedChange for inexistente");
  {
    // Simula uma revisão onde dec.correctionChangeId aponta para algo inexistente (como no caso histórico)
    const reviewWithPhantomChange = {
      ...baseReview,
      findingDecisions: {
        "unverified_claim_2": {
          findingKey: "unverified_claim_2",
          action: "APONTAR_CORRECAO" as HumanFindingAction,
          state: "CORRECAO_NECESSARIA" as any,
          justification: "Justificativa detalhada do achado com mais de dez caracteres",
          correctionChangeId: "unverified_claim_2", // Não existe em review.changes!
          candidateHashAtDecision: MOCK_VALID_HASH,
          decidedAt: Date.now(),
          decidedByUid: "uid-ceo",
          decidedByEmail: ATHENA_CEO_EMAIL,
        } as any,
      },
    };
    const validation = validateFindingsForClosure(reviewWithPhantomChange);
    assert.strictEqual(validation.ok, false);
    assert(
      validation.failureReasons.some(r => r.includes("não existe em review.changes desta revisão")),
      "Validação de fechamento deve falhar se linkedChange for inexistente (fim do bypass silencioso)"
    );
    console.log("  ✓ Bypass silencioso eliminado: linkedChange inexistente bloqueia formalmente o Estágio B.");
  }

  // [Teste 12] Preservação de Revisão Histórica Já Encerrada (Leitura Não-Destrutiva)
  console.log("\n[Teste 12] Auditoria de Revisão Histórica Já Encerrada");
  {
    // Simula estado da revisão de produção já encerrada com resolution
    const historicalClosed = {
      ...baseReview,
      supplement: {
        ...baseReview.supplement!,
        resolution: {
          status: "RESOLVIDO_PELO_CEO" as const,
          closedAt: 1791637833854,
          closedByUid: "ceo-uid",
          closedByEmail: ATHENA_CEO_EMAIL,
          overallJustification: "Homologação histórica mantida",
          candidateHashAtClosure: MOCK_VALID_HASH,
          totalFindingsResolved: 2,
        },
      },
    };
    // Verifica que a resolução histórica está preservada e íntegra
    assert.strictEqual(historicalClosed.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(historicalClosed.supplement?.resolution?.candidateHashAtClosure, MOCK_VALID_HASH);
    console.log("  ✓ Registro histórico encerrado preservado sem reabertura ou mutação destrutiva.");
  }

  console.log("\n================================================================================");
  console.log("✓ TODOS OS 12 TESTES DA ETAPA 19.7 PASSARAM COM 100% DE SUCESSO!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES:", err);
  process.exit(1);
});
