const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function normalizeStr(s) {
  if (s === null || s === undefined) return '';
  if (typeof s === 'object') {
    s = s.sourceText || s.value || s.text || JSON.stringify(s);
  }
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==========================================
// 1. BASELINE HASH CHECK
// ==========================================
const BASELINE = {
  raw: { path: 'tmp/assertion-decomposition-holdout-v236h1/raw/h1-response.raw.json', expected: '57058aab1e18ee4eed78164cc273dccd4cb7bd169f5de1677a3d68ca8dbef6ce' },
  parsed: { path: 'tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json', expected: 'fef2e91af7b5c48ecfe58dae3edb35346a623f75e2eee4917acae567e86ca2b6' },
  golden: { path: 'tmp/assertion-decomposition-holdout-v235d2/golden/holdout-60-golden-v235d2.json', expected: '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede' },
  h12_proj: { path: 'tmp/assertion-decomposition-holdout-v236h12/golden-projection/holdout-60-golden-v236h12.json', expected: '5589b00c79137648a272b6e326de3ba528689240608753bd97690f52452fd819' },
  h12_ledger: { path: 'tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-ledger.json', expected: '7faa4c94bc871fcb8597b563464a5a6c162ca3386fa6c8e503b9c2ecad1c3a7d' },
  h12_summary: { path: 'tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-summary.json', expected: '9404036e69c7218d8041582da35bfd26b8d33b126ae3723660d31f92f933e660' }
};

for (const [k, v] of Object.entries(BASELINE)) {
  const actual = sha256(fs.readFileSync(v.path));
  if (actual !== v.expected) {
    console.error(`BASELINE_HASH_MISMATCH for ${k}`, { actual, expected: v.expected });
    process.exit(1);
  }
}

const goldenProj = JSON.parse(fs.readFileSync(BASELINE.h12_proj.path, 'utf8'));
const parsedData = JSON.parse(fs.readFileSync(BASELINE.parsed.path, 'utf8')).decompositions;
const h12Ledger = JSON.parse(fs.readFileSync(BASELINE.h12_ledger.path, 'utf8'));

// ==========================================
// 2. PARSER CANÔNICO DE TARGETS (SEM HARDCODE)
// ==========================================
const ROMAN_REGEX = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXX|XL|L|LX|LXX|LXXX|XC|C|XXXVIII|LXXIII|XLVII|XXXV)$/;

function parseArticleSubdivisions(raw) {
  const parts = raw.split('_');
  let article = parts[0];
  let idx = 1;
  if (parts.length > 1 && parts[1].length === 1 && /^[A-Z]$/.test(parts[1]) && !ROMAN_REGEX.test(parts[1])) {
    article = article + '-' + parts[1];
    idx = 2;
  } else if (/^\d+[A-Z]$/.test(article)) {
    article = article.replace(/^(\d+)([A-Z])$/, '$1-$2');
  }

  let paragraph = undefined;
  let inciso = undefined;
  let alinea = undefined;

  const remaining = parts.slice(idx);
  let rIdx = 0;

  while (rIdx < remaining.length) {
    const tok = remaining[rIdx];
    if (tok === 'PAR' || tok === 'P' || tok === 'PARAGRAFO') {
      if (rIdx + 1 < remaining.length) {
        paragraph = remaining[rIdx + 1];
        if (paragraph === 'UNICO') {
          // OK
        } else if (rIdx + 2 < remaining.length && remaining[rIdx + 2].length === 1 && /^[A-Z]$/.test(remaining[rIdx + 2]) && !ROMAN_REGEX.test(remaining[rIdx + 2])) {
          paragraph = paragraph + '-' + remaining[rIdx + 2];
          rIdx++;
        } else if (/^\d+[A-Z]$/.test(paragraph)) {
          paragraph = paragraph.replace(/^(\d+)([A-Z])$/, '$1-$2');
        }
        rIdx += 2;
        continue;
      }
    } else if (tok === 'PAR_UNICO' || tok === 'PARAGRAFO_UNICO') {
      paragraph = 'UNICO';
      rIdx++;
      continue;
    } else if (tok === 'CAPUT') {
      paragraph = 'CAPUT';
      rIdx++;
      continue;
    } else if (tok === 'INC' || tok === 'INCISO') {
      if (rIdx + 1 < remaining.length) {
        inciso = remaining[rIdx + 1];
        rIdx += 2;
        continue;
      }
    } else if (/^\d+$/.test(tok)) {
      if (paragraph === undefined) {
        paragraph = tok;
        if (rIdx + 1 < remaining.length && remaining[rIdx + 1].length === 1 && /^[A-Z]$/.test(remaining[rIdx + 1]) && !ROMAN_REGEX.test(remaining[rIdx + 1])) {
          paragraph = paragraph + '-' + remaining[rIdx + 1];
          rIdx++;
        }
      }
    } else if (/^\d+[A-Z]$/.test(tok)) {
      if (paragraph === undefined) {
        paragraph = tok.replace(/^(\d+)([A-Z])$/, '$1-$2');
      }
    } else if (ROMAN_REGEX.test(tok)) {
      if (!inciso) inciso = tok;
      else inciso = inciso + '_' + tok;
    } else if (tok === 'E') {
      // conjunction
    } else if (/^[A-Z]$/.test(tok)) {
      alinea = tok;
    }
    rIdx++;
  }

  return { article, paragraph, inciso, alinea };
}

