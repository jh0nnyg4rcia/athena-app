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

// 1. Verify G0
const g0Dir = 'tmp/assertion-decomposition-holdout-v237h22/golden-design';
const expectedG0 = {
  'golden-design-spec.md': 'b7a2cd6c842d983264cb2414fadac88104057b9fb512a030e2b2a9019ac27a56',
  'golden-schema.json': '2e489b1147c91b89d082ccb7e746151e2f17d7344a8df82b4ca2138f03558ce4',
  'golden-taxonomies.json': '9a2a388900d72e49a4cc740685c18fc0d605f1ffebc431f8ea810121fb37c3b0',
  'golden-compatibility-matrix.json': '6f849934788f77ab3e9431bf51c20ef23af764e6a6c8e8609bfd4a5fa4a8629e',
  'golden-validator-spec.json': 'b4e6fb54504c0fbf5ed49b4587c14f0bc124bf62355c5e4e6c2c37e972314476',
  'golden-human-review-protocol.md': 'f94d6b6f885c6fc381facef182ac00c228bc3e21563b46cd93e8318924b2fd71',
  'golden-synthetic-contract-tests.json': '47a4104acc8c00f4c8f86d40f939d272cb8d9259c2dac4c05946e5fdd663c39e',
  'golden-design-manifest.json': '8bdb329438878e8c82d4cfa0ae77e0ab0b1f8bfba511e4130bef13a94c74cadf'
};

console.log('Verifying G0 artifacts...');
for (const [file, hash] of Object.entries(expectedG0)) {
  verifyFile(path.join(g0Dir, file), hash);
}
console.log('All G0 artifacts verified 100%.');

// 21. Verify R5
const r5Dir = 'tmp/assertion-decomposition-holdout-v237h22/final-source-holdout';
const expectedR5 = {
  'h2-final-source.internal.json': '4c091e7b932dc3801573a0a4b39c1f72def71b2aa7ed9c2282d0c9c035f34a00',
  'h2-final-source.blind.json': '4618a15874660405cba5ece08f516bf76eee96a17d74a633fa068a85944272c8'
};

console.log('Verifying R5 artifacts...');
for (const [file, hash] of Object.entries(expectedR5)) {
  verifyFile(path.join(r5Dir, file), hash);
}
console.log('R5 artifacts verified 100%.');

// Target directory
const targetDir = 'tmp/assertion-decomposition-holdout-v237h22/golden-design-hardening';
fs.mkdirSync(targetDir, { recursive: true });

// ---------------------------------------------------------
// Build golden-taxonomies.v2.json
// ---------------------------------------------------------
const taxonomiesV2 = {
  version: "2.0.0",
  protocol: "ATHENA — V2.3.7-H2.4-G0.1",
  sourceTargetModel: "STRUCTURAL_SOURCE_TREE",
  granularityPrinciple: "NARROWEST_SUFFICIENT_NORMATIVE_TARGET",
  structuralNodeTypes: [
    "DIPLOMA",
    "ARTICLE",
    "CAPUT",
    "PARAGRAPH",
    "INCISO",
    "ALINEA",
    "ITEM",
    "SUBITEM"
  ],
  validPathRules: {
    description: "Ancestry is determined by actual legislative structure, not by a single fixed linear depth. Common structural tree branches include DIPLOMA/ARTICLE/CAPUT, DIPLOMA/ARTICLE/PARAGRAPH, DIPLOMA/ARTICLE/PARAGRAPH/INCISO, DIPLOMA/ARTICLE/INCISO, DIPLOMA/ARTICLE/INCISO/ALINEA, DIPLOMA/ARTICLE/INCISO/ALINEA/ITEM.",
    root: "DIPLOMA",
    allowedDirectChildren: {
      "DIPLOMA": ["ARTICLE", "LIVRO", "TITULO", "CAPITULO", "SECAO"],
      "ARTICLE": ["CAPUT", "PARAGRAPH", "INCISO"],
      "CAPUT": ["INCISO"],
      "PARAGRAPH": ["INCISO", "ALINEA"],
      "INCISO": ["ALINEA", "ITEM"],
      "ALINEA": ["ITEM", "SUBITEM"],
      "ITEM": ["SUBITEM"]
    }
  },
  attributionConstructs: {
    "COMBINED_TARGET": {
      isStructuralLevel: false,
      definition: "An attribution construct grouping two or more distinct structural source tree nodes, each of which is independently and materially necessary to establish the truth conditions of a single legal claim.",
      fields: ["targets", "combinationLogic", "rationale"]
    }
  },
  parentContextDependency: {
    modes: ["AUTONOMOUS", "PARENT_DEPENDENT"],
    rule: "If a subordinate node (e.g. inciso, alínea, parágrafo) lacks grammatical subject or operative verb without its parent, primaryTarget = subordinate node, supportingTargets includes only the strictly necessary parent node(s) with dependencyType = 'PARENT_CONTEXT'. Unnecessary parent nodes are forbidden."
  },
  modalities: [
    {
      canonical: "OBLIGATION",
      definition: "Mandatory conduct, duty, or affirmative legal imperative to act or refrain.",
      legacySerialization: "MUST",
      allowedPolarity: ["AFFIRMATIVE"]
    },
    {
      canonical: "PROHIBITION",
      definition: "Express legal interdiction or ban on conduct.",
      legacySerialization: "MUST_NOT",
      allowedPolarity: ["AFFIRMATIVE"]
    },
    {
      canonical: "PERMISSION",
      definition: "A legal norm allows a subject to perform or refrain from an act without violating the norm. Core question: 'Is the subject legally permitted to do X?'",
      legacySerialization: "MAY",
      allowedPolarity: ["AFFIRMATIVE"],
      semanticComparisonDefault: "NON_EQUIVALENT_TO_DISCRETION"
    },
    {
      canonical: "DISCRETION",
      definition: "A legal norm confers decisional authority on a public/legal decision maker to choose among legally permissible outcomes according to authorized evaluative criteria. Core question: 'Does the decision-maker have legally conferred choice among outcomes?'",
      legacySerialization: "MAY",
      allowedPolarity: ["AFFIRMATIVE"],
      semanticComparisonDefault: "NON_EQUIVALENT_TO_PERMISSION"
    },
    {
      canonical: "ENTITLEMENT",
      definition: "Enforceable subjective legal right, prerogative, benefit, or claim belonging to a person or entity.",
      legacySerialization: "IS_ENTITLED_TO",
      allowedPolarity: ["AFFIRMATIVE"]
    },
    {
      canonical: "CONSTITUTIVE_RULE",
      definition: "Norm that creates, modifies, defines, or extinguishes an institutional legal fact, relationship, or legal effect directly ex lege.",
      legacySerialization: "DECLARES",
      allowedPolarity: ["AFFIRMATIVE", "NEGATIVE"]
    },
    {
      canonical: "DEFINITION",
      definition: "Statutory designation, classification, threshold, or scope definition of a legal term.",
      legacySerialization: "DECLARES",
      allowedPolarity: ["AFFIRMATIVE"]
    },
    {
      canonical: "LEGAL_CONSEQUENCE",
      definition: "Automatic sanction, nullity, forfeiture, tolling, or statutory outcome following a legal event or factual trigger.",
      legacySerialization: "DECLARES",
      allowedPolarity: ["AFFIRMATIVE"]
    },
    {
      canonical: "LEGAL_STATUS",
      definition: "Recognition, attribution, or denial of a legal qualification, capacity, or standing.",
      legacySerialization: "RECOGNIZES",
      allowedPolarity: ["AFFIRMATIVE"]
    }
  ],
  permissionVsDiscretionRules: {
    fundamentalPrinciple: "PERMISSION != DISCRETION. Legacy serialization equivalence to 'MAY' does NOT imply semantic equivalence.",
    legacySerializationEquivalence: true,
    semanticEquivalenceDefault: false,
    contextualEquivalenceRequirements: [
      "A. Proposition wording itself does not distinguish private faculty from institutional decisional authority;",
      "B. Converting between labels does not alter actor, legal power, decision structure, or truth conditions;",
      "C. Human golden review explicitly marks permissionDiscretionInterchangeable = true."
    ],
    genericDistinctionExamples: [
      {
        text: "The owner may waive inspection before delivery.",
        modality: "PERMISSION",
        rationale: "Private legal faculty to act or not act without statutory choice between administrative outcomes."
      },
      {
        text: "The judge may determine the reduction of the penalty after evaluating the offender's personal circumstances.",
        modality: "DISCRETION",
        rationale: "Decisional authority conferred on a public adjudicator to choose among permissible legal outcomes based on authorized evaluative criteria."
      },
      {
        text: "The authority may issue the license when statutory requirements are met.",
        modality: "CONDITIONAL_ANALYSIS_REQUIRED",
        rationale: "Not automatically classified: if the statute binds the authority to issue upon objective proof, it is tied competence/declarative duty; if the authority retains genuine evaluative appraisal of public convenience/opportunity, it is DISCRETION; if framing a general faculty, PERMISSION."
      }
    ]
  },
  normativeFunctions: [
    "CONDUCT_RULE",
    "COMPETENCE_RULE",
    "PROCEDURAL_RULE",
    "DEFINITION_RULE",
    "SANCTION_RULE",
    "LEGAL_EFFECT_RULE",
    "STATUS_RULE",
    "EXCEPTION_RULE"
  ],
  polarities: ["AFFIRMATIVE", "NEGATIVE"],
  qualifierTypes: [
    "CONDITION",
    "EXCEPTION",
    "TEMPORAL",
    "QUANTITATIVE",
    "ACTOR_SCOPE",
    "OBJECT_SCOPE",
    "PROCEDURAL_STAGE",
    "JURISDICTIONAL_SCOPE",
    "PURPOSE",
    "CAUSAL",
    "DEPENDENCY"
  ],
  sourceValidationCodes: [
    "INVALID_STRUCTURAL_PATH",
    "NONEXISTENT_TARGET",
    "UNNECESSARY_PARENT_TARGET",
    "MISSING_REQUIRED_PARENT_CONTEXT",
    "OVERBROAD_TARGET",
    "INVALID_COMBINED_TARGET"
  ]
};

