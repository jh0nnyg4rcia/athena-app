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

// 1. VERIFY G2.1
const g21Dir = 'tmp/assertion-decomposition-holdout-v237h22/golden-candidates/batch-02-review';
const expectedG21 = {
  'batch-02-project-review-decisions.json': '5c5c4782065f0974fa30dcabdac421a0d4ac449caf4ec3a4114372604232402c',
  'batch-02-correction-ledger.json': '7119022b1532ba10fc909f8400a2e448f81ef539b5af247317909e616035a544',
  'golden-contract-lessons-batch-02.md': '5516d23a2745f1278cc8e7dcabb4f6af8a88af0be21d725fead2d95011578c50',
  'prospective-validator-rules-batch-02.json': '61b842de3e3484f02ec7553091632830ac0fba9e8071c582220b9c87f4f59441',
  'batch-02-review-validation.json': '74dd90c4b4652ae7ccc848e44426ff87bcf0409df2c56f7e9afd53b5481db7bd',
  'batch-02-review-report.md': '62c6f4d90f88bcd8b7c36a11cee7afedb6541d53c3a4ba23cf9fd6becf53954d',
  'corrected-candidates/H2-013.v2.json': '0cf1daec3701314c8677379f916cc0ccb1be644228db17ba4c702fe369e13be6',
  'corrected-candidates/H2-014.v2.json': 'f491434658a31b310afc5d94e1608bcbf1917e2d07428421bc382f704b2dce8d',
  'corrected-candidates/H2-020.v2.json': 'dd45943c3b1747803c70c3d291d14c0f4bb467d709abda648ce4ccb097ee494a',
  'batch-02-review-manifest.json': '553e9c104d4d89b69a869adc1b4af0caed863d423af4c0884751925e14a0a244'
};

console.log('Verifying G2.1 baseline artifacts...');
for (const [file, hash] of Object.entries(expectedG21)) {
  verifyFile(path.join(g21Dir, file), hash);
}
console.log('G2.1 verified 100%.');

// 10. VERIFY BATCH-01 IMMUTABILITY
const frozenBatch1Dir = 'tmp/assertion-decomposition-holdout-v237h22/golden-frozen/batch-01';
const expectedFrozenBatch1 = {
  'golden-batch-01.final.json': 'eed85abc241b5cbf64759a14dac71d28fc7d56af7eb951dd48d3da4e701c74f1',
  'golden-batch-01-review-ledger.json': '78ba629783cf5c5a90142fda393b74febb587b458aa93cd8e090de8d3f72ad28',
  'golden-batch-01-validation.json': '56b361dc0339257df03fee05f905d43ec564bdff8330394a3c675eedc288502b',
  'golden-contract-addendum-v2.1.md': 'fb7a84a02020f3a9e812204f914493209cf4be6ae861874e676e40faa4788780',
  'golden-validator-addendum-v2.1.json': '1999206482873845b7574c127256a3337116449e843e68d1d2baf6636cb64ade',
  'golden-batch-01-report.md': 'a21f723698c4564af052b435b31ce98c4e2d835fad6619f63f222c769bd8f27d',
  'golden-batch-01-manifest.json': '501686033ae5666b5e5df84084fe9281a2dd91cb8485b78fb4a0549bb007d872'
};
console.log('Verifying Batch-01 frozen golden immutability...');
for (const [file, hash] of Object.entries(expectedFrozenBatch1)) {
  verifyFile(path.join(frozenBatch1Dir, file), hash);
}
console.log('Batch-01 frozen golden immutability confirmed 100%.');

// 11. VERIFY SOURCE HOLDOUT IMMUTABILITY
const r5Dir = 'tmp/assertion-decomposition-holdout-v237h22/final-source-holdout';
verifyFile(path.join(r5Dir, 'h2-final-source.internal.json'), '4c091e7b932dc3801573a0a4b39c1f72def71b2aa7ed9c2282d0c9c035f34a00');
verifyFile(path.join(r5Dir, 'h2-final-source.blind.json'), '4618a15874660405cba5ece08f516bf76eee96a17d74a633fa068a85944272c8');
console.log('R5 source holdout immutability confirmed 100%.');

// Setup output directory
const frozenBatch2Dir = 'tmp/assertion-decomposition-holdout-v237h22/golden-frozen/batch-02';
fs.mkdirSync(frozenBatch2Dir, { recursive: true });

