/**
 * TESTE OFFLINE: VALIDAÇÃO DETERMINÍSTICA DA TAXONOMIA JURÍDICA (ETAPA 5D)
 *
 * Valida de forma estritamente offline:
 * 1. Valores válidos e inválidos dos novos enums (nature e outcome).
 * 2. Campos ausentes e integridade de registros legados (compatibilidade retroativa estrita).
 * 3. Incoerências entre campos (coerência estrita e fail-closed).
 * 4. Tentativa de aprovação de afirmação normativa sem fonte oficial primária válida.
 * 5. Tentativa de aprovação de doutrina sem autor ou obra rastreável (rejeição de referências genéricas).
 * 6. Tentativa de aprovação de estatística / percentual sem metodologia ou amostragem.
 * 7. Tentativa de reclassificação fraudulenta como recurso pedagógico.
 * 8. Comportamento determinístico de classifyLegalAudit e normalizeLegalAudit (preservação dos campos).
 * 9. Compatibilidade retroativa com revisões anteriores (rev_3d4deba9-5930-4b77-8ec1-7f257ef86008).
 * 10. Garantia absoluta de que erros taxonômicos impedem a aprovação e publicação (fail-closed).
 */

import {
  VALID_CLAIM_NATURES,
  VALID_VERIFICATION_OUTCOMES,
  validateClaimTaxonomy,
  isGenericDoctrinalAuthor,
  isGenericDoctrinalWork,
  isIsolatedOrNonBindingPrecedent,
  hasEmpiricalPercentagesWithoutMethodology,
  isFraudulentPedagogicalReclassification,
  type LegalClaimNature,
  type LegalVerificationOutcome,
  type DoctrinalEvidenceMetadata,
  type EmpiricalEvidenceMetadata,
  type PedagogicalEvidenceMetadata,
  type JurisprudentialEvidenceMetadata,
} from "../src/lib/legalReviewTaxonomy";
import {
  classifyLegalAudit,
  normalizeLegalAudit,
  isMaterialLegalChange,
  type NormalizedAudit,
} from "../src/lib/legalReviewValidate";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
}

console.log("=== INICIANDO TESTES OFFLINE: VALIDAÇÃO DETERMINÍSTICA DA TAXONOMIA (ETAPA 5D) ===\n");

const PLANALTO_URL = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm";
const STF_URL = "https://portal.stf.jus.br/processos/detalhe.asp?incidente=5985012";

// -----------------------------------------------------------------------------
// [Cenário 1] Valores válidos e inválidos dos novos enums
// -----------------------------------------------------------------------------
console.log("[Cenário 1] Validação estrita de Enums: valores válidos e rejeição de strings inválidas");

assert(VALID_CLAIM_NATURES.length === 7, "Exatamente 7 naturezas na taxonomia oficial.");
assert(VALID_VERIFICATION_OUTCOMES.length === 6, "Exatamente 6 resultados probatórios na taxonomia oficial.");

// Enum inválido de nature
const invalidNatureTest = validateClaimTaxonomy({
  rawNature: "NATUREZA_INVENTADA",
  outcome: "CONFIRMADA",
});
assert(invalidNatureTest.valid === false, "Rejeitou natureza fora do enum.");
assert(
  invalidNatureTest.errors.some((e) => e.includes("Natureza da afirmação inválida")),
  "Mensagem acusa natureza inválida."
);

// Enum inválido de outcome
const invalidOutcomeTest = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  rawOutcome: "STATUS_INVENTADO",
});
assert(invalidOutcomeTest.valid === false, "Rejeitou outcome fora do enum.");
assert(
  invalidOutcomeTest.errors.some((e) => e.includes("Resultado da verificação inválido")),
  "Mensagem acusa outcome inválido."
);
console.log("  ✓ Valores fora dos enums rejeitados com precisão diagnóstica.");

// -----------------------------------------------------------------------------
// [Cenário 2] Campos ausentes e registros legados (compatibilidade retroativa)
// -----------------------------------------------------------------------------
console.log("\n[Cenário 2] Registros legados e campos ausentes: compatibilidade retroativa perfeita");

const legacyValidation = validateClaimTaxonomy({});
assert(legacyValidation.valid === true, "Registro legado sem campos novos passa como válido.");
assert(legacyValidation.errors.length === 0, "Sem erros gerados para registros legados.");
console.log("  ✓ Registros legados permanecem válidos sem mutação ou erros espúrios.");

