/**
 * ATHENA V2.3.4-A - Production Assertion Binding Foundation
 * 
 * Módulo de infraestrutura para representação e verificação estrutural:
 * PropositionUnit -> AtomicClaim -> AssertionSpec -> EvidenceAssertion -> MaterialBindingResult
 * 
 * REGRAS DE GOVERNANÇA:
 * - Desacoplado do gate jurídico final (LEGAL_REVIEW_MATERIAL_BINDING = false por padrão).
 * - ZERO chamadas externas / ZERO LLM.
 * - Totalmente determinístico e fail-closed.
 */

import type {
  SourceSpan,
  AtomicClaim,
  AssertionSpec,
  EvidenceAssertion,
  Qualifier,
  InferenceRule,
  CanonicalEquivalenceRule,
  BoundClaimResult,
  MaterialBindingResult,
  PropositionMaterialStatus,
  SupportLevel,
  AssertionBindingReasonCode,
} from './legalReviewTypes';

export interface CoverageResult {
  valid: boolean;
  uncoveredGaps: SourceSpan[];
  errors: string[];
  reasonCodes: AssertionBindingReasonCode[];
  totalChars: number;
  coveredChars: number;
  coverageRatio: number;
}

// Termos que NUNCA podem ser classificados como NON_MATERIAL
export const FORBIDDEN_NON_MATERIAL_TERMS = [
  'não',
  'pontualmente',
  'nos limites legalmente autorizados',
  'em todo o país',
  'autonomia dos tribunais',
  'desde que',
  'embora',
  'salvo',
  'exceto',
  'apenas',
  'necessariamente',
  'poderá',
  'deverá',
  'vedadas',
  'vedado',
];

// Padrões estruturais de deontologia e escopo que bloqueiam NON_MATERIAL
export const STRUCTURAL_MATERIAL_PATTERNS = [
  /\b(?:n[aã]o|nunca|jamais|nenhum|nenhuma|tampouco|inadmiss[ií]vel|vedad[ao]s?|proibid[ao]s?)\b/i,
  /\b(?:deve|dever[aá]|obrigatoriamente|pode|poder[aá]|facultado)\b/i,
  /\b(?:desde\s+que|condicionad[ao]|caso|se)\b/i,
  /\b(?:salvo|exceto|ressalvad[ao]|sem\s+preju[ií]zo)\b/i,
];