// ---------------------------------------------------------
// Build golden-compatibility-matrix.v2.json
// ---------------------------------------------------------
const compatibilityMatrixV2 = {
  version: "2.0.0",
  protocol: "ATHENA — V2.3.7-H2.4-G0.1",
  serializationMapping: {
    "OBLIGATION": "MUST",
    "PROHIBITION": "MUST_NOT",
    "PERMISSION": "MAY",
    "DISCRETION": "MAY",
    "ENTITLEMENT": "IS_ENTITLED_TO",
    "CONSTITUTIVE_RULE": "DECLARES",
    "DEFINITION": "DECLARES",
    "LEGAL_CONSEQUENCE": "DECLARES",
    "LEGAL_STATUS": "RECOGNIZES"
  },
  semanticComparisonRules: {
    "PERMISSION_VS_DISCRETION": {
      legacySerializationEquivalent: true,
      defaultSemanticEquivalent: false,
      mismatchClassification: "MODALITY_SEMANTIC_MISMATCH",
      exceptionRule: "If golden claim explicitly specifies permissionDiscretionInterchangeable = true, semantic comparator treats PERMISSION and DISCRETION as an acceptable match."
    },
    "OTHER_MODALITIES": {
      "OBLIGATION_VS_ANY": "FATAL_MISMATCH",
      "PROHIBITION_VS_ANY": "FATAL_MISMATCH",
      "ENTITLEMENT_VS_PERMISSION": "SEMANTIC_MISMATCH",
      "CONSTITUTIVE_VS_DEFINITION": "ACCEPTABLE_EQUIVALENCE_IF_SCOPED"
    }
  },
  sourceAttributionMapping: {
    structuralTreeTranslation: "Retains full path (e.g. ['DIPLOMA', 'ARTICLE', 'PARAGRAPH', 'INCISO']). For legacy consumers expecting flat string locators, concatenates into canonical standard string (e.g. 'DIPLOMA_ART_X_PAR_Y_INC_Z').",
    combinedTargetTranslation: "Serialized as semicolon-separated list of individual node locators when legacy consumer cannot parse targets[] array."
  }
};