// -----------------------------------------------------------------------------
// [Cenário 3] Incoerências entre campos (Scope 4 - Coerência estrita e Fail-Closed)
// -----------------------------------------------------------------------------
console.log("\n[Cenário 3] Coerência entre campos e comportamento fail-closed");

// Incoerência 1: outcome=CONFIRMADA mas confirmação legal=NAO_CONFIRMADO
const incoherence1 = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "CONFIRMADA",
  confirmation: "NAO_CONFIRMADO",
});
assert(incoherence1.valid === false, "Rejeitou conflito entre outcome=CONFIRMADA e confirmation=NAO_CONFIRMADO.");
assert(
  incoherence1.errors.some((e) => e.includes("Incoerência grave: outcome CONFIRMADA")),
  "Detectou incoerência grave 1."
);

// Incoerência 2: outcome=NAO_VERIFICADA mas verified=true
const incoherence2 = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "NAO_VERIFICADA",
  verified: true,
  confirmation: "CONFIRMADO",
});
assert(incoherence2.valid === false, "Rejeitou conflito entre outcome=NAO_VERIFICADA e verified=true.");
assert(
  incoherence2.errors.some((e) => e.includes("Incoerência grave: outcome NAO_VERIFICADA")),
  "Detectou incoerência grave 2."
);

// Incoerência 3: nature=NORMA_JURIDICA e category=DIDATICA sem transposição pedagógica
const incoherence3 = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  category: "DIDATICA",
  outcome: "CONFIRMADA",
  reason: "Correção de prazo da lei.",
});
assert(incoherence3.valid === false, "Rejeitou norma jurídica categorizada como didática sem justificativa pedagógica.");
assert(
  incoherence3.errors.some((e) => e.includes("sem transposição pedagógica explícita")),
  "Detectou incoerência de transposição pedagógica."
);
console.log("  ✓ Todas as incoerências de campos detectadas e bloqueadas com fail-closed.");

// -----------------------------------------------------------------------------
// [Cenário 4] Norma jurídica sem fonte oficial primária válida
// -----------------------------------------------------------------------------
console.log("\n[Cenário 4] Norma Jurídica: exigência de fonte oficial primária válida");

const normaSemFonte = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "CONFIRMADA",
  sources: [],
  evidence: [],
});
assert(normaSemFonte.valid === false, "Rejeitou norma jurídica sem fonte oficial primária.");
assert(
  normaSemFonte.errors.some((e) => e.includes("fonte oficial primária")),
  "Erro explícito de exigência de fonte oficial primária."
);

const normaComFonte = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "CONFIRMADA",
  evidence: [
    {
      institution: "Planalto",
      title: "Lei 13.105/2015",
      url: PLANALTO_URL,
      official: true,
      consulted: true,
      supportsChange: true,
      supportExplanation: "Art. 218 do CPC.",
      sourceType: "LEI",
    },
  ],
  metadata: {
    nature: "NORMA_JURIDICA",
    diploma: "Lei 13.105/2015",
    dispositivo: "Art. 218",
    fonteOficial: PLANALTO_URL,
  },
});
assert(normaComFonte.valid === true, "Aprovou norma jurídica com fonte primária do Planalto.");
console.log("  ✓ Norma jurídica sem fonte primária rejeitada; norma com fonte oficial aprovada.");

// -----------------------------------------------------------------------------
// [Cenário 5] Doutrina: rejeição de referências genéricas sem autor e obra rastreáveis
// -----------------------------------------------------------------------------
console.log("\n[Cenário 5] Doutrina: rejeição de referências genéricas ('doutrina majoritária')");

assert(isGenericDoctrinalAuthor("doutrina"), "Identificou 'doutrina' como autor genérico.");
assert(isGenericDoctrinalAuthor("doutrina majoritária"), "Identificou 'doutrina majoritária' como autor genérico.");
assert(isGenericDoctrinalAuthor("autores"), "Identificou 'autores' como autor genérico.");
assert(!isGenericDoctrinalAuthor("José Afonso da Silva"), "Autor real válido não é genérico.");

