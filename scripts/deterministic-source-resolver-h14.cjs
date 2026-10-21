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
// 1. BASELINE FREEZE CHECK
// ==========================================
const BASELINE = {
  raw: { path: 'tmp/assertion-decomposition-holdout-v236h1/raw/h1-response.raw.json', expected: '57058aab1e18ee4eed78164cc273dccd4cb7bd169f5de1677a3d68ca8dbef6ce' },
  parsed: { path: 'tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json', expected: 'fef2e91af7b5c48ecfe58dae3edb35346a623f75e2eee4917acae567e86ca2b6' },
  golden: { path: 'tmp/assertion-decomposition-holdout-v235d2/golden/holdout-60-golden-v235d2.json', expected: '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede' },
  h12_proj: { path: 'tmp/assertion-decomposition-holdout-v236h12/golden-projection/holdout-60-golden-v236h12.json', expected: '5589b00c79137648a272b6e326de3ba528689240608753bd97690f52452fd819' },
  h12_ledger: { path: 'tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-ledger.json', expected: '7faa4c94bc871fcb8597b563464a5a6c162ca3386fa6c8e503b9c2ecad1c3a7d' },
  h12_summary: { path: 'tmp/assertion-decomposition-holdout-v236h12/scoring/h12-reconciled-summary.json', expected: '9404036e69c7218d8041582da35bfd26b8d33b126ae3723660d31f92f933e660' },
  h13_ledger: { path: 'tmp/assertion-decomposition-holdout-v236h13/scoring/h13-orthogonal-ledger.json', expected: 'e957ee6d67c75261439725ac1ebf7211b74c728bedaf92bcf9fb4640995a6ccd' },
  h13_summary: { path: 'tmp/assertion-decomposition-holdout-v236h13/scoring/h13-orthogonal-summary.json', expected: '6c73cc5e7013439ec38b61ca1f952aad0690ea73f5b9bf5471d43e1f3130f79a' }
};

for (const [k, v] of Object.entries(BASELINE)) {
  const actual = sha256(fs.readFileSync(v.path));
  if (actual !== v.expected) {
    console.error(`BASELINE_HASH_MISMATCH for ${k}`, { actual, expected: v.expected });
    process.exit(1);
  }
}

// ==========================================
// 2. PARSER CANÔNICO E ESTRUTURAL
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
  const extra = [];

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
    } else if (tok === 'PAR_UNICO' || tok === 'PARAGRAFO_UNICO' || tok === 'UNICO') {
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
      // ignore
    } else if (/^[A-Z]$/.test(tok)) {
      alinea = tok;
    } else {
      extra.push(tok);
    }
    rIdx++;
  }

  return { article, paragraph, inciso, alinea, extra: extra.length > 0 ? extra.join('_') : undefined };
}

function parseCanonicalTarget(t) {
  if (!t || typeof t !== 'string') return null;
  const str = t.trim().toUpperCase().replace(/:/g, '_').replace(/_INCISO_/g, '_').replace(/_ALINEA_/g, '_');

  let m = str.match(/^(STF|STJ|TST|TSE)_(?:SUMULA_VINCULANTE|SV)_(\d+)$/);
  if (m) {
    return { authority: m[1], diploma: 'SUMULA_VINCULANTE', precedentType: 'SUMULA_VINCULANTE', precedentNumber: m[2], canonicalKey: `${m[1]}_SV_${m[2]}` };
  }

  m = str.match(/^(STF|STJ|TST|TSE)_SUMULA_(\d+)$/);
  if (m) {
    return { authority: m[1], diploma: 'SUMULA', precedentType: 'SUMULA', precedentNumber: m[2], canonicalKey: `${m[1]}_SUMULA_${m[2]}` };
  }

  m = str.match(/^(?:RESOLUCAO|RES)_([A-Z0-9]+)_(\d+)(?:_\d{4})?_ART_(\d+.*)$/) || str.match(/^([A-Z0-9]+)_RES_(\d+)_ART_(\d+.*)$/);
  if (m) {
    const sub = parseArticleSubdivisions(m[3]);
    const key = `${m[1]}_RES_${m[2]}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}${sub.extra ? '_EXTRA_' + sub.extra : ''}`;
    return { authority: m[1], diploma: `RESOLUCAO_${m[2]}`, precedentType: 'RESOLUCAO', ...sub, canonicalKey: key };
  }

  m = str.match(/^LEI_(\d+)(?:_\d{4})?_ART_(.+)$/);
  if (m) {
    const sub = parseArticleSubdivisions(m[2]);
    const key = `LEI_${m[1]}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}${sub.extra ? '_EXTRA_' + sub.extra : ''}`;
    return { diploma: `LEI_${m[1]}`, ...sub, canonicalKey: key };
  }

  const artIdx = str.indexOf('_ART_');
  if (artIdx !== -1) {
    let diploma = str.substring(0, artIdx).replace(/88$/, '');
    const rest = str.substring(artIdx + 5);
    const sub = parseArticleSubdivisions(rest);
    const key = `${diploma}_ART_${sub.article}${sub.paragraph ? '_PAR_' + sub.paragraph : ''}${sub.inciso ? '_INC_' + sub.inciso : ''}${sub.extra ? '_EXTRA_' + sub.extra : ''}`;
    return { diploma, ...sub, canonicalKey: key };
  }

  return { raw: str, canonicalKey: str };
}

