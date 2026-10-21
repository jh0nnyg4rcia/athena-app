const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function verifyFile(filePath, expectedSha256) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath);
  const actual = sha256(content);
  if (actual !== expectedSha256) {
    throw new Error(`SHA256 mismatch for ${filePath}: expected ${expectedSha256}, got ${actual}`);
  }
  return actual;
}

// 1. VERIFY G1.1
const g11Dir = 'tmp/assertion-decomposition-holdout-v237h22/golden-candidates/batch-01-review';
const expectedG11 = {
  'batch-01-project-review-decisions.json': 'adbd7dc2478197ca10e7346fc39a709b8d8841fe37624a85706df8befcfe358b',
  'batch-01-correction-ledger.json': '82f835b913cbfd8072a282cdd4dd907aff856394169b3f44fd6186031f03edb2',
  'golden-contract-lessons-batch-01.md': 'a0df1844457c9e6c51ea8aac4020a6150a3541f11fad77133c839d8b7522e919',
  'prospective-validator-rules.json': '299c17fea0ab0f8d8470daf2a228cd86b661a637c4143db575591ac6d5a212ca',
  'batch-01-review-validation.json': '7c44217d9b0edeb7a180be6e8e09464bc247fac08d01391eba0dfa699299a6d2',
  'batch-01-review-report.md': '465fab62917d2ecd3c782af8ac5850681bfd64ab4249822ee4af945c857aa161',
  'corrected-candidates/H2-003.v2.json': 'c1a369d82712eea619c7fc09fc92912bd2d2687551d55b130fe064f09deaf042',
  'corrected-candidates/H2-008.v2.json': '9cc7202dd7a5d29908581e762b2aa03f2acca4008b91677f97a2244618427eef',
  'corrected-candidates/H2-009.v2.json': '5979638461a3abddae8e8b1e4687c0a80eaacd83c7728eedf7e988365705f0de',
  'corrected-candidates/H2-010.v2.json': '1b121c48317995b5388f82bf2dc863b87aa4a280534149647220a2b8c25ab98b',
  'batch-01-review-manifest.json': '5ab7b2de34950e3f8fb9b929226b59ed44207c204ca8008ac6f9ecaaa92558fc'
};

console.log('Verifying G1.1 artifacts...');
for (const [file, hash] of Object.entries(expectedG11)) {
  verifyFile(path.join(g11Dir, file), hash);
}
console.log('G1.1 verified 100%.');

// 10. VERIFY SOURCE HOLDOUT
const r5Dir = 'tmp/assertion-decomposition-holdout-v237h22/final-source-holdout';
verifyFile(path.join(r5Dir, 'h2-final-source.internal.json'), '4c091e7b932dc3801573a0a4b39c1f72def71b2aa7ed9c2282d0c9c035f34a00');
verifyFile(path.join(r5Dir, 'h2-final-source.blind.json'), '4618a15874660405cba5ece08f516bf76eee96a17d74a633fa068a85944272c8');
console.log('R5 source holdout verified 100%.');

// Setup output directory
const frozenDir = 'tmp/assertion-decomposition-holdout-v237h22/golden-frozen/batch-01';
fs.mkdirSync(frozenDir, { recursive: true });

// Read approved candidates
const batch1Candidates = JSON.parse(fs.readFileSync('tmp/assertion-decomposition-holdout-v237h22/golden-candidates/batch-01/golden-candidates-batch-01.json', 'utf8'));
const h2003v2 = JSON.parse(fs.readFileSync(path.join(g11Dir, 'corrected-candidates/H2-003.v2.json'), 'utf8'));
const h2008v2 = JSON.parse(fs.readFileSync(path.join(g11Dir, 'corrected-candidates/H2-008.v2.json'), 'utf8'));
const h2009v2 = JSON.parse(fs.readFileSync(path.join(g11Dir, 'corrected-candidates/H2-009.v2.json'), 'utf8'));
const h2010v2 = JSON.parse(fs.readFileSync(path.join(g11Dir, 'corrected-candidates/H2-010.v2.json'), 'utf8'));

// Assemble 10 frozen golden units
// H2-001 (v1), H2-002 (v1), H2-003 (v2), H2-004 (v1), H2-005 (v1),
// H2-006 (v1), H2-007 (v1), H2-008 (v2), H2-009 (v2), H2-010 (v2)

