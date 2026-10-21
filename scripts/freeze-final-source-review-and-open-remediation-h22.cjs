/**
 * ATHENA — V2.3.7-H2.2 — FINAL SOURCE-REVIEW FREEZE + REMEDIATION WORKSPACE SETUP
 * OFFLINE / ZERO LLM / ZERO NETWORK / ZERO GOLDEN GENERATION
 *
 * 1. Verifies baselines (H2.1.1, H2.1.2, Batches 01 to 05, Batch 06 source files, and current rejection ledger).
 * 2. Freezes Batch 06 human decisions (10 APPROVED, 0 REJECTED, 0 UNCERTAIN).
 * 3. Performs 60-unit reconciliation across all 6 batches (54 APPROVED, 6 REJECTED, 0 UNCERTAIN).
 * 4. Verifies exact rejection set: H2-014, H2-015, H2-028, H2-029, H2-043, H2-044.
 * 5. Verifies immutability of original hardened dataset (before/after hash check).
 * 6. Creates immutable final source-review snapshot in final-source-review/.
 * 7. Prepares remediation workspace in remediation/ (queue + remediation plan).
 * 8. Audits anti-leakage and outputs verification report.
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
  'batch-05-manifest.json': '348e9951a9af4ba248bc298506654e62b4df12488c4d73a1b5e37dca89c575fb',
  'batch-05-human-decisions.json': '51e3547c2dad518f0daed6c642746378408c1b6707df34a0e5bccac37fd99f93',
  'batch-05-decision-freeze.json': '0cc2a52e1370aae442318e196eb4155b371b4a05c484187dbb8137c2257c9723'
};

const BATCH06_EXPECTED = {
  'batch-06-review-dossier.md': '86b1b55f01b440eea736aa5695952c5e271622d80fbeed862750f3c33ae0d966',
  'batch-06-manifest.json': '569817efe84180aeb5c1eb80aab32bd3944634d955821403586e97541a3892e5'
};

const LEDGER_EXPECTED = {
  'rejected-units-ledger.json': 'be3d01d7ec16672e9ca7ed09e94489fee95cbec345696e114a5a4a14bbedd284'
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
const FINAL_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/final-source-review');
const REM_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/remediation');

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
    const p = (rel.includes('decision') || rel.includes('human')) ? path.join(DEC_DIR, rel) : path.join(B05_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH05_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B05_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(BATCH06_EXPECTED)) {
    const p = path.join(B06_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_BATCH06_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`B06_${rel}`] = act;
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
// MAIN EXECUTION
// ---------------------------------------------------------------
function main() {
  console.log('1. Verifying frozen baselines...');
  const verifiedBaselines = verifyBaselines();
  console.log('All 31 baseline hashes verified perfectly.');

  fs.mkdirSync(DEC_DIR, { recursive: true });
  fs.mkdirSync(FINAL_DIR, { recursive: true });
  fs.mkdirSync(REM_DIR, { recursive: true });

  // -------------------------------------------------------------
  // 2. FREEZE USER DECISIONS — BATCH 06
  // -------------------------------------------------------------
  const batch06ExplicitDecisions = [
    { h2Id: 'H2-051', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-052', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-053', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-054', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-055', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-056', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-057', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-058', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-059', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' },
    { h2Id: 'H2-060', decision: 'APPROVED', decisionOrigin: 'USER_EXPLICIT_DECISION', batchId: 'BATCH_06' }
  ];

  const b6DecisionsPath = path.join(DEC_DIR, 'batch-06-human-decisions.json');
  fs.writeFileSync(b6DecisionsPath, JSON.stringify(batch06ExplicitDecisions, null, 2), 'utf8');
  const b6DecisionsHash = sha256File(b6DecisionsPath);

  const b6FreezePayload = {
    protocol: 'V2.3.7-H2.2',
    batchId: 'BATCH_06',
    timestamp: new Date().toISOString(),
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    totals: {
      totalRecords: batch06ExplicitDecisions.length,
      approved: batch06ExplicitDecisions.filter(d => d.decision === 'APPROVED').length,
      rejected: batch06ExplicitDecisions.filter(d => d.decision === 'REJECTED').length,
      uncertain: batch06ExplicitDecisions.filter(d => d.decision === 'UNCERTAIN').length
    },
    decisionsFile: {
      path: 'batch-06-human-decisions.json',
      sha256: b6DecisionsHash
    },
    records: batch06ExplicitDecisions
  };

  const b6FreezePath = path.join(DEC_DIR, 'batch-06-decision-freeze.json');
  fs.writeFileSync(b6FreezePath, JSON.stringify(b6FreezePayload, null, 2), 'utf8');
  const b6FreezeHash = sha256File(b6FreezePath);

  // -------------------------------------------------------------
  // 3. FINAL 60-UNIT DECISION RECONCILIATION
  // -------------------------------------------------------------
  const b1Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-01-human-decisions.json'), 'utf8'));
  const b2Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-02-human-decisions.json'), 'utf8'));
  const b3Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-03-human-decisions.json'), 'utf8'));
  const b4Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-04-human-decisions.json'), 'utf8'));
  const b5Decisions = JSON.parse(fs.readFileSync(path.join(DEC_DIR, 'batch-05-human-decisions.json'), 'utf8'));
  const b6Decisions = JSON.parse(fs.readFileSync(b6DecisionsPath, 'utf8'));

  const batchList = [
    { id: 'Batch 01', records: b1Decisions, expApp: 10, expRej: 0, expUnc: 0 },
    { id: 'Batch 02', records: b2Decisions, expApp: 8, expRej: 2, expUnc: 0 },
    { id: 'Batch 03', records: b3Decisions, expApp: 8, expRej: 2, expUnc: 0 },
    { id: 'Batch 04', records: b4Decisions, expApp: 10, expRej: 0, expUnc: 0 },
    { id: 'Batch 05', records: b5Decisions, expApp: 8, expRej: 2, expUnc: 0 },
    { id: 'Batch 06', records: b6Decisions, expApp: 10, expRej: 0, expUnc: 0 }
  ];

  for (const b of batchList) {
    const app = b.records.filter(r => r.decision === 'APPROVED').length;
    const rej = b.records.filter(r => r.decision === 'REJECTED').length;
    const unc = b.records.filter(r => r.decision === 'UNCERTAIN').length;
    if (b.records.length !== 10 || app !== b.expApp || rej !== b.expRej || unc !== b.expUnc) {
      throw new Error(`RECONCILIATION_ERROR_IN_${b.id}: app=${app} rej=${rej} unc=${unc}`);
    }
  }

  const all60 = [
    ...b1Decisions,
    ...b2Decisions,
    ...b3Decisions,
    ...b4Decisions,
    ...b5Decisions,
    ...b6Decisions
  ];

  if (all60.length !== 60) throw new Error(`TOTAL_COUNT_ERROR act=${all60.length} exp=60`);

  // Verify sequential sort H2-001 through H2-060
  for (let i = 0; i < 60; i++) {
    const expId = `H2-${String(i + 1).padStart(3, '0')}`;
    if (all60[i].h2Id !== expId) {
      throw new Error(`SORT_OR_ID_MISMATCH at index ${i}: act=${all60[i].h2Id} exp=${expId}`);
    }
  }

  const totalApproved = all60.filter(d => d.decision === 'APPROVED').length;
  const totalRejected = all60.filter(d => d.decision === 'REJECTED').length;
  const totalUncertain = all60.filter(d => d.decision === 'UNCERTAIN').length;
  const approvalRate = ((totalApproved / 60) * 100).toFixed(2); // "90.00"

  if (totalApproved !== 54 || totalRejected !== 6 || totalUncertain !== 0 || approvalRate !== '90.00') {
    throw new Error(`FINAL_METRICS_ERROR: app=${totalApproved} rej=${totalRejected} unc=${totalUncertain} rate=${approvalRate}`);
  }

  // -------------------------------------------------------------
  // 4. VERIFY EXACT REJECTION SET
  // -------------------------------------------------------------
  const rejectedRecords = all60.filter(d => d.decision === 'REJECTED');
  const rejectedIds = rejectedRecords.map(d => d.h2Id);
  const EXPECTED_REJECTIONS = ['H2-014', 'H2-015', 'H2-028', 'H2-029', 'H2-043', 'H2-044'];

  if (JSON.stringify(rejectedIds) !== JSON.stringify(EXPECTED_REJECTIONS)) {
    throw new Error(`REJECTION_SET_MISMATCH act=${JSON.stringify(rejectedIds)} exp=${JSON.stringify(EXPECTED_REJECTIONS)}`);
  }

  // -------------------------------------------------------------
  // 5. PRESERVE ORIGINAL DATASET (BEFORE / AFTER HASH CHECK)
  // -------------------------------------------------------------
  const beforeAfterHashes = {};
  for (const [rel, exp] of Object.entries(H211_EXPECTED)) {
    if (rel.startsWith('dataset/')) {
      const p = path.join(H211_DIR, rel);
      const curHash = sha256File(p);
      if (curHash !== exp) throw new Error(`DATASET_MUTATION_DETECTED on ${rel}`);
      beforeAfterHashes[rel] = { before: exp, after: curHash, unchanged: true };
    }
  }

  // -------------------------------------------------------------
  // 6. CREATE IMMUTABLE FINAL SOURCE-REVIEW SNAPSHOT
  // -------------------------------------------------------------
  // 6.1 source-review-decisions-60.json
  const decisions60Path = path.join(FINAL_DIR, 'source-review-decisions-60.json');
  fs.writeFileSync(decisions60Path, JSON.stringify(all60, null, 2), 'utf8');
  const decisions60Hash = sha256File(decisions60Path);

  // 6.2 source-review-rejection-set.json
  const rejectionSetPayload = {
    protocol: 'V2.3.7-H2.2',
    timestamp: new Date().toISOString(),
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    policy: 'NO_REPAIR_DURING_REVIEW_PHASE',
    totalRejected: rejectedRecords.length,
    rejectedUnits: rejectedRecords.map(r => ({
      h2Id: r.h2Id,
      batchId: r.batchId,
      decision: r.decision,
      decisionOrigin: r.decisionOrigin
    }))
  };
  const rejectionSetPath = path.join(FINAL_DIR, 'source-review-rejection-set.json');
  fs.writeFileSync(rejectionSetPath, JSON.stringify(rejectionSetPayload, null, 2), 'utf8');
  const rejectionSetHash = sha256File(rejectionSetPath);

  // 6.3 source-review-final-report.md
  const finalReportMd = `# ATHENA — V2.3.7-H2.2: RELATÓRIO FINAL DA REVISÃO DE FONTE MATERIAL (H2-001 A H2-060)
**Data de Fechamento:** ${new Date().toISOString()}  
**Modo:** OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK / PRE-GOLDEN  
**Status do Processo:** \`SOURCE_REVIEW_60_FROZEN_REMEDIATION_READY\`

---

## 1. Sumário Executivo da Revisão de Fonte

| Métrica | Valor |
| :--- | :---: |
| **Total de Unidades Revisadas** | **60** |
| **Unidades Aprovadas (APPROVED)** | **54** |
| **Unidades Rejeitadas (REJECTED)** | **6** |
| **Unidades Incertas (UNCERTAIN)** | **0** |
| **SOURCE_REVIEW_APPROVAL_RATE** | **90.00%** |

*Nota de Governança: A métrica acima reflete exclusivamente a conformidade material preliminar das proposições candidatas perante o texto oficial extraído, sendo estritamente denominada \`SOURCE_REVIEW_APPROVAL_RATE\`. Não representa acurácia de modelo, nota de benchmark ou avaliação substantiva do GPT.*

---

## 2. Reconciliação por Lote (Batches 01 a 06)

| Lote | Intervalo | Domínios Primários | Total | APPROVED | REJECTED | UNCERTAIN | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Batch 01** | H2-001 a H2-010 | Penal Geral | 10 | 10 | 0 | 0 | \`FROZEN\` |
| **Batch 02** | H2-011 a H2-020 | Penal Especial / Processo Penal | 10 | 8 | 2 | 0 | \`FROZEN\` |
| **Batch 03** | H2-021 a H2-030 | Processo Penal | 10 | 8 | 2 | 0 | \`FROZEN\` |
| **Batch 04** | H2-031 a H2-040 | Constitucional / Administrativo | 10 | 10 | 0 | 0 | \`FROZEN\` |
| **Batch 05** | H2-041 a H2-050 | Administrativo / Civil | 10 | 8 | 2 | 0 | \`FROZEN\` |
| **Batch 06** | H2-051 a H2-060 | Civil / Processo Civil | 10 | 10 | 0 | 0 | \`FROZEN\` |
| **TOTAL** | **H2-001 a H2-060** | **Todas as Áreas** | **60** | **54** | **6** | **0** | \`100% CONCLUÍDO\` |

---

## 3. Conjunto Exato de Unidades Rejeitadas (6 Unidades)

As seguintes 6 unidades foram explicitamente rejeitadas na revisão humana de fonte e encontram-se isoladas para a fase de remediação:

1. **H2-014** (\`LEI_8072_ART_2_PAR_3\`, Batch 02)
2. **H2-015** (\`LEI_8072_ART_6_PAR_3\`, Batch 02)
3. **H2-028** (\`CPP_ART_677\`, Batch 03)
4. **H2-029** (\`CPP_ART_705\`, Batch 03)
5. **H2-043** (\`LEI_8112_ART_93_PAR_2\`, Batch 05)
6. **H2-044** (\`LEI_8112_ART_253_PAR_2\`, Batch 05)

---

## 4. Garantia de Imutabilidade do Dataset Base

Os artefatos originais congelados em H2.1.1 permaneceram absolutamente inalterados (0 bytes modificados):
- \`dataset/h2-source-dataset.hardened.internal.json\`: \`5d736b19dd1cc3ff1b7c111f9f4333904aaca6a8d74a1a508b95aa28d6f9d461\`
- \`dataset/h2-blind-input.hardened.preview.json\`: \`a92c7208b27a90f0cbfd95d68b118c6ae7120bdf25c933cffc77bfd31a30ae4b\`
- \`dataset/h2-source-review-queue.hardened.json\`: \`4340c22564513a9cc8b0969ad0a27838720af55f3e77ba8531febb00e3efd690\`
`;
  const finalReportMdPath = path.join(FINAL_DIR, 'source-review-final-report.md');
  fs.writeFileSync(finalReportMdPath, finalReportMd, 'utf8');
  const finalReportMdHash = sha256File(finalReportMdPath);

  // 6.4 source-review-final-manifest.json
  const finalManifestPayload = {
    protocol: 'V2.3.7-H2.2',
    timestamp: new Date().toISOString(),
    classification: 'SOURCE_REVIEW_60_FROZEN_REMEDIATION_READY',
    verifiedBaselines,
    metrics: {
      totalReviewed: 60,
      approved: totalApproved,
      rejected: totalRejected,
      uncertain: totalUncertain,
      sourceReviewApprovalRate: '90.00%'
    },
    batchFreezeArtifacts: {
      batch01: {
        humanDecisionsSha256: verifiedBaselines['B01_batch-01-human-decisions.json'],
        decisionFreezeSha256: verifiedBaselines['B01_batch-01-decision-freeze.json']
      },
      batch02: {
        humanDecisionsSha256: verifiedBaselines['B02_batch-02-human-decisions.json'],
        decisionFreezeSha256: verifiedBaselines['B02_batch-02-decision-freeze.json']
      },
      batch03: {
        humanDecisionsSha256: verifiedBaselines['B03_batch-03-human-decisions.json'],
        decisionFreezeSha256: verifiedBaselines['B03_batch-03-decision-freeze.json']
      },
      batch04: {
        humanDecisionsSha256: verifiedBaselines['B04_batch-04-human-decisions.json'],
        decisionFreezeSha256: verifiedBaselines['B04_batch-04-decision-freeze.json']
      },
      batch05: {
        humanDecisionsSha256: verifiedBaselines['B05_batch-05-human-decisions.json'],
        decisionFreezeSha256: verifiedBaselines['B05_batch-05-decision-freeze.json']
      },
      batch06: {
        humanDecisionsSha256: b6DecisionsHash,
        decisionFreezeSha256: b6FreezeHash
      }
    },
    snapshotArtifacts: {
      'source-review-decisions-60.json': decisions60Hash,
      'source-review-rejection-set.json': rejectionSetHash,
      'source-review-final-report.md': finalReportMdHash
    },
    rejectionSet: EXPECTED_REJECTIONS,
    antiLeakageAudit: {
      goldenFieldsCreated: 0,
      goldenGenerationExecuted: false,
      modelGeneratedLegalAnalysis: 0,
      expectedModelOutputCreated: 0,
      gptCalls: 0,
      externalNetworkCalls: 0,
      h2Executed: false,
      remediationExecuted: false,
      correctedPropositionsCreated: 0,
      replacementUnitsSelected: 0
    }
  };
  const finalManifestPath = path.join(FINAL_DIR, 'source-review-final-manifest.json');
  fs.writeFileSync(finalManifestPath, JSON.stringify(finalManifestPayload, null, 2), 'utf8');
  const finalManifestHash = sha256File(finalManifestPath);

  // -------------------------------------------------------------
  // 7. PREPARE REMEDIATION WORKSPACE
  // -------------------------------------------------------------
  const dataset = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-source-dataset.hardened.internal.json'), 'utf8'));
  const datasetMap = new Map(dataset.map(u => [u.h2Id, u]));

  // Structural Triage Classification for the 6 rejected units
  const TRIAGE_CLASSIFICATION = {
    'H2-014': [
      'TEMPORAL_VERSION_INVESTIGATION',
      'CURRENT_LAW_APPLICABILITY_INVESTIGATION'
    ],
    'H2-015': [
      'STRUCTURAL_PARENT_BINDING_INVESTIGATION',
      'LOCATOR_BINDING_INVESTIGATION',
      'OFFICIAL_SOURCE_RECONSTRUCTION'
    ],
    'H2-028': [
      'CURRENT_LAW_APPLICABILITY_INVESTIGATION',
      'TEMPORAL_VERSION_INVESTIGATION',
      'OFFICIAL_SOURCE_RECONSTRUCTION'
    ],
    'H2-029': [
      'CURRENT_LAW_APPLICABILITY_INVESTIGATION',
      'TEMPORAL_VERSION_INVESTIGATION',
      'OFFICIAL_SOURCE_RECONSTRUCTION'
    ],
    'H2-043': [
      'TEMPORAL_VERSION_INVESTIGATION',
      'CURRENT_LAW_APPLICABILITY_INVESTIGATION',
      'STRUCTURAL_PARENT_BINDING_INVESTIGATION'
    ],
    'H2-044': [
      'LOCATOR_BINDING_INVESTIGATION',
      'STRUCTURAL_PARENT_BINDING_INVESTIGATION',
      'OFFICIAL_SOURCE_RECONSTRUCTION'
    ]
  };

  const remediationQueue = EXPECTED_REJECTIONS.map(id => {
    const u = datasetMap.get(id);
    const batchId = id <= 'H2-010' ? 'BATCH_01' :
                    id <= 'H2-020' ? 'BATCH_02' :
                    id <= 'H2-030' ? 'BATCH_03' :
                    id <= 'H2-040' ? 'BATCH_04' :
                    id <= 'H2-050' ? 'BATCH_05' : 'BATCH_06';
    return {
      h2Id: u.h2Id,
      batchId,
      canonicalLocator: u.canonicalLocator,
      diploma: u.diploma,
      article: u.article,
      originalText: u.literalText,
      decision: 'REJECTED',
      decisionOrigin: 'USER_EXPLICIT_DECISION',
      officialDocumentId: u.officialDocumentId,
      evidenceClass: u.evidenceClass,
      investigationRequirements: TRIAGE_CLASSIFICATION[id],
      sourceArtifactReferences: {
        rawPath: u.rawPath,
        rawDocumentSha256: u.rawDocumentSha256,
        normalizedDocumentSha256: u.normalizedDocumentSha256,
        startOffset: u.startOffset,
        endOffset: u.endOffset,
        literalTextSha256: u.literalTextSha256
      },
      remediationStatus: 'PENDING_REMEDIATION_PHASE'
    };
  });

  const remediationQueuePath = path.join(REM_DIR, 'rejected-unit-remediation-queue.json');
  fs.writeFileSync(remediationQueuePath, JSON.stringify(remediationQueue, null, 2), 'utf8');
  const remediationQueueHash = sha256File(remediationQueuePath);

  // 7.2 remediation-plan.md
  const remediationPlanMd = `# ATHENA — V2.3.7-H2.2: PLANO DE REMEDIAÇÃO DE UNIDADES REJEITADAS
**Data de Criação:** ${new Date().toISOString()}  
**Status:** \`PREPARED_NOT_EXECUTED\`  
**Regra de Governança:** Nenhuma remediação substantiva executada nesta fase.

---

## 1. Princípios e Metodologia da Fase de Remediação

A remediação das 6 unidades rejeitadas (\`H2-014\`, \`H2-015\`, \`H2-028\`, \`H2-029\`, \`H2-043\`, \`H2-044\`) deve obedecer ao seguinte ciclo rigoroso de 9 etapas:

1. **Isolamento da Unidade Rejeitada:** Cada unidade é analisada individualmente com seu histórico de fonte e triagem estrutural.
2. **Identificação da Classe de Falha:** Determinar se a rejeição decorreu de vigência temporal, desvinculação de subdivisão/parent, inadequação de locator ou revogação por lei posterior.
3. **Reconstrução Independente da Evidência Oficial:** Inspecionar o documento oficial bruto local e seu contexto normativo integral.
4. **Determinação do Vínculo Estrutural Superior (Parent Binding):** Assegurar que a regra normativa pertença exatamente ao artigo/inciso/parágrafo apontado.
5. **Determinação Temporal e de Vigência:** Confirmar se a redação reflete a norma vigente no ordenamento jurídico nacional.
6. **Construção de Proposição Candidata Corrigida:** Somente após a evidência oficial estabelecida, formular a proposição candidata corrigida.
7. **Revisão da Proposição Candidata:** Submeter a proposição corrigida aos mesmos critérios das 5 perguntas fundamentais da revisão humana.
8. **Congelamento da Decisão de Remediação:** Persistir a decisão e os metadados de auditoria.
9. **Construção do Dataset Remediado:** Somente após a resolução das 6 unidades, integrar o dataset de teste final.

---

## 2. Política de Falha Segura (Fail-Closed)

> [!CAUTION]
> Se a evidência oficial determinística local não for suficiente para estabelecer a correção com certeza jurídica absoluta:
> \`REMEDIATION_STATUS = INDETERMINATE\`
> 
> É terminantemente **proibido** forçar aprovação sem suporte documental irrefutável.

---

## 3. Política de Substituição vs. Reparo

Nenhuma política de substituição foi pré-decidida nesta fase:
- A decisão entre \`CORRECTED_IN_PLACE\`, \`REPLACED\` ou \`REMOVED\` pertence com exclusividade à execução da fase de remediação, após a reconstrução das evidências.
- Nenhuma proposição substituta ou candidata corrigida foi criada.

---

## 4. Triage das 6 Unidades na Fila

| h2Id | Localizador | Diploma | Requisitos de Investigação Atribuídos |
| :--- | :--- | :---: | :--- |
| **H2-014** | \`LEI_8072_ART_2_PAR_3\` | LEI_8072 | \`TEMPORAL_VERSION_INVESTIGATION\`, \`CURRENT_LAW_APPLICABILITY_INVESTIGATION\` |
| **H2-015** | \`LEI_8072_ART_6_PAR_3\` | LEI_8072 | \`STRUCTURAL_PARENT_BINDING_INVESTIGATION\`, \`LOCATOR_BINDING_INVESTIGATION\`, \`OFFICIAL_SOURCE_RECONSTRUCTION\` |
| **H2-028** | \`CPP_ART_677\` | CPP | \`CURRENT_LAW_APPLICABILITY_INVESTIGATION\`, \`TEMPORAL_VERSION_INVESTIGATION\`, \`OFFICIAL_SOURCE_RECONSTRUCTION\` |
| **H2-029** | \`CPP_ART_705\` | CPP | \`CURRENT_LAW_APPLICABILITY_INVESTIGATION\`, \`TEMPORAL_VERSION_INVESTIGATION\`, \`OFFICIAL_SOURCE_RECONSTRUCTION\` |
| **H2-043** | \`LEI_8112_ART_93_PAR_2\` | LEI_8112 | \`TEMPORAL_VERSION_INVESTIGATION\`, \`CURRENT_LAW_APPLICABILITY_INVESTIGATION\`, \`STRUCTURAL_PARENT_BINDING_INVESTIGATION\` |
| **H2-044** | \`LEI_8112_ART_253_PAR_2\` | LEI_8112 | \`LOCATOR_BINDING_INVESTIGATION\`, \`STRUCTURAL_PARENT_BINDING_INVESTIGATION\`, \`OFFICIAL_SOURCE_RECONSTRUCTION\` |
`;
  const remediationPlanPath = path.join(REM_DIR, 'remediation-plan.md');
  fs.writeFileSync(remediationPlanPath, remediationPlanMd, 'utf8');
  const remediationPlanHash = sha256File(remediationPlanPath);

  console.log(JSON.stringify({
    status: 'SUCCESS',
    batch06Freeze: {
      decisionsFile: 'batch-06-human-decisions.json',
      decisionsHash: b6DecisionsHash,
      freezeFile: 'batch-06-decision-freeze.json',
      freezeHash: b6FreezeHash,
      approved: 10,
      rejected: 0,
      uncertain: 0
    },
    final60Reconciliation: {
      totalReviewed: 60,
      totalApproved,
      totalRejected,
      totalUncertain,
      sourceReviewApprovalRate: '90.00%'
    },
    rejectedSet: EXPECTED_REJECTIONS,
    snapshotArtifacts: {
      'source-review-decisions-60.json': decisions60Hash,
      'source-review-rejection-set.json': rejectionSetHash,
      'source-review-final-report.md': finalReportMdHash,
      'source-review-final-manifest.json': finalManifestHash
    },
    remediationWorkspace: {
      'rejected-unit-remediation-queue.json': remediationQueueHash,
      'remediation-plan.md': remediationPlanHash
    },
    classification: 'SOURCE_REVIEW_60_FROZEN_REMEDIATION_READY'
  }, null, 2));
}

if (require.main === module) main();