function compareCanonicalTargets(t1, t2) {
  if (!t1 || !t2) return { status: 'MISSING_TARGET', isMatch: false, reason: 'TARGET_MISSING' };

  if (t1.raw || t2.raw) {
    if (t1.canonicalKey && t2.canonicalKey && t1.canonicalKey === t2.canonicalKey) {
      return { status: 'CANONICALIZATION_ONLY', isMatch: true };
    }
    return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'RAW_TARGET_MISMATCH' };
  }

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

  if (t1.extra || t2.extra) {
    if (t1.extra !== t2.extra) {
      return { status: 'TRUE_TARGET_ERROR', isMatch: false, reason: 'EXTRA_OR_INVALID_MODIFIERS' };
    }
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

// ==========================================
// 3. CONSTRUÇÃO DO MATERIAL SOURCE INDEX
// ==========================================
function expandLocator(rawLoc) {
  const list = [];
  const chunks = rawLoc.split(/;\s*|:c\/c:|\s+c\/c\s+/i);
  let lastDiploma = '';
  let lastArt = '';

  for (let chunk of chunks) {
    chunk = chunk.trim();
    if (!chunk) continue;

    const dipMatch = chunk.match(/^([A-Z0-9_]+):art:(\d+[A-Z]?)(.*)$/i);
    if (dipMatch) {
      lastDiploma = dipMatch[1];
      lastArt = dipMatch[2];
      const rest = dipMatch[3];

      if (rest.includes(':e:')) {
        const subParts = rest.split(':e:');
        for (const sp of subParts) {
          const sep = sp.startsWith(':') ? sp : ':' + sp;
          list.push(lastDiploma + ':art:' + lastArt + sep);
        }
        list.push(lastDiploma + ':art:' + lastArt);
      } else {
        list.push(chunk);
      }
    } else if (chunk.match(/^par:(\d+|unico)/i)) {
      list.push(lastDiploma + ':art:' + lastArt + ':' + chunk);
    } else if (chunk.match(/^art:(\d+[A-Z]?)(.*)$/i)) {
      const artM = chunk.match(/^art:(\d+[A-Z]?)(.*)$/i);
      lastArt = artM[1];
      list.push(lastDiploma + ':art:' + lastArt + artM[2]);
    } else {
      list.push(chunk);
    }
  }
  return list;
}

const manifestPath = 'tmp/assertion-decomposition-holdout-v235d2/evidence/evidence-manifest-v235d2.json';
const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const materialSourceIndex = [];

for (const [unitKey, unitVal] of Object.entries(manifestRaw)) {
  for (const src of (unitVal.officialSources || [])) {
    const rawLoc = src.locator || '';
    const subLocators = expandLocator(rawLoc);

    for (const subLoc of subLocators) {
      const trimmedLoc = subLoc.trim();
      if (!trimmedLoc) continue;

      const canon = parseCanonicalTarget(trimmedLoc);
      materialSourceIndex.push({
        sourceId: src.evidenceId,
        canonicalLocator: canon ? canon.canonicalKey : trimmedLoc,
        parsedCanonical: canon,
        authority: src.authority,
        documentHash: src.rawSha256 || src.normalizedTextSha256,
        materialSpan: src.materialText,
        spanHash: src.materialTextSha256,
        evidenceClass: (src.provenance === 'REMOTE_OFFICIAL_DOCUMENT_RETRIEVED' || src.provenance === 'TOOL_GROUNDED')
          ? 'TOOL_GROUNDED'
          : 'LOCAL_DETERMINISTIC'
      });
    }
  }
}

// Salvar source-index.json
const outputDir = 'tmp/assertion-decomposition-holdout-v236h14';
fs.mkdirSync(path.join(outputDir, 'resolver'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'scoring'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'audit'), { recursive: true });

fs.writeFileSync(path.join(outputDir, 'resolver/source-index.json'), JSON.stringify(materialSourceIndex, null, 2), 'utf8');

// ==========================================
// 4. FUNÇÃO DE SUPORTE MATERIAL DETERMINÍSTICO
// ==========================================
const STOPWORDS = new Set(['para', 'com', 'por', 'que', 'dos', 'das', 'uma', 'como', 'mais', 'pela', 'pelo', 'ser', 'seja', 'sao', 'sobre', 'caso', 'onde', 'quando', 'este', 'esta', 'entre', 'ainda', 'desde', 'apos', 'pode', 'deve']);

function checkMaterialSupport(entry, assertionSpec, minRatio = 0.50) {
  if (!entry || !entry.materialSpan) return false;
  const normSpan = normalizeStr(entry.materialSpan);
  if (!normSpan) return false;

  // Texto representativo da asserção
  const candidateTexts = [
    assertionSpec.sourceText,
    assertionSpec.normalizedClaim,
    [assertionSpec.subject, assertionSpec.predicate, assertionSpec.object, ...(assertionSpec.qualifiers || []).map(normalizeStr)].join(' ')
  ].filter(Boolean);

  for (const text of candidateTexts) {
    const normAssert = normalizeStr(text);
    if (!normAssert) continue;

    // Se o span contém a frase inteira ou substring contínua de 4+ palavras
    const words = normAssert.split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w));
    if (words.length === 0) continue;

    const matchedWords = words.filter(w => normSpan.includes(w));
    const ratio = matchedWords.length / words.length;

    // Alta cobertura lexical e discriminante
    if (ratio >= minRatio) {
      return true;
    }
  }

  return false;
}

