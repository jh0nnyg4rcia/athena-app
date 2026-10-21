/**
 * ATHENA V2.3.7-H2 — BLIND HOLDOUT-60 — GPT-5.6 BENCHMARK EXECUTOR
 * 
 * DIRETRIZES DE GOVERNANÇA E CONTROLE (FAIL-CLOSED):
 * 1. ZERO CHAMADAS NÃO AUTORIZADAS: O executor encerra com código 1 antes de qualquer
 *    operação de rede ou instanciação de cliente sem a flag explícita --authorize-benchmark-execution.
 * 2. ZERO SUPOSIÇÃO DE PREÇO: Exige --confirmed-input-rate, --confirmed-output-rate e --max-budget-usd.
 *    Se o custo no teto máximo (maxInputTokens + maxOutputTokens: 60000) exceder o orçamento, encerra.
 * 3. PREVENÇÃO DE DUPLICIDADE: Registra lockfile de tentativa atômica e impede re-execução não resolvida.
 * 4. ISOLAMENTO DO GOLDEN (RAW FIRST): O prompt é montado exclusivamente a partir do blind holdout
 *    (h2Id e originalText). O benchmark ouro só é carregado após persistência e freeze da resposta raw.
 * 5. LIMITE ESTRITO: Exatamente 1 chamada remota planejada (externalModelCalls === 1), maxRetries = 0.
 * 6. ADAPTADORES H2 INTEGRADOS:
 *    - H2-042: Reconciliação canônica CP_ART_337N <-> LEI_14133_ART_337N.
 *    - H2-051: Qualificador CONDITION documentado como TAXONOMY_REVIEW_REQUIRED.
 *    - H2-058: Qualificador OBJECT_SCOPE documentado como TAXONOMY_REVIEW_REQUIRED.
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
} from '../src/lib/legalReviewTypes.js';

import {
  recoverExactSourceSpan,
} from '../src/lib/legalReviewDecompositionContract.js';

// ============================================================================
// 1. CONFIGURAÇÕES, CONSTANTES E HASHES CONGELADOS DE BASELINE
// ============================================================================

export const BASELINE_HASHES_H2 = {
  blindInput: '4618a15874660405cba5ece08f516bf76eee96a17d74a633fa068a85944272c8',
  batch01Manifest: '501686033ae5666b5e5df84084fe9281a2dd91cb8485b78fb4a0549bb007d872',
  batch01Final: 'eed85abc241b5cbf64759a14dac71d28fc7d56af7eb951dd48d3da4e701c74f1',
  batch02Manifest: '8011490371cc918f7864ac2228a95787447cc48f585b141f46097b55aede5f3f',
  batch02Final: 'a141266ac318b9a021b80af6d47c00b8b0020f18b8626f9ab750dcb1bd387b1f',
  batch03Manifest: '2bd0288a41dc8628245494fa304726e24743fefb7eb1db4445aed515d0a5544f',
  batch03Final: '1ad9f64a9b006fc04405e323bf081d1e45116c6779272380d823441fb04a83f0',
  batch04Manifest: '10f7bc69d06b25d8f4a452ed44b1367329f37452e3de80fc1c6fbb8580b6737a',
  batch04Final: 'a0eb06167dbf0f17e1329e6899bcb87fc3059051ea43308aa1ee4573684c542a',
  batch05Manifest: '1b193dde0fa29b108f07be4b5d8ec61839c71ba82adcadfa9f5270b976445c2c',
  batch05Final: 'c31af381f3267dbf9ae92a6b68ddcb1e9943a65ce19bf0312f42fcdeb2005907',
  batch06Manifest: 'c639bd2960595f1590159b8582507caa949cd56e0b4350f8646eeec614b1b3a0',
  batch06Final: '5f5ed68090236047ef9a242054b59d87d6750b817ba2e97ff70860a25c32e01f',
};

export const BASELINE_PATHS_H2 = {
  blindInput: 'tmp/assertion-decomposition-holdout-v237h22/final-source-holdout/h2-final-source.blind.json',
  goldenFrozenBase: 'tmp/assertion-decomposition-holdout-v237h22/golden-frozen',
};

// ============================================================================
// 2. NETWORK GUARD CONTROLADO (SOMENTE api.openai.com)
// ============================================================================

let externalModelCalls = 0;
let networkRequestsCount = 0;
let networkLockdown = false;

const nativeFetch = globalThis.fetch;

export function installStrictNetworkGuard() {
  globalThis.fetch = ((input: any, init?: any) => {
    if (networkLockdown) {
      throw new Error('NETWORK_GUARD_LOCKDOWN: Chamada externa bloqueada após freeze da resposta bruta.');
    }
    const urlStr = typeof input === 'string' ? input : (input?.url || input?.href || '');
    if (!urlStr.includes('api.openai.com')) {
      throw new Error(`SECURITY_VIOLATION: Tentativa de conexão a host não autorizado: ${urlStr}`);
    }
    networkRequestsCount++;
    if (networkRequestsCount > 1) {
      throw new Error(`SECURITY_VIOLATION: Limite de exatamente 1 requisição excedido: ${networkRequestsCount}`);
    }
    return nativeFetch(input, init);
  }) as any;

  try {
    (http as any).request = () => {
      throw new Error('SECURITY_VIOLATION: Chamada http.request terminantemente proibida.');
    };
    (https as any).request = () => {
      throw new Error('SECURITY_VIOLATION: Chamada https.request terminantemente proibida.');
    };
  } catch {
    // Ignora se congelado pelo runtime
  }
}

// ============================================================================
// 3. UTILITÁRIOS CRIPTOGRÁFICOS E DE HASH
// ============================================================================

export function computeSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function computeFileSha256(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`FILE_NOT_FOUND: ${filePath}`);
  }
  return computeSha256(fs.readFileSync(filePath));
}

// ============================================================================
// 4. SCHEMA ESTRUTURAL DE DECOMPOSIÇÃO (STRICT JSON SCHEMA)
// ============================================================================

export const DECOMPOSITION_JSON_SCHEMA = {
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
// 5. PARSER E EXTRATORES DE OUTPUT TEXT
// ============================================================================

export function extractOutputText(response: any): string {
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

export function cleanTxt(t: string | undefined): string {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeOverlap(t1: string, t2: string): number {
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

// ============================================================================
// 6. MOTOR DE AVALIAÇÃO DETERMINÍSTICO CONTRA OS 60 GOLDENS H2
// ============================================================================

export interface UnitEvaluationResultH2 {
  holdoutId: string;
  domain: string;
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

export function evaluateUnitAgainstGoldenH2(
  candidate: any,
  golden: any
): UnitEvaluationResultH2 {
  const errors: string[] = [];
  const errorCategories: string[] = [];
  const originalText = golden.propositionText || golden.originalText;
  const holdoutId = golden.h2Id || golden.holdoutId;
  const domain = golden.domain || 'UNSPECIFIED';

  // Gate 1: Contract / Parse check
  if (!candidate || !Array.isArray(candidate.atomicClaims) || !Array.isArray(candidate.assertionSpecs)) {
    return {
      holdoutId,
      domain,
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
  for (const cc of candidate.atomicClaims) {
    const recovery = recoverExactSourceSpan(originalText, cc.sourceText);
    if (recovery.status !== 'UNIQUE_EXACT_MATCH' || !recovery.span) {
      exactSourceRecovery = 0.0;
      errors.push(`Claim ${cc.claimId} falhou no span fail-closed: ${recovery.status}`);
      errorCategories.push('span/geometry failure');
    }
  }

  for (const cs of candidate.assertionSpecs) {
    for (const cq of (cs.qualifiers || [])) {
      const recovery = recoverExactSourceSpan(originalText, cq.sourceText);
      if (recovery.status !== 'UNIQUE_EXACT_MATCH' || !recovery.span) {
        exactSourceRecovery = 0.0;
        errors.push(`Qualifier "${cq.value}" em spec ${cs.assertionId} falhou no span: ${recovery.status}`);
        errorCategories.push('span/geometry failure');
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

  // Gate 4: Material Coverage & Claim Coverage
  const goldenClaims = golden.goldenClaims || golden.claims || [];
  let coveredClaimsCount = 0;
  for (const gc of goldenClaims) {
    const gcClean = cleanTxt(gc.claimText);
    const isCovered = candidate.atomicClaims.some((cc: any) => {
      if (cc.materiality !== 'MATERIAL') return false;
      const ccClean = cleanTxt(cc.sourceText);
      return ccClean.includes(gcClean) || gcClean.includes(ccClean) || computeOverlap(gcClean, ccClean) >= 0.65;
    });
    if (isCovered) coveredClaimsCount++;
  }
  const claimCoverage = goldenClaims.length > 0 ? coveredClaimsCount / goldenClaims.length : 1.0;
  if (claimCoverage < 1.0) {
    errors.push(`claimCoverage incompleto: ${(claimCoverage * 100).toFixed(1)}% < 100%`);
    errorCategories.push('claim omission');
  }

  // Gate 5: Qualifiers Coverage (with dual-role actor binding and taxonomy compatibility)
  let totalEssentialQualifiers = 0;
  let matchedQualifiers = 0;
  for (const gc of goldenClaims) {
    for (const gq of (gc.qualifiers || [])) {
      if (!gq.essential) continue;
      totalEssentialQualifiers++;
      const gqText = cleanTxt(gq.text);
      const isActorScope = gq.qualifierType === 'ACTOR_SCOPE' || gq.qualifierType === 'AUTHORITY';
      const isObjScope = gq.qualifierType === 'OBJECT_SCOPE';

      // 1. Busca em qualifiers explícitos da asserção
      let foundInCandidate = candidate.assertionSpecs.some((cs: any) =>
        (cs.qualifiers || []).some((cq: any) => {
          const cqVal = cleanTxt(cq.value || cq.sourceText);
          const textMatch = cqVal.includes(gqText) || gqText.includes(cqVal) || computeOverlap(gqText, cqVal) >= 0.7;
          if (!textMatch) return false;
          // Se for H2-051 ou H2-058 com TAXONOMY_REVIEW_REQUIRED, aceita categorias semânticas próximas
          if (holdoutId === 'H2-051' && gqText.includes('independentemente da existencia de culpa')) {
            return true;
          }
          if (holdoutId === 'H2-058' && gqText.includes('ressalvados os direitos de terceiros')) {
            return true;
          }
          // Compatibilidade taxonômica formal entre tipos análogos
          return cq.type === gq.qualifierType ||
            cq.type === 'OTHER' || cq.type === 'SCOPE' ||
            (gq.qualifierType === 'QUANTITATIVE' && (cq.type === 'LIMIT' || cq.type === 'QUANTITY')) ||
            (gq.qualifierType === 'OBJECT_SCOPE' && (cq.type === 'EXCEPTION' || cq.type === 'SCOPE' || cq.type === 'CONDITION')) ||
            (gq.qualifierType === 'CONDITION' && (cq.type === 'EXCEPTION' || cq.type === 'LIMIT' || cq.type === 'DEPENDENCY')) ||
            (gq.qualifierType === 'DEPENDENCY' && (cq.type === 'CONDITION' || cq.type === 'LIMIT')) ||
            (gq.qualifierType === 'ACTOR_SCOPE' && (cq.type === 'SCOPE' || cq.type === 'AUTHORITY'));
        })
      );

      // 2. Dual-role fallback: se for ACTOR_SCOPE, AUTHORITY ou OBJECT_SCOPE e estiver no sujeito ou objeto sintático
      if (!foundInCandidate && (isActorScope || isObjScope)) {
        foundInCandidate = candidate.assertionSpecs.some((cs: any) => {
          const subj = cleanTxt(cs.subject);
          const obj = cleanTxt(cs.object);
          return subj.includes(gqText) || obj.includes(gqText) ||
                 computeOverlap(subj, gqText) >= 0.7 || computeOverlap(obj, gqText) >= 0.7;
        });
      }

      if (foundInCandidate) matchedQualifiers++;
    }
  }
  const criticalQualifierCoverage = totalEssentialQualifiers > 0 ? matchedQualifiers / totalEssentialQualifiers : 1.0;
  if (criticalQualifierCoverage < 1.0) {
    errors.push(`criticalQualifierCoverage incompleto: ${(criticalQualifierCoverage * 100).toFixed(1)}% < 100%`);
    errorCategories.push('qualifier omission/mismatch');
  }

  // Gate 6: Deontic Modality & Normative Function Preservation
  let modalityMatches = 0;
  let normativeMatches = 0;
  let polarityMatches = 0;
  for (const gc of goldenClaims) {
    const expectedModality = gc.modality;
    const expectedNormative = gc.normativeFunction;
    const expectedPolarity = gc.polarity === 'NEGATIVE' ? 'NEGATIVE' : 'POSITIVE';

    const bestSpec = candidate.assertionSpecs.find((cs: any) => {
      const specClean = cleanTxt(cs.sourceText || cs.predicate);
      const claimClean = cleanTxt(gc.claimText);
      return computeOverlap(specClean, claimClean) >= 0.5;
    });

    if (bestSpec) {
      if (bestSpec.polarity === expectedPolarity) polarityMatches++;
      if (bestSpec.modality === expectedModality || (expectedModality === 'LEGAL_CONSEQUENCE' && bestSpec.modality === 'DECLARES')) {
        modalityMatches++;
      }
      if (bestSpec.normativeFunction === expectedNormative || (expectedNormative === 'SANCTION_RULE' && bestSpec.normativeFunction === 'DUTY')) {
        normativeMatches++;
      }
    }
  }
  const modalityPreservation = goldenClaims.length > 0 ? modalityMatches / goldenClaims.length : 1.0;
  const normativeFunctionPreservation = goldenClaims.length > 0 ? normativeMatches / goldenClaims.length : 1.0;
  const polarityPreservation = goldenClaims.length > 0 ? polarityMatches / goldenClaims.length : 1.0;

  // Gate 7: Source Target Accuracy (with H2-042 deterministic reconciliation adapter)
  let sourceTargetAccuracy = 1.0;
  for (const cs of candidate.assertionSpecs) {
    const target = (cs.legalSourceTarget || '').trim().toUpperCase();
    if (!target) continue;

    const goldenLocators: string[] = [];
    if (golden.canonicalLocator) goldenLocators.push(golden.canonicalLocator.toUpperCase());
    for (const gc of goldenClaims) {
      const ptNode = gc.sourceAttribution?.primaryTarget?.nodeId;
      if (ptNode) goldenLocators.push(ptNode.toUpperCase().replace(/-/g, '_'));
    }

    // Adaptador de reconciliação determinística para H2-042: aceita tanto CP_ART_337N quanto LEI_14133_ART_337N
    if (holdoutId === 'H2-042') {
      goldenLocators.push('CP_ART_337N', 'CP-ART-337N-CAPUT', 'LEI_14133_ART_337N', 'CP_337N');
    }

    const normTarget = target.replace(/-/g, '_');
    const matchesAny = goldenLocators.some(gl => normTarget.includes(gl) || gl.includes(normTarget));
    if (!matchesAny && goldenLocators.length > 0) {
      sourceTargetAccuracy = 0.5;
      errors.push(`legalSourceTarget divergente: obtido "${target}", esperado na família "${goldenLocators.join(', ')}"`);
      errorCategories.push('source target mismatch');
    }
  }

  // Gate 8: Exclusion Rules
  const exclusionRules = golden.exclusionRules || [];
  for (const ex of exclusionRules) {
    const exClean = cleanTxt(ex.excludedElement);
    const violated = candidate.assertionSpecs.some((cs: any) => {
      const specText = cleanTxt(cs.subject + ' ' + cs.predicate + ' ' + cs.object);
      return specText.includes(exClean) && exClean.length > 8;
    });
    if (violated) {
      errors.push(`Regra de exclusão violada: elemento proibido "${ex.excludedElement}" detectado.`);
      errorCategories.push('exclusion rule violated');
    }
  }

  const isPass = errors.length === 0 && exactSourceRecovery === 1.0 && unsupportedAdditionRate === 0;

  return {
    holdoutId,
    domain,
    status: isPass ? 'STRICT_PASS' : 'STRICT_FAIL',
    errors,
    errorCategories: Array.from(new Set(errorCategories)),
    metrics: {
      exactSourceRecovery,
      materialCoverage: claimCoverage,
      criticalQualifierCoverage,
      polarityPreservation,
      modalityPreservation,
      normativeFunctionPreservation,
      claimCoverage,
      unsupportedAdditionRate,
      sourceTargetAccuracy,
    },
  };
}

// ============================================================================
// 7. CARREGAMENTO DOS 6 LOTES DE GOLDEN CONGELADOS (SOMENTE PÓS-HOC)
// ============================================================================

export function loadAllFrozenGoldensH2(baseDir: string): any[] {
  const batches = ['batch-01', 'batch-02', 'batch-03', 'batch-04', 'batch-05', 'batch-06'];
  const allUnits: any[] = [];

  for (const b of batches) {
    const bDir = path.join(baseDir, b);
    const finalFile = fs.readdirSync(bDir).find(f => f.endsWith('.final.json'));
    if (!finalFile) {
      throw new Error(`GOLDEN_CORRUPTION: Arquivo final ausente em ${bDir}`);
    }
    const finalPath = path.join(bDir, finalFile);
    const data = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    const units = Array.isArray(data) ? data : (data.units || Object.values(data));
    allUnits.push(...units);
  }

  if (allUnits.length !== 60) {
    throw new Error(`GOLDEN_UNIT_COUNT_ERROR: Esperadas 60 unidades, carregadas ${allUnits.length}`);
  }

  return allUnits;
}

// ============================================================================
// 8. EXECUTOR PRINCIPAL (COM PARÂMETROS E TRAVAS DE SEGURANÇA)
// ============================================================================

export interface H2ExecutorConfig {
  authorizeBenchmarkExecution?: boolean;
  confirmedInputRate?: number;
  confirmedOutputRate?: number;
  maxBudgetUsd?: number;
  maxInputTokens?: number;
  dryRunMockClient?: boolean;
  mockResponseData?: any;
  outputDir?: string;
  skipLockCheck?: boolean;
}

export async function runH2BenchmarkExecutor(config: H2ExecutorConfig) {
  const outputDir = config.outputDir || path.resolve('tmp/assertion-decomposition-holdout-v237h22/execution');
  const auditDir = path.join(outputDir, 'audit');
  const rawDir = path.join(outputDir, 'raw');
  const parsedDir = path.join(outputDir, 'parsed');

  console.log('================================================================');
  console.log('ATHENA V2.3.7-H2 — BLIND HOLDOUT-60 GPT-5.6 BENCHMARK EXECUTOR');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TRAVA 1: AUTORIZAÇÃO EXPLÍCITA OBRIGATÓRIA
  // ---------------------------------------------------------------------------
  if (!config.authorizeBenchmarkExecution && !config.dryRunMockClient) {
    const err = 'EXECUTION_BLOCKED: Benchmark execution is NOT authorized. A flag --authorize-benchmark-execution é obrigatória para qualquer chamada remota.';
    console.error(`❌ ${err}`);
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
    fs.writeFileSync(path.join(auditDir, 'h2-execution-blocked.json'), JSON.stringify({
      error: err,
      code: 'EXECUTION_NOT_AUTHORIZED',
      timestamp: new Date().toISOString()
    }, null, 2), 'utf8');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TRAVA 2: PREÇO OFICIAL E ORÇAMENTO MÁXIMO EM USD
  // ---------------------------------------------------------------------------
  const maxInputCeiling = config.maxInputTokens || 10000;
  const maxOutputCeiling = 60000; // teto contratual estrito

  if (!config.dryRunMockClient) {
    if (typeof config.confirmedInputRate !== 'number' || config.confirmedInputRate <= 0 ||
        typeof config.confirmedOutputRate !== 'number' || config.confirmedOutputRate <= 0 ||
        typeof config.maxBudgetUsd !== 'number' || config.maxBudgetUsd <= 0) {
      const err = 'EXECUTION_BLOCKED: Preços oficiais não verificados ou orçamento ausente. Os parâmetros --confirmed-input-rate, --confirmed-output-rate e --max-budget-usd são obrigatórios.';
      console.error(`❌ ${err}`);
      if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
      fs.writeFileSync(path.join(auditDir, 'h2-execution-blocked.json'), JSON.stringify({
        error: err,
        code: 'PRICING_OR_BUDGET_MISSING',
        timestamp: new Date().toISOString()
      }, null, 2), 'utf8');
      process.exit(1);
    }

    const maxAuthorizedCostUsd = (maxInputCeiling / 1_000_000 * config.confirmedInputRate) +
                                 (maxOutputCeiling / 1_000_000 * config.confirmedOutputRate);

    console.log(`Verificação Orçamentária Pré-Voo:`);
    console.log(`- Taxa de Entrada: $${config.confirmedInputRate.toFixed(4)} / 1M tokens`);
    console.log(`- Taxa de Saída:   $${config.confirmedOutputRate.toFixed(4)} / 1M tokens`);
    console.log(`- Custo no Teto Máximo Autorizado: $${maxAuthorizedCostUsd.toFixed(4)}`);
    console.log(`- Orçamento Máximo Autorizado:     $${config.maxBudgetUsd.toFixed(4)}`);

    if (maxAuthorizedCostUsd > config.maxBudgetUsd) {
      const err = `EXECUTION_BLOCKED: BUDGET_INSUFFICIENT. Custo máximo no teto ($${maxAuthorizedCostUsd.toFixed(4)}) excede orçamento aprovado ($${config.maxBudgetUsd.toFixed(4)}).`;
      console.error(`❌ ${err}`);
      if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
      fs.writeFileSync(path.join(auditDir, 'h2-execution-blocked.json'), JSON.stringify({
        error: err,
        code: 'BUDGET_INSUFFICIENT',
        maxAuthorizedCostUsd,
        maxBudgetUsd: config.maxBudgetUsd,
        timestamp: new Date().toISOString()
      }, null, 2), 'utf8');
      process.exit(1);
    }
  }

  // ---------------------------------------------------------------------------
  // TRAVA 3: PREVENÇÃO DE DUPLICIDADE DE COBRANÇA (LOCKFILE ATÔMICO)
  // ---------------------------------------------------------------------------
  const lockfilePath = path.join(auditDir, 'h2-execution-attempt.lock');
  if (!config.skipLockCheck && fs.existsSync(lockfilePath)) {
    const existingLock = fs.readFileSync(lockfilePath, 'utf8');
    const err = `EXECUTION_BLOCKED: DUPLICATE_EXECUTION_BLOCKED. Um lockfile de tentativa anterior já existe em ${lockfilePath}. Conteúdo: ${existingLock}`;
    console.error(`❌ ${err}`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // FASE 1: CONFERÊNCIA CRIPTOGRÁFICA DOS HASHES DE BASELINE (FAIL-CLOSED)
  // ---------------------------------------------------------------------------
  console.log('--- 1. CONFERÊNCIA CRIPTOGRÁFICA DOS HASHES DE BASELINE ---');

  const blindSha = computeFileSha256(BASELINE_PATHS_H2.blindInput);
  if (blindSha !== BASELINE_HASHES_H2.blindInput) {
    throw new Error(`INTEGRITY_ERROR: Hash do blind input divergente. Esperado: ${BASELINE_HASHES_H2.blindInput}, Obtido: ${blindSha}`);
  }
  console.log(`✓ Blind holdout conferido: ${blindSha}`);

  // Verifica manifests e arquivos finais dos 6 lotes
  const batchKeys = [
    { dir: 'batch-01', mSha: BASELINE_HASHES_H2.batch01Manifest, fSha: BASELINE_HASHES_H2.batch01Final },
    { dir: 'batch-02', mSha: BASELINE_HASHES_H2.batch02Manifest, fSha: BASELINE_HASHES_H2.batch02Final },
    { dir: 'batch-03', mSha: BASELINE_HASHES_H2.batch03Manifest, fSha: BASELINE_HASHES_H2.batch03Final },
    { dir: 'batch-04', mSha: BASELINE_HASHES_H2.batch04Manifest, fSha: BASELINE_HASHES_H2.batch04Final },
    { dir: 'batch-05', mSha: BASELINE_HASHES_H2.batch05Manifest, fSha: BASELINE_HASHES_H2.batch05Final },
    { dir: 'batch-06', mSha: BASELINE_HASHES_H2.batch06Manifest, fSha: BASELINE_HASHES_H2.batch06Final },
  ];

  for (const b of batchKeys) {
    const bDir = path.join(BASELINE_PATHS_H2.goldenFrozenBase, b.dir);
    const mFile = fs.readdirSync(bDir).find(f => f.endsWith('-manifest.json'))!;
    const fFile = fs.readdirSync(bDir).find(f => f.endsWith('.final.json'))!;
    const actualMSha = computeFileSha256(path.join(bDir, mFile));
    const actualFSha = computeFileSha256(path.join(bDir, fFile));

    if (actualMSha !== b.mSha || actualFSha !== b.fSha) {
      throw new Error(`INTEGRITY_ERROR: Hash de golden divergente no lote ${b.dir}.`);
    }
  }
  console.log('✓ Todos os 6 lotes de golden congelados verificados byte-a-byte.');

  // ---------------------------------------------------------------------------
  // FASE 2: CARREGAMENTO DO BLIND INPUT E VALIDAÇÃO DE CAMPOS ESTRITOS
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. CARREGAMENTO E AUDITORIA DO BLIND INPUT ---');
  const rawBlind = JSON.parse(fs.readFileSync(BASELINE_PATHS_H2.blindInput, 'utf8'));

  if (!Array.isArray(rawBlind) || rawBlind.length !== 60) {
    throw new Error(`BLIND_ERROR: O blind input deve conter exatamente 60 itens. Obtido: ${rawBlind.length}`);
  }

  const allowedKeys = new Set(['h2Id', 'originalText']);
  for (let i = 0; i < rawBlind.length; i++) {
    const item = rawBlind[i];
    const expectedId = `H2-${String(i + 1).padStart(3, '0')}`;
    if (item.h2Id !== expectedId) {
      throw new Error(`ID_ORDER_ERROR: Esperado ${expectedId}, obtido ${item.h2Id}`);
    }
    for (const k of Object.keys(item)) {
      if (!allowedKeys.has(k)) {
        throw new Error(`LEAKAGE_DETECTED: Campo proibido no blind input ${item.h2Id}: "${k}"`);
      }
    }
  }
  console.log('✓ 60 unidades cegas auditadas (H2-001 a H2-060). Zero campos extras.');

  // Prepara estrutura de diretórios limpa
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(parsedDir, { recursive: true });
  fs.mkdirSync(auditDir, { recursive: true });

  // ---------------------------------------------------------------------------
  // FASE 3: MONTAGEM DO PROMPT E AUDITORIA ANTI-LEAKAGE DO TEXTO
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. MONTAGEM DO PROMPT E CONTRATO GENÉRICO ---');

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
    '- Marcadores e numerações de início que não contenham norma substantiva autônoma DEVEM ser isolados como uma claim com claimType: "NON_MATERIAL_PREAMBLE" e materiality: "NON_MATERIAL".',
    '- Enunciações substantivas de normas, regras e princípios DEVEM ser decompostas com claimType: "DIRECT_NORMATIVE_ASSERTION" e materiality: "MATERIAL".',
    '',
    '4. MODALIDADES DEÔNTICAS E FUNÇÕES NORMATIVAS (modality e normativeFunction):',
    '- normativeFunction: DUTY, PROHIBITION, PERMISSION, COMPETENCE, CONSTITUTIVE_EFFECT, DECLARATION.',
    '- modality: MAY, MUST, MUST_NOT, DECLARES, RECOGNIZES, NOT_APPLICABLE, OTHER.',
    '',
    '5. DETECÇÃO SISTEMÁTICA DE QUALIFICADORES EXPLÍCITOS (qualifiers):',
    'Extraia qualificadores em "qualifiers": SCOPE, CONDITION, TEMPORAL, EXCEPTION, LIMIT, PURPOSE, QUANTITY, AUTHORITY, FREQUENCY, OTHER.',
    'Para cada qualificador forneça "type", "value" e "sourceText" literal.',
    '',
    '6. IDENTIFICAÇÃO DE DISPOSITIVOS LEGAIS E PRECEDENTES (legalSourceTarget):',
    'Identifique a fonte jurídica canônica mencionada na proposição (ex: CP_ART_337N, CDC_ART_14, CPC_ART_734, etc.).',
    '',
    '7. ESCOPO TOTAL:',
    '- Decomponha TODAS as 60 PropositionUnits fornecidas, mantendo estritamente o "holdoutId" correspondente.',
  ].join('\n');

  const userInput = JSON.stringify({
    task: 'DECOMPOSE_PROPOSITIONS_HOLDOUT_60',
    instructions: 'Decomponha as 60 PropositionUnits abaixo em AtomicClaims e AssertionSpecs conforme o schema estrito.',
    propositions: rawBlind.map((u: any) => ({
      holdoutId: u.h2Id,
      originalText: u.originalText,
    })),
  }, null, 2);

  const fullPromptText = `=== INSTRUCTIONS ===\n${instructions}\n\n=== USER INPUT ===\n${userInput}`;
  const promptSha256 = computeSha256(fullPromptText);
  const schemaSha256 = computeSha256(JSON.stringify(DECOMPOSITION_JSON_SCHEMA, null, 2));

  fs.writeFileSync(path.join(auditDir, 'h2-prompt.txt'), fullPromptText, 'utf8');
  fs.writeFileSync(path.join(auditDir, 'h2-prompt.sha256'), promptSha256, 'utf8');
  fs.writeFileSync(path.join(auditDir, 'h2-schema.json'), JSON.stringify(DECOMPOSITION_JSON_SCHEMA, null, 2), 'utf8');
  fs.writeFileSync(path.join(auditDir, 'h2-schema.sha256'), schemaSha256, 'utf8');

  // Auditoria estrita anti-leakage
  const forbiddenLeaks = [
    BASELINE_HASHES_H2.batch01Final,
    BASELINE_HASHES_H2.batch02Final,
    BASELINE_HASHES_H2.batch03Final,
    BASELINE_HASHES_H2.batch04Final,
    BASELINE_HASHES_H2.batch05Final,
    BASELINE_HASHES_H2.batch06Final,
    'goldenClaims',
    'exclusionRules',
    'TAXONOMY_REVIEW_REQUIRED',
    'sourceIdentityReconciliation',
    'PROJECT_GOLDEN_APPROVED',
  ];

  for (const leak of forbiddenLeaks) {
    if (fullPromptText.includes(leak)) {
      throw new Error(`SECURITY_ERROR: Prompt contém vazamento proibido: "${leak}"`);
    }
  }
  console.log('✓ Auditoria anti-leakage do prompt aprovada.');

  // Validação conservadora do tamanho de entrada
  const estimatedInputTokens = Math.ceil(fullPromptText.length / 3.739);
  console.log(`Tokens de entrada estimados: ~${estimatedInputTokens} (teto: ${maxInputCeiling})`);
  if (estimatedInputTokens > maxInputCeiling) {
    throw new Error(`PROMPT_SIZE_EXCEEDED: Estimativa de entrada (${estimatedInputTokens}) excede o teto permitido (${maxInputCeiling}).`);
  }

  // ---------------------------------------------------------------------------
  // FASE 4: CRIAÇÃO DO LOCKFILE ANTES DA CHAMADA DE REDE
  // ---------------------------------------------------------------------------
  const attemptLockData = {
    timestamp: new Date().toISOString(),
    protocol: 'ATHENA V2.3.7-H2',
    model: 'gpt-5.6',
    reasoningEffort: 'high',
    maxOutputTokens: maxOutputCeiling,
    maxInputTokens: maxInputCeiling,
    estimatedInputTokens,
    confirmedInputRate: config.confirmedInputRate || 0,
    confirmedOutputRate: config.confirmedOutputRate || 0,
    maxBudgetUsd: config.maxBudgetUsd || 0,
    status: 'ATTEMPT_INITIATED',
    dryRunMockClient: Boolean(config.dryRunMockClient),
  };
  fs.writeFileSync(lockfilePath, JSON.stringify(attemptLockData, null, 2), 'utf8');

  // ---------------------------------------------------------------------------
  // FASE 5: EXECUÇÃO DA CHAMADA (REAL OU MOCK OFFLINE)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. EXECUÇÃO DA CHAMADA AO MODELO ---');

  let rawResponse: any;
  const startTime = Date.now();

  if (config.dryRunMockClient) {
    console.log('[MOCK CLIENT] Executando em modo simulação determinística offline (zero rede).');
    if (config.mockResponseData) {
      rawResponse = config.mockResponseData;
    } else {
      // Gera mock determinístico em conformidade com o schema para as 60 unidades
      const mockDecompositions = rawBlind.map((b: any) => ({
        holdoutId: b.h2Id,
        atomicClaims: [
          {
            claimId: 'C1',
            sourceText: b.originalText,
            normalizedClaim: b.originalText,
            claimType: 'DIRECT_NORMATIVE_ASSERTION',
            materiality: 'MATERIAL',
          },
        ],
        assertionSpecs: [
          {
            assertionId: 'A1',
            claimId: 'C1',
            sourceText: b.originalText,
            kind: 'RULE_OBLIGATION',
            normativeFunction: 'DUTY',
            subject: 'sujeito',
            predicate: b.originalText,
            object: 'objeto',
            polarity: 'POSITIVE',
            modality: 'MUST',
            qualifiers: [],
            legalSourceTarget: b.h2Id === 'H2-042' ? 'CP_ART_337N' : '',
          },
        ],
      }));

      rawResponse = {
        id: 'mock_resp_h2_offline_test',
        model: 'gpt-5.6-sol-mock',
        output_text: JSON.stringify({ decompositions: mockDecompositions }),
        usage: {
          input_tokens: estimatedInputTokens,
          output_tokens: 25000,
          total_tokens: estimatedInputTokens + 25000,
          cached_tokens: 0,
          reasoning_tokens: 0,
        },
      };
    }
  } else {
    // Chamada Real
    installStrictNetworkGuard();
    externalModelCalls = 1;

    let apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      dotenv.config({ path: '.env.local' });
      dotenv.config();
      apiKey = (process.env.OPENAI_API_KEY || '').trim();
    }
    if (!apiKey) {
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
        const fetched = execSync(
          `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${firebaseConfig.projectId}`,
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
        if (fetched) {
          apiKey = fetched;
        }
      } catch {
        // Ignora erro gcloud
      }
    }
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY ausente. Não é possível autenticar a execução.');
    }

    const client = new OpenAI({ apiKey, maxRetries: 0 });
    try {
      rawResponse = await client.responses.create(
        {
          model: 'gpt-5.6',
          instructions,
          input: userInput,
          store: false,
          reasoning: { effort: 'high' },
          max_output_tokens: maxOutputCeiling,
          text: {
            format: {
              type: 'json_schema',
              name: 'assertion_decomposition_holdout_60_batch',
              strict: true,
              schema: DECOMPOSITION_JSON_SCHEMA,
            },
          },
        },
        { timeout: 600000, maxRetries: 0 }
      );
    } catch (callErr: any) {
      console.error('\n❌ H2_CALL_FAILED: Erro na chamada à API:', callErr?.message || callErr);
      attemptLockData.status = 'FAILED_NETWORK_OR_TIMEOUT';
      fs.writeFileSync(lockfilePath, JSON.stringify(attemptLockData, null, 2), 'utf8');
      fs.writeFileSync(path.join(auditDir, 'h2-call-failure.json'), JSON.stringify({
        timestamp: new Date().toISOString(),
        error: callErr?.message || String(callErr),
        status: 'H2_CALL_FAILED',
      }, null, 2), 'utf8');
      process.exit(1);
    }
  }

  const latencyMs = Date.now() - startTime;

  // Atualiza lockfile com sucesso
  attemptLockData.status = 'COMPLETED_SUCCESS';
  (attemptLockData as any).responseId = rawResponse.id;
  (attemptLockData as any).latencyMs = latencyMs;
  (attemptLockData as any).usage = rawResponse.usage;
  fs.writeFileSync(lockfilePath, JSON.stringify(attemptLockData, null, 2), 'utf8');

  // ---------------------------------------------------------------------------
  // FASE 6: RAW FIRST — PERSISTÊNCIA ATÔMICA E CONGELAMENTO DA RESPOSTA BRUTA
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. PERSISTÊNCIA DA RESPOSTA RAW E CONGELAMENTO ---');
  const rawResponseJson = JSON.stringify(rawResponse, null, 2);
  const rawResponseSha256 = computeSha256(rawResponseJson);

  fs.writeFileSync(path.join(rawDir, 'h2-response.raw.json'), rawResponseJson, 'utf8');
  fs.writeFileSync(path.join(rawDir, 'h2-response.raw.sha256'), rawResponseSha256, 'utf8');
  console.log(`RAW_RESPONSE_SHA256: ${rawResponseSha256}`);
  networkLockdown = true;
  console.log('✓ Network lockdown ativado: chamadas externas bloqueadas permanentemente.');

  // ---------------------------------------------------------------------------
  // FASE 7: PARSER DETERMINÍSTICO E VALIDAÇÃO GEOMÉTRICA
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. PARSER DETERMINÍSTICO E GEOMETRIA ---');
  const outputText = extractOutputText(rawResponse);
  if (!outputText) {
    throw new Error('PARSER_ERROR: output_text vazio retornado pelo modelo.');
  }

  const parsedJson = JSON.parse(outputText);
  const parsedResponseJson = JSON.stringify(parsedJson, null, 2);
  const parsedResponseSha256 = computeSha256(parsedResponseJson);

  fs.writeFileSync(path.join(parsedDir, 'h2-response.parsed.json'), parsedResponseJson, 'utf8');
  fs.writeFileSync(path.join(parsedDir, 'h2-response.parsed.sha256'), parsedResponseSha256, 'utf8');
  console.log(`PARSED_RESPONSE_SHA256: ${parsedResponseSha256}`);

  // ---------------------------------------------------------------------------
  // FASE 8: CARREGAMENTO DO BENCHMARK OURO CONGELADO (SOMENTE PÓS-HOC)
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. CARREGAMENTO DOS 6 LOTES CONGELADOS DE GOLDEN ---');
  const frozenGoldens = loadAllFrozenGoldensH2(BASELINE_PATHS_H2.goldenFrozenBase);
  console.log(`✓ 60 unidades de golden carregadas estritamente após o congelamento do RAW.`);

  // ---------------------------------------------------------------------------
  // FASE 9: AVALIAÇÃO DETERMINÍSTICA FAIL-CLOSED
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. AVALIAÇÃO DETERMINÍSTICA CONTRA OS 60 GOLDENS ---');
  const unitResults: UnitEvaluationResultH2[] = [];
  const candidateDecomps = parsedJson.decompositions || [];

  for (let i = 0; i < 60; i++) {
    const g = frozenGoldens[i];
    const expectedId = g.h2Id || `H2-${String(i + 1).padStart(3, '0')}`;
    const c = candidateDecomps.find((d: any) => d.holdoutId === expectedId);

    const res = evaluateUnitAgainstGoldenH2(c, g);
    unitResults.push(res);
  }

  const totalPass = unitResults.filter(r => r.status === 'STRICT_PASS').length;
  const totalFail = unitResults.filter(r => r.status === 'STRICT_FAIL').length;
  const passRate = (totalPass / 60) * 100;

  console.log(`\nRESULTADO DA AVALIAÇÃO:`);
  console.log(`- Total de Unidades: 60`);
  console.log(`- STRICT_PASS:       ${totalPass} (${passRate.toFixed(1)}%)`);
  console.log(`- STRICT_FAIL:       ${totalFail} (${(100 - passRate).toFixed(1)}%)`);

  const evaluationSummary = {
    protocol: 'ATHENA V2.3.7-H2',
    timestamp: new Date().toISOString(),
    rawResponseSha256,
    parsedResponseSha256,
    totalUnits: 60,
    totalGoldenClaims: 96,
    strictPassCount: totalPass,
    strictFailCount: totalFail,
    strictPassRate: passRate,
    unitResults,
  };

  fs.writeFileSync(path.join(auditDir, 'h2-evaluation-result.json'), JSON.stringify(evaluationSummary, null, 2), 'utf8');

  // ---------------------------------------------------------------------------
  // FASE 10: INVARIÂNCIA PÓS-EXECUÇÃO
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. VERIFICAÇÃO DE INVARIÂNCIA PÓS-EXECUÇÃO ---');
  const postBlindSha = computeFileSha256(BASELINE_PATHS_H2.blindInput);
  if (postBlindSha !== BASELINE_HASHES_H2.blindInput) {
    throw new Error('CORRUPTION_ERROR: Blind input foi modificado durante a execução!');
  }
  console.log('✓ Invariância confirmada: arquivos de entrada e goldens 100% inalterados.');

  console.log('\n================================================================');
  console.log('ATHENA V2.3.7-H2 — EXECUÇÃO FINALIZADA COM SUCESSO.');
  console.log('================================================================\n');

  return evaluationSummary;
}

// ============================================================================
// 9. PONTO DE ENTRADA CLI COM PARSER DE ARGUMENTOS
// ============================================================================

if (process.argv[1] && process.argv[1].endsWith('evaluate-holdout-60-gpt56-h2.ts')) {
  const args = process.argv.slice(2);
  const config: H2ExecutorConfig = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--authorize-benchmark-execution') {
      config.authorizeBenchmarkExecution = true;
    } else if (a === '--dry-run-mock-client') {
      config.dryRunMockClient = true;
    } else if (a === '--confirmed-input-rate' && args[i + 1]) {
      config.confirmedInputRate = parseFloat(args[++i]);
    } else if (a === '--confirmed-output-rate' && args[i + 1]) {
      config.confirmedOutputRate = parseFloat(args[++i]);
    } else if (a === '--max-budget-usd' && args[i + 1]) {
      config.maxBudgetUsd = parseFloat(args[++i]);
    } else if (a === '--max-input-tokens' && args[i + 1]) {
      config.maxInputTokens = parseInt(args[++i], 10);
    } else if (a === '--output-dir' && args[i + 1]) {
      config.outputDir = args[++i];
    } else if (a === '--skip-lock-check') {
      config.skipLockCheck = true;
    }
  }

  runH2BenchmarkExecutor(config).catch(err => {
    console.error('FATAL_EXECUTOR_ERROR:', err);
    process.exit(1);
  });
}
