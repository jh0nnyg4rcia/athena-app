/**
 * ATHENA — V2.3.7-H2.1.1 — H2-60 BENCHMARK QUALITY HARDENING
 * OFFLINE / ZERO LLM / ZERO NETWORK / PRE-GOLDEN
 *
 * This script audits the discriminative structural quality of the H2.1
 * dataset, detects trivial non-discriminative provisions generically,
 * performs deterministic replacement from the frozen pool, stratifies the
 * dataset into 40 STANDARD and 20 HARD units, re-verifies all 14 gates,
 * and writes the hardened artifacts into tmp/assertion-decomposition-holdout-v237h211/.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

// ---------------------------------------------------------------
// 1. VERIFY H2.1 BASELINE FREEZE
// ---------------------------------------------------------------
const H21_EXPECTED = {
  'dataset/h2-source-dataset.internal.json': 'f7acdac40e71959bf2a318bb1bc982512c14bb815e49d48c63d2aebc760d25ef',
  'dataset/h2-blind-input.preview.json': '1333d426e6f2248355a2d9ce79d150591878d9e16822090c3c33f4e166ba0238',
  'dataset/h2-source-review-queue.json': '77e547297cf9dd5c5eab5834624c20941055f26fc0288c71f28792fd2f266201',
  'audit/h2-validation-tests.json': '8c8a24187a484213d7696c1993d8a56dcecaa4fcc0ec00ef92f56f102faf2525',
  'audit/h2-anti-overfitting-audit.json': '349bd0922bbc4c4fc34a5e4890454961181c8e741827677d01e818fa76a642ef',
  'scripts/build-h2-source-dataset-h21.cjs': 'a742f35247ee5240f9a387442301a280941c2aaa054badb2a6593fc755bc9dac'
};

const H21_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h21');
const OUT_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211');

function verifyH21Freeze() {
  const verified = {};
  for (const [rel, exp] of Object.entries(H21_EXPECTED)) {
    const p = rel.startsWith('scripts/') ? path.join(ROOT, rel) : path.join(H21_DIR, rel);
    const actual = sha256File(p);
    if (actual !== exp) {
      throw new Error(`ABORT_H21_FREEZE_MISMATCH ${rel} actual=${actual} expected=${exp}`);
    }
    verified[rel] = actual;
  }
  return verified;
}

// ---------------------------------------------------------------
// 2. STRUCTURAL QUALITY FEATURES EXTRACTOR
// ---------------------------------------------------------------
function extractStructuralFeatures(text, isParagraph) {
  const norm = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const count = (re) => (norm.match(re) || []).length;

  const textLength = text.trim().length;
  const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const clauseCount = text.split(/[;:,]|\b(e|mas|porem|contudo|todavia|entretanto|ou|pois|porque|visto que|ja que|caso|se|quando|enquanto|embora|conquanto)\b/i).filter((s) => s && s.trim().length > 2).length || 1;
  const conditionalMarkerCount = count(/\b(se|caso|desde que|quando|enquanto|sempre que|salvo se|na hipotese de|na hipotese em que|comprovad[oa]|havendo)\b/g);
  const exceptionMarkerCount = count(/\b(salvo|exceto|ressalvad[oa]s?|sem prejuizo|todavia|nao se aplica|excluid[oa]s?|a nao ser)\b/g);
  const alternativeMarkerCount = count(/\s(ou|nem)\s/g);
  const negativeMarkerCount = count(/\b(nao|vedado|proibido|defeso|nenhum|nenhuma|jamais|nunca|sem)\b/g);
  const crossReferenceCount = count(/\b(art(?:igo)?s?\.?\s*\d+|lei\s+n|deste codigo|desta lei|constituicao|regimento|nos termos|na forma)\b/g);
  const enumerationCount = count(/\b(inciso|alinea|item|paragrafo|§)\b|\b(primeiro|segundo|terceiro|quarto|quinto)\b|\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b|\(\d+\)|\([a-z]\)/g);
  const explicitSubjectCount = count(/\b(o juiz|o magistrado|o tribunal|o ministerio publico|o defensor|a defensoria|o advogado|o reu|o autor|o acusado|o indiciado|o condenado|o preso|o internado|o servidor|a autoridade|a administracao|o estado|a uniao|o presidente|o fornecedor|o consumidor|o credor|o devedor|o contratante|o contratado|a testemunha|o perito|o assistente|qualquer pessoa|quem)\b/g);
  const legalConsequenceMarkerCount = count(/\b(sera|serao|deve|devem|devera|deverao|pode|podem|podera|poderao|aplica-se|aplicam-se|cabera|caberao|imposta?|sujeito|sujeita|incurso|pena|reclusao|detencao|multa|nulidade|extincao|suspensao|revogacao|obsta|inadmissivel|ineficaz|valido)\b/g);
  const temporalMarkerCount = count(/\b(prazo|dias?|meses|anos?|horas?|data|momento|apos|antes|durante|vigencia|termo|imediatamente|previamente|concomitante)\b/g);
  const modalVerbCount = count(/\b(deve|devem|devera|deverao|pode|podem|podera|poderao|faculta-se|cumpre|obriga-se)\b/g);
  const subdivisionDepth = isParagraph ? 1 : 0;

  // Generic Information Score: favors conditions, exceptions, alternatives, consequences, references, etc.
  const structuralInformationScore = (
    2.0 * conditionalMarkerCount +
    3.0 * exceptionMarkerCount +
    1.5 * alternativeMarkerCount +
    1.5 * legalConsequenceMarkerCount +
    1.0 * crossReferenceCount +
    1.0 * negativeMarkerCount +
    1.0 * temporalMarkerCount +
    0.5 * clauseCount +
    0.5 * enumerationCount +
    0.5 * modalVerbCount +
    0.5 * subdivisionDepth +
    0.5 * explicitSubjectCount
  );

  const meetsHardCriteria = (
    conditionalMarkerCount >= 2 ||
    (conditionalMarkerCount >= 1 && exceptionMarkerCount >= 1) ||
    (negativeMarkerCount >= 1 && exceptionMarkerCount >= 1) ||
    (exceptionMarkerCount >= 1 && alternativeMarkerCount >= 1) ||
    (crossReferenceCount >= 1 && conditionalMarkerCount >= 1) ||
    (temporalMarkerCount >= 1 && conditionalMarkerCount >= 1) ||
    alternativeMarkerCount >= 2 ||
    (clauseCount >= 4 && legalConsequenceMarkerCount >= 2)
  );

  return {
    textLength,
    sentenceCount,
    clauseCount,
    conditionalMarkerCount,
    exceptionMarkerCount,
    alternativeMarkerCount,
    negativeMarkerCount,
    crossReferenceCount,
    enumerationCount,
    explicitSubjectCount,
    legalConsequenceMarkerCount,
    temporalMarkerCount,
    modalVerbCount,
    subdivisionDepth,
    structuralInformationScore,
    meetsHardCriteria
  };
}

// ---------------------------------------------------------------
// 3. GENERIC TRIVIALITY DETECTOR
// ---------------------------------------------------------------
const EFF_DATE_RE = /^(?:esta\s+lei|este\s+c[oó]digo|o\s+presente\s+diploma)\s+entra(?:r[aá])?\s+em\s+vigor/i;
const REVOC_RE = /^revogam-se(?:\s+as\s+disposi[cç][oõ]es\s+em\s+contr[aá]rio)?\.?$/i;
const ORG_LOC_RE = /(?:ser[aá]\s+instalad[oa]|funcionar[aá]|localizar-se-[aá]|ter[aá]\s+sede)\s+em\s+(?:unidade|pr[eé]dio|local|anexo|depend[eê]ncia)/i;

function detectTriviality(text, features) {
  const t = text.trim();
  if (EFF_DATE_RE.test(t)) return 'PURE_EFFECTIVE_DATE';
  if (REVOC_RE.test(t)) return 'PURE_REVOCATION';
  if (ORG_LOC_RE.test(t) && features.conditionalMarkerCount === 0 && features.exceptionMarkerCount === 0 && features.legalConsequenceMarkerCount <= 1) {
    return 'PURE_ORGANIZATIONAL_LOCATION';
  }
  if (/^transitoriamente\b|^das\s+disposi[cç][oõ]es\s+transit[oó]rias/i.test(t) && features.conditionalMarkerCount === 0) {
    return 'PURE_EDITORIAL_OR_TRANSITIONAL';
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 12 && features.sentenceCount === 1 && features.clauseCount <= 1 && features.conditionalMarkerCount === 0 && features.exceptionMarkerCount === 0 && features.alternativeMarkerCount === 0 && features.legalConsequenceMarkerCount === 0 && features.crossReferenceCount === 0) {
    return 'ATOMIC_TRIVIAL';
  }
  return null;
}

// ---------------------------------------------------------------
// 4. JACCARD UTILS & TOKEN SETS
// ---------------------------------------------------------------
const normTxt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const tokens = (s) => new Set(normTxt(s).split(' ').filter((w) => w.length >= 3));
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------
function main() {
  const verifiedHashes = verifyH21Freeze();

  // Load H2.1 artifacts
  const dataset = JSON.parse(fs.readFileSync(path.join(H21_DIR, 'dataset/h2-source-dataset.internal.json'), 'utf8'));
  const pool = JSON.parse(fs.readFileSync(path.join(H21_DIR, 'pool/h2-candidate-pool.json'), 'utf8'));
  const corpusManifest = JSON.parse(fs.readFileSync(path.join(H21_DIR, 'pool/h2-corpus-manifest.json'), 'utf8'));
  const docMap = new Map(corpusManifest.map((d) => [d.officialDocumentId, d]));

  const { roundTrip } = require(path.join(ROOT, 'scripts/build-h2-source-dataset-h21.cjs'));

  // 1. Audit features BEFORE replacement
  const beforeAudit = dataset.map((u) => {
    const f = extractStructuralFeatures(u.literalText, u.subdivisionType === 'PARAGRAPH');
    const triv = detectTriviality(u.literalText, f);
    return {
      h2Id: u.h2Id,
      canonicalLocator: u.canonicalLocator,
      domain: u.domain,
      features: f,
      trivialityReason: triv,
      isTrivial: !!triv
    };
  });

  const beforeTrivialCount = beforeAudit.filter((u) => u.isTrivial).length;
  const beforeTrivialBreakdown = {};
  beforeAudit.filter((u) => u.isTrivial).forEach((u) => {
    beforeTrivialBreakdown[u.trivialityReason] = (beforeTrivialBreakdown[u.trivialityReason] || 0) + 1;
  });

  // 2. Perform generic deterministic replacements for trivial units
  const hardened = dataset.map((u) => ({ ...u }));
  const selectedLocs = new Set(hardened.map((u) => u.canonicalLocator));
  const selectedArts = new Set(hardened.map((u) => `${u.diploma}|${u.article ?? u.canonicalLocator}`));

  const replacementLedger = [];

  for (let i = 0; i < hardened.length; i++) {
    const u = hardened[i];
    const uFeatures = extractStructuralFeatures(u.literalText, u.subdivisionType === 'PARAGRAPH');
    const trivReason = detectTriviality(u.literalText, uFeatures);

    if (trivReason) {
      // Find candidate in same domain
      const candidates = pool
        .filter((c) =>
          c.domain === u.domain &&
          c.currentTextConfidence === 'STRUCTURALLY_CURRENT' &&
          !c.exclusionReason &&
          c.contaminationStatus === 'SAFE_NEW' &&
          !selectedLocs.has(c.canonicalLocator) &&
          !selectedArts.has(`${c.diploma}|${c.article ?? c.canonicalLocator}`) &&
          !/\((?:inclu[íi]d|reda[çc][ãa]o\s+dad|alterad|acrescid)/i.test(c.literalText)
        )
        .map((c) => {
          const cFeatures = extractStructuralFeatures(c.literalText, c.subdivisionType === 'PARAGRAPH');
          const cTriv = detectTriviality(c.literalText, cFeatures);
          return { ...c, f: cFeatures, triv: cTriv };
        })
        .filter((c) => !c.triv)
        // Guard against near-duplicate with all currently selected
        .filter((c) => {
          const cTokens = tokens(c.literalText);
          return hardened.every((h, hi) => hi === i || jaccard(cTokens, tokens(h.literalText)) < 0.80);
        });

      // Sort by structuralInformationScore descending, tie-break by hash
      candidates.sort((a, b) => b.f.structuralInformationScore - a.f.structuralInformationScore || cmpStr(a.literalTextSha256, b.literalTextSha256));

      if (candidates.length === 0) {
        throw new Error(`ABORT_NO_REPLACEMENT_CANDIDATE_FOR ${u.h2Id} in domain ${u.domain}`);
      }

      const rep = candidates[0];

      // Enrich replacement with full metadata
      const doc = docMap.get(rep.officialDocumentId);
      rep.rawPath = `tmp/assertion-decomposition-holdout-v235c/official-documents/${doc.rawSha256}.bin`;
      rep.rawDocumentSha256 = doc.rawSha256;
      rep.decodeEncoding = doc.decodeEncoding;
      rep.normalizedDocumentSha256 = doc.normalizedSha256;
      rep.authority = doc.authority;
      rep.evidenceClass = doc.evidenceClass;
      rep.offsetRepresentation = 'NORMALIZED_TEXT_H21_V1';

      const artM = /_ART_(\d+[A-Z]?)/.exec(rep.canonicalLocator);
      const parM = /_PAR_([A-Z0-9]+)/.exec(rep.canonicalLocator);
      rep.article = artM ? artM[1] : null;
      rep.paragraph = parM ? parM[1] : null;
      rep.inciso = null;
      rep.alinea = null;
      rep.item = null;
      rep.structuralParent = rep.paragraph ? `${rep.diploma}_ART_${rep.article}` : rep.diploma;
      rep.extendedWithPena = false;
      rep.structuralComplexityCandidate = { structuralComplexityScore: rep.structuralComplexityScore };
      rep.antiOverfitting = rep.contamination;
      rep.h2Id = u.h2Id;

      selectedLocs.delete(u.canonicalLocator);
      selectedArts.delete(`${u.diploma}|${u.article ?? u.canonicalLocator}`);
      selectedLocs.add(rep.canonicalLocator);
      selectedArts.add(`${rep.diploma}|${rep.article ?? rep.canonicalLocator}`);

      replacementLedger.push({
        oldH2Id: u.h2Id,
        oldLocator: u.canonicalLocator,
        oldInformationScore: uFeatures.structuralInformationScore,
        replacementLocator: rep.canonicalLocator,
        replacementInformationScore: rep.f.structuralInformationScore,
        reasonCode: trivReason,
        oldText: u.literalText,
        replacementText: rep.literalText
      });

      hardened[i] = rep;
    }
  }

  // 3. Re-score and stratify into 40 STANDARD and 20 HARD
  const afterScored = hardened.map((u) => {
    const f = extractStructuralFeatures(u.literalText, u.subdivisionType === 'PARAGRAPH');
    const triv = detectTriviality(u.literalText, f);
    return {
      h2Id: u.h2Id,
      unit: u,
      features: f,
      trivialityReason: triv,
      isTrivial: !!triv
    };
  });

  const afterTrivialCount = afterScored.filter((u) => u.isTrivial).length;
  if (afterTrivialCount > 0) {
    throw new Error(`ABORT_TRIVIAL_UNITS_STILL_PRESENT count=${afterTrivialCount}`);
  }

  // Stratification: select top 20 by structuralInformationScore among those meeting hard criteria
  const hardEligible = afterScored.filter((u) => u.features.meetsHardCriteria);
  hardEligible.sort((a, b) => b.features.structuralInformationScore - a.features.structuralInformationScore || cmpStr(a.unit.literalTextSha256, b.unit.literalTextSha256));

  const hardLocators = new Set(hardEligible.slice(0, 20).map((u) => u.unit.canonicalLocator));

  const finalUnits = afterScored.map((item) => {
    const targetClass = hardLocators.has(item.unit.canonicalLocator) ? 'HARD' : 'STANDARD';
    const u = item.unit;
    return {
      h2Id: u.h2Id,
      candidateId: u.candidateId,
      domain: u.domain,
      officialDocumentId: u.officialDocumentId,
      authority: u.authority,
      diploma: u.diploma,
      canonicalLocator: u.canonicalLocator,
      structuralParent: u.structuralParent,
      subdivisionType: u.subdivisionType,
      article: u.article,
      paragraph: u.paragraph,
      inciso: u.inciso,
      alinea: u.alinea,
      item: u.item,
      rawDocumentSha256: u.rawDocumentSha256,
      rawPath: u.rawPath,
      decodeEncoding: u.decodeEncoding,
      offsetRepresentation: u.offsetRepresentation,
      normalizedDocumentSha256: u.normalizedDocumentSha256,
      startOffset: u.startOffset,
      endOffset: u.endOffset,
      literalText: u.literalText,
      literalTextSha256: u.literalTextSha256,
      extendedWithPena: u.extendedWithPena,
      evidenceClass: u.evidenceClass,
      currentTextConfidence: u.currentTextConfidence,
      structuralQualityFeatures: item.features,
      targetClass,
      antiOverfitting: u.antiOverfitting
    };
  });

  // 4. Validate All 14 Gates
  const rt = finalUnits.map((u) => ({ h2Id: u.h2Id, ...roundTrip(u) }));
  const rtPassed = rt.filter((r) => r.ok).length;

  const blind = finalUnits.map((u) => ({ h2Id: u.h2Id, originalText: u.literalText }));
  const blindKeyViolations = [];
  for (const b of blind) for (const k of Object.keys(b)) if (!['h2Id', 'originalText'].includes(k)) blindKeyViolations.push(`${b.h2Id}:${k}`);
  const blindValueLeaks = [];
  const hexRe = /\b[0-9a-f]{40,64}\b/i;
  for (const b of blind) {
    if (hexRe.test(b.originalText)) blindValueLeaks.push(`${b.h2Id}:HEX_HASH_IN_TEXT`);
    if (/\b(CP|CPP|CF|CC|CPC|CDC|LEP|LEI|STF_SV)_ART_|STF_SV_\d/.test(b.originalText)) blindValueLeaks.push(`${b.h2Id}:CANONICAL_LOCATOR_IN_TEXT`);
  }

  const goldenFieldNames = ['atomicClaims', 'assertionSpecs', 'normativeFunction', 'modality', 'polarity', 'qualifiers', 'legalSourceTarget'];
  const blindStr = JSON.stringify(blind);
  const finalStr = JSON.stringify(finalUnits);
  const goldenFieldHits = goldenFieldNames.filter((g) => blindStr.includes(`"${g}"`) || finalStr.includes(`"${g}"`));

  const DOMAIN_ORDER = ['PENAL_GERAL', 'PENAL_ESPECIAL', 'PROCESSO_PENAL', 'CONSTITUCIONAL', 'ADMINISTRATIVO', 'CIVIL', 'PROCESSO_CIVIL'];
  const QUOTAS = { PENAL_GERAL: 10, PENAL_ESPECIAL: 8, PROCESSO_PENAL: 12, CONSTITUCIONAL: 8, ADMINISTRATIVO: 8, CIVIL: 7, PROCESSO_CIVIL: 7 };
  const domainAlloc = Object.fromEntries(DOMAIN_ORDER.map((d) => [d, finalUnits.filter((u) => u.domain === d).length]));
  const domainValid = DOMAIN_ORDER.every((d) => domainAlloc[d] === QUOTAS[d]);

  const uniqueText = new Set(finalUnits.map((u) => u.literalTextSha256)).size;
  const uniqueLoc = new Set(finalUnits.map((u) => u.canonicalLocator)).size;

  let nearDupPairs = 0;
  for (let i = 0; i < finalUnits.length; i++) {
    for (let j = i + 1; j < finalUnits.length; j++) {
      if (jaccard(tokens(finalUnits[i].literalText), tokens(finalUnits[j].literalText)) >= 0.8) nearDupPairs++;
    }
  }

  const sameArticleInDataset = finalUnits.length - new Set(finalUnits.map((u) => `${u.diploma}|${u.article ?? u.canonicalLocator}`)).size;
  const nonContaminatedCount = finalUnits.filter((u) => u.antiOverfitting && u.antiOverfitting.contaminationStatus === 'SAFE_NEW').length;
  const structurallyCurrentCount = finalUnits.filter((u) => u.currentTextConfidence === 'STRUCTURALLY_CURRENT').length;
  const judgeOfGuaranteesCount = finalUnits.filter((u) => /juiz(es)?\s+das\s+garantias/i.test(u.literalText) || (u.diploma === 'CPP' && /^3[A-F]$/.test(String(u.article)))).length;

  const standardCount = finalUnits.filter((u) => u.targetClass === 'STANDARD').length;
  const hardCount = finalUnits.filter((u) => u.targetClass === 'HARD').length;

  const validationTests = {
    sourceRoundTrip: { passed: rtPassed, total: finalUnits.length, failures: rt.filter((r) => !r.ok) },
    uniqueLiteralText: { unique: uniqueText, total: finalUnits.length },
    uniqueCanonicalLocator: { unique: uniqueLoc, total: finalUnits.length },
    nearDuplicatePairs: nearDupPairs,
    multipleUnitsFromSameArticle: sameArticleInDataset,
    nonContaminated: { passed: nonContaminatedCount, total: finalUnits.length },
    structurallyCurrent: { passed: structurallyCurrentCount, total: finalUnits.length },
    domainAllocation: { actual: domainAlloc, expected: QUOTAS, valid: domainValid },
    judgeOfGuaranteesUnits: judgeOfGuaranteesCount,
    blindPreviewKeyViolations: blindKeyViolations,
    blindPreviewValueLeaks: blindValueLeaks,
    goldenFieldsPresent: goldenFieldHits,
    modelGeneratedText: 0,
    externalCalls: 0,
    stratificationResult: { standardCount, hardCount, targetMet: standardCount === 40 && hardCount === 20 }
  };

  const allPass =
    rtPassed === 60 &&
    uniqueText === 60 &&
    uniqueLoc === 60 &&
    nearDupPairs === 0 &&
    sameArticleInDataset === 0 &&
    nonContaminatedCount === 60 &&
    structurallyCurrentCount === 60 &&
    domainValid &&
    judgeOfGuaranteesCount === 0 &&
    blindKeyViolations.length === 0 &&
    blindValueLeaks.length === 0 &&
    goldenFieldHits.length === 0 &&
    standardCount === 40 &&
    hardCount === 20;

  // 5. Build Review Queue
  const reviewQueue = finalUnits.map((u) => ({
    h2Id: u.h2Id,
    originalText: u.literalText,
    canonicalLocator: u.canonicalLocator,
    domain: u.domain,
    targetClass: u.targetClass,
    structuralInformationScore: u.structuralQualityFeatures.structuralInformationScore,
    structuralQualityFeatures: u.structuralQualityFeatures,
    officialSource: {
      officialDocumentId: u.officialDocumentId,
      authority: u.authority,
      diploma: u.diploma,
      rawDocumentSha256: u.rawDocumentSha256,
      startOffset: u.startOffset,
      endOffset: u.endOffset,
      offsetRepresentation: u.offsetRepresentation
    },
    contaminationSummary: {
      status: u.antiOverfitting.contaminationStatus,
      normalizedOverlapWithH1: u.antiOverfitting.normalizedOverlapWithH1,
      sameArticleAsH1: u.antiOverfitting.sameArticleAsH1,
      checkerSignals: u.antiOverfitting.checkerSignals
    },
    currentTextConfidence: u.currentTextConfidence,
    reviewStatus: 'PENDING_REVIEW'
  }));

  // 6. Build Quality Audit Summary
  const qualityAudit = {
    protocol: 'V2.3.7-H2.1.1',
    timestamp: new Date().toISOString(),
    qualityFormula: {
      formula: '2.0*conditions + 3.0*exceptions + 1.5*alternatives + 1.5*legalConsequences + 1.0*crossReferences + 1.0*negatives + 1.0*temporals + 0.5*clauses + 0.5*enumerations + 0.5*modalVerbs + 0.5*subdivisionDepth + 0.5*explicitSubjects',
      hardCriteria: 'conditionalMarkerCount >= 2 || (conditionalMarkerCount >= 1 && exceptionMarkerCount >= 1) || (negativeMarkerCount >= 1 && exceptionMarkerCount >= 1) || (exceptionMarkerCount >= 1 && alternativeMarkerCount >= 1) || (crossReferenceCount >= 1 && conditionalMarkerCount >= 1) || (temporalMarkerCount >= 1 && conditionalMarkerCount >= 1) || alternativeMarkerCount >= 2 || (clauseCount >= 4 && legalConsequenceMarkerCount >= 2)'
    },
    distributionBefore: {
      total: 60,
      trivial: beforeTrivialCount,
      trivialBreakdown: beforeTrivialBreakdown,
      lowInformation: beforeAudit.filter((u) => !u.isTrivial && u.features.structuralInformationScore < 4.0).length,
      standard: beforeAudit.filter((u) => !u.isTrivial && !u.features.meetsHardCriteria && u.features.structuralInformationScore >= 4.0).length,
      hardEligible: beforeAudit.filter((u) => !u.isTrivial && u.features.meetsHardCriteria).length
    },
    distributionAfter: {
      total: 60,
      trivial: afterTrivialCount,
      pureEffectiveDate: 0,
      pureRevocation: 0,
      pureOrganizationalLocation: 0,
      pureEditorialOrTransitional: 0,
      standard: standardCount,
      hard: hardCount
    },
    distributionByDomain: Object.fromEntries(
      DOMAIN_ORDER.map((d) => [
        d,
        {
          total: finalUnits.filter((u) => u.domain === d).length,
          standard: finalUnits.filter((u) => u.domain === d && u.targetClass === 'STANDARD').length,
          hard: finalUnits.filter((u) => u.domain === d && u.targetClass === 'HARD').length
        }
      ])
    ),
    replacementsCount: replacementLedger.length,
    validationResult: allPass ? 'ALL_PASS' : 'GATE_FAILURE'
  };

  // 7. Write outputs to tmp/assertion-decomposition-holdout-v237h211/
  for (const d of ['dataset', 'audit']) fs.mkdirSync(path.join(OUT_DIR, d), { recursive: true });
  const W = (rel, obj) => {
    const p = path.join(OUT_DIR, rel);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    return sha256(fs.readFileSync(p));
  };

  const artifactHashes = {};
  artifactHashes['dataset/h2-source-dataset.hardened.internal.json'] = W('dataset/h2-source-dataset.hardened.internal.json', finalUnits);
  artifactHashes['dataset/h2-blind-input.hardened.preview.json'] = W('dataset/h2-blind-input.hardened.preview.json', blind);
  artifactHashes['dataset/h2-source-review-queue.hardened.json'] = W('dataset/h2-source-review-queue.hardened.json', reviewQueue);
  artifactHashes['audit/h2-quality-audit.json'] = W('audit/h2-quality-audit.json', qualityAudit);
  artifactHashes['audit/h2-replacement-ledger.json'] = W('audit/h2-replacement-ledger.json', replacementLedger);
  artifactHashes['audit/h2-validation-tests.json'] = W('audit/h2-validation-tests.json', { allPass, validationTests });

  const scriptHash = sha256(fs.readFileSync(__filename));
  artifactHashes['scripts/h2-quality-hardening-h211.cjs'] = scriptHash;

  const freezeRecord = {
    protocol: 'V2.3.7-H2.1.1',
    verifiedH21Baseline: verifiedHashes,
    hardenedArtifacts: artifactHashes
  };
  W('audit/h2-hash-freeze.json', freezeRecord);

  console.log(JSON.stringify({
    allPass,
    replacements: replacementLedger.length,
    distribution: { standard: standardCount, hard: hardCount },
    domainAlloc,
    hashes: artifactHashes
  }, null, 2));
}

if (require.main === module) main();
module.exports = { extractStructuralFeatures, detectTriviality };
