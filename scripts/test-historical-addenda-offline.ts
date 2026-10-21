import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  LegalReviewView,
  HumanFindingDecision,
  LegalReviewAddendum,
} from "../src/lib/legalReviewTypes.js";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider.js";
import {
  computeDecisionStateHash,
  validateFindingsForClosure,
  validateFindingsHomologation,
} from "../src/lib/legalReviewValidate.js";
import {
  createLegalReviewAddendumFlow,
} from "../src/services/legalReviewFlow.js";

process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function runHistoricalAddendaSuite() {
  console.log("=== INICIANDO SUÍTE ADVERSARIAL: ADITAMENTOS HISTÓRICOS IMUTÁVEIS (ETAPA 20.3) ===\n");

  const originalContent = `# Aula 1 - Direito Administrativo

O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.

Linha final.`;

  // Texto revisado incorporando a correção humana CHG-H-001
  const reviewedContent = `# Aula 1 - Direito Administrativo

O princípio da insignificância possui aplicação restrita e controvertida nos atos de improbidade administrativa segundo jurisprudência consolidada.

Linha final.`;

  const candHash = sha256(reviewedContent);

  // Estado que reflete a revisão histórica com decisão anterior inconsistente
  const buildInitialReview = (): LegalReviewView => ({
    id: "rev_addenda_test_001",
    lessonId: "lesson_adm_01",
    subject: "Direito Administrativo",
    topic: "Improbidade Administrativa",
    candidateHash: candHash,
    candidateMarkdownAccepted: reviewedContent,
    originalContent,
    reviewedMarkdown: reviewedContent,
    status: "pending_approval",
    changes: [
      {
        id: "CHG-H-001",
        type: "CORRECAO",
        severity: "ALTA",
        category: "TEXTUAL",
        originalExcerpt: "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.",
        revisedExcerpt: "O princípio da insignificância possui aplicação restrita e controvertida nos atos de improbidade administrativa segundo jurisprudência consolidada.",
        reason: "Correção editorial humana pelo CEO sanando afirmação ampla e não comprovada.",
        verified: true,
        confirmation: "SIM",
        sources: [],
        evidence: [],
        outcome: "CONFIRMADA",
        authorType: "HUMAN_CEO",
        originFindingKey: "unverified_claim_2",
      },
    ],
    supplement: {
      status: "completed",
      findings: [
        {
          pendingId: "unverified_claim_2",
          statementAnalyzed: "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.",
          officialSourceConsulted: "STJ / Jurisprudência",
          verifiableUrl: "https://stj.jus.br",
          relevantExcerptOrBasis: "Insignificância em improbidade",
          status: "nao_verificada",
          objectiveJustification: "Afirmação não comprovada sobre incidência indistinta.",
          foundOfficialEvidence: false,
          nature: "AFIRMACAO_EMPIRICA",
        },
        {
          pendingId: "unverified_claim_5",
          statementAnalyzed: "Todos os servidores possuem estabilidade após dois anos.",
          officialSourceConsulted: "CF/88 Art. 41",
          verifiableUrl: "https://planalto.gov.br",
          relevantExcerptOrBasis: "Art. 41 CF",
          status: "nao_verificada",
          objectiveJustification: "Prazo constitucional é de três anos.",
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
        reviewId: "rev_addenda_test_001",
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: "O princípio da insignificância aplica-se indistintamente a todos os atos de improbidade administrativa.",
        action: "APONTAR_CORRECAO",
        state: "CORRECAO_NECESSARIA",
        justification: "Decisão histórica com vínculo inválido anterior.",
        correctionChangeId: "INEXISTENTE_001", // Vínculo histórico inválido
        candidateHashAtDecision: "hash_antigo_antes_da_retificacao",
        decidedAt: 1728000000000,
        decidedByUid: "uid_ceo_historico",
        decidedByEmail: ATHENA_CEO_EMAIL,
        history: [],
      },
      unverified_claim_5: {
        findingKey: "unverified_claim_5",
        findingPendingId: "unverified_claim_5",
        reviewId: "rev_addenda_test_001",
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: "Todos os servidores possuem estabilidade após dois anos.",
        action: "MANTER_PENDENTE",
        state: "PENDENTE",
        justification: "Pendente de análise constitucional.",
        candidateHashAtDecision: candHash,
        decidedAt: 1728000000000,
        decidedByUid: "uid_ceo_historico",
        decidedByEmail: ATHENA_CEO_EMAIL,
        history: [],
      },
    },
    addenda: [],
  });

  let reviewState = buildInitialReview();

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
      reviewState.addenda = [...(reviewState.addenda || []), addendum];
      reviewState.findingDecisions = reviewState.findingDecisions || {};
      reviewState.findingDecisions[rectifiedDecision.findingKey] = JSON.parse(JSON.stringify(rectifiedDecision));
      return JSON.parse(JSON.stringify(reviewState));
    },
  };

  // ---------------------------------------------------------------------------
  // TESTE 1: Rejeição de Não-CEO (403)
  // ---------------------------------------------------------------------------
  console.log("Teste 1: Rejeição de emissão de aditamento por usuário não-CEO...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Retificação formal do vínculo anterior com alteração CHG-H-001.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Vínculo correto com alteração humana CHG-H-001.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "user_intruder_uid",
          "hacker@external.com"
        );
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.match(err.message, /exige a identidade autenticada do CEO/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 403 para não-CEO aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 2: Rejeição de Achado Inexistente (404)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 2: Rejeição de aditamento para achado inexistente...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "finding_fantasma_999",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Tentativa de aditar achado que não existe nesta revisão.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa válida com mais de dez chars.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 404);
        assert.match(err.message, /não existe nesta revisão/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 404 para achado inexistente aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 3: Rejeição de Motivo Inválido ou Descrição Curta (< 15 chars) (400)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 3: Rejeição de motivo inválido e descrição insuficiente (<15 chars)...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    // 3a: Motivo inválido
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "MOTIVO_INVALIDO_XYZ" as any,
            inconsistencyDescription: "Descrição suficientemente longa para o teste de validação.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa válida com mais de dez caracteres.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /motivo do aditamento é inválido/i);
        return true;
      }
    );

    // 3b: Descrição curta (<15 chars)
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Curta demais",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa válida com mais de dez caracteres.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /mínimo de 15 caracteres/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 400 para motivo inválido e descrição curta (<15 chars) aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 4: Rejeição de Justificativa do Ato Retificador Curta (< 10 chars) (400)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 4: Rejeição de justificativa do ato retificador curta (<10 chars)...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada e suficiente da inconsistência apontada.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Curto",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /mínimo de 10 caracteres/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 400 para justificativa do ato retificador curta (<10 chars) aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 5: Rejeição de Vínculo Inexistente ou Não Incorporado (400)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 5: Rejeição de vinculação de alteração inexistente ou não incorporada...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    // 5a: Alteração inexistente
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada da inconsistência histórica identificada.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa detalhada do ato retificador.",
              correctionChangeId: "CHG-INEXISTENTE-999",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /não existe em review\.changes/i);
        return true;
      }
    );

    // 5b: Alteração existe mas seu texto corrigido NÃO está no markdown
    reviewState.changes.push({
      id: "CHG-ORPHAN-001",
      type: "CORRECAO",
      severity: "BAIXA",
      category: "TEXTUAL",
      originalExcerpt: "Texto não presente",
      revisedExcerpt: "ESTE TEXTO CORRIGIDO NÃO ESTÁ NO REVIEWED_MARKDOWN NUNCA",
      reason: "Alteração de teste órfã",
      verified: true,
      confirmation: "SIM",
      sources: [],
      evidence: [],
      outcome: "CONFIRMADA",
      authorType: "AI",
    });

    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada da inconsistência histórica identificada.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa detalhada do ato retificador.",
              correctionChangeId: "CHG-ORPHAN-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /não está incorporado ao texto final da aula/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 400 para alteração inexistente ou não incorporada aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 6: Rejeição de Concorrência em expectedCandidateHash (409)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 6: Rejeição de concorrência quando expectedCandidateHash diverge...");
  {
    const decHash = computeDecisionStateHash(reviewState);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada da inconsistência histórica identificada.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa detalhada do ato retificador.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: "a".repeat(64), // Hash divergente
            expectedDecisionStateHash: decHash,
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /O texto candidato difere da versão visualizada/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 409 para expectedCandidateHash desatualizado aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 7: Rejeição de Concorrência em expectedDecisionStateHash (409)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 7: Rejeição de concorrência quando expectedDecisionStateHash diverge...");
  {
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Descrição detalhada da inconsistência histórica identificada.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Justificativa detalhada do ato retificador.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
            expectedDecisionStateHash: "b".repeat(64), // Hash de decisões divergente
          },
          "ceo_uid",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /O estado das deliberações individuais foi modificado/i);
        return true;
      }
    );
    console.log("  ✓ Bloqueio 409 para expectedDecisionStateHash desatualizado aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 8: Emissão Bem-Sucedida de ADD-001 e Preservação Append-Only
  // ---------------------------------------------------------------------------
  console.log("\nTeste 8: Emissão bem-sucedida de ADD-001 e verificação append-only...");
  let updatedReview: LegalReviewView;
  {
    const decHashBefore = computeDecisionStateHash(reviewState);
    const priorDecision = JSON.parse(JSON.stringify(reviewState.findingDecisions!["unverified_claim_2"]));

    updatedReview = await createLegalReviewAddendumFlow(
      mockRepo as any,
      reviewState.id,
      {
        targetFindingKey: "unverified_claim_2",
        reason: "SANEAMENTO_VINCULO",
        inconsistencyDescription: "O ato original apontou correção para identificador inexistente; agora retificado com CHG-H-001.",
        rectifyingAct: {
          action: "APONTAR_CORRECAO",
          state: "CORRECAO_NECESSARIA",
          justification: "Vínculo auditado associando a alteração humana legítima CHG-H-001.",
          correctionChangeId: "CHG-H-001",
        },
        expectedCandidateHash: candHash,
        expectedDecisionStateHash: decHashBefore,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728600000000
    );

    // 8a: Verificar identificador gerado sequencial
    assert.equal(updatedReview.addenda?.length, 1);
    const addendum1 = updatedReview.addenda![0];
    assert.equal(addendum1.id, "ADD-001");
    assert.equal(addendum1.reason, "SANEAMENTO_VINCULO");
    assert.equal(addendum1.authorType, "HUMAN_CEO");
    assert.equal(addendum1.createdByEmail, ATHENA_CEO_EMAIL);
    assert.equal(addendum1.candidateHashAtAddendum, candHash);
    assert.equal(addendum1.decisionStateHashAtAddendum, decHashBefore);

    // 8b: Verificar snapshot do ato anterior (priorAct)
    assert.equal(addendum1.priorAct.action, priorDecision.action);
    assert.equal(addendum1.priorAct.correctionChangeId, "INEXISTENTE_001");
    assert.equal(addendum1.priorAct.decidedByEmail, ATHENA_CEO_EMAIL);
    assert.equal(addendum1.priorAct.decidedAt, 1728000000000);

    // 8c: Verificar ato retificador (rectifyingAct)
    assert.equal(addendum1.rectifyingAct.action, "APONTAR_CORRECAO");
    assert.equal(addendum1.rectifyingAct.correctionChangeId, "CHG-H-001");

    // 8d: Verificar atualização da decisão ativa do achado
    const activeDecision = updatedReview.findingDecisions!["unverified_claim_2"];
    assert.equal(activeDecision.action, "APONTAR_CORRECAO");
    assert.equal(activeDecision.correctionChangeId, "CHG-H-001");
    assert.equal(activeDecision.addendumId, "ADD-001");
    assert.equal(activeDecision.rectifiedByAddendum, true);

    // 8e: Verificar histórico da decisão (append-only)
    assert.equal(activeDecision.history?.length, 1);
    assert.equal(activeDecision.history![0].correctionChangeId, "INEXISTENTE_001");
    assert.equal(activeDecision.history![0].decidedAt, 1728000000000);

    console.log("  ✓ ADD-001 gerado com sucesso, priorAct registrado e histórico preservado append-only.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 9: Rejeição de Aditamento Idêntico Duplicado (409)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 9: Rejeição de aditamento duplicado para o mesmo achado e hash...");
  {
    const decHashNow = computeDecisionStateHash(reviewState);
    await assert.rejects(
      async () => {
        await createLegalReviewAddendumFlow(
          mockRepo as any,
          reviewState.id,
          {
            targetFindingKey: "unverified_claim_2",
            reason: "SANEAMENTO_VINCULO",
            inconsistencyDescription: "Segunda tentativa idêntica de aditar o mesmo achado.",
            rectifyingAct: {
              action: "APONTAR_CORRECAO",
              state: "CORRECAO_NECESSARIA",
              justification: "Vínculo auditado associando a alteração humana legítima CHG-H-001.",
              correctionChangeId: "CHG-H-001",
            },
            expectedCandidateHash: candHash,
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
    console.log("  ✓ Bloqueio 409 para aditamento duplicado aprovado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 10: Emissão Sequencial de ADD-002 em Outro Achado
  // ---------------------------------------------------------------------------
  console.log("\nTeste 10: Emissão sequencial de ADD-002 em outro achado...");
  {
    const decHashNow = computeDecisionStateHash(reviewState);
    const reviewWithTwo = await createLegalReviewAddendumFlow(
      mockRepo as any,
      reviewState.id,
      {
        targetFindingKey: "unverified_claim_5",
        reason: "RETIFICACAO_MATERIAL",
        inconsistencyDescription: "Achado antes pendente; agora declarado não comprovado com expurgo.",
        rectifyingAct: {
          action: "DECLARAR_NAO_COMPROVADO",
          state: "NAO_COMPROVADO",
          justification: "Estabilidade de 2 anos foi integralmente suprimida da redação.",
          expurgationConfirmed: true,
        },
        expectedCandidateHash: candHash,
        expectedDecisionStateHash: decHashNow,
      },
      "ceo_master_uid",
      ATHENA_CEO_EMAIL,
      1728601000000
    );

    assert.equal(reviewWithTwo.addenda?.length, 2);
    assert.equal(reviewWithTwo.addenda![1].id, "ADD-002");
    assert.equal(reviewWithTwo.addenda![1].targetFindingKey, "unverified_claim_5");
    assert.equal(reviewWithTwo.addenda![1].reason, "RETIFICACAO_MATERIAL");
    assert.equal(reviewWithTwo.findingDecisions!["unverified_claim_5"].addendumId, "ADD-002");
    console.log("  ✓ ADD-002 gerado sequencialmente mantendo integridade cumulativa.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 11: Invariante dos Estágios B e C (Aditamento Não Libera Homologação Automaticamente)
  // ---------------------------------------------------------------------------
  console.log("\nTeste 11: Verificação de que aditamento NÃO encerra Estágio B nem libera Estágio C automaticamente...");
  {
    // 11a: O Estágio B ainda exige encerramento explícito
    assert.equal(reviewState.supplement?.resolution, undefined);

    // 11b: Validação de fechamento do Estágio B agora é viável porque unverified_claim_2 aponta para CHG-H-001 (incorporado)
    const closureValidation = validateFindingsForClosure(reviewState);
    assert.equal(closureValidation.ok, true);

    // 11c: Porém a homologação final (Estágio C) permanece bloqueada se o Estágio B não foi encerrado
    const homologationValidation = validateFindingsHomologation(reviewState);
    assert.equal(homologationValidation.ok, false);
    assert.match(homologationValidation.failureReasons[0], /não possui encerramento administrativo formal/i);

    console.log("  ✓ Estágios B e C permanecem estritamente controlados pelas travas operacionais.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 12: Compatibilidade com Revisões Antigas sem Addenda
  // ---------------------------------------------------------------------------
  console.log("\nTeste 12: Compatibilidade com revisões legadas sem campo addenda...");
  {
    const legacyReview: LegalReviewView = {
      ...buildInitialReview(),
      addenda: undefined,
    };
    delete (legacyReview as any).addenda;

    const decHashLegacy = computeDecisionStateHash(legacyReview);
    assert.ok(decHashLegacy.length === 64);

    let savedAddendum: any = null;
    const legacyRepo = {
      async get() { return JSON.parse(JSON.stringify(legacyReview)); },
      async updateFindingDecision() { return legacyReview; },
      async addAddendum(_id: string, add: any) {
        savedAddendum = add;
        return {
          ...legacyReview,
          addenda: [add],
        };
      },
    };

    const res = await createLegalReviewAddendumFlow(
      legacyRepo as any,
      legacyReview.id,
      {
        targetFindingKey: "unverified_claim_2",
        reason: "SANEAMENTO_VINCULO",
        inconsistencyDescription: "Regularização de revisão legada sem histórico prévio de aditamentos.",
        rectifyingAct: {
          action: "APONTAR_CORRECAO",
          state: "CORRECAO_NECESSARIA",
          justification: "Vínculo sanado para a alteração CHG-H-001 existente.",
          correctionChangeId: "CHG-H-001",
        },
        expectedCandidateHash: candHash,
        expectedDecisionStateHash: decHashLegacy,
      },
      "ceo_uid",
      ATHENA_CEO_EMAIL
    );

    assert.ok(res);
    assert.equal(savedAddendum?.id, "ADD-001");
    console.log("  ✓ Revisão legada processada com sucesso sem quebras de compatibilidade.");
  }

  console.log("\n=== TODAS AS 12 VERIFICAÇÕES DA SUÍTE ADVERSARIAL PASSARAM COM SUCESSO! ===");
}

runHistoricalAddendaSuite().catch((err) => {
  console.error("\n❌ FALHA NA SUÍTE ADVERSARIAL:", err);
  process.exit(1);
});