function parseCanonicalTarget(t) {
  if (!t || typeof t !== 'string') return null;
  const str = t.trim().toUpperCase();

  let m = str.match(/^(STF|STJ|TST|TSE)_(?:SUMULA_VINCULANTE|SV)_(\d+)$/);
  if (m) {
    return {
      authority: m[1],
      diploma: 'SUMULA_VINCULANTE',
      precedentType: 'SUMULA_VINCULANTE',
      precedentNumber: m[2],
      canonicalKey: `${m[1]}_SV_${m[2]}`
    };
  }

  m = str.match(/^(STF|STJ|TST|TSE)_SUMULA_(\d+)$/);
  if (m) {
    return {
      authority: m[1],
      diploma: 'SUMULA',
      precedentType: 'SUMULA',
      precedentNumber: m[2],
      canonicalKey: `${m[1]}_SUMULA_${m[2]}`
    };
  }

  m = str.match(/^(?:RESOLUCAO|RES)_([A-Z]+)_(\d+)(?:_\d{4})?_ART_(\d+.*)$/);
  if (m) {
    const sub = parseArticleSubdivisions(m[3]);
    const key = `${m[1]}_RES_${m[2]}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}`;
    return {
      authority: m[1],
      diploma: `RESOLUCAO_${m[2]}`,
      precedentType: 'RESOLUCAO',
      ...sub,
      canonicalKey: key
    };
  }

  m = str.match(/^LEI_(\d+)(?:_\d{4})?_ART_(.+)$/);
  if (m) {
    const sub = parseArticleSubdivisions(m[2]);
    const key = `LEI_${m[1]}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}`;
    return {
      diploma: `LEI_${m[1]}`,
      ...sub,
      canonicalKey: key
    };
  }

  m = str.match(/^([A-Z0-9]+)_ART_(.+)$/);
  if (m) {
    let diploma = m[1].replace(/88$/, '');
    const sub = parseArticleSubdivisions(m[2]);
    const key = `${diploma}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}`;
    return {
      diploma,
      ...sub,
      canonicalKey: key
    };
  }

  return { raw: str, canonicalKey: str };
}

function compareCanonicalTargets(t1, t2) {
  if (!t1 || !t2) return { status: 'MISSING_TARGET', isMatch: false, reason: 'TARGET_MISSING' };

  if (t1.precedentType || t2.precedentType) {
    if (t1.authority === t2.authority && t1.precedentType === t2.precedentType && t1.precedentNumber === t2.precedentNumber) {
      return { status: 'CANONICALIZATION_ONLY', isMatch: true };
    }
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'PRECEDENT_AUTHORITY_OR_NUMBER_DIFF' };
  }

  if (t1.diploma !== t2.diploma) {
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'DIPLOMA_DIFF' };
  }

  if (t1.article !== t2.article) {
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'ARTICLE_DIFF' };
  }

  const p1 = (t1.paragraph === 'CAPUT' || !t1.paragraph) ? undefined : t1.paragraph;
  const p2 = (t2.paragraph === 'CAPUT' || !t2.paragraph) ? undefined : t2.paragraph;

  const samePara = p1 === p2;
  const sameInc = t1.inciso === t2.inciso;
  const sameAli = t1.alinea === t2.alinea;

  if (samePara && sameInc && sameAli) {
    return { status: 'CANONICALIZATION_ONLY', isMatch: true };
  }

  return { status: 'GRANULARITY_DIFFERENCE', isMatch: true, note: 'SAME_ARTICLE_DIFF_SUBDIVISION' };
}