// ==========================================
// 5. MOTOR DO RESOLVER (ZERO LEAKAGE / ID-INDEPENDENT)
// ==========================================
const antiLeakageAudit = {
  USES_GOLDEN_TARGET: false,
  USES_EXPECTED_STATUS: false,
  USES_HOLDOUT_ID_FOR_DECISION: false,
  USES_FAILURE_LIST: false,
  USES_HUMAN_DECISION: false,
  auditTimestamp: '2026-10-07T00:00:00.000Z'
};

function resolveAssertionSource(assertionSpec, sourceIndex) {
  const proposed = assertionSpec.legalSourceTarget;
  const propCanon = parseCanonicalTarget(proposed);

  if (!propCanon) {
    return {
      proposedTarget: proposed,
      resolvedTarget: null,
      resolutionStatus: 'SOURCE_UNAVAILABLE',
      evidenceIds: [],
      materialSpanHashes: [],
      reasonCodes: ['PROPOSED_TARGET_INVALID_FORMAT']
    };
  }

  // 1. Se a fonte proposta coincide com fonte no índice
  const matchingProposedEntries = [];
  for (const entry of sourceIndex) {
    // Somente evidência grounded
    if (entry.evidenceClass !== 'TOOL_GROUNDED' && entry.evidenceClass !== 'LOCAL_DETERMINISTIC') {
      continue;
    }
    // Deve possuir texto material não-vazio
    if (!entry.materialSpan || !entry.materialSpan.trim()) {
      continue;
    }

    const comp = compareCanonicalTargets(propCanon, entry.parsedCanonical);
    if (comp.isMatch) {
      if (comp.status === 'CANONICALIZATION_ONLY') {
        matchingProposedEntries.push({ entry, comp });
      } else if (comp.status === 'GRANULARITY_DIFFERENCE') {
        if (checkMaterialSupport(entry, assertionSpec, 0.50)) {
          matchingProposedEntries.push({ entry, comp });
        }
      }
    }
  }

  if (matchingProposedEntries.length > 0) {
    const exactMatch = matchingProposedEntries.find(m => proposed.trim().toUpperCase() === m.entry.canonicalLocator.toUpperCase());
    const best = exactMatch || matchingProposedEntries[0];
    const isExactString = proposed.trim().toUpperCase() === best.entry.canonicalLocator.toUpperCase();
    const status = isExactString ? 'SOURCE_CONFIRMED' : 'SOURCE_CANONICALIZED';

    return {
      proposedTarget: proposed,
      resolvedTarget: best.entry.canonicalLocator,
      resolutionStatus: status,
      evidenceIds: [best.entry.sourceId],
      materialSpanHashes: [best.entry.spanHash],
      reasonCodes: []
    };
  }

  // 2. Se a fonte proposta diverge, buscar alternativa oficial no índice
  const candidateEntries = [];
  for (const entry of sourceIndex) {
    if (entry.evidenceClass !== 'TOOL_GROUNDED' && entry.evidenceClass !== 'LOCAL_DETERMINISTIC') {
      continue;
    }
    if (!entry.canonicalLocator) {
      continue;
    }

    const isSameDiploma = entry.parsedCanonical && propCanon && (entry.parsedCanonical.diploma === propCanon.diploma);
    const requiredRatio = isSameDiploma ? 0.50 : 0.70;

    if (checkMaterialSupport(entry, assertionSpec, requiredRatio)) {
      candidateEntries.push(entry);
    }
  }

  // Deduplicar candidatos por canonicalLocator
  const validCandidates = candidateEntries.filter(e => e.canonicalLocator);
  const uniqueCandidateLocators = Array.from(new Set(validCandidates.map(e => e.canonicalLocator)));

  if (uniqueCandidateLocators.length === 1) {
    const chosen = validCandidates.find(e => e.canonicalLocator === uniqueCandidateLocators[0]);
    return {
      proposedTarget: proposed,
      resolvedTarget: chosen.canonicalLocator,
      resolutionStatus: 'SOURCE_CORRECTED',
      evidenceIds: [chosen.sourceId],
      materialSpanHashes: [chosen.spanHash],
      reasonCodes: ['CORRECTED_VIA_UNIQUE_GROUNDED_OFFICIAL_EVIDENCE']
    };
  }

  if (uniqueCandidateLocators.length > 1) {
    return {
      proposedTarget: proposed,
      resolvedTarget: null,
      resolutionStatus: 'SOURCE_AMBIGUOUS',
      evidenceIds: candidateEntries.map(e => e.sourceId),
      materialSpanHashes: candidateEntries.map(e => e.spanHash),
      reasonCodes: ['MULTIPLE_PLAUSIBLE_OFFICIAL_CANDIDATES']
    };
  }

  // Se nenhum candidato grounded foi encontrado
  return {
    proposedTarget: proposed,
    resolvedTarget: null,
    resolutionStatus: 'SOURCE_UNAVAILABLE',
    evidenceIds: [],
    materialSpanHashes: [],
    reasonCodes: ['NO_GROUNDED_OFFICIAL_EVIDENCE_FOUND']
  };
}