// ---------------------------------------------------------
// Build golden-schema.v2.json
// ---------------------------------------------------------
const schemaV2 = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GoldenDecompositionUnitV2",
  "description": "Hardened normative schema for golden proposition decomposition under ATHENA V2.3.7-H2.4-G0.1",
  "type": "object",
  "required": [
    "unitId",
    "propositionText",
    "canonicalLocator",
    "goldenClaims",
    "exclusionRules"
  ],
  "properties": {
    "unitId": { "type": "string", "pattern": "^[A-Za-z0-9_-]+$" },
    "propositionText": { "type": "string", "minLength": 5 },
    "canonicalLocator": { "type": "string", "minLength": 3 },
    "syntheticSourceTree": {
      "type": "object",
      "description": "Structural source tree representing valid hierarchical nodes in the underlying legislative text",
      "properties": {
        "root": { "type": "string" },
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["nodeId", "nodeType", "path"],
            "properties": {
              "nodeId": { "type": "string" },
              "nodeType": {
                "type": "string",
                "enum": ["DIPLOMA", "ARTICLE", "CAPUT", "PARAGRAPH", "INCISO", "ALINEA", "ITEM", "SUBITEM"]
              },
              "path": {
                "type": "array",
                "items": { "type": "string" }
              },
              "isAutonomous": { "type": "boolean" },
              "text": { "type": "string" }
            }
          }
        }
      }
    },
    "goldenClaims": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": [
          "claimId",
          "claimText",
          "normativeFunction",
          "modality",
          "polarity",
          "subject",
          "predicate",
          "qualifiers",
          "sourceAttribution"
        ],
        "properties": {
          "claimId": { "type": "string", "pattern": "^C[0-9]{2,}$" },
          "claimText": { "type": "string", "minLength": 5 },
          "normativeFunction": {
            "type": "string",
            "enum": [
              "CONDUCT_RULE", "COMPETENCE_RULE", "PROCEDURAL_RULE", "DEFINITION_RULE",
              "SANCTION_RULE", "LEGAL_EFFECT_RULE", "STATUS_RULE", "EXCEPTION_RULE"
            ]
          },
          "modality": {
            "type": "string",
            "enum": [
              "OBLIGATION", "PROHIBITION", "PERMISSION", "DISCRETION", "ENTITLEMENT",
              "CONSTITUTIVE_RULE", "DEFINITION", "LEGAL_CONSEQUENCE", "LEGAL_STATUS"
            ]
          },
          "permissionDiscretionInterchangeable": {
            "type": "boolean",
            "default": false,
            "description": "True only when proposition wording and truth conditions make PERMISSION and DISCRETION indistinguishable in context."
          },
          "polarity": {
            "type": "string",
            "enum": ["AFFIRMATIVE", "NEGATIVE"]
          },
          "subject": { "type": "string" },
          "predicate": { "type": "string" },
          "qualifiers": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["qualifierType", "text", "essential"],
              "properties": {
                "qualifierType": {
                  "type": "string",
                  "enum": [
                    "CONDITION", "EXCEPTION", "TEMPORAL", "QUANTITATIVE", "ACTOR_SCOPE",
                    "OBJECT_SCOPE", "PROCEDURAL_STAGE", "JURISDICTIONAL_SCOPE", "PURPOSE", "CAUSAL", "DEPENDENCY"
                  ]
                },
                "text": { "type": "string" },
                "essential": { "type": "boolean" }
              }
            }
          },
          "sourceAttribution": {
            "type": "object",
            "required": ["attributionType", "confidence", "rationale"],
            "properties": {
              "attributionType": {
                "type": "string",
                "enum": ["SINGLE_NODE", "COMBINED_TARGET"]
              },
              "primaryTarget": {
                "type": "object",
                "properties": {
                  "nodeId": { "type": "string" },
                  "path": { "type": "array", "items": { "type": "string" } },
                  "nodeType": { "type": "string" },
                  "granularity": { "type": "string" }
                }
              },
              "targets": {
                "type": "array",
                "description": "Populated when attributionType == 'COMBINED_TARGET'",
                "items": {
                  "type": "object",
                  "required": ["nodeId", "path", "nodeType"],
                  "properties": {
                    "nodeId": { "type": "string" },
                    "path": { "type": "array", "items": { "type": "string" } },
                    "nodeType": { "type": "string" }
                  }
                }
              },
              "supportingTargets": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["nodeId", "path", "dependencyType"],
                  "properties": {
                    "nodeId": { "type": "string" },
                    "path": { "type": "array", "items": { "type": "string" } },
                    "dependencyType": {
                      "type": "string",
                      "enum": ["PARENT_CONTEXT", "CROSS_REFERENCE", "DEFINITIONAL_SUPPORT"]
                    }
                  }
                }
              },
              "confidence": {
                "type": "string",
                "enum": ["DIRECT", "INFERRED_CONTEXT", "SYSTEMIC"]
              },
              "rationale": { "type": "string" }
            }
          },
          "alternativeFormulations": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["variantClaimText", "acceptableEquivalenceReason"],
              "properties": {
                "variantClaimText": { "type": "string" },
                "acceptableEquivalenceReason": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "exclusionRules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["excludedElement", "rationale", "statutoryOrigin"],
        "properties": {
          "excludedElement": { "type": "string" },
          "rationale": { "type": "string" },
          "statutoryOrigin": { "type": "string" }
        }
      }
    }
  }
};

// ---------------------------------------------------------
// Build golden-validator-spec.v2.json
// ---------------------------------------------------------
const validatorSpecV2 = {
  version: "2.0.0",
  protocol: "ATHENA — V2.3.7-H2.4-G0.1",
  deterministicValidationRules: [
    {
      ruleId: "VAL-SRC-001",
      code: "INVALID_STRUCTURAL_PATH",
      description: "Triggered when a source target path does not conform to the allowed direct child transitions in the structural source tree (e.g. attempting ITEM directly under ARTICLE without INCISO/ALINEA)."
    },
    {
      ruleId: "VAL-SRC-002",
      code: "NONEXISTENT_TARGET",
      description: "Triggered when a referenced nodeId or path does not exist in the source tree."
    },
    {
      ruleId: "VAL-SRC-003",
      code: "UNNECESSARY_PARENT_TARGET",
      description: "Triggered when an autonomous node includes a parent node in supportingTargets merely because it is an ancestor."
    },
    {
      ruleId: "VAL-SRC-004",
      code: "MISSING_REQUIRED_PARENT_CONTEXT",
      description: "Triggered when a parent-dependent subordinate node (e.g. incomplete inciso) lacks the required parent in supportingTargets."
    },
    {
      ruleId: "VAL-SRC-005",
      code: "OVERBROAD_TARGET",
      description: "Triggered when a claim targets an overbroad ancestor node (e.g. entire ARTICLE) when the operative rule is isolated in a specific PARAGRAPH or INCISO."
    },
    {
      ruleId: "VAL-SRC-006",
      code: "INVALID_COMBINED_TARGET",
      description: "Triggered when COMBINED_TARGET contains fewer than 2 targets, includes a non-material/irrelevant node, or is used when a single node is sufficient."
    },
    {
      ruleId: "VAL-MOD-001",
      code: "MODALITY_SEMANTIC_MISMATCH",
      description: "Triggered when candidate outputs or comparisons treat PERMISSION and DISCRETION as equivalent without explicit permissionDiscretionInterchangeable = true in golden."
    },
    {
      ruleId: "VAL-SUBSET-001",
      code: "FUNDAMENTAL_SUBSET_VIOLATION",
      description: "Triggered when golden decomposition imports statutory clauses, conditions, or consequences not asserted in the input proposition."
    }
  ]
};