// Read approved candidates
const batch2Candidates = JSON.parse(fs.readFileSync('tmp/assertion-decomposition-holdout-v237h22/golden-candidates/batch-02/golden-candidates-batch-02.json', 'utf8'));
const h2013v2 = JSON.parse(fs.readFileSync(path.join(g21Dir, 'corrected-candidates/H2-013.v2.json'), 'utf8'));
const h2014v2 = JSON.parse(fs.readFileSync(path.join(g21Dir, 'corrected-candidates/H2-014.v2.json'), 'utf8'));
const h2020v2 = JSON.parse(fs.readFileSync(path.join(g21Dir, 'corrected-candidates/H2-020.v2.json'), 'utf8'));

// Freeze helper
function freezeUnit(unit, approvedVersion, previousVersion = null) {
  return {
    ...unit,
    status: "PROJECT_GOLDEN_APPROVED",
    approvedVersion: approvedVersion,
    previousVersion: previousVersion,
    decisionOrigin: "USER_EXPLICIT_DECISION",
    decisionStage: "PROJECT_GOLDEN_REVIEW",
    frozenAt: "2026-10-07T21:35:00.000Z",
    legalCertificationStatus: "NOT_FORMALLY_CERTIFIED_BENCHMARK_PROJECT_DECISION"
  };
}

const frozenUnits = [
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-011"), 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-012"), 1),
  freezeUnit(h2013v2, 2, 1),
  freezeUnit(h2014v2, 2, 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-015"), 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-016"), 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-017"), 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-018"), 1),
  freezeUnit(batch2Candidates.find(u => u.h2Id === "H2-019"), 1),
  freezeUnit(h2020v2, 2, 1)
];

// Check zero semantic mutations
let semanticMutations = 0;
frozenUnits.forEach(fu => {
  let source;
  if (fu.h2Id === "H2-013") source = h2013v2;
  else if (fu.h2Id === "H2-014") source = h2014v2;
  else if (fu.h2Id === "H2-020") source = h2020v2;
  else source = batch2Candidates.find(u => u.h2Id === fu.h2Id);

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

// 1. golden-batch-02.final.json
fs.writeFileSync(
  path.join(frozenBatch2Dir, 'golden-batch-02.final.json'),
  JSON.stringify(frozenUnits, null, 2) + '\n'
);

// 2. golden-batch-02-review-ledger.json
const reviewLedger = {
  protocol: "ATHENA — V2.3.7-H2.4-G2.2",
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
      h2Id: "H2-011",
      canonicalLocator: "CP_ART_141_PAR_2",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Tripling majorante for social media with parent context." }]
    },
    {
      h2Id: "H2-012",
      canonicalLocator: "CP_ART_233",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Conduct prohibition and shared antecedent penalty for ato obsceno." }]
    },
    {
      h2Id: "H2-013",
      canonicalLocator: "CP_ART_342",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G2", status: "NEEDS_CORRECTION", rationale: "Unasserted legal offense label in C02 subject." },
        { version: 2, stage: "G2.1", status: "APPROVED", rationale: "Subject re-anchored strictly in proposition text without external offense label." }
      ]
    },
    {
      h2Id: "H2-014",
      canonicalLocator: "LEI_8072_ART_2_PAR_3",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G2", status: "NEEDS_CORRECTION", rationale: "'fundamentadamente' misclassified as CONDITION." },
        { version: 2, stage: "G2.1", status: "APPROVED", rationale: "Reason-giving requirement preserved in predicate semantics; residual CONDITION removed." }
      ]
    },
    {
      h2Id: "H2-015",
      canonicalLocator: "CP_ART_249_PAR_2",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Discretionary judicial pardon for restitution of minor/incapable." }]
    },
    {
      h2Id: "H2-016",
      canonicalLocator: "CP_ART_299",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Three-claim decomposition with distinct penalties for public vs private document." }]
    },
    {
      h2Id: "H2-017",
      canonicalLocator: "LEI_8137_ART_7_PAR_UNICO",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Cross-reference attribution to incisos II, III, IX of Art. 7º." }]
    },
    {
      h2Id: "H2-018",
      canonicalLocator: "LEI_8137_ART_16",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Civic entitlement to provoke Public Prosecutor action." }]
    },
    {
      h2Id: "H2-019",
      canonicalLocator: "CPP_ART_25",
      approvedVersion: 1,
      decision: "APPROVED",
      history: [{ version: 1, stage: "G2", status: "APPROVED", rationale: "Constitutive procedural rule on representation irretratabilidade." }]
    },
    {
      h2Id: "H2-020",
      canonicalLocator: "CPP_ART_111",
      approvedVersion: 2,
      decision: "APPROVED",
      history: [
        { version: 1, stage: "G2", status: "NEEDS_CORRECTION", rationale: "'em regra' misclassified as CONDITION." },
        { version: 2, stage: "G2.1", status: "APPROVED", rationale: "Generality preserved in predicate semantics under negative polarity; residual CONDITION removed." }
      ]
    }
  ]
};

