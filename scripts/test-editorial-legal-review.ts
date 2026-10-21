/**
 * Teste Offline do Revisor Jurídico Editorial Integral da Athena
 * Execução 100% determinística e offline: ZERO chamadas pagas (sem OpenAI, sem Gemini, sem rede).
 */
import assert from "node:assert";
import {
  type LegalReviewAuditor,
  startLegalReview,
  approveLegalReview,
} from "../src/services/legalReviewFlow.js";
import { LegalReviewError, type LegalReviewRepository } from "../src/services/legalReviewRepository.js";
import { type StoredCatalogLesson, type LegalReviewView } from "../src/lib/legalReviewTypes.js";
import { type AuditLessonResult } from "../src/services/legalReviewServer.js";
import {
  sanitizeReviewedMarkdown,
  markersPreserved,
  containsHtmlMarkup,
  classifyLegalAudit,
  normalizeLegalAudit,
} from "../src/lib/legalReviewValidate.js";

const CEO_UID = "ceo-validador";
const PLANALTO_URL = "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm";
const STF_URL = "https://portal.stf.jus.br/jurisprudencia/sumarios/sumula.asp?num=706";

const SAMPLE_LESSON_CONTENT = `[BLOCK_1]
# Direito Penal - Parte Geral

## Teoria do Crime e Imputabilidade

O crime é fato típico, ilícito e culpável segundo a teoria tripartite.
A menoridade penal cessa aos 18 anos completos, conforme o art. 27 do Código Penal.

[BLOCK_2]
## Concurso de Pessoas

O art. 29 do CP adota a teoria monista ou unitária temperada.
Quem, de qualquer modo, concorre para o crime incide nas penas a este cominadas, na medida de sua culpabilidade.

[ATHENA_CHALLENGE]
Explique a distinção entre coautoria e participação segundo a teoria do domínio do fato.
`;

function createMockRepository(initialLesson: StoredCatalogLesson): LegalReviewRepository & {
  lessons: Map<string, StoredCatalogLesson>;
  reviews: Map<string, LegalReviewView>;
  indexes: Map<string, any>;
} {
  const lessons = new Map<string, StoredCatalogLesson>([[initialLesson.id, { ...initialLesson }]]);
  const reviews = new Map<string, LegalReviewView>();
  const indexes = new Map<string, any>();

  return {
    lessons,
    reviews,
    indexes,
    async getLesson(id: string) {
      const found = lessons.get(id);
      return found ? { ...found } : null;
    },
    async getIndex(id: string) {
      return indexes.get(id) || {
        lessonId: id,
        latestReviewId: null,
        latestStatus: null,
        processingReviewId: null,
        processingStartedAt: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        approvedHash: null,
      };
    },
    async begin(review: LegalReviewView) {
      reviews.set(review.id, { ...review });
      indexes.set(review.lessonId, {
        lessonId: review.lessonId,
        latestReviewId: review.id,
        latestStatus: "processing",
        processingReviewId: review.id,
        processingStartedAt: review.requestedAt,
      });
    },
    async complete(review: LegalReviewView) {
      reviews.set(review.id, { ...review });
      indexes.set(review.lessonId, {
        lessonId: review.lessonId,
        latestReviewId: review.id,
        latestStatus: review.status,
        processingReviewId: null,
        processingStartedAt: null,
      });
    },
    async fail(reviewId: string, lessonId: string) {
      const current = reviews.get(reviewId);
      if (current) reviews.set(reviewId, { ...current, status: "failed" });
      indexes.set(lessonId, {
        lessonId,
        latestReviewId: reviewId,
        latestStatus: "failed",
        processingReviewId: null,
        processingStartedAt: null,
      });
    },
    async touchProcessing() {
      return true;
    },
    async get(reviewId: string) {
      const current = reviews.get(reviewId);
      return current ? { ...current } : null;
    },
    async saveCandidate(reviewId: string, markdown: string) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("Revisão não encontrada");
      const updated = { ...current, reviewedMarkdown: markdown };
      reviews.set(reviewId, updated);
      return updated;
    },
    async reject(reviewId: string, uid: string, now: number) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("Revisão não encontrada");
      const updated: LegalReviewView = { ...current, status: "rejected" };
      reviews.set(reviewId, updated);
      return updated;
    },
    async approve(reviewId: string, uid: string, email: string, now: number) {
      const review = reviews.get(reviewId);
      if (!review) throw new Error("Revisão não encontrada");
      const currentLesson = lessons.get(review.lessonId);
      if (!currentLesson) throw new Error("Aula não encontrada");

      const publishedLesson: StoredCatalogLesson = {
        ...currentLesson,
        content: review.reviewedMarkdown,
        version: currentLesson.version + 1,
        approvedAt: now,
        approvedBy: uid,
        status: "approved",
      };
      lessons.set(review.lessonId, publishedLesson);

      const approvedReview: LegalReviewView = {
        ...review,
        status: "approved",
      };
      reviews.set(reviewId, approvedReview);

      indexes.set(review.lessonId, {
        lessonId: review.lessonId,
        latestReviewId: reviewId,
        latestStatus: "approved",
        approvedReviewId: reviewId,
        approvedReviewDate: review.reviewDate,
        approvedHash: review.candidateHash,
        processingReviewId: null,
        processingStartedAt: null,
      });

      return { ok: true, lesson: publishedLesson };
    },
  };
}