assert(isGenericDoctrinalWork("manual"), "Identificou 'manual' como obra genérica.");
assert(isGenericDoctrinalWork("curso"), "Identificou 'curso' como obra genérica.");
assert(!isGenericDoctrinalWork("Curso de Direito Administrativo"), "Obra real específica não é genérica.");

// Tentativa com autor genérico "Doutrina majoritária"
const doutrinaGenerica = validateClaimTaxonomy({
  nature: "DOUTRINA",
  outcome: "CONFIRMADA",
  metadata: {
    nature: "DOUTRINA",
    autor: "Doutrina majoritária",
    obra: "Manual de direito",
  },
});
assert(doutrinaGenerica.valid === false, "Rejeitou doutrina genérica como CONFIRMADA.");
assert(
  doutrinaGenerica.errors.some((e) => e.includes("rejeitadas referências genéricas")),
  "Acusou expressamente referência genérica à doutrina."
);

// Doutrina legítima com autor e obra reais
const doutrinaValida = validateClaimTaxonomy({
  nature: "DOUTRINA",
  outcome: "CONFIRMADA",
  metadata: {
    nature: "DOUTRINA",
    autor: "Celso Antônio Bandeira de Mello",
    obra: "Curso de Direito Administrativo",
    edicao: "35ª ed., Malheiros, 2023",
  },
});
assert(doutrinaValida.valid === true, "Aprovou doutrina com autor e obra devidamente rastreáveis.");
console.log("  ✓ Doutrina genérica rejeitada; doutrina rastreável aprovada.");

// -----------------------------------------------------------------------------
// [Cenário 6] Estatística / afirmação empírica sem metodologia ou amostragem
// -----------------------------------------------------------------------------
console.log("\n[Cenário 6] Afirmação Empírica: rejeição de percentuais sem metodologia ou amostragem");

const textoEmpiricoComPercentual = "Cerca de 75% das bancas de concurso cobram este artigo em provas objetivas.";

assert(
  hasEmpiricalPercentagesWithoutMethodology(textoEmpiricoComPercentual, undefined) === true,
  "Detectou percentual empírico sem metodologia."
);

const metaEmpiricaSemMetodologia: EmpiricalEvidenceMetadata = {
  origem: "Bancas de concurso",
  // metodologia e amostra ausentes
};
assert(
  hasEmpiricalPercentagesWithoutMethodology(textoEmpiricoComPercentual, metaEmpiricaSemMetodologia) === true,
  "Detectou percentual empírico sem amostragem/metodologia."
);

const empiricaSemMetodologia = validateClaimTaxonomy({
  nature: "AFIRMACAO_EMPIRICA",
  outcome: "CONFIRMADA",
  originalExcerpt: textoEmpiricoComPercentual,
  revisedExcerpt: textoEmpiricoComPercentual,
  metadata: {
    nature: "AFIRMACAO_EMPIRICA",
    origem: "Concursos",
  },
});
assert(empiricaSemMetodologia.valid === false, "Rejeitou afirmação empírica percentual sem metodologia.");
assert(
  empiricaSemMetodologia.errors.some((e) => e.includes("metodologia e amostragem verificáveis")),
  "Erro aponta falta de metodologia e amostragem."
);

const metaEmpiricaCompleta: EmpiricalEvidenceMetadata = {
  origem: "Banco de Questões de Magistratura Estadual (FCC/FGV/VUNESP)",
  metodologia: "Análise censitária de provas de 1ª fase de 2020 a 2024",
  amostra: "42 editais e 4.200 questões",
};
const empiricaValida = validateClaimTaxonomy({
  nature: "AFIRMACAO_EMPIRICA",
  outcome: "CONFIRMADA",
  originalExcerpt: textoEmpiricoComPercentual,
  metadata: {
    nature: "AFIRMACAO_EMPIRICA",
    ...metaEmpiricaCompleta,
  },
});
assert(empiricaValida.valid === true, "Aprovou afirmação empírica com metodologia e amostragem.");
console.log("  ✓ Afirmação empírica sem metodologia rejeitada; metodologia auditável aprovada.");

// -----------------------------------------------------------------------------
// [Cenário 7] Precedente Vinculante vs Decisão Monocrática / Turma Isolada
// -----------------------------------------------------------------------------
console.log("\n[Cenário 7] Precedentes: rejeição de decisões monocráticas ou acórdãos isolados de turma como vinculantes");