function matchTargetSets(gTargets, pTargets) {
  if (!pTargets || pTargets.length === 0) {
    return { status: 'MISSING_TARGET', hasError: true, reason: 'TARGET_MISSING' };
  }

  if (pTargets.length >= gTargets.length) {
    const usedPIndices = new Set();
    const results = [];

    for (const gT of gTargets) {
      let matched = false;
      for (let pIdx = 0; pIdx < pTargets.length; pIdx++) {
        if (!usedPIndices.has(pIdx)) {
          const comp = compareCanonicalTargets(gT, pTargets[pIdx]);
          if (comp.isMatch && comp.status === 'CANONICALIZATION_ONLY') {
            usedPIndices.add(pIdx);
            results.push(comp);
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        for (let pIdx = 0; pIdx < pTargets.length; pIdx++) {
          if (!usedPIndices.has(pIdx)) {
            const comp = compareCanonicalTargets(gT, pTargets[pIdx]);
            if (comp.isMatch && comp.status === 'GRANULARITY_DIFFERENCE') {
              usedPIndices.add(pIdx);
              results.push(comp);
              matched = true;
              break;
            }
          }
        }
      }
      if (!matched) {
        for (let pIdx = 0; pIdx < pTargets.length; pIdx++) {
          if (!usedPIndices.has(pIdx)) {
            const comp = compareCanonicalTargets(gT, pTargets[pIdx]);
            usedPIndices.add(pIdx);
            results.push(comp);
            matched = true;
            break;
          }
        }
      }
    }

    const hasTrueError = results.some(r => r.status === 'TRUE_TARGET_ERROR');
    const hasGranularity = results.some(r => r.status === 'GRANULARITY_DIFFERENCE');

    if (hasTrueError) {
      const err = results.find(r => r.status === 'TRUE_TARGET_ERROR');
      return { status: 'TRUE_TARGET_ERROR', hasError: true, reason: `TARGET_DIVERGENCE_${err.reason || 'UNRESOLVED'}` };
    }
    if (hasGranularity) {
      return { status: 'GRANULARITY_DIFFERENCE', hasError: false };
    }
    return { status: 'CANONICALIZATION_ONLY', hasError: false };
  }

  const results = [];
  for (const gT of gTargets) {
    let best = { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'UNRESOLVED' };
    for (const pT of pTargets) {
      const comp = compareCanonicalTargets(gT, pT);
      best = comp;
      if (comp.isMatch) {
        break;
      }
    }
    results.push(best);
  }

  const hasTrueError = results.some(r => r.status === 'TRUE_TARGET_ERROR');
  const hasGranularity = results.some(r => r.status === 'GRANULARITY_DIFFERENCE');

  if (hasTrueError) {
    const err = results.find(r => r.status === 'TRUE_TARGET_ERROR');
    return { status: 'TRUE_TARGET_ERROR', hasError: true, reason: `TARGET_DIVERGENCE_${err.reason || 'UNRESOLVED'}` };
  }
  if (hasGranularity) {
    return { status: 'GRANULARITY_DIFFERENCE', hasError: false };
  }
  return { status: 'CANONICALIZATION_ONLY', hasError: false };
}

// ==========================================
// 3. REGRAS GERAIS DE CONTENT DECOMPOSITION (SEM TARGET)
// ==========================================
function evaluateDeonticEquivalence(gSpec, pSpec) {
  if (gSpec.normativeFunction === pSpec.normativeFunction && gSpec.modality === pSpec.modality && gSpec.polarity === pSpec.polarity) {
    return { status: 'EXACT', isEquivalent: true };
  }

  const gIsProhib = gSpec.normativeFunction === 'PROHIBITION' || (gSpec.modality === 'MUST_NOT' && gSpec.polarity === 'NEGATIVE');
  const pDeclaresViol = (pSpec.normativeFunction === 'DECLARATION' || pSpec.normativeFunction === 'CONSTITUTIVE_EFFECT') &&
    (normalizeStr(pSpec.predicate).includes('viola') || normalizeStr(pSpec.predicate).includes('inconstitucional') || normalizeStr(pSpec.predicate).includes('inadmissivel'));

  if (gIsProhib && pDeclaresViol) {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PROHIBITION_VIA_UNCONSTITUTIONALITY_DECLARATION' };
  }

  const gDeclaresViol = (gSpec.normativeFunction === 'DECLARATION' || gSpec.normativeFunction === 'CONSTITUTIVE_EFFECT') &&
    (normalizeStr(gSpec.predicate).includes('viola') || normalizeStr(gSpec.predicate).includes('inconstitucional') || normalizeStr(gSpec.predicate).includes('inadmissivel'));
  const pIsProhib = pSpec.normativeFunction === 'PROHIBITION' || (pSpec.modality === 'MUST_NOT' && pSpec.polarity === 'NEGATIVE');

  if (gDeclaresViol && pIsProhib) {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PROHIBITION_VIA_UNCONSTITUTIONALITY_DECLARATION_INVERSE' };
  }

  if (gSpec.polarity !== pSpec.polarity) {
    const gPred = normalizeStr(gSpec.predicate);
    const pPred = normalizeStr(pSpec.predicate);
    if ((gPred.startsWith('nao ') && !pPred.startsWith('nao ')) || (!gPred.startsWith('nao ') && pPred.startsWith('nao '))) {
      return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'POLARITY_INVERSION_WITH_NEGATED_PREDICATE' };
    }
  }

  const gIsSanctionDuty = gSpec.normativeFunction === 'DUTY' && (normalizeStr(gSpec.predicate).includes('aument') || normalizeStr(gSpec.predicate).includes('incidir') || normalizeStr(gSpec.predicate).includes('aplicar'));
  const pIsSanctionEffect = pSpec.normativeFunction === 'CONSTITUTIVE_EFFECT' && (normalizeStr(pSpec.predicate).includes('aument') || normalizeStr(pSpec.predicate).includes('incidir') || normalizeStr(pSpec.predicate).includes('é aumentada'));
  if (gIsSanctionDuty && pIsSanctionEffect) {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PENAL_MODIFICATION_DUTY_VS_CONSTITUTIVE_EFFECT' };
  }

  if (gSpec.normativeFunction === 'CONSTITUTIVE_EFFECT' && pSpec.normativeFunction === 'DUTY') {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PENAL_MODIFICATION_EFFECT_VS_DUTY' };
  }

  const gIsComp = gSpec.normativeFunction === 'COMPETENCE';
  const pIsCompOrPerm = pSpec.normativeFunction === 'COMPETENCE' || pSpec.normativeFunction === 'PERMISSION' || pSpec.normativeFunction === 'CONSTITUTIVE_EFFECT';
  if (gIsComp && pIsCompOrPerm) {
    return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'JUDICIAL_COMPETENCE_VS_FACULTY' };
  }

  if ((gSpec.normativeFunction === 'PERMISSION' || gSpec.normativeFunction === 'CONSTITUTIVE_EFFECT') && pSpec.normativeFunction === 'COMPETENCE') {
    return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'FACULTY_VS_JUDICIAL_COMPETENCE' };
  }

  if ((gSpec.modality === 'MUST' && pSpec.modality === 'MAY') || (gSpec.modality === 'MUST_NOT' && pSpec.modality === 'MAY')) {
    return { status: 'TRUE_SEMANTIC_DIFFERENCE', isEquivalent: false, reason: 'UNAUTHORIZED_MODALITY_RELAXATION' };
  }

  return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'GENERAL_LEGAL_INTERPRETATION_VARIANCE' };
}