// ---------------------------------------------------------
// Build golden-synthetic-contract-tests.v2.json (AT LEAST 14 tests)
// ---------------------------------------------------------
const syntheticTestsV2 = {
  version: "2.0.0",
  protocol: "ATHENA — V2.3.7-H2.4-G0.1",
  totalTestCount: 16,
  requiredCategoriesCovered: "14/14",
  categories: [
    "simple_obligation",
    "prohibition",
    "permission",
    "discretion",
    "exception",
    "conditional_consequence",
    "multi_target",
    "parent_dependent_subordinate_text",
    "two_independent_claims",
    "negative_condition",
    "temporal_qualifier",
    "quantitative_qualifier",
    "permission_vs_discretion_non_equivalence",
    "combined_target"
  ],
  tests: [
    {
      testId: "SYNTH-V2-001",
      category: "simple_obligation",
      description: "Mandatory conduct for notary to register act upon formal request",
      proposition: "O oficial do registro deve lavrar o termo no livro competente imediatamente após o pedido.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-10", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-10", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "O oficial do registro deve lavrar o termo no livro competente imediatamente após o pedido." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "O oficial do registro deve lavrar o termo no livro competente imediatamente após o pedido.",
            normativeFunction: "CONDUCT_RULE",
            modality: "OBLIGATION",
            polarity: "AFFIRMATIVE",
            subject: "oficial do registro",
            predicate: "lavrar o termo no livro competente",
            qualifiers: [
              { qualifierType: "TEMPORAL", text: "imediatamente após o pedido", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-10", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Direct autonomous statement in caput."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        modality: "PERMISSION",
        reason: "Obligation cannot be softened into permission."
      }
    },
    {
      testId: "SYNTH-V2-002",
      category: "prohibition",
      description: "Prohibition on public agent receiving private advantage",
      proposition: "É vedado ao servidor público receber qualquer vantagem econômica indevida em razão do cargo.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-11", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-11", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "É vedado ao servidor público receber qualquer vantagem econômica indevida em razão do cargo." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "É vedado ao servidor público receber qualquer vantagem econômica indevida em razão do cargo.",
            normativeFunction: "CONDUCT_RULE",
            modality: "PROHIBITION",
            polarity: "AFFIRMATIVE",
            subject: "servidor público",
            predicate: "receber qualquer vantagem econômica indevida em razão do cargo",
            qualifiers: [
              { qualifierType: "CAUSAL", text: "em razão do cargo", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-11", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Direct autonomous prohibition in caput."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        modality: "OBLIGATION",
        polarity: "NEGATIVE",
        reason: "Prohibitions must be encoded canonically as modality=PROHIBITION and polarity=AFFIRMATIVE."
      }
    },
    {
      testId: "SYNTH-V2-003",
      category: "permission",
      description: "Private legal faculty of contracting party to renounce warranty",
      proposition: "O adquirente pode renunciar formalmente à garantia contratual suplementar.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-12", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-PAR-1", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "O adquirente pode renunciar formalmente à garantia contratual suplementar." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "O adquirente pode renunciar formalmente à garantia contratual suplementar.",
            normativeFunction: "CONDUCT_RULE",
            modality: "PERMISSION",
            polarity: "AFFIRMATIVE",
            permissionDiscretionInterchangeable: false,
            subject: "adquirente",
            predicate: "renunciar à garantia contratual suplementar",
            qualifiers: [
              { qualifierType: "CONDITION", text: "formalmente", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-PAR-1", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Autonomous paragraph conferring private legal faculty."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        modality: "DISCRETION",
        reason: "Private subject faculty is PERMISSION, not administrative/judicial DISCRETION."
      }
    },
    {
      testId: "SYNTH-V2-004",
      category: "discretion",
      description: "Judicial authority conferred choice to split procedural fees based on equity",
      proposition: "O magistrado pode distribuir os honorários sucumbenciais de acordo com a equidade nas causas de valor inestimável.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-13", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-13", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: false },
          { nodeId: "N-PAR-2", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "O magistrado pode distribuir os honorários sucumbenciais de acordo com a equidade nas causas de valor inestimável." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "O magistrado pode distribuir os honorários sucumbenciais de acordo com a equidade nas causas de valor inestimável.",
            normativeFunction: "COMPETENCE_RULE",
            modality: "DISCRETION",
            polarity: "AFFIRMATIVE",
            permissionDiscretionInterchangeable: false,
            subject: "magistrado",
            predicate: "distribuir os honorários sucumbenciais",
            qualifiers: [
              { qualifierType: "CONDITION", text: "de acordo com a equidade", essential: true },
              { qualifierType: "OBJECT_SCOPE", text: "nas causas de valor inestimável", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-PAR-2", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Decisional authority conferred on judicial officer choosing outcome under evaluative criteria."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        modality: "PERMISSION",
        reason: "Public decision-maker outcome choice under evaluative criteria is DISCRETION."
      }
    },
    {
      testId: "SYNTH-V2-005",
      category: "exception",
      description: "General rule with explicit statutory carve-out",
      proposition: "Os atos processuais são públicos, ressalvados os casos que tramitam em segredo de justiça.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-14", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-14", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "Os atos processuais são públicos, ressalvados os casos que tramitam em segredo de justiça." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "Os atos processuais são públicos, ressalvados os casos que tramitam em segredo de justiça.",
            normativeFunction: "PROCEDURAL_RULE",
            modality: "CONSTITUTIVE_RULE",
            polarity: "AFFIRMATIVE",
            subject: "atos processuais",
            predicate: "são públicos",
            qualifiers: [
              { qualifierType: "EXCEPTION", text: "ressalvados os casos que tramitam em segredo de justiça", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-14", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Statutory rule with integral exception clause."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        qualifierType: "CONDITION",
        reason: "Express derogation ('ressalvados') must be classified as EXCEPTION, not CONDITION."
      }
    },
    {
      testId: "SYNTH-V2-006",
      category: "conditional_consequence",
      description: "Legal consequence triggered upon occurrence of condition",
      proposition: "Se a obrigação for indivisível e houver pluralidade de devedores, cada um será obrigado pela dívida toda.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-15", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-15", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "Se a obrigação for indivisível e houver pluralidade de devedores, cada um será obrigado pela dívida toda." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "Se a obrigação for indivisível e houver pluralidade de devedores, cada um será obrigado pela dívida toda.",
            normativeFunction: "LEGAL_EFFECT_RULE",
            modality: "LEGAL_CONSEQUENCE",
            polarity: "AFFIRMATIVE",
            subject: "cada um dos devedores",
            predicate: "será obrigado pela dívida toda",
            qualifiers: [
              { qualifierType: "CONDITION", text: "se a obrigação for indivisível", essential: true },
              { qualifierType: "CONDITION", text: "se houver pluralidade de devedores", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-15", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Direct statutory effect ex lege upon dual conditions."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        modality: "DISCRETION",
        reason: "Automatic statutory consequence leaves no decisional choice."
      }
    },
    {
      testId: "SYNTH-V2-007",
      category: "multi_target",
      description: "Proposition synthesizing two separate statutory provisions across different paragraphs",
      proposition: "O recurso suspende o prazo principal e sua interposição prematura dispensa ratificação se não houver alteração do julgado.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-16", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-PAR-1", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "O recurso suspende o prazo principal." },
          { nodeId: "N-PAR-2", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "A interposição prematura do recurso dispensa ratificação se não houver alteração do julgado." }
        ]
      },
      expectedGolden: {
        claimsCount: 2,
        claims: [
          {
            claimId: "C01",
            claimText: "O recurso suspende o prazo principal.",
            normativeFunction: "LEGAL_EFFECT_RULE",
            modality: "LEGAL_CONSEQUENCE",
            polarity: "AFFIRMATIVE",
            subject: "recurso",
            predicate: "suspende o prazo principal",
            qualifiers: [],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-PAR-1", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Autonomous rule located in Paragraph 1."
            }
          },
          {
            claimId: "C02",
            claimText: "A interposição prematura do recurso dispensa ratificação se não houver alteração do julgado.",
            normativeFunction: "PROCEDURAL_RULE",
            modality: "CONSTITUTIVE_RULE",
            polarity: "AFFIRMATIVE",
            subject: "interposição prematura do recurso",
            predicate: "dispensa ratificação",
            qualifiers: [
              { qualifierType: "CONDITION", text: "se não houver alteração do julgado", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-PAR-2", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Autonomous rule located in Paragraph 2."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        sourceAttribution: "COMBINED_TARGET",
        reason: "When two distinct claims each correspond to an autonomous node, decompose into separate claims with single nodes, rather than bundling into an invalid combined target."
      }
    },
    {
      testId: "SYNTH-V2-008",
      category: "parent_dependent_subordinate_text",
      description: "Subordinate Inciso depending on Caput for grammatical subject and operative verb",
      proposition: "São nulos os atos administrativos praticados por autoridade incompetente.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-17", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-17", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: false, text: "São nulos os atos administrativos que:" },
          { nodeId: "N-INC-I", nodeType: "INCISO", path: ["DIPLOMA", "ARTICLE", "CAPUT", "INCISO"], isAutonomous: false, text: "I - forem praticados por autoridade incompetente;" }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "São nulos os atos administrativos praticados por autoridade incompetente.",
            normativeFunction: "SANCTION_RULE",
            modality: "LEGAL_CONSEQUENCE",
            polarity: "AFFIRMATIVE",
            subject: "atos administrativos praticados por autoridade incompetente",
            predicate: "são nulos",
            qualifiers: [
              { qualifierType: "ACTOR_SCOPE", text: "praticados por autoridade incompetente", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-INC-I", path: ["DIPLOMA", "ARTICLE", "CAPUT", "INCISO"], nodeType: "INCISO" },
              supportingTargets: [
                { nodeId: "N-CAPUT-17", path: ["DIPLOMA", "ARTICLE", "CAPUT"], dependencyType: "PARENT_CONTEXT" }
              ],
              confidence: "DIRECT",
              rationale: "Inciso I contains specific cause, but depends on Caput for predicate 'São nulos'."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        supportingTargets: [],
        errorCode: "MISSING_REQUIRED_PARENT_CONTEXT",
        reason: "Subordinate inciso lacking autonomous predicate must cite parent caput in supportingTargets."
      }
    },
    {
      testId: "SYNTH-V2-009",
      category: "two_independent_claims",
      description: "Proposition joining two truth-conditionally independent legal assertions",
      proposition: "O fiador responde pelas dívidas do afiançado e pode demandar que primeiro sejam executados os bens do devedor.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-18", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-18", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "O fiador responde pelas dívidas do afiançado e goza do benefício de ordem." }
        ]
      },
      expectedGolden: {
        claimsCount: 2,
        claims: [
          {
            claimId: "C01",
            claimText: "O fiador responde pelas dívidas do afiançado.",
            normativeFunction: "CONDUCT_RULE",
            modality: "OBLIGATION",
            polarity: "AFFIRMATIVE",
            subject: "fiador",
            predicate: "responder pelas dívidas do afiançado",
            qualifiers: [],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-18", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "First independent normative assertion."
            }
          },
          {
            claimId: "C02",
            claimText: "O fiador pode demandar que primeiro sejam executados os bens do devedor.",
            normativeFunction: "PROCEDURAL_RULE",
            modality: "ENTITLEMENT",
            polarity: "AFFIRMATIVE",
            subject: "fiador",
            predicate: "demandar a prévia excussão dos bens do devedor",
            qualifiers: [
              { qualifierType: "PROCEDURAL_STAGE", text: "primeiro", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-18", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Second independent normative entitlement (benefício de ordem)."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        claimsCount: 1,
        reason: "Conjoining distinct duties and subjective rights into a single claim violates truth-conditional independence."
      }
    },
    {
      testId: "SYNTH-V2-010",
      category: "negative_condition",
      description: "Rule whose application is triggered by the absence of a legal act",
      proposition: "Não havendo testamento válido, a sucessão defere-se aos herdeiros legítimos.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-19", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-19", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "Não havendo testamento válido, a sucessão defere-se aos herdeiros legítimos." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "Não havendo testamento válido, a sucessão defere-se aos herdeiros legítimos.",
            normativeFunction: "LEGAL_EFFECT_RULE",
            modality: "LEGAL_CONSEQUENCE",
            polarity: "AFFIRMATIVE",
            subject: "sucessão",
            predicate: "defere-se aos herdeiros legítimos",
            qualifiers: [
              { qualifierType: "CONDITION", text: "não havendo testamento válido", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-19", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Direct consequence triggered by negative condition."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        polarity: "NEGATIVE",
        reason: "The legal consequence is affirmative ('defere-se'); the negativity resides inside the CONDITION qualifier."
      }
    },
    {
      testId: "SYNTH-V2-011",
      category: "temporal_qualifier",
      description: "Procedural deadline constraining official filing",
      proposition: "O recurso administrativo deve ser interposto no prazo improrrogável de dez dias úteis.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-20", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-CAPUT-20", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "O recurso administrativo deve ser interposto no prazo improrrogável de dez dias úteis." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "O recurso administrativo deve ser interposto no prazo improrrogável de dez dias úteis.",
            normativeFunction: "PROCEDURAL_RULE",
            modality: "OBLIGATION",
            polarity: "AFFIRMATIVE",
            subject: "interessado / recorrente",
            predicate: "interpor recurso administrativo",
            qualifiers: [
              { qualifierType: "TEMPORAL", text: "no prazo improrrogável de dez dias úteis", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-CAPUT-20", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Autonomous procedural deadline in caput."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        qualifierType: "QUANTITATIVE",
        reason: "A deadline measured in days is TEMPORAL, not merely quantitative."
      }
    },
    {
      testId: "SYNTH-V2-012",
      category: "quantitative_qualifier",
      description: "Constitutional voting quorum threshold",
      proposition: "A proposta de emenda constitucional será aprovada se obtiver três quintos dos votos em ambos os turnos.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-21", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-PAR-1", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "A proposta de emenda será aprovada se obtiver três quintos dos votos em ambos os turnos." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "A proposta de emenda constitucional será aprovada se obtiver três quintos dos votos em ambos os turnos.",
            normativeFunction: "PROCEDURAL_RULE",
            modality: "CONSTITUTIVE_RULE",
            polarity: "AFFIRMATIVE",
            subject: "proposta de emenda constitucional",
            predicate: "será aprovada",
            qualifiers: [
              { qualifierType: "QUANTITATIVE", text: "três quintos dos votos", essential: true },
              { qualifierType: "PROCEDURAL_STAGE", text: "em ambos os turnos", essential: true }
            ],
            sourceAttribution: {
              attributionType: "SINGLE_NODE",
              primaryTarget: { nodeId: "N-PAR-1", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" },
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Autonomous parliamentary quorum requirement."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        qualifiers: [],
        reason: "Omitting the 3/5 quorum qualifier distorts the constitutional approval threshold."
      }
    },
    {
      testId: "SYNTH-V2-013",
      category: "permission_vs_discretion_non_equivalence",
      description: "Paired tests showing PERMISSION vs DISCRETION non-equivalence and explicit interchangeable exemption",
      subcases: [
        {
          subcaseId: "13A_PERMISSION_REJECTS_DISCRETION",
          proposition: "O credor pode relevar a mora do devedor solidário.",
          modality: "PERMISSION",
          permissionDiscretionInterchangeable: false,
          candidateOutput: { modality: "DISCRETION" },
          expectedValidation: "FAIL",
          expectedErrorCode: "MODALITY_SEMANTIC_MISMATCH",
          rationale: "Creditor private faculty is PERMISSION; cannot be matched to DISCRETION."
        },
        {
          subcaseId: "13B_DISCRETION_REJECTS_PERMISSION",
          proposition: "A comissão examinadora pode anular questão que considere manifestamente desarrazoada.",
          modality: "DISCRETION",
          permissionDiscretionInterchangeable: false,
          candidateOutput: { modality: "PERMISSION" },
          expectedValidation: "FAIL",
          expectedErrorCode: "MODALITY_SEMANTIC_MISMATCH",
          rationale: "Administrative evaluation power is DISCRETION; cannot be matched to bare PERMISSION."
        },
        {
          subcaseId: "13C_CONTEXTUALLY_INTERCHANGEABLE_PASSES",
          proposition: "A entidade pode estabelecer horário especial de atendimento no recesso forense.",
          modality: "DISCRETION",
          permissionDiscretionInterchangeable: true,
          candidateOutput: { modality: "PERMISSION" },
          expectedValidation: "PASS",
          rationale: "When human golden explicitly freezes permissionDiscretionInterchangeable = true, semantic comparator accepts both."
        }
      ],
      expectedGolden: {
        claimsCount: 1,
        note: "Synthetic modality contract test demonstrating strict separation by default and exception gate."
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        automaticEquivalence: true,
        reason: "Treating PERMISSION and DISCRETION as automatically equivalent is strictly prohibited."
      }
    },
    {
      testId: "SYNTH-V2-014",
      category: "combined_target",
      description: "Single claim requiring two distinct statutory nodes to establish truth condition",
      proposition: "A sanção de demissão é imprescritível se decorrer de condenação penal definitiva transitada em julgado.",
      syntheticSourceTree: {
        root: "DIPLOMA",
        nodes: [
          { nodeId: "N-ART-22", nodeType: "ARTICLE", path: ["DIPLOMA", "ARTICLE"], isAutonomous: false },
          { nodeId: "N-ART-22-CAPUT", nodeType: "CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], isAutonomous: true, text: "A ação disciplinar prescreve em cinco anos quanto às infrações puníveis com demissão." },
          { nodeId: "N-ART-22-PAR-2", nodeType: "PARAGRAPH", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], isAutonomous: true, text: "Os prazos de prescrição previstos na lei penal aplicam-se às infrações disciplinares capituladas também como crime." }
        ]
      },
      expectedGolden: {
        claimsCount: 1,
        claims: [
          {
            claimId: "C01",
            claimText: "A prescrição da demissão por falta capitulada como crime rege-se pelos prazos da lei penal.",
            normativeFunction: "SANCTION_RULE",
            modality: "LEGAL_CONSEQUENCE",
            polarity: "AFFIRMATIVE",
            subject: "prescrição da infração disciplinar de demissão",
            predicate: "rege-se pelos prazos da lei penal",
            qualifiers: [
              { qualifierType: "CONDITION", text: "se capitulada também como crime", essential: true }
            ],
            sourceAttribution: {
              attributionType: "COMBINED_TARGET",
              targets: [
                { nodeId: "N-ART-22-CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], nodeType: "CAPUT" },
                { nodeId: "N-ART-22-PAR-2", path: ["DIPLOMA", "ARTICLE", "PARAGRAPH"], nodeType: "PARAGRAPH" }
              ],
              supportingTargets: [],
              confidence: "DIRECT",
              rationale: "Caput establishes demissão prescription rule; Paragraph 2 creates the criminal-code cross-over. Both are materially necessary."
            }
          }
        ]
      },
      expectedValidation: "PASS",
      forbiddenAlternative: {
        attributionType: "SINGLE_NODE",
        primaryTarget: "N-ART-22-CAPUT",
        reason: "Citing Caput alone omits the criminal penalty cross-reference, resulting in incomplete attribution."
      }
    },
    {
      testId: "SYNTH-V2-015",
      category: "source_tree_structural_edge_cases",
      description: "Invalid structural path and unnecessary parent tests",
      edgeCaseTests: [
        {
          caseId: "INVALID_PATH_ITEM_UNDER_ARTICLE",
          attemptedPath: ["DIPLOMA", "ARTICLE", "ITEM"],
          expectedValidation: "FAIL",
          expectedErrorCode: "INVALID_STRUCTURAL_PATH",
          reason: "ITEM cannot descend directly from ARTICLE without INCISO and ALINEA."
        },
        {
          caseId: "UNNECESSARY_PARENT_ON_AUTONOMOUS_PARAGRAPH",
          nodeId: "N-PAR-1",
          isAutonomous: true,
          supportingTargets: [{ nodeId: "N-CAPUT", path: ["DIPLOMA", "ARTICLE", "CAPUT"], dependencyType: "PARENT_CONTEXT" }],
          expectedValidation: "FAIL",
          expectedErrorCode: "UNNECESSARY_PARENT_TARGET",
          reason: "Autonomous paragraph does not require and must not include ancestor caput."
        },
        {
          caseId: "OVERBROAD_TARGET_WHOLE_ARTICLE",
          targetNode: "N-ART-10",
          nodeType: "ARTICLE",
          expectedValidation: "FAIL",
          expectedErrorCode: "OVERBROAD_TARGET",
          reason: "Targeting whole article when operative text resides in specific caput violates narrowest sufficient rule."
        }
      ],
      expectedValidation: "PASS",
      forbiddenAlternative: {
        linearOrderAssumption: true,
        reason: "Assuming fixed linear progression violates structural tree model."
      }
    },
    {
      testId: "SYNTH-V2-016",
      category: "modality_cross_mismatch_tests",
      description: "MUST vs MAY and MUST_NOT vs MAY mismatch detection",
      crossMismatchTests: [
        {
          caseId: "MUST_VS_MAY",
          goldenModality: "OBLIGATION",
          candidateModality: "PERMISSION",
          expectedValidation: "FAIL",
          expectedErrorCode: "MODALITY_SEMANTIC_MISMATCH"
        },
        {
          caseId: "MUST_NOT_VS_MAY",
          goldenModality: "PROHIBITION",
          candidateModality: "PERMISSION",
          expectedValidation: "FAIL",
          expectedErrorCode: "MODALITY_SEMANTIC_MISMATCH"
        }
      ],
      expectedValidation: "PASS",
      forbiddenAlternative: {
        looseModalityMatch: true,
        reason: "Obligations and prohibitions cannot be treated as discretionary permissions."
      }
    }
  ]
};

// ---------------------------------------------------------
// Build golden-human-review-protocol.v2.md
// ---------------------------------------------------------
const humanReviewProtocolV2 = `# ATHENA — V2.3.7-H2.4-G0.1
## HUMAN REVIEW PROTOCOL (HARDENED V2)

### 1. Separation of Project Provenance vs Qualified Legal Review
- **User Role / Project Provenance:**
  The current user/operator acts in the capacity of **Project Owner / Benchmark Architect**. All approvals made by the user are frozen under provenance:
  \`decisionOrigin = USER_EXPLICIT_DECISION\`
  \`provenance = PROJECT_BENCHMARK_REVIEW\`
- **Qualification Restriction:**
  The protocol **STRICTLY FORBIDS** representing, certifying, or implying that the user is a licensed attorney, judge, or qualified legal counsel in any official capacity. Project ownership does NOT confer statutory legal qualification.
- **Formal Legal Certification Gate:**
  If a future benchmark phase or regulatory body mandates formal legal certification, the status MUST be classified explicitly as:
  \`EXTERNAL_QUALIFIED_LEGAL_REVIEW_REQUIRED\`
  until and unless performed and signed off by an independently verified, qualified legal professional.

---

### 2. Mandatory Human Review Workflow for Phase G1
1. **Source Integrity Verification:** Verify proposition text against official Planalto/normative text.
2. **Structural Tree Mapping:** Identify narrowest sufficient node in the \`STRUCTURAL_SOURCE_TREE\`. Do not include unnecessary parent nodes.
3. **Modality & Polarity Adjudication:**
   - Adhere strictly to the distinction:
     - \`PERMISSION\`: Private faculty to act or refrain without penalty.
     - \`DISCRETION\`: Decisional authority of a public/legal decision-maker choosing among permissible outcomes under evaluative criteria.
   - Do NOT mark them interchangeable unless:
     (a) Wording does not distinguish faculty from authority;
     (b) Truth conditions are identical under both;
     (c) Explicitly marked \`permissionDiscretionInterchangeable = true\`.
4. **Fundamental Subset Rule Enforcement:**
   Confirm that zero unasserted statutory elements, omitted exceptions, or extraneous paragraphs are imported into the golden claims.
5. **Combined Target Verification:**
   Verify that any \`COMBINED_TARGET\` attribution contains only independently necessary structural nodes.
`;

// ---------------------------------------------------------
// Build golden-design-spec.v2.md
// ---------------------------------------------------------
const designSpecV2 = `# ATHENA — V2.3.7-H2.4-G0.1
## GOLDEN CONTRACT HARDENING SPECIFICATION (V2)

### 1. Structural Source Tree Model (\`STRUCTURAL_SOURCE_TREE\`)
The obsolete linear hierarchy (\`DIPLOMA > ARTICLE > CAPUT > PARAGRAPH > ITEM > SUBITEM > ALINEA > INCISO > COMBINED_TARGET\`) is completely abolished.

Statutory norms exist within a hierarchical tree whose valid ancestry depends on actual legislative layout:
- **Root:** \`DIPLOMA\`
- **Descendant Nodes:** \`ARTICLE\`, \`CAPUT\`, \`PARAGRAPH\`, \`INCISO\`, \`ALINEA\`, \`ITEM\`, \`SUBITEM\`.
- **Valid Structural Paths:**
  - \`DIPLOMA / ARTICLE / CAPUT\`
  - \`DIPLOMA / ARTICLE / PARAGRAPH\`
  - \`DIPLOMA / ARTICLE / PARAGRAPH / INCISO\`
  - \`DIPLOMA / ARTICLE / INCISO\`
  - \`DIPLOMA / ARTICLE / INCISO / ALINEA\`
  - \`DIPLOMA / ARTICLE / INCISO / ALINEA / ITEM\`

### 2. Granularity Principle: \`NARROWEST_SUFFICIENT_NORMATIVE_TARGET\`
The authoritative target is the narrowest structural node that materially contains the operative normative content required by the claim. Structural depth alone does not determine sufficiency; a deeper node is not automatically superior if the normative rule resides higher.

### 3. Attribution Construct: \`COMBINED_TARGET\`
\`COMBINED_TARGET\` is NOT a structural depth level. It is an attribution construct holding an array of \`targets[]\`, each of which is an actual structural node in the tree. It is strictly reserved for cases where two or more nodes are independently necessary to establish the single claim's truth condition.

### 4. Parent Context Dependency
- \`AUTONOMOUS\`: Node contains its own subject, predicate, and operative rule. Parents must NOT be included in \`supportingTargets\`.
- \`PARENT_DEPENDENT\`: Subordinate node (e.g. inciso or alínea) depends on parent for subject or verb. The subordinate node is \`primaryTarget\`; parent node is listed in \`supportingTargets\` with \`dependencyType = 'PARENT_CONTEXT'\`.

### 5. Modality Semantics: \`PERMISSION\` vs \`DISCRETION\`
- **Non-Equivalence:** \`PERMISSION != DISCRETION\`.
- **Legacy Serialization:** Both serialize to legacy \`MAY\` for backward compatibility only.
- **Semantic Comparison:** Evaluator comparison defaults to \`MODALITY_SEMANTIC_MISMATCH\`.
- **Contextual Equivalence Gate:** Only when proposition wording does not distinguish private faculty from public choice, truth conditions are identical, and golden review explicitly freezes \`permissionDiscretionInterchangeable = true\`.
`;

// ---------------------------------------------------------
// Build golden-design-hardening-report.md
// ---------------------------------------------------------
const hardeningReport = `# ATHENA — V2.3.7-H2.4-G0.1
## GOLDEN CONTRACT HARDENING REPORT

### 1. Mission Overview
- **Protocol:** ATHENA — V2.3.7-H2.4-G0.1
- **Mode:** OFFLINE / ZERO LLM / ZERO NETWORK / ZERO H2 SEMANTIC ACCESS / ZERO GOLDEN / FAIL-CLOSED
- **Status:** Hardening completed successfully.

### 2. Three Contract Hardening Objectives
1. **Structural Source Tree Model:** Linear hierarchy replaced with \`STRUCTURAL_SOURCE_TREE\` supporting arbitrary valid legislative tree branches and deterministic path validation.
2. **Permission vs Discretion Semantics:** Formalized non-equivalence (\`PERMISSION != DISCRETION\`), legacy-only serialization to \`MAY\`, and conditional exemption flag (\`permissionDiscretionInterchangeable\`).
3. **Synthetic Contract Test Suite:** Expanded to 16 comprehensive synthetic test cases covering all 14 mandatory categories, structural tree edge cases, paired modality tests, and deterministic error codes.

### 3. G1 Human Review Protocol Governance
User role preserved as \`USER_EXPLICIT_DECISION\` / \`PROJECT_BENCHMARK_REVIEW\`. No claim of qualified legal certification. If formal legal sign-off is required, it must be gated under \`EXTERNAL_QUALIFIED_LEGAL_REVIEW_REQUIRED\`.
`;

// Write all v2 files
fs.writeFileSync(path.join(targetDir, 'golden-taxonomies.v2.json'), JSON.stringify(taxonomiesV2, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'golden-compatibility-matrix.v2.json'), JSON.stringify(compatibilityMatrixV2, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'golden-schema.v2.json'), JSON.stringify(schemaV2, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'golden-validator-spec.v2.json'), JSON.stringify(validatorSpecV2, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'golden-synthetic-contract-tests.v2.json'), JSON.stringify(syntheticTestsV2, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'golden-human-review-protocol.v2.md'), humanReviewProtocolV2);
fs.writeFileSync(path.join(targetDir, 'golden-design-spec.v2.md'), designSpecV2);
fs.writeFileSync(path.join(targetDir, 'golden-design-hardening-report.md'), hardeningReport);

// Hash all created files for the manifest
const manifestFiles = [
  'golden-design-spec.v2.md',
  'golden-schema.v2.json',
  'golden-taxonomies.v2.json',
  'golden-compatibility-matrix.v2.json',
  'golden-validator-spec.v2.json',
  'golden-human-review-protocol.v2.md',
  'golden-synthetic-contract-tests.v2.json',
  'golden-design-hardening-report.md'
];

const createdHashes = {};
for (const file of manifestFiles) {
  const content = fs.readFileSync(path.join(targetDir, file));
  createdHashes[file] = sha256(content);
}

const manifestV2 = {
  protocol: "ATHENA — V2.3.7-H2.4-G0.1",
  timestamp: new Date().toISOString(),
  finalClassification: "G0_1_GOLDEN_CONTRACT_HARDENED_READY_FOR_G1_REVIEW",
  objective: "GOLDEN_CONTRACT_HARDENING",
  structuralSourceTreeModel: "STRUCTURAL_SOURCE_TREE",
  modalityHardening: {
    permissionVsDiscretionEquivalence: false,
    legacySerializationOnly: true
  },
  testCoverage: {
    syntheticTestCount: syntheticTestsV2.totalTestCount,
    requiredCategoryCoverage: "14/14",
    sourceTreeEdgeCasesPresent: true,
    permissionDiscretionTestsPresent: true
  },
  governance: {
    g0ArtifactsMutated: false,
    finalSourceHoldoutMutated: false,
    h2SemanticContentAccessed: false,
    goldenUnitsCreated: 0,
    llmCalls: 0,
    gptCalls: 0,
    geminiCalls: 0,
    claudeCalls: 0,
    networkCalls: 0,
    modelOutputAccessed: false,
    modelFailureDataAccessed: false,
    h2Executed: false,
    benchmarkScored: false,
    productionCodeChanged: false,
    evaluatorChanged: false,
    deployExecuted: false,
    commitExecuted: false,
    pushExecuted: false
  },
  createdArtifactHashes: createdHashes
};

fs.writeFileSync(path.join(targetDir, 'golden-design-hardening-manifest.json'), JSON.stringify(manifestV2, null, 2) + '\n');
createdHashes['golden-design-hardening-manifest.json'] = sha256(fs.readFileSync(path.join(targetDir, 'golden-design-hardening-manifest.json')));

// Re-verify G0 & R5 immutability post build
console.log('Re-verifying G0 immutability...');
for (const [file, hash] of Object.entries(expectedG0)) {
  verifyFile(path.join(g0Dir, file), hash);
}
console.log('G0 immutability confirmed 100%.');

console.log('Re-verifying R5 immutability...');
for (const [file, hash] of Object.entries(expectedR5)) {
  verifyFile(path.join(r5Dir, file), hash);
}
console.log('R5 immutability confirmed 100%.');

console.log('--------------------------------------------------');
console.log('G0.1 HARDENING COMPLETE');
console.log('Classification: G0_1_GOLDEN_CONTRACT_HARDENED_READY_FOR_G1_REVIEW');
console.log('Artifact Hashes:', JSON.stringify(createdHashes, null, 2));
console.log('--------------------------------------------------');