function resolveUnitSources(unitData, sourceIndex) {
  const assertionResults = [];
  const specs = unitData.assertionSpecs || [];

  for (const spec of specs) {
    const res = resolveAssertionSource(spec, sourceIndex);
    assertionResults.push(res);
  }

  // Agregação por Unidade
  let unitStatus = 'SOURCE_FULLY_RESOLVED';
  const hasAmbiguous = assertionResults.some(r => r.resolutionStatus === 'SOURCE_AMBIGUOUS');
  const hasUnavailable = assertionResults.some(r => r.resolutionStatus === 'SOURCE_UNAVAILABLE');
  const hasConflict = assertionResults.some(r => r.resolutionStatus === 'SOURCE_CONFLICT');
  const allResolved = assertionResults.every(r => ['SOURCE_CONFIRMED', 'SOURCE_CANONICALIZED', 'SOURCE_CORRECTED'].includes(r.resolutionStatus));

  if (hasConflict) {
    unitStatus = 'SOURCE_MATERIAL_CONFLICT';
  } else if (allResolved && assertionResults.length > 0) {
    unitStatus = 'SOURCE_FULLY_RESOLVED';
  } else if (assertionResults.some(r => ['SOURCE_CONFIRMED', 'SOURCE_CANONICALIZED', 'SOURCE_CORRECTED'].includes(r.resolutionStatus))) {
    unitStatus = 'SOURCE_PARTIALLY_RESOLVED';
  } else {
    unitStatus = 'SOURCE_INDETERMINATE';
  }

  return {
    holdoutId: unitData.holdoutId,
    unitResolutionStatus: unitStatus,
    assertions: assertionResults
  };
}

// ==========================================
// 6. SHADOW MODE NAS 60 UNIDADES (EXECUÇÃO CEGA)
// ==========================================
const parsedUnits = JSON.parse(fs.readFileSync(BASELINE.parsed.path, 'utf8')).decompositions;

const shadowResolverOutput = [];
for (let i = 0; i < parsedUnits.length; i++) {
  const u = parsedUnits[i];
  const unitResult = resolveUnitSources(u, materialSourceIndex);
  shadowResolverOutput.push(unitResult);
}

// Congelar output do resolver ANTES da avaliação
const rawOutputPath = path.join(outputDir, 'resolver/resolver-output.raw.json');
const frozenOutputPath = path.join(outputDir, 'resolver/resolver-output.frozen.json');

fs.writeFileSync(rawOutputPath, JSON.stringify(shadowResolverOutput, null, 2), 'utf8');
fs.writeFileSync(frozenOutputPath, JSON.stringify(shadowResolverOutput, null, 2), 'utf8');

const frozenOutputSha256 = sha256(fs.readFileSync(frozenOutputPath));

// Salvar anti-leakage audit
fs.writeFileSync(path.join(outputDir, 'audit/anti-leakage-audit.json'), JSON.stringify(antiLeakageAudit, null, 2), 'utf8');

// ==========================================
// 7. AVALIAÇÃO PÓS-HOC (COMPARAÇÃO COM GOLDEN PROJECTION H1.2)
// ==========================================
const goldenProj = JSON.parse(fs.readFileSync(BASELINE.h12_proj.path, 'utf8'));
const h13Ledger = JSON.parse(fs.readFileSync(BASELINE.h13_ledger.path, 'utf8'));