async function runOfflineEditorialTests() {
  console.log("=== INICIANDO TESTES OFFLINE DO REVISOR JURÍDICO EDITORIAL INTEGRAL ===");

  const initialLesson: StoredCatalogLesson = {
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Penal",
    topic: "Teoria do Crime e Concurso de Pessoas",
    content: SAMPLE_LESSON_CONTENT,
    status: "approved",
    approvedBy: CEO_UID,
    approvedAt: 1000,
    version: 1,
  };

  // 1. Teste de Sanitização de Markdown Integral Definitivo (Zero meta-talk)
  console.log("1. Verificando sanitização de metatexto e preâmbulos conversacionais...");
  const rawLlmMarkdown = `\`\`\`markdown
Aqui está a aula revisada com rigor técnico:
[BLOCK_1]
# Direito Penal - Parte Geral

## Teoria do Crime e Imputabilidade

O crime é fato típico, ilícito e culpável segundo a teoria tripartite.
A menoridade penal cessa aos 18 anos completos, conforme o art. 27 do Código Penal.

[BLOCK_2]
## Concurso de Pessoas

O art. 29 do CP adota a teoria monista temperada.

[ATHENA_CHALLENGE]
Explique a distinção entre coautoria e participação segundo a teoria do domínio do fato.
\`\`\`
Bons estudos!`;

  const sanitized = sanitizeReviewedMarkdown(rawLlmMarkdown);
  assert(!sanitized.startsWith("```"), "Blocos de código cercados devem ser desempacotados.");
  assert(!sanitized.includes("Aqui está a aula revisada"), "Preâmbulo conversacional deve ser removido.");
  assert(!sanitized.includes("Bons estudos"), "Saudação final conversacional deve ser removida.");
  assert(markersPreserved(SAMPLE_LESSON_CONTENT, sanitized), "Marcadores didáticos [BLOCK_1], [BLOCK_2], [ATHENA_CHALLENGE] devem ser preservados.");
  assert(!containsHtmlMarkup(sanitized), "Markdown não pode conter tags HTML sujas.");
  console.log("   ✓ Sanitização aprovada: markdown definitivo 100% limpo e sem comentários metatextuais.");

  // 2. Fluxo Completo: Simulação de Revisão Integral Válida com Fontes Oficiais
  console.log("2. Verificando fluxo integral de auditoria com parecer e fontes oficiais...");
  const repo = createMockRepository(initialLesson);

  const validEditorialAuditor: LegalReviewAuditor = {
    async audit(input) {
      // Simula a atuação do revisor com consulta e validação em fontes oficiais
      const patchRevised = input.content.replace(
        "teoria monista ou unitária temperada.",
        "teoria monista (ou unitária temperada), consagrada pelo art. 29, caput, do CP."
      );
      return {
        outcome: "ALTERACOES_NECESSARIAS",
        confidence: "ALTA",
        verificationLevel: "VERIFICADO_COM_FONTES",
        summary: {
          totalChanges: 1,
          corrections: 0,
          additions: 1,
          removals: 0,
          updates: 0,
          precisions: 1,
          restructures: 0,
        },
        changes: [
          {
            id: "CHG-001",
            type: "PRECISAO",
            severity: "MEDIA",
            category: "CONCEITO",
            originalExcerpt: "teoria monista ou unitária temperada.",
            revisedExcerpt: "teoria monista (ou unitária temperada), consagrada pelo art. 29, caput, do CP.",
            reason: "Especificação dogmática e normativa do art. 29 do Código Penal.",
            verified: true,
            confirmation: "CONFIRMADO",
            sources: [],
            evidence: [
              {
                institution: "Planalto",
                title: "Código Penal - Decreto-Lei nº 2.848/1940",
                url: PLANALTO_URL,
                official: true,
                consulted: true,
                supportsChange: true,
                supportExplanation: "Art. 29 consagra a teoria monista mitigada.",
                sourceType: "DECRETO" as const,
              },
            ],
          },
        ],
        unverifiedClaims: [],
        reviewedMarkdown: patchRevised,
        reviewNotes: "Revisão editorial e dogmática integral concluída. Verificado texto vigente do CP.",
        consultedSources: [
          {
            id: "SRC-PLANALTO",
            url: PLANALTO_URL,
            title: "Código Penal",
            institution: "Planalto",
            official: true,
          },
        ],
        model: "gpt-5.6",
        webSearchUsed: true,
      };
    },
  };

  const startResult = await startLegalReview(repo, validEditorialAuditor, {
    day: 1,
    part: 0,
    force: false,
    uid: CEO_UID,
    now: 2000,
  });

  if (!("review" in startResult)) throw new Error("Não esperado alreadyReviewed");
  const validReview = startResult.review;
  assert(validReview.status === "pending_approval", "Status deve ser pending_approval.");
  assert(validReview.verificationLevel === "VERIFICADO_COM_FONTES", "Deve estar verificado com fontes.");

  // Conferir que a aula no catálogo NÃO foi substituída automaticamente antes da ação do CEO
  const lessonBeforeApproval = await repo.getLesson("day_1_part_0");
  assert.strictEqual(
    lessonBeforeApproval?.content,
    SAMPLE_LESSON_CONTENT,
    "A aula no catálogo oficial NÃO pode ser alterada antes da aprovação expressa do CEO."
  );
  assert.strictEqual(lessonBeforeApproval?.version, 1, "A versão da aula no catálogo deve permanecer 1.");
  console.log("   ✓ Isolamento pré-publicação confirmado: aula original preservada intacta no catálogo.");

  // 3. Aprovação Expressa pelo CEO
  console.log("3. Verificando aprovação e publicação expressa pelo CEO...");
  const approveResult = await approveLegalReview(repo, validReview.id, CEO_UID, "jhonny.spider@gmail.com", 3000);
  const approvedReview = await repo.get(validReview.id);
  assert.strictEqual(approvedReview?.status, "approved", "Revisão deve constar como aprovada.");
  assert.strictEqual(approveResult.lesson.version, 2, "Versão da aula publicada deve incrementar para 2.");
  assert(
    approveResult.lesson.content.includes("teoria monista (ou unitária temperada)"),
    "A aula publicada deve conter o conteúdo revisado definitivo."
  );
  console.log("   ✓ Publicação expressa aprovada: versão 2 publicada no catálogo com o texto revisado.");

  // 4. Teste do Gate Fail-Closed: Bloqueio Obrigatório quando verificationLevel === 'FALHA_NA_VERIFICACAO'
  console.log("4. Verificando gate fail-closed: bloqueio estrito se a verificação em fontes falhar...");
  const repoFailClosed = createMockRepository(initialLesson);

  const failingAuditor: LegalReviewAuditor = {
    async audit(input) {
      return {
        outcome: "ALTERACOES_NECESSARIAS",
        confidence: "BAIXA",
        verificationLevel: "FALHA_NA_VERIFICACAO",
        summary: {
          totalChanges: 1,
          corrections: 1,
          additions: 0,
          removals: 0,
          updates: 0,
          precisions: 0,
          restructures: 0,
        },
        changes: [
          {
            id: "CHG-FAIL",
            type: "CORRECAO",
            severity: "ALTA",
            category: "LEGISLACAO",
            originalExcerpt: "cessa aos 18 anos",
            revisedExcerpt: "cessa aos 16 anos", // Erro crasso não comprovável em fonte oficial
            reason: "Alteração sem amparo oficial.",
            verified: false,
            confirmation: "NAO_CONFIRMADO",
            sources: [],
            evidence: [],
          },
        ],
        unverifiedClaims: [{ excerpt: "cessa aos 16 anos", reason: "Não comprovado em fonte oficial." }],
        reviewedMarkdown: input.content.replace("cessa aos 18 anos", "cessa aos 16 anos"),
        reviewNotes: "Falha na verificação de fontes oficiais.",
        consultedSources: [],
        model: "gpt-5.6",
        webSearchUsed: false,
      };
    },
  };

  const failReviewResult = await startLegalReview(repoFailClosed, failingAuditor, {
    day: 1,
    part: 0,
    force: false,
    uid: CEO_UID,
    now: 4000,
  });

  if (!("review" in failReviewResult)) throw new Error("Não esperado alreadyReviewed");
  const failReview = failReviewResult.review;
  assert.strictEqual(
    failReview.verificationLevel,
    "FALHA_NA_VERIFICACAO",
    "Nível de verificação deve ser FALHA_NA_VERIFICACAO."
  );

  let approvalBlocked = false;
  try {
    await approveLegalReview(repoFailClosed, failReview.id, CEO_UID, "jhonny.spider@gmail.com", 5000);
  } catch (err) {
    if (err instanceof LegalReviewError && err.status === 403) {
      approvalBlocked = true;
    }
  }

  assert(
    approvalBlocked,
    "O gate fail-closed DEVE lançar LegalReviewError (HTTP 403) e impedir aprovação se a verificação falhar."
  );

  const lessonAfterRejectedApproval = await repoFailClosed.getLesson("day_1_part_0");
  assert.strictEqual(
    lessonAfterRejectedApproval?.content,
    SAMPLE_LESSON_CONTENT,
    "A aula no catálogo deve permanecer absolutamente intocada quando a verificação falha."
  );
  console.log("   ✓ Gate fail-closed confirmado: publicação bloqueada com HTTP 403 e catálogo 100% protegido.");

  console.log("\n=== TODOS OS TESTES DO REVISOR JURÍDICO EDITORIAL INTEGRAL FORAM CONCLUÍDOS COM SUCESSO! ===");
}

runOfflineEditorialTests().catch((err) => {
  console.error("Erro no teste offline:", err);
  process.exit(1);
});
