/**
 * ATHENA V2.3.4-B.1 — BENCHMARK GATE HARDENING
 * 
 * Suíte de Verificação e Métricas Offline do Benchmark Ouro de Decomposição de Proposições.
 * 
 * REGRAS DE HARDENING (V2.3.4-B.1):
 * 1. ZERO SCORE COMPENSATÓRIO: A aprovação não utiliza ponderação ou média de notas.
 * 2. HARD GATES INDEPENDENTES: A decomposição é aceita se e somente se TODAS as dimensões críticas forem 100%.
 * 3. MODALIDADE CRÍTICA: criticalModalityAccuracy === 1.0 (zero tolerância para trocas entre MAY, MUST, MUST_NOT, DECLARES, RECOGNIZES).
 * 4. TOKENS MATERIAIS CRÍTICOS: criticalMaterialTokenRecall === 1.0 obrigatório.
 * 5. QUALIFICADORES CRÍTICOS: type correto, value correto e sourceSpan válido no texto original.
 * 6. FIDELIDADE DE FONTE: legalSourceTargetAccuracy === 1.0 explícito.
 * 7. EXACT STRUCTURAL MATCH: conjunção booleana estrita dos hard gates.
 * 8. INDEPENDÊNCIA DE ID E ORDEM: matching estrutural baseado em spans e relações, não em labels/IDs técnicos.
 * 9. ZERO REDE / ZERO LLM / DETERMINISMO 100%.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { validateAssertionCoverage } from '../src/lib/legalReviewAssertionBinding.js';
import type {
  SourceSpan,
  AtomicClaim,
  AssertionSpec,
  Qualifier,
  Polarity,
  Modality,
} from '../src/lib/legalReviewTypes.js';

// -----------------------------------------------------------------------------
// 1. NETWORK GUARD (ZERO REDE / FAIL-CLOSED)
// -----------------------------------------------------------------------------
globalThis.fetch = () => {
  throw new Error('NETWORK_GUARD_VIOLATION: Chamada externa a fetch() terminantemente proibida.');
};

try {
  (http as any).request = (() => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  }) as any;
  (https as any).request = (() => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  }) as any;
} catch {
  // Ignora se o runtime congelar o namespace
}

// -----------------------------------------------------------------------------
// 2. TIPOS E INTERFACES DO BENCHMARK
// -----------------------------------------------------------------------------
export interface GoldenEntry {
  propositionId: string;
  originalText: string;
  propositionType: string;
  difficulty: 'STANDARD' | 'HARD';
  atomicClaims: AtomicClaim[];
  assertionSpecs: AssertionSpec[];
  criticalMaterialTokens: string[];
  nonCriticalMaterialTokens?: string[];
  materialTokens: string[];
  criticalQualifiers: Qualifier[];
  notes: string;
}

export interface CandidateDecomposition {
  propositionId: string;
  atomicClaims: AtomicClaim[];
  assertionSpecs: AssertionSpec[];
}

export interface BenchmarkMetrics {
  sourceSpanCoverage: number;          // Hard gate: === 1.0
  criticalMaterialTokenRecall: number; // Hard gate: === 1.0
  materialTokenRecall: number;         // Auxiliar
  criticalQualifierRecall: number;     // Hard gate: === 1.0
  polarityAccuracy: number;            // Hard gate: === 1.0
  criticalModalityAccuracy: number;    // Hard gate: === 1.0
  modalityAccuracy: number;            // Auxiliar
  atomicClaimRecall: number;           // Hard gate: === 1.0
  unsupportedAdditionRate: number;     // Hard gate: === 0.0
  legalSourceTargetAccuracy: number;   // Hard gate: === 1.0
  exactStructuralMatch: boolean;       // Conjunção booleana estrita
}

export interface CandidateValidationResult {
  valid: boolean;
  errors: string[];
  metrics: BenchmarkMetrics;
}

// -----------------------------------------------------------------------------
// 3. FUNÇÕES DE MATCHING INDEPENDENTE DE ID E ORDENAÇÃO
// -----------------------------------------------------------------------------
function spanIoU(s1: SourceSpan, s2: SourceSpan): number {
  const start = Math.max(s1.start, s2.start);
  const end = Math.min(s1.end, s2.end);
  const intersection = Math.max(0, end - start);
  const union = Math.max(s1.end, s2.end) - Math.min(s1.start, s2.start);
  return union > 0 ? intersection / union : 0;
}

function isMatchingSpan(s1: SourceSpan, s2: SourceSpan): boolean {
  return (
    (Math.abs(s1.start - s2.start) <= 5 && Math.abs(s1.end - s2.end) <= 5) ||
    spanIoU(s1, s2) >= 0.75
  );
}

function buildClaimMatching(candidateClaims: AtomicClaim[], goldenClaims: AtomicClaim[]): Map<string, AtomicClaim> {
  const matchMap = new Map<string, AtomicClaim>();
  const usedGolden = new Set<string>();

  for (const cc of candidateClaims) {
    let bestGc: AtomicClaim | null = null;
    let bestScore = -1;
    for (const gc of goldenClaims) {
      if (usedGolden.has(gc.claimId)) continue;
      if (isMatchingSpan(cc.sourceSpan, gc.sourceSpan)) {
        const score = spanIoU(cc.sourceSpan, gc.sourceSpan);
        if (score > bestScore) {
          bestScore = score;
          bestGc = gc;
        }
      }
    }
    if (bestGc) {
      matchMap.set(cc.claimId, bestGc);
      usedGolden.add(bestGc.claimId);
    }
  }
  return matchMap;
}

function buildSpecMatching(
  candidateSpecs: AssertionSpec[],
  goldenSpecs: AssertionSpec[],
  claimMatchMap: Map<string, AtomicClaim>
): Map<AssertionSpec, AssertionSpec> {
  const specMatchMap = new Map<AssertionSpec, AssertionSpec>();
  const usedCandidate = new Set<AssertionSpec>();

  for (const gs of goldenSpecs) {
    let bestCs: AssertionSpec | null = null;
    let bestScore = -1;

    for (const cs of candidateSpecs) {
      if (usedCandidate.has(cs)) continue;

      let score = 0;
      const matchedGc = claimMatchMap.get(cs.claimId);
      if (matchedGc && matchedGc.claimId === gs.claimId) {
        score += 5;
      }
      if (isMatchingSpan(cs.sourceSpan, gs.sourceSpan)) {
        score += 3 + spanIoU(cs.sourceSpan, gs.sourceSpan);
      }
      if (cs.legalSourceTarget === gs.legalSourceTarget) {
        score += 2;
      }
      if (cs.subject === gs.subject) score += 1;
      if (cs.predicate === gs.predicate) score += 1;
      if (cs.assertionId === gs.assertionId || cs.claimId === gs.claimId) {
        score += 1;
      }

      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestCs = cs;
      }
    }

    if (bestCs) {
      specMatchMap.set(gs, bestCs);
      usedCandidate.add(bestCs);
    }
  }
  return specMatchMap;
}

// -----------------------------------------------------------------------------
// 4. IMPLEMENTAÇÃO DAS MÉTRICAS OFFLINE (HARDENED)
// -----------------------------------------------------------------------------
function containsToken(text: string, cleanToken: string): boolean {
  if (!cleanToken) return true;
  if (/^[a-zãõáéíóúç]+$/i.test(cleanToken) && cleanToken.length <= 4) {
    const re = new RegExp(`(?:^|[^a-zãõáéíóúç])${cleanToken}(?:$|[^a-zãõáéíóúç])`, 'i');
    return re.test(text);
  }
  return text.includes(cleanToken);
}

export function calculateCriticalMaterialTokenRecall(
  candidateClaims: AtomicClaim[],
  criticalTokens: string[]
): number {
  if (criticalTokens.length === 0) return 1.0;
  const candidateText = candidateClaims
    .filter(c => c.materiality === 'MATERIAL')
    .map(c => c.sourceSpan.text.replace(/\*+/g, '').toLowerCase())
    .join(' ');

  let recalled = 0;
  for (const token of criticalTokens) {
    const cleanToken = token.replace(/\*+/g, '').toLowerCase().trim();
    if (containsToken(candidateText, cleanToken)) {
      recalled++;
    }
  }
  return recalled / criticalTokens.length;
}

export function calculateMaterialTokenRecall(
  candidateClaims: AtomicClaim[],
  goldenTokens: string[]
): number {
  if (goldenTokens.length === 0) return 1.0;
  const candidateText = candidateClaims
    .filter(c => c.materiality === 'MATERIAL')
    .map(c => c.sourceSpan.text.replace(/\*+/g, '').toLowerCase())
    .join(' ');

  let recalled = 0;
  for (const token of goldenTokens) {
    const cleanToken = token.replace(/\*+/g, '').toLowerCase().trim();
    if (containsToken(candidateText, cleanToken)) {
      recalled++;
    }
  }
  return recalled / goldenTokens.length;
}

export function calculateCriticalQualifierRecall(
  candidateSpecs: AssertionSpec[],
  goldenQualifiers: Qualifier[],
  originalText: string
): number {
  if (goldenQualifiers.length === 0) return 1.0;
  const candidateQualifiers = candidateSpecs.flatMap(s => s.qualifiers);

  let recalled = 0;
  for (const gq of goldenQualifiers) {
    const gqClean = gq.value.replace(/\*+/g, '').toLowerCase().trim();
    const found = candidateQualifiers.some(cq => {
      if (cq.type !== gq.type) return false;
      const cqClean = cq.value.replace(/\*+/g, '').toLowerCase().trim();
      if (cqClean !== gqClean) return false;

      // Validação estrita do sourceSpan do qualificador
      if (!cq.sourceSpan) return false;
      if (cq.sourceSpan.start < 0 || cq.sourceSpan.end > originalText.length) return false;
      const spanSlice = originalText.slice(cq.sourceSpan.start, cq.sourceSpan.end);
      if (spanSlice !== cq.sourceSpan.text) return false;
      const spanSliceClean = spanSlice.replace(/\*+/g, '').toLowerCase().trim();
      if (!spanSliceClean.includes(cqClean)) return false;

      return true;
    });
    if (found) recalled++;
  }
  return recalled / goldenQualifiers.length;
}

export function calculatePolarityAccuracy(
  goldenSpecs: AssertionSpec[],
  specMatchMap: Map<AssertionSpec, AssertionSpec>
): number {
  if (goldenSpecs.length === 0) return 1.0;
  let correct = 0;
  for (const gs of goldenSpecs) {
    const cs = specMatchMap.get(gs);
    if (cs && cs.polarity === gs.polarity) {
      correct++;
    }
  }
  return correct / goldenSpecs.length;
}

const CRITICAL_LEGAL_MODALITIES: Set<Modality> = new Set(['MAY', 'MUST', 'MUST_NOT', 'DECLARES', 'RECOGNIZES']);

export function calculateCriticalModalityAccuracy(
  goldenSpecs: AssertionSpec[],
  specMatchMap: Map<AssertionSpec, AssertionSpec>
): number {
  const criticalSpecs = goldenSpecs.filter(gs => CRITICAL_LEGAL_MODALITIES.has(gs.modality));
  if (criticalSpecs.length === 0) return 1.0;

  let correct = 0;
  for (const gs of criticalSpecs) {
    const cs = specMatchMap.get(gs);
    if (cs && cs.modality === gs.modality) {
      correct++;
    }
  }
  return correct / criticalSpecs.length;
}

export function calculateModalityAccuracy(
  goldenSpecs: AssertionSpec[],
  specMatchMap: Map<AssertionSpec, AssertionSpec>
): number {
  if (goldenSpecs.length === 0) return 1.0;
  let correct = 0;
  for (const gs of goldenSpecs) {
    const cs = specMatchMap.get(gs);
    if (cs && cs.modality === gs.modality) {
      correct++;
    }
  }
  return correct / goldenSpecs.length;
}

export function calculateAtomicClaimRecall(
  goldenClaims: AtomicClaim[],
  candidateClaims: AtomicClaim[]
): number {
  const goldenMaterial = goldenClaims.filter(c => c.materiality === 'MATERIAL');
  if (goldenMaterial.length === 0) return 1.0;

  let matched = 0;
  for (const gc of goldenMaterial) {
    const found = candidateClaims.some(
      cc => cc.materiality === 'MATERIAL' && isMatchingSpan(cc.sourceSpan, gc.sourceSpan)
    );
    if (found) matched++;
  }
  return matched / goldenMaterial.length;
}

export function calculateUnsupportedAdditionRate(
  candidateClaims: AtomicClaim[],
  goldenClaims: AtomicClaim[]
): number {
  if (candidateClaims.length === 0) return 0;
  let additions = 0;

  for (const cc of candidateClaims) {
    if (cc.materiality !== 'MATERIAL') continue;
    const isGrounded = goldenClaims.some(
      gc => gc.sourceSpan.start <= cc.sourceSpan.start && gc.sourceSpan.end >= cc.sourceSpan.end
    );
    if (!isGrounded) additions++;
  }
  return additions / candidateClaims.length;
}

export function calculateLegalSourceTargetAccuracy(
  goldenSpecs: AssertionSpec[],
  specMatchMap: Map<AssertionSpec, AssertionSpec>
): number {
  if (goldenSpecs.length === 0) return 1.0;
  let correct = 0;
  for (const gs of goldenSpecs) {
    const cs = specMatchMap.get(gs);
    if (cs && cs.legalSourceTarget === gs.legalSourceTarget) {
      correct++;
    }
  }
  return correct / goldenSpecs.length;
}

export function calculateExactStructuralMatch(
  metrics: Omit<BenchmarkMetrics, 'exactStructuralMatch'>,
  structuralViolationsCount: number
): boolean {
  return (
    metrics.sourceSpanCoverage === 1.0 &&
    metrics.criticalMaterialTokenRecall === 1.0 &&
    metrics.criticalQualifierRecall === 1.0 &&
    metrics.polarityAccuracy === 1.0 &&
    metrics.criticalModalityAccuracy === 1.0 &&
    metrics.atomicClaimRecall === 1.0 &&
    metrics.unsupportedAdditionRate === 0.0 &&
    metrics.legalSourceTargetAccuracy === 1.0 &&
    structuralViolationsCount === 0
  );
}

// -----------------------------------------------------------------------------
// 5. MOTOR FAIL-CLOSED: validateCandidateDecomposition
// -----------------------------------------------------------------------------
export function validateCandidateDecomposition(
  candidate: CandidateDecomposition,
  golden: GoldenEntry
): CandidateValidationResult {
  const errors: string[] = [];

  // A. Validação de cobertura contígua
  const cov = validateAssertionCoverage(golden.originalText, candidate.atomicClaims, candidate.assertionSpecs);
  if (!cov.valid) {
    errors.push(`Falha de cobertura textual: ${cov.reasonCodes.join(', ')}`);
  }
  if (cov.coverageRatio < 1.0) {
    errors.push(`Cobertura incompleta (${(cov.coverageRatio * 100).toFixed(1)}% < 100%)`);
  }

  // B. Validação geométrica dos spans em relação ao originalText
  for (const claim of candidate.atomicClaims) {
    if (!claim.sourceSpan) {
      errors.push(`Claim sem sourceSpan definido.`);
      continue;
    }
    const expectedSlice = golden.originalText.slice(claim.sourceSpan.start, claim.sourceSpan.end);
    if (expectedSlice !== claim.sourceSpan.text) {
      errors.push(`Claim possui sourceSpan desalinhado com o texto original.`);
    }
  }

  for (const spec of candidate.assertionSpecs) {
    for (const q of spec.qualifiers) {
      if (!q.sourceSpan) {
        errors.push(`Qualificador ${q.type} sem sourceSpan definido.`);
        continue;
      }
      const expectedSlice = golden.originalText.slice(q.sourceSpan.start, q.sourceSpan.end);
      if (expectedSlice !== q.sourceSpan.text) {
        errors.push(`Qualificador ${q.type} possui sourceSpan desalinhado com o texto original.`);
      }
    }
  }

  // C. Matching semântico estrutural independente de IDs e ordem
  const claimMatchMap = buildClaimMatching(candidate.atomicClaims, golden.atomicClaims);
  const specMatchMap = buildSpecMatching(candidate.assertionSpecs, golden.assertionSpecs, claimMatchMap);

  // D. Cálculo das Métricas
  const sourceSpanCoverage = cov.valid ? cov.coverageRatio : 0;
  const criticalMaterialTokenRecall = calculateCriticalMaterialTokenRecall(
    candidate.atomicClaims,
    golden.criticalMaterialTokens || golden.materialTokens
  );
  const materialTokenRecall = calculateMaterialTokenRecall(
    candidate.atomicClaims,
    golden.materialTokens
  );
  const criticalQualifierRecall = calculateCriticalQualifierRecall(
    candidate.assertionSpecs,
    golden.criticalQualifiers,
    golden.originalText
  );
  const polarityAccuracy = calculatePolarityAccuracy(golden.assertionSpecs, specMatchMap);
  const criticalModalityAccuracy = calculateCriticalModalityAccuracy(golden.assertionSpecs, specMatchMap);
  const modalityAccuracy = calculateModalityAccuracy(golden.assertionSpecs, specMatchMap);
  const atomicClaimRecall = calculateAtomicClaimRecall(golden.atomicClaims, candidate.atomicClaims);
  const unsupportedAdditionRate = calculateUnsupportedAdditionRate(candidate.atomicClaims, golden.atomicClaims);
  const legalSourceTargetAccuracy = calculateLegalSourceTargetAccuracy(golden.assertionSpecs, specMatchMap);

  // E. Hard Gates - Verificação Fail-Closed Estrita (Zero Compensação)
  if (sourceSpanCoverage < 1.0) {
    errors.push(`HARD GATE VIOLADO: sourceSpanCoverage (${(sourceSpanCoverage * 100).toFixed(1)}% < 100%)`);
  }
  if (criticalMaterialTokenRecall < 1.0) {
    errors.push(`HARD GATE VIOLADO: criticalMaterialTokenRecall (${(criticalMaterialTokenRecall * 100).toFixed(1)}% < 100%)`);
  }
  if (criticalQualifierRecall < 1.0) {
    errors.push(`HARD GATE VIOLADO: criticalQualifierRecall (${(criticalQualifierRecall * 100).toFixed(1)}% < 100%)`);
  }
  if (polarityAccuracy < 1.0) {
    errors.push(`HARD GATE VIOLADO: polarityAccuracy (${(polarityAccuracy * 100).toFixed(1)}% < 100%)`);
  }
  if (criticalModalityAccuracy < 1.0) {
    errors.push(`HARD GATE VIOLADO: criticalModalityAccuracy (${(criticalModalityAccuracy * 100).toFixed(1)}% < 100%)`);
  }
  if (atomicClaimRecall < 1.0) {
    errors.push(`HARD GATE VIOLADO: atomicClaimRecall (${(atomicClaimRecall * 100).toFixed(1)}% < 100%)`);
  }
  if (unsupportedAdditionRate > 0) {
    errors.push(`HARD GATE VIOLADO: unsupportedAdditionRate (${(unsupportedAdditionRate * 100).toFixed(1)}% > 0%)`);
  }
  if (legalSourceTargetAccuracy < 1.0) {
    errors.push(`HARD GATE VIOLADO: legalSourceTargetAccuracy (${(legalSourceTargetAccuracy * 100).toFixed(1)}% < 100%)`);
  }

  const exactStructuralMatch = calculateExactStructuralMatch(
    {
      sourceSpanCoverage,
      criticalMaterialTokenRecall,
      materialTokenRecall,
      criticalQualifierRecall,
      polarityAccuracy,
      criticalModalityAccuracy,
      modalityAccuracy,
      atomicClaimRecall,
      unsupportedAdditionRate,
      legalSourceTargetAccuracy,
    },
    errors.length
  );

  return {
    valid: errors.length === 0 && exactStructuralMatch,
    errors,
    metrics: {
      sourceSpanCoverage,
      criticalMaterialTokenRecall,
      materialTokenRecall,
      criticalQualifierRecall,
      polarityAccuracy,
      criticalModalityAccuracy,
      modalityAccuracy,
      atomicClaimRecall,
      unsupportedAdditionRate,
      legalSourceTargetAccuracy,
      exactStructuralMatch,
    },
  };
}

// -----------------------------------------------------------------------------
// 6. SUÍTE DE TESTES DETERMINÍSTICA DO BENCHMARK
// -----------------------------------------------------------------------------
export function runBenchmarkSuite() {
  const goldenPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-benchmark/golden-assertions.json');
  if (!fs.existsSync(goldenPath)) {
    throw new Error(`Arquivo golden não encontrado: ${goldenPath}`);
  }

  const goldenEntries: GoldenEntry[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

  if (goldenEntries.length !== 20) {
    throw new Error(`O benchmark deve conter exatamente 20 PropositionUnits. Encontradas: ${goldenEntries.length}`);
  }

  let testCount = 0;
  let mutationCount = 0;
  let negativeControlsCount = 0;
  let regressionCount = 0;

  // 1. Validação canônica de todas as 20 entradas golden
  for (const entry of goldenEntries) {
    testCount++;
    const candidate: CandidateDecomposition = {
      propositionId: entry.propositionId,
      atomicClaims: entry.atomicClaims,
      assertionSpecs: entry.assertionSpecs,
    };

    const res = validateCandidateDecomposition(candidate, entry);
    if (!res.valid) {
      throw new Error(`Entrada Golden ${entry.propositionId} falhou no validador: ${res.errors.join(' | ')}`);
    }
  }

  // 2. Teste de Independência de IDs Técnicos (Labels não interferem na aprovação)
  {
    testCount++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const idMap = new Map<string, string>();
    const candArbitraryIds: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims.map((c, idx) => {
        const newClaimId = `CUSTOM_CLAIM_UUID_${idx}_ABC`;
        idMap.set(c.claimId, newClaimId);
        return { ...c, claimId: newClaimId };
      }),
      assertionSpecs: e05.assertionSpecs.map((s, idx) => ({
        ...s,
        assertionId: `CUSTOM_SPEC_UUID_${idx}_XYZ`,
        claimId: idMap.get(s.claimId) || s.claimId,
      })),
    };
    const resId = validateCandidateDecomposition(candArbitraryIds, e05);
    if (!resId.valid) {
      throw new Error(`Falha de independência de ID técnico: candidato com UUIDs aleatórios deve ser aprovado. Erros: ${resId.errors.join(' | ')}`);
    }
  }

  // 3. Teste de Independência de Ordenação de Array (Ordem reversa deve ser aprovada)
  {
    testCount++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const candReversed: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: [...e05.atomicClaims].reverse(),
      assertionSpecs: [...e05.assertionSpecs].reverse(),
    };
    const resRev = validateCandidateDecomposition(candReversed, e05);
    if (!resRev.valid) {
      throw new Error(`Falha de independência de ordenação: candidato com claims/specs em ordem reversa deve ser aprovado. Erros: ${resRev.errors.join(' | ')}`);
    }
  }

  // 4. Testes de Mutações (20 mutações determinísticas, 1 por unidade)
  for (const entry of goldenEntries) {
    testCount++;
    mutationCount++;

    let mutatedCandidate: CandidateDecomposition;

    if (entry.atomicClaims.filter(c => c.materiality === 'MATERIAL').length > 1) {
      // Remove uma das claims materiais
      const matClaims = entry.atomicClaims.filter(c => c.materiality === 'MATERIAL');
      const claimToRemove = matClaims[matClaims.length - 1];
      mutatedCandidate = {
        propositionId: entry.propositionId,
        atomicClaims: entry.atomicClaims.filter(c => c.claimId !== claimToRemove.claimId),
        assertionSpecs: entry.assertionSpecs.filter(s => s.claimId !== claimToRemove.claimId),
      };
    } else if (entry.assertionSpecs.length > 0) {
      // Inverte polaridade da primeira spec
      mutatedCandidate = {
        propositionId: entry.propositionId,
        atomicClaims: entry.atomicClaims,
        assertionSpecs: entry.assertionSpecs.map((s, idx) => {
          if (idx === 0) {
            return { ...s, polarity: s.polarity === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE' };
          }
          return s;
        }),
      };
    } else {
      // Altera o alvo normativo
      mutatedCandidate = {
        propositionId: entry.propositionId,
        atomicClaims: entry.atomicClaims,
        assertionSpecs: entry.assertionSpecs.map(s => ({ ...s, legalSourceTarget: 'TARGET_MUTADO_INVALIDO' })),
      };
    }

    const resMut = validateCandidateDecomposition(mutatedCandidate, entry);
    if (resMut.valid) {
      throw new Error(`Mutação não detectada para ${entry.propositionId}. Validador fail-closed deveria ter reprovado.`);
    }
  }

  // 5. Controles Negativos Históricos (A a J)
  // Controle A: Proposição vazia
  {
    testCount++;
    negativeControlsCount++;
    const e23 = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    const candA: CandidateDecomposition = {
      propositionId: 'PROP-023',
      atomicClaims: [],
      assertionSpecs: [],
    };
    const resA = validateCandidateDecomposition(candA, e23);
    if (resA.valid) throw new Error('Negative Control A falhou: proposição vazia deve ser rejeitada.');
  }

  // Controle B: Inversão de polaridade (PROP-002)
  {
    testCount++;
    negativeControlsCount++;
    const e02 = goldenEntries.find(e => e.propositionId === 'PROP-002')!;
    const candB: CandidateDecomposition = {
      propositionId: 'PROP-002',
      atomicClaims: e02.atomicClaims,
      assertionSpecs: e02.assertionSpecs.map(s => ({ ...s, polarity: 'NEGATIVE' as Polarity })),
    };
    const resB = validateCandidateDecomposition(candB, e02);
    if (resB.valid) throw new Error('Negative Control B falhou: inversão de polaridade deve ser rejeitada.');
  }

  // Controle C: Remove exceção (PROP-026)
  {
    testCount++;
    negativeControlsCount++;
    const e26 = goldenEntries.find(e => e.propositionId === 'PROP-026')!;
    const candC: CandidateDecomposition = {
      propositionId: 'PROP-026',
      atomicClaims: e26.atomicClaims.filter(c => c.claimId !== 'P026-C'),
      assertionSpecs: e26.assertionSpecs.filter(s => s.assertionId !== 'SPEC_P026_C'),
    };
    const resC = validateCandidateDecomposition(candC, e26);
    if (resC.valid) throw new Error('Negative Control C falhou: remoção de cláusula de exceção deve ser rejeitada.');
  }

  // Controle D: Altera prazo (PROP-013: 15 dias alterado para 30 dias na spec)
  {
    testCount++;
    negativeControlsCount++;
    const e13 = goldenEntries.find(e => e.propositionId === 'PROP-013')!;
    const candD: CandidateDecomposition = {
      propositionId: 'PROP-013',
      atomicClaims: e13.atomicClaims,
      assertionSpecs: e13.assertionSpecs.map(s => {
        if (s.assertionId === 'SPEC_P013_B') {
          return {
            ...s,
            qualifiers: s.qualifiers.map(q => q.type === 'TEMPORAL' ? { ...q, value: 'por até 30 dias' } : q),
          };
        }
        return s;
      }),
    };
    const resD = validateCandidateDecomposition(candD, e13);
    if (resD.valid) throw new Error('Negative Control D falhou: alteração de prazo deve ser rejeitada.');
  }

  // Controle E: Remove qualifier crítico (PROP-005: remove "pontualmente")
  {
    testCount++;
    negativeControlsCount++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const candE: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims,
      assertionSpecs: e05.assertionSpecs.map(s => {
        if (s.assertionId === 'SPEC_P005_C') {
          return {
            ...s,
            qualifiers: s.qualifiers.filter(q => q.type !== 'FREQUENCY'),
          };
        }
        return s;
      }),
    };
    const resE = validateCandidateDecomposition(candE, e05);
    if (resE.valid) throw new Error('Negative Control E falhou: omissão de qualificador "pontualmente" deve ser rejeitada.');
  }

  // Controle F: Junta duas claims e perde uma condição (PROP-005: corta "desde que")
  {
    testCount++;
    negativeControlsCount++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const candF: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: [
        e05.atomicClaims[0],
        e05.atomicClaims[1],
        e05.atomicClaims[2],
        {
          claimId: 'P005-CD-FUSED',
          propositionId: 'PROP-005',
          sourceSpan: {
            start: 184,
            end: 477,
            text: e05.originalText.slice(184, 477),
          },
          normalizedClaim: 'Juiz pode agir sem ressalva probatória.',
          claimType: 'COURT_RULING',
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: [e05.assertionSpecs[0], e05.assertionSpecs[1], e05.assertionSpecs[2]],
    };
    const resF = validateCandidateDecomposition(candF, e05);
    if (resF.valid) throw new Error('Negative Control F falhou: fusão de claims com perda de condição deve ser rejeitada.');
  }

  // Controle G: Inventa qualifier inexistente no texto
  {
    testCount++;
    negativeControlsCount++;
    const e01 = goldenEntries.find(e => e.propositionId === 'PROP-001')!;
    const candG: CandidateDecomposition = {
      propositionId: 'PROP-001',
      atomicClaims: e01.atomicClaims,
      assertionSpecs: [
        {
          ...e01.assertionSpecs[0],
          qualifiers: [
            {
              type: 'CONDITION',
              value: 'somente mediante autorização do STF',
              sourceSpan: { start: 0, end: 10, text: 'texto_falso' },
            },
          ],
        },
      ],
    };
    const resG = validateCandidateDecomposition(candG, e01);
    if (resG.valid) throw new Error('Negative Control G falhou: qualificador inexistente deve ser rejeitado.');
  }

  // Controle H: Adiciona fundamento inexistente (unsupported addition)
  {
    testCount++;
    negativeControlsCount++;
    const e04 = goldenEntries.find(e => e.propositionId === 'PROP-004')!;
    const candH: CandidateDecomposition = {
      propositionId: 'PROP-004',
      atomicClaims: [
        ...e04.atomicClaims,
        {
          claimId: 'P004-EXTRA',
          propositionId: 'PROP-004',
          sourceSpan: { start: 999, end: 1020, text: 'texto_inventado_fora' },
          normalizedClaim: 'Afirmação inventada sem esteio.',
          claimType: 'DIRECT_NORMATIVE_ASSERTION',
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: e04.assertionSpecs,
    };
    const resH = validateCandidateDecomposition(candH, e04);
    if (resH.valid) throw new Error('Negative Control H falhou: adição de fundamento não derivável deve ser rejeitada.');
  }

  // Controle I: Spans desalinhados com o texto
  {
    testCount++;
    negativeControlsCount++;
    const e08 = goldenEntries.find(e => e.propositionId === 'PROP-008')!;
    const candI: CandidateDecomposition = {
      propositionId: 'PROP-008',
      atomicClaims: [
        e08.atomicClaims[0],
        {
          ...e08.atomicClaims[1],
          sourceSpan: {
            start: 10,
            end: e08.atomicClaims[1].sourceSpan.end,
            text: e08.atomicClaims[1].sourceSpan.text,
          },
        },
      ],
      assertionSpecs: e08.assertionSpecs,
    };
    const resI = validateCandidateDecomposition(candI, e08);
    if (resI.valid) throw new Error('Negative Control I falhou: sourceSpan incorreto deve ser rejeitado.');
  }

  // Controle J: Troca referência legal (PROP-020: substitui art. 399 por art. 156)
  {
    testCount++;
    negativeControlsCount++;
    const e20 = goldenEntries.find(e => e.propositionId === 'PROP-020')!;
    const candJ: CandidateDecomposition = {
      propositionId: 'PROP-020',
      atomicClaims: e20.atomicClaims,
      assertionSpecs: e20.assertionSpecs.map(s => {
        if (s.assertionId === 'SPEC_P020_A') {
          return { ...s, legalSourceTarget: 'CPP_ART_156' };
        }
        return s;
      }),
    };
    const resJ = validateCandidateDecomposition(candJ, e20);
    if (resJ.valid) throw new Error('Negative Control J falhou: troca de referência legal deve ser rejeitada.');
  }

  // 6. Regressões Específicas de PROP-030 (Hardening V2.3.4-B.1)
  // Regressão PROP-030.1: Omissão de "observada a autonomia dos tribunais"
  {
    testCount++;
    regressionCount++;
    const e30 = goldenEntries.find(e => e.propositionId === 'PROP-030')!;
    const cand30_1: CandidateDecomposition = {
      propositionId: 'PROP-030',
      atomicClaims: e30.atomicClaims.filter(c => c.claimId !== 'P030-D'),
      assertionSpecs: e30.assertionSpecs.filter(s => s.assertionId !== 'SPEC_P030_D'),
    };
    const res30_1 = validateCandidateDecomposition(cand30_1, e30);
    if (res30_1.valid) {
      throw new Error('Regressão PROP-030.1 falhou: omissão de "observada a autonomia dos tribunais" deve ser sumariamente rejeitada.');
    }
  }

  // Regressão PROP-030.2: Inverso — Preserva autonomia dos tribunais, mas omite diretrizes do CNJ
  {
    testCount++;
    regressionCount++;
    const e30 = goldenEntries.find(e => e.propositionId === 'PROP-030')!;
    const cand30_2: CandidateDecomposition = {
      propositionId: 'PROP-030',
      atomicClaims: e30.atomicClaims.filter(c => c.claimId !== 'P030-E'),
      assertionSpecs: e30.assertionSpecs.filter(s => s.assertionId !== 'SPEC_P030_E'),
    };
    const res30_2 = validateCandidateDecomposition(cand30_2, e30);
    if (res30_2.valid) {
      throw new Error('Regressão PROP-030.2 falhou: omissão de diretrizes do CNJ deve ser sumariamente rejeitada.');
    }
  }

  // 7. Regressões Específicas de PROP-005 (Hardening V2.3.4-B.1)
  const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;

  // PROP-005.A: Remove "pontualmente"
  {
    testCount++;
    regressionCount++;
    const cand05_A: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims.map(c => {
        if (c.claimId === 'P05-C' || c.sourceSpan.text.includes('pontualmente')) {
          return { ...c, sourceSpan: { ...c.sourceSpan, text: c.sourceSpan.text.replace('pontualmente', '') } };
        }
        return c;
      }),
      assertionSpecs: e05.assertionSpecs.map(s => ({
        ...s,
        qualifiers: s.qualifiers.filter(q => q.value !== 'pontualmente'),
      })),
    };
    const res05_A = validateCandidateDecomposition(cand05_A, e05);
    if (res05_A.valid) throw new Error('Regressão PROP-005.A falhou: remoção de "pontualmente" deve ser rejeitada.');
  }

  // PROP-005.B: Remove "nos limites legalmente autorizados"
  {
    testCount++;
    regressionCount++;
    const cand05_B: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims,
      assertionSpecs: e05.assertionSpecs.map(s => ({
        ...s,
        qualifiers: s.qualifiers.filter(q => q.value !== 'nos limites legalmente autorizados'),
      })),
    };
    const res05_B = validateCandidateDecomposition(cand05_B, e05);
    if (res05_B.valid) throw new Error('Regressão PROP-005.B falhou: remoção de "limites legalmente autorizados" deve ser rejeitada.');
  }

  // PROP-005.C: Remove "art. 156, II"
  {
    testCount++;
    regressionCount++;
    const cand05_C: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims.map(c => {
        if (c.sourceSpan.text.includes('art. 156, II')) {
          return {
            ...c,
            sourceSpan: {
              ...c.sourceSpan,
              text: c.sourceSpan.text.replace('art. 156, II, do CPP', 'do CPP'),
            },
          };
        }
        return c;
      }),
      assertionSpecs: e05.assertionSpecs,
    };
    const res05_C = validateCandidateDecomposition(cand05_C, e05);
    if (res05_C.valid) throw new Error('Regressão PROP-005.C falhou: remoção de "art. 156, II" deve ser rejeitada.');
  }

  // PROP-005.D: Remove condição relativa à atividade probatória ("desde que não haja substituição...")
  {
    testCount++;
    regressionCount++;
    const cand05_D: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims.map(c => {
        if (c.sourceSpan.text.includes('desde que não haja substituição')) {
          return {
            ...c,
            sourceSpan: {
              ...c.sourceSpan,
              text: c.sourceSpan.text.split('desde que não haja substituição')[0],
            },
          };
        }
        return c;
      }),
      assertionSpecs: e05.assertionSpecs.map(s => ({
        ...s,
        qualifiers: s.qualifiers.filter(q => !q.value.includes('substituição da atividade probatória')),
      })),
    };
    const res05_D = validateCandidateDecomposition(cand05_D, e05);
    if (res05_D.valid) throw new Error('Regressão PROP-005.D falhou: remoção de condição probatória das partes deve ser rejeitada.');
  }

  // PROP-005.E: Remove vedação de iniciativa probatória (claim P005-A / "vede a substituição")
  {
    testCount++;
    regressionCount++;
    const cand05_E: CandidateDecomposition = {
      propositionId: 'PROP-005',
      atomicClaims: e05.atomicClaims.filter(c => c.claimId !== 'P005-A'),
      assertionSpecs: e05.assertionSpecs.filter(s => s.assertionId !== 'SPEC_P005_A'),
    };
    const res05_E = validateCandidateDecomposition(cand05_E, e05);
    if (res05_E.valid) throw new Error('Regressão PROP-005.E falhou: remoção de vedação de iniciativa probatória deve ser rejeitada.');
  }

  // 8. Teste do 95% (Mandatory: >95% lexical recall mas falta termo crítico "não")
  {
    testCount++;
    regressionCount++;
    const e23 = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    // e23 possui texto: "As decisões proferidas pelo juiz das garantias não vinculam..."
    // Modifica apenas a palavra "não" para "sempre"
    const cand95: CandidateDecomposition = {
      propositionId: 'PROP-023',
      atomicClaims: e23.atomicClaims.map(c => {
        if (c.sourceSpan.text.includes('não vinculam')) {
          return {
            ...c,
            sourceSpan: {
              ...c.sourceSpan,
              text: c.sourceSpan.text.replace('não vinculam', 'sempre vinculam'),
            },
          };
        }
        return c;
      }),
      assertionSpecs: e23.assertionSpecs,
    };
    const res95 = validateCandidateDecomposition(cand95, e23);
    if (res95.valid) {
      throw new Error('TESTE DO 95% FALHOU: O candidato obteve recall alto mas omitiu "não" e foi aceito indevidamente!');
    }
    if (res95.metrics.criticalMaterialTokenRecall === 1.0) {
      throw new Error('TESTE DO 95% FALHOU: criticalMaterialTokenRecall deveria ser < 1.0.');
    }
  }

  // 9. Testes de Compensação (Zero Tolerância)
  // Compensação 1: 100% em tudo exceto polaridade invertida em uma única AssertionSpec
  {
    testCount++;
    regressionCount++;
    const e01 = goldenEntries.find(e => e.propositionId === 'PROP-001')!;
    const candCompPol: CandidateDecomposition = {
      propositionId: 'PROP-001',
      atomicClaims: e01.atomicClaims,
      assertionSpecs: [
        {
          ...e01.assertionSpecs[0],
          polarity: 'NEGATIVE', // Polaridade invertida isolada
        },
      ],
    };
    const resCompPol = validateCandidateDecomposition(candCompPol, e01);
    if (resCompPol.valid) {
      throw new Error('TESTE DE COMPENSAÇÃO FALHOU: Erro de polaridade isolado deve reprovar sumariamente.');
    }
    if (resCompPol.metrics.polarityAccuracy !== 0) {
      throw new Error('polarityAccuracy deveria ser 0.');
    }
  }

  // Compensação 2: 100% em tudo exceto modalidade crítica (MAY trocado por MUST em PROP-013)
  {
    testCount++;
    regressionCount++;
    const e13 = goldenEntries.find(e => e.propositionId === 'PROP-013')!;
    const candCompMod: CandidateDecomposition = {
      propositionId: 'PROP-013',
      atomicClaims: e13.atomicClaims,
      assertionSpecs: e13.assertionSpecs.map(s => {
        if (s.assertionId === 'SPEC_P013_B') {
          return { ...s, modality: 'MUST' as Modality }; // Faculdade virou Obrigação
        }
        return s;
      }),
    };
    const resCompMod = validateCandidateDecomposition(candCompMod, e13);
    if (resCompMod.valid) {
      throw new Error('TESTE DE COMPENSAÇÃO FALHOU: Troca de modalidade crítica (MAY -> MUST) deve reprovar sumariamente.');
    }
    if (resCompMod.metrics.criticalModalityAccuracy === 1.0) {
      throw new Error('criticalModalityAccuracy deveria ser < 1.0.');
    }
  }

  // Compensação 3: 100% em tudo exceto troca isolada de legalSourceTarget
  {
    testCount++;
    regressionCount++;
    const e07 = goldenEntries.find(e => e.propositionId === 'PROP-007')!;
    const candCompSource: CandidateDecomposition = {
      propositionId: 'PROP-007',
      atomicClaims: e07.atomicClaims,
      assertionSpecs: e07.assertionSpecs.map(s => {
        if (s.assertionId === 'SPEC_P007_A') {
          return { ...s, legalSourceTarget: 'CPP_ART_3B_II' }; // Trocou Inciso I por Inciso II
        }
        return s;
      }),
    };
    const resCompSource = validateCandidateDecomposition(candCompSource, e07);
    if (resCompSource.valid) {
      throw new Error('TESTE DE COMPENSAÇÃO FALHOU: Troca isolada de legalSourceTarget deve reprovar sumariamente.');
    }
    if (resCompSource.metrics.legalSourceTargetAccuracy === 1.0) {
      throw new Error('legalSourceTargetAccuracy deveria ser < 1.0.');
    }
  }

  const hardCases = goldenEntries.filter(e => e.difficulty === 'HARD');

  return {
    passed: true,
    totalTests: testCount,
    goldenCount: goldenEntries.length,
    hardCount: hardCases.length,
    mutationCount,
    negativeControlsCount,
    regressionCount,
    summary: {
      hardCases: hardCases.map(h => h.propositionId),
    },
  };
}

// -----------------------------------------------------------------------------
// 7. EXECUÇÃO DETERMINÍSTICA DUPLA
// -----------------------------------------------------------------------------
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('check-assertion-decomposition-benchmark')) {
  console.log('=== EXECUÇÃO RUN 1: check-assertion-decomposition-benchmark.ts ===');
  const run1 = runBenchmarkSuite();
  console.log(`Run 1 concluída: ${run1.totalTests} verificações realizadas.`);
  console.log(`  - Entradas Golden: ${run1.goldenCount} (100% validadas)`);
  console.log(`  - Casos HARD: ${run1.hardCount} (${run1.summary.hardCases.join(', ')})`);
  console.log(`  - Mutações testadas: ${run1.mutationCount}`);
  console.log(`  - Negative Controls: ${run1.negativeControlsCount}`);
  console.log(`  - Regressões Hardened: ${run1.regressionCount}`);

  console.log('\n=== EXECUÇÃO RUN 2: check-assertion-decomposition-benchmark.ts ===');
  const run2 = runBenchmarkSuite();
  console.log(`Run 2 concluída: ${run2.totalTests} verificações realizadas.`);

  const str1 = JSON.stringify(run1);
  const str2 = JSON.stringify(run2);
  if (str1 !== str2) {
    throw new Error('DETERMINISM_ERROR: Saídas de Run 1 e Run 2 são divergentes.');
  }

  console.log('\n✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
}
