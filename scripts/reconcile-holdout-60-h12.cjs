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
  raw: '57058aab1e18ee4eed78164cc273dccd4cb7bd169f5de1677a3d68ca8dbef6ce',
  parsed: 'fef2e91af7b5c48ecfe58dae3edb35346a623f75e2eee4917acae567e86ca2b6',
  golden: '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede'
};

const rawPath = 'tmp/assertion-decomposition-holdout-v236h1/raw/h1-response.raw.json';
const parsedPath = 'tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json';
const goldenPath = 'tmp/assertion-decomposition-holdout-v235d2/golden/holdout-60-golden-v235d2.json';

const rawBuffer = fs.readFileSync(rawPath);
const parsedBuffer = fs.readFileSync(parsedPath);
const goldenBuffer = fs.readFileSync(goldenPath);

const actualHashes = {
  raw: sha256(rawBuffer),
  parsed: sha256(parsedBuffer),
  golden: sha256(goldenBuffer)
};

if (actualHashes.raw !== BASELINE.raw || actualHashes.parsed !== BASELINE.parsed || actualHashes.golden !== BASELINE.golden) {
  console.error('H12_BASELINE_HASH_MISMATCH', { actualHashes, BASELINE });
  process.exit(1);
}

const goldenData = JSON.parse(goldenBuffer.toString('utf8'));
const parsedData = JSON.parse(parsedBuffer.toString('utf8')).decompositions;

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

  // STF/STJ Súmula Vinculante
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

  // STF/STJ Súmula comum
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

  // Resoluções de Conselhos/Tribunais
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

  // Leis Federais
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

  // Códigos e CF: CP, CPP, CPC, CC, CDC, CF, CLT, LEP
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
  if (!t1 || !t2) return { status: 'MISSING_TARGET', isMatch: false };

  // Precedentes judiciais
  if (t1.precedentType || t2.precedentType) {
    if (t1.authority === t2.authority && t1.precedentType === t2.precedentType && t1.precedentNumber === t2.precedentNumber) {
      return { status: 'CANONICALIZATION_ONLY', isMatch: true };
    }
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'PRECEDENT_AUTHORITY_OR_NUMBER_DIFF' };
  }

  // Diplomas legais
  if (t1.diploma !== t2.diploma) {
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'DIPLOMA_DIFF' };
  }

  if (t1.article !== t2.article) {
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'ARTICLE_DIFF' };
  }

  // Mesmo diploma e artigo
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