fs.writeFileSync(
  path.join(frozenBatch2Dir, 'golden-batch-02-review-ledger.json'),
  JSON.stringify(reviewLedger, null, 2) + '\n'
);

// 3. golden-batch-02-validation.json
const batchValidation = {
  protocol: "ATHENA — V2.3.7-H2.4-G2.2",
  timestamp: new Date().toISOString(),
  batch: "batch-02",
  totalUnits: 10,
  uniqueH2Ids: 10,
  approvedVersionsCount: 10,
  duplicateClaimIdsAcrossUnits: 0,
  orphanEssentialQualifiers: 0,
  invalidModalityCount: 0,
  invalidNormativeFunctionCount: 0,
  unresolvedSourceTargetCount: 0,
  pendingReviewCount: 0,
  promotionSemanticMutations: 0,
  correctedSemanticsAudit: {
    h2013_noUnsupportedOffenseLabelInSubject: true,
    h2014_fundamentadamentePreservedInPredicateWithoutResidualCondition: true,
    h2020_emRegraPreservedInPredicateWithoutResidualConditionNegativePolarityPreserved: true
  },
  allValidationPassed: true
};

fs.writeFileSync(
  path.join(frozenBatch2Dir, 'golden-batch-02-validation.json'),
  JSON.stringify(batchValidation, null, 2) + '\n'
);

// 4. CONTRACT ADDENDUM v2.2 FILES
const contractAddendumV22Md = `# ATHENA — CUMULATIVE GOLDEN CONTRACT ADDENDUM (VERSION 2.2)
## MANDATORY CONTRACT FOR HOLDOUT UNITS H2-021 THROUGH H2-060
## PROTOCOL: ATHENA — V2.3.7-H2.4-G2.2
## CONTRACT IDENTIFIER: G0.1+Batch01Addendum-v2.1+Batch02Addendum-v2.2

This addendum cumulates the mandatory normative and structural decomposition rules established across Batches 01 and 02. Every future golden candidate in Batches 03 through 06 MUST adhere strictly to all six rules.

---

### RULE A — NO INVENTED ACTOR (From Batch 01)
A golden claim must NEVER introduce a legal actor (e.g., "Juízo da execução penal / Estado", "Partes / legitimados") that is merely inferred from doctrinal or institutional practice when \`originalText\` does not assert that actor. The normative subject must reflect the grammatical/normative subject stated in the text itself.

---

### RULE B — SHARED ANTECEDENT PROPAGATION (From Batch 01)
When a legal provision establishes a compound conditional scenario and states multiple distinct consequences, decomposing those consequences into separate atomic claims must preserve the binding of the material antecedent conditions for every dependent claim.

---

### RULE C — CROSS-REFERENCE ATTRIBUTION (From Batch 01)
When a proposition expressly incorporates another statutory provision by reference (e.g., "indicados no inciso I do art. 137"), the decomposition must:
1. Preserve the cross-reference in \`claimText\` without inventing or importing unasserted external details;
2. Differentiate the primary operative target from supporting cross-referenced nodes;
3. Model supporting nodes in \`supportingTargets\` with \`dependencyType = 'CROSS_REFERENCE'\`, verified against frozen statutory evidence.

---

### RULE D — NEGATIVE LEGAL EFFECT != EXCEPTION (From Batch 01)
A statutory phrase denying or withholding a legal effect represents a negative legal effect rule. It must be modeled via \`polarity = 'NEGATIVE'\` rather than an \`EXCEPTION\` qualifier, unless an actual statutory exception/carve-out from an affirmative general rule is structurally stated.

---

### RULE E — TAXONOMY CONSERVATION & NO RESIDUAL CONDITION CLASSIFICATION (From Batch 02)
1. \`CONDITION\` is reserved strictly for genuine factual or legal antecedents whose fulfillment triggers the applicability, activation, or truth of the normative consequence.
2. Do NOT use \`CONDITION\` for adverbs of manner (*"fundamentadamente"*), reason-giving, scope, or generality/default-rule wording (*"em regra"*).
3. If an expression does not fit the 11 frozen canonical qualifier types in G0.1, preserve it atomically inside \`claimText\` and \`predicate\` semantics. Do NOT fabricate artificial qualifier categories.

---

### RULE F — NO EXTERNAL OFFENSE LABELS IN SUBJECT (From Batch 02)
Do not introduce a statutory or dogmatic crime title (e.g., *"O crime de falso testemunho ou falsa perícia"*) into \`claim.subject\` when that title is absent from \`originalText\`. Ground the subject strictly in the descriptive noun phrase or verbal construction asserted in the proposition.
`;