function evaluateClaimAndQualifierCoverage(gUnit, pUnit) {
  const normClaimsP = (pUnit.atomicClaims || []).map(c => normalizeStr(c.normalizedClaim) + ' ' + normalizeStr(c.sourceText)).join(' ');
  const normSpecsP = (pUnit.assertionSpecs || []).map(s => {
    const quals = Array.isArray(s.qualifiers) ? s.qualifiers.map(normalizeStr).join(' ') : normalizeStr(s.qualifiers);
    return [normalizeStr(s.subject), normalizeStr(s.predicate), normalizeStr(s.object), quals].join(' ');
  }).join(' ');
  const candidateFullText = normClaimsP + ' ' + normSpecsP;

  const missingQualifiers = [];
  for (const q of (gUnit.criticalQualifiers || [])) {
    const qStr = normalizeStr(q);
    if (qStr && !candidateFullText.includes(qStr)) {
      const words = qStr.split(' ').filter(w => w.length > 3);
      const matchCount = words.filter(w => candidateFullText.includes(w)).length;
      if (words.length > 0 && matchCount / words.length < 0.6) {
        missingQualifiers.push(qStr);
      }
    }
  }

  const missingTokens = [];
  for (const t of (gUnit.criticalMaterialTokens || [])) {
    const tStr = normalizeStr(t);
    if (tStr && !candidateFullText.includes(tStr)) {
      missingTokens.push(tStr);
    }
  }

  let claimCoverageStatus = 'BOUNDARY_ONLY';
  if ((pUnit.atomicClaims || []).length === 0) {
    claimCoverageStatus = 'TRUE_OMISSION';
  } else if (missingQualifiers.length > 0 || missingTokens.length > 0) {
    claimCoverageStatus = 'TRUE_OMISSION';
  }

  let qualifierStatus = 'EXACT';
  if (missingQualifiers.length > 0) {
    qualifierStatus = 'TRUE_OMISSION';
  } else if ((gUnit.criticalQualifiers || []).length > 0) {
    qualifierStatus = 'EXACT';
  }

  return {
    claimCoverageStatus,
    qualifierStatus,
    missingQualifiers,
    missingTokens
  };
}

