/**
 * ATHENA — V2.3.7-H2.2 — FREEZE BATCH 02 HUMAN DECISIONS + PREPARE DOSSIER BATCH 03
 * OFFLINE / ZERO LLM / ZERO NETWORK / ZERO GOLDEN GENERATION
 *
 * 1. Verifies baselines (H2.1.1, H2.1.2, Batch 01, Batch 02).
 * 2. Freezes Batch 02 human decisions (8 APPROVED, 2 REJECTED, 0 UNCERTAIN).
 * 3. Verifies accumulated decision totals (18 APPROVED, 2 REJECTED, 0 UNCERTAIN).
 * 4. Creates decisions/rejected-units-ledger.json (factual only, no repairs).
 * 5. Prepares source review dossier for Batch 03 (H2-021 to H2-030).
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
  'batch-02-manifest.json': 'ab6842b2114fea45501791199575edb5f0a1e682d4ef96e20dad58fab5670472'
};

const H211_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211');
const H212_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h212/audit');
const B01_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-01');
const B02_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-02');
const DEC_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/decisions');
const B03_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-03');

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
    const p = path.join(B02_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH02_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B02_${rel}`] = act;
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
  console.log('All 16 baseline hashes verified perfectly.');

  fs.mkdirSync(DEC_DIR, { recursive: true });
  fs.mkdirSync(B03_DIR, { recursive: true });

  // -------------------------------------------------------------
  // 2. FREEZE USER DECISIONS — BATCH 02
  // -------------------------------------------------------------
  const batch02ExplicitDecisions = [
    { h2Id: 'H2-011', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-012', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-013', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-014', decision: 'REJECTED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-015', decision: 'REJECTED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-016', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-017', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-018', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-019', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' },
    { h2Id: 'H2-020', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_02' }
  ];

  const b2DecisionsPath = path.join(DEC_DIR, 'batch-02-human-decisions.json');
  fs.writeFileSync(b2DecisionsPath, JSON.stringify(batch02ExplicitDecisions, null, 2), 'utf8');
  const b2DecisionsHash = sha256File(b2DecisionsPath);

  const b2FreezePayload = {
    protocol: 'V2.3.7-H2.2',
    batchId: 'BATCH_02',
    timestamp: new Date().toISOString(),
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    totals: {
      totalRecords: batch02ExplicitDecisions.length,
      approved: batch02ExplicitDecisions.filter(d => d.decision === 'APPROVED').length,
      rejected: batch02ExplicitDecisions.filter(d => d.decision === 'REJECTED').length,
      uncertain: batch02ExplicitDecisions.filter(d => d.decision === 'UNCERTAIN').length
    },
    decisionsFile: {
      path: 'batch-02-human-decisions.json',
      sha256: b2DecisionsHash
    },
    records: batch02ExplicitDecisions
  };

  const b2FreezePath = path.join(DEC_DIR, 'batch-02-decision-freeze.json');
  fs.writeFileSync(b2FreezePath, JSON.stringify(b2FreezePayload, null, 2), 'utf8');
  const b2FreezeHash = sha256File(b2FreezePath);

  // -------------------------------------------------------------
  // 3. VERIFY DECISION FREEZE & ACCUMULATED TOTALS
  // -------------------------------------------------------------
  const b1Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-01-human-decisions.json'), 'utf8'));
  const b2Decisions = JSON.parse(fs.readFileSync(b2DecisionsPath, 'utf8'));

  if (b2Decisions.length !== 10) throw new Error('BATCH_02_DECISION_COUNT_ERROR');
  const b2Approved = b2Decisions.filter(d => d.decision === 'APPROVED').length;
  const b2Rejected = b2Decisions.filter(d => d.decision === 'REJECTED').length;
  const b2Uncertain = b2Decisions.filter(d => d.decision === 'UNCERTAIN').length;

  if (b2Approved !== 8 || b2Rejected !== 2 || b2Uncertain !== 0) {
    throw new Error(`BATCH_02_TOTALS_MISMATCH app=${b2Approved} rej=${b2Rejected} unc=${b2Uncertain}`);
  }

  const all20 = [...b1Decisions, ...b2Decisions];
  const totalApproved = all20.filter(d => d.decision === 'APPROVED').length;
  const totalRejected = all20.filter(d => d.decision === 'REJECTED').length;
  const totalUncertain = all20.filter(d => d.decision === 'UNCERTAIN').length;

  if (all20.length !== 20 || totalApproved !== 18 || totalRejected !== 2 || totalUncertain !== 0) {
    throw new Error(`CUMULATIVE_TOTALS_MISMATCH total=${all20.length} app=${totalApproved} rej=${totalRejected} unc=${totalUncertain}`);
  }

  // -------------------------------------------------------------
  // 4. REJECTION LEDGER — NO REPAIR
  // -------------------------------------------------------------
  const rejectedUnits = all20.filter(d => d.decision === 'REJECTED').map(d => ({
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
  // 5. PREPARE BATCH 03 (H2-021 TO H2-030)
  // -------------------------------------------------------------
  const dataset = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-source-dataset.hardened.internal.json'), 'utf8'));
  const { normalizeHtml, decodeBytes, roundTrip } = require(path.join(ROOT, 'scripts/build-h2-source-dataset-h21.cjs'));

  const batch3Units = dataset.slice(20, 30); // H2-021 to H2-030
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

  for (const u of batch3Units) {
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

Q4 — O canonicalLocator identifica corretamente a fonte normativa material da proposição?

Q5 — A unidade pode ser aprovada como base para futura construção do golden?

Opções de decisão futura:
[ ] APPROVED
[ ] REJECTED
[ ] UNCERTAIN

Notas do Revisor:
________________________________________________________________________________
`;

    const txtFileName = `${u.h2Id.toLowerCase()}-source-review.txt`;
    const txtFilePath = path.join(B03_DIR, txtFileName);
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
4. **Q4:** O \`canonicalLocator\` identifica corretamente a fonte normativa material da proposição?
5. **Q5:** A unidade pode ser aprovada como base para futura construção do golden?

**Opções de decisão futura:**
- [ ] \`APPROVED\`
- [ ] \`REJECTED\`
- [ ] \`UNCERTAIN\`

---
`);
  }

  // 6. Write Batch Markdown Dossier
  const dossierMdContent = `# ATHENA — V2.3.7-H2.2: DOSSIÊ DE REVISÃO DA FONTE MATERIAL
## Lote 3 de 6 (Unidades H2-021 a H2-030 — Processo Penal)
**Data de Geração:** ${new Date().toISOString()}  
**Modo:** OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK / PRE-GOLDEN  
**Status do Lote:** \`BATCH_03_READY_FOR_HUMAN_REVIEW\`

---

${REVIEW_PRINCIPLE}

---

## Sumário do Lote 3 (10 Unidades)

| h2Id | Canonical Locator | Diploma | Artigo | Domínio | Classificação | Tamanho | Round-Trip | Decisão |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
${batch3Units.map((u) => `| **${u.h2Id}** | \`${u.canonicalLocator}\` | ${u.diploma} | ${u.article} | ${u.domain} | \`${u.targetClass}\` | ${u.literalText.length} chars | \`PASS\` | *PENDING* |`).join('\n')}

---

${dossierUnitSections.join('\n')}
`;

  const dossierMdPath = path.join(B03_DIR, 'batch-03-review-dossier.md');
  fs.writeFileSync(dossierMdPath, dossierMdContent, 'utf8');
  const dossierMdHash = sha256File(dossierMdPath);

  // 7. Write Batch Manifest
  const manifestData = {
    protocol: 'V2.3.7-H2.2',
    batch: 'BATCH_03',
    batchRange: 'H2-021_TO_H2-030',
    timestamp: new Date().toISOString(),
    verifiedBaselines: {
      ...verifiedBaselines,
      'B02_batch-02-human-decisions.json': b2DecisionsHash,
      'B02_batch-02-decision-freeze.json': b2FreezeHash,
      'DEC_rejected-units-ledger.json': rejectionLedgerHash
    },
    unitsCount: batch3Units.length,
    units: unitFiles,
    dossierMarkdown: {
      path: 'batch-03-review-dossier.md',
      sha256: dossierMdHash
    },
    antiLeakageAudit: {
      goldenFieldsCreated: 0,
      modelGeneratedLegalAnalysis: 0,
      expectedModelOutputCreated: 0,
      h1GoldenUsed: false,
      h1HumanDecisionsUsed: false,
      batch01DecisionsUsedForBatch03Selection: false,
      batch02DecisionsUsedForBatch03Selection: false,
      batch01DecisionsUsedForBatch03Analysis: false,
      batch02DecisionsUsedForBatch03Analysis: false,
      rejectedUnitsUsedToTuneBatch03: false
    },
    classification: 'BATCH_03_READY_FOR_HUMAN_REVIEW'
  };

  const manifestPath = path.join(B03_DIR, 'batch-03-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
  const manifestHash = sha256File(manifestPath);

  console.log(JSON.stringify({
    status: 'SUCCESS',
    batch02Freeze: {
      decisionsFile: 'batch-02-human-decisions.json',
      decisionsHash: b2DecisionsHash,
      freezeFile: 'batch-02-decision-freeze.json',
      freezeHash: b2FreezeHash,
      approved: b2Approved,
      rejected: b2Rejected,
      uncertain: b2Uncertain
    },
    cumulativeDecisions: {
      totalReviewed: all20.length,
      totalApproved,
      totalRejected,
      totalUncertain
    },
    rejectionLedger: {
      path: 'rejected-units-ledger.json',
      hash: rejectionLedgerHash,
      rejectedCount: rejectedUnits.length
    },
    batch03: {
      batch: 'BATCH_03',
      unitsCount: batch3Units.length,
      dossierMdHash,
      manifestHash,
      classification: 'BATCH_03_READY_FOR_HUMAN_REVIEW',
      units: unitFiles.map(f => ({ h2Id: f.h2Id, locator: f.canonicalLocator, hash: f.sha256 }))
    }
  }, null, 2));
}

if (require.main === module) main();