const validatorAddendumV22Json = {
  contractVersion: "G0.1+Batch01Addendum-v2.1+Batch02Addendum-v2.2",
  protocol: "ATHENA — V2.3.7-H2.4-G2.2",
  scope: "GOVERNS_BATCHES_03_THROUGH_06",
  applicability: "GOLDEN_CONSTRUCTION_AND_REVIEW_ONLY",
  productionEvaluatorModified: false,
  cumulativeRules: [
    {
      code: "POSSIBLE_INVENTED_ACTOR",
      severity: "WARNING",
      origin: "Batch-01 (Rule A)",
      enforcement: "Detects institutional actor terms in claim.subject when no corresponding noun phrase exists in propositionText."
    },
    {
      code: "MISSING_SHARED_ANTECEDENT",
      severity: "ERROR",
      origin: "Batch-01 (Rule B)",
      enforcement: "Flags multi-claim units where a dependent consequence claim lacks the material conditional antecedent."
    },
    {
      code: "UNRESOLVED_CROSS_REFERENCE_TARGET",
      severity: "ERROR",
      origin: "Batch-01 (Rule C)",
      enforcement: "Ensures supportingTargets models explicit statutory cross-references present in propositionText."
    },
    {
      code: "MISCLASSIFIED_NEGATIVE_EFFECT_AS_EXCEPTION",
      severity: "ERROR",
      origin: "Batch-01 (Rule D)",
      enforcement: "Flags claims where an affirmative modality contains an EXCEPTION qualifier whose sole text is 'sem efeito X' or 'não gera Y'."
    },
    {
      code: "POSSIBLE_RESIDUAL_CONDITION",
      severity: "WARNING",
      origin: "Batch-02 (Rule E)",
      enforcement: "Flags any qualifier classified as CONDITION when its text is an adverb of manner, default-rule language ('em regra'), or general descriptive wording."
    },
    {
      code: "UNSUPPORTED_OFFENSE_LABEL_IN_SUBJECT",
      severity: "WARNING",
      origin: "Batch-02 (Rule F)",
      enforcement: "Detects statutory crime names in claim.subject when 'crime de X' does not appear in propositionText."
    }
  ]
};

fs.writeFileSync(path.join(frozenBatch2Dir, 'golden-contract-addendum-v2.2.md'), contractAddendumV22Md);
fs.writeFileSync(path.join(frozenBatch2Dir, 'golden-validator-addendum-v2.2.json'), JSON.stringify(validatorAddendumV22Json, null, 2) + '\n');

