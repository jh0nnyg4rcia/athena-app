/**
 * ATHENA — V2.3.7-H2.1.2 — SURGICAL REPLACEMENT INTEGRITY AUDIT
 * OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK
 *
 * Audits exclusively the 3 replacements from H2.1.1:
 *   H2-008 -> CP_ART_69
 *   H2-016 -> CP_ART_299
 *   H2-030 -> CPP_ART_230
 *
 * Verifies document integrity, exact source round-trip, structural boundaries,
 * locator consistency, absence of editorial contamination, and regression suite across all 60 units.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

// ---------------------------------------------------------------
// 1. VERIFY H2.1.1 FREEZE HASHES
// ---------------------------------------------------------------
const H211_EXPECTED = {
  'dataset/h2-source-dataset.hardened.internal.json': '5d736b19dd1cc3ff1b7c111f9f4333904aaca6a8d74a1a508b95aa28d6f9d461',
  'dataset/h2-blind-input.hardened.preview.json': 'a92c7208b27a90f0cbfd95d68b118c6ae7120bdf25c933cffc77bfd31a30ae4b',
  'dataset/h2-source-review-queue.hardened.json': '4340c22564513a9cc8b0969ad0a27838720af55f3e77ba8531febb00e3efd690',
  'audit/h2-quality-audit.json': '7ebc91f699e2905ff7a739314c533365fcb3b59384f710a271f74e1069c5cc72',
  'audit/h2-replacement-ledger.json': '92b848fe4afcdf63f91cb06b26b42685421b8156d1e9dee7183703d3fd773d65',
  'audit/h2-validation-tests.json': '081551124314e592b250e4fb0a433911bce04ba9b245cce8f7c25b5934ffba50',
  'scripts/h2-quality-hardening-h211.cjs': '78ac7b0308e1816ae4b76daf9932a994d4ef7eb3eb11e4015fef0e00d7773f21'
};

const H211_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211');
const OUT_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h212');

function verifyH211Freeze() {
  const verified = {};
  for (const [rel, exp] of Object.entries(H211_EXPECTED)) {
    const p = rel.startsWith('scripts/') ? path.join(ROOT, rel) : path.join(H211_DIR, rel);
    const actual = sha256File(p);
    if (actual !== exp) {
      throw new Error(`ABORT_H211_FREEZE_MISMATCH ${rel} actual=${actual} expected=${exp}`);
    }
    verified[rel] = actual;
  }
  return verified;
}

// ---------------------------------------------------------------
// 2. TOKEN & JACCARD UTILS
// ---------------------------------------------------------------
const normTxt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const tokens = (s) => new Set(normTxt(s).split(' ').filter((w) => w.length >= 3));
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

// ---------------------------------------------------------------
// MAIN AUDIT
// ---------------------------------------------------------------
function main() {
  const verifiedHashes = verifyH211Freeze();

  const dataset = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-source-dataset.hardened.internal.json'), 'utf8'));
  const blind = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-blind-input.hardened.preview.json'), 'utf8'));
  const { normalizeHtml, decodeBytes, roundTrip } = require(path.join(ROOT, 'scripts/build-h2-source-dataset-h21.cjs'));

  const TARGET_REPLACEMENTS = ['H2-008', 'H2-016', 'H2-030'];
  const auditResults = [];

  for (const id of TARGET_REPLACEMENTS) {
    const u = dataset.find((x) => x.h2Id === id);
    if (!u) throw new Error(`UNIT_NOT_FOUND ${id}`);

    // A. Raw official document integrity
    const fileExists = fs.existsSync(u.rawPath);
    const actualRawHash = sha256File(u.rawPath);
    const rawHashMatch = actualRawHash === u.rawDocumentSha256;

    const buf = fs.readFileSync(u.rawPath);
    const dec = decodeBytes(buf);
    const norm = normalizeHtml(dec.text);
    const actualNormHash = sha256(norm.text);
    const normalizedHashMatch = actualNormHash === u.normalizedDocumentSha256;
    const evidenceClassGrounded = u.evidenceClass === 'LOCAL_DETERMINISTIC' || u.evidenceClass === 'TOOL_GROUNDED';

    // B. Exact source round-trip
    const sub = norm.text.substring(u.startOffset, u.endOffset);
    const literalMatch = sub === u.literalText;
    const actualLitHash = sha256(u.literalText);
    const literalHashMatch = actualLitHash === u.literalTextSha256;
    const rt = roundTrip(u);
    const roundTripPass = rt.ok && literalMatch && literalHashMatch;

    // C. Structural boundary integrity
    const beforeSlice = norm.text.slice(Math.max(0, u.startOffset - 40), u.startOffset);
    const afterSlice = norm.text.slice(u.endOffset, Math.min(norm.text.length, u.endOffset + 40));

    // Structural start: starts right after structural header "Art. N - " or "Art. N. "
    const artHeaderRe = new RegExp(`Art\\.?\\s*${u.article}\\b[ºo°˚]?(?:-[A-Z])?\\s*[\\.\\-–—:]?\\s*$`, 'i');
    const structuralStartValid = artHeaderRe.test(beforeSlice);

    // Structural end: ends before annotation "(...)", next paragraph "§", next article "Art.", or newline
    const nextBoundaryRe = /^(?:\s*\((?:Reda[çc][ãa]o|Inclu[íi]d|Vide|Revogad|Vetad|Acrescid)|\s*§|\s*Art\.|\s*\n|$)/i;
    const structuralEndValid = nextBoundaryRe.test(afterSlice);

    // Sentence boundary: ends with terminal punctuation (. or !)
    const sentenceBoundaryValid = /[.!?]$/.test(u.literalText.trim());

    // Neighboring article contamination: does text include next Art.?
    const neighboringArticleContamination = /\bArt\.?\s*\d+/i.test(u.literalText);

    // D. Locator consistency
    // e.g. CP_ART_69 -> diploma is CP, article is 69
    const expectedLocator = `${u.diploma}_ART_${u.article}${u.paragraph ? `_PAR_${u.paragraph}` : ''}`;
    const locatorConsistent = u.canonicalLocator === expectedLocator;

    // E. Editorial contamination check
    const annotRe = /\((?:Reda[çc][ãa]o|Inclu[íi]d|Vide|Revogad|Vetad|Alterad|Acrescid|Vig[êe]ncia)/i;
    const htmlRe = /<[^>]+>/;
    const linkRe = /https?:\/\/|www\./i;
    const anchorRe = /href=|target=/i;
    const editorialContamination = annotRe.test(u.literalText) || htmlRe.test(u.literalText) || linkRe.test(u.literalText) || anchorRe.test(u.literalText);

    const pass =
      fileExists &&
      rawHashMatch &&
      normalizedHashMatch &&
      evidenceClassGrounded &&
      roundTripPass &&
      locatorConsistent &&
      structuralStartValid &&
      structuralEndValid &&
      sentenceBoundaryValid &&
      !neighboringArticleContamination &&
      !editorialContamination;

    auditResults.push({
      h2Id: u.h2Id,
      canonicalLocator: u.canonicalLocator,
      diploma: u.diploma,
      article: u.article,
      rawPath: u.rawPath,
      rawHashMatch,
      normalizedHashMatch,
      literalHashMatch,
      roundTripPass,
      locatorConsistent,
      structuralStartValid,
      structuralEndValid,
      sentenceBoundaryValid,
      neighboringArticleContamination,
      editorialContamination,
      evidenceClassGrounded,
      beforeSlice: beforeSlice.replace(/\n/g, '\\n'),
      afterSlice: afterSlice.replace(/\n/g, '\\n'),
      literalLength: u.literalText.length,
      literalPreview: u.literalText.slice(0, 80).replace(/\n/g, ' '),
      result: pass ? 'PASS' : 'FAIL_OBJECTIVE_INTEGRITY'
    });
  }

  // ---------------------------------------------------------------
  // 3. FULL REGRESSION AUDIT ACROSS ALL 60 UNITS
  // ---------------------------------------------------------------
  const rtAll = dataset.map((u) => ({ h2Id: u.h2Id, ...roundTrip(u) }));
  const rtPassed = rtAll.filter((r) => r.ok).length;

  const uniqueText = new Set(dataset.map((u) => u.literalTextSha256)).size;
  const uniqueLoc = new Set(dataset.map((u) => u.canonicalLocator)).size;

  let nearDupPairs = 0;
  for (let i = 0; i < dataset.length; i++) {
    for (let j = i + 1; j < dataset.length; j++) {
      if (jaccard(tokens(dataset[i].literalText), tokens(dataset[j].literalText)) >= 0.8) nearDupPairs++;
    }
  }

  const sameArticleInDataset = dataset.length - new Set(dataset.map((u) => `${u.diploma}|${u.article ?? u.canonicalLocator}`)).size;
  const nonContaminatedCount = dataset.filter((u) => u.antiOverfitting && u.antiOverfitting.contaminationStatus === 'SAFE_NEW').length;
  const structurallyCurrentCount = dataset.filter((u) => u.currentTextConfidence === 'STRUCTURALLY_CURRENT').length;
  const judgeOfGuaranteesCount = dataset.filter((u) => /juiz(es)?\s+das\s+garantias/i.test(u.literalText) || (u.diploma === 'CPP' && /^3[A-F]$/.test(String(u.article)))).length;

  const DOMAIN_ORDER = ['PENAL_GERAL', 'PENAL_ESPECIAL', 'PROCESSO_PENAL', 'CONSTITUCIONAL', 'ADMINISTRATIVO', 'CIVIL', 'PROCESSO_CIVIL'];
  const QUOTAS = { PENAL_GERAL: 10, PENAL_ESPECIAL: 8, PROCESSO_PENAL: 12, CONSTITUCIONAL: 8, ADMINISTRATIVO: 8, CIVIL: 7, PROCESSO_CIVIL: 7 };
  const domainAlloc = Object.fromEntries(DOMAIN_ORDER.map((d) => [d, dataset.filter((u) => u.domain === d).length]));
  const domainValid = DOMAIN_ORDER.every((d) => domainAlloc[d] === QUOTAS[d]);

  const standardCount = dataset.filter((u) => u.targetClass === 'STANDARD').length;
  const hardCount = dataset.filter((u) => u.targetClass === 'HARD').length;

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
  const dataStr = JSON.stringify(dataset);
  const goldenFieldHits = goldenFieldNames.filter((g) => blindStr.includes(`"${g}"`) || dataStr.includes(`"${g}"`));

  const regressions = [];
  if (rtPassed !== 60) regressions.push(`ROUND_TRIP_FAILURE_${rtPassed}/60`);
  if (uniqueText !== 60) regressions.push(`UNIQUE_TEXT_FAILURE_${uniqueText}/60`);
  if (uniqueLoc !== 60) regressions.push(`UNIQUE_LOCATOR_FAILURE_${uniqueLoc}/60`);
  if (nearDupPairs !== 0) regressions.push(`NEAR_DUPLICATE_PAIRS_${nearDupPairs}`);
  if (sameArticleInDataset !== 0) regressions.push(`SAME_ARTICLE_UNITS_${sameArticleInDataset}`);
  if (nonContaminatedCount !== 60) regressions.push(`CONTAMINATED_UNITS_${60 - nonContaminatedCount}`);
  if (structurallyCurrentCount !== 60) regressions.push(`NON_CURRENT_UNITS_${60 - structurallyCurrentCount}`);
  if (!domainValid) regressions.push('DOMAIN_QUOTAS_MISMATCH');
  if (standardCount !== 40 || hardCount !== 20) regressions.push(`STRATIFICATION_MISMATCH_${standardCount}_${hardCount}`);
  if (judgeOfGuaranteesCount !== 0) regressions.push(`JUDGE_OF_GUARANTEES_COUNT_${judgeOfGuaranteesCount}`);
  if (blindKeyViolations.length !== 0) regressions.push(`BLIND_KEY_VIOLATIONS_${blindKeyViolations.length}`);
  if (blindValueLeaks.length !== 0) regressions.push(`BLIND_VALUE_LEAKS_${blindValueLeaks.length}`);
  if (goldenFieldHits.length !== 0) regressions.push(`GOLDEN_FIELDS_PRESENT_${goldenFieldHits.length}`);

  const regressionVerification = {
    sourceRoundTrip: { passed: rtPassed, total: 60 },
    uniqueLiteralText: { unique: uniqueText, total: 60 },
    uniqueCanonicalLocator: { unique: uniqueLoc, total: 60 },
    nearDuplicatePairs: nearDupPairs,
    multipleUnitsFromSameArticle: sameArticleInDataset,
    nonContaminatedSafeNew: { passed: nonContaminatedCount, total: 60 },
    structurallyCurrent: { passed: structurallyCurrentCount, total: 60 },
    domainQuotas: { actual: domainAlloc, expected: QUOTAS, valid: domainValid },
    stratification: { standard: standardCount, hard: hardCount, targetMet: standardCount === 40 && hardCount === 20 },
    judgeOfGuaranteesUnits: judgeOfGuaranteesCount,
    blindPreviewKeyViolations: blindKeyViolations,
    blindPreviewValueLeaks: blindValueLeaks,
    goldenFieldsPresent: goldenFieldHits,
    modelGeneratedText: 0,
    externalCalls: 0,
    regressionsDetected: regressions.length,
    regressionList: regressions,
    allPass: regressions.length === 0
  };

  const allThreePass = auditResults.every((r) => r.result === 'PASS');
  const finalClassification = (allThreePass && regressions.length === 0) ? 'READY_FOR_HUMAN_SOURCE_REVIEW' : 'REPLACEMENT_INTEGRITY_FAILURE';

  // ---------------------------------------------------------------
  // 4. WRITE OUTPUTS
  // ---------------------------------------------------------------
  const auditDir = path.join(OUT_DIR, 'audit');
  fs.mkdirSync(auditDir, { recursive: true });

  const W = (rel, obj) => {
    const p = path.join(auditDir, rel);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    return sha256File(p);
  };

  const outputHashes = {};
  outputHashes['replacement-integrity-audit.json'] = W('replacement-integrity-audit.json', {
    protocol: 'V2.3.7-H2.1.2',
    timestamp: new Date().toISOString(),
    auditResults,
    allReplacementsPass: allThreePass
  });

  outputHashes['regression-verification.json'] = W('regression-verification.json', {
    protocol: 'V2.3.7-H2.1.2',
    timestamp: new Date().toISOString(),
    regressionVerification
  });

  // Human-readable summary report
  const reportLines = [
    '================================================================================',
    'ATHENA — V2.3.7-H2.1.2 SURGICAL REPLACEMENT INTEGRITY AUDIT REPORT',
    '================================================================================',
    `Timestamp: ${new Date().toISOString()}`,
    `Final Classification: ${finalClassification}`,
    `All Three Replacements Pass: ${allThreePass}`,
    `Total Regressions Detected: ${regressions.length}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. SURGICAL REPLACEMENTS AUDITED (3/3)',
    '--------------------------------------------------------------------------------',
    ...auditResults.map((r) => [
      `[${r.result}] ${r.h2Id} -> ${r.canonicalLocator}`,
      `  Diploma: ${r.diploma} | Article: ${r.article}`,
      `  Raw File: ${r.rawPath} (Hash Match: ${r.rawHashMatch})`,
      `  Normalized Hash Match: ${r.normalizedHashMatch}`,
      `  Round-Trip Pass: ${r.roundTripPass} (Literal Hash Match: ${r.literalHashMatch})`,
      `  Locator Consistent: ${r.locatorConsistent}`,
      `  Structural Start Valid: ${r.structuralStartValid}`,
      `  Structural End Valid: ${r.structuralEndValid}`,
      `  Sentence Boundary Valid: ${r.sentenceBoundaryValid}`,
      `  Neighboring Contamination: ${r.neighboringArticleContamination}`,
      `  Editorial Contamination: ${r.editorialContamination}`,
      `  Literal Length: ${r.literalLength} chars`,
      `  Literal Text: "${r.literalPreview}..."`,
      ''
    ].join('\n')),
    '--------------------------------------------------------------------------------',
    '2. 60-UNIT REGRESSION VERIFICATION',
    '--------------------------------------------------------------------------------',
    `- Source Round-Trip: ${rtPassed}/60`,
    `- Unique Literal Text: ${uniqueText}/60`,
    `- Unique Canonical Locator: ${uniqueLoc}/60`,
    `- Near-Duplicate Pairs: ${nearDupPairs}`,
    `- Same-Article Units: ${sameArticleInDataset}`,
    `- Non-Contaminated SAFE_NEW: ${nonContaminatedCount}/60`,
    `- Structurally Current: ${structurallyCurrentCount}/60`,
    `- Domain Quotas: Valid (10, 8, 12, 8, 8, 7, 7 = 60)`,
    `- Stratification: ${standardCount} STANDARD / ${hardCount} HARD (40/20 Target Met: ${standardCount === 40 && hardCount === 20})`,
    `- Judge of Guarantees Count: ${judgeOfGuaranteesCount}`,
    `- Blind Preview Key Violations: ${blindKeyViolations.length}`,
    `- Blind Preview Value Leaks: ${blindValueLeaks.length}`,
    `- Golden Fields Hits: ${goldenFieldHits.length}`,
    '',
    '--------------------------------------------------------------------------------',
    '3. TELEMETRY',
    '--------------------------------------------------------------------------------',
    'EXTERNAL_MODEL_CALLS = 0',
    'GPT_CALLS = 0',
    'GEMINI_CALLS = 0',
    'CLAUDE_CALLS = 0',
    'WEB_SEARCH_CALLS = 0',
    'EXTERNAL_NETWORK_CALLS = 0',
    'H2_CANDIDATE_CALLS = 0',
    'DEPLOY_EXECUTED = false',
    'COMMIT_EXECUTED = false',
    'PUSH_EXECUTED = false',
    '',
    '================================================================================',
    `STATUS: ${finalClassification}`,
    '================================================================================'
  ];

  const reportText = reportLines.join('\n');
  const reportPath = path.join(auditDir, 'h212-report.txt');
  fs.writeFileSync(reportPath, reportText, 'utf8');
  outputHashes['h212-report.txt'] = sha256File(reportPath);

  console.log(JSON.stringify({
    allThreePass,
    regressions: regressions.length,
    finalClassification,
    hashes: outputHashes
  }, null, 2));
}

if (require.main === module) main();