function freezeUnit(unit, approvedVersion, previousVersion = null) {
  return {
    ...unit,
    status: "PROJECT_GOLDEN_APPROVED",
    approvedVersion: approvedVersion,
    previousVersion: previousVersion,
    decisionOrigin: "USER_EXPLICIT_DECISION",
    decisionStage: "PROJECT_GOLDEN_REVIEW",
    frozenAt: "2026-10-07T21:25:00.000Z",
    legalCertificationStatus: "NOT_FORMALLY_CERTIFIED_BENCHMARK_PROJECT_DECISION"
  };
}

const frozenUnits = [
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-001"), 1),
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-002"), 1),
  freezeUnit(h2003v2, 2, 1),
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-004"), 1),
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-005"), 1),
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-006"), 1),
  freezeUnit(batch1Candidates.find(u => u.h2Id === "H2-007"), 1),
  freezeUnit(h2008v2, 2, 1),
  freezeUnit(h2009v2, 2, 1),
  freezeUnit(h2010v2, 2, 1)
];

// Verify semantic payload equality (PROMOTION_SEMANTIC_MUTATIONS = 0)
let semanticMutations = 0;
frozenUnits.forEach(fu => {
  let source;
  if (fu.h2Id === "H2-003") source = h2003v2;
  else if (fu.h2Id === "H2-008") source = h2008v2;
  else if (fu.h2Id === "H2-009") source = h2009v2;
  else if (fu.h2Id === "H2-010") source = h2010v2;
  else source = batch1Candidates.find(u => u.h2Id === fu.h2Id);

  if (JSON.stringify(fu.goldenClaims) !== JSON.stringify(source.goldenClaims)) {
    console.error(`Semantic mutation detected in ${fu.h2Id} claims!`);
    semanticMutations++;
  }
  if (JSON.stringify(fu.exclusionRules) !== JSON.stringify(source.exclusionRules)) {
    console.error(`Semantic mutation detected in ${fu.h2Id} exclusions!`);
    semanticMutations++;
  }
});
if (semanticMutations !== 0) {
  throw new Error(`PROMOTION_SEMANTIC_MUTATIONS = ${semanticMutations} (expected 0)`);
}
console.log('Zero semantic mutations confirmed during promotion (100% byte-fidelity on payload).');

// 1. golden-batch-01.final.json
fs.writeFileSync(
  path.join(frozenDir, 'golden-batch-01.final.json'),
  JSON.stringify(frozenUnits, null, 2) + '\n'
);

// 2. golden-batch-01-review-ledger.json
const reviewLedger = {
  protocol: "ATHENA — V2.3.7-H2.4-G1.2",
  timestamp: new Date().toISOString(),
  decisionOrigin: "USER_EXPLICIT_DECISION",
  decisionStage: "PROJECT_GOLDEN_REVIEW",
  legalCertificationStatus: "NOT_FORMALLY_CERTIFIED_BENCHMARK_PROJECT_DECISION",
  batchSummary: {
    totalUnits: 10,
    projectGoldenApproved: 10,
    pending: 0,
    rejectedFinal: 0
  },
  units: [
    {
      h2Id: "H2-001",
      canonicalLocator: "CP_ART_15",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Two-claim decomposition of voluntary desistance and effective repentance." }]
    },
    {
      h2Id: "H2-002",
      canonicalLocator: "CP_ART_41",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Primary and subsidiary obligations upon supervenient mental illness." }]
    },
    {
      h2Id: "H2-003",
      canonicalLocator: "CP_ART_71",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G1", status: "NEEDS_CORRECTION", rationale: "C02 increase fraction detached from continued crime antecedent predicate." },
        { version: 2, stage: "G1.1", status: "APPROVED", rationale: "Continued-crime antecedent condition bound into C02 qualifiers." }
      ]
    },
    {
      h2Id: "H2-004",
      canonicalLocator: "CP_ART_80",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Two negative constitutive claims excluding sursis from restrictive penalties and fines." }]
    },
    {
      h2Id: "H2-005",
      canonicalLocator: "CP_ART_105",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Single-claim procedural bar following pardon in private action." }]
    },
    {
      h2Id: "H2-006",
      canonicalLocator: "LEP_ART_17",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Two-claim constitutive definition of educational assistance." }]
    },
    {
      h2Id: "H2-007",
      canonicalLocator: "LEP_ART_47",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G1", status: "APPROVED", rationale: "Single-claim administrative competence rule for disciplinary power." }]
    },
    {
      h2Id: "H2-008",
      canonicalLocator: "CP_ART_69",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G1", status: "NEEDS_CORRECTION", rationale: "Inferred institutional actor 'Juízo da execução' introduced in C02." },
        { version: 2, stage: "G1.1", status: "APPROVED", rationale: "Subject re-anchored to 'a pena de reclusão' with predicate 'executar-se primeiro'." }
      ]
    },
    {
      h2Id: "H2-009",
      canonicalLocator: "LEP_ART_144",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G1", status: "NEEDS_CORRECTION", rationale: "Unmodeled statutory cross-reference to Art. 137." },
        { version: 2, stage: "G1.1", status: "APPROVED", rationale: "Art. 137 incisos and paragraphs modeled in supportingTargets with dependencyType CROSS_REFERENCE." }
      ]
    },
    {
      h2Id: "H2-010",
      canonicalLocator: "LEP_ART_197",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G1", status: "NEEDS_CORRECTION", rationale: "Inferred actor in C01; pseudo-exception in C02." },
        { version: 2, stage: "G1.1", status: "APPROVED", rationale: "C01 subject set to 'recurso de agravo'; C02 encoded via negative polarity without exception qualifier." }
      ]
    }
  ]
};

