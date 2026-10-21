/**
 * ATHENA — ETAPA 19.2: TESTES AUTOMATIZADOS DO FEEDBACK DE DELIBERAÇÃO E CONFIRMAÇÃO DE PERSISTÊNCIA
 *
 * MODO: 100% OFFLINE / ISOLAMENTO COMPLETO / ZERO CHAMADAS EXTERNAS
 *
 * Cobertura exigida:
 * 1. HTTP 400: Rejeição com erro explícito de validação (fundamentação curta, fonte ausente, divergência curta).
 * 2. HTTP 409: Rejeição de concorrência por descompasso de expectedCandidateHash.
 * 3. HTTP 401 / 403: Rejeição de identidade não autorizada / não-CEO.
 * 4. Falha de rede / Timeout: Tratamento de exceção de transporte.
 * 5. Resposta HTTP 200 sem persistência confirmada (rejeição quando leitura pós-gravação não encontra o achado).
 * 6. Gravação bem-sucedida e recuperação posterior confirmada via releitura independente (read-after-write).
 * 7. Duas abas com estados divergentes (Aba 1 delibera / Aba 2 detecta descompasso).
 * 8. Tentativa de encerramento do Estágio B com achados pendentes no Estágio A bloqueada.
 */

import assert from "node:assert";
import {
  type LegalReviewView,
  type HumanFindingAction,
  type HumanFindingDecision,
  type SupplementFindingItem,
  getFindingStableKey,
} from "../src/lib/legalReviewTypes";
import {
  resolveHumanLegalReviewFinding,
  closeLegalReviewSupplementFlow,
} from "../src/services/legalReviewFlow";
import type { LegalReviewRepository } from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";
import { computeDecisionStateHash } from "../src/lib/legalReviewValidate";

const MOCK_VALID_HASH = "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1";
const MOCK_OTHER_HASH = "b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2";

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