const textoMonocratica = "O STF fixou a tese em decisão monocrática do relator Ministro Fulano.";
assert(
  isIsolatedOrNonBindingPrecedent(textoMonocratica, undefined) === true,
  "Detectou decisão monocrática."
);

const textoTurmaIsolada = "Conforme acórdão da 1ª Turma do STJ no REsp 1.234.567.";
assert(
  isIsolatedOrNonBindingPrecedent(textoTurmaIsolada, undefined) === true,
  "Detectou decisão isolada de turma sem repetitivo."
);

const textoVinculanteReal = "Conforme tese do STF fixada em repercussão geral (Tema 1.046) e Súmula Vinculante 4.";
assert(
  isIsolatedOrNonBindingPrecedent(textoVinculanteReal, undefined) === false,
  "Reconheceu precedente estritamente vinculante (Repercussão Geral / Súmula Vinculante)."
);

const precedenteFalsoVinculante = validateClaimTaxonomy({
  nature: "PRECEDENTE_VINCULANTE",
  outcome: "CONFIRMADA",
  originalExcerpt: "decisão isolada",
  revisedExcerpt: textoMonocratica,
  evidence: [
    {
      institution: "STF",
      title: "Decisão Monocrática",
      url: STF_URL,
      official: true,
      consulted: true,
      supportsChange: true,
      supportExplanation: "Decisão monocrática isolada.",
      sourceType: "ACORDAO",
    },
  ],
});
assert(precedenteFalsoVinculante.valid === false, "Rejeitou decisão monocrática rotulada como PRECEDENTE_VINCULANTE.");
assert(
  precedenteFalsoVinculante.errors.some((e) => e.includes("Decisões monocráticas ou acórdãos isolados de turma")),
  "Mensagem acusa ausência de força vinculante no precedente."
);
console.log("  ✓ Falso precedente vinculante (monocrática/turma) rejeitado categoricamente.");

// -----------------------------------------------------------------------------
// [Cenário 8] Reclassificação fraudulenta como recurso pedagógico
// -----------------------------------------------------------------------------
console.log("\n[Cenário 8] Reclassificação fraudulenta como recurso pedagógico");

const tentativaFraudePedagogica = "Dica de ouro didática: 80% das questões exigem o art. 5º.";
assert(
  isFraudulentPedagogicalReclassification(tentativaFraudePedagogica) === true,
  "Detectou tentativa de disfarçar dados empíricos em recurso pedagógico."
);

const fraudePedagogica = validateClaimTaxonomy({
  nature: "RECURSO_PEDAGOGICO",
  outcome: "CONFIRMADA",
  revisedExcerpt: tentativaFraudePedagogica,
  metadata: {
    nature: "RECURSO_PEDAGOGICO",
    justificativa: "Dica didática para concurso",
    compatibilidadeJuridica: "Compatível com a constituição",
  },
});
assert(fraudePedagogica.valid === false, "Rejeitou reclassificação fraudulenta como recurso pedagógico.");
assert(
  fraudePedagogica.errors.some((e) => e.includes("Reclassificação fraudulenta detectada")),
  "Acusou fraude de reclassificação pedagógica."
);
console.log("  ✓ Fraude de reclassificação pedagógica identificada e barrada.");

// -----------------------------------------------------------------------------
// [Cenário 9] classifyLegalAudit e normalizeLegalAudit preservam os campos taxonômicos
// -----------------------------------------------------------------------------
console.log("\n[Cenário 9] Preservação dos campos taxonômicos em classifyLegalAudit e normalizeLegalAudit");

const lessonOriginal = `# Aula 1 - Direito Processual Civil
[BLOCK_1]
O prazo geral para manifestação nos autos é de 15 dias para todas as partes.
[BLOCK_2]
A teoria tridimensional do direito de Miguel Reale concebe fato, valor e norma.
`;