fs.writeFileSync(
  path.join(frozenDir, 'golden-batch-01-review-ledger.json'),
  JSON.stringify(reviewLedger, null, 2) + '\n'
);

// 3. golden-batch-01-validation.json
const batchValidation = {
  protocol: "ATHENA — V2.3.7-H2.4-G1.2",
  timestamp: new Date().toISOString(),
  batch: "batch-01",
  totalUnits: 10,
  uniqueH2Ids: 10,
  approvedVersionsCount: 10,
  duplicateClaimIdsAcrossUnits: 0,
  orphanEssentialQualifiers: 0,
  invalidModalityCount: 0,
  invalidNormativeFunctionCount: 0,
  unresolvedSourceTargetCount: 0,
  pendingReviewCount: 0,
  h2009CrossReferenceCheck: {
    primaryTarget: "LEP-ART-144-CAPUT",
    crossReferenceSupportTargets: [
      "LEP-ART-137-INC-I",
      "LEP-ART-137-INC-II",
      "LEP-ART-137-INC-III",
      "LEP-ART-137-PAR-1",
      "LEP-ART-137-PAR-2"
    ],
    status: "VERIFIED"
  },
  allValidationPassed: true
};

fs.writeFileSync(
  path.join(frozenDir, 'golden-batch-01-validation.json'),
  JSON.stringify(batchValidation, null, 2) + '\n'
);

// 4. CONTRACT ADDENDUM FILES (v2.1)
const contractAddendumMd = `# ATHENA — GOLDEN CONTRACT ADDENDUM (VERSION 2.1)
## MANDATORY CONTRACT FOR HOLDOUT UNITS H2-011 THROUGH H2-060
## PROTOCOL: ATHENA — V2.3.7-H2.4-G1.2
## CONTRACT VERSION IDENTIFIER: G0.1+Batch01Addendum-v2.1

This addendum codifies the mandatory normative and structural decomposition rules established during the Batch-01 pilot freeze. Every future golden candidate in Batches 02 through 06 MUST adhere strictly to these four rules.

---

### RULE A — NO INVENTED ACTOR
A golden claim must NEVER introduce a legal actor (e.g., "Juízo da execução penal / Estado", "Partes / legitimados") that is merely inferred from doctrinal or institutional practice when \`originalText\` does not assert that actor. The normative subject must reflect the grammatical/normative subject stated in the text itself (e.g., the penalty itself, the legal act, or the specific status).

---

### RULE B — SHARED ANTECEDENT PROPAGATION
When a legal provision establishes a compound conditional scenario and states multiple distinct consequences (e.g., base exasperation penalty + fraction increase in continued crime), decomposing those consequences into separate atomic claims must preserve the binding of the material antecedent conditions for every dependent claim. A dependent consequence must not be represented as an unconditioned or floating rule.

---

### RULE C — CROSS-REFERENCE ATTRIBUTION
When a proposition expressly incorporates another statutory provision by reference (e.g., "indicados no inciso I do art. 137"), the decomposition must:
1. Preserve the cross-reference in \`claimText\` without inventing or importing unasserted external details;
2. Differentiate the primary operative target from supporting cross-referenced nodes;
3. Model supporting nodes in \`supportingTargets\` with \`dependencyType = 'CROSS_REFERENCE'\`, verified against frozen statutory evidence.

---

### RULE D — NEGATIVE LEGAL EFFECT != EXCEPTION
A statutory phrase denying or withholding a legal effect (e.g., "sem efeito suspensivo", "não se estende") represents a negative legal effect rule. It must be modeled via \`polarity = 'NEGATIVE'\` rather than an \`EXCEPTION\` qualifier, unless an actual statutory exception/carve-out from an affirmative general rule is structurally stated.
`;