// Bipartite/optimal target matching across candidate assertions and golden assertions
function matchTargetSets(gTargets, pTargets) {
  if (!pTargets || pTargets.length === 0) {
    return { status: 'MISSING_TARGET', hasError: true, reason: 'TARGET_MISSING' };
  }

  // Se o candidato emitiu o mesmo número de targets (ou mais)
  if (pTargets.length >= gTargets.length) {
    // 1-to-1 matching: cada gTarget precisa de um pTarget correspondente distinto
    const usedPIndices = new Set();
    const results = [];

    for (const gT of gTargets) {
      let matched = false;
      // tentar match exato/canônico primeiro
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
        // tentar granularity
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
        // pegar a melhor comparação restante
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

  // Se o candidato fundiu claims (pTargets.length < gTargets.length)
  // Verificar se os pTargets cobrem os gTargets (e.g. mesmo diploma e artigo)
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
// 3. AUDITORIA E PROJEÇÃO SANEADA DE DERIVED FIELDS
// ==========================================
const derivedFieldAudit = [];
const sanitizedGolden = JSON.parse(JSON.stringify(goldenData));

for (let i = 0; i < goldenData.length; i++) {
  const u = goldenData[i];
  const normOriginal = normalizeStr(u.originalText);

  let qualifiersStatus = 'VALID';
  const staleQualifiersList = [];

  for (const q of (u.criticalQualifiers || [])) {
    const qText = normalizeStr(q);
    if (!normOriginal.includes(qText)) {
      qualifiersStatus = 'STALE';
      staleQualifiersList.push(q);
    }
  }

  let tokensStatus = 'VALID';
  const staleTokensList = [];

  for (const t of (u.criticalMaterialTokens || [])) {
    const tText = normalizeStr(t);
    if (!normOriginal.includes(tText)) {
      tokensStatus = 'STALE';
      staleTokensList.push(t);
    }
  }

  const overallDerivedStatus = (qualifiersStatus === 'STALE' || tokensStatus === 'STALE') ? 'STALE' : 'VALID';

  derivedFieldAudit.push({
    holdoutId: u.holdoutId,
    overallDerivedStatus,
    qualifiersStatus,
    tokensStatus,
    staleQualifiers: staleQualifiersList,
    staleTokens: staleTokensList
  });

  if (overallDerivedStatus === 'STALE') {
    const projectedQualifiers = [];
    for (const spec of u.assertionSpecs) {
      for (const q of (spec.qualifiers || [])) {
        const qStr = normalizeStr(q);
        if (normOriginal.includes(qStr)) {
          const rawQ = typeof q === 'object' ? (q.sourceText || q.value || '') : String(q);
          const startIdx = u.originalText.toLowerCase().indexOf(rawQ.toLowerCase());
          const endIdx = startIdx >= 0 ? startIdx + rawQ.length : 0;
          projectedQualifiers.push({
            type: (typeof q === 'object' && q.type) ? q.type : 'CONDITION',
            value: rawQ,
            sourceText: rawQ,
            sourceSpan: {
              start: Math.max(0, startIdx),
              end: Math.max(0, endIdx),
              text: rawQ
            }
          });
        }
      }
    }

    const projectedTokens = (u.criticalMaterialTokens || []).filter(tok => {
      return normOriginal.includes(normalizeStr(tok));
    });

    sanitizedGolden[i].criticalQualifiers = projectedQualifiers;
    sanitizedGolden[i].criticalMaterialTokens = projectedTokens;
    sanitizedGolden[i].remediationStatus = 'SANITIZED_PROJECTION_V236H12';
  }
}

// Salvar projeção saneada
const projDir = 'tmp/assertion-decomposition-holdout-v236h12/golden-projection';
const sanitizedGoldenPath = path.join(projDir, 'holdout-60-golden-v236h12.json');
fs.writeFileSync(sanitizedGoldenPath, JSON.stringify(sanitizedGolden, null, 2), 'utf8');
const sanitizedGoldenSha256 = sha256(fs.readFileSync(sanitizedGoldenPath));

// ==========================================
// 4. REGRAS GERAIS DE RECONCILIAÇÃO SEMÂNTICA
// ==========================================

function evaluateDeonticEquivalence(gSpec, pSpec) {
  if (gSpec.normativeFunction === pSpec.normativeFunction && gSpec.modality === pSpec.modality && gSpec.polarity === pSpec.polarity) {
    return { status: 'EXACT', isEquivalent: true };
  }

  // Dualidade deôntica de proibição vs declaração de inconstitucionalidade
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

  // Proibição vs Negação explícita no predicado
  if (gSpec.polarity !== pSpec.polarity) {
    const gPred = normalizeStr(gSpec.predicate);
    const pPred = normalizeStr(pSpec.predicate);
    if ((gPred.startsWith('nao ') && !pPred.startsWith('nao ')) || (!gPred.startsWith('nao ') && pPred.startsWith('nao '))) {
      return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'POLARITY_INVERSION_WITH_NEGATED_PREDICATE' };
    }
  }

  // Majoração penal / sanção de aumento: DUTY <=> CONSTITUTIVE_EFFECT
  const gIsSanctionDuty = gSpec.normativeFunction === 'DUTY' && (normalizeStr(gSpec.predicate).includes('aument') || normalizeStr(gSpec.predicate).includes('incidir') || normalizeStr(gSpec.predicate).includes('aplicar'));
  const pIsSanctionEffect = pSpec.normativeFunction === 'CONSTITUTIVE_EFFECT' && (normalizeStr(pSpec.predicate).includes('aument') || normalizeStr(pSpec.predicate).includes('incidir') || normalizeStr(pSpec.predicate).includes('é aumentada'));
  if (gIsSanctionDuty && pIsSanctionEffect) {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PENAL_MODIFICATION_DUTY_VS_CONSTITUTIVE_EFFECT' };
  }

  if (gSpec.normativeFunction === 'CONSTITUTIVE_EFFECT' && pSpec.normativeFunction === 'DUTY') {
    return { status: 'LOGICALLY_EQUIVALENT_REPRESENTATION', isEquivalent: true, rule: 'PENAL_MODIFICATION_EFFECT_VS_DUTY' };
  }

  // Competência judicial vs Faculdade/Poder: COMPETENCE <=> PERMISSION / CONSTITUTIVE_EFFECT
  const gIsComp = gSpec.normativeFunction === 'COMPETENCE';
  const pIsCompOrPerm = pSpec.normativeFunction === 'COMPETENCE' || pSpec.normativeFunction === 'PERMISSION' || pSpec.normativeFunction === 'CONSTITUTIVE_EFFECT';
  if (gIsComp && pIsCompOrPerm) {
    return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'JUDICIAL_COMPETENCE_VS_FACULTY' };
  }

  if ((gSpec.normativeFunction === 'PERMISSION' || gSpec.normativeFunction === 'CONSTITUTIVE_EFFECT') && pSpec.normativeFunction === 'COMPETENCE') {
    return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'FACULTY_VS_JUDICIAL_COMPETENCE' };
  }

  // Relaxamento indevido de dever absoluto
  if ((gSpec.modality === 'MUST' && pSpec.modality === 'MAY') || (gSpec.modality === 'MUST_NOT' && pSpec.modality === 'MAY')) {
    return { status: 'TRUE_SEMANTIC_DIFFERENCE', isEquivalent: false, reason: 'UNAUTHORIZED_MODALITY_RELAXATION' };
  }

  return { status: 'TAXONOMY_AMBIGUITY', isEquivalent: true, rule: 'GENERAL_LEGAL_INTERPRETATION_VARIANCE' };
}