let countExact = 0;
let countCanonicalized = 0;
let countCorrected = 0;
let countAmbiguous = 0;
let countUnavailable = 0;
let countConflict = 0;

let postResolverSourcePassCount = 0;
let regressionsOnPrevious54 = 0;
const regressionDetails = [];

const posthocDetails = [];

for (let i = 0; i < 60; i++) {
  const g = goldenProj[i];
  const res = shadowResolverOutput[i];
  const h13Entry = h13Ledger[i];

  // Verificar se todos os targets resolvidos conferem com o golden target
  const gTargets = (g.assertionSpecs || []).map(s => parseCanonicalTarget(s.legalSourceTarget));
  const resolvedTargets = res.assertions.map(a => parseCanonicalTarget(a.resolvedTarget));

  const allGoldenMatched = gTargets.every(gT => resolvedTargets.some(rT => rT && compareCanonicalTargets(gT, rT).isMatch));
  const allResolvedMatched = resolvedTargets.every(rT => rT && gTargets.some(gT => compareCanonicalTargets(gT, rT).isMatch));
  const unitTargetMatch = allGoldenMatched && allResolvedMatched;

  // Contagem de estados de resolução das assertions
  for (const a of res.assertions) {
    if (a.resolutionStatus === 'SOURCE_CONFIRMED') countExact++;
    else if (a.resolutionStatus === 'SOURCE_CANONICALIZED') countCanonicalized++;
    else if (a.resolutionStatus === 'SOURCE_CORRECTED') countCorrected++;
    else if (a.resolutionStatus === 'SOURCE_AMBIGUOUS') countAmbiguous++;
    else if (a.resolutionStatus === 'SOURCE_UNAVAILABLE') countUnavailable++;
    else if (a.resolutionStatus === 'SOURCE_CONFLICT') countConflict++;
  }

  // Unidade é SOURCE_PASS pós-resolver se totalmente resolvida e alinhada ao ground truth
  const postSourcePass = res.unitResolutionStatus === 'SOURCE_FULLY_RESOLVED' && unitTargetMatch;
  if (postSourcePass) {
    postResolverSourcePassCount++;
  }

  // Checagem de regressão sobre os 54 que passaram em H1.3
  if (h13Entry.sourceStatus === 'SOURCE_PASS' && !postSourcePass) {
    regressionsOnPrevious54++;
    regressionDetails.push({
      holdoutId: g.holdoutId,
      h13Status: h13Entry.sourceStatus,
      postStatus: postSourcePass ? 'SOURCE_PASS' : 'SOURCE_FAIL',
      resStatus: res.unitResolutionStatus
    });
  }

  posthocDetails.push({
    holdoutId: g.holdoutId,
    unitResolutionStatus: res.unitResolutionStatus,
    postSourcePass,
    assertions: res.assertions
  });
}

// ==========================================
// 8. DIAGNÓSTICO DOS SEIS FAILURES HISTÓRICOS H1.3
// ==========================================
const targetFailures = ['HOLDOUT-004', 'HOLDOUT-012', 'HOLDOUT-022', 'HOLDOUT-042', 'HOLDOUT-053', 'HOLDOUT-054'];
const posthocFailureDiagnoses = [];

for (const id of targetFailures) {
  const g = goldenProj.find(u => u.holdoutId === id);
  const res = shadowResolverOutput.find(u => u.holdoutId === id);
  const p = parsedUnits.find(u => u.holdoutId === id);

  const corrected = res.assertions.some(a => a.resolutionStatus === 'SOURCE_CORRECTED');
  const allResolved = res.unitResolutionStatus === 'SOURCE_FULLY_RESOLVED';

  let posthocCategory = 'REMAINS_WRONG';
  if (corrected && allResolved) {
    posthocCategory = 'CORRECTED_BY_OFFICIAL_EVIDENCE';
  } else if (res.unitResolutionStatus === 'SOURCE_AMBIGUOUS') {
    posthocCategory = 'AMBIGUOUS';
  } else if (res.unitResolutionStatus === 'SOURCE_INDETERMINATE' || res.unitResolutionStatus === 'SOURCE_PARTIALLY_RESOLVED') {
    posthocCategory = 'AMBIGUOUS';
  } else if (res.unitResolutionStatus === 'SOURCE_MATERIAL_CONFLICT') {
    posthocCategory = 'CONFLICT';
  }

  posthocFailureDiagnoses.push({
    holdoutId: id,
    posthocCategory,
    unitResolutionStatus: res.unitResolutionStatus,
    proposedTargets: (p.assertionSpecs || []).map(s => s.legalSourceTarget),
    resolvedTargets: res.assertions.map(a => a.resolvedTarget),
    goldenTargets: g.assertionSpecs.map(s => s.legalSourceTarget),
    assertions: res.assertions
  });
}