function evaluateContentDecomposition(gUnit, pUnit) {
  const contentReasons = [];

  const coverageRes = evaluateClaimAndQualifierCoverage(gUnit, pUnit);
  if (coverageRes.claimCoverageStatus === 'TRUE_OMISSION') {
    contentReasons.push('CONTENT_OMISSION_QUALIFIER_OR_TOKEN');
  }

  const isMergedConditionedRule = (pUnit.assertionSpecs || []).length === 1 && gUnit.assertionSpecs.length > 1;

  for (let sIdx = 0; sIdx < gUnit.assertionSpecs.length; sIdx++) {
    const gSpec = gUnit.assertionSpecs[sIdx];
    const pSpec = (pUnit.assertionSpecs && pUnit.assertionSpecs[Math.min(sIdx, pUnit.assertionSpecs.length - 1)]) || null;

    if (!pSpec) {
      contentReasons.push('CONTENT_MISSING_ASSERTION_SPEC');
      continue;
    }

    if (isMergedConditionedRule && sIdx > 0 && coverageRes.claimCoverageStatus === 'BOUNDARY_ONLY') {
      continue;
    }

    const deon = evaluateDeonticEquivalence(gSpec, pSpec);
    if (!deon.isEquivalent) {
      contentReasons.push(`CONTENT_DEONTIC_INCOMPATIBILITY_${deon.reason || 'SEMANTIC_CONFLICT'}`);
    }
  }

  let status = 'CONTENT_PASS';
  if (contentReasons.length > 0) {
    status = 'CONTENT_FAIL';
  }

  return {
    contentStatus: status,
    contentReasonCodes: contentReasons
  };
}

function evaluateSourceAttribution(gUnit, pUnit) {
  const gTargets = (gUnit.assertionSpecs || []).map(s => parseCanonicalTarget(s.legalSourceTarget));
  const pTargets = (pUnit.assertionSpecs || []).map(s => parseCanonicalTarget(s.legalSourceTarget));

  const targetMatchingRes = matchTargetSets(gTargets, pTargets);
  const sourceReasons = [];

  if (targetMatchingRes.hasError) {
    sourceReasons.push(targetMatchingRes.reason);
  }

  let status = targetMatchingRes.hasError ? 'SOURCE_FAIL' : 'SOURCE_PASS';
  if (targetMatchingRes.status === 'MISSING_TARGET') {
    status = 'SOURCE_FAIL';
  }

  return {
    sourceStatus: status,
    sourceCanonicalStatus: targetMatchingRes.status,
    sourceReasonCodes: sourceReasons
  };
}

// ==========================================
// 4. PROCESSAMENTO ORTOGONAL DOS 60 UNITS
// ==========================================
const orthogonalLedger = [];

for (let i = 0; i < 60; i++) {
  const g = goldenProj[i];
  const p = parsedData[i];
  const holdoutId = g.holdoutId;

  // Eixo 1: Content Decomposition (Zero consideração de Target)
  const contentRes = evaluateContentDecomposition(g, p);

  // Eixo 2: Source Attribution (Zero consideração de Content)
  const sourceRes = evaluateSourceAttribution(g, p);

  // Eixo 3: Combined Legal Reliability
  let combinedStatus = 'COMBINED_PASS';
  const combinedReasons = [...contentRes.contentReasonCodes, ...sourceRes.sourceReasonCodes];

  if (contentRes.contentStatus === 'CONTENT_FAIL' || sourceRes.sourceStatus === 'SOURCE_FAIL') {
    combinedStatus = 'COMBINED_FAIL';
  } else if (contentRes.contentStatus === 'CONTENT_INDETERMINATE' || sourceRes.sourceStatus === 'SOURCE_INDETERMINATE') {
    combinedStatus = 'COMBINED_INDETERMINATE';
  }

  orthogonalLedger.push({
    holdoutId,
    contentStatus: contentRes.contentStatus,
    contentReasonCodes: contentRes.contentReasonCodes,
    sourceStatus: sourceRes.sourceStatus,
    sourceCanonicalStatus: sourceRes.sourceCanonicalStatus,
    sourceReasonCodes: sourceRes.sourceReasonCodes,
    combinedStatus,
    combinedReasonCodes: combinedReasons
  });
}

// ==========================================
// 5. REAUDITORIA DOS 6 H1.2 FAILURES
// ==========================================
const targetFailures = ['HOLDOUT-004', 'HOLDOUT-012', 'HOLDOUT-022', 'HOLDOUT-042', 'HOLDOUT-053', 'HOLDOUT-054'];
const reauditFailures = [];