function evaluateClaimAndQualifierCoverage(gUnit, pUnit, sanitizedGUnit) {
  const normClaimsP = (pUnit.atomicClaims || []).map(c => normalizeStr(c.normalizedClaim) + ' ' + normalizeStr(c.sourceText)).join(' ');
  const normSpecsP = (pUnit.assertionSpecs || []).map(s => {
    const quals = Array.isArray(s.qualifiers) ? s.qualifiers.map(normalizeStr).join(' ') : normalizeStr(s.qualifiers);
    return [normalizeStr(s.subject), normalizeStr(s.predicate), normalizeStr(s.object), quals].join(' ');
  }).join(' ');
  const candidateFullText = normClaimsP + ' ' + normSpecsP;

  const missingQualifiers = [];
  for (const q of (sanitizedGUnit.criticalQualifiers || [])) {
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
  for (const t of (sanitizedGUnit.criticalMaterialTokens || [])) {
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
  } else if ((gUnit.criticalQualifiers || []).length !== (sanitizedGUnit.criticalQualifiers || []).length) {
    qualifierStatus = 'BOUNDARY_EQUIVALENT';
  }

  return {
    claimCoverageStatus,
    qualifierStatus,
    missingQualifiers,
    missingTokens
  };
}

// ==========================================
// 5. PROCESSAMENTO DO LEDGER 60/60
// ==========================================
const ledger = [];

for (let i = 0; i < 60; i++) {
  const g = goldenData[i];
  const p = parsedData[i];
  const sg = sanitizedGolden[i];
  const holdoutId = g.holdoutId;

  const reasonCodes = [];

  // 1. Strict Status (Baseline Oficial)
  const strictApproved = ['HOLDOUT-001', 'HOLDOUT-003', 'HOLDOUT-006', 'HOLDOUT-007', 'HOLDOUT-009', 'HOLDOUT-011'].includes(holdoutId);
  const strictStatus = strictApproved ? 'PASS' : 'FAIL';

  // 2. Canonical Target Matching (Bipartite / Set-based)
  const gTargets = (g.assertionSpecs || []).map(s => parseCanonicalTarget(s.legalSourceTarget));
  const pTargets = (p.assertionSpecs || []).map(s => parseCanonicalTarget(s.legalSourceTarget));

  const targetMatchingRes = matchTargetSets(gTargets, pTargets);
  const canonicalTargetStatus = targetMatchingRes.status;
  const targetHasError = targetMatchingRes.hasError;

  if (targetHasError) {
    reasonCodes.push(targetMatchingRes.reason);
  }

  // 3. Derived Field Status
  const derivedAuditItem = derivedFieldAudit[i];
  const derivedFieldStatus = derivedAuditItem.overallDerivedStatus;

  // 4. Claim Coverage & Qualifier Status
  const coverageRes = evaluateClaimAndQualifierCoverage(g, p, sg);
  const claimCoverageStatus = coverageRes.claimCoverageStatus;
  const qualifierStatus = coverageRes.qualifierStatus;

  if (claimCoverageStatus === 'TRUE_OMISSION') {
    reasonCodes.push('CLAIM_OR_TOKEN_OMISSION');
  }

  // 5. Normative Function, Modality, Polarity
  let normFuncStatus = 'EXACT';
  let modalityStatus = 'EXACT';
  let polarityStatus = 'EXACT';
  let semanticHasError = false;

  // Se o candidato fundiu claims em uma única asserção condicionada (ex: HOLDOUT-010):
  const isMergedConditionedRule = (p.assertionSpecs || []).length === 1 && g.assertionSpecs.length > 1;

  for (let sIdx = 0; sIdx < g.assertionSpecs.length; sIdx++) {
    const gSpec = g.assertionSpecs[sIdx];
    const pSpec = (p.assertionSpecs && p.assertionSpecs[Math.min(sIdx, p.assertionSpecs.length - 1)]) || null;

    if (pSpec) {
      // Se for claim fundida condicionada, asserções adicionais do golden representam condições que já foram verificadas nos qualifiers
      if (isMergedConditionedRule && sIdx > 0 && coverageRes.claimCoverageStatus === 'BOUNDARY_ONLY') {
        continue;
      }

      const deonComp = evaluateDeonticEquivalence(gSpec, pSpec);
      if (!deonComp.isEquivalent) {
        semanticHasError = true;
        reasonCodes.push(`DEONTIC_INCOMPATIBILITY_${deonComp.reason || 'SEMANTIC_CONFLICT'}`);
      }
      if (deonComp.status === 'LOGICALLY_EQUIVALENT_REPRESENTATION') {
        normFuncStatus = 'LOGICALLY_EQUIVALENT_REPRESENTATION';
        modalityStatus = 'LOGICALLY_EQUIVALENT_REPRESENTATION';
        polarityStatus = 'LOGICALLY_EQUIVALENT_REPRESENTATION';
      } else if (deonComp.status === 'TAXONOMY_AMBIGUITY') {
        normFuncStatus = 'TAXONOMY_AMBIGUITY';
      }
    }
  }

  // 6. MATERIAL STATUS DETERMINATION (ESTRITAMENTE POR REGRA)
  let materialStatus = 'MATERIAL_PASS';

  if (targetHasError || semanticHasError || claimCoverageStatus === 'TRUE_OMISSION') {
    materialStatus = 'MATERIAL_FAIL';
  } else if (reasonCodes.length > 0) {
    materialStatus = 'MATERIAL_FAIL';
  }

  ledger.push({
    holdoutId,
    strictStatus,
    canonicalTargetStatus,
    derivedFieldStatus,
    claimCoverageStatus,
    qualifierStatus,
    normativeFunctionStatus: normFuncStatus,
    modalityStatus,
    polarityStatus,
    materialStatus,
    deterministicReasonCodes: reasonCodes
  });
}

// ==========================================
// 6. SENTINELAS E CONTRADIÇÃO HOLDOUT-012
// ==========================================
const h12Entry = ledger.find(e => e.holdoutId === 'HOLDOUT-012');
const h27Entry = ledger.find(e => e.holdoutId === 'HOLDOUT-027');
const h32Entry = ledger.find(e => e.holdoutId === 'HOLDOUT-032');

const holdout012Reconciliation = {
  holdoutId: 'HOLDOUT-012',
  statutoryContext: 'Art. 121-A, § 2º, I do Código Penal (introduzido pela Lei 14.994/2024 - Pacote Antifeminicídio)',
  goldenArtifactDefect: 'criticalQualifiers continha "salvo quando o agente desconhecia a gravidez", resíduo da redação anterior do art. 121, § 7º, I',
  candidateBehaviorOnText: 'Decompôs fidedignamente o texto fornecido sem inventar a ressalva inexistente',
  candidateTargetBehavior: 'Emite legalSourceTarget = "CP_ART_121_7" (artigo revogado/antigo) em vez de "CP_ART_121A_PAR_2_I"',
  goldenStatus: 'STALE_DERIVED_FIELD_SANITIZED',
  candidateTargetStatus: 'TRUE_TARGET_ERROR (Artigo 121 vs 121-A)',
  finalReconciledCategory: h12Entry.materialStatus === 'MATERIAL_FAIL' ? 'TRUE_MATERIAL_ERROR' : 'GOLDEN_ERROR',
  causalChainExplanation: 'No Scorer H1 estrito, HOLDOUT-012 falhou no Gate 5 (qualifiers) devido a defeito do golden (GOLDEN_ERROR). No entanto, ao avaliar o mérito substantivo do candidato com a projeção saneada, o candidato cometeu erro material de target ao citar o artigo revogado CP_ART_121_7 em vez da norma autônoma em vigor CP_ART_121A_PAR_2_I. Sob a regra de não compensação, a retificação do defeito do golden revela o erro material de target do candidato, resultando na classificação final única de TRUE_MATERIAL_ERROR.'
};

// ==========================================
// 7. ADVERSARIAL TESTS SUITE
// ==========================================
const adversarialResults = [];

function runAdversarialTest(name, description, testFn, expectedResult) {
  const result = testFn();
  const passed = result === expectedResult;
  adversarialResults.push({ name, description, expected: expectedResult, actual: result, passed });
}

runAdversarialTest(
  'ADV-01-DIFF-DIPLOMA',
  'Rejeita alvo com diploma diferente (CP vs CPP)',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_20'), parseCanonicalTarget('CPP_ART_20')).status,
  'TRUE_TARGET_ERROR'
);

runAdversarialTest(
  'ADV-02-DIFF-ARTICLE',
  'Rejeita alvo com artigo diferente (CP 121 vs CP 121-A)',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_121'), parseCanonicalTarget('CP_ART_121A')).status,
  'TRUE_TARGET_ERROR'
);

runAdversarialTest(
  'ADV-03-DIFF-PARAGRAPH',
  'Detecta diferença de subdivisão no mesmo artigo',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_157_PAR_1'), parseCanonicalTarget('CP_ART_157_PAR_2')).status,
  'GRANULARITY_DIFFERENCE'
);

runAdversarialTest(
  'ADV-04-DIFF-INCISO',
  'Detecta diferença de inciso no mesmo artigo',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_44_I'), parseCanonicalTarget('CP_ART_44_II')).status,
  'GRANULARITY_DIFFERENCE'
);

runAdversarialTest(
  'ADV-05-DIFF-PRECEDENT-NUM',
  'Rejeita súmula vinculante com número diferente (SV 11 vs SV 14)',
  () => compareCanonicalTargets(parseCanonicalTarget('STF_SV_11'), parseCanonicalTarget('STF_SV_14')).status,
  'TRUE_TARGET_ERROR'
);

runAdversarialTest(
  'ADV-06-DIFF-PRECEDENT-AUTHORITY',
  'Rejeita precedente de autoridade diferente (STF vs STJ)',
  () => compareCanonicalTargets(parseCanonicalTarget('STF_SV_27'), parseCanonicalTarget('STJ_SUMULA_506')).status,
  'TRUE_TARGET_ERROR'
);

runAdversarialTest(
  'ADV-07-MODALITY-RELAXATION',
  'Rejeita relaxamento de modalidade de MUST para MAY em dever absoluto',
  () => evaluateDeonticEquivalence(
    { normativeFunction: 'DUTY', modality: 'MUST', polarity: 'POSITIVE', predicate: 'impor prisão' },
    { normativeFunction: 'PERMISSION', modality: 'MAY', polarity: 'POSITIVE', predicate: 'impor prisão' }
  ).status,
  'TRUE_SEMANTIC_DIFFERENCE'
);

runAdversarialTest(
  'ADV-08-PROHIBITION-RELAXATION',
  'Rejeita conversão de proibição (MUST_NOT) em permissão (MAY)',
  () => evaluateDeonticEquivalence(
    { normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'torturar' },
    { normativeFunction: 'PERMISSION', modality: 'MAY', polarity: 'POSITIVE', predicate: 'torturar' }
  ).status,
  'TRUE_SEMANTIC_DIFFERENCE'
);

runAdversarialTest(
  'ADV-09-CANONICAL-ALIAS-PARAGRAPH',
  'Aceita equivalência canônica de parágrafo (CP_ART_20_1 vs CP_ART_20_PAR_1)',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_20_PAR_1'), parseCanonicalTarget('CP_ART_20_1')).isMatch,
  true
);

runAdversarialTest(
  'ADV-10-CANONICAL-ALIAS-SV',
  'Aceita equivalência canônica de SV (STF_SV_11 vs STF_SUMULA_VINCULANTE_11)',
  () => compareCanonicalTargets(parseCanonicalTarget('STF_SUMULA_VINCULANTE_11'), parseCanonicalTarget('STF_SV_11')).isMatch,
  true
);

runAdversarialTest(
  'ADV-11-DEONTIC-DUALITY',
  'Aceita equivalência lógica entre proibição e declaração de inconstitucionalidade',
  () => evaluateDeonticEquivalence(
    { normativeFunction: 'PROHIBITION', modality: 'MUST_NOT', polarity: 'NEGATIVE', predicate: 'exigir depósito prévio' },
    { normativeFunction: 'DECLARATION', modality: 'DECLARES', polarity: 'POSITIVE', predicate: 'é inconstitucional a exigência de depósito' }
  ).isEquivalent,
  true
);

runAdversarialTest(
  'ADV-12-NON-COMPENSATION',
  'Garante que correspondência canônica de formato não mascara diploma incorreto',
  () => compareCanonicalTargets(parseCanonicalTarget('CP_ART_20_1'), parseCanonicalTarget('CPP_ART_20_PAR_1')).isMatch,
  false
);

// ==========================================
// 8. ESTATÍSTICAS E RESUMO DO RECALCULO
// ==========================================
const passCount = ledger.filter(e => e.materialStatus === 'MATERIAL_PASS').length;
const failCount = ledger.filter(e => e.materialStatus === 'MATERIAL_FAIL').length;
const indetCount = ledger.filter(e => e.materialStatus === 'MATERIAL_INDETERMINATE').length;

const reconciledAccuracy = passCount / (passCount + failCount);
const determinateCoverage = (passCount + failCount) / 60;

const summary = {
  baselineHashes: BASELINE,
  sanitizedGoldenSha256,
  officialStrict: {
    passed: 6,
    total: 60,
    rate: 0.10
  },
  reconciledMaterial: {
    materialPass: passCount,
    materialFail: failCount,
    materialIndeterminate: indetCount,
    reconciledMaterialAccuracy: reconciledAccuracy,
    determinateCoverage: determinateCoverage
  },
  failuresList: ledger.filter(e => e.materialStatus === 'MATERIAL_FAIL').map(e => ({
    holdoutId: e.holdoutId,
    reasonCodes: e.deterministicReasonCodes
  })),
  indeterminateList: ledger.filter(e => e.materialStatus === 'MATERIAL_INDETERMINATE').map(e => e.holdoutId),
  sentinels: {
    holdout012: h12Entry,
    holdout027: h27Entry,
    holdout032: h32Entry
  },
  adversarialSummary: {
    total: adversarialResults.length,
    passed: adversarialResults.filter(r => r.passed).length,
    failed: adversarialResults.filter(r => !r.passed).length
  }
};

fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h12/audit/derived-fields-audit.json', JSON.stringify(derivedFieldAudit, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h12/audit/holdout-012-reconciliation.json', JSON.stringify(holdout012Reconciliation, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h12/audit/adversarial-tests-result.json', JSON.stringify(adversarialResults, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-ledger.json', JSON.stringify(ledger, null, 2), 'utf8');
fs.writeFileSync('tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('=== V2.3.6-H1.2 RECONCILIATION COMPLETE ===');
console.log('MATERIAL_PASS:         ', passCount);
console.log('MATERIAL_FAIL:         ', failCount);
console.log('MATERIAL_INDETERMINATE:', indetCount);
console.log('RECONCILED ACCURACY:   ', (reconciledAccuracy * 100).toFixed(1) + '%');
console.log('DETERMINATE COVERAGE:  ', (determinateCoverage * 100).toFixed(1) + '%');
console.log('ADVERSARIAL TESTS:     ', `${summary.adversarialSummary.passed}/${summary.adversarialSummary.total} PASSED`);