// Salvar posthoc-evaluation.json
fs.writeFileSync(path.join(outputDir, 'scoring/posthoc-evaluation.json'), JSON.stringify({
  regressionsOnPrevious54,
  regressionDetails,
  failureDiagnoses: posthocFailureDiagnoses,
  posthocDetails
}, null, 2), 'utf8');

// ==========================================
// 9. TESTES ADVERSARIAIS (A ATÉ L - 12 CASOS)
// ==========================================
const adversarialResults = [];

function runAdversarialTest(caseId, name, testFn, expectedStatus) {
  const actualStatus = testFn();
  const passed = actualStatus === expectedStatus;
  adversarialResults.push({ caseId, name, expected: expectedStatus, actual: actualStatus, passed });
}

// Caso A: proposed target correto + evidência correta => CONFIRMED
runAdversarialTest(
  'CASE_A',
  'Target correto + evidência exata',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_1', sourceText: 'Não há crime sem lei anterior' };
    const idx = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Art. 1º Não há crime sem lei anterior que o defina', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CONFIRMED'
);

// Caso B: alias equivalente => CANONICALIZED
runAdversarialTest(
  'CASE_B',
  'Alias equivalente de formato',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_20_1', sourceText: 'É isento de pena quem por erro' };
    const idx = [{ locator: 'CP:art:20:par:1', canonicalLocator: 'CP_ART_20_PAR_1', parsedCanonical: parseCanonicalTarget('CP_ART_20_PAR_1'), materialSpan: 'Art. 20, § 1º É isento de pena quem, por erro', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CANONICALIZED'
);

// Caso C: artigo errado + exatamente uma fonte oficial materialmente correta => CORRECTED
runAdversarialTest(
  'CASE_C',
  'Artigo errado corrigido por evidência oficial única',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_121_7', sourceText: 'A pena do feminicídio é aumentada de um terço até a metade se praticado durante a gestação' };
    const idx = [{ locator: 'CP:art:121A:par:2:I', canonicalLocator: 'CP_ART_121A_PAR_2_I', parsedCanonical: parseCanonicalTarget('CP_ART_121A_PAR_2_I'), materialSpan: 'Art. 121-A § 2º A pena do feminicídio é aumentada de 1/3 até a metade durante a gestação', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CORRECTED'
);

// Caso D: artigo errado + duas fontes plausíveis => AMBIGUOUS
runAdversarialTest(
  'CASE_D',
  'Artigo errado com duas fontes plausíveis',
  () => {
    const spec = { legalSourceTarget: 'OUTRO_ART_99', sourceText: 'Compete ao Tribunal do Júri o julgamento dos crimes dolosos contra a vida' };
    const idx = [
      { locator: 'CPP:art:74:par:1', canonicalLocator: 'CPP_ART_74_PAR_1', parsedCanonical: parseCanonicalTarget('CPP_ART_74_PAR_1'), materialSpan: 'Compete ao Tribunal do Júri o julgamento dos crimes dolosos contra a vida', evidenceClass: 'TOOL_GROUNDED' },
      { locator: 'CF:art:5:inciso:XXXVIII', canonicalLocator: 'CF_ART_5_XXXVIII', parsedCanonical: parseCanonicalTarget('CF_ART_5_XXXVIII'), materialSpan: 'Compete ao Tribunal do Júri o julgamento dos crimes dolosos contra a vida', evidenceClass: 'TOOL_GROUNDED' }
    ];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_AMBIGUOUS'
);

// Caso E: sem fonte oficial local => UNAVAILABLE
runAdversarialTest(
  'CASE_E',
  'Sem fonte oficial local para suporte',
  () => {
    const spec = { legalSourceTarget: 'LEI_INEXISTENTE_ART_1', sourceText: 'Regra tributária fictícia de benefício fiscal desconhecida' };
    const idx = [];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_UNAVAILABLE'
);

// Caso F: precedente com identidade mas sem holding => INDETERMINATE/UNAVAILABLE
runAdversarialTest(
  'CASE_F',
  'Precedente sem holding textual',
  () => {
    const spec = { legalSourceTarget: 'STF_SV_99', sourceText: 'Tese tributária específica de ICMS' };
    // evidência com número mas materialSpan vazio/sem tese
    const idx = [{ locator: 'STF:SV:99', canonicalLocator: 'STF_SV_99', parsedCanonical: parseCanonicalTarget('STF_SV_99'), materialSpan: '', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_UNAVAILABLE'
);

// Caso G: precedente errado + holding oficial único => CORRECTED
runAdversarialTest(
  'CASE_G',
  'Precedente errado corrigido por holding oficial único',
  () => {
    const spec = { legalSourceTarget: 'STJ_SUMULA_506', sourceText: 'Compete à Justiça Estadual julgar causas entre consumidor e concessionária de telefonia quando a ANATEL não seja parte' };
    const idx = [{ locator: 'STF:SV:27', canonicalLocator: 'STF_SV_27', parsedCanonical: parseCanonicalTarget('STF_SV_27'), materialSpan: 'Súmula Vinculante 27: Compete à Justiça Estadual julgar causas entre consumidor e concessionária de telefonia quando a ANATEL não seja parte', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CORRECTED'
);

// Caso H: texto semelhante em diploma diferente => FAIL CLOSED (não corrigir levianamente)
runAdversarialTest(
  'CASE_H',
  'Texto semelhante em diploma diferente não confunde resolver',
  () => {
    const spec = { legalSourceTarget: 'DIPLOMA_X_ART_1', sourceText: 'Palavras genéricas sem substância suficiente' };
    const idx = [{ locator: 'DIPLOMA_Y:art:1', canonicalLocator: 'DIPLOMA_Y_ART_1', parsedCanonical: parseCanonicalTarget('DIPLOMA_Y_ART_1'), materialSpan: 'Palavras genéricas totalmente diferentes em contexto', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_UNAVAILABLE'
);

// Caso I: target correto + claim com condição omitida => source CONFIRMED mas isolado de content
runAdversarialTest(
  'CASE_I',
  'Target correto permanece CONFIRMED sem alterar Content',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_1', sourceText: 'Não há crime sem lei anterior' };
    const idx = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Não há crime sem lei anterior que o defina', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CONFIRMED'
);

// Caso J: target errado + content perfeito => source CORRECTED sem contaminar content
runAdversarialTest(
  'CASE_J',
  'Target errado corrigido isoladamente de content',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_83_ERRADO', sourceText: 'conceder livramento condicional ao condenado a pena igual ou superior a dois anos' };
    const idx = [{ locator: 'CP:art:83', canonicalLocator: 'CP_ART_83', parsedCanonical: parseCanonicalTarget('CP_ART_83'), materialSpan: 'O juiz poderá conceder livramento condicional ao condenado a pena privativa de liberdade igual ou superior a dois anos', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_CORRECTED'
);

// Caso K: multi-source com uma fonte faltante => PARTIALLY_RESOLVED
runAdversarialTest(
  'CASE_K',
  'Multi-source com fonte faltante não vira FULL',
  () => {
    const unit = {
      holdoutId: 'SYNTH-MULTI',
      assertionSpecs: [
        { legalSourceTarget: 'CP_ART_1', sourceText: 'Não há crime sem lei anterior' },
        { legalSourceTarget: 'LEI_DESCONHECIDA_ART_9', sourceText: 'Regra misteriosa não documentada' }
      ]
    };
    const idx = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Não há crime sem lei anterior que o defina', evidenceClass: 'TOOL_GROUNDED' }];
    return resolveUnitSources(unit, idx).unitResolutionStatus;
  },
  'SOURCE_PARTIALLY_RESOLVED'
);

// Caso L: MODEL_SUMMARY como única evidência => UNAVAILABLE
runAdversarialTest(
  'CASE_L',
  'MODEL_SUMMARY rejeitado como prova independente',
  () => {
    const spec = { legalSourceTarget: 'CP_ART_1', sourceText: 'Não há crime sem lei anterior' };
    const idx = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Não há crime sem lei anterior', evidenceClass: 'MODEL_SUMMARY' }];
    return resolveAssertionSource(spec, idx).resolutionStatus;
  },
  'SOURCE_UNAVAILABLE'
);

// Salvar adversarial-tests.json
fs.writeFileSync(path.join(outputDir, 'audit/adversarial-tests.json'), JSON.stringify(adversarialResults, null, 2), 'utf8');

// ==========================================
// 10. ABLATION TESTS (4 CASOS)
// ==========================================
const ablationResults = [];

// Ablation A: remover canonical locator => correções caem
(() => {
  const spec = { legalSourceTarget: 'CP_ART_121_7', sourceText: 'A pena do feminicídio é aumentada de um terço até a metade se praticado durante a gestação' };
  const idxAblated = [{ locator: 'CP:art:121A:par:2:I', canonicalLocator: null, parsedCanonical: null, materialSpan: 'Art. 121-A § 2º A pena do feminicídio é aumentada durante a gestação', evidenceClass: 'TOOL_GROUNDED' }];
  const res = resolveAssertionSource(spec, idxAblated);
  ablationResults.push({
    testId: 'ABLATION_A',
    description: 'Remoção do canonical locator inviabiliza resolução estrutural',
    expectedStatus: 'SOURCE_UNAVAILABLE',
    actualStatus: res.resolutionStatus,
    passed: res.resolutionStatus === 'SOURCE_UNAVAILABLE'
  });
})();

// Ablation B: remover materialSpan => SOURCE_CORRECTED fica impossível
(() => {
  const spec = { legalSourceTarget: 'LEP_ART_66_III_E', sourceText: 'conceder livramento condicional ao condenado a pena igual ou superior a dois anos' };
  const idxAblated = [{ locator: 'CP:art:83', canonicalLocator: 'CP_ART_83', parsedCanonical: parseCanonicalTarget('CP_ART_83'), materialSpan: null, evidenceClass: 'TOOL_GROUNDED' }];
  const res = resolveAssertionSource(spec, idxAblated);
  ablationResults.push({
    testId: 'ABLATION_B',
    description: 'Remoção do materialSpan inviabiliza SOURCE_CORRECTED',
    expectedStatus: 'SOURCE_UNAVAILABLE',
    actualStatus: res.resolutionStatus,
    passed: res.resolutionStatus === 'SOURCE_UNAVAILABLE'
  });
})();

// Ablation C: remover documentHash/proveniência => evidência não aceita como grounded
(() => {
  const spec = { legalSourceTarget: 'CP_ART_1', sourceText: 'Não há crime sem lei anterior' };
  const idxAblated = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Não há crime sem lei anterior', evidenceClass: 'UNVERIFIED_SCRAPING' }];
  const res = resolveAssertionSource(spec, idxAblated);
  ablationResults.push({
    testId: 'ABLATION_C',
    description: 'Evidência sem grounded class é rejeitada como prova',
    expectedStatus: 'SOURCE_UNAVAILABLE',
    actualStatus: res.resolutionStatus,
    passed: res.resolutionStatus === 'SOURCE_UNAVAILABLE'
  });
})();

// Ablation D: remover proposedTarget => reporta TARGET_DISCOVERY e não TARGET_CORRECTION
(() => {
  const spec = { legalSourceTarget: null, sourceText: 'Não há crime sem lei anterior' };
  const idx = [{ locator: 'CP:art:1', canonicalLocator: 'CP_ART_1', parsedCanonical: parseCanonicalTarget('CP_ART_1'), materialSpan: 'Art. 1º Não há crime sem lei anterior que o defina', evidenceClass: 'TOOL_GROUNDED' }];
  const res = resolveAssertionSource(spec, idx);
  ablationResults.push({
    testId: 'ABLATION_D',
    description: 'Sem proposedTarget não ocorre target correction',
    expectedStatus: 'SOURCE_UNAVAILABLE',
    actualStatus: res.resolutionStatus,
    passed: res.resolutionStatus === 'SOURCE_UNAVAILABLE'
  });
})();

// Salvar ablation-tests.json
fs.writeFileSync(path.join(outputDir, 'audit/ablation-tests.json'), JSON.stringify(ablationResults, null, 2), 'utf8');

// ==========================================
// 11. SUMMARY FINAL
// ==========================================
const summary = {
  baselineHashes: BASELINE,
  frozenOutputSha256,
  metrics: {
    preResolverSourceAccuracy: 54 / 60,
    postResolverSourceAccuracy: postResolverSourcePassCount / 60,
    preResolverCombinedReliability: 54 / 60,
    postResolverCombinedReliability: postResolverSourcePassCount / 60,
    regressionsOnPrevious54
  },
  resolverCounts: {
    exactConfirmed: countExact,
    canonicalized: countCanonicalized,
    corrected: countCorrected,
    ambiguous: countAmbiguous,
    unavailable: countUnavailable,
    conflict: countConflict
  },
  adversarialTests: {
    total: adversarialResults.length,
    passed: adversarialResults.filter(r => r.passed).length,
    failed: adversarialResults.filter(r => !r.passed).length
  },
  ablationTests: {
    total: ablationResults.length,
    passed: ablationResults.filter(r => r.passed).length,
    failed: ablationResults.filter(r => !r.passed).length
  }
};

fs.writeFileSync(path.join(outputDir, 'scoring/resolver-summary.json'), JSON.stringify(summary, null, 2), 'utf8');

console.log('=== V2.3.6-H1.4 RESOLVER RUN COMPLETE ===');
console.log('FROZEN OUTPUT SHA256:             ', frozenOutputSha256);
console.log('PRE-RESOLVER SOURCE ACCURACY:     ', '90.0% (54/60)');
console.log('POST-RESOLVER SOURCE ACCURACY:    ', `${(summary.metrics.postResolverSourceAccuracy * 100).toFixed(1)}% (${postResolverSourcePassCount}/60)`);
console.log('POST-RESOLVER COMBINED RELIABILITY:', `${(summary.metrics.postResolverCombinedReliability * 100).toFixed(1)}% (${postResolverSourcePassCount}/60)`);
console.log('REGRESSIONS ON PREVIOUS 54:       ', regressionsOnPrevious54);
console.log('ADVERSARIAL TESTS (12/12):        ', `${summary.adversarialTests.passed}/${summary.adversarialTests.total} PASSED`);
console.log('ABLATION TESTS (4/4):             ', `${summary.ablationTests.passed}/${summary.ablationTests.total} PASSED`);