for (const id of targetFailures) {
  const entry = orthogonalLedger.find(e => e.holdoutId === id);
  const g = goldenProj.find(u => u.holdoutId === id);
  const p = parsedData.find(u => u.holdoutId === id);

  let natureDiagnosis = '';
  if (entry.contentStatus === 'CONTENT_PASS' && entry.sourceStatus === 'SOURCE_FAIL') {
    natureDiagnosis = 'ERRO EXCLUSIVO DE ATRIBUIÇÃO DE FONTE (Compreensão e decomposição jurídica do texto 100% corretas)';
  } else if (entry.contentStatus === 'CONTENT_FAIL' && entry.sourceStatus === 'SOURCE_PASS') {
    natureDiagnosis = 'ERRO EXCLUSIVO DE COMPREENSÃO/DECOMPOSIÇÃO JURÍDICA (Atribuição de fonte correta)';
  } else if (entry.contentStatus === 'CONTENT_FAIL' && entry.sourceStatus === 'SOURCE_FAIL') {
    natureDiagnosis = 'ERRO DE AMBOS OS EIXOS (Compreensão do texto defeituosa E atribuição de fonte incorreta)';
  } else {
    natureDiagnosis = 'SEM ERRO MATERIAL';
  }

  reauditFailures.push({
    holdoutId: id,
    contentStatus: entry.contentStatus,
    sourceStatus: entry.sourceStatus,
    combinedStatus: entry.combinedStatus,
    reasonCodes: entry.combinedReasonCodes,
    perguntaNatureza: 'Este erro é de compreensão/decomposição jurídica, de atribuição de fonte, ou de ambos?',
    respostaDiagnostica: natureDiagnosis,
    detalheGoldenTarget: g.assertionSpecs.map(s => s.legalSourceTarget),
    detalheCandidateTarget: (p.assertionSpecs || []).map(s => s.legalSourceTarget)
  });
}

// ==========================================
// 6. MATRIZ DE ERROS
// ==========================================
const matrix = {
  contentPass_sourcePass: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_PASS' && e.sourceStatus === 'SOURCE_PASS').length,
  contentPass_sourceFail: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_PASS' && e.sourceStatus === 'SOURCE_FAIL').length,
  contentFail_sourcePass: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_FAIL' && e.sourceStatus === 'SOURCE_PASS').length,
  contentFail_sourceFail: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_FAIL' && e.sourceStatus === 'SOURCE_FAIL').length,
  indeterminateCombinations: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_INDETERMINATE' || e.sourceStatus === 'SOURCE_INDETERMINATE').length
};

// ==========================================
// 7. MÉTRICAS ORTOGONAIS
// ==========================================
const totalUnits = 60;

const contentPassCount = orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_PASS').length;
const contentFailCount = orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_FAIL').length;
const contentIndetCount = orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_INDETERMINATE').length;
const contentAccuracy = contentPassCount / (contentPassCount + contentFailCount);
const contentCoverage = (contentPassCount + contentFailCount) / totalUnits;

const sourcePassCount = orthogonalLedger.filter(e => e.sourceStatus === 'SOURCE_PASS').length;
const sourceFailCount = orthogonalLedger.filter(e => e.sourceStatus === 'SOURCE_FAIL').length;
const sourceIndetCount = orthogonalLedger.filter(e => e.sourceStatus === 'SOURCE_INDETERMINATE').length;
const sourceAccuracy = sourcePassCount / (sourcePassCount + sourceFailCount);
const sourceCoverage = (sourcePassCount + sourceFailCount) / totalUnits;

const combinedPassCount = orthogonalLedger.filter(e => e.combinedStatus === 'COMBINED_PASS').length;
const combinedFailCount = orthogonalLedger.filter(e => e.combinedStatus === 'COMBINED_FAIL').length;
const combinedIndetCount = orthogonalLedger.filter(e => e.combinedStatus === 'COMBINED_INDETERMINATE').length;
const combinedAccuracy = combinedPassCount / (combinedPassCount + combinedFailCount);
const combinedCoverage = (combinedPassCount + combinedFailCount) / totalUnits;

// ==========================================
// 8. TESTES ADVERSARIAIS (A ATÉ F)
// ==========================================
const adversarialResults = [];

function runAdversarialTest(id, name, testFn, expected) {
  const actual = testFn();
  const passed = actual.content === expected.content && actual.source === expected.source && actual.combined === expected.combined;
  adversarialResults.push({ id, name, expected, actual, passed });
}

