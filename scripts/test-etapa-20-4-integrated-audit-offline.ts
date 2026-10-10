import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  LegalReviewView,
  HumanFindingDecision,
  LegalReviewAddendum,
  SupplementHumanResolution,
} from "../src/lib/legalReviewTypes.js";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider.js";
import {
  computeDecisionStateHash,
  validateFindingsForClosure,
  validateFindingsHomologation,
  getFindingStableKey,
} from "../src/lib/legalReviewValidate.js";
import {
  createHumanLegalReviewChangeFlow,
  createLegalReviewAddendumFlow,
  closeLegalReviewSupplementFlow,
} from "../src/services/legalReviewFlow.js";

process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function runIntegratedAuditSuite() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 20.4: AUDITORIA INTEGRADA E HOMOLOGAÇÃO OFFLINE");
  console.log("MODO: 100% ISOLADO / ZERO PRODUÇÃO / SEM REDE EXTERNA");
  console.log("================================================================================\n");

  const originalContent = `# Aula Magna: Princípios da Administração Pública

O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.

Linha de encerramento da aula.`;

  const initialReviewedMarkdown = originalContent;
  const initialCandidateHash = sha256(initialReviewedMarkdown);

  // Estado inicial de simulação sintética
  let reviewState: LegalReviewView = {
    id: "rev_etapa_20_4_integrated_001",
    lessonId: "lesson_magna_01",
    subject: "Direito Administrativo",
    topic: "Improbidade Administrativa",
    candidateHash: initialCandidateHash,
    candidateMarkdownAccepted: initialReviewedMarkdown,
    originalContent,
    reviewedMarkdown: initialReviewedMarkdown,
    status: "pending_approval",
    changes: [
      {
        id: "CHG-001",
        type: "CORRECAO",
        severity: "MEDIA",
        category: "TEXTUAL",
        originalExcerpt: "Aula Magna:",
        revisedExcerpt: "Aula Magna:",
        reason: "Manutenção de cabeçalho pela IA",
        verified: true,
        confirmation: "SIM",
        sources: [],
        evidence: [],
        outcome: "CONFIRMADA",
        authorType: "AI",
      },
    ],
    supplement: {
      status: "completed",
      findings: [
        {
          pendingId: "unverified_claim_2",
          statementAnalyzed: "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.",
          officialSourceConsulted: "STJ - Jurisprudência em Teses",
          verifiableUrl: "https://stj.jus.br",
          relevantExcerptOrBasis: "Tese sobre insignificância e improbidade",
          status: "nao_verificada",
          objectiveJustification: "Afirmação categórica insustentável perante a jurisprudência dominante.",
          foundOfficialEvidence: false,
          nature: "AFIRMACAO_EMPIRICA",
        },
        {
          pendingId: "unverified_claim_5",
          statementAnalyzed: "Todos os atos administrativos presumem-se irrevogáveis após um ano.",
          officialSourceConsulted: "Lei 9.784/1999",
          verifiableUrl: "https://planalto.gov.br",
          relevantExcerptOrBasis: "Art. 53 e 54",
          status: "nao_verificada",
          objectiveJustification: "Prazo decadencial de anulação é 5 anos, e revogação decorre de conveniência/oportunidade.",
          foundOfficialEvidence: false,
          nature: "AFIRMACAO_NORMATIVA",
        },
      ],
      resolution: undefined,
    },
    findingDecisions: {
      unverified_claim_2: {
        findingKey: "unverified_claim_2",
        findingPendingId: "unverified_claim_2",
        reviewId: "rev_etapa_20_4_integrated_001",
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.",
        action: "APONTAR_CORRECAO",
        state: "CORRECAO_NECESSARIA",
        justification: "Decisão histórica com vínculo inválido prévio.",
        correctionChangeId: "CHG-INEXISTENTE-OLD",
        candidateHashAtDecision: initialCandidateHash,
        decidedAt: 1728100000000,
        decidedByUid: "uid_ceo_historico",
        decidedByEmail: ATHENA_CEO_EMAIL,
        history: [],
      },
      unverified_claim_5: {
        findingKey: "unverified_claim_5",
        findingPendingId: "unverified_claim_5",
        reviewId: "rev_etapa_20_4_integrated_001",
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: "Todos os atos administrativos presumem-se irrevogáveis após um ano.",
        action: "MANTER_PENDENTE",
        state: "PENDENTE",
        justification: "Pendente de análise das fontes normativas.",
        candidateHashAtDecision: initialCandidateHash,
        decidedAt: 1728100000000,
        decidedByUid: "uid_ceo_historico",
        decidedByEmail: ATHENA_CEO_EMAIL,
        history: [],
      },
    },
    addenda: [],
  };

  const mockRepo = {
    async get(id: string) {
      if (id !== reviewState.id) return null;
      return JSON.parse(JSON.stringify(reviewState));
    },
    async updateFindingDecision(id: string, decision: HumanFindingDecision) {
      if (id !== reviewState.id) throw new Error("Not found");
      reviewState.findingDecisions = reviewState.findingDecisions || {};
      reviewState.findingDecisions[decision.findingKey] = JSON.parse(JSON.stringify(decision));
      return JSON.parse(JSON.stringify(reviewState));
    },
    async addHumanChange(
      id: string,
      change: any,
      nextMarkdown: string,
      now: number,
      expectedHash: string
    ) {
      if (id !== reviewState.id) throw new Error("Not found");
      if (reviewState.candidateHash !== expectedHash) {
        const err: any = new Error("Hash mismatch / Concorrência detectada");
        err.status = 409;
        throw err;
      }
      reviewState.changes = [...reviewState.changes, change];
      reviewState.reviewedMarkdown = nextMarkdown;
      reviewState.candidateMarkdownAccepted = nextMarkdown;
      reviewState.candidateHash = sha256(nextMarkdown);
      return JSON.parse(JSON.stringify(reviewState));
    },
    async addAddendum(
      id: string,
      addendum: LegalReviewAddendum,
      rectifiedDecision: HumanFindingDecision,
      now: number,
      expectedHashes?: { expectedCandidateHash: string; expectedDecisionStateHash: string }
    ) {
      if (id !== reviewState.id) throw new Error("Not found");
      if (expectedHashes) {
        if (expectedHashes.expectedCandidateHash !== reviewState.candidateHash) {
          const err: any = new Error("Hash do texto modificado concorrentemente.");
          err.status = 409;
          throw err;
        }
        const curDecHash = computeDecisionStateHash(reviewState);
        if (expectedHashes.expectedDecisionStateHash !== curDecHash) {
          const err: any = new Error("Decisões de achados modificadas concorrentemente.");
          err.status = 409;
          throw err;
        }
      }
      // Validação de imutabilidade: impede sobrescrita de aditamento com mesmo ID
      if ((reviewState.addenda || []).some(a => a.id === addendum.id)) {
        const err: any = new Error(`Tentativa de adulterar ou sobrescrever aditamento imutável ${addendum.id}.`);
        err.status = 409;
        throw err;
      }
      reviewState.addenda = [...(reviewState.addenda || []), addendum];
      reviewState.findingDecisions = reviewState.findingDecisions || {};
      reviewState.findingDecisions[rectifiedDecision.findingKey] = JSON.parse(JSON.stringify(rectifiedDecision));
      return JSON.parse(JSON.stringify(reviewState));
    },
    async closeSupplementResolution(
      id: string,
      resolution: SupplementHumanResolution,
      now: number,
      expectedHashes?: { expectedCandidateHash: string; expectedDecisionStateHash: string }
    ) {
      if (id !== reviewState.id) throw new Error("Not found");
      if (expectedHashes) {
        if (expectedHashes.expectedCandidateHash !== reviewState.candidateHash) {
          const err: any = new Error("Hash do texto divergiu.");
          err.status = 409;
          throw err;
        }
        const curDecHash = computeDecisionStateHash(reviewState);
        if (expectedHashes.expectedDecisionStateHash !== curDecHash) {
          const err: any = new Error("Hash das decisões divergiu.");
          err.status = 409;
          throw err;
        }
      }
      const priorResolution = reviewState.supplement?.resolution;
      const priorHistory = [...(priorResolution?.history || [])];
      const curDecHash = computeDecisionStateHash(reviewState);
      if (priorResolution && (
        priorResolution.candidateHashAtClosure !== reviewState.candidateHash ||
        priorResolution.decisionStateHashAtClosure !== curDecHash ||
        (reviewState.addenda && reviewState.addenda.some(a => a.createdAt > priorResolution.closedAt))
      )) {
        priorHistory.push({
          status: priorResolution.status,
          closedAt: priorResolution.closedAt,
          closedByUid: priorResolution.closedByUid,
          closedByEmail: priorResolution.closedByEmail,
          overallJustification: priorResolution.overallJustification,
          candidateHashAtClosure: priorResolution.candidateHashAtClosure,
          decisionStateHashAtClosure: priorResolution.decisionStateHashAtClosure,
          totalFindingsResolved: priorResolution.totalFindingsResolved,
        });
      }

      reviewState.supplement = {
        ...reviewState.supplement!,
        resolution: {
          ...resolution,
          candidateHashAtClosure: reviewState.candidateHash,
          decisionStateHashAtClosure: curDecHash,
          closedAt: now,
          history: priorHistory,
        },
      };
      return JSON.parse(JSON.stringify(reviewState));
    },
  };

  // ===========================================================================
  // FASE 1: AUDITORIA DE IMUTABILIDADE EFETIVA E AUTENTICAÇÃO
  // ===========================================================================
  console.log("\n[FASE 1] Verificação 1: Imutabilidade Efetiva e Autorização");
  {
    const curDecHash = computeDecisionStateHash(reviewState);

    // 1a: Tentativa de operação por usuário não-CEO deve falhar invariavelmente
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada com caracteres suficientes.",
            rectifyingAct: {
              action: "CONFIRMAR",
              state: "CONFIRMADO_PELO_CEO",
              justification: "Justificativa válida com mais de dez caracteres.",
            },
            expectedCandidateHash: reviewState.candidateHash,
            expectedDecisionStateHash: curDecHash,
          },
          "intruder_uid",
          "attacker@unauthorized.com"
        );
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.match(err.message, /exige a identidade autenticada do CEO/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 403 estrito para usuário não-CEO validado.");
  }

  // ===========================================================================
  // FASE 2: SIMULAÇÃO INTEGRAL DO FLUXO COMPLETO (REVISÃO -> CHG-H -> ADD -> ESTÁGIO B -> ESTÁGIO C)
  // ===========================================================================
  console.log("\n[FASE 2] Verificações 2, 3 e 5: Ciclo de Vida Completo e Preservação Cronológica");

  // Passo A: Verificação inicial - Estágio B não pode ser encerrado porque há pendências
  {
    const initialClosureCheck = validateFindingsForClosure(reviewState);
    assert.equal(initialClosureCheck.ok, false);
    console.log("  ✓ Passo A: Encerramento do Estágio B inicialmente bloqueado devido a achado com vínculo inválido e achado pendente.");
  }

  // Passo B: Criação de Correção Textual Humana CHG-H-001 pelo CEO
  let reviewAfterChgH: LegalReviewView;
  {
    const originalExcerpt = "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.";
    const revisedExcerpt = "O princípio da insignificância possui aplicação excepcional e restrita aos atos de improbidade administrativa segundo jurisprudência consolidada dos Tribunais Superiores.";
    const justification = "Adequação do texto para retratar a tese consolidada do STJ que veda a aplicação indistinta da insignificância aos atos ímprobos.";

    reviewAfterChgH = await createHumanLegalReviewChangeFlow(
      mockRepo as any,
      reviewState.id,
      {
        originFindingKey: "unverified_claim_2",
        originalExcerpt,
        revisedExcerpt,
        justification,
        expectedCandidateHash: reviewState.candidateHash,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728200000000
    );

    assert.equal(reviewAfterChgH.changes.length, 2);
    const humanChange = reviewAfterChgH.changes.find((c) => c.id === "CHG-H-001");
    assert.ok(humanChange);
    assert.equal(humanChange.authorType, "HUMAN_CEO");
    assert.equal(humanChange.originFindingKey, "unverified_claim_2");
    assert.notEqual(reviewAfterChgH.candidateHash, initialCandidateHash);
    assert.ok(reviewAfterChgH.reviewedMarkdown.includes(revisedExcerpt));

    console.log("  ✓ Passo B: CHG-H-001 criada com sucesso. Markdown e candidateHash atualizados atomicamente.");
  }

  // Passo C: Emissão do Aditamento ADD-001 retificando unverified_claim_2
  let reviewAfterAdd1: LegalReviewView;
  {
    const candHashNow = reviewState.candidateHash;
    const decHashNow = computeDecisionStateHash(reviewState);
    const priorDecSnapshot = JSON.parse(JSON.stringify(reviewState.findingDecisions!["unverified_claim_2"]));

    reviewAfterAdd1 = await createLegalReviewAddendumFlow(
      mockRepo as any,
      reviewState.id,
      {
        targetFindingKey: "unverified_claim_2",
        reason: "SANEAMENTO_VINCULO",
        inconsistencyDescription: "Ato originário vinculava incorretamente a alteração inexistente. Retificado para vincular à alteração humana CHG-H-001.",
        rectifyingAct: {
          action: "APONTAR_CORRECAO",
          state: "CORRECAO_NECESSARIA",
          justification: "Vínculo auditado e associado à alteração textual humana legítima CHG-H-001.",
          correctionChangeId: "CHG-H-001",
        },
        expectedCandidateHash: candHashNow,
        expectedDecisionStateHash: decHashNow,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728300000000
    );

    assert.equal(reviewAfterAdd1.addenda?.length, 1);
    const add1 = reviewAfterAdd1.addenda![0];
    assert.equal(add1.id, "ADD-001");
    assert.equal(add1.priorAct.correctionChangeId, "CHG-INEXISTENTE-OLD");
    assert.equal(add1.rectifyingAct.correctionChangeId, "CHG-H-001");

    // Verificar decisão ativa
    const decActive = reviewAfterAdd1.findingDecisions!["unverified_claim_2"];
    assert.equal(decActive.correctionChangeId, "CHG-H-001");
    assert.equal(decActive.addendumId, "ADD-001");
    assert.equal(decActive.rectifiedByAddendum, true);
    assert.equal(decActive.history?.length, 1);
    assert.equal(decActive.history![0].correctionChangeId, "CHG-INEXISTENTE-OLD");

    console.log("  ✓ Passo C: ADD-001 emitido com sucesso. PriorAct arquivado e histórico append-only preservado.");
  }

  // Passo D: Deliberação do achado unverified_claim_5 (para deixar a revisão pronta para encerramento)
  {
    const dec5 = reviewState.findingDecisions!["unverified_claim_5"];
    dec5.action = "CONFIRMAR";
    dec5.state = "CONFIRMADO_PELO_CEO";
    dec5.justification = "Dispositivo do art. 54 da Lei 9.784/1999 foi conferido na íntegra com redação ajustada.";
    dec5.candidateHashAtDecision = reviewState.candidateHash;
    dec5.evidenceDeclaration = {
      declaredSource: "Lei 9.784/1999",
      documentaryVerified: true,
      declaredUrl: "https://planalto.gov.br",
    };
    dec5.decidedAt = 1728350000000;

    const closureCheck = validateFindingsForClosure(reviewState);
    assert.equal(closureCheck.ok, true);
    console.log("  ✓ Passo D: Achados 100% deliberados. validateFindingsForClosure aprovado.");
  }

  // Passo E: Encerramento Administrativo do Estágio B pelo CEO (Resolução v1)
  let reviewAfterClosure1: LegalReviewView;
  {
    const candHashNow = reviewState.candidateHash;
    const decHashNow = computeDecisionStateHash(reviewState);

    reviewAfterClosure1 = await closeLegalReviewSupplementFlow(
      mockRepo as any,
      reviewState.id,
      {
        overallJustification: "Encerramento formal do Estágio B atestando que todas as controvérsias jurídicas foram saneadas e aditadas.",
        expectedCandidateHash: candHashNow,
        expectedDecisionStateHash: decHashNow,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728400000000
    );

    assert.ok(reviewAfterClosure1.supplement?.resolution);
    assert.equal(reviewAfterClosure1.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    assert.equal(reviewAfterClosure1.supplement?.resolution?.candidateHashAtClosure, candHashNow);
    assert.equal(reviewAfterClosure1.supplement?.resolution?.decisionStateHashAtClosure, decHashNow);

    // Validação de elegibilidade para o Estágio C
    const homologationCheck = validateFindingsHomologation(reviewAfterClosure1);
    assert.equal(homologationCheck.ok, true);
    console.log("  ✓ Passo E: Estágio B encerrado formalmente pelo CEO. Homologação no Estágio C tornou-se materialmente elegível.");
  }

  // ===========================================================================
  // FASE 3: AUDITORIA DE INVALIDAÇÃO SUPERVENIENTE POR ADITAMENTO SEM MUDANÇA DE TEXTO (REQUISITO 2)
  // ===========================================================================
  console.log("\n[FASE 3] Verificação 2: Invalidação de Encerramento Anterior por Aditamento (sem alteração de texto)");
  {
    // Cenário Crítico: o CEO emite um segundo aditamento ADD-002 no achado unverified_claim_5.
    // O candidateHash do texto NÃO se altera (o texto permanece idêntico).
    const candHashBefore = reviewState.candidateHash;
    const decHashBefore = computeDecisionStateHash(reviewState);

    const reviewAfterAdd2 = await createLegalReviewAddendumFlow(
      mockRepo as any,
      reviewState.id,
      {
        targetFindingKey: "unverified_claim_5",
        reason: "RETIFICACAO_MATERIAL",
        inconsistencyDescription: "Ajuste na qualificação da fonte normativa de referência para incluir também a Lei 14.133/2021.",
        rectifyingAct: {
          action: "CONFIRMAR",
          state: "CONFIRMADO_PELO_CEO",
          justification: "Confirmação integral amparada cumulativamente na Lei 9.784/99 e Lei 14.133/21.",
          evidenceDeclaration: {
            declaredSource: "Lei 9.784/1999 e Lei 14.133/2021",
            documentaryVerified: true,
            declaredUrl: "https://planalto.gov.br",
          },
        },
        expectedCandidateHash: candHashBefore,
        expectedDecisionStateHash: decHashBefore,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728500000000 // Posterior a resolution.closedAt (1728400000000)
    );

    assert.equal(reviewAfterAdd2.addenda?.length, 2);
    assert.equal(reviewAfterAdd2.addenda![1].id, "ADD-002");
    // O candidateHash permanece idêntico ao do encerramento anterior
    assert.equal(reviewAfterAdd2.candidateHash, candHashBefore);

    // MAS a decisão foi retificada, logo o estado de decisões mudou!
    const decHashAfter = computeDecisionStateHash(reviewAfterAdd2);
    assert.notEqual(decHashAfter, decHashBefore);

    // REGRA DE OURO (Etapa 20.4): O encerramento anterior do Estágio B DEVE SER INVALIDADO,
    // impedindo a homologação no Estágio C mesmo com candidateHash inalterado!
    const homologationAfterAdd2 = validateFindingsHomologation(reviewAfterAdd2);
    assert.equal(homologationAfterAdd2.ok, false);
    assert.match(
      homologationAfterAdd2.failureReasons.join(" | "),
      /aditamento histórico|deliberações individuais foram retificadas/i
    );
    console.log("  ✓ Verificação 2: Sucesso! Emissão de ADD-002 invalidou supervenientemente o encerramento do Estágio B mesmo sem mudança de texto.");

    // Tentativa de duplicar encerramento sem re-deliberar ou sem novo ato do CEO
    // O re-encerramento formal é permitido e exigido:
    const reviewAfterClosure2 = await closeLegalReviewSupplementFlow(
      mockRepo as any,
      reviewState.id,
      {
        overallJustification: "Re-encerramento formal do Estágio B após aditamento superveniente ADD-002 ratificando conformidade.",
        expectedCandidateHash: reviewAfterAdd2.candidateHash,
        expectedDecisionStateHash: decHashAfter,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728600000000
    );

    // O histórico de encerramento deve conter o ato anterior v1!
    assert.equal(reviewAfterClosure2.supplement?.resolution?.history?.length, 1);
    assert.equal(reviewAfterClosure2.supplement?.resolution?.history![0].closedAt, 1728400000000);
    assert.equal(reviewAfterClosure2.supplement?.resolution?.closedAt, 1728600000000);

    // Agora sim o Estágio C volta a ser elegível
    const homologationRestored = validateFindingsHomologation(reviewAfterClosure2);
    assert.equal(homologationRestored.ok, true);
    console.log("  ✓ Re-encerramento v2 formalizado com sucesso, acumulando v1 em resolution.history e restaurando elegibilidade.");
  }

  // ===========================================================================
  // FASE 4: TESTES ADVERSARIAIS DE CONCORRÊNCIA, DUPLICIDADE E HASHES OBSOLETOS (REQUISITO 4)
  // ===========================================================================
  console.log("\n[FASE 4] Verificação 4: Concorrência entre Abas, Duplicidade e Conflitos");
  {
    const candHashNow = reviewState.candidateHash;
    const decHashNow = computeDecisionStateHash(reviewState);

    // 4a: Duplicidade de aditamento idêntico
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_5",
            reason: "RETIFICACAO_MATERIAL",
            inconsistencyDescription: "Ajuste na qualificação da fonte normativa de referência para incluir também a Lei 14.133/2021.",
            rectifyingAct: {
              action: "CONFIRMAR",
              state: "CONFIRMADO_PELO_CEO",
              justification: "Confirmação integral amparada cumulativamente na Lei 9.784/99 e Lei 14.133/21.",
              evidenceDeclaration: {
                declaredSource: "Lei 9.784/1999 e Lei 14.133/2021",
                documentaryVerified: true,
                declaredUrl: "https://planalto.gov.br",
              },
            },
            expectedCandidateHash: candHashNow,
            expectedDecisionStateHash: decHashNow,
          },
          "ceo_master_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /já existe um aditamento idêntico/i);
        return true;
      }
    );
    console.log("  ✓ 4a: Bloqueio 409 contra aditamento idêntico duplicado aprovado.");

    // 4b: Concorrência entre Abas (Aba 1 edita texto enquanto Aba 2 tenta emitir aditamento no hash antigo)
    const staleCandHash = "0".repeat(64);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "OUTRO",
            inconsistencyDescription: "Descrição válida para teste de concorrência com mais de quinze caracteres.",
            rectifyingAct: {
              action: "CONFIRMAR",
              state: "CONFIRMADO_PELO_CEO",
              justification: "Justificativa válida com mais de dez caracteres.",
            },
            expectedCandidateHash: staleCandHash,
            expectedDecisionStateHash: decHashNow,
          },
          "ceo_master_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /O texto candidato difere da versão visualizada/i);
        return true;
      }
    );
    console.log("  ✓ 4b: Bloqueio 409 por expectedCandidateHash defasado (concorrência entre abas) aprovado.");

    // 4c: Concorrência entre Abas (Aba 1 altera decisões enquanto Aba 2 tenta emitir aditamento no hash antigo)
    const staleDecHash = "f".repeat(64);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "OUTRO",
            inconsistencyDescription: "Descrição válida para teste de concorrência com mais de quinze caracteres.",
            rectifyingAct: {
              action: "CONFIRMAR",
              state: "CONFIRMADO_PELO_CEO",
              justification: "Justificativa válida com mais de dez caracteres.",
            },
            expectedCandidateHash: candHashNow,
            expectedDecisionStateHash: staleDecHash,
          },
          "ceo_master_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /O estado das deliberações individuais foi modificado/i);
        return true;
      }
    );
    console.log("  ✓ 4c: Bloqueio 409 por expectedDecisionStateHash defasado aprovado.");
  }

  // ===========================================================================
  // FASE 5: COMPATIBILIDADE RETROATIVA COM REVISÕES HISTÓRICAS (REQUISITO 7)
  // ===========================================================================
  console.log("\n[FASE 5] Verificação 7: Compatibilidade com Revisões Legadas");
  {
    // Simula uma revisão legada encerrada antes das Etapas 20.2 e 20.3
    const legacyClosedReview: LegalReviewView = {
      id: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008", // Mesma estrutura da revisão real de produção
      lessonId: "lesson_real_01",
      subject: "Direito",
      topic: "Histórico",
      candidateHash: "hash_legado_original_123456789012345678901234567890123456789012345678",
      originalContent: "Texto legado original.",
      reviewedMarkdown: "Texto legado original.",
      status: "pending_approval",
      changes: [],
      supplement: {
        status: "inconclusive",
        findings: [
          {
            pendingId: "unverified_claim_2",
            statementAnalyzed: "Afirmação histórica não verificada.",
            officialSourceConsulted: "Fonte histórica",
            status: "nao_verificada",
            objectiveJustification: "Histórico legado.",
            foundOfficialEvidence: false,
          },
        ],
        resolution: {
          status: "RESOLVIDO_PELO_CEO",
          closedAt: 1728000000000,
          closedByUid: "uid_ceo_historico",
          closedByEmail: ATHENA_CEO_EMAIL,
          overallJustification: "Encerramento histórico legado do Estágio B.",
          candidateHashAtClosure: "hash_legado_original_123456789012345678901234567890123456789012345678",
          totalFindingsResolved: 1,
          history: [],
        },
      },
      findingDecisions: {
        unverified_claim_2: {
          findingKey: "unverified_claim_2",
          findingPendingId: "unverified_claim_2",
          reviewId: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008",
          originalAiStatus: "nao_verificada",
          originalStatementAnalyzed: "Afirmação histórica não verificada.",
          action: "APONTAR_CORRECAO",
          state: "CORRECAO_NECESSARIA",
          justification: "Decisão original com vínculo histórico.",
          correctionChangeId: "unverified_claim_2", // Antigo vínculo
          candidateHashAtDecision: "hash_legado_original_123456789012345678901234567890123456789012345678",
          decidedAt: 1728000000000,
          decidedByUid: "uid_ceo_historico",
          decidedByEmail: ATHENA_CEO_EMAIL,
        },
      },
      addenda: undefined, // Ausente em revisões legadas
    };

    // A leitura e cálculo de hash operam de forma 100% segura
    const legacyDecHash = computeDecisionStateHash(legacyClosedReview);
    assert.equal(typeof legacyDecHash, "string");
    assert.equal(legacyDecHash.length, 64);

    // Validação de fechamento da revisão legada funciona sem lançar exceções
    const legacyClosureCheck = validateFindingsForClosure(legacyClosedReview);
    assert.equal(typeof legacyClosureCheck.ok, "boolean");

    console.log("  ✓ Revisão histórica legada preservada intacta, lida e processada sem qualquer regressão ou quebra.");
  }

  console.log("\n================================================================================");
  console.log("✓ TODOS OS TESTES E AUDITORIAS DA ETAPA 20.4 PASSARAM COM 100% DE SUCESSO!");
  console.log("================================================================================");
}

runIntegratedAuditSuite().catch((err) => {
  console.error("\n❌ FALHA NA AUDITORIA INTEGRADA DA ETAPA 20.4:", err);
  process.exit(1);
});