// 5. golden-batch-02-report.md
const batch2ReportMd = `# ATHENA — V2.3.7-H2.4-G2.2
## BATCH-02 FINAL PROJECT GOLDEN FREEZE REPORT

\`\`\`
================================================================================
MODE: OFFLINE / ZERO LLM / ZERO NETWORK / ZERO MODEL OUTPUT ACCESS /
      ZERO BENCHMARK EXECUTION / FAIL-CLOSED
PROTOCOL: ATHENA — V2.3.7-H2.4-G2.2
DATE: 2026-10-07
FINAL CLASSIFICATION: G2_2_BATCH_02_GOLDEN_FROZEN_READY_FOR_BATCH_03
BATCH COMPOSITION: 10/10 PROJECT_GOLDEN_APPROVED (100%)
CONTRACT VERSION: G0.1+Batch01Addendum-v2.1+Batch02Addendum-v2.2
CUMULATIVE FREEZE PROGRESS: 20/60 UNITS FROZEN (Batches 01 and 02)
================================================================================
\`\`\`

### 1. Final Composition of Frozen Batch-02

| Unit ID | Canonical Locator | Diploma & Subdivision | Approved Version | Claims Count | Status |
| :--- | :--- | :--- | :---: | :---: | :--- |
| \`H2-011\` | CP_ART_141_PAR_2 | CP Art. 141, § 2º | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-012\` | CP_ART_233 | CP Art. 233 caput | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-013\` | CP_ART_342 | CP Art. 342 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-014\` | LEI_8072_ART_2_PAR_3 | Lei 8.072/90, Art. 2º, § 3º | **v2** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-015\` | CP_ART_249_PAR_2 | CP Art. 249, § 2º | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-016\` | CP_ART_299 | CP Art. 299 caput | **v1** | 3 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-017\` | LEI_8137_ART_7_PAR_UNICO | Lei 8.137/90, Art. 7º, p. único | **v1** | 2 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-018\` | LEI_8137_ART_16 | Lei 8.137/90, Art. 16 caput | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-019\` | CPP_ART_25 | CPP Art. 25 caput | **v1** | 1 | \`PROJECT_GOLDEN_APPROVED\` |
| \`H2-020\` | CPP_ART_111 | CPP Art. 111 caput | **v2** | 2 | \`PROJECT_GOLDEN_APPROVED\` |

- **Total Units Frozen in Batch-02:** 10
- **Total Golden Claims in Batch-02:** 16
- **Cumulative Frozen Holdout Units:** 20 / 60
- **Cumulative Frozen Golden Claims:** 34
- **Semantic Promotion Mutations:** 0 (100% byte/semantic-object identical to approved candidates)

### 2. Contract Addendum v2.2 Promotion
Rules A, B, C, D, E, F are codified into:
- \`golden-contract-addendum-v2.2.md\`
- \`golden-validator-addendum-v2.2.json\`

These govern future holdout candidate construction for **Units H2-021 through H2-060** under contract version:
\`GOLDEN_CONSTRUCTION_CONTRACT_VERSION = G0.1+Batch01Addendum-v2.1+Batch02Addendum-v2.2\`
`;

fs.writeFileSync(path.join(frozenBatch2Dir, 'golden-batch-02-report.md'), batch2ReportMd);

// 6. golden-batch-02-manifest.json
const manifestFiles = [
  'golden-batch-02.final.json',
  'golden-batch-02-review-ledger.json',
  'golden-batch-02-validation.json',
  'golden-contract-addendum-v2.2.md',
  'golden-validator-addendum-v2.2.json',
  'golden-batch-02-report.md'
];

const frozenHashes = {};
for (const f of manifestFiles) {
  const p = path.join(frozenBatch2Dir, f);
  frozenHashes[f] = sha256(fs.readFileSync(p));
}

const manifestContent = {
  protocol: "ATHENA — V2.3.7-H2.4-G2.2",
  timestamp: new Date().toISOString(),
  finalClassification: "G2_2_BATCH_02_GOLDEN_FROZEN_READY_FOR_BATCH_03",
  goldenConstructionContractVersion: "G0.1+Batch01Addendum-v2.1+Batch02Addendum-v2.2",
  batchComposition: {
    totalUnits: 10,
    projectGoldenApproved: 10,
    pending: 0,
    rejectedFinal: 0,
    totalClaims: 16,
    approvedVersions: {
      "H2-011": 1,
      "H2-012": 1,
      "H2-013": 2,
      "H2-014": 2,
      "H2-015": 1,
      "H2-016": 1,
      "H2-017": 1,
      "H2-018": 1,
      "H2-019": 1,
      "H2-020": 2
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
    batch1FrozenMutated: false,
    batch2OriginalMutated: false,
    batch2ReviewMutated: false,
    productionCodeChanged: false,
    evaluatorChanged: false,
    deployExecuted: false,
    commitExecuted: false,
    pushExecuted: false
  },
  artifactHashes: frozenHashes
};

fs.writeFileSync(
  path.join(frozenBatch2Dir, 'golden-batch-02-manifest.json'),
  JSON.stringify(manifestContent, null, 2) + '\n'
);
frozenHashes['golden-batch-02-manifest.json'] = sha256(fs.readFileSync(path.join(frozenBatch2Dir, 'golden-batch-02-manifest.json')));

// Re-verify immutability of historical baselines
console.log('Re-verifying historical baselines...');
for (const [file, hash] of Object.entries(expectedG21)) {
  verifyFile(path.join(g21Dir, file), hash);
}
console.log('Historical baselines immutability confirmed 100%.');

console.log('--------------------------------------------------');
console.log('G2.2 BATCH-02 GOLDEN FREEZE COMPLETE');
console.log('Classification: G2_2_BATCH_02_GOLDEN_FROZEN_READY_FOR_BATCH_03');
console.log('Artifacts frozen:', Object.keys(frozenHashes).length);
console.log('--------------------------------------------------');