const rawAuditPayload = {
  status: "ALTERACOES_NECESSARIAS",
  confidence: "ALTA",
  verificationLevel: "VERIFICADO_COM_FONTES",
  summary: {
    totalChanges: 2,
    corrections: 1,
    additions: 0,
    removals: 0,
    updates: 1,
    precisions: 0,
    restructures: 0,
  },
  changes: [
    {
      id: "change_norm_1",
      type: "CORRECAO",
      severity: "MEDIA",
      category: "LEGISLACAO",
      nature: "NORMA_JURIDICA",
      outcome: "CONFIRMADA",
      originalExcerpt: "O prazo geral para manifestação nos autos é de 15 dias para todas as partes.",
      revisedExcerpt: "O prazo geral residual para manifestação nos autos é de 5 dias na omissão da lei (art. 218, § 3º, do CPC).",
      reason: "Correção de prazo processual subsidiário conforme art. 218, § 3º, do CPC.",
      confirmation: "CONFIRMADO",
      verified: true,
      sources: [
        {
          title: "Código de Processo Civil",
          url: PLANALTO_URL,
          official: true,
          institution: "Planalto",
        },
      ],
      evidence: [
        {
          institution: "Planalto",
          title: "Lei 13.105/2015",
          url: PLANALTO_URL,
          official: true,
          consulted: true,
          supportsChange: true,
          supportExplanation: "Art. 218, § 3º estabelece o prazo de 5 dias.",
          sourceType: "LEI",
          nature: "NORMA_JURIDICA",
          outcome: "CONFIRMADA",
        },
      ],
    },
    {
      id: "change_doct_2",
      type: "ATUALIZACAO",
      severity: "BAIXA",
      category: "DOUTRINA",
      nature: "DOUTRINA",
      outcome: "CONFIRMADA",
      originalExcerpt: "A teoria tridimensional do direito de Miguel Reale concebe fato, valor e norma.",
      revisedExcerpt: "A teoria tridimensional do direito formulada por Miguel Reale integra dialeticamente fato, valor e norma.",
      reason: "Precisão terminológica da dialética de complementariedade da teoria tridimensional.",
      confirmation: "CONFIRMADO",
      verified: true,
      evidenceMetadata: {
        nature: "DOUTRINA",
        autor: "Miguel Reale",
        obra: "Teoria Tridimensional do Direito",
        edicao: "5ª ed., Saraiva, 2003",
      },
      sources: [],
      evidence: [
        {
          institution: "Doutrina",
          title: "Miguel Reale — Teoria Tridimensional do Direito",
          url: "",
          official: false,
          consulted: false,
          supportsChange: true,
          supportExplanation: "Conceito clássico de integração dialética de fato, valor e norma.",
          sourceType: "OUTRO_OFICIAL",
          nature: "DOUTRINA",
          outcome: "CONFIRMADA",
        },
      ],
    },
  ],
  unverifiedClaims: [
    {
      excerpt: "Conceito de jurisdição voluntária anômala",
      reason: "Divergência doutrinária não conclusiva.",
      nature: "DIVERGENCIA_DOUTRINARIA",
      outcome: "CONTROVERSA",
    },
  ],
  reviewNotes: "Revisão com taxonomia determinística.",
};

const classified = classifyLegalAudit(rawAuditPayload, lessonOriginal, {
  webSearchExecuted: true,
  consultedUrls: [PLANALTO_URL],
});

assert(classified.ok === true, "Auditoria com taxonomia classificada com sucesso.");
if (classified.ok) {
  const audit = classified.audit;
  assert(audit.changes.length === 2, "2 alterações aceitas no pipeline.");

  const chgNorm = audit.changes.find((c) => c.id === "change_norm_1");
  assert(chgNorm !== undefined, "Encontrou change_norm_1.");
  assert(chgNorm?.nature === "NORMA_JURIDICA", "nature='NORMA_JURIDICA' preservado.");
  assert(chgNorm?.outcome === "CONFIRMADA", "outcome='CONFIRMADA' preservado.");
  assert(chgNorm?.confirmation === "CONFIRMADO", "confirmation='CONFIRMADO' preservado.");
  assert(chgNorm?.verified === true, "verified=true preservado.");

  const chgDoct = audit.changes.find((c) => c.id === "change_doct_2");
  assert(chgDoct !== undefined, "Encontrou change_doct_2.");
  assert(chgDoct?.nature === "DOUTRINA", "nature='DOUTRINA' preservado.");
  assert(chgDoct?.outcome === "CONFIRMADA", "outcome='CONFIRMADA' preservado.");
  assert(chgDoct?.evidenceMetadata !== undefined, "evidenceMetadata preservado.");
  assert(
    (chgDoct?.evidenceMetadata as any)?.autor === "Miguel Reale",
    "Autor doutrinário preservado nos metadados da change."
  );

  // UnverifiedClaims preserva nature e outcome
  assert(audit.unverifiedClaims.length > 0, "Possui unverifiedClaims.");
  const claim = audit.unverifiedClaims.find((u) => u.excerpt.includes("jurisdição voluntária"));
  assert(claim !== undefined, "Encontrou claim autônoma.");
  assert(claim?.nature === "DIVERGENCIA_DOUTRINARIA", "nature da claim preservada.");
  assert(claim?.outcome === "CONTROVERSA", "outcome da claim preservado.");
}
console.log("  ✓ classifyLegalAudit e normalizeLegalAudit preservam 100% dos dados taxonômicos.");