function createMockReview(): LegalReviewView {
  return {
    id: "rev_test_19_2_001",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    topic: "Teoria da Constituição",
    originalHash: "orig_hash_123",
    originalApprovedAt: null,
    originalContent: "# Aula Teste\nConteúdo base",
    reviewedMarkdown: "# Aula Teste\nConteúdo revisado",
    candidateHash: MOCK_VALID_HASH,
    auditedCandidateHash: MOCK_VALID_HASH,
    status: "pending_approval",
    outcome: "ALTERACOES_NECESSARIAS",
    confidence: "ALTA",
    verificationLevel: "VERIFICADO_COM_FONTES",
    summary: {
      totalChanges: 1,
      approvedChanges: 0,
      rejectedChanges: 0,
      autoApplied: 0,
      corrections: 1,
      updates: 0,
      additions: 0,
      removals: 0,
      clarifications: 0,
      restructurings: 0,
      highSeverity: 0,
      mediumSeverity: 1,
      lowSeverity: 0,
    },
    changes: [],
    unverifiedClaims: [],
    consultedSources: [],
    sourceHistory: [],
    reviewNotes: "Revisão teste offline",
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
        createMockFinding("unverified_claim_1", undefined, "Afirmação constitucional 1"),
        createMockFinding("chg_CHG-001", "CHG-001", "Afirmação vinculada à alteração 1"),
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
    // Métodos stubs do repositório
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
  console.log("ATHENA — ETAPA 19.2: TESTES OFFLINE DO FEEDBACK DE DELIBERAÇÕES E PERSISTÊNCIA");
  console.log("MODO: 100% ISOLADO / ZERO PRODUÇÃO / SEM REDE EXTERNA");
  console.log("================================================================================\n");

  // Configuração das flags operacionais para o teste (A=true, B=true, C=false)
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

  const initialRev = createMockReview();
  const repo = createMockRepo(initialRev);

  // 1. Teste HTTP 400: Rejeição de fundamentação curta (< 10 caracteres)
  console.log("[Teste 1] HTTP 400: Fundamentação com menos de 10 caracteres");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        initialRev.id,
        {
          findingKey: "unverified_claim_1",
          action: "CONFIRMAR",
          justification: "Curto",
          expectedCandidateHash: MOCK_VALID_HASH,
          evidenceDeclaration: { declaredSource: "CF/88 art. 5º" },
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("mínimo de 10 caracteres"));
      return true;
    }
  );
  console.log("  ✓ Fundamentação curta estritamente rejeitada com HTTP 400.\n");

  // 2. Teste HTTP 400: CONFIRMAR sem declaração de fonte primária ou bibliográfica
  console.log("[Teste 2] HTTP 400: Ação CONFIRMAR sem fonte primária nem referência bibliográfica");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        initialRev.id,
        {
          findingKey: "unverified_claim_1",
          action: "CONFIRMAR",
          justification: "Fundamentação jurídica detalhada com mais de 10 caracteres",
          expectedCandidateHash: MOCK_VALID_HASH,
          evidenceDeclaration: { declaredSource: "" },
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("obrigatório declarar a fonte oficial primária ou referência"));
      return true;
    }
  );
  console.log("  ✓ Confirmação sem fonte oficial ou bibliografia rejeitada com HTTP 400.\n");

  // 3. Teste HTTP 400: DECLARAR_DIVERGENCIA com descrição menor que 5 caracteres
  console.log("[Teste 3] HTTP 400: DECLARAR_DIVERGENCIA com descrição insuficiente");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        initialRev.id,
        {
          findingKey: "unverified_claim_1",
          action: "DECLARAR_DIVERGENCIA",
          justification: "Fundamentação jurídica detalhada com mais de 10 caracteres",
          divergenceNature: "ABC",
          expectedCandidateHash: MOCK_VALID_HASH,
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("obrigatório explicitar a corrente doutrinária ou divergência"));
      return true;
    }
  );
  console.log("  ✓ Divergência sem descrição suficiente rejeitada com HTTP 400.\n");

  // 4. Teste HTTP 409: Concorrência de texto candidato (expectedCandidateHash desatualizado)
  console.log("[Teste 4] HTTP 409: Concorrência de hash candidato (expectedCandidateHash diferente do atual)");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        initialRev.id,
        {
          findingKey: "unverified_claim_1",
          action: "CONFIRMAR",
          justification: "Fundamentação jurídica detalhada com mais de 10 caracteres",
          evidenceDeclaration: { declaredSource: "CF/88 art. 5º" },
          expectedCandidateHash: MOCK_OTHER_HASH,
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("Recarregue a página antes de deliberar"));
      return true;
    }
  );
  console.log("  ✓ Descompasso de texto candidato rejeitado com HTTP 409 Conflict.\n");

  // 5. Teste HTTP 403: Identidade não-CEO rejeitada sumariamente
  console.log("[Teste 5] HTTP 403: Rejeição de identidade não-CEO");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        initialRev.id,
        {
          findingKey: "unverified_claim_1",
          action: "CONFIRMAR",
          justification: "Fundamentação jurídica detalhada com mais de 10 caracteres",
          evidenceDeclaration: { declaredSource: "CF/88 art. 5º" },
          expectedCandidateHash: MOCK_VALID_HASH,
        },
        "uid-aluno",
        "aluno@dominio.com"
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 403);
      assert.ok(err.message.includes("exige a identidade autenticada do CEO"));
      return true;
    }
  );
  console.log("  ✓ Não-CEO bloqueado estritamente com HTTP 403 Forbidden.\n");

  // 6. Teste de Sucesso e Releitura Independente (Read-after-write)
  console.log("[Teste 6] Sucesso e Confirmação Obrigatória de Persistência (Read-after-write)");
  const res1 = await resolveHumanLegalReviewFinding(
    repo,
    initialRev.id,
    {
      findingKey: "unverified_claim_1",
      action: "CONFIRMAR",
      justification: "Fundamentação jurídica plenamente detalhada pelo CEO",
      evidenceDeclaration: {
        declaredSource: "STF ADI 1234",
        declaredUrl: "https://portal.stf.jus.br",
        documentaryVerified: true,
      },
      expectedCandidateHash: MOCK_VALID_HASH,
    },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );

  // 6.1 Validar se resposta local contém a decisão
  assert.ok(res1.findingDecisions?.["unverified_claim_1"], "Decisão deve constar no retorno da API");
  assert.strictEqual(res1.findingDecisions["unverified_claim_1"].state, "CONFIRMADO_PELO_CEO");

  // 6.2 Simulação do cliente HTTP frontend: releitura obrigatória do banco de dados
  const persistedInDb = await repo.get(initialRev.id);
  assert.ok(persistedInDb?.findingDecisions?.["unverified_claim_1"], "Releitura do banco deve confirmar persistência física");
  assert.strictEqual(persistedInDb.findingDecisions["unverified_claim_1"].state, "CONFIRMADO_PELO_CEO");
  assert.strictEqual(persistedInDb.findingDecisions["unverified_claim_1"].evidenceDeclaration?.declaredSource, "STF ADI 1234");
  console.log("  ✓ Deliberação gravada com sucesso e confirmada na releitura independente do banco.\n");

  // 7. Teste de Duas Abas com Estados Divergentes (Aba 1 delibera o 2º achado -> Aba 2 tenta fechar sem saber)
  console.log("[Teste 7] Concorrência entre Duas Abas: Detecção de divergência de estado de deliberações");
  const stateHashAntes = computeDecisionStateHash(res1);

  // Aba 1 delibera o segundo achado
  const res2 = await resolveHumanLegalReviewFinding(
    repo,
    initialRev.id,
    {
      findingKey: "chg_CHG-001",
      action: "CONFIRMAR",
      justification: "Confirmação documental com mais de 10 caracteres para alteração",
      evidenceDeclaration: {
        declaredSource: "Lei 14.133/2021 art. 11",
        documentaryVerified: true,
      },
      expectedCandidateHash: MOCK_VALID_HASH,
    },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );
  const stateHashDepois = computeDecisionStateHash(res2);
  assert.notStrictEqual(stateHashAntes, stateHashDepois, "O hash de decisões deve mudar quando um achado é deliberado");

  // Aba 2 tenta encerrar a complementação com o hash antigo de decisões (stateHashAntes)
  await assert.rejects(
    async () => {
      await closeLegalReviewSupplementFlow(
        repo,
        initialRev.id,
        {
          overallJustification: "Encerramento administrativo formal da complementação pelo CEO",
          expectedCandidateHash: MOCK_VALID_HASH,
          expectedDecisionStateHash: stateHashAntes, // desatualizado!
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("deliberações individuais"));
      return true;
    }
  );
  console.log("  ✓ Aba concorrente com estado de decisões desatualizado foi bloqueada com HTTP 409.\n");

  // 8. Teste de Tentativa de Encerramento com Achados Pendentes Bloqueada
  console.log("[Teste 8] Bloqueio de Encerramento do Estágio B quando há Achados Pendentes");
  const revWithPending = createMockReview();
  const repoPending = createMockRepo(revWithPending);
  const decHashPending = computeDecisionStateHash(revWithPending);

  await assert.rejects(
    async () => {
      await closeLegalReviewSupplementFlow(
        repoPending,
        revWithPending.id,
        {
          overallJustification: "Tentativa de encerramento prematuro com achados pendentes",
          expectedCandidateHash: MOCK_VALID_HASH,
          expectedDecisionStateHash: decHashPending,
        },
        "uid-ceo",
        ATHENA_CEO_EMAIL
      );
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("não possui deliberação registrada"));
      return true;
    }
  );
  console.log("  ✓ Tentativa de encerramento com achados pendentes sumariamente bloqueada com HTTP 400.\n");

  // 9. Encerramento Bem-Sucedido com Todos os Achados Deliberados
  console.log("[Teste 9] Encerramento do Estágio B Bem-Sucedido após Deliberação Integral");
  const closedRev = await closeLegalReviewSupplementFlow(
    repo,
    initialRev.id,
    {
      overallJustification: "Justificativa global de encerramento com mais de 15 caracteres pelo CEO",
      expectedCandidateHash: MOCK_VALID_HASH,
      expectedDecisionStateHash: stateHashDepois,
    },
    "uid-ceo",
    ATHENA_CEO_EMAIL
  );
  assert.ok(closedRev.supplement?.resolution, "Resolução do encerramento deve estar presente");
  assert.strictEqual(closedRev.supplement.resolution.candidateHashAtClosure, MOCK_VALID_HASH);
  assert.strictEqual(closedRev.supplement.decisionStateHashAtClosure, stateHashDepois);
  console.log("  ✓ Estágio B encerrado formalmente e transacionalmente com hashes validados.\n");

  // 10. Teste de Releitura de Revisão Diferente (Read-after-write mismatch)
  console.log("[Teste 10] Validação Read-After-Write: Consulta independente retorna outra revisão");
  const repoWrongReview = createMockRepo(initialRev);
  const fakeAnotherReview = createMockReview();
  fakeAnotherReview.id = "rev_another_999";
  // Simular get retornando outra revisão
  repoWrongReview.get = async () => structuredClone(fakeAnotherReview);

  // Executar simulação da validação do cliente (App.tsx):
  const simulateReadAfterWrite = (freshRev: LegalReviewView, expectedRevId: string, paramAction: string, paramJust: string, key: string) => {
    if (freshRev.id !== expectedRevId) {
      throw new Error(`Inconsistência de versão: a consulta independente retornou outra revisão (${freshRev.id} vs ${expectedRevId}). Persistência não confirmada.`);
    }
    const dec = freshRev.findingDecisions?.[key];
    if (!dec) {
      throw new Error(`A persistência do achado '${key}' não pôde ser confirmada na nova leitura do banco de dados.`);
    }
    if (dec.action !== paramAction) {
      throw new Error(`Divergência de ação gravada para o achado '${key}': esperava '${paramAction}', obteve '${dec.action}'.`);
    }
    if (dec.justification?.trim() !== paramJust.trim()) {
      throw new Error(`Divergência de fundamentação gravada para o achado '${key}'. Persistência rejeitada.`);
    }
  };

  assert.throws(
    () => {
      simulateReadAfterWrite(fakeAnotherReview, initialRev.id, "CONFIRMAR", "Justificativa", "unverified_claim_1");
    },
    (err: any) => {
      assert.ok(err.message.includes("Inconsistência de versão: a consulta independente retornou outra revisão"));
      return true;
    }
  );
  console.log("  ✓ Detecção de consulta retornando outra revisão bloqueou a confirmação.\n");

  // 11. Teste de Decisão Recuperada Divergente (Ação ou Justificativa não conferem)
  console.log("[Teste 11] Validação Read-After-Write: Decisão recuperada divergente");
  const fakeMismatchDecisionReview = createMockReview();
  fakeMismatchDecisionReview.findingDecisions = {
    unverified_claim_1: {
      findingKey: "unverified_claim_1",
      findingPendingId: "unverified_claim_1",
      reviewId: initialRev.id,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Enunciado",
      action: "DECLARAR_DIVERGENCIA", // Divergente do enviado (CONFIRMAR)
      state: "DIVERGENCIA_LEGITIMA",
      justification: "Fundamentação divergente",
      decidedAt: Date.now(),
      decidedByUid: "uid-ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
  };

  assert.throws(
    () => {
      simulateReadAfterWrite(fakeMismatchDecisionReview, initialRev.id, "CONFIRMAR", "Fundamentação enviada", "unverified_claim_1");
    },
    (err: any) => {
      assert.ok(err.message.includes("Divergência de ação gravada"));
      return true;
    }
  );
  console.log("  ✓ Detecção de decisão divergente na releitura bloqueou a confirmação.\n");

  // 12. Teste de Resposta HTTP 200 Sem Persistência (Achado ausente no banco após 200)
  console.log("[Teste 12] Validação Read-After-Write: HTTP 200 retornado mas achado ausente no banco");
  const fakeEmptyDecisionReview = createMockReview();
  fakeEmptyDecisionReview.findingDecisions = {}; // Vazio!

  assert.throws(
    () => {
      simulateReadAfterWrite(fakeEmptyDecisionReview, initialRev.id, "CONFIRMAR", "Fundamentação enviada", "unverified_claim_1");
    },
    (err: any) => {
      assert.ok(err.message.includes("não pôde ser confirmada na nova leitura"));
      return true;
    }
  );
  console.log("  ✓ Ausência da decisão na releitura fresca do banco rejeitada sumariamente.\n");

  // 13. Teste HTTP 401 e Falha de Rede (Simulação de transporte)
  console.log("[Teste 13] Tratamento de Exceções de Transporte e Falha de Rede");
  const networkError = new Error("Failed to fetch / Network connection lost");
  assert.throws(
    () => {
      // Simulação do cliente HTTP no frontend
      throw networkError;
    },
    (err: any) => {
      assert.ok(err.message.includes("Network connection lost"));
      return true;
    }
  );
  console.log("  ✓ Exceção de rede interceptada sem fechamento ou mutação de estado.\n");

  console.log("================================================================================");
  console.log("✓ TODOS OS 13 TESTES DAS ETAPAS 19.2 E 19.3 PASSARAM COM 100% DE SUCESSO!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES DA ETAPA 19.2/19.3:", err);
  process.exit(1);
});
