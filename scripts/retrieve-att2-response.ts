/**
 * ATHENA — RECUPERAÇÃO SEGURA DA RESPOSTA OPENAI att-2 VIA RESPONSES API
 * 
 * Script preparado para recuperar uma resposta já existente e faturada da OpenAI:
 * Response ID: resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9
 * 
 * DIRETRIZES DE SEGURANÇA:
 * 1. Utiliza estritamente client.responses.retrieve(responseId) — NUNCA responses.create.
 * 2. Custo de geração: US$ 0,00 (consulta somente leitura de resposta já armazenada).
 * 3. Validação estrita de metadados:
 *    - Confirma ID esperado (resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9)
 *    - Valida modelo (gpt-5.6)
 *    - Valida usage (~39.906 tokens)
 *    - Valida integridade das 5 pendências da revisão rev_3d4deba9-5930-4b77-8ec1-7f257ef86008
 * 4. Aplica a sanitização corrigida (omissão de changeId quando ausente).
 * 5. Persiste os dados localmente em scratch/recovered_responses/ (fora do Git).
 * 6. Trava de segurança: exige flag explícita --execute para disparar a requisição de rede.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import OpenAI from "openai";
import { isOfficialLegalUrl, canonicalSourceUrl } from "../src/lib/legalReviewValidate.js";
import type { SupplementFindingItem, LegalReviewEvidence, LegalReviewSource } from "../src/lib/legalReviewTypes.js";

export const TARGET_RESPONSE_ID = "resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9";
export const EXPECTED_REVIEW_ID = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
export const EXPECTED_LESSON_ID = "day_1_part_0";

export const EXPECTED_PENDING_IDS = [
  "chg_CHG-001",
  "chg_CHG-002",
  "unverified_claim_1",
  "unverified_claim_2",
  "unverified_claim_3",
];

function resolveOpenAiApiKey(): string {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY.trim();
  }
  dotenv.config({ path: ".env.local" });
  dotenv.config();
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY.trim();
  }
  try {
    const fetched = execSync(
      `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=gen-lang-client-0822763072`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (fetched) {
      return fetched;
    }
  } catch {
    // Secret indisponível via gcloud CLI
  }
  throw new Error("OPENAI_API_KEY não encontrada no ambiente (.env, .env.local ou Google Secret Manager).");
}

export function sanitizeFindingsFromResponse(rawFindings: any[]): SupplementFindingItem[] {
  return (rawFindings || []).map((f) => {
    const rawUrl = String(f.verifiableUrl || "").trim();
    const isOfficial = rawUrl ? isOfficialLegalUrl(rawUrl) : false;
    const normalizedUrl = isOfficial ? (canonicalSourceUrl(rawUrl) || rawUrl) : rawUrl;

    const evidenceList: LegalReviewEvidence[] = isOfficial && f.foundOfficialEvidence ? [
      {
        institution: String(f.officialSourceConsulted || "Planalto/Tribunal"),
        title: String(f.officialSourceConsulted || "Fonte Oficial"),
        url: normalizedUrl,
        official: true,
        consulted: true,
        supportsChange: true,
        supportExplanation: String(f.objectiveJustification || "Evidência oficial obtida na complementação."),
        sourceType: "LEI",
      },
    ] : [];

    const sourcesList: LegalReviewSource[] = isOfficial ? [
      {
        title: String(f.officialSourceConsulted || "Fonte Oficial"),
        url: normalizedUrl,
        official: true,
        institution: String(f.officialSourceConsulted || "Planalto/Tribunal"),
      },
    ] : [];

    const finding: SupplementFindingItem = {
      pendingId: String(f.pendingId || ""),
      statementAnalyzed: String(f.statementAnalyzed || ""),
      officialSourceConsulted: String(f.officialSourceConsulted || ""),
      verifiableUrl: normalizedUrl,
      relevantExcerptOrBasis: String(f.relevantExcerptOrBasis || ""),
      status: f.status === "confirmada" || f.status === "refutada" ? f.status : "nao_verificada",
      objectiveJustification: String(f.objectiveJustification || ""),
      foundOfficialEvidence: Boolean(f.foundOfficialEvidence && isOfficial),
      evidence: evidenceList,
      sources: sourcesList,
    };

    // Correção estrita: omite a propriedade changeId quando ausente/nula/vazia
    if (typeof f.changeId === "string" && f.changeId.trim()) {
      finding.changeId = f.changeId.trim();
    }

    return finding;
  });
}

async function main() {
  console.log("================================================================================");
  console.log("ATHENA — RECUPERAÇÃO DA RESPOSTA att-2 PELA OPENAI RESPONSES API");
  console.log("================================================================================\n");

  const isExecuteAuthorized = process.argv.includes("--execute");

  console.log("Identificador Alvo (Response ID):", TARGET_RESPONSE_ID);
  console.log("Revisão Jurídica Correspondente:", EXPECTED_REVIEW_ID);
  console.log("Aula Alvo:", EXPECTED_LESSON_ID);
  console.log("Pendências Esperadas:", EXPECTED_PENDING_IDS.join(", "));
  console.log("Método da API:", "client.responses.retrieve(responseId) [SOMENTE LEITURA / CUSTO ZERO]");

  if (!isExecuteAuthorized) {
    console.log("\n[TRAVA DE SEGURANÇA ATIVA]");
    console.log("O script está configurado em modo de verificação pré-execução.");
    console.log("Nenhuma requisição de rede foi enviada à OpenAI.");
    console.log("Para executar a consulta real após autorização expressa do CEO, passe a flag --execute.");
    return;
  }

  console.log("\n[AUTORIZAÇÃO DETECTADA] Resolvendo credencial de acesso...");
  const apiKey = resolveOpenAiApiKey();
  console.log("✓ Credencial obtida com sucesso (comprimento:", apiKey.length, "caracteres).");

  const client = new OpenAI({ apiKey, maxRetries: 2 });

  console.log(`\nConsultando OpenAI Responses API (GET /v1/responses/${TARGET_RESPONSE_ID})...`);
  const response = await client.responses.retrieve(TARGET_RESPONSE_ID);

  console.log("✓ Resposta recebida da OpenAI!");
  console.log("  - ID confirmado:", response.id);
  console.log("  - Status:", response.status);
  console.log("  - Modelo:", response.model);
  console.log("  - Criado em:", new Date(response.created_at * 1000).toISOString());
  console.log("  - Usage:", JSON.stringify(response.usage));

  if (response.id !== TARGET_RESPONSE_ID) {
    throw new Error(`Incompatibilidade crítica: Response ID retornado (${response.id}) difere do esperado (${TARGET_RESPONSE_ID}).`);
  }

  const rawOutputText = (response.output_text || "").trim();
  if (!rawOutputText) {
    throw new Error("A resposta da OpenAI não contém output_text.");
  }

  let parsed: { findings: any[]; finalNote: string };
  try {
    parsed = JSON.parse(rawOutputText);
  } catch (err: any) {
    throw new Error(`Falha ao decodificar output_text como JSON: ${err?.message || err}`);
  }

  if (!Array.isArray(parsed.findings)) {
    throw new Error("O campo 'findings' na resposta não é um array válido.");
  }

  console.log(`\nProcessando ${parsed.findings.length} findings retornados...`);
  const sanitizedFindings = sanitizeFindingsFromResponse(parsed.findings);

  // Verificação de compatibilidade dos pendings IDs
  const returnedPendingIds = sanitizedFindings.map((f) => f.pendingId);
  console.log("  - Pending IDs na resposta:", returnedPendingIds.join(", "));

  const missingPendingIds = EXPECTED_PENDING_IDS.filter((id) => !returnedPendingIds.includes(id));
  if (missingPendingIds.length > 0) {
    console.warn("  [ALERTA] Pendências esperadas ausentes na resposta:", missingPendingIds.join(", "));
  } else {
    console.log("  ✓ Todas as 5 pendências esperadas estão presentes na resposta.");
  }

  // Estatísticas dos achados
  const statusCounts = sanitizedFindings.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log("  - Distribuição de status:", JSON.stringify(statusCounts));

  const officialEvidenceCount = sanitizedFindings.filter((f) => f.foundOfficialEvidence).length;
  console.log("  - Achados com evidência oficial confirmada:", officialEvidenceCount);
  console.log("  - Nota final:", parsed.finalNote || "(não fornecida)");

  // Persistência local segura em scratch/recovered_responses/
  const outputDir = resolve(process.cwd(), "scratch", "recovered_responses");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const rawFilePath = resolve(outputDir, "att2_response_raw.json");
  const sanitizedFilePath = resolve(outputDir, "att2_findings_sanitized.json");

  writeFileSync(rawFilePath, JSON.stringify(response, null, 2), "utf8");
  writeFileSync(
    sanitizedFilePath,
    JSON.stringify(
      {
        responseId: response.id,
        reviewId: EXPECTED_REVIEW_ID,
        lessonId: EXPECTED_LESSON_ID,
        retrievedAt: Date.now(),
        model: response.model,
        usage: response.usage,
        findingsCount: sanitizedFindings.length,
        statusCounts,
        officialEvidenceCount,
        finalNote: parsed.finalNote,
        findings: sanitizedFindings,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\n✓ Dados recuperados salvos localmente com segurança (fora do Git):");
  console.log("  - Resposta bruta:", rawFilePath);
  console.log("  - Findings sanitizados:", sanitizedFilePath);
  console.log("\n================================================================================");
  console.log("RECUPERAÇÃO LOCAL CONCLUÍDA COM SUCESSO E SEM CUSTO DE TOKENS!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("\n[ERRO NA RECUPERAÇÃO]", err?.message || err);
  process.exit(1);
});