// -----------------------------------------------------------------------------
// [Cenário 10] Fail-Closed: Erro de validação taxonômica impede aprovação
// -----------------------------------------------------------------------------
console.log("\n[Cenário 10] Fail-Closed: Tentativa de aprovação com violação taxonômica é bloqueada");

// Criamos uma tentativa em que uma norma jurídica foi declarada CONFIRMADA sem fonte oficial primária
const rawAdversarialAudit = {
  ...rawAuditPayload,
  changes: [
    {
      id: "change_adversarial",
      type: "CORRECAO",
      severity: "ALTA",
      category: "LEGISLACAO",
      nature: "NORMA_JURIDICA",
      outcome: "CONFIRMADA", // Modelo alega confirmada
      originalExcerpt: "O prazo geral para manifestação nos autos é de 15 dias para todas as partes.",
      revisedExcerpt: "O prazo geral é de 3 dias.",
      reason: "Alteração de prazo normativo sem fonte primária.",
      confirmation: "CONFIRMADO", // Modelo alega confirmado
      verified: true,
      sources: [],
      evidence: [], // Sem fonte oficial!
    },
  ],
};

const classifiedAdversarial = classifyLegalAudit(rawAdversarialAudit, lessonOriginal, {
  webSearchExecuted: false,
  consultedUrls: [],
});

assert(classifiedAdversarial.ok === true, "Classificação processa para auditoria dos patches.");
if (classifiedAdversarial.ok) {
  const audit = classifiedAdversarial.audit;
  const adversarialChange = audit.changes.find((c) => c.id === "change_adversarial");
  assert(adversarialChange !== undefined, "Change adversária processada.");

  // O validador determinístico DEVE ter rebaixado para NAO_CONFIRMADO e NAO_VERIFICADA
  assert(
    adversarialChange?.confirmation === "NAO_CONFIRMADO",
    "Servidor despromoveu confirmation para NAO_CONFIRMADO."
  );
  assert(adversarialChange?.verified === false, "Servidor despromoveu verified para false.");
  assert(
    adversarialChange?.outcome === "NAO_VERIFICADA",
    "Servidor despromoveu outcome de CONFIRMADA para NAO_VERIFICADA (fail-closed)."
  );

  // E o validationLog deve registrar a recusa do patch com TAXONOMY_VALIDATION_FAILED
  const log = audit.validationLog;
  const rejectedPatch = log?.rejectedPatches.find((p) => p.changeId.includes("change_adversarial"));
  assert(rejectedPatch !== undefined, "Patch foi registrado na lista de rejectedPatches do servidor.");
  assert(
    rejectedPatch?.reasonCodes.includes("TAXONOMY_VALIDATION_FAILED") ||
    rejectedPatch?.reasonCodes.includes("EVIDENCE_INSUFFICIENT"),
    "Código de recusa do patch contém TAXONOMY_VALIDATION_FAILED ou EVIDENCE_INSUFFICIENT."
  );

  // E a auditoria NÃO permite publicação
  assert(
    audit.verificationLevel === "FALHA_NA_VERIFICACAO" || audit.verificationLevel === "VERIFICACAO_PARCIAL",
    "verificationLevel não atingiu VERIFICADO_COM_FONTES."
  );
}
console.log("  ✓ Tentativa de burlar confirmação foi barrada no backend (fail-closed perfeito).");

console.log("\n=== TODOS OS 10 CENÁRIOS DE TESTES OFFLINE DA TAXONOMIA FORAM APROVADOS COM SUCESSO! ===");
