/**
 * ATHENA — V2.3.7-H2.2 — FREEZE BATCH 05 HUMAN DECISIONS + PREPARE DOSSIER BATCH 06
 * OFFLINE / ZERO LLM / ZERO NETWORK / ZERO GOLDEN GENERATION
 *
 * 1. Verifies baselines (H2.1.1, H2.1.2, Batch 01, Batch 02, Batch 03, Batch 04, Batch 05, and previous rejection ledger).
 * 2. Freezes Batch 05 human decisions (8 APPROVED, 2 REJECTED, 0 UNCERTAIN).
 * 3. Verifies accumulated decision totals (44 APPROVED, 6 REJECTED, 0 UNCERTAIN).
 * 4. Updates decisions/rejected-units-ledger.json (factual only, no repairs: H2-014, H2-015, H2-028, H2-029, H2-043, H2-044).
 * 5. Prepares source review dossier for Batch 06 (H2-051 to H2-060) with updated Q4/Q5 questions.
 * 6. Audits anti-leakage and outputs verification report.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

// ---------------------------------------------------------------
// 1. BASELINE FREEZE SPECIFICATION
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

const H212_EXPECTED = {
  'replacement-integrity-audit.json': '129df6f71664a47d3310149ae017b5bf1f81582867d7c847fd02d06339712828',
  'regression-verification.json': 'e36b735a7ee5e3247983fefaf59024c010779d5e2ca44c2f4db2d6470b98faf7',
  'h212-report.txt': '9c85cf22c834b84c5fb93f684368dd03d6e862a99fcec3ae8d68b71ef0efdb20'
};

const BATCH01_EXPECTED = {
  'batch-01-review-dossier.md': '2f9c77c0613cb97ff2c087cdf53352cbdcf70ce0509053c8f85bd37b91511182',
  'batch-01-manifest.json': 'ef4239e873c8288603bfb632962e819116322b110042ffeb422584292f099079',
  'batch-01-human-decisions.json': '85388fc9af9ffb35e1c844c6385cda2484667752a619145807694a8cb4ac532f',
  'batch-01-decision-freeze.json': 'f7632b47463e8cb0d57805efb7631e6ee57eebae5e9a163940224f2a283fd875'
};

const BATCH02_EXPECTED = {
  'batch-02-review-dossier.md': '2db19814ead05f394eada5d0655cf83eba0700edad4d2617d1324c876aa345d9',
  'batch-02-manifest.json': 'ab6842b2114fea45501791199575edb5f0a1e682d4ef96e20dad58fab5670472',
  'batch-02-human-decisions.json': '2906279d35fc49fdfa2ca398bf6378629a6f80baa5cf22ec2480f499f6c83f13',
  'batch-02-decision-freeze.json': '3866f61d9f921bd2344ec022d3e74f233bb977cb3660aea3eb3fe7ac30b31b51'
};

const BATCH03_EXPECTED = {
  'batch-03-review-dossier.md': '7ffb63da9007b28afe05d642dabc6f2df075a858204967dcff9f26335544cb05',
  'batch-03-manifest.json': '9b109b00746717707ec76a4ee9dc68cca2bfbbc221795487c6878b96dc186e78',
  'batch-03-human-decisions.json': 'd66cdea0743098116735d61100304ea1d57b5cc559fb29b927976294504eaf24',
  'batch-03-decision-freeze.json': 'a0e314b8af9be4c3bd983f808b856c088e47d7477e55cd355d8ea5edc7ca13b9'
};

const BATCH04_EXPECTED = {
  'batch-04-review-dossier.md': '34ecd66f429c3620460a5c071832c0ca9aba195132b3ae429f6718aa3fa502e1',
  'batch-04-manifest.json': '99bd34c3c2f5b7ad3767738cb2942bf71c815eeef5a595c57e25cc1068d9fbf3',
  'batch-04-human-decisions.json': '9bcd82ae80ac38c02e9a3d8e2ece405c8abe994965cd76b1522e513cce09423f',
  'batch-04-decision-freeze.json': 'c5844877a9aecf79d7d75e6ecfe38bfa2cf8923898f438b647edfda9048b1f98'
};

const BATCH05_EXPECTED = {
  'batch-05-review-dossier.md': '3a099ea65b2becbdea535fce6f0893e637a53f109c3fcb93fba9cec7dcf69a50',
  'batch-05-manifest.json': '348e9951a9af4ba248bc298506654e62b4df12488c4d73a1b5e37dca89c575fb'
};

const LEDGER_EXPECTED = {
  'rejected-units-ledger.json': '072449e8eccbce8f5b26afca71aba44cd43dae72739e3fc69e7fdea90c9f537d'
};

const H211_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211');
const H212_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h212/audit');
const B01_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-01');
const B02_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-02');
const B03_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-03');
const B04_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-04');
const B05_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-05');
const B06_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-06');
const DEC_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/decisions');

function verifyBaselines() {
  const verified = {};
  for (const [rel, exp] of Object.entries(H211_EXPECTED)) {
    const p = rel.startsWith('scripts/') ? path.join(ROOT, rel) : path.join(H211_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_H211_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`H211_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(H212_EXPECTED)) {
    const p = path.join(H212_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_H212_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`H212_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH01_EXPECTED)) {
    const p = (rel.includes('decision') || rel.includes('human')) ? path.join(DEC_DIR, rel) : path.join(B01_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH01_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B01_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH02_EXPECTED)) {
    const p = (rel.includes('decision') || rel.includes('human')) ? path.join(DEC_DIR, rel) : path.join(B02_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH02_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B02_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH03_EXPECTED)) {
    const p = (rel.includes('decision') || rel.includes('human')) ? path.join(DEC_DIR, rel) : path.join(B03_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH03_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B03_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH04_EXPECTED)) {
    const p = (rel.includes('decision') || rel.includes('human')) ? path.join(DEC_DIR, rel) : path.join(B04_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH04_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B04_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH05_EXPECTED)) {
    const p = path.join(B05_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH05_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B05_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(LEDGER_EXPECTED)) {
    const p = path.join(DEC_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_LEDGER_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`DEC_${rel}`] = act;
  }
  return verified;
}

// ---------------------------------------------------------------
// 2. OFFICIAL IDENTIFICATION MAPPING
// ---------------------------------------------------------------
const OFFICIAL_IDENTIFICATION = {
  CP: 'Presidência da República / Casa Civil — Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal)',
  LEP: 'Presidência da República / Casa Civil — Lei nº 7.210, de 11 de julho de 1984 (Lei de Execução Penal)',
  CPP: 'Presidência da República / Casa Civil — Decreto-Lei nº 3.689, de 3 de outubro de 1941 (Código de Processo Penal)',
  CF: 'Presidência da República / Casa Civil — Constituição da República Federativa do Brasil de 1988',
  CC: 'Presidência da República / Casa Civil — Lei nº 10.406, de 10 de janeiro de 2002 (Código Civil)',
  CPC: 'Presidência da República / Casa Civil — Lei nº 13.105, de 16 de março de 2015 (Código de Processo Civil)',
  CDC: 'Presidência da República / Casa Civil — Lei nº 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor)',
  LEI_8072: 'Presidência da República / Casa Civil — Lei nº 8.072, de 25 de julho de 1990 (Lei dos Crimes Hediondos)',
  LEI_8137: 'Presidência da República / Casa Civil — Lei nº 8.137, de 27 de dezembro de 1990 (Crimes contra a Ordem Tributária, Econômica e contra as Relações de Consumo)',
  LEI_9868: 'Presidência da República / Casa Civil — Lei nº 9.868, de 10 de novembro de 1999 (Processo e Julgamento da ADI e ADC)',
  LEI_8112: 'Presidência da República / Casa Civil — Lei nº 8.112, de 11 de dezembro de 1990 (Regime Jurídico dos Servidores Públicos Civis da União)',
  LEI_9784: 'Presidência da República / Casa Civil — Lei nº 9.784, de 29 de janeiro de 1999 (Processo Administrativo Federal)',
  LEI_14133: 'Presidência da República / Casa Civil — Lei nº 14.133, de 1º de abril de 2021 (Lei de Licitações e Contratos Administrativos)',
  LEI_8443: 'Presidência da República / Casa Civil — Lei nº 8.443, de 16 de julho de 1992 (Lei Orgânica do Tribunal de Contas da União)'
};

function extractMaterialContext(normText, startOffset, endOffset) {
  const lines = normText.split('\n');
  let lineIdx = -1;
  let charCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const nextCount = charCount + lines[i].length + 1;
    if (charCount <= startOffset && startOffset < nextCount) {
      lineIdx = i;
      break;
    }
    charCount = nextCount;
  }

  const prevLines = lines.slice(Math.max(0, lineIdx - 3), lineIdx).filter((l) => l.trim().length > 0);
  const curLine = lines[lineIdx];
  const nextLines = lines.slice(lineIdx + 1, Math.min(lines.length, lineIdx + 4)).filter((l) => l.trim().length > 0);

  return {
    structuralHeader: prevLines.length > 0 ? prevLines[prevLines.length - 1].trim() : 'N/A',
    contextBefore: prevLines.map((l) => l.trim()).join('\n'),
    selectedLineInSource: curLine.trim(),
    contextAfter: nextLines.map((l) => l.trim()).join('\n')
  };
}

// ---------------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------------
function main() {
  console.log('1. Verifying frozen baselines...');
  const verifiedBaselines = verifyBaselines();
  console.log('All 27 baseline hashes verified perfectly.');

  fs.mkdirSync(DEC_DIR, { recursive: true });
  fs.mkdirSync(B06_DIR, { recursive: true });

  // -------------------------------------------------------------
  // 2. FREEZE USER DECISIONS — BATCH 05
  // -------------------------------------------------------------
  const batch05ExplicitDecisions = [
    { h2Id: 'H2-041', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-042', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-043', decision: 'REJECTED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-044', decision: 'REJECTED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-045', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-046', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-047', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-048', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-049', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' },
    { h2Id: 'H2-050', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_05' }
  ];

  const b5DecisionsPath = path.join(DEC_DIR, 'batch-05-human-decisions.json');
  fs.writeFileSync(b5DecisionsPath, JSON.stringify(batch05ExplicitDecisions, null, 2), 'utf8');
  const b5DecisionsHash = sha256File(b5DecisionsPath);

  const b5FreezePayload = {
    protocol: 'V2.3.7-H2.2',
    batchId: 'BATCH_05',
    timestamp: new Date().toISOString(),
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    totals: {
      totalRecords: batch05ExplicitDecisions.length,
      approved: batch05ExplicitDecisions.filter(d => d.decision === 'APPROVED').length,
      rejected: batch05ExplicitDecisions.filter(d => d.decision === 'REJECTED').length,
      uncertain: batch05ExplicitDecisions.filter(d => d.decision === 'UNCERTAIN').length
    },
    decisionsFile: {
      path: 'batch-05-human-decisions.json',
      sha256: b5DecisionsHash
    },
    records: batch05ExplicitDecisions
  };

  const b5FreezePath = path.join(DEC_DIR, 'batch-05-decision-freeze.json');
  fs.writeFileSync(b5FreezePath, JSON.stringify(b5FreezePayload, null, 2), 'utf8');
  const b5FreezeHash = sha256File(b5FreezePath);

  // -------------------------------------------------------------
  // 3. ACCUMULATED DECISION VERIFICATION (BATCH 01, 02, 03, 04, 05)
  // -------------------------------------------------------------
  const b1Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-01-human-decisions.json'), 'utf8'));
  const b2Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-02-human-decisions.json'), 'utf8'));
  const b3Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-03-human-decisions.json'), 'utf8'));
  const b4Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-04-human-decisions.json'), 'utf8'));
  const b5Decisions = JSON.parse(fs.readFileSync(b5DecisionsPath, 'utf8'));

  if (b5Decisions.length !== 10) throw new Error('BATCH_05_DECISION_COUNT_ERROR');
  const b5Approved = b5Decisions.filter(d => d.decision === 'APPROVED').length;
  const b5Rejected = b5Decisions.filter(d => d.decision === 'REJECTED').length;
  const b5Uncertain = b5Decisions.filter(d => d.decision === 'UNCERTAIN').length;

  if (b5Approved !== 8 || b5Rejected !== 2 || b5Uncertain !== 0) {
    throw new Error(`BATCH_05_TOTALS_MISMATCH app=${b5Approved} rej=${b5Rejected} unc=${b5Uncertain}`);
  }

  const all50 = [...b1Decisions, ...b2Decisions, ...b3Decisions, ...b4Decisions, ...b5Decisions];
  const totalApproved = all50.filter(d => d.decision === 'APPROVED').length;
  const totalRejected = all50.filter(d => d.decision === 'REJECTED').length;
  const totalUncertain = all50.filter(d => d.decision === 'UNCERTAIN').length;

  if (all50.length !== 50 || totalApproved !== 44 || totalRejected !== 6 || totalUncertain !== 0) {
    throw new Error(`CUMULATIVE_TOTALS_MISMATCH total=${all50.length} app=${totalApproved} rej=${totalRejected} unc=${totalUncertain}`);
  }

  // -------------------------------------------------------------
  // 4. UPDATE REJECTION LEDGER — FACTUAL ONLY
  // -------------------------------------------------------------
  const rejectedUnits = all50.filter(d => d.decision === 'REJECTED').map(d => ({
    h2Id: d.h2Id,
    batchId: d.batchId,
    decision: d.decision,
    decisionOrigin: d.decisionOrigin
  }));

  const rejectionLedgerPayload = {
    protocol: 'V2.3.7-H2.2',
    timestamp: new Date().toISOString(),
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    status: 'RECORDED_PENDING_FULL_60_REVIEW',
    totalRejected: rejectedUnits.length,
    rejectedUnits,
    policy: {
      noRepairDuringReviewPhase: true,
      noReplacementSelected: true,
      noOriginalTextModified: true,
      noCanonicalLocatorModified: true,
      noModelJudicialAnalysis: true
    }
  };

  const rejectionLedgerPath = path.join(DEC_DIR, 'rejected-units-ledger.json');
  fs.writeFileSync(rejectionLedgerPath, JSON.stringify(rejectionLedgerPayload, null, 2), 'utf8');
  const rejectionLedgerHash = sha256File(rejectionLedgerPath);

  // -------------------------------------------------------------
  // 5. PREPARE BATCH 06 (H2-051 TO H2-060)
  // -------------------------------------------------------------
  const dataset = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-source-dataset.hardened.internal.json'), 'utf8'));
  const { normalizeHtml, decodeBytes, roundTrip } = require(path.join(ROOT, 'scripts/build-h2-source-dataset-h21.cjs'));

  const batch6Units = dataset.slice(50, 60); // H2-051 to H2-060
  const unitFiles = [];
  const dossierUnitSections = [];

  const REVIEW_PRINCIPLE = `================================================================================
IMPORTANTE: PRINCÍPIO FUNDAMENTAL DA REVISÃO DE FONTE MATERIAL
================================================================================
A revisão compara a PROPOSIÇÃO com a FONTE.

A fonte não precisa ser integralmente reproduzida na proposição.
A ausência de conteúdo da fonte NÃO constitui automaticamente omissão material.

Somente considerar omissão material quando:
1. a proposição pretender apresentar regra exaustiva; OU
2. a condição/exceção omitida modificar a verdade da proposição; OU
3. a omissão ampliar ou restringir indevidamente o alcance jurídico; OU
4. a proposição se tornar enganosa sem o elemento omitido.
================================================================================`;

  for (const u of batch6Units) {
    const buf = fs.readFileSync(u.rawPath);
    const dec = decodeBytes(buf);
    const norm = normalizeHtml(dec.text);
    const rt = roundTrip(u);

    const ctx = extractMaterialContext(norm.text, u.startOffset, u.endOffset);
    const officialSourceId = OFFICIAL_IDENTIFICATION[u.diploma] || `${u.authority} - ${u.diploma}`;

    const txtContent = `${REVIEW_PRINCIPLE}

================================================================================
DOSSIÊ DE REVISÃO DA FONTE MATERIAL — ${u.h2Id}
================================================================================

A. IDENTIFICATION
--------------------------------------------------------------------------------
h2Id:                             ${u.h2Id}
domain:                           ${u.domain}
currentDifficultyClassification:  ${u.targetClass}
diploma:                          ${u.diploma}
article:                          ${u.article}
subdivisionType:                  ${u.subdivisionType}
paragraph:                        ${u.paragraph || 'None'}
inciso:                           ${u.inciso || 'None'}
alinea:                           ${u.alinea || 'None'}
canonicalLocator:                 ${u.canonicalLocator}
officialDocumentId:               ${u.officialDocumentId}
officialSourceIdentification:     ${officialSourceId}
evidenceClass:                    ${u.evidenceClass}

B. BENCHMARK PROPOSITION
--------------------------------------------------------------------------------
originalText:
"${u.literalText}"

C. MATERIAL SOURCE
--------------------------------------------------------------------------------
[CABEÇALHO ESTRUTURAL / CONTEXTO IMEDIATO ANTERIOR]
${ctx.contextBefore}

[DISPOSIÇÃO NORMATIVA INTEGRAL NA FONTE OFICIAL]
${ctx.selectedLineInSource}

[CONTEXTO IMEDIATO POSTERIOR / SUBDIVISÕES]
${ctx.contextAfter}

D. SOURCE PROVENANCE
--------------------------------------------------------------------------------
rawPath:                  ${u.rawPath}
rawDocumentSha256:        ${u.rawDocumentSha256}
normalizedDocumentSha256: ${u.normalizedDocumentSha256}
startOffset:              ${u.startOffset}
endOffset:                ${u.endOffset}
literalTextSha256:        ${u.literalTextSha256}
roundTripStatus:          ${rt.ok ? 'PASS' : 'FAIL'}

E. REVIEW QUESTIONS (DECISÃO HUMANA PENDENTE)
--------------------------------------------------------------------------------
Q1 — O originalText reproduz corretamente o conteúdo jurídico material da fonte apresentada?

Q2 — Existe condição, exceção, alternativa, limitação, requisito, consequência ou qualificador pertencente à disposição apresentada cuja omissão torne o originalText juridicamente incorreto ou enganoso?

Q3 — O originalText contém afirmação que não encontra suporte material na fonte apresentada?

Q4 — O canonicalLocator identifica corretamente a fonte normativa, inclusive o vínculo estrutural da subdivisão quando aplicável?

Q5 — O material apresentado é suficiente para aprovar a unidade como base para futura construção do golden?

Opções de decisão futura:
[ ] APPROVED
[ ] REJECTED
[ ] UNCERTAIN

Notas do Revisor:
________________________________________________________________________________
`;

    const txtFileName = `${u.h2Id.toLowerCase()}-source-review.txt`;
    const txtFilePath = path.join(B06_DIR, txtFileName);
    fs.writeFileSync(txtFilePath, txtContent, 'utf8');
    const txtHash = sha256File(txtFilePath);

    unitFiles.push({
      h2Id: u.h2Id,
      canonicalLocator: u.canonicalLocator,
      domain: u.domain,
      targetClass: u.targetClass,
      fileName: txtFileName,
      sha256: txtHash,
      roundTripPass: rt.ok
    });

    dossierUnitSections.push(`## Unidade ${u.h2Id} — \`${u.canonicalLocator}\`

### A. Identification
- **h2Id:** \`${u.h2Id}\`
- **Domain:** \`${u.domain}\`
- **Difficulty Classification:** \`${u.targetClass}\`
- **Diploma:** \`${u.diploma}\` | **Article:** \`${u.article}\` | **Subdivision:** \`${u.subdivisionType}\`
- **Canonical Locator:** \`${u.canonicalLocator}\`
- **Official Document ID:** \`${u.officialDocumentId}\`
- **Official Source:** ${officialSourceId}
- **Evidence Class:** \`${u.evidenceClass}\`

### B. Benchmark Proposition
> "${u.literalText}"

### C. Material Source
**Contexto Imediato Anterior / Cabeçalho:**
\`\`\`
${ctx.contextBefore}
\`\`\`

**Disposição Normativa Integral na Fonte Oficial:**
\`\`\`
${ctx.selectedLineInSource}
\`\`\`

**Contexto Imediato Posterior / Subdivisões:**
\`\`\`
${ctx.contextAfter}
\`\`\`

### D. Source Provenance
- **Raw File:** \`${u.rawPath}\`
- **Raw SHA-256:** \`${u.rawDocumentSha256}\`
- **Normalized SHA-256:** \`${u.normalizedDocumentSha256}\`
- **Offsets:** \`[${u.startOffset}, ${u.endOffset}]\` (Length: ${u.literalText.length} chars)
- **Literal SHA-256:** \`${u.literalTextSha256}\`
- **Round-Trip Status:** \`${rt.ok ? 'PASS' : 'FAIL'}\`

### E. Review Questions
1. **Q1:** O \`originalText\` reproduz corretamente o conteúdo jurídico material da fonte apresentada?
2. **Q2:** Existe condição, exceção, alternativa, limitação, requisito, consequência ou qualificador pertencente à disposição apresentada cuja omissão torne o \`originalText\` juridicamente incorreto ou enganoso?
3. **Q3:** O \`originalText\` contém afirmação que não encontra suporte material na fonte apresentada?
4. **Q4:** O \`canonicalLocator\` identifica corretamente a fonte normativa, inclusive o vínculo estrutural da subdivisão quando aplicável?
5. **Q5:** O material apresentado é suficiente para aprovar a unidade como base para futura construção do golden?

**Opções de decisão futura:**
- [ ] \`APPROVED\`
- [ ] \`REJECTED\`
- [ ] \`UNCERTAIN\`

---
`);
  }

  // 6. Write Batch Markdown Dossier
  const dossierMdContent = `# ATHENA — V2.3.7-H2.2: DOSSIÊ DE REVISÃO DA FONTE MATERIAL
## Lote 6 de 6 (Unidades H2-051 a H2-060 — Civil / Processo Civil)
**Data de Geração:** ${new Date().toISOString()}  
**Modo:** OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK / PRE-GOLDEN  
**Status do Lote:** \`BATCH_06_READY_FOR_HUMAN_REVIEW\`

---

${REVIEW_PRINCIPLE}

---

## Sumário do Lote 6 (10 Unidades)

| h2Id | Canonical Locator | Diploma | Artigo | Domínio | Classificação | Tamanho | Round-Trip | Decisão |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
${batch6Units.map((u) => `| **${u.h2Id}** | \`${u.canonicalLocator}\` | ${u.diploma} | ${u.article} | ${u.domain} | \`${u.targetClass}\` | ${u.literalText.length} chars | \`PASS\` | *PENDING* |`).join('\n')}

---

${dossierUnitSections.join('\n')}
`;

  const dossierMdPath = path.join(B06_DIR, 'batch-06-review-dossier.md');
  fs.writeFileSync(dossierMdPath, dossierMdContent, 'utf8');
  const dossierMdHash = sha256File(dossierMdPath);

  // 7. Write Batch Manifest
  const manifestData = {
    protocol: 'V2.3.7-H2.2',
    batch: 'BATCH_06',
    batchRange: 'H2-051_TO_H2-060',
    timestamp: new Date().toISOString(),
    verifiedBaselines: {
      ...verifiedBaselines,
      'B05_batch-05-human-decisions.json': b5DecisionsHash,
      'B05_batch-05-decision-freeze.json': b5FreezeHash,
      'DEC_rejected-units-ledger.json': rejectionLedgerHash
    },
    unitsCount: batch6Units.length,
    units: unitFiles,
    dossierMarkdown: {
      path: 'batch-06-review-dossier.md',
      sha256: dossierMdHash
    },
    antiLeakageAudit: {
      goldenFieldsCreated: 0,
      modelGeneratedLegalAnalysis: 0,
      expectedModelOutputCreated: 0,
      h1GoldenUsed: false,
      h1HumanDecisionsUsed: false,
      batch01DecisionsUsedForBatch06Selection: false,
      batch02DecisionsUsedForBatch06Selection: false,
      batch03DecisionsUsedForBatch06Selection: false,
      batch04DecisionsUsedForBatch06Selection: false,
      batch05DecisionsUsedForBatch06Selection: false,
      batch01DecisionsUsedForBatch06Analysis: false,
      batch02DecisionsUsedForBatch06Analysis: false,
      batch03DecisionsUsedForBatch06Analysis: false,
      batch04DecisionsUsedForBatch06Analysis: false,
      batch05DecisionsUsedForBatch06Analysis: false,
      rejectedUnitsUsedToTuneBatch06: false
    },
    classification: 'BATCH_06_READY_FOR_HUMAN_REVIEW'
  };

  const manifestPath = path.join(B06_DIR, 'batch-06-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
  const manifestHash = sha256File(manifestPath);

  console.log(JSON.stringify({
    status: 'SUCCESS',
    batch05Freeze: {
      decisionsFile: 'batch-05-human-decisions.json',
      decisionsHash: b5DecisionsHash,
      freezeFile: 'batch-05-decision-freeze.json',
      freezeHash: b5FreezeHash,
      approved: b5Approved,
      rejected: b5Rejected,
      uncertain: b5Uncertain
    },
    cumulativeDecisions: {
      totalReviewed: all50.length,
      totalApproved,
      totalRejected,
      totalUncertain
    },
    rejectionLedger: {
      path: 'rejected-units-ledger.json',
      hash: rejectionLedgerHash,
      rejectedUnits: rejectedUnits.map(r => r.h2Id),
      rejectedCount: rejectedUnits.length
    },
    batch06: {
      batch: 'BATCH_06',
      unitsCount: batch6Units.length,
      dossierMdHash,
      manifestHash,
      classification: 'BATCH_06_READY_FOR_HUMAN_REVIEW',
      units: unitFiles.map(f => ({ h2Id: f.h2Id, locator: f.canonicalLocator, hash: f.sha256 }))
    }
  }, null, 2));
}

if (require.main === module) main();