function isIgnorableChar(ch: string): boolean {
  return /[\s*#>_`~]/.test(ch);
}

/**
 * Validador determinístico de cobertura textual.
 * Garante que todas as alegações atômicas correspondem ao texto original,
 * sem gaps materiais não mapeados, sem overlaps contraditórios e sem preâmbulos ilegais.
 */
export function validateAssertionCoverage(
  originalText: string,
  atomicClaims: AtomicClaim[],
  assertions?: AssertionSpec[]
): CoverageResult {
  const errors: string[] = [];
  const reasonCodes: AssertionBindingReasonCode[] = [];
  const totalChars = originalText.length;
  const covered = new Array<boolean>(totalChars).fill(false);

  // 1. Validar integridade dos spans de cada claim
  for (const claim of atomicClaims) {
    const { start, end, text } = claim.sourceSpan;

    if (start < 0 || end > totalChars || start >= end) {
      errors.push(`INVALID_SOURCE_SPAN: Claim ${claim.claimId} span [${start}, ${end}] fora dos limites do texto (0-${totalChars}).`);
      reasonCodes.push('INVALID_SOURCE_SPAN');
      continue;
    }

    const actualSlice = originalText.slice(start, end);
    if (actualSlice !== text) {
      errors.push(
        `INVALID_SOURCE_SPAN: Claim ${claim.claimId} span text mismatch.\nEsperado: "${text}"\nReal:     "${actualSlice}"`
      );
      reasonCodes.push('INVALID_SOURCE_SPAN');
      continue;
    }

    // Validação conservadora de NON_MATERIAL
    if (claim.materiality === 'NON_MATERIAL') {
      const lower = text.toLowerCase();
      let isIllegal = false;
      for (const term of FORBIDDEN_NON_MATERIAL_TERMS) {
        if (lower.includes(term.toLowerCase())) {
          isIllegal = true;
          break;
        }
      }
      if (!isIllegal) {
        for (const pattern of STRUCTURAL_MATERIAL_PATTERNS) {
          if (pattern.test(text)) {
            isIllegal = true;
            break;
          }
        }
      }

      if (isIllegal) {
        errors.push(`ILLEGAL_NON_MATERIAL_CLAIM: Claim ${claim.claimId} contém termos materiais/deontológicos mas foi classificada como NON_MATERIAL.`);
        reasonCodes.push('ILLEGAL_NON_MATERIAL_CLAIM');
      }
    }

    // Detecção de overlaps contraditórios
    for (let i = start; i < end; i++) {
      if (covered[i]) {
        errors.push(`OVERLAPPING_CLAIMS: Caractere no índice ${i} ('${originalText[i]}') está em overlap na claim ${claim.claimId}.`);
        reasonCodes.push('OVERLAPPING_CLAIMS');
        break;
      }
      covered[i] = true;
    }
  }

  // 2. Detecção de gaps materiais não cobertos
  const uncoveredGaps: SourceSpan[] = [];
  let gapStart = -1;

  for (let i = 0; i < totalChars; i++) {
    if (!covered[i]) {
      if (gapStart === -1) {
        gapStart = i;
      }
    } else {
      if (gapStart !== -1) {
        const gapText = originalText.slice(gapStart, i);
        if (!gapText.split('').every(isIgnorableChar)) {
          uncoveredGaps.push({ start: gapStart, end: i, text: gapText });
        }
        gapStart = -1;
      }
    }
  }

  if (gapStart !== -1) {
    const gapText = originalText.slice(gapStart, totalChars);
    if (!gapText.split('').every(isIgnorableChar)) {
      uncoveredGaps.push({ start: gapStart, end: totalChars, text: gapText });
    }
  }

  for (const gap of uncoveredGaps) {
    errors.push(`UNCOVERED_MATERIAL_GAP: Intervalo [${gap.start}, ${gap.end}] "${gap.text}" não está coberto por nenhuma claim.`);
    reasonCodes.push('UNCOVERED_MATERIAL_GAP');
  }

  // 3. Validação de correspondência com AssertionSpecs (se fornecido)
  if (assertions) {
    for (const claim of atomicClaims) {
      if (claim.materiality === 'MATERIAL') {
        const spec = assertions.find(s => s.claimId === claim.claimId);
        if (!spec) {
          errors.push(`ASSERTION_SPEC_MISSING: Claim material ${claim.claimId} não possui AssertionSpec associada.`);
          reasonCodes.push('ASSERTION_SPEC_MISSING');
        } else {
          // Validar que cada qualifier tem sourceSpan contido no span da claim
          for (const q of spec.qualifiers) {
            if (
              q.sourceSpan.start < claim.sourceSpan.start ||
              q.sourceSpan.end > claim.sourceSpan.end
            ) {
              errors.push(`INVALID_SOURCE_SPAN: Qualifier "${q.value}" possui span [${q.sourceSpan.start}, ${q.sourceSpan.end}] fora do span da claim [${claim.sourceSpan.start}, ${claim.sourceSpan.end}].`);
              reasonCodes.push('INVALID_SOURCE_SPAN');
            }
            if (originalText.slice(q.sourceSpan.start, q.sourceSpan.end) !== q.sourceSpan.text) {
              errors.push(`INVALID_SOURCE_SPAN: Qualifier "${q.value}" span text mismatch com originalText.`);
              reasonCodes.push('INVALID_SOURCE_SPAN');
            }
          }
        }
      }
    }
  }

  const coveredChars = covered.filter(Boolean).length;
  const coverageRatio = totalChars > 0 ? coveredChars / totalChars : 1;

  return {
    valid: errors.length === 0,
    uncoveredGaps,
    errors,
    reasonCodes: [...new Set(reasonCodes)],
    totalChars,
    coveredChars,
    coverageRatio,
  };
}

/**
 * Consulta de equivalência canônica com validação de escopo estrito.
 */
function checkEquivalence(
  termA: string,
  termB: string,
  scope?: string,
  rules?: CanonicalEquivalenceRule[]
): { match: boolean; scopeMismatch?: boolean } {
  const normA = termA.toLowerCase().trim();
  const normB = termB.toLowerCase().trim();

  if (normA === normB) {
    return { match: true };
  }

  if (!rules || rules.length === 0) {
    return { match: false };
  }

  for (const rule of rules) {
    const forms = [
      rule.canonicalConcept.toLowerCase(),
      rule.expressionA.toLowerCase(),
      rule.expressionB.toLowerCase(),
    ];

    if (forms.includes(normA) && forms.includes(normB)) {
      if (scope && rule.scope !== scope && rule.scope !== 'GLOBAL') {
        return { match: false, scopeMismatch: true };
      }
      return { match: true };
    }
  }

  return { match: false };
}

export interface AssertionBindingOptions {
  inferenceRules?: InferenceRule[];
  equivalenceRules?: CanonicalEquivalenceRule[];
}

/**
 * Motor determinístico de vinculação entre AssertionSpec e EvidenceAssertion.
 * Executa comparação estrutural, checagem de polaridade/modalidade e qualificadores fail-closed.
 */
export function bindAssertionsToEvidence(
  propositionId: string,
  assertions: AssertionSpec[],
  evidenceAssertions: EvidenceAssertion[],
  options: AssertionBindingOptions = {}
): MaterialBindingResult {
  const claimsResults: BoundClaimResult[] = [];
  const reasonCodes: (AssertionBindingReasonCode | string)[] = [];

  let hasContradiction = false;
  let hasUnsupportedAddition = false;
  let hasIndeterminate = false;

  // Filtragem fail-closed de evidências: métodos não-determinísticos (ex: LLM_DERIVED) são sumariamente rejeitados
  const validEvidence = evidenceAssertions.filter(ev => {
    if (
      ev.derivationMethod !== 'LEGISLATION_STRUCTURE' &&
      ev.derivationMethod !== 'ENUMERATED_DISPOSITIVO' &&
      ev.derivationMethod !== 'EXACT_TEXT_RULE'
    ) {
      reasonCodes.push('EVIDENCE_SOURCE_MISMATCH');
      return false;
    }
    return true;
  });

  for (const spec of assertions) {
    // 1. Checagem de contradições (Polaridade e Modalidade)
    let foundContradiction = false;

    for (const ev of validEvidence) {
      const subj = checkEquivalence(spec.subject, ev.subject, spec.legalSourceTarget, options.equivalenceRules);
      const obj = checkEquivalence(spec.object, ev.object, spec.legalSourceTarget, options.equivalenceRules);

      if (subj.match && obj.match) {
        // Conflito de polaridade
        if (spec.polarity !== ev.polarity) {
          claimsResults.push({
            claimId: spec.claimId,
            assertionId: spec.assertionId,
            supportLevel: 'UNSUPPORTED',
            matchedEvidenceAssertionId: ev.evidenceAssertionId,
            evidenceLocator: ev.locator,
            reasonCode: 'POLARITY_CONTRADICTION',
            missingElements: [`Conflito de polaridade: asserção ${spec.polarity} vs evidência ${ev.polarity}`],
          });
          reasonCodes.push('POLARITY_CONTRADICTION');
          foundContradiction = true;
          hasContradiction = true;
          break;
        }

        // Conflito de modalidade (MUST_NOT vs MAY / MUST)
        if (
          (ev.modality === 'MUST_NOT' && (spec.modality === 'MAY' || spec.modality === 'MUST')) ||
          (ev.modality === 'MUST' && spec.modality === 'MUST_NOT')
        ) {
          claimsResults.push({
            claimId: spec.claimId,
            assertionId: spec.assertionId,
            supportLevel: 'UNSUPPORTED',
            matchedEvidenceAssertionId: ev.evidenceAssertionId,
            evidenceLocator: ev.locator,
            reasonCode: 'MODALITY_CONTRADICTION',
            missingElements: [`Conflito de modalidade: asserção ${spec.modality} vs evidência ${ev.modality}`],
          });
          reasonCodes.push('MODALITY_CONTRADICTION');
          foundContradiction = true;
          hasContradiction = true;
          break;
        }
      }
    }

    if (foundContradiction) {
      continue;
    }

    // 2. Busca de EvidenceAssertion correspondente
    let matchedEv: EvidenceAssertion | undefined;
    let matchedSupportLevel: SupportLevel = 'UNSUPPORTED';
    let matchedReasonCode: AssertionBindingReasonCode | string = 'EVIDENCE_ASSERTION_MISSING';
    let missingQualifiers: string[] = [];
    let appliedRuleId: string | undefined;

    for (const ev of validEvidence) {
      const subj = checkEquivalence(spec.subject, ev.subject, spec.legalSourceTarget, options.equivalenceRules);
      const pred = checkEquivalence(spec.predicate, ev.predicate, spec.legalSourceTarget, options.equivalenceRules);
      const obj = checkEquivalence(spec.object, ev.object, spec.legalSourceTarget, options.equivalenceRules);

      if (subj.scopeMismatch || pred.scopeMismatch || obj.scopeMismatch) {
        reasonCodes.push('CANONICAL_EQUIVALENCE_SCOPE_MISMATCH');
      }

      if (subj.match && pred.match && obj.match) {
        // Validação estrita de qualificadores
        const unfulfilledQualifiers: string[] = [];
        for (const q of spec.qualifiers) {
          const matchQ = ev.qualifiers.some(evQ => {
            if (evQ.type !== q.type) return false;
            const qEq = checkEquivalence(q.value, evQ.value, spec.legalSourceTarget, options.equivalenceRules);
            if (qEq.scopeMismatch) {
              reasonCodes.push('CANONICAL_EQUIVALENCE_SCOPE_MISMATCH');
            }
            return qEq.match;
          });

          if (!matchQ) {
            unfulfilledQualifiers.push(`${q.type}: "${q.value}"`);
          }
        }

        if (unfulfilledQualifiers.length > 0) {
          // A asserção traz qualificadores/limites não amparados no documento oficial
          matchedEv = ev;
          matchedSupportLevel = 'UNSUPPORTED';
          matchedReasonCode = 'UNSUPPORTED_QUALIFIER_ADDITION';
          missingQualifiers = unfulfilledQualifiers;
          hasUnsupportedAddition = true;
          break;
        }

        // Match direto e completo
        matchedEv = ev;
        if (spec.kind === 'COURT_RULING' || spec.kind === 'RULE_PERMISSION') {
          matchedSupportLevel = 'DIRECT_LITERAL';
          matchedReasonCode = 'DIRECT_LITERAL_MATCH';
        } else {
          matchedSupportLevel = 'DIRECT_NORMATIVE';
          matchedReasonCode = 'DIRECT_NORMATIVE_MATCH';
        }
        break;
      }
    }

    // 3. Se não houve match direto, verificar regras de inferência necessárias (InferenceRule)
    if (!matchedEv && options.inferenceRules && options.inferenceRules.length > 0) {
      for (const ev of validEvidence) {
        for (const rule of options.inferenceRules) {
          if (
            rule.premises.includes(ev.predicate) &&
            rule.conclusion === spec.predicate &&
            checkEquivalence(spec.object, ev.object, spec.legalSourceTarget, options.equivalenceRules).match
          ) {
            // Verificar escopo da regra de inferência
            if (rule.scope !== spec.legalSourceTarget && rule.scope !== 'GLOBAL') {
              reasonCodes.push('INFERENCE_SCOPE_MISMATCH');
              continue;
            }

            matchedEv = ev;
            matchedSupportLevel = 'NECESSARY_INFERENCE';
            matchedReasonCode = 'EXPLICIT_INFERENCE_RULE_APPLIED';
            appliedRuleId = rule.ruleId;
            break;
          }
        }
        if (matchedEv) break;
      }
    }

    // 4. Caso não amparado, classificar de acordo com a natureza da asserção
    if (!matchedEv) {
      if (spec.kind === 'INTERPRETIVE_CLAIM') {
        matchedSupportLevel = 'INTERPRETIVE_INFERENCE';
        matchedReasonCode = 'INTERPRETIVE_GAP_NO_DISPOSITIVO_MATCH';
        hasIndeterminate = true;
      } else {
        matchedSupportLevel = 'UNSUPPORTED';
        matchedReasonCode = 'ASSERTION_NOT_GROUNDED_IN_EVIDENCE';
        hasUnsupportedAddition = true;
      }
    }

    claimsResults.push({
      claimId: spec.claimId,
      assertionId: spec.assertionId,
      supportLevel: matchedSupportLevel,
      matchedEvidenceAssertionId: matchedEv?.evidenceAssertionId,
      evidenceLocator: matchedEv?.locator,
      reasonCode: matchedReasonCode,
      missingElements: missingQualifiers.length > 0 ? missingQualifiers : undefined,
      inferenceRuleApplied: appliedRuleId,
    });

    reasonCodes.push(matchedReasonCode);
  }

  const atomicClaimCount = assertions.length;
  const supportedAtomicClaimCount = claimsResults.filter(
    c => c.supportLevel === 'DIRECT_LITERAL' || c.supportLevel === 'DIRECT_NORMATIVE' || c.supportLevel === 'NECESSARY_INFERENCE'
  ).length;
  const unsupportedAtomicClaimCount = claimsResults.filter(c => c.supportLevel === 'UNSUPPORTED').length;
  const indeterminateAtomicClaimCount = claimsResults.filter(
    c => c.supportLevel === 'INDETERMINATE' || c.supportLevel === 'INTERPRETIVE_INFERENCE'
  ).length;

  // Precedência de status rigorosamente determinística:
  // CONTRADICTED > CONTAINS_UNSUPPORTED_ADDITIONS > INDETERMINATE > PARTIALLY_SUPPORTED > FULLY_SUPPORTED
  let status: PropositionMaterialStatus = 'INDETERMINATE';

  if (hasContradiction) {
    status = 'CONTRADICTED';
  } else if (hasUnsupportedAddition || unsupportedAtomicClaimCount > 0) {
    status = 'CONTAINS_UNSUPPORTED_ADDITIONS';
  } else if (hasIndeterminate || indeterminateAtomicClaimCount > 0) {
    status = 'INDETERMINATE';
  } else if (supportedAtomicClaimCount === atomicClaimCount && atomicClaimCount > 0) {
    status = 'FULLY_SUPPORTED';
  } else if (supportedAtomicClaimCount > 0) {
    status = 'PARTIALLY_SUPPORTED';
  } else {
    status = 'UNSUPPORTED';
  }

  return {
    propositionId,
    atomicClaimCount,
    supportedAtomicClaimCount,
    unsupportedAtomicClaimCount,
    indeterminateAtomicClaimCount,
    claims: claimsResults,
    status,
    reasonCodes: [...new Set(reasonCodes)],
  };
}
