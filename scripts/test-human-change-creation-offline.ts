import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createHumanLegalReviewChangeFlow } from "../src/services/legalReviewFlow.js";
import { LegalReviewRecord } from "../src/lib/legalReviewTypes.js";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider.js";

function sha256(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";

async function runAdversarialSuite() {
  console.log("=== INICIANDO SUÍTE ADVERSARIAL OFFLINE: CRIAÇÃO DE CORREÇÕES HUMANAS (ETAPA 20.2) ===\n");

  const baseOriginalContent = "Linha inicial.\nO conceito de democracia militante foi aplicado no julgamento.\nLinha final.";
  const baseReviewedMarkdown = "Linha inicial.\nO conceito de democracia militante foi aplicado no julgamento.\nLinha final.";
  const baseCandidateHash = sha256(baseReviewedMarkdown);

  const mockReview: any = {
    id: "rev_test_adversarial_001",
    lessonId: "day1_0",
    candidateHash: baseCandidateHash,
    candidateMarkdownAccepted: baseReviewedMarkdown,
    originalContent: baseOriginalContent,
    reviewedMarkdown: baseReviewedMarkdown,
    status: "pending_approval",
    changes: [
      {
        id: "CHG-001",
        type: "CORRECAO",
        severity: "MEDIA",
        category: "TEXTUAL",
        originalExcerpt: "Linha inicial.",
        revisedExcerpt: "Linha inicial revisada.",
        reason: "Melhoria de estilo",
        verified: true,
        confirmation: "SIM",
        sources: [],
        evidence: [],
        outcome: "CONFIRMADA",
        authorType: "AI"
      }
    ],
    supplement: {
      status: "completed",
      findings: [
        {
          pendingId: "unverified_claim_2",
          statementAnalyzed: "O conceito de democracia militante foi aplicado no julgamento.",
          officialSourceConsulted: "STF - Jurisprudência",
          verifiableUrl: "https://stf.jus.br",
          relevantExcerptOrBasis: "Democracia militante",
          status: "nao_verificada",
          objectiveJustification: "Conceito não unânime sem indicação de julgado específico.",
          foundOfficialEvidence: false
        }
      ],
      resolution: {
        status: "RESOLVIDO_PELO_CEO",
        closedAt: Date.now(),
        closedByUid: "uid_ceo",
        closedByEmail: ATHENA_CEO_EMAIL,
        overallJustification: "Encerramento formal pelo CEO antes da correção textual.",
        candidateHashAtClosure: sha256(baseReviewedMarkdown),
        totalFindingsResolved: 1,
      }
    }
  };

  let inMemoryReview = JSON.parse(JSON.stringify(mockReview));

  const mockRepo = {
    async get(id: string) {
      if (id === inMemoryReview.id) {
        return JSON.parse(JSON.stringify(inMemoryReview));
      }
      return null;
    },
    async addHumanChange(
      reviewId: string,
      humanChange: any,
      nextMarkdown: string,
      now: number,
      expectedCandidateHash: string
    ) {
      if (inMemoryReview.candidateHash !== expectedCandidateHash) {
        const err: any = new Error("Hash mismatch / Concorrência detectada");
        err.status = 409;
        throw err;
      }
      inMemoryReview.changes.push(humanChange);
      inMemoryReview.reviewedMarkdown = nextMarkdown;
      inMemoryReview.candidateMarkdownAccepted = nextMarkdown;
      inMemoryReview.candidateHash = sha256(nextMarkdown);
      // Preservação append-only: supplement.resolution é mantido intacto para histórico/auditoria
      return JSON.parse(JSON.stringify(inMemoryReview));
    }
  };

  // 1. Rejeição de Não-CEO (HTTP 403)
  console.log("1. Testando rejeição de não-CEO (403)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_hacker",
        "hacker@external.com"
      );
    },
    (err: any) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /identidade autenticada do CEO/i);
      return true;
    }
  );
  console.log("   -> OK: Acesso não-CEO devidamente bloqueado com 403.");

  // 2. Rejeição de Achado Jurídico Inexistente (HTTP 404)
  console.log("2. Testando rejeição de achado inexistente (404)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "finding_fantasma_999",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 404);
      assert.match(err.message, /não existe nesta revisão/i);
      return true;
    }
  );
  console.log("   -> OK: Achado inexistente rejeitado com 404.");

  // 3. Rejeição de Hash Vazio / Inválido (HTTP 400)
  console.log("3. Testando rejeição de hash vazio/inválido (400)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: "hash_invalido_curto"
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /SHA-256 de 64 caracteres/i);
      return true;
    }
  );
  console.log("   -> OK: Hash com formato inválido rejeitado com 400.");

  // 4. Concorrência: Hash desatualizado (HTTP 409)
  console.log("4. Testando rejeição por conflito de concorrência / hash desatualizado (409)...");
  const staleHash = sha256("outro_markdown_antigo");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: staleHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 409);
      assert.match(err.message, /difere da versão visualizada/i);
      return true;
    }
  );
  console.log("   -> OK: Conflito de hash bloqueado com 409.");

  // 5. Trecho Original Ausente no Markdown (HTTP 400)
  console.log("5. Testando trecho original ausente no markdown (400)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "Texto que nunca existiu no reviewedMarkdown.",
          revisedExcerpt: "Texto alternativo.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /não foi encontrado no texto atual/i);
      return true;
    }
  );
  console.log("   -> OK: Trecho ausente rejeitado com 400.");

  // 6. Trecho Original Duplicado / Ambíguo (HTTP 400)
  console.log("6. Testando trecho original ambíguo com múltiplas ocorrências (400)...");
  inMemoryReview.reviewedMarkdown = "Linha inicial.\nPalavra teste.\nOutra linha.\nPalavra teste.\nLinha final.";
  inMemoryReview.candidateMarkdownAccepted = inMemoryReview.reviewedMarkdown;
  inMemoryReview.candidateHash = sha256(inMemoryReview.reviewedMarkdown);
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "Palavra teste.",
          revisedExcerpt: "Palavra única.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /ocorre mais de uma vez/i);
      return true;
    }
  );
  console.log("   -> OK: Ambiguidade / múltiplas ocorrências rejeitada com 400.");

  // Restaurar markdown para o teste válido
  inMemoryReview.reviewedMarkdown = baseReviewedMarkdown;
  inMemoryReview.candidateMarkdownAccepted = baseReviewedMarkdown;
  inMemoryReview.candidateHash = sha256(baseReviewedMarkdown);

  // 7. Texto Revisado Vazio ou Idêntico ao Original (HTTP 400)
  console.log("7. Testando texto revisado idêntico ou vazio (400)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          justification: "Adequação terminológica exigida pela auditoria jurídica.",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /não pode ser idêntico ao trecho original/i);
      return true;
    }
  );
  console.log("   -> OK: Texto idêntico rejeitado com 400.");

  // 8. Justificativa curta (< 10 caracteres) (HTTP 400)
  console.log("8. Testando justificativa insuficiente < 10 chars (400)...");
  await assert.rejects(
    async () => {
      await createHumanLegalReviewChangeFlow(
        mockRepo as any,
        "rev_test_adversarial_001",
        {
          originFindingKey: "unverified_claim_2",
          originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
          revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado.",
          justification: "Curto",
          expectedCandidateHash: inMemoryReview.candidateHash
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /mínimo de 10 caracteres/i);
      return true;
    }
  );
  console.log("   -> OK: Justificativa curta rejeitada com 400.");

  // 9. Criação Válida com Sucesso: ID CHG-H-001, Substituição Atômica e Preservação do Histórico de Resolução
  console.log("9. Testando criação com sucesso da primeira alteração humana (CHG-H-001)...");
  assert.equal(inMemoryReview.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO", "Stage B deveria estar fechado antes");
  const previousHash = inMemoryReview.candidateHash;

  const res1 = await createHumanLegalReviewChangeFlow(
    mockRepo as any,
    "rev_test_adversarial_001",
    {
      originFindingKey: "unverified_claim_2",
      originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento.",
      revisedExcerpt: "O conceito de ordem constitucional democrática foi ponderado pelo colegiado.",
      justification: "Adequação terminológica e fundamentação estrita exigida pelo CEO.",
      expectedCandidateHash: previousHash
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  const humanChg1 = res1.changes.find((c: any) => c.id === "CHG-H-001");
  assert.ok(humanChg1, "CHG-H-001 deve constar em changes");
  assert.equal(humanChg1.authorType, "HUMAN_CEO");
  assert.equal(humanChg1.originFindingKey, "unverified_claim_2");
  assert.equal(humanChg1.createdByEmail, ATHENA_CEO_EMAIL);
  assert.notEqual(res1.candidateHash, previousHash);

  // Verificar na persistência do mock: histórico preservado, eficácia invalidada por hash
  assert.equal(inMemoryReview.changes.length, 2);
  assert.equal(inMemoryReview.changes[1].id, "CHG-H-001");
  assert.ok(inMemoryReview.reviewedMarkdown.includes("O conceito de ordem constitucional democrática foi ponderado pelo colegiado."));
  assert.ok(!inMemoryReview.reviewedMarkdown.includes("democracia militante"));
  assert.ok(inMemoryReview.supplement?.resolution, "Resolução histórica do Estágio B NÃO deve ser apagada (append-only)");
  assert.equal(inMemoryReview.supplement?.resolution?.candidateHashAtClosure, previousHash, "Hash original do encerramento deve ser mantido intacto");
  assert.notEqual(inMemoryReview.supplement?.resolution?.candidateHashAtClosure, inMemoryReview.candidateHash, "Eficácia invalidada: hash do encerramento difere do novo hash do texto");
  assert.equal(inMemoryReview.supplement?.resolution?.closedByEmail, ATHENA_CEO_EMAIL);
  assert.equal(inMemoryReview.supplement?.resolution?.overallJustification, "Encerramento formal pelo CEO antes da correção textual.");
  console.log("   -> OK: CHG-H-001 gerado, texto substituído atomicamente, resolução histórica preservada e eficácia invalidada por hash.");

  // 10. Criação Sequencial Subsequente: ID CHG-H-002
  console.log("10. Testando criação sequencial subsequente (CHG-H-002)...");
  const res2 = await createHumanLegalReviewChangeFlow(
    mockRepo as any,
    "rev_test_adversarial_001",
    {
      originFindingKey: "unverified_claim_2",
      originalExcerpt: "Linha final.",
      revisedExcerpt: "Linha final devidamente revisada pelo CEO.",
      justification: "Ajuste complementar de encerramento da lição.",
      expectedCandidateHash: inMemoryReview.candidateHash
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  const humanChg2 = res2.changes.find((c: any) => c.id === "CHG-H-002");
  assert.ok(humanChg2, "CHG-H-002 deve constar em changes");
  assert.equal(humanChg2.authorType, "HUMAN_CEO");
  assert.equal(inMemoryReview.changes.length, 3);
  assert.equal(inMemoryReview.changes[2].id, "CHG-H-002");
  assert.ok(inMemoryReview.reviewedMarkdown.includes("Linha final devidamente revisada pelo CEO."));
  console.log("   -> OK: CHG-H-002 gerado sequencialmente de forma determinística.");

  // 11. Preservação Intacta das Alterações de IA Anteriores
  console.log("11. Verificando integridade das alterações de IA preexistentes...");
  assert.equal(inMemoryReview.changes[0].id, "CHG-001");
  assert.equal(inMemoryReview.changes[0].authorType, "AI");
  assert.equal(inMemoryReview.changes[0].originalExcerpt, "Linha inicial.");
  console.log("   -> OK: Alterações de IA originais permaneceram inalteradas.");

  console.log("\n=== TODOS OS 11 TESTES ADVERSARIAIS OFFLINE FORAM APROVADOS COM SUCESSO! ===");
}

runAdversarialSuite().catch((err) => {
  console.error("FALHA NA SUÍTE ADVERSARIAL:", err);
  process.exit(1);
});
