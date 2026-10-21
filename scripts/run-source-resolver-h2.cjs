/**
 * ATHENA — RUN SOURCE RESOLVER H2
 * MODO: ISOLADO / BLIND / ZERO GOLDEN / ZERO HUMAN DECISION
 *
 * Este executável executa o resolver determinístico em modo cego.
 * REGRA ESTRITA DE GOVERNANÇA:
 * - NÃO lê golden.
 * - NÃO lê expected targets ou expected statuses.
 * - NÃO lê human decisions ou listas de failures.
 * - Opera estritamente sobre candidateParsed e materialSourceIndex.
 */

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

const STOPWORDS = new Set(['para', 'com', 'por', 'que', 'dos', 'das', 'uma', 'como', 'mais', 'pela', 'pelo', 'ser', 'seja', 'sao', 'sobre', 'caso', 'onde', 'quando', 'este', 'esta', 'entre', 'ainda', 'desde', 'apos', 'pode', 'deve']);

function checkMaterialSupport(entry, assertionSpec, minRatio = 0.50) {
  if (!entry || !entry.materialSpan) return false;
  const normSpan = normalizeStr(entry.materialSpan);
  if (!normSpan) return false;

  const candidateTexts = [
    assertionSpec.sourceText,
    assertionSpec.normalizedClaim,
    [assertionSpec.subject, assertionSpec.predicate, assertionSpec.object, ...(assertionSpec.qualifiers || []).map(normalizeStr)].join(' ')
  ].filter(Boolean);

  for (const text of candidateTexts) {
    const normAssert = normalizeStr(text);
    if (!normAssert) continue;

    const words = normAssert.split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w));
    if (words.length === 0) continue;

    const matchedWords = words.filter(w => normSpan.includes(w));
    const ratio = matchedWords.length / words.length;

    if (ratio >= minRatio) {
      return true;
    }
  }
  return false;
}

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
    if (entry.evidenceClass !== 'TOOL_GROUNDED' && entry.evidenceClass !== 'LOCAL_DETERMINISTIC') {
      continue;
    }
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
    unitId: unitData.unitId || unitData.holdoutId,
    unitResolutionStatus: unitStatus,
    assertions: assertionResults
  };
}

function run(candidateParsedPath, sourceIndexPath, outputDir) {
  if (!fs.existsSync(candidateParsedPath)) {
    throw new Error(`CANDIDATE_PARSED_NOT_FOUND: ${candidateParsedPath}`);
  }
  if (!fs.existsSync(sourceIndexPath)) {
    throw new Error(`SOURCE_INDEX_NOT_FOUND: ${sourceIndexPath}`);
  }

  const parsedRaw = JSON.parse(fs.readFileSync(candidateParsedPath, 'utf8'));
  const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));

  const units = parsedRaw.decompositions || parsedRaw.units || parsedRaw;
  const results = [];

  for (const u of units) {
    results.push(resolveUnitSources(u, sourceIndex));
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const rawPath = path.join(outputDir, 'resolver-output.raw.json');
  const frozenPath = path.join(outputDir, 'resolver-output.frozen.json');

  const content = JSON.stringify(results, null, 2);
  fs.writeFileSync(rawPath, content, 'utf8');
  fs.writeFileSync(frozenPath, content, 'utf8');

  const frozenSha = sha256(fs.readFileSync(frozenPath));
  console.log('=== ATHENA H2 SOURCE RESOLVER RUN COMPLETE ===');
  console.log('UNITS PROCESSED:       ', results.length);
  console.log('RESOLVER FROZEN SHA256:', frozenSha);

  return { frozenSha, totalUnits: results.length };
}

module.exports = {
  run,
  resolveUnitSources,
  resolveAssertionSource,
  parseCanonicalTarget,
  compareCanonicalTargets
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const parsedPath = args[0] || 'tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json';
  const indexPath = args[1] || 'tmp/assertion-decomposition-holdout-v236h14/resolver/source-index.json';
  const outDir = args[2] || 'tmp/h2-preflight/resolver-dry-run';
  run(parsedPath, indexPath, outDir);
}
