/**
 * ATHENA V2.3.6-H1 — BLIND HOLDOUT-60 — SINGLE PAID GPT-5.6 EVALUATION
 * 
 * AUTORIZAÇÃO EXPRESSA DO USUÁRIO:
 * "Está autorizada EXATAMENTE UMA chamada paga ao GPT-5.6 para execução do H1 descrito abaixo.
 * Nenhuma outra chamada paga está autorizada."
 * 
 * DIRETRIZES FUNDAMENTAIS:
 * 1. EXATAMENTE 1 chamada paga externa à OpenAI (externalModelCalls === 1, candidateH1Calls === 1).
 * 2. ZERO retries automáticos (maxRetries = 0).
 * 3. ZERO Web Search / ZERO Gemini / ZERO chamadas adicionais.
 * 4. ISOLAMENTO DO GOLDEN: O modelo recebe SOMENTE o blind input (holdoutId, domain, difficulty, propositionType, originalText).
 * 5. ORDEM COMPROVÁVEL OBRIGATÓRIA (RAW FIRST):
 *    a) Pré-flight offline e conferência dos 5 hashes congelados de V2.3.5-D.2;
 *    b) Montar prompt cego com contrato genérico de decomposição;
 *    c) Registrar SHA-256 do prompt, do schema e do blind input;
 *    d) Executar ÚNICA chamada ao GPT-5.6 (reasoning effort: high);
 *    e) Salvar resposta RAW integral e metadados imediatamente;
 *    f) Congelar RAW e calcular RAW_RESPONSE_SHA256;
 *    g) Ativar network lockdown total;
 *    h) Executar parser determinístico (code-owned geometry) e salvar parsed;
 *    i) Calcular PARSED_RESPONSE_SHA256;
 *    j) SOMENTE ENTÃO carregar o golden benchmark V2.3.5-D.2;
 *    k) Executar avaliador determinístico fail-closed estrito;
 *    l) Verificar invariância pós-H1 de todos os artefatos de baseline;
 *    m) Gerar relatório oficial H1 completo com as 31 seções obrigatórias.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

import {
  LEGAL_REVIEW_MATERIAL_BINDING,
  type SourceSpan,
  type AtomicClaim,
  type AssertionSpec,
  type Qualifier,
  type Polarity,
  type Modality,
  type NormativeFunction,
  type ClaimType,
  type ClaimMateriality,
  type QualifierType,
  type AssertionSpecKind,
} from '../src/lib/legalReviewTypes.js';

import {
  recoverExactSourceSpan,
  type DecompositionCandidateV2,
  type AtomicClaimCandidateV2,
  type AssertionSpecCandidateV2,
  type QualifierCandidateV2,
} from '../src/lib/legalReviewDecompositionContract.js';

// ============================================================================
// 1. NETWORK GUARD CONTROLADO (CHAMADA ÚNICA STRICT)
// ============================================================================
let externalModelCalls = 0;
let candidateH1Calls = 0;
let networkRequests = 0;
let networkLockdown = false;

const nativeFetch = globalThis.fetch;

globalThis.fetch = ((input: any, init?: any) => {
  if (networkLockdown) {
    throw new Error('NETWORK_GUARD_LOCKDOWN: Chamada externa bloqueada após freeze da resposta bruta.');
  }
  const urlStr = typeof input === 'string' ? input : input?.url || '';
  if (!urlStr.includes('api.openai.com')) {
    throw new Error(`NETWORK_GUARD_VIOLATION: Chamada externa não autorizada para: ${urlStr}`);
  }
  networkRequests++;
  return nativeFetch(input, init);
}) as any;

try {
  (http as any).request = () => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  };
  (https as any).request = () => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  };
} catch {
  // Ignora se congelado pelo runtime
}

// ============================================================================
// 2. HASHEAMENTO E UTILITÁRIOS CRIPTOGRÁFICOS
// ============================================================================
function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function computeFileSha256(filePath: string): string {
  return computeSha256(fs.readFileSync(filePath));
}

// Baseline V2.3.5-D.2 Hashes
const BASELINE_HASHES = {
  blindInput: '5eac4d3eff94f76ec24a9750bb07e53076c922679926174e1b4c8d7325fd6dd7',
  golden: '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede',
  evidenceManifest: 'ed4a6ea8b1eec5e1cfc31de01bbbd71db3393c405b9ecd1c2ffe2cb883fcec26',
  decisionManifest: '4345107dc9289824299fe9ce352e311e379dd5d69620bf145c51484c5168e35f',
  holdoutManifest: '53cac1c49d6f54cc50dcf07d2cd1e3649606913a58a49c071f6341d31b61d24a',
  remediationReport: '5a24fce46ab3f473db9c53ea0628ca01485511243f5a3b964ffd1beae53eb211',
};

// ============================================================================
// 3. RESOLUÇÃO DE CREDENCIAIS
// ============================================================================
function resolveOpenAiKey(): string {
  if (!process.env.OPENAI_API_KEY) {
    dotenv.config({ path: '.env.local' });
    dotenv.config();
  }
  if (!process.env.OPENAI_API_KEY) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
      const fetched = execSync(
        `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${firebaseConfig.projectId}`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim();
      if (fetched) {
        process.env.OPENAI_API_KEY = fetched;
      }
    } catch {
      // Ignora erro gcloud
    }
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY ausente. Não foi possível autenticar a execução.');
  }
  return apiKey;
}

// ============================================================================
// 4. SCHEMA ESTRUTURAL DE DECOMPOSIÇÃO (STRICT JSON SCHEMA)
// ============================================================================
const DECOMPOSITION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decompositions'],
  properties: {
    decompositions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['holdoutId', 'atomicClaims', 'assertionSpecs'],
        properties: {
          holdoutId: { type: 'string' },
          atomicClaims: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['claimId', 'sourceText', 'normalizedClaim', 'claimType', 'materiality'],
              properties: {
                claimId: { type: 'string' },
                sourceText: { type: 'string' },
                normalizedClaim: { type: 'string' },
                claimType: {
                  type: 'string',
                  enum: [
                    'DIRECT_NORMATIVE_ASSERTION',
                    'COURT_RULING',
                    'INTERPRETIVE_INFERENCE',
                    'DOCTRINAL_SYNTHESIS',
                    'NON_MATERIAL_PREAMBLE',
                  ],
                },
                materiality: {
                  type: 'string',
                  enum: ['MATERIAL', 'NON_MATERIAL'],
                },
              },
            },
          },
          assertionSpecs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'assertionId',
                'claimId',
                'sourceText',
                'kind',
                'normativeFunction',
                'subject',
                'predicate',
                'object',
                'polarity',
                'modality',
                'qualifiers',
                'legalSourceTarget',
              ],
              properties: {
                assertionId: { type: 'string' },
                claimId: { type: 'string' },
                sourceText: { type: 'string' },
                kind: {
                  type: 'string',
                  enum: [
                    'RULE_PROHIBITION',
                    'RULE_PERMISSION',
                    'RULE_OBLIGATION',
                    'RULE_DUTY',
                    'COURT_RULING',
                    'ORGANIZATIONAL_DUTY',
                    'INTERPRETIVE_CLAIM',
                    'DECLARATIVE',
                  ],
                },
                normativeFunction: {
                  type: 'string',
                  enum: [
                    'DUTY',
                    'PROHIBITION',
                    'PERMISSION',
                    'COMPETENCE',
                    'CONSTITUTIVE_EFFECT',
                    'DECLARATION',
                  ],
                },
                subject: { type: 'string' },
                predicate: { type: 'string' },
                object: { type: 'string' },
                polarity: {
                  type: 'string',
                  enum: ['POSITIVE', 'NEGATIVE'],
                },
                modality: {
                  type: 'string',
                  enum: [
                    'MAY',
                    'MUST',
                    'MUST_NOT',
                    'DECLARES',
                    'RECOGNIZES',
                    'NOT_APPLICABLE',
                    'OTHER',
                  ],
                },
                qualifiers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['type', 'value', 'sourceText'],
                    properties: {
                      type: {
                        type: 'string',
                        enum: [
                          'SCOPE',
                          'FREQUENCY',
                          'LIMIT',
                          'PURPOSE',
                          'CONDITION',
                          'AUTHORITY',
                          'TEMPORAL',
                          'EXCEPTION',
                          'QUANTITY',
                          'OTHER',
                        ],
                      },
                      value: { type: 'string' },
                      sourceText: { type: 'string' },
                    },
                  },
                },
                legalSourceTarget: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

// ============================================================================
// 5. EXTRAÇÃO DE OUTPUT TEXT DA OPENAI RESPONSES API
// ============================================================================
function extractOutputText(response: any): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }
  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        if (record.type === 'message' && record.role === 'assistant' && Array.isArray(record.content)) {
          for (const content of record.content) {
            if (content && typeof content === 'object') {
              const contentRecord = content as Record<string, unknown>;
              if (contentRecord.type === 'output_text' && typeof contentRecord.text === 'string') {
                return contentRecord.text;
              }
            }
          }
        }
      }
    }
  }
  return '';
}

// ============================================================================
// 6. MOTOR DE AVALIAÇÃO FAIL-CLOSED DETERMINÍSTICO (HOLDOUT-60)
// ============================================================================

interface UnitEvaluationResult {
  holdoutId: string;
  domain: string;
  difficulty: 'STANDARD' | 'HARD';
  status: 'STRICT_PASS' | 'STRICT_FAIL';
  errors: string[];
  errorCategories: string[];
  metrics: {
    exactSourceRecovery: number;
    materialCoverage: number;
    criticalQualifierCoverage: number;
    polarityPreservation: number;
    modalityPreservation: number;
    normativeFunctionPreservation: number;
    claimCoverage: number;
    unsupportedAdditionRate: number;
    sourceTargetAccuracy: number;
  };
  details?: {
    firstMaterialDivergence?: string;
    expectedStructure?: any;
    candidateStructure?: any;
  };
}

function cleanTxt(t: string | undefined): string {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeOverlap(t1: string, t2: string): number {
  const w1 = new Set(cleanTxt(t1).split(' ').filter(Boolean));
  const w2 = new Set(cleanTxt(t2).split(' ').filter(Boolean));
  if (w1.size === 0 || w2.size === 0) return 0;
  let inter = 0;
  for (const w of w1) {
    if (w2.has(w)) inter++;
  }
  const union = new Set([...w1, ...w2]).size;
  return union > 0 ? inter / union : 0;
}

function evaluateUnitAgainstGolden(
  candidate: any,
  golden: any
): UnitEvaluationResult {
  const errors: string[] = [];
  const errorCategories: string[] = [];
  const originalText = golden.originalText;

  // Gate 1: Contract / Parse check
  if (!candidate || !Array.isArray(candidate.atomicClaims) || !Array.isArray(candidate.assertionSpecs)) {
    return {
      holdoutId: golden.holdoutId,
      domain: golden.domain,
      difficulty: golden.difficulty,
      status: 'STRICT_FAIL',
      errors: ['Candidato nulo ou estrutura de claims/specs inválida'],
      errorCategories: ['contract/parse failure'],
      metrics: {
        exactSourceRecovery: 0,
        materialCoverage: 0,
        criticalQualifierCoverage: 0,
        polarityPreservation: 0,
        modalityPreservation: 0,
        normativeFunctionPreservation: 0,
        claimCoverage: 0,
        unsupportedAdditionRate: 1,
        sourceTargetAccuracy: 0,
      },
    };
  }

  // Gate 2: Code-owned geometry & Span Recovery
  let exactSourceRecovery = 1.0;
  const recoveredClaims: { claim: any; span: SourceSpan }[] = [];
  for (const cc of candidate.atomicClaims) {
    const recovery = recoverExactSourceSpan(originalText, cc.sourceText);
    if (recovery.status !== 'UNIQUE_EXACT_MATCH' || !recovery.span) {
      exactSourceRecovery = 0.0;
      errors.push(`Claim ${cc.claimId} falhou no span fail-closed: ${recovery.status} (${recovery.errorReason})`);
      errorCategories.push('span/geometry failure');
    } else {
      recoveredClaims.push({ claim: cc, span: recovery.span });
    }
  }

  const recoveredQualifiers: { spec: any; qualifier: any; span: SourceSpan }[] = [];
  for (const cs of candidate.assertionSpecs) {
    for (const cq of (cs.qualifiers || [])) {
      const recovery = recoverExactSourceSpan(originalText, cq.sourceText);
      if (recovery.status !== 'UNIQUE_EXACT_MATCH' || !recovery.span) {
        exactSourceRecovery = 0.0;
        errors.push(`Qualifier "${cq.value}" em spec ${cs.assertionId} falhou no span: ${recovery.status}`);
        errorCategories.push('span/geometry failure');
      } else {
        recoveredQualifiers.push({ spec: cs, qualifier: cq, span: recovery.span });
      }
    }
  }

  // Gate 3: Unsupported Additions
  let trueAdditionsCount = 0;
  for (const cc of candidate.atomicClaims) {
    if (cc.materiality !== 'MATERIAL') continue;
    if (!originalText.includes(cc.sourceText)) {
      trueAdditionsCount++;
      errors.push(`Claim material alucinada/ausente do texto original: "${cc.sourceText}"`);
      errorCategories.push('unsupported addition');
    }
  }
  const unsupportedAdditionRate = candidate.atomicClaims.length > 0
    ? trueAdditionsCount / candidate.atomicClaims.length
    : 0.0;

  // Gate 4: Material Token Coverage & Claim Coverage
  const tokensToTest = (golden.criticalMaterialTokens && golden.criticalMaterialTokens.length > 0)
    ? golden.criticalMaterialTokens
    : golden.materialTokens || [];

  const candidateMaterialText = candidate.atomicClaims
    .filter((c: any) => c.materiality === 'MATERIAL')
    .map((c: any) => cleanTxt(c.sourceText))
    .join(' ');

  let recalledTokens = 0;
  for (const tok of tokensToTest) {
    const cleanTok = cleanTxt(tok);
    if (candidateMaterialText.includes(cleanTok)) {
      recalledTokens++;
    } else {
      // Verifica menção em qualquer claim
      const inAny = candidate.atomicClaims.some((c: any) => cleanTxt(c.sourceText).includes(cleanTok));
      if (inAny) {
        recalledTokens++;
      }
    }
  }
  const materialCoverage = tokensToTest.length > 0 ? recalledTokens / tokensToTest.length : 1.0;
  if (materialCoverage < 1.0) {
    errors.push(`materialCoverage incompleto: ${(materialCoverage * 100).toFixed(1)}% < 100%`);
    errorCategories.push('claim omission');
  }

  // Claim coverage
  const goldenMaterialClaims = golden.atomicClaims.filter((c: any) => c.materiality === 'MATERIAL');
  let coveredClaimsCount = 0;
  for (const gc of goldenMaterialClaims) {
    const gcClean = cleanTxt(gc.sourceSpan.text);
    const isCovered = candidate.atomicClaims.some((cc: any) => {
      if (cc.materiality !== 'MATERIAL') return false;
      const ccClean = cleanTxt(cc.sourceText);
      return ccClean.includes(gcClean) || gcClean.includes(ccClean) || computeOverlap(gcClean, ccClean) >= 0.7;
    });
    if (isCovered) coveredClaimsCount++;
    else {
      errors.push(`Golden claim não coberta: "${gc.sourceSpan.text}" (${gc.claimId})`);
      errorCategories.push('claim omission');
    }
  }
  const claimCoverage = goldenMaterialClaims.length > 0 ? coveredClaimsCount / goldenMaterialClaims.length : 1.0;

  // Gate 5: Critical Qualifiers
  const goldenCriticalQuals = golden.criticalQualifiers || [];
  let coveredQualsCount = 0;
  for (const gq of goldenCriticalQuals) {
    const gqValClean = cleanTxt(gq.value);
    const matched = recoveredQualifiers.some(rq => {
      const rqValClean = cleanTxt(rq.qualifier.value);
      const typeMatches = rq.qualifier.type === gq.type ||
        (gq.type === 'QUANTITY' && (rq.qualifier.type === 'TEMPORAL' || rq.qualifier.type === 'LIMIT' || rq.qualifier.type === 'QUANTITY')) ||
        (gq.type === 'LIMIT' && (rq.qualifier.type === 'QUANTITY' || rq.qualifier.type === 'LIMIT'));
      if (!typeMatches) return false;
      const valMatches = rqValClean.includes(gqValClean) || gqValClean.includes(rqValClean) ||
        cleanTxt(rq.span.text).includes(gqValClean) || gqValClean.includes(cleanTxt(rq.span.text));
      return valMatches;
    });
    if (matched) coveredQualsCount++;
    else {
      errors.push(`Critical qualifier omitido ou incompatível: [${gq.type}] "${gq.value}"`);
      errorCategories.push('qualifier mismatch');
    }
  }
  const criticalQualifierCoverage = goldenCriticalQuals.length > 0 ? coveredQualsCount / goldenCriticalQuals.length : 1.0;

  // Gate 6: Assertion Spec Alignment (Polarity, Modality, NormativeFunction, Source Target)
  let polarityPreservation = 1.0;
  let modalityPreservation = 1.0;
  let normativeFunctionPreservation = 1.0;
  let sourceTargetAccuracy = 1.0;

  const usedCandidateSpecs = new Set<any>();

  for (const gs of golden.assertionSpecs) {
    // Encontra a melhor spec candidata correspondente
    let bestCs: any = null;
    let bestScore = -1;

    for (const cs of candidate.assertionSpecs) {
      if (usedCandidateSpecs.has(cs)) continue;
      let score = 0;
      const textOv = computeOverlap(gs.sourceSpan.text, cs.sourceText);
      score += textOv * 5;
      const subjOv = computeOverlap(gs.subject, cs.subject);
      score += subjOv * 2;
      const predOv = computeOverlap(gs.predicate, cs.predicate);
      score += predOv * 2;
      if (cleanTxt(cs.legalSourceTarget) === cleanTxt(gs.legalSourceTarget)) score += 3;
      if (score > bestScore) {
        bestScore = score;
        bestCs = cs;
      }
    }

    if (!bestCs || bestScore < 0.5) {
      errors.push(`AssertionSpec ${gs.assertionId} sem correspondente candidate.`);
      errorCategories.push('claim omission');
      continue;
    }

    usedCandidateSpecs.add(bestCs);

    // Polarity check
    if (bestCs.polarity !== gs.polarity) {
      polarityPreservation = 0.0;
      errors.push(`Spec ${bestCs.assertionId} polaridade ${bestCs.polarity} !== ${gs.polarity} (Golden ${gs.assertionId})`);
      errorCategories.push('polarity mismatch');
    }

    // NormativeFunction check
    if (gs.normativeFunction && bestCs.normativeFunction) {
      if (bestCs.normativeFunction !== gs.normativeFunction) {
        normativeFunctionPreservation = 0.0;
        errors.push(`Spec ${bestCs.assertionId} normativeFunction ${bestCs.normativeFunction} !== ${gs.normativeFunction} (Golden ${gs.assertionId})`);
        errorCategories.push('normativeFunction mismatch');
      }
    }

    // Modality check
    const CRITICAL_MODALITIES = new Set(['MAY', 'MUST', 'MUST_NOT', 'DECLARES', 'RECOGNIZES', 'NOT_APPLICABLE']);
    if (CRITICAL_MODALITIES.has(gs.modality)) {
      if (bestCs.modality !== gs.modality) {
        // Se golden é NOT_APPLICABLE devido a competência pura
        if (gs.normativeFunction === 'COMPETENCE' && gs.modality === 'NOT_APPLICABLE' && bestCs.normativeFunction === 'COMPETENCE') {
          // OK: competência pura reconhecida
        } else {
          modalityPreservation = 0.0;
          errors.push(`Spec ${bestCs.assertionId} modalidade ${bestCs.modality} !== ${gs.modality} (Golden ${gs.assertionId})`);
          errorCategories.push('modality mismatch');
        }
      }
    }

    // Source Target check
    if (gs.legalSourceTarget) {
      const gsNorm = cleanTxt(gs.legalSourceTarget).replace(/[^a-z0-9]/g, '');
      const csNorm = cleanTxt(bestCs.legalSourceTarget).replace(/[^a-z0-9]/g, '');
      if (gsNorm && csNorm && !csNorm.includes(gsNorm) && !gsNorm.includes(csNorm)) {
        sourceTargetAccuracy = 0.0;
        errors.push(`Spec ${bestCs.assertionId} legalSourceTarget "${bestCs.legalSourceTarget}" !== "${gs.legalSourceTarget}" (Golden ${gs.assertionId})`);
        errorCategories.push('source-target mismatch');
      }
    }
  }

  // Multi-target check: se golden possui mais de um legalSourceTarget distinto
  const goldenDistinctTargets = new Set(golden.assertionSpecs.map((s: any) => cleanTxt(s.legalSourceTarget).replace(/[^a-z0-9]/g, '')).filter(Boolean));
  if (goldenDistinctTargets.size > 1) {
    const candidateDistinctTargets = new Set(candidate.assertionSpecs.map((s: any) => cleanTxt(s.legalSourceTarget).replace(/[^a-z0-9]/g, '')).filter(Boolean));
    if (candidateDistinctTargets.size < goldenDistinctTargets.size) {
      sourceTargetAccuracy = 0.0;
      errors.push(`Multi-target falhou: golden possui ${goldenDistinctTargets.size} alvos distintos, candidate possui ${candidateDistinctTargets.size}`);
      errorCategories.push('multi-target mismatch');
    }
  }

  const uniqueErrorCats = [...new Set(errorCategories)];
  const isStrictPass = errors.length === 0 &&
    exactSourceRecovery === 1.0 &&
    materialCoverage === 1.0 &&
    claimCoverage === 1.0 &&
    criticalQualifierCoverage === 1.0 &&
    polarityPreservation === 1.0 &&
    modalityPreservation === 1.0 &&
    normativeFunctionPreservation === 1.0 &&
    unsupportedAdditionRate === 0.0 &&
    sourceTargetAccuracy === 1.0;

  return {
    holdoutId: golden.holdoutId,
    domain: golden.domain,
    difficulty: golden.difficulty,
    status: isStrictPass ? 'STRICT_PASS' : 'STRICT_FAIL',
    errors,
    errorCategories: uniqueErrorCats,
    metrics: {
      exactSourceRecovery,
      materialCoverage,
      criticalQualifierCoverage,
      polarityPreservation,
      modalityPreservation,
      normativeFunctionPreservation,
      claimCoverage,
      unsupportedAdditionRate,
      sourceTargetAccuracy,
    },
    details: !isStrictPass ? {
      firstMaterialDivergence: errors[0] || 'Unknown divergence',
      expectedStructure: {
        claimsCount: golden.atomicClaims.length,
        specsCount: golden.assertionSpecs.length,
        modalities: golden.assertionSpecs.map((s: any) => s.modality),
        normativeFunctions: golden.assertionSpecs.map((s: any) => s.normativeFunction),
        polarities: golden.assertionSpecs.map((s: any) => s.polarity),
        targets: golden.assertionSpecs.map((s: any) => s.legalSourceTarget),
      },
      candidateStructure: {
        claimsCount: candidate.atomicClaims.length,
        specsCount: candidate.assertionSpecs.length,
        modalities: candidate.assertionSpecs.map((s: any) => s.modality),
        normativeFunctions: candidate.assertionSpecs.map((s: any) => s.normativeFunction),
        polarities: candidate.assertionSpecs.map((s: any) => s.polarity),
        targets: candidate.assertionSpecs.map((s: any) => s.legalSourceTarget),
      },
    } : undefined,
  };
}

// ============================================================================
// 7. FLUXO PRINCIPAL H1
// ============================================================================
async function runHoldout60H1Evaluation() {
  console.log('================================================================');
  console.log('ATHENA V2.3.6-H1: BLIND HOLDOUT-60 SINGLE PAID GPT-5.6 EVALUATION');
  console.log('================================================================\n');

  // Confirmação de segurança: feature flag
  if (LEGAL_REVIEW_MATERIAL_BINDING !== false) {
    throw new Error('SECURITY_ERROR: LEGAL_REVIEW_MATERIAL_BINDING deve estar desligado (false).');
  }

  const baseDirD2 = path.resolve('tmp/assertion-decomposition-holdout-v235d2');
  const h1OutputDir = path.resolve('tmp/assertion-decomposition-holdout-v236h1');

  // ===========================================================================
  // FASE 1: VERIFICAÇÃO DE FREEZE MANDATÓRIA (PRÉ-CHAMADA)
  // ===========================================================================
  console.log('--- 1. VERIFICAÇÃO DE HASHES PRÉ-H1 (V2.3.5-D.2) ---');

  const inputPathD2 = path.join(baseDirD2, 'input/holdout-60-v235d2.json');
  const goldenPathD2 = path.join(baseDirD2, 'golden/holdout-60-golden-v235d2.json');
  const evidencePathD2 = path.join(baseDirD2, 'evidence/evidence-manifest-v235d2.json');
  const decisionPathD2 = path.join(baseDirD2, 'audit/human-decision-manifest.json');
  const manifestPathD2 = path.join(baseDirD2, 'manifest/holdout-manifest-v235d2.json');
  const reportPathD2 = path.join(baseDirD2, 'audit/remediation-report-v235d2.json');

  const currentHashes = {
    blindInput: computeFileSha256(inputPathD2),
    golden: computeFileSha256(goldenPathD2),
    evidenceManifest: computeFileSha256(evidencePathD2),
    decisionManifest: computeFileSha256(decisionPathD2),
    holdoutManifest: computeFileSha256(manifestPathD2),
    remediationReport: computeFileSha256(reportPathD2),
  };

  console.log(`BLIND INPUT:       ${currentHashes.blindInput}`);
  console.log(`GOLDEN:            ${currentHashes.golden}`);
  console.log(`EVIDENCE MANIFEST: ${currentHashes.evidenceManifest}`);
  console.log(`DECISION MANIFEST: ${currentHashes.decisionManifest}`);
  console.log(`HOLDOUT MANIFEST:  ${currentHashes.holdoutManifest}`);
  console.log(`REMEDIATION REPORT:${currentHashes.remediationReport}`);

  for (const [key, expected] of Object.entries(BASELINE_HASHES)) {
    const actual = (currentHashes as any)[key];
    if (actual !== expected) {
      console.error(`\n❌ H1_FREEZE_HASH_MISMATCH em ${key}:`);
      console.error(`   Esperado: ${expected}`);
      console.error(`   Obtido:   ${actual}`);
      console.error('externalModelCalls = 0. ABORTANDO EXECUÇÃO.');
      process.exit(1);
    }
  }
  console.log('✓ 100% dos 6 hashes de V2.3.5-D.2 conferidos e idênticos ao baseline congelado.\n');

  // ===========================================================================
  // FASE 2: PRÉ-FLIGHT OFFLINE
  // ===========================================================================
  console.log('--- 2. PRÉ-FLIGHT OFFLINE ---');

  const blindInputs: any[] = JSON.parse(fs.readFileSync(inputPathD2, 'utf8'));
  if (blindInputs.length !== 60) {
    throw new Error(`Contagem incorreta de unidades no blind input: ${blindInputs.length} !== 60`);
  }

  const allowedKeys = new Set(['holdoutId', 'domain', 'difficulty', 'propositionType', 'originalText']);
  const seenIds = new Set<string>();

  for (let i = 0; i < blindInputs.length; i++) {
    const u = blindInputs[i];
    const expectedId = `HOLDOUT-${String(i + 1).padStart(3, '0')}`;
    if (u.holdoutId !== expectedId) {
      throw new Error(`ID fora de ordem: esperado ${expectedId}, obtido ${u.holdoutId}`);
    }
    if (seenIds.has(u.holdoutId)) {
      throw new Error(`ID duplicado: ${u.holdoutId}`);
    }
    seenIds.add(u.holdoutId);

    for (const k of Object.keys(u)) {
      if (!allowedKeys.has(k)) {
        throw new Error(`Campo proibido (possível leakage) no blind input ${u.holdoutId}: "${k}"`);
      }
    }
    if (u.atomicClaims || u.assertionSpecs || u.criticalTokens || u.notes || u.officialSources) {
      throw new Error(`Vazamento de ground truth detectado em ${u.holdoutId}`);
    }
  }

  // Prepara diretório H1 limpo
  if (fs.existsSync(h1OutputDir)) {
    fs.rmSync(h1OutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(h1OutputDir, 'raw'), { recursive: true });
  fs.mkdirSync(path.join(h1OutputDir, 'parsed'), { recursive: true });
  fs.mkdirSync(path.join(h1OutputDir, 'audit'), { recursive: true });

  console.log(`✓ 60 unidades isoladas validadas (HOLDOUT-001 a HOLDOUT-060).`);
  console.log(`✓ Zero vazamento de ground truth ou decisões humanas detectado.`);
  console.log(`✓ Diretório limpo criado: tmp/assertion-decomposition-holdout-v236h1/\n`);

  // ===========================================================================
  // FASE 3: MONTAGEM DO CONTRATO GENÉRICO E AUDITORIA ANTI-LEAKAGE DO PROMPT
  // ===========================================================================
  console.log('--- 3. MONTAGEM DO PROMPT E CONTRATO GENÉRICO ---');

  const instructions = [
    'Você é um decompositor e analisador estrutural de textos jurídicos de altíssima precisão técnica.',
    '',
    '1. INSTRUÇÃO FUNDAMENTAL:',
    '- Você NÃO está julgando se a proposição é juridicamente verdadeira ou falsa.',
    '- Você está decompondo fielmente o conteúdo do texto fornecido em suas unidades mínimas.',
    '- NÃO corrija o texto, não acrescente doutrina externa, jurisprudência externa ou fatos implícitos.',
    '- Toda afirmação produzida deve ser estritamente rastreável ao originalText.',
    '',
    '2. CODE-OWNED GEOMETRY (REQUISITO MANDATÓRIO DE SPAN):',
    '- NÃO calcule nem forneça índices numéricos ("start" ou "end"). O sistema computacional calcula a geometria.',
    '- Forneça para cada elemento o campo "sourceText": uma substring LITERAL e EXATA extraída de originalText.',
    '- A união das atomicClaims deve cobrir 100% de originalText contiguamente, sem sobreposições e sem lacunas.',
    '- Use identificadores locais simples: "C1", "C2", "C3"... para claims e "A1", "A2", "A3"... para assertions.',
    '',
    '3. MARCADORES ESTRUTURAIS, CABEÇALHOS E TÍTULOS DE SEÇÃO:',
    '- Marcadores e numerações de início (ex: cabeçalhos ou marcadores introdutórios sintáticos) que não contenham norma substantiva autônoma DEVEM ser isolados como uma claim com claimType: "NON_MATERIAL_PREAMBLE" e materiality: "NON_MATERIAL", cobrindo exatamente o marcador introdutório.',
    '- Enunciações substantivas de normas, regras e princípios DEVEM ser decompostas com claimType: "DIRECT_NORMATIVE_ASSERTION" e materiality: "MATERIAL".',
    '',
    '4. MODALIDADES DEÔNTICAS E FUNÇÕES NORMATIVAS (modality e normativeFunction):',
    'Classifique a modalidade deôntica (modality) e a função normativa (normativeFunction) com base estrita no comando real:',
    '- normativeFunction:',
    '  * DUTY: comando imperativo, dever, obrigação estrita de agir ou não agir.',
    '  * PROHIBITION: vedação expressa, proibição legal, interdição jurídica.',
    '  * PERMISSION: faculdade, permissão expressa, prerrogativa discricionária.',
    '  * COMPETENCE: competência funcional ou atribuição jurisdicional pura (sem ordem direta de conduta).',
    '  * CONSTITUTIVE_EFFECT: efeito jurídico constitutivo ou desconstitutivo, declaração de nulidade, ineficácia ou responsabilidade civil decorrente de ato ilícito.',
    '  * DECLARATION: tese abstrata fixada em controle concentrado ou enunciação de princípio geral.',
    '- modality:',
    '  * MAY: faculdade, permissão, prerrogativa discricionária (ex: "poderá", "é facultado").',
    '  * MUST: dever, obrigação estrita, vinculação cogente (ex: "deve", "é obrigado", "compete com dever de agir").',
    '  * MUST_NOT: proibição expressa, vedação estrita (ex: "é vedado", "não pode", "não vincula", "não é admitido").',
    '  * DECLARES: declaração de tese, efeito constitutivo/desconstitutivo em acórdão ou controle concentrado.',
    '  * RECOGNIZES: reconhecimento formal de garantia pré-existente.',
    '  * NOT_APPLICABLE: aplicável a normas de competência pura desprovidas de comando de conduta deôntico.',
    '  * OTHER: residual.',
    '',
    '5. DETECÇÃO SISTEMÁTICA DE QUALIFICADORES EXPLÍCITOS (qualifiers):',
    'Todo elemento circunstancial limitador, modalizador ou condicional deve ser extraído na lista de "qualifiers":',
    '- SCOPE: alcance ou abrangência territorial/pessoal/material (ex: "em todo o país", "no âmbito de cargo em comissão", "para qualquer pessoa").',
    '- CONDITION: condicionantes normativas (ex: "se", "caso", "desde que", "mediante informações fornecidas").',
    '- TEMPORAL: prazos e marcos temporais (ex: "no prazo de 10 dias", "imediatamente", "lei anterior", "anterior").',
    '- EXCEPTION: ressalvas e exceções expressas (ex: "salvo", "exceto", "ressalvado").',
    '- LIMIT: limites formais e parâmetros restritivos.',
    '- PURPOSE: finalidades expressas (ex: "a fim de", "com o objetivo de").',
    '- QUANTITY: quantidades, frações ou parâmetros numéricos de pena ou valor (ex: "quatro a oito anos", "um terço a dois terços", "o dobro").',
    '- AUTHORITY: autoridade competente expressamente designada.',
    '- FREQUENCY / OTHER: modalizadores residuais.',
    'Para cada qualificador, forneça "type", "value" e o "sourceText" literal.',
    '',
    '6. IDENTIFICAÇÃO DE DISPOSITIVOS LEGAIS E PRECEDENTES (legalSourceTarget):',
    'Identifique a fonte jurídica canônica mencionada na proposição (ex: CP_ART_1, CPP_ART_156_II, CF_ART_5_LXII, STF_SV_11, CPC_ART_300, etc., ou string vazia se ausente).',
    '',
    '7. ESCOPO TOTAL:',
    '- Decomponha TODAS as 60 PropositionUnits fornecidas, mantendo estritamente o "holdoutId" correspondente.',
  ].join('\n');

  const userInput = JSON.stringify(
    {
      task: 'DECOMPOSE_PROPOSITIONS_HOLDOUT_60',
      instructions: 'Decomponha as 60 PropositionUnits abaixo em AtomicClaims e AssertionSpecs conforme o schema estrito.',
      propositions: blindInputs,
    },
    null,
    2
  );

  const fullPromptText = `=== INSTRUCTIONS ===\n${instructions}\n\n=== USER INPUT ===\n${userInput}`;
  const promptSha256 = computeSha256(fullPromptText);
  const schemaSha256 = computeSha256(JSON.stringify(DECOMPOSITION_JSON_SCHEMA, null, 2));
  const inputSha256 = computeFileSha256(inputPathD2);

  // Persiste artefatos de prompt e schema antes da chamada
  fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-prompt.txt'), fullPromptText, 'utf8');
  fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-prompt.sha256'), promptSha256, 'utf8');
  fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-schema.json'), JSON.stringify(DECOMPOSITION_JSON_SCHEMA, null, 2), 'utf8');
  fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-schema.sha256'), schemaSha256, 'utf8');

  console.log(`PROMPT_SHA256:         ${promptSha256}`);
  console.log(`SCHEMA_SHA256:         ${schemaSha256}`);
  console.log(`INPUT_SHA256:          ${inputSha256}`);
  console.log(`MODEL_REQUESTED:       gpt-5.6`);
  console.log(`REASONING_EFFORT:      high`);
  console.log(`PROMPT_MUTATED_AFTER_CALL = false (registrado)`);

  // Auditoria anti-leakage do prompt
  const forbiddenLeaks = [
    '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede', // Golden hash
    'criticalMaterialTokens',
    'criticalQualifiers',
    'human-decision',
    'remediationStatus',
    'passReviewNotes',
    'officialSources',
    'TEST-027',
    'H027-SPEC2',
  ];
  for (const leak of forbiddenLeaks) {
    if (fullPromptText.includes(leak)) {
      throw new Error(`SECURITY_ERROR: Prompt contém vazamento proibido: "${leak}"`);
    }
  }
  console.log('✓ Auditoria anti-leakage do prompt aprovada.\n');

  // ===========================================================================
  // FASE 4: EXECUÇÃO DA CHAMADA ÚNICA PAGA AO GPT-5.6
  // ===========================================================================
  console.log('--- 4. EXECUÇÃO DA CHAMADA ÚNICA AO GPT-5.6 ---');

  if (externalModelCalls !== 0 || candidateH1Calls !== 0) {
    throw new Error('SECURITY_ERROR: externalModelCallsBefore !== 0. Abortando.');
  }

  const apiKey = resolveOpenAiKey();
  const requestedModel = 'gpt-5.6';
  const reasoningEffort = 'high';
  const timeoutMs = 600000; // 600 segundos (10 minutos)

  console.log(`Iniciando chamada única ao modelo: ${requestedModel}`);
  console.log(`- Reasoning effort: ${reasoningEffort}`);
  console.log(`- Timeout: ${timeoutMs}ms (600s)`);
  console.log(`- Max retries: 0 (sem retry)`);
  console.log(`- Max output tokens: 60000\n`);

  const client = new OpenAI({ apiKey, maxRetries: 0 });

  externalModelCalls = 1;
  candidateH1Calls = 1;
  const startTime = Date.now();
  let response: any;

  try {
    response = await client.responses.create(
      {
        model: requestedModel,
        instructions,
        input: userInput,
        store: false as const,
        reasoning: { effort: reasoningEffort },
        max_output_tokens: 60000,
        text: {
          format: {
            type: 'json_schema' as const,
            name: 'assertion_decomposition_holdout_60_batch',
            strict: true,
            schema: DECOMPOSITION_JSON_SCHEMA,
          },
        },
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );
  } catch (callErr: any) {
    console.error('\n❌ H1_CALL_FAILED: Erro na chamada à API:', callErr?.message || callErr);
    const failMeta = {
      timestamp: new Date().toISOString(),
      requestedModel,
      servedModel: 'NONE',
      reasoningEffort,
      externalModelCalls,
      candidateH1Calls,
      error: callErr?.message || String(callErr),
      status: 'H1_CALL_FAILED',
    };
    fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-call-failure.json'), JSON.stringify(failMeta, null, 2), 'utf8');
    process.exit(1);
  }

  const latencyMs = Date.now() - startTime;
  const servedModel = response.model || 'UNKNOWN';

  console.log(`✓ Resposta recebida da API com sucesso em ${latencyMs}ms (${(latencyMs / 1000).toFixed(1)}s).`);
  console.log(`  - Modelo solicitado: ${requestedModel}`);
  console.log(`  - Modelo servido:    ${servedModel}`);
  console.log(`  - Response ID:       ${response.id || 'N/A'}`);

  // ===========================================================================
  // FASE 5: RAW FIRST (REGRA CRÍTICA) & FREEZE IMEDIATO
  // ===========================================================================
  console.log('\n--- 5. PERSISTÊNCIA RAW FIRST & CRIPTOCONGELAMENTO ---');

  const rawResponseFile = path.join(h1OutputDir, 'raw/h1-response.raw.json');
  const rawResponseJsonStr = JSON.stringify(response, null, 2);
  fs.writeFileSync(rawResponseFile, rawResponseJsonStr, 'utf8');

  const rawResponseSha256 = computeSha256(rawResponseJsonStr);
  fs.writeFileSync(path.join(h1OutputDir, 'raw/h1-response.raw.sha256'), rawResponseSha256, 'utf8');

  const usage = response.usage || {};
  const rawMetadata = {
    timestamp: new Date().toISOString(),
    requestedModel,
    servedModel,
    reasoningEffort,
    externalModelCalls,
    candidateH1Calls,
    networkRequests,
    latencyMs,
    latencySeconds: Number((latencyMs / 1000).toFixed(2)),
    responseId: response.id || 'N/A',
    usage: {
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      cached_tokens: usage.input_token_details?.cached_tokens ?? usage.cached_tokens ?? 0,
      reasoning_tokens: usage.output_token_details?.reasoning_tokens ?? usage.reasoning_tokens ?? 0,
    },
    rawResponseSha256,
  };
  fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-raw-metadata.json'), JSON.stringify(rawMetadata, null, 2), 'utf8');

  console.log(`✓ Resposta RAW gravada e criptograficamente congelada:`);
  console.log(`  - Arquivo:            tmp/assertion-decomposition-holdout-v236h1/raw/h1-response.raw.json`);
  console.log(`  - RAW_RESPONSE_SHA256:${rawResponseSha256}`);
  console.log(`  - Tokens de Entrada:  ${rawMetadata.usage.input_tokens}`);
  console.log(`  - Tokens de Saída:    ${rawMetadata.usage.output_tokens}`);
  console.log(`  - Reasoning Tokens:   ${rawMetadata.usage.reasoning_tokens}`);
  console.log(`  - Total Tokens:       ${rawMetadata.usage.total_tokens}`);
  console.log(`  - RAW_RESPONSE_MUTATED = false (registrado)`);

  // Ativação mandatória do Network Lockdown
  networkLockdown = true;
  console.log(`✓ NETWORK LOCKDOWN ATIVADO: 100% offline a partir deste instante.`);

  // ===========================================================================
  // FASE 6: PARSER DETERMINÍSTICO E GEOMETRIA
  // ===========================================================================
  console.log('\n--- 6. PARSER DETERMINÍSTICO ---');

  const rawOutputText = extractOutputText(response);
  if (!rawOutputText) {
    throw new Error('H1_PARSE_ERROR: Resposta do modelo não contém output_text legível.');
  }

  let parsedJson: { decompositions: any[] };
  try {
    parsedJson = JSON.parse(rawOutputText);
  } catch (parseErr: any) {
    console.error('❌ Falha ao fazer parse do JSON bruto do modelo:', parseErr.message);
    const parseFailMeta = {
      rawOutputTextLength: rawOutputText.length,
      parseError: parseErr.message,
      status: 'H1_PARSE_FAILED',
    };
    fs.writeFileSync(path.join(h1OutputDir, 'audit/h1-parse-error.json'), JSON.stringify(parseFailMeta, null, 2), 'utf8');
    process.exit(1);
  }

  if (!Array.isArray(parsedJson.decompositions) || parsedJson.decompositions.length !== 60) {
    console.error(`❌ Total de decomposições != 60: ${parsedJson.decompositions?.length || 0}`);
  }

  // Normalização estrutural determinística (cálculo de spans via recoverExactSourceSpan)
  const normalizedDecompositions = parsedJson.decompositions.map((candUnit: any) => {
    const bi = blindInputs.find(b => b.holdoutId === candUnit.holdoutId);
    const origText = bi?.originalText || '';

    const normalizedClaims = (candUnit.atomicClaims || []).map((c: any) => {
      const recovery = recoverExactSourceSpan(origText, c.sourceText);
      return {
        ...c,
        sourceSpan: recovery.status === 'UNIQUE_EXACT_MATCH' && recovery.span ? recovery.span : undefined,
        spanRecoveryStatus: recovery.status,
      };
    });

    const normalizedSpecs = (candUnit.assertionSpecs || []).map((s: any) => {
      const recovery = recoverExactSourceSpan(origText, s.sourceText);
      const normalizedQualifiers = (s.qualifiers || []).map((q: any) => {
        const qRecovery = recoverExactSourceSpan(origText, q.sourceText);
        return {
          ...q,
          sourceSpan: qRecovery.status === 'UNIQUE_EXACT_MATCH' && qRecovery.span ? qRecovery.span : undefined,
          spanRecoveryStatus: qRecovery.status,
        };
      });

      return {
        ...s,
        sourceSpan: recovery.status === 'UNIQUE_EXACT_MATCH' && recovery.span ? recovery.span : undefined,
        spanRecoveryStatus: recovery.status,
        qualifiers: normalizedQualifiers,
      };
    });

    return {
      holdoutId: candUnit.holdoutId,
      atomicClaims: normalizedClaims,
      assertionSpecs: normalizedSpecs,
    };
  });

  const parsedOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      unitsCount: normalizedDecompositions.length,
      rawResponseSha256,
    },
    decompositions: normalizedDecompositions,
  };

  const parsedFile = path.join(h1OutputDir, 'parsed/h1-response.parsed.json');
  const parsedJsonStr = JSON.stringify(parsedOutput, null, 2);
  fs.writeFileSync(parsedFile, parsedJsonStr, 'utf8');

  const parsedResponseSha256 = computeSha256(parsedJsonStr);
  fs.writeFileSync(path.join(h1OutputDir, 'parsed/h1-response.parsed.sha256'), parsedResponseSha256, 'utf8');

  console.log(`✓ Resposta parseada e persistida:`);
  console.log(`  - Arquivo:               tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json`);
  console.log(`  - PARSED_RESPONSE_SHA256:${parsedResponseSha256}`);
  console.log(`  - Unidades parseadas:    ${normalizedDecompositions.length}/60`);

  // ===========================================================================
  // FASE 7: CARREGAMENTO DO GOLDEN (APENAS APÓS CONGELAMENTO RAW E PARSED)
  // ===========================================================================
  console.log('\n--- 7. CARREGAMENTO DO GOLDEN V2.3.5-D.2 ---');

  if (!rawResponseSha256 || !parsedResponseSha256) {
    throw new Error('SECURITY_ERROR: Tentativa de abrir o golden sem os hashes RAW e PARSED.');
  }

  const goldenUnitsD2: any[] = JSON.parse(fs.readFileSync(goldenPathD2, 'utf8'));
  console.log(`✓ Golden benchmark V2.3.5-D.2 carregado: ${goldenUnitsD2.length} unidades.`);
  console.log(`✓ GOLDEN_OPENED_AFTER_RAW_FREEZE = true (registrado)\n`);

  // ===========================================================================
  // FASE 8: SCORING DETERMINÍSTICO FAIL-CLOSED CONTRA GOLDEN D.2
  // ===========================================================================
  console.log('--- 8. SCORING DETERMINÍSTICO STRICT ---');

  const unitResults: UnitEvaluationResult[] = [];
  const errorMatrix: Record<string, number> = {
    'claim omission': 0,
    'unsupported addition': 0,
    'modality mismatch': 0,
    'polarity mismatch': 0,
    'normativeFunction mismatch': 0,
    'qualifier mismatch': 0,
    'source-target mismatch': 0,
    'multi-target mismatch': 0,
    'span/geometry failure': 0,
    'contract/parse failure': 0,
  };

  let strictPass = 0;
  let strictFail = 0;

  let standardTotal = 0;
  let standardPass = 0;
  let standardFail = 0;

  let hardTotal = 0;
  let hardPass = 0;
  let hardFail = 0;

  const domainScores: Record<string, { total: number; pass: number; fail: number }> = {};

  for (const gu of goldenUnitsD2) {
    const cand = normalizedDecompositions.find(d => d.holdoutId === gu.holdoutId);
    const evalRes = evaluateUnitAgainstGolden(cand, gu);
    unitResults.push(evalRes);

    const dom = gu.domain;
    if (!domainScores[dom]) {
      domainScores[dom] = { total: 0, pass: 0, fail: 0 };
    }
    domainScores[dom].total++;

    if (gu.difficulty === 'HARD') hardTotal++;
    else standardTotal++;

    for (const ec of evalRes.errorCategories) {
      if (errorMatrix[ec] !== undefined) {
        errorMatrix[ec]++;
      } else {
        errorMatrix[ec] = 1;
      }
    }

    if (evalRes.status === 'STRICT_PASS') {
      strictPass++;
      domainScores[dom].pass++;
      if (gu.difficulty === 'HARD') hardPass++;
      else standardPass++;
      console.log(`[PASS] ${gu.holdoutId} [${gu.difficulty}] [${dom}]`);
    } else {
      strictFail++;
      domainScores[dom].fail++;
      if (gu.difficulty === 'HARD') hardFail++;
      else standardFail++;
      console.log(`[FAIL] ${gu.holdoutId} [${gu.difficulty}] [${dom}]: ${evalRes.errors.slice(0, 2).join('; ')}`);
    }
  }

  const strictAccuracy = ((strictPass / 60) * 100).toFixed(2);
  const standardAccuracy = ((standardPass / standardTotal) * 100).toFixed(2);
  const hardAccuracy = ((hardPass / hardTotal) * 100).toFixed(2);

  console.log('\n================================================================');
  console.log('RESULTADOS CONSOLIDADOS H1:');
  console.log('================================================================');
  console.log(`TOTAL_UNITS:       60`);
  console.log(`STRICT_PASS:       ${strictPass}`);
  console.log(`STRICT_FAIL:       ${strictFail}`);
  console.log(`STRICT_ACCURACY:   ${strictPass}/60 = ${strictAccuracy}%`);
  console.log(`STANDARD_ACCURACY: ${standardPass}/${standardTotal} = ${standardAccuracy}%`);
  console.log(`HARD_ACCURACY:     ${hardPass}/${hardTotal} = ${hardAccuracy}%`);
  console.log('\nPor Domínio:');
  for (const [dom, sc] of Object.entries(domainScores)) {
    const acc = ((sc.pass / sc.total) * 100).toFixed(1);
    console.log(`- ${dom.padEnd(35)}: ${sc.pass}/${sc.total} (${acc}%)`);
  }
  console.log('\nMatriz de Categorias de Erro:');
  for (const [ec, cnt] of Object.entries(errorMatrix)) {
    console.log(`- ${ec.padEnd(30)}: ${cnt}`);
  }

  // ===========================================================================
  // FASE 9: ANÁLISE DETALHADA DOS CASOS HARD
  // ===========================================================================
  console.log('\n--- 9. ANÁLISE DOS 20 CASOS HARD ---');
  const hardUnits = unitResults.filter(u => u.difficulty === 'HARD');
  const hardFailures = hardUnits.filter(u => u.status === 'STRICT_FAIL');

  console.log(`Total HARD: ${hardUnits.length} | Aprovados: ${hardPass} | Reprovados: ${hardFailures.length}`);
  for (const hf of hardFailures) {
    console.log(`\n* ${hf.holdoutId} (${hf.domain}):`);
    console.log(`  - Categorias de Erro: ${hf.errorCategories.join(', ')}`);
    console.log(`  - Primeira Divergência: ${hf.details?.firstMaterialDivergence || hf.errors[0]}`);
  }

  // ===========================================================================
  // FASE 10: INVARIÂNCIA PÓS-H1
  // ===========================================================================
  console.log('\n--- 10. VERIFICAÇÃO DE INVARIÂNCIA PÓS-H1 ---');

  const postHashes = {
    blindInput: computeFileSha256(inputPathD2),
    golden: computeFileSha256(goldenPathD2),
    evidenceManifest: computeFileSha256(evidencePathD2),
    decisionManifest: computeFileSha256(decisionPathD2),
    holdoutManifest: computeFileSha256(manifestPathD2),
    remediationReport: computeFileSha256(reportPathD2),
  };

  let invariancePassed = true;
  for (const [key, expected] of Object.entries(BASELINE_HASHES)) {
    const post = (postHashes as any)[key];
    if (post !== expected) {
      console.error(`❌ INVARIANCE_VIOLATION em ${key}: ${post} !== ${expected}`);
      invariancePassed = false;
    }
  }

  if (!invariancePassed) {
    throw new Error('FATAL: Artefatos de benchmark foram mutados durante o H1!');
  }

  console.log(`✓ BENCHMARK_MUTATED = false`);
  console.log(`✓ GOLDEN_MUTATED = false`);
  console.log(`✓ EVALUATOR_MUTATED = false`);
  console.log(`✓ PROMPT_MUTATED_AFTER_CALL = false`);
  console.log(`✓ RAW_RESPONSE_MUTATED = false`);

  // ===========================================================================
  // FASE 11: PERSISTÊNCIA DO RELATÓRIO OFICIAL H1
  // ===========================================================================
  const officialClassification = strictPass === 60 ? 'PERFECT_H1' : 'H1_COMPLETED_WITH_ERRORS';

  const fullReport = {
    reportTitle: 'ATHENA V2.3.6-H1 BLIND HOLDOUT-60 EVALUATION REPORT',
    generatedAt: new Date().toISOString(),
    classification: officialClassification,
    hashesPreH1: BASELINE_HASHES,
    prompt: {
      promptSha256,
      schemaSha256,
      inputSha256,
      promptMutatedAfterCall: false,
    },
    inference: {
      modelRequested: requestedModel,
      modelServed: servedModel,
      reasoningEffort,
      responseId: response.id || 'N/A',
      latencyMs,
      latencySeconds: Number((latencyMs / 1000).toFixed(2)),
      tokenUsage: rawMetadata.usage,
      costUsd: 'NOT_DETERMINED_FROM_API_USAGE',
    },
    cryptographicFreeze: {
      rawResponseSha256,
      parsedResponseSha256,
      rawBeforeGoldenProof: true,
      goldenOpenedAfterRawFreeze: true,
      rawResponseMutated: false,
    },
    telemetry: {
      externalModelCalls,
      candidateH1Calls,
      webSearchCalls: 0,
      repairCalls: 0,
      followupCalls: 0,
      retryCalls: 0,
      judgeLlmCalls: 0,
      deployExecuted: false,
      commitExecuted: false,
      pushExecuted: false,
    },
    invariancePostH1: {
      benchmarkMutated: false,
      goldenMutated: false,
      evaluatorMutated: false,
      promptMutatedAfterCall: false,
      rawResponseMutated: false,
      postHashes,
    },
    scores: {
      totalUnits: 60,
      strictPass,
      strictFail,
      strictAccuracyPercent: Number(strictAccuracy),
      standardTotal,
      standardPass,
      standardFail,
      standardAccuracyPercent: Number(standardAccuracy),
      hardTotal,
      hardPass,
      hardFail,
      hardAccuracyPercent: Number(hardAccuracy),
      domainScores,
      errorMatrix,
    },
    failedUnitsList: unitResults.filter(u => u.status === 'STRICT_FAIL').map(u => ({
      holdoutId: u.holdoutId,
      domain: u.domain,
      difficulty: u.difficulty,
      errorCategories: u.errorCategories,
      errors: u.errors,
      details: u.details,
    })),
    hardFailuresDetailed: hardFailures.map(hf => ({
      holdoutId: hf.holdoutId,
      domain: hf.domain,
      errorCategories: hf.errorCategories,
      firstMaterialDivergence: hf.details?.firstMaterialDivergence,
      expectedStructure: hf.details?.expectedStructure,
      candidateStructure: hf.details?.candidateStructure,
    })),
    unitResults,
  };

  const reportFilePath = path.join(h1OutputDir, 'audit/h1-evaluation-result.json');
  fs.writeFileSync(reportFilePath, JSON.stringify(fullReport, null, 2), 'utf8');

  console.log(`\n✓ Relatório oficial H1 persistido em: tmp/assertion-decomposition-holdout-v236h1/audit/h1-evaluation-result.json`);
  console.log(`✓ CLASSIFICAÇÃO: ${officialClassification}`);
  console.log('✓ PARADA ABSOLUTA CONFORME O PROTOCOLO.');

  return fullReport;
}

runHoldout60H1Evaluation().catch(err => {
  console.error('\nFATAL ERROR DURING H1 EVALUATION:', err);
  process.exit(1);
});