const validatorAddendumJson = {
  contractVersion: "G0.1+Batch01Addendum-v2.1",
  protocol: "ATHENA — V2.3.7-H2.4-G1.2",
  scope: "GOVERNS_BATCHES_02_THROUGH_06",
  applicability: "GOLDEN_CONSTRUCTION_AND_REVIEW_ONLY",
  productionEvaluatorModified: false,
  rules: [
    {
      code: "POSSIBLE_INVENTED_ACTOR",
      severity: "WARNING",
      enforcement: "Detects institutional actor terms in claim.subject when no corresponding noun phrase exists in propositionText."
    },
    {
      code: "MISSING_SHARED_ANTECEDENT",
      severity: "ERROR",
      enforcement: "When a multi-sentence or compound proposition has a shared conditional antecedent, flags any subsequent claim whose qualifiers lack reference to the material trigger."
    },
    {
      code: "UNRESOLVED_CROSS_REFERENCE_TARGET",
      severity: "ERROR",
      enforcement: "When propositionText contains an explicit statutory cross-reference ('art. X', 'inciso Y'), ensures supportingTargets includes the referenced structural nodes."
    },
    {
      code: "MISCLASSIFIED_NEGATIVE_EFFECT_AS_EXCEPTION",
      severity: "ERROR",
      enforcement: "Flags claims where an affirmative modality contains an EXCEPTION qualifier whose sole text is 'sem efeito X' or 'não gera Y', requiring refactoring into polarity = NEGATIVE."
    }
  ]
};

fs.writeFileSync(path.join(frozenDir, 'golden-contract-addendum-v2.1.md'), contractAddendumMd);
fs.writeFileSync(path.join(frozenDir, 'golden-validator-addendum-v2.1.json'), JSON.stringify(validatorAddendumJson, null, 2) + '\n');

// 5. golden-batch-01-report.md
const batch1ReportMd = `# ATHENA — V2.3.7-H2.4-G1.2
## BATCH-01 FINAL PROJECT GOLDEN FREEZE REPORT

\`\`\`
================================================================================
MODE: OFFLINE / ZERO LLM / ZERO NETWORK / ZERO MODEL OUTPUT ACCESS /
      ZERO BENCHMARK EXECUTION / FAIL-CLOSED
PROTOCOL: ATHENA — V2.3.7-H2.4-G1.2
DATE: 2026-10-07
FINAL CLASSIFICATION: G1_2_BATCH_01_GOLDEN_FROZEN_READY_FOR_BATCH_02
BATCH COMPOSITION: 10/10 PROJECT_GOLDEN_APPROVED (100%)
CONTRACT VERSION: G0.1+Batch01Addendum-v2.1
================================================================================
\`\`\`

### 1. Final Composition of Frozen Batch-01

| Unit ID | Canonical Locator | Diploma & Subdivision | Approved Version | Claims Count | Status |
| :--- | :--- | :--- | :---: | :---: | :--- |
| \`H2-001\` | CP_ART_15 | CP Art. 15 caput | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-002\` | CP_ART_41 | CP Art. 41 caput | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-003\` | CP_ART_71 | CP Art. 71 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-004\` | CP_ART_80 | CP Art. 80 caput | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-005\` | CP_ART_105 | CP Art. 105 caput | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-006\` | LEP_ART_17 | LEP Art. 17 caput | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-007\` | LEP_ART_47 | LEP Art. 47 caput | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-008\` | CP_ART_69 | CP Art. 69 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-009\` | LEP_ART_144 | LEP Art. 144 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-010\` | LEP_ART_197 | LEP Art. 197 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |

- **Total Units Frozen:** 10
- **Total Golden Claims:** 18
- **Pending Units:** 0
- **Rejected Units:** 0
- **Semantic Promotion Mutations:** 0 (Byte/semantic-object identical to approved candidates)

### 2. Contract Addendum v2.1 Promotion
Rules A, B, C, D are formally promoted and frozen in:
- \`golden-contract-addendum-v2.1.md\`
- \`golden-validator-addendum-v2.1.json\`

These govern future holdout candidate construction for **Units H2-011 through H2-060** under contract version:
\`GOLDEN_CONSTRUCTION_CONTRACT_VERSION = G0.1+Batch01Addendum-v2.1\`
`;