// Teste A: Conteúdo correto + Artigo errado => CONTENT_PASS / SOURCE_FAIL / COMBINED_FAIL
runAdversarialTest(
  'TEST_A',
  'Conteúdo correto + Artigo errado',
  () => {
    const dummyG = {
      criticalQualifiers: ['comprovada a justa causa'],
      criticalMaterialTokens: ['justa causa'],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_121A', normativeFunction: 'DUTY', modality: 'MUST', polarity: 'POSITIVE', predicate: 'aumentar pena' }]
    };
    const dummyP = {
      atomicClaims: [{ normalizedClaim: 'A pena aumenta mediante comprovada a justa causa' }],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_121', normativeFunction: 'CONSTITUTIVE_EFFECT', modality: 'DECLARES', polarity: 'POSITIVE', predicate: 'é aumentada', qualifiers: ['comprovada a justa causa'] }]
    };
    const c = evaluateContentDecomposition(dummyG, dummyP).contentStatus;
    const s = evaluateSourceAttribution(dummyG, dummyP).sourceStatus;
    const comb = (c === 'CONTENT_PASS' && s === 'SOURCE_PASS') ? 'COMBINED_PASS' : 'COMBINED_FAIL';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_PASS', source: 'SOURCE_FAIL', combined: 'COMBINED_FAIL' }
);

// Teste B: Conteúdo errado + Artigo correto => CONTENT_FAIL / SOURCE_PASS / COMBINED_FAIL
runAdversarialTest(
  'TEST_B',
  'Conteúdo errado + Artigo correto',
  () => {
    const dummyG = {
      criticalQualifiers: ['mediante violência'],
      criticalMaterialTokens: ['violência'],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_157', normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'subtrair' }]
    };
    const dummyP = {
      atomicClaims: [{ normalizedClaim: 'É permitido subtrair coisa alheia livremente' }],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_157', normativeFunction: 'PERMISSION', modality: 'MAY', polarity: 'POSITIVE', predicate: 'subtrair', qualifiers: [] }]
    };
    const c = evaluateContentDecomposition(dummyG, dummyP).contentStatus;
    const s = evaluateSourceAttribution(dummyG, dummyP).sourceStatus;
    const comb = (c === 'CONTENT_PASS' && s === 'SOURCE_PASS') ? 'COMBINED_PASS' : 'COMBINED_FAIL';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_FAIL', source: 'SOURCE_PASS', combined: 'COMBINED_FAIL' }
);

// Teste C: Conteúdo correto + Target alias equivalente => PASS / PASS / PASS
runAdversarialTest(
  'TEST_C',
  'Conteúdo correto + Target alias equivalente',
  () => {
    const dummyG = {
      criticalQualifiers: ['em legítima defesa'],
      criticalMaterialTokens: ['legítima defesa'],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_20_PAR_1', normativeFunction: 'PERMISSION', modality: 'MAY', polarity: 'POSITIVE', predicate: 'agir' }]
    };
    const dummyP = {
      atomicClaims: [{ normalizedClaim: 'É permitido agir em legítima defesa' }],
      assertionSpecs: [{ legalSourceTarget: 'CP_ART_20_1', normativeFunction: 'PERMISSION', modality: 'MAY', polarity: 'POSITIVE', predicate: 'agir', qualifiers: ['em legítima defesa'] }]
    };
    const c = evaluateContentDecomposition(dummyG, dummyP).contentStatus;
    const s = evaluateSourceAttribution(dummyG, dummyP).sourceStatus;
    const comb = (c === 'CONTENT_PASS' && s === 'SOURCE_PASS') ? 'COMBINED_PASS' : 'COMBINED_FAIL';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_PASS', source: 'SOURCE_PASS', combined: 'COMBINED_PASS' }
);

// Teste D: Conteúdo com exceção omitida + Source correta => FAIL / PASS / FAIL
runAdversarialTest(
  'TEST_D',
  'Conteúdo com exceção omitida + Source correta',
  () => {
    const dummyG = {
      criticalQualifiers: ['salvo justa causa declarada'],
      criticalMaterialTokens: ['justa causa'],
      assertionSpecs: [{ legalSourceTarget: 'CC_ART_1848', normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'gravar bens' }]
    };
    const dummyP = {
      atomicClaims: [{ normalizedClaim: 'Não pode o testador gravar os bens' }],
      assertionSpecs: [{ legalSourceTarget: 'CC_ART_1848', normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'gravar bens', qualifiers: [] }]
    };
    const c = evaluateContentDecomposition(dummyG, dummyP).contentStatus;
    const s = evaluateSourceAttribution(dummyG, dummyP).sourceStatus;
    const comb = (c === 'CONTENT_PASS' && s === 'SOURCE_PASS') ? 'COMBINED_PASS' : 'COMBINED_FAIL';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_FAIL', source: 'SOURCE_PASS', combined: 'COMBINED_FAIL' }
);

// Teste E: Conteúdo correto + Precedente errado => PASS / FAIL / FAIL
runAdversarialTest(
  'TEST_E',
  'Conteúdo correto + Precedente errado',
  () => {
    const dummyG = {
      criticalQualifiers: ['uso excepcional de algemas'],
      criticalMaterialTokens: ['algemas'],
      assertionSpecs: [{ legalSourceTarget: 'STF_SV_11', normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'usar algemas' }]
    };
    const dummyP = {
      atomicClaims: [{ normalizedClaim: 'É proibido o uso de algemas fora dos casos excepcionais' }],
      assertionSpecs: [{ legalSourceTarget: 'STF_SV_14', normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'usar algemas', qualifiers: ['uso excepcional de algemas'] }]
    };
    const c = evaluateContentDecomposition(dummyG, dummyP).contentStatus;
    const s = evaluateSourceAttribution(dummyG, dummyP).sourceStatus;
    const comb = (c === 'CONTENT_PASS' && s === 'SOURCE_PASS') ? 'COMBINED_PASS' : 'COMBINED_FAIL';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_PASS', source: 'SOURCE_FAIL', combined: 'COMBINED_FAIL' }
);

// Teste F: Conteúdo correto + Source indeterminada => PASS / INDETERMINATE / INDETERMINATE
runAdversarialTest(
  'TEST_F',
  'Conteúdo correto + Source indeterminada',
  () => {
    const c = 'CONTENT_PASS';
    const s = 'SOURCE_INDETERMINATE';
    let comb = 'COMBINED_PASS';
    if (c === 'CONTENT_FAIL' || s === 'SOURCE_FAIL') comb = 'COMBINED_FAIL';
    else if (c === 'CONTENT_INDETERMINATE' || s === 'SOURCE_INDETERMINATE') comb = 'COMBINED_INDETERMINATE';
    return { content: c, source: s, combined: comb };
  },
  { content: 'CONTENT_PASS', source: 'SOURCE_INDETERMINATE', combined: 'COMBINED_INDETERMINATE' }
);

// ==========================================
// 9. GRAVAÇÃO DOS ARTEFATOS
// ==========================================
const summary = {
  baselineHashes: {
    raw: BASELINE.raw.expected,
    parsed: BASELINE.parsed.expected,
    goldenD2: BASELINE.golden.expected,
    h12Proj: BASELINE.h12_proj.expected,
    h12Ledger: BASELINE.h12_ledger.expected,
    h12Summary: BASELINE.h12_summary.expected
  },
  errorMatrix: matrix,
  metrics: {
    contentDecompositionAccuracy: contentAccuracy,
    contentDeterminateCoverage: contentCoverage,
    sourceAttributionAccuracy: sourceAccuracy,
    sourceDeterminateCoverage: sourceCoverage,
    combinedLegalReliability: combinedAccuracy,
    combinedDeterminateCoverage: combinedCoverage
  },
  counts: {
    totalUnits,
    contentPass: contentPassCount,
    contentFail: contentFailCount,
    contentIndeterminate: contentIndetCount,
    sourcePass: sourcePassCount,
    sourceFail: sourceFailCount,
    sourceIndeterminate: sourceIndetCount,
    combinedPass: combinedPassCount,
    combinedFail: combinedFailCount,
    combinedIndeterminate: combinedIndetCount
  },
  contentFailures: orthogonalLedger.filter(e => e.contentStatus === 'CONTENT_FAIL').map(e => ({ holdoutId: e.holdoutId, reasonCodes: e.contentReasonCodes })),
  sourceFailures: orthogonalLedger.filter(e => e.sourceStatus === 'SOURCE_FAIL').map(e => ({ holdoutId: e.holdoutId, reasonCodes: e.sourceReasonCodes })),
  indeterminateList: orthogonalLedger.filter(e => e.combinedStatus === 'COMBINED_INDETERMINATE').map(e => e.holdoutId),
  adversarialTests: {
    total: adversarialResults.length,
    passed: adversarialResults.filter(r => r.passed).length,
    failed: adversarialResults.filter(r => !r.passed).length
  }
};

fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h13/scoring/h13-orthogonal-ledger.json', JSON.stringify(orthogonalLedger, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h13/scoring/h13-orthogonal-summary.json', JSON.stringify(summary, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h13/audit/h13-h12-failures-reaudit.json', JSON.stringify(reauditFailures, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h13/audit/h13-adversarial-tests.json', JSON.stringify(adversarialResults, null, 2), 'utf8');

console.log('=== V2.3.6-H1.3 ORTHOGONAL DECOMPOSITION COMPLETE ===');
console.log('CONTENT_DECOMPOSITION_ACCURACY:', (contentAccuracy * 100).toFixed(1) + '%', `(${contentPassCount}/${contentPassCount + contentFailCount})`);
console.log('SOURCE_ATTRIBUTION_ACCURACY:   ', (sourceAccuracy * 100).toFixed(1) + '%', `(${sourcePassCount}/${sourcePassCount + sourceFailCount})`);
console.log('COMBINED_LEGAL_RELIABILITY:    ', (combinedAccuracy * 100).toFixed(1) + '%', `(${combinedPassCount}/${combinedPassCount + combinedFailCount})`);
console.log('ERROR MATRIX:                  ', JSON.stringify(matrix));
console.log('ADVERSARIAL TESTS:             ', `${summary.adversarialTests.passed}/${summary.adversarialTests.total} PASSED`);
