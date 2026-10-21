/**
 * ATHENA — V2.3.7-H2.4-G0
 * INDEPENDENT GOLDEN DESIGN SPECIFICATION
 *
 * MODE: OFFLINE / ZERO LLM / ZERO NETWORK / ZERO MODEL OUTPUT ACCESS / ZERO BENCHMARK EXECUTION / FAIL-CLOSED
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

// -----------------------------------------------------------------------------
// 1. VERIFY FINAL SOURCE HOLDOUT (Section 1)
// -----------------------------------------------------------------------------
const EXPECTED_FINAL_SOURCE = {
  'h2-final-source.internal.json': '4c091e7b932dc3801573a0a4b39c1f72def71b2aa7ed9c2282d0c9c035f34a00',
  'h2-final-source.blind.json': '4618a15874660405cba5ece08f516bf76eee96a17d74a633fa068a85944272c8',
  'h2-final-source-validation.json': '7bd690bd842593da9e04814c55349e510a5fa5458c136c07d6dee25774474f18',
  'h2-final-source-report.md': '54a68d480e12d5cf484e1e982e661935e4a14caffae68a40fa372316bc61a5c0',
  'h2-final-source-manifest.json': '89548ecc603586e0f9cf5bc99963cceeac8887459d2a1d6597f298728cc704ae'
};

const FINAL_SOURCE_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/final-source-holdout');
for (const [f, exp] of Object.entries(EXPECTED_FINAL_SOURCE)) {
  const p = path.join(FINAL_SOURCE_DIR, f);
  if (!fs.existsSync(p)) throw new Error(`ABORT: Final source file missing: ${f}`);
  const act = sha256File(p);
  if (act !== exp) throw new Error(`ABORT: Final source hash mismatch on ${f}: act=${act} exp=${exp}`);
}
console.log('Section 1 Verification: All 5 Final Source Holdout files verified 100%.');

// -----------------------------------------------------------------------------
// 2. INITIALIZE ISOLATED GOLDEN-DESIGN DIRECTORY
// -----------------------------------------------------------------------------
const G0_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/golden-design');
fs.mkdirSync(G0_DIR, { recursive: true });

// -----------------------------------------------------------------------------
// 3. GENERATE golden-taxonomies.json (Sections 6, 7, 8, 9, 10)
// -----------------------------------------------------------------------------
const taxonomiesObj = {
  protocol: 'ATHENA — V2.3.7-H2.4-G0',
  timestamp: new Date().toISOString(),
  taxonomies: {
    modality: {
      canonicalValues: [
        'OBLIGATION',
        'PROHIBITION',
        'PERMISSION',
        'DISCRETION',
        'ENTITLEMENT',
        'CONSTITUTIVE_RULE',
        'DEFINITION',
        'LEGAL_CONSEQUENCE',
        'LEGAL_STATUS'
      ],
      definitions: {
        OBLIGATION: 'Imposes an unavoidable legal duty of conduct or procedural action on the addressee (MUST).',
        PROHIBITION: 'Forbids a specific conduct, state, or omission under the legal system (MUST_NOT).',
        PERMISSION: 'Explicitly authorizes a conduct, declaring it legally permissible without mandating it (MAY).',
        DISCRETION: 'Endows a public, judicial, or administrative authority with decision-making power within legal bounds (MAY + authority).',
        ENTITLEMENT: 'Confers a legal right or power of claim on an individual or entity (IS_ENTITLED_TO).',
        CONSTITUTIVE_RULE: 'Directly creates, alters, or extinguishes a legal relationship, effect, or norm upon verification of legal facts (DECLARES).',
        DEFINITION: 'Authoritatively defines the meaning, scope, or classification of a legal term or institution (DECLARES).',
        LEGAL_CONSEQUENCE: 'Specifies the mandatory sanction, penalty, nullity, or procedural result flowing from an antecedent fact (LEGAL_CONSEQUENCE).',
        LEGAL_STATUS: 'Attributes an objective juridical qualification, standing, or quality to a person, act, or thing (RECOGNIZES).'
      },
      criticalDistinctions: [
        'MAY != MUST (Permission does not imply duty).',
        'MAY != ENTITLED_TO (Simple permission does not automatically create an enforceable subjective claim against another).',
        'MUST NOT != NOT_ENTITLED (Prohibition forbids conduct; lack of entitlement merely means the legal system does not confer a positive power).',
        'DISCRETION != PERMISSION (Discretion applies when a public/judicial authority has bounded decision-making power; permission applies to general subjects).'
      ],
      backwardCompatibilityMapping: {
        OBLIGATION: 'MUST',
        PROHIBITION: 'MUST_NOT',
        PERMISSION: 'MAY',
        DISCRETION: 'MAY',
        ENTITLEMENT: 'MAY',
        CONSTITUTIVE_RULE: 'DECLARES',
        DEFINITION: 'DECLARES',
        LEGAL_CONSEQUENCE: 'DECLARES',
        LEGAL_STATUS: 'RECOGNIZES'
      }
    },
    polarity: {
      canonicalValues: [
        'AFFIRMATIVE',
        'NEGATIVE'
      ],
      definitions: {
        AFFIRMATIVE: 'The truth condition states that a predicate holds, applies, or is verified (positive proposition).',
        NEGATIVE: 'The truth condition states that a predicate does not hold, does not apply, or is excluded (negative proposition).'
      },
      deterministicRules: [
        'Prohibitions whose modality is PROHIBITION are encoded with modality = PROHIBITION and polarity = AFFIRMATIVE (e.g., "The official is forbidden to act" is an affirmative statement of a prohibition).',
        'A rule stating that a requirement does not apply is encoded with modality = PERMISSION/CONSTITUTIVE_RULE and polarity = NEGATIVE.',
        'Negative conditions (e.g., "if the defendant does NOT possess a prior record") bind as NEGATIVE condition qualifiers.',
        'Double negatives must be preserved in their explicit formulation if omission alters the burden of proof or normative effect.'
      ],
      backwardCompatibilityMapping: {
        AFFIRMATIVE: 'POSITIVE',
        NEGATIVE: 'NEGATIVE'
      }
    },
    normativeFunction: {
      canonicalValues: [
        'CONDUCT_RULE',
        'COMPETENCE_RULE',
        'PROCEDURAL_RULE',
        'DEFINITION_RULE',
        'SANCTION_RULE',
        'LEGAL_EFFECT_RULE',
        'STATUS_RULE',
        'EXCEPTION_RULE'
      ],
      definitions: {
        CONDUCT_RULE: 'Governs primary behaviour of legal subjects by ordering, prohibiting, or permitting actions.',
        COMPETENCE_RULE: 'Attributes jurisdictional, legislative, or administrative power to a specific organ or agent.',
        PROCEDURAL_RULE: 'Regulates the form, timeline, sequence, or formal requirements of judicial or administrative acts.',
        DEFINITION_RULE: 'Establishes authentic legal concepts, elements of institutions, or interpretive criteria.',
        SANCTION_RULE: 'Prescribes punitive, civil, administrative, or disciplinary consequences for unlawful acts.',
        LEGAL_EFFECT_RULE: 'Specifies the automatic legal consequences of valid acts, facts, or events (e.g., extinction of rights).',
        STATUS_RULE: 'Establishes legal capacity, standing, civil status, or formal qualification.',
        EXCEPTION_RULE: 'Derogates, limits, or suspends the application of a general rule under specific conditions.'
      },
      backwardCompatibilityMapping: {
        CONDUCT_RULE: 'DUTY',
        COMPETENCE_RULE: 'COMPETENCE',
        PROCEDURAL_RULE: 'DUTY',
        DEFINITION_RULE: 'DECLARATION',
        SANCTION_RULE: 'CONSTITUTIVE_EFFECT',
        LEGAL_EFFECT_RULE: 'CONSTITUTIVE_EFFECT',
        STATUS_RULE: 'DECLARATION',
        EXCEPTION_RULE: 'PERMISSION'
      }
    },
    qualifierTaxonomy: {
      canonicalValues: [
        'CONDITION',
        'EXCEPTION',
        'TEMPORAL',
        'QUANTITATIVE',
        'ACTOR_SCOPE',
        'OBJECT_SCOPE',
        'PROCEDURAL_STAGE',
        'JURISDICTIONAL_SCOPE',
        'PURPOSE',
        'CAUSAL',
        'DEPENDENCY'
      ],
      definitions: {
        CONDITION: 'A factual or legal hypothesis upon which the normative effect depends (e.g., "if", "in case of").',
        EXCEPTION: 'An express exclusion that prevents the norm from operating (e.g., "unless", "except", "salvo").',
        TEMPORAL: 'A deadline, duration, retroactive limit, or chronological condition (e.g., "within 15 days", "after sentencing").',
        QUANTITATIVE: 'A numerical, monetary, or fraction threshold (e.g., "by two-thirds", "up to 5 years").',
        ACTOR_SCOPE: 'Restricts the subjects affected or empowered (e.g., "only civil servants", "magistrates").',
        OBJECT_SCOPE: 'Restricts the material scope or goods covered (e.g., "public documents only").',
        PROCEDURAL_STAGE: 'Restricts the procedural phase in which the norm applies (e.g., "during pre-trial investigation").',
        JURISDICTIONAL_SCOPE: 'Restricts geographic, regional, or hierarchical jurisdiction.',
        PURPOSE: 'Expresses teleological intent or specific purpose required by law (e.g., "with the purpose of defrauding").',
        CAUSAL: 'Specifies required cause or nexus between events.',
        DEPENDENCY: 'Subordinates the validity of the rule to another concurrent act or norm.'
      },
      bindingRules: [
        'Every qualifier MUST bind explicitly to a claimId via bindsTo. Floating qualifiers are strictly invalid.',
        'A qualifier is MATERIAL if its omission alters the truth conditions of the proposition.'
      ],
      backwardCompatibilityMapping: {
        CONDITION: 'CONDITION',
        EXCEPTION: 'EXCEPTION',
        TEMPORAL: 'TEMPORAL',
        QUANTITATIVE: 'LIMIT',
        ACTOR_SCOPE: 'SCOPE',
        OBJECT_SCOPE: 'SCOPE',
        PROCEDURAL_STAGE: 'SCOPE',
        JURISDICTIONAL_SCOPE: 'AUTHORITY',
        PURPOSE: 'PURPOSE',
        CAUSAL: 'CONDITION',
        DEPENDENCY: 'CONDITION'
      }
    },
    sourceTargetHierarchy: {
      levels: [
        'DIPLOMA',
        'ARTICLE',
        'CAPUT',
        'PARAGRAPH',
        'ITEM',
        'SUBITEM',
        'ALINEA',
        'INCISO',
        'COMBINED_TARGET'
      ],
      principles: [
        'Use the narrowest sufficient target that fully supports the truth condition.',
        'Do not target the entire article when the paragraph alone supplies the complete rule.',
        'Include parent target only when the subordinate provision is semantically incomplete without it.',
        'Use COMBINED_TARGET when truth depends materially on more than one textual unit.',
        'Structural ancestry in DOM does not imply normative support.'
      ]
    }
  }
};
fs.writeFileSync(path.join(G0_DIR, 'golden-taxonomies.json'), JSON.stringify(taxonomiesObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 4. GENERATE golden-compatibility-matrix.json (Section 13)
// -----------------------------------------------------------------------------
const compatibilityMatrixObj = {
  protocol: 'ATHENA — V2.3.7-H2.4-G0',
  timestamp: new Date().toISOString(),
  matrix: [
    { normativeFunction: 'CONDUCT_RULE', modality: 'OBLIGATION', status: 'COMPATIBLE', rationale: 'Command ordering positive conduct.' },
    { normativeFunction: 'CONDUCT_RULE', modality: 'PROHIBITION', status: 'COMPATIBLE', rationale: 'Command forbidding negative conduct.' },
    { normativeFunction: 'CONDUCT_RULE', modality: 'PERMISSION', status: 'COMPATIBLE', rationale: 'Authorization of primary conduct.' },
    { normativeFunction: 'COMPETENCE_RULE', modality: 'DISCRETION', status: 'COMPATIBLE', rationale: 'Decisional authority bounded by law.' },
    { normativeFunction: 'COMPETENCE_RULE', modality: 'OBLIGATION', status: 'COMPATIBLE', rationale: 'Mandatory jurisdiction or duty to act.' },
    { normativeFunction: 'COMPETENCE_RULE', modality: 'ENTITLEMENT', status: 'COMPATIBLE', rationale: 'Conferral of procedural prerogative.' },
    { normativeFunction: 'PROCEDURAL_RULE', modality: 'OBLIGATION', status: 'COMPATIBLE', rationale: 'Mandatory procedural step or deadline.' },
    { normativeFunction: 'PROCEDURAL_RULE', modality: 'PERMISSION', status: 'COMPATIBLE', rationale: 'Optional procedural avenue.' },
    { normativeFunction: 'DEFINITION_RULE', modality: 'DEFINITION', status: 'COMPATIBLE', rationale: 'Authoritative statutory concept.' },
    { normativeFunction: 'DEFINITION_RULE', modality: 'CONSTITUTIVE_RULE', status: 'COMPATIBLE', rationale: 'Norm defining legal classification.' },
    { normativeFunction: 'SANCTION_RULE', modality: 'LEGAL_CONSEQUENCE', status: 'COMPATIBLE', rationale: 'Penalty or sanction consequence.' },
    { normativeFunction: 'LEGAL_EFFECT_RULE', modality: 'LEGAL_CONSEQUENCE', status: 'COMPATIBLE', rationale: 'Automatic effect (e.g., extincao da punibilidade).' },
    { normativeFunction: 'LEGAL_EFFECT_RULE', modality: 'CONSTITUTIVE_RULE', status: 'COMPATIBLE', rationale: 'Creation or alteration of legal state.' },
    { normativeFunction: 'STATUS_RULE', modality: 'LEGAL_STATUS', status: 'COMPATIBLE', rationale: 'Qualification of legal standing.' },
    { normativeFunction: 'EXCEPTION_RULE', modality: 'PERMISSION', status: 'COMPATIBLE', rationale: 'Carve-out permitting otherwise constrained conduct.' },
    { normativeFunction: 'EXCEPTION_RULE', modality: 'PROHIBITION', status: 'COMPATIBLE', rationale: 'Exception to a general permission.' },
    { normativeFunction: 'EXCEPTION_RULE', modality: 'CONSTITUTIVE_RULE', status: 'COMPATIBLE', rationale: 'Exclusion of legal effect.' },
    // Incompatible / suspicious combinations
    { normativeFunction: 'DEFINITION_RULE', modality: 'OBLIGATION', status: 'SUSPICIOUS', rationale: 'Definitions should not impose direct conduct obligations; check for compound rule.' },
    { normativeFunction: 'SANCTION_RULE', modality: 'PERMISSION', status: 'SUSPICIOUS', rationale: 'Sanctions are rarely mere permissions for private subjects; check for judicial discretion.' },
    { normativeFunction: 'COMPETENCE_RULE', modality: 'PROHIBITION', status: 'COMPATIBLE', rationale: 'Incompetence or negative jurisdiction.' },
    { normativeFunction: 'STATUS_RULE', modality: 'OBLIGATION', status: 'SUSPICIOUS', rationale: 'Status qualifies an entity; duty belongs to conduct.' }
  ]
};
fs.writeFileSync(path.join(G0_DIR, 'golden-compatibility-matrix.json'), JSON.stringify(compatibilityMatrixObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 5. GENERATE golden-schema.json (Section 25)
// -----------------------------------------------------------------------------
const goldenSchemaObj = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'H2GoldenPropositionDecompositionSchema',
  type: 'object',
  required: ['h2Id', 'goldenVersion', 'propositionsAsserted', 'claims'],
  properties: {
    h2Id: {
      type: 'string',
      pattern: '^H2-\\d{3}$',
      description: 'Benchmark holdout unit identifier'
    },
    goldenVersion: {
      type: 'integer',
      minimum: 1,
      description: 'Immutable version integer of the golden decomposition'
    },
    propositionsAsserted: {
      type: 'string',
      description: 'Verbatim text of the proposition asserting the legal truth conditions'
    },
    canonicalLocator: {
      type: 'string',
      description: 'Canonical locator of the primary supporting provision'
    },
    claims: {
      type: 'array',
      minItems: 1,
      description: 'List of atomic claims capturing the minimal complete set of independently evaluable truth conditions',
      items: {
        type: 'object',
        required: [
          'claimId',
          'claimText',
          'modality',
          'polarity',
          'normativeFunction',
          'qualifiers',
          'sourceTargets'
        ],
        properties: {
          claimId: {
            type: 'string',
            pattern: '^C\\d+$',
            description: 'Unique identifier of the claim within the unit'
          },
          claimText: {
            type: 'string',
            minLength: 5,
            description: 'Clear, declarative formulation of the single independent legal proposition'
          },
          modality: {
            type: 'string',
            enum: [
              'OBLIGATION',
              'PROHIBITION',
              'PERMISSION',
              'DISCRETION',
              'ENTITLEMENT',
              'CONSTITUTIVE_RULE',
              'DEFINITION',
              'LEGAL_CONSEQUENCE',
              'LEGAL_STATUS'
            ]
          },
          polarity: {
            type: 'string',
            enum: ['AFFIRMATIVE', 'NEGATIVE']
          },
          normativeFunction: {
            type: 'string',
            enum: [
              'CONDUCT_RULE',
              'COMPETENCE_RULE',
              'PROCEDURAL_RULE',
              'DEFINITION_RULE',
              'SANCTION_RULE',
              'LEGAL_EFFECT_RULE',
              'STATUS_RULE',
              'EXCEPTION_RULE'
            ]
          },
          subject: {
            type: 'string',
            description: 'Legal actor, authority, or entity bound or addressed'
          },
          actionOrPredicate: {
            type: 'string',
            description: 'Normative action, verb, or consequence'
          },
          objectOrScope: {
            type: 'string',
            description: 'Target, patient, or material object of the rule'
          },
          qualifiers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'text', 'bindsTo', 'materiality'],
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'CONDITION',
                    'EXCEPTION',
                    'TEMPORAL',
                    'QUANTITATIVE',
                    'ACTOR_SCOPE',
                    'OBJECT_SCOPE',
                    'PROCEDURAL_STAGE',
                    'JURISDICTIONAL_SCOPE',
                    'PURPOSE',
                    'CAUSAL',
                    'DEPENDENCY'
                  ]
                },
                text: {
                  type: 'string',
                  minLength: 1
                },
                bindsTo: {
                  type: 'string',
                  pattern: '^C\\d+$'
                },
                materiality: {
                  type: 'string',
                  enum: ['MATERIAL', 'NON_MATERIAL']
                }
              }
            }
          },
          sourceTargets: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['canonicalLocator', 'role'],
              properties: {
                canonicalLocator: {
                  type: 'string',
                  description: 'Narrowest sufficient normative textual unit locator'
                },
                role: {
                  type: 'string',
                  enum: ['PRIMARY_AUTHORITY', 'PARENT_CONTEXT', 'CONJUNCTIVE_AUTHORITY']
                }
              }
            }
          }
        }
      }
    }
  }
};
fs.writeFileSync(path.join(G0_DIR, 'golden-schema.json'), JSON.stringify(goldenSchemaObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 6. GENERATE golden-validator-spec.json (Section 26)
// -----------------------------------------------------------------------------
const validatorSpecObj = {
  protocol: 'ATHENA — V2.3.7-H2.4-G0',
  timestamp: new Date().toISOString(),
  rules: [
    {
      ruleId: 'VAL-01',
      name: 'DUPLICATE_CLAIM_IDS',
      severity: 'ERROR',
      blocking: true,
      description: 'All claimId values within a unit must be strictly unique.'
    },
    {
      ruleId: 'VAL-02',
      name: 'EMPTY_CLAIM_TEXT',
      severity: 'ERROR',
      blocking: true,
      description: 'claimText must not be empty or blank whitespace.'
    },
    {
      ruleId: 'VAL-03',
      name: 'INVALID_MODALITY',
      severity: 'ERROR',
      blocking: true,
      description: 'Modality must match one of the canonical values in golden-taxonomies.json.'
    },
    {
      ruleId: 'VAL-04',
      name: 'INVALID_NORMATIVE_FUNCTION',
      severity: 'ERROR',
      blocking: true,
      description: 'normativeFunction must match one of the canonical values in golden-taxonomies.json.'
    },
    {
      ruleId: 'VAL-05',
      name: 'ORPHAN_QUALIFIER',
      severity: 'ERROR',
      blocking: true,
      description: 'Every qualifier must bind via bindsTo to an existing claimId within the unit.'
    },
    {
      ruleId: 'VAL-06',
      name: 'EMPTY_SOURCE_TARGETS',
      severity: 'ERROR',
      blocking: true,
      description: 'Every claim must have at least one sourceTarget specified.'
    },
    {
      ruleId: 'VAL-07',
      name: 'DUPLICATE_SOURCE_TARGETS',
      severity: 'ERROR',
      blocking: true,
      description: 'A claim must not list duplicate identical sourceTarget canonicalLocators.'
    },
    {
      ruleId: 'VAL-08',
      name: 'SUSPICIOUS_FUNCTION_MODALITY_PAIR',
      severity: 'WARNING',
      blocking: false,
      description: 'Flags combinations marked SUSPICIOUS in the compatibility matrix for human review.'
    },
    {
      ruleId: 'VAL-09',
      name: 'OVER_BROAD_SOURCE_TARGET',
      severity: 'WARNING',
      blocking: false,
      description: 'Flags targeting an entire article when an explicit paragraph or inciso is indicated.'
    },
    {
      ruleId: 'VAL-10',
      name: 'UNBOUND_MATERIAL_EXCEPTION',
      severity: 'ERROR',
      blocking: true,
      description: 'If the proposition contains an explicit exception clause ("salvo", "exceto"), an EXCEPTION qualifier must be bound.'
    }
  ]
};
fs.writeFileSync(path.join(G0_DIR, 'golden-validator-spec.json'), JSON.stringify(validatorSpecObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 7. GENERATE golden-synthetic-contract-tests.json (Section 24)
// -----------------------------------------------------------------------------
const syntheticContractTestsObj = {
  protocol: 'ATHENA — V2.3.7-H2.4-G0',
  timestamp: new Date().toISOString(),
  description: 'Generic synthetic contract tests illustrating expected decomposition geometry across canonical legal constructs. None of these units belong to or resemble the H2 holdout.',
  tests: [
    {
      testId: 'SYN-01-SIMPLE-OBLIGATION',
      construct: 'Simple Obligation (MUST)',
      syntheticProposition: 'O escrivão deve lavrar a certidão no prazo de vinte e quatro horas.',
      expectedDecomposition: {
        claimsCount: 1,
        claims: [
          {
            claimId: 'C1',
            claimText: 'O escrivão deve lavrar a certidão no prazo de vinte e quatro horas.',
            modality: 'OBLIGATION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'PROCEDURAL_RULE',
            subject: 'escrivão',
            actionOrPredicate: 'lavrar a certidão',
            qualifiers: [
              { type: 'TEMPORAL', text: 'no prazo de vinte e quatro horas', bindsTo: 'C1', materiality: 'MATERIAL' }
            ],
            sourceTargets: [{ canonicalLocator: 'SYN_REG_ART_10', role: 'PRIMARY_AUTHORITY' }]
          }
        ]
      }
    },
    {
      testId: 'SYN-02-PROHIBITION',
      construct: 'Prohibition (MUST_NOT)',
      syntheticProposition: 'É vedado ao servidor público valer-se de sua função para obter proveito pessoal.',
      expectedDecomposition: {
        claimsCount: 1,
        claims: [
          {
            claimId: 'C1',
            claimText: 'O servidor público é proibido de valer-se de sua função para obter proveito pessoal.',
            modality: 'PROHIBITION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'CONDUCT_RULE',
            subject: 'servidor público',
            actionOrPredicate: 'valer-se de sua função',
            qualifiers: [
              { type: 'PURPOSE', text: 'para obter proveito pessoal', bindsTo: 'C1', materiality: 'MATERIAL' }
            ],
            sourceTargets: [{ canonicalLocator: 'SYN_EST_ART_117', role: 'PRIMARY_AUTHORITY' }]
          }
        ]
      }
    },
    {
      testId: 'SYN-03-DISCRETION',
      construct: 'Judicial / Administrative Discretion (MAY + Authority)',
      syntheticProposition: 'O juiz poderá relevar a pena quando as consequências da infração atingirem o próprio agente.',
      expectedDecomposition: {
        claimsCount: 1,
        claims: [
          {
            claimId: 'C1',
            claimText: 'O juiz tem a faculdade decisória de relevar a pena se as consequências da infração atingirem gravemente o próprio agente.',
            modality: 'DISCRETION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'SANCTION_RULE',
            subject: 'juiz',
            actionOrPredicate: 'relevar a pena',
            qualifiers: [
              { type: 'CONDITION', text: 'quando as consequências da infração atingirem o próprio agente', bindsTo: 'C1', materiality: 'MATERIAL' }
            ],
            sourceTargets: [{ canonicalLocator: 'SYN_COD_ART_50', role: 'PRIMARY_AUTHORITY' }]
          }
        ]
      }
    },
    {
      testId: 'SYN-04-EXCEPTION',
      construct: 'General Rule with Carve-out Exception (UNLESS / SALVO)',
      syntheticProposition: 'A perícia é indispensável nas infrações que deixam vestígios, salvo quando estes houverem desaparecido.',
      expectedDecomposition: {
        claimsCount: 1,
        claims: [
          {
            claimId: 'C1',
            claimText: 'A realização de exame pericial é indispensável para infrações que deixam vestígios, exceto se os vestígios tiverem desaparecido.',
            modality: 'OBLIGATION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'PROCEDURAL_RULE',
            subject: 'autoridade processual',
            actionOrPredicate: 'realizar perícia',
            qualifiers: [
              { type: 'OBJECT_SCOPE', text: 'nas infrações que deixam vestígios', bindsTo: 'C1', materiality: 'MATERIAL' },
              { type: 'EXCEPTION', text: 'salvo quando estes houverem desaparecido', bindsTo: 'C1', materiality: 'MATERIAL' }
            ],
            sourceTargets: [{ canonicalLocator: 'SYN_PRC_ART_158', role: 'PRIMARY_AUTHORITY' }]
          }
        ]
      }
    },
    {
      testId: 'SYN-05-TWO-INDEPENDENT-CLAIMS',
      construct: 'Compound Sentence with Two Independently Evaluable Claims',
      syntheticProposition: 'O recurso será interposto perante o tribunal competente e suspenderá a execução da decisão.',
      expectedDecomposition: {
        claimsCount: 2,
        claims: [
          {
            claimId: 'C1',
            claimText: 'O recurso deve ser interposto perante o tribunal competente.',
            modality: 'OBLIGATION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'PROCEDURAL_RULE',
            subject: 'recorrente',
            actionOrPredicate: 'interpor o recurso perante o tribunal competente',
            qualifiers: [],
            sourceTargets: [{ canonicalLocator: 'SYN_REC_ART_500', role: 'PRIMARY_AUTHORITY' }]
          },
          {
            claimId: 'C2',
            claimText: 'A interposição do recurso opera efeito suspensivo sobre a execução da decisão.',
            modality: 'LEGAL_CONSEQUENCE',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'LEGAL_EFFECT_RULE',
            subject: 'recurso interposto',
            actionOrPredicate: 'suspender a execução da decisão',
            qualifiers: [],
            sourceTargets: [{ canonicalLocator: 'SYN_REC_ART_501', role: 'PRIMARY_AUTHORITY' }]
          }
        ]
      }
    },
    {
      testId: 'SYN-06-PARENT-DEPENDENT-PARAGRAPH',
      construct: 'Subordinate Text Requiring Parent Text for Meaning',
      syntheticProposition: 'A concessão do benefício dependerá de prévia reparação do dano, salvo comprovada impossibilidade.',
      expectedDecomposition: {
        claimsCount: 1,
        claims: [
          {
            claimId: 'C1',
            claimText: 'O deferimento do benefício subordina-se à reparação prévia do dano, ressalvada a prova de impossibilidade.',
            modality: 'OBLIGATION',
            polarity: 'AFFIRMATIVE',
            normativeFunction: 'LEGAL_EFFECT_RULE',
            subject: 'beneficiário',
            actionOrPredicate: 'reparar previamente o dano',
            qualifiers: [
              { type: 'CONDITION', text: 'para concessão do benefício', bindsTo: 'C1', materiality: 'MATERIAL' },
              { type: 'EXCEPTION', text: 'salvo comprovada impossibilidade', bindsTo: 'C1', materiality: 'MATERIAL' }
            ],
            sourceTargets: [
              { canonicalLocator: 'SYN_BEN_ART_80_PAR_1', role: 'PRIMARY_AUTHORITY' },
              { canonicalLocator: 'SYN_BEN_ART_80', role: 'PARENT_CONTEXT' }
            ]
          }
        ]
      }
    }
  ]
};
fs.writeFileSync(path.join(G0_DIR, 'golden-synthetic-contract-tests.json'), JSON.stringify(syntheticContractTestsObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 8. GENERATE golden-human-review-protocol.md (Section 22 & 23)
// -----------------------------------------------------------------------------
const reviewProtocolMd = `# ATHENA — V2.3.7-H2.4-G0: PROTOCOLO DE REVISÃO HUMANA DE GABARITOS GOLDEN

**Protocolo:** \`ATHENA — V2.3.7-H2.4-G0\`  
**Modo:** \`OFFLINE / ZERO LLM / ZERO NETWORK / FAIL-CLOSED\`  
**Data:** ${new Date().toISOString()}  

---

## 1. Critérios de Auditoria e Perguntas Obrigatórias de Validação (A–I)

Para cada unidade candidata no futuro G1, o revisor humano deve submeter o gabarito a nove crivos substantivos:

1. **A. Origem da Proposição:** Cada atomic claim decomposto decorre diretamente daquilo que a proposição efetivamente assertou? (Zero adições de material estranho).
2. **B. Integralidade Material:** Todas as condições de verdade juridicamente materiais afirmadas na proposição estão representadas?
3. **C. Vinculação de Qualificadores:** As condições, prazos, âmbitos e exceções estão vinculados ao \`claimId\` correto via \`bindsTo\`?
4. **D. Precisão de Modalidade:** A modalidade foi devidamente categorizada (e.g., DEVER vs FACULDADE vs DIREITO SUBJETIVO)?
5. **E. Polaridade Exata:** A polaridade é correta (AFIRMATIVA vs NEGATIVA), respeitando a regra estrita de proibições afirmativas?
6. **F. Função Normativa:** A função da norma reflete sua natureza estrutural (CONDUTA, COMPETÊNCIA, PROCEDIMENTO, DEFINIÇÃO, SANÇÃO, EFEITO)?
7. **G. Alvo de Fonte Estrito:** O \`sourceTarget\` aponta para a unidade textual mais estrita e suficiente, evitando apontamento genérico do artigo quando o parágrafo basta?
8. **H. Exclusão de Detalhes da Fonte Não Assertados:** Foram rigorosamente excluídos do gabarito os detalhes da lei que a proposição não assertou?
9. **I. Minimalidade Completa:** A decomposição é mínima (sem fragmentação artificial) e completa (sem sub-decomposição que oculte condições)?

---

## 2. Estados de Decisão Permitidos

Cada unidade golden candidata receberá exatamente um dos seguintes estados:

- **\`APPROVED\`**: O gabarito atende perfeitamente a todos os 9 critérios.
- **\`REJECTED\`**: O gabarito possui defeito ontológico insanável de concepção.
- **\`NEEDS_CORRECTION\`**: O gabarito requer ajuste cirúrgico (e.g., recalibrar modalidade ou desvincular qualificador órfão).

> [!WARNING]
> Nenhuma aprovação tácita ou automática é permitida. Todas as aprovações exigem registro explícito \`USER_EXPLICIT_DECISION\`.

---

## 3. Linhagem Append-Only do Gabarito

Toda alteração de golden deve observar rastreabilidade imutável:
\`goldenCandidateVersion\` $\rightarrow$ \`humanReviewDecision\` $\rightarrow$ \`correctionEvents\` $\rightarrow$ \`finalGoldenVersion\` $\rightarrow$ \`SHA-256 Hash\`.
Nenhum evento histórico de revisão pode ser deletado.
`;
fs.writeFileSync(path.join(G0_DIR, 'golden-human-review-protocol.md'), reviewProtocolMd, 'utf8');

// -----------------------------------------------------------------------------
// 9. GENERATE golden-design-spec.md (Sections 3–20)
// -----------------------------------------------------------------------------
const designSpecMd = `# ATHENA — V2.3.7-H2.4-G0: ESPECIFICAÇÃO NORMATIVA DO DESIGN DE GABARITOS GOLDEN

**Protocolo:** \`ATHENA — V2.3.7-H2.4-G0\`  
**Modo:** \`OFFLINE / ZERO LLM / ZERO NETWORK / ZERO MODEL OUTPUT ACCESS / ZERO BENCHMARK EXECUTION / FAIL-CLOSED\`  
**Data:** ${new Date().toISOString()}  

---

## 1. Objetivo Fundamental do Gabarito Golden (Seção 3)

O gabarito golden de decomposição proposicional deve representar:
> **A DECOMPOSIÇÃO MÍNIMA E COMPLETA DAS CONDIÇÕES DE VERDADE JURIDICAMENTE MATERIAIS EFETIVAMENTE ASSERTADAS PELA PROPOSIÇÃO.**

O gabarito golden **NÃO** deve representar:
- O artigo de lei inteiro de onde a proposição foi extraída;
- O regime jurídico completo do instituto;
- Todas as implicações dogmáticas ou jurisprudenciais imagináveis;
- Fatos contextuais não veiculados pelo texto sob análise.

---

## 2. A Regra do Subconjunto Fundamental (Seção 4)

Uma proposição em linguagem natural pode assertar validamente apenas um **subconjunto** das prescrições contidas na sua fonte normativa.  
O gabarito golden **NUNCA** deve incluir conteúdo omitido da fonte pelo simples fato de a lei contê-lo.

Um elemento omitido da fonte torna-se material **APENAS SE**:
1. A proposição alegar exaustividade ou suficiência ("apenas", "exclusivamente");
2. A omissão alterar as condições de verdade daquilo que foi assertado;
3. A omissão ampliar ou restringir indevidamente o comando afirmativo;
4. A omissão subtrair condição, exceção, prazo ou consequência indispensável para preservar o sentido deôntico assertado.

---

## 3. Geometria das Alegações Atômicas (Atomic Claims) (Seção 5)

Um **Atomic Claim** deve expressar exatamente **uma proposição jurídica avaliável de modo independente**.

### Regras de Cisão (Split):
Deve-se cindir quando forem independentemente variáveis:
- Sujeito / Ator
- Ação / Conduta
- Objeto / Âmbito
- Condição independente
- Exceção autônoma
- Consequência jurídica distinta
- Qualificador temporal ou quantitativo independente
- Alternativas disjuntivas que formem normas autônomas

### Vedações de Cisão:
Não se deve cindir por motivos meramente:
- Pontuação gramatical estilística;
- Conjunções que integrem uma única condição factual composta;
- Orações adjetivas sem condições de verdade autônomas.

---

## 4. Taxonomias Normativas: Modalidade, Polaridade e Função (Seções 7, 8, 9)

### A. Modalidade (9 Valores Canônicos):
- \`OBLIGATION\` (MUST)
- \`PROHIBITION\` (MUST_NOT)
- \`PERMISSION\` (MAY)
- \`DISCRETION\` (MAY + Poder de Autoridade)
- \`ENTITLEMENT\` (Direito Subjetivo / Reivindicação)
- \`CONSTITUTIVE_RULE\` (Constituição de Efeito Legal)
- \`DEFINITION\` (Conceito Autêntico)
- \`LEGAL_CONSEQUENCE\` (Sanção / Consequência Processual)
- \`LEGAL_STATUS\` (Qualificação Jurídica de Sujeito ou Objeto)

### B. Polaridade:
- \`AFFIRMATIVE\` vs \`NEGATIVE\`.
- Proibições expressas em normas que proíbem condutas são classificadas como \`modality = PROHIBITION\` e \`polarity = AFFIRMATIVE\` (afirmação positiva da vigência de uma proibição).

### C. Função Normativa (8 Valores Canônicos):
- \`CONDUCT_RULE\` (Regra de Conduta)
- \`COMPETENCE_RULE\` (Regra de Competência)
- \`PROCEDURAL_RULE\` (Regra Procedimental)
- \`DEFINITION_RULE\` (Regra de Definição)
- \`SANCTION_RULE\` (Regra Sancionatória)
- \`LEGAL_EFFECT_RULE\` (Regra de Efeito Jurídico)
- \`STATUS_RULE\` (Regra de Estado/Qualificação)
- \`EXCEPTION_RULE\` (Regra Excepcional)

---

## 5. Vinculação Estrita de Alvo de Fonte (Source Target Hierarchy) (Seções 10, 11, 12)

1. **Alvo Mais Estrito:** Apontar sempre a menor fração normativa suficiente (e.g., \`CPP_ART_20_PAR_UNICO\` e não \`CPP_ART_20\`).
2. **Dependência Subordinada:** Parágrafos ou incisos dependentes do caput incluem o pai com o papel \`PARENT_CONTEXT\`.
3. **Multi-Target:** Admissível somente quando duas frações textuais concorrem para a mesmíssima condição de verdade (\`CONJUNCTIVE_AUTHORITY\`).

---

## 6. Critérios de Avaliação e Equivalência Semântica (Seções 14–19)

- **Contagem de Claims:** Não é critério absoluto. O benchmark avalia a preservação das condições de verdade, e não a mera contagem matemática (\`candidateClaims.length == goldenClaims.length\`).
- **Sobrecisão (Over-decomposition):** Fragmentação excessiva é tolerada se as condições de verdade e vínculos forem preservados.
- **Subcisão (Under-decomposition):** Fusão de condições independentes que oculte qualificadores essenciais é **fatal**.
- **Adições Não Suportadas:** A introdução de proposição jurídica alheia à assertiva invalida a resposta.
- **Dois Eixos de Pontuação:**
  1. \`CONTENT_DECOMPOSITION\` (Fidelidade semântica dos atomic claims e qualificadores).
  2. \`SOURCE_ATTRIBUTION\` (Exatidão do localizador textual normativo estrito).
`;
fs.writeFileSync(path.join(G0_DIR, 'golden-design-spec.md'), designSpecMd, 'utf8');

// -----------------------------------------------------------------------------
// 10. GENERATE golden-design-manifest.json & HASH ALL (Section 27)
// -----------------------------------------------------------------------------
const G0_FILES = [
  'golden-design-spec.md',
  'golden-schema.json',
  'golden-taxonomies.json',
  'golden-compatibility-matrix.json',
  'golden-validator-spec.json',
  'golden-human-review-protocol.md',
  'golden-synthetic-contract-tests.json'
];

const g0Hashes = {};
for (const f of G0_FILES) {
  g0Hashes[f] = sha256File(path.join(G0_DIR, f));
}

const manifestObj = {
  protocol: 'ATHENA — V2.3.7-H2.4-G0',
  timestamp: new Date().toISOString(),
  finalClassification: 'G0_GOLDEN_DESIGN_FROZEN_READY_FOR_G1',
  objective: 'MINIMUM_COMPLETE_LEGALLY_MATERIAL_DECOMPOSITION',
  fundamentalSubsetRule: 'PROPOSITION_ASSERTION_BOUNDED',
  governance: {
    goldenUnitsCreated: 0,
    llmCalls: 0,
    gptCalls: 0,
    geminiCalls: 0,
    claudeCalls: 0,
    networkCalls: 0,
    h2SemanticContentAccessed: false,
    modelOutputAccessed: false,
    modelFailureDataAccessed: false,
    h2Executed: false,
    benchmarkScored: false,
    productionCodeChanged: false,
    evaluatorChanged: false,
    finalSourceHoldoutMutated: false,
    deployExecuted: false,
    commitExecuted: false,
    pushExecuted: false
  },
  createdArtifactHashes: g0Hashes
};

fs.writeFileSync(path.join(G0_DIR, 'golden-design-manifest.json'), JSON.stringify(manifestObj, null, 2), 'utf8');
g0Hashes['golden-design-manifest.json'] = sha256File(path.join(G0_DIR, 'golden-design-manifest.json'));

// -----------------------------------------------------------------------------
// 11. VERIFY FINAL SOURCE HOLDOUT POST-EXECUTION (Section 29)
// -----------------------------------------------------------------------------
for (const [f, exp] of Object.entries(EXPECTED_FINAL_SOURCE)) {
  const p = path.join(FINAL_SOURCE_DIR, f);
  const act = sha256File(p);
  if (act !== exp) throw new Error(`ABORT: Final source holdout mutated post-G0: ${f}`);
}
console.log('Section 29 Verification: Final source holdout immutability post-G0 verified 100%.');

console.log('--------------------------------------------------');
console.log('G0 SPECIFICATION COMPLETE');
console.log('Classification: G0_GOLDEN_DESIGN_FROZEN_READY_FOR_G1');
console.log('Artifact Hashes:', JSON.stringify(g0Hashes, null, 2));
console.log('--------------------------------------------------');