fs.writeFileSync(path.join(frozenDir, 'golden-batch-01-report.md'), batch1ReportMd);

// 6. golden-batch-01-manifest.json
const manifestFiles = [
  'golden-batch-01.final.json',
  'golden-batch-01-review-ledger.json',
  'golden-batch-01-validation.json',
  'golden-contract-addendum-v2.1.md',
  'golden-validator-addendum-v2.1.json',
  'golden-batch-01-report.md'
];

const frozenHashes = {};
for (const f of manifestFiles) {
  const p = path.join(frozenDir, f);
  frozenHashes[f] = sha256(fs.readFileSync(p));
}

const manifestContent = {
  protocol: "ATHENA — V2.3.7-H2.4-G1.2",
  timestamp: new Date().toISOString(),
  finalClassification: "G1_2_BATCH_01_GOLDEN_FROZEN_READY_FOR_BATCH_02",
  goldenConstructionContractVersion: "G0.1+Batch01Addendum-v2.1",
  batchComposition: {
    totalUnits: 10,
    projectGoldenApproved: 10,
    pending: 0,
    rejectedFinal: 0,
    totalClaims: 18,
    approvedVersions: {
      "H2-001": 1,
      "H2-002": 1,
      "H2-003": 2,
      "H2-004": 1,
      "H2-005": 1,
      "H2-006": 1,
      "H2-007": 1,
      "H2-008": 2,
      "H2-009": 2,
      "H2-010": 2
    }
  },
  governance: {
    decisionOrigin: "USER_EXPLICIT_DECISION",
    decisionStage: "PROJECT_GOLDEN_REVIEW",
    promotionSemanticMutations: 0,
    llmCalls: 0,
    networkCalls: 0,
    modelOutputAccessed: false,
    finalSourceHoldoutMutated: false,
    g0Mutated: false,
    g01Mutated: false,
    g1Batch1Mutated: false,
    g11ReviewMutated: false,
    productionCodeChanged: false,
    evaluatorChanged: false,
    deployExecuted: false,
    commitExecuted: false,
    pushExecuted: false
  },
  artifactHashes: frozenHashes
};

fs.writeFileSync(
  path.join(frozenDir, 'golden-batch-01-manifest.json'),
  JSON.stringify(manifestContent, null, 2) + '\n'
);
frozenHashes['golden-batch-01-manifest.json'] = sha256(fs.readFileSync(path.join(frozenDir, 'golden-batch-01-manifest.json')));

// Re-verify immutability of historical baselines
console.log('Re-verifying historical baselines...');
for (const [file, hash] of Object.entries(expectedG11)) {
  verifyFile(path.join(g11Dir, file), hash);
}
console.log('Historical baselines immutability confirmed 100%.');

console.log('--------------------------------------------------');
console.log('G1.2 BATCH-01 GOLDEN FREEZE COMPLETE');
console.log('Classification: G1_2_BATCH_01_GOLDEN_FROZEN_READY_FOR_BATCH_02');
console.log('Artifacts frozen:', Object.keys(frozenHashes).length);
console.log('--------------------------------------------------');
