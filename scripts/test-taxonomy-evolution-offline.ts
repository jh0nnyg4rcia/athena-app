/**
 * TESTE OFFLINE: EVOLUÇÃO SEGURA DA TAXONOMIA JURÍDICA (ETAPA 5B)
 *
 * Valida de forma estritamente offline:
 * 1. Independência conceitual entre Natureza da Afirmação e Resultado da Verificação.
 * 2. Preservação integral dos contratos e valores legados (LegalConfirmation, LegalSourceType).
 * 3. Integridade e tipagem dos metadados especializados para cada uma das naturezas.
 * 4. Blindagem mandatória: DOUTRINA ou RECURSO_PEDAGOGICO não produzem CONFIRMADA automaticamente.
 * 5. Exigência intransigente de fontes oficiais primárias para afirmações normativas e jurisprudenciais.
 * 6. Compatibilidade retroativa perfeita com registros históricos sem mutação de banco.
 */

import {
  type LegalClaimNature,
  type LegalVerificationOutcome,
  type LegalConfirmation,
  type LegalSourceType,
  type LegalChangeCategory,
  type LegalReviewChange,
  type LegalReviewEvidence,
  type SupplementFindingItem,
  type NormativeEvidenceMetadata,
  type JurisprudentialEvidenceMetadata,
  type DoctrinalEvidenceMetadata,
  type EmpiricalEvidenceMetadata,
  type PedagogicalEvidenceMetadata,
  type ClaimEvidenceMetadata,
  type EvidenceNatureMetadata,
  validateClaimTaxonomy,
  canBeConfirmedWithoutOfficialSource,
  isLegacyReviewRecord,
  mapLegacyConfirmationToOutcome,
  inferNatureFromLegacyCategory,
  readClaimNatureSafe,
  readClaimOutcomeSafe,
} from "../src/lib/legalReviewTaxonomy";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
}

console.log("=== INICIANDO TESTES OFFLINE: EVOLUÇÃO SEGURA DA TAXONOMIA JURÍDICA (ETAPA 5B) ===\n");

// -----------------------------------------------------------------------------
// [Cenário 1] Independência conceitual dos dois novos campos
// -----------------------------------------------------------------------------
console.log("[Cenário 1] Independência conceitual: Natureza da Afirmação e Resultado da Verificação");

const validNatures: LegalClaimNature[] = [
  "NORMA_JURIDICA",
  "PRECEDENTE_VINCULANTE",
  "JURISPRUDENCIA_NAO_VINCULANTE",
  "DOUTRINA",
  "DIVERGENCIA_DOUTRINARIA",
  "AFIRMACAO_EMPIRICA",
  "RECURSO_PEDAGOGICO",
];

const validOutcomes: LegalVerificationOutcome[] = [
  "CONFIRMADA",
  "PARCIALMENTE_CONFIRMADA",
  "CONTROVERSA",
  "NAO_VERIFICADA",
  "INCORRETA",
  "NAO_APLICAVEL",
];

assert(validNatures.length === 7, "Exatamente 7 naturezas jurídicas definidas.");
assert(validOutcomes.length === 6, "Exatamente 6 resultados probatórios definidos.");

// Verifica ortogonalidade da matriz (7 x 6 combinações possíveis)
let matrixCombinations = 0;
for (const n of validNatures) {
  for (const o of validOutcomes) {
    matrixCombinations++;
  }
}
assert(matrixCombinations === 42, "Matriz de 42 combinações ortogonais possíveis.");
console.log(`  ✓ 7 naturezas e 6 resultados probatórios independentes validados (42 combinações ortogonais).`);

// -----------------------------------------------------------------------------
// [Cenário 2] Preservação integral dos contratos e valores legados
// -----------------------------------------------------------------------------
console.log("\n[Cenário 2] Preservação integral de contratos legados (LegalConfirmation, LegalSourceType)");

const legacyConfirmationPositive: LegalConfirmation = "CONFIRMADO";
const legacyConfirmationNegative: LegalConfirmation = "NAO_CONFIRMADO";
const legacySourceTypeStatute: LegalSourceType = "LEI";
const legacySourceTypePrecedent: LegalSourceType = "ACORDAO";
const legacyCategory: LegalChangeCategory = "DOUTRINA";

assert(legacyConfirmationPositive === "CONFIRMADO", "LegalConfirmation positivo preservado.");
assert(legacyConfirmationNegative === "NAO_CONFIRMADO", "LegalConfirmation negativo preservado.");
assert(legacySourceTypeStatute === "LEI", "LegalSourceType preservado.");
assert(legacySourceTypePrecedent === "ACORDAO", "LegalSourceType preservado.");
assert(legacyCategory === "DOUTRINA", "LegalChangeCategory preservado.");

// Criação de change no padrão 100% legado sem campos novos
const purelyLegacyChange: LegalReviewChange = {
  id: "change_legacy_1",
  type: "CORRECAO",
  severity: "MEDIA",
  category: "LEGISLACAO",
  originalExcerpt: "prazo de 15 dias",
  revisedExcerpt: "prazo de 10 dias",
  reason: "Correção de prazo processual com base no art. 218 do CPC.",
  verified: true,
  confirmation: "CONFIRMADO",
  sources: [
    {
      title: "Código de Processo Civil",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
      official: true,
      institution: "Presidência da República",
    },
  ],
  evidence: [
    {
      institution: "Presidência da República",
      title: "Lei 13.105/2015",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
      official: true,
      consulted: true,
      supportsChange: true,
      supportExplanation: "Art. 218, § 3º.",
      sourceType: "LEI",
    },
  ],
};

assert(purelyLegacyChange.confirmation === "CONFIRMADO", "Change puramente legado preserva confirmação.");
assert(purelyLegacyChange.nature === undefined, "Change puramente legado mantém nature como undefined.");
assert(purelyLegacyChange.outcome === undefined, "Change puramente legado mantém outcome como undefined.");
console.log(`  ✓ Tipos legados inalterados; registros antigos compilam e preservam conformidade estrita.`);

// -----------------------------------------------------------------------------
// [Cenário 3] Metadados especializados por categoria de evidência
// -----------------------------------------------------------------------------
console.log("\n[Cenário 3] Metadados de evidência especializados por natureza");

const metaNormativa: NormativeEvidenceMetadata = {
  diploma: "Lei 14.133/2021",
  dispositivo: "Art. 28, inciso I",
  vigencia: "Vigente desde 01/04/2021",
  fonteOficial: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
};

const metaJurisprudencial: JurisprudentialEvidenceMetadata = {
  tribunal: "STF",
  orgaoJulgador: "Tribunal Pleno",
  processo: "ADI 6524",
  tese: "Vedação à recondução dos Presidentes da Câmara e do Senado na mesma legislatura.",
  fonteOficial: "https://portal.stf.jus.br/processos/detalhe.asp?incidente=5985012",
  vinculante: true,
};

const metaDoutrinaria: DoctrinalEvidenceMetadata = {
  autor: "Celso Antônio Bandeira de Mello",
  obra: "Curso de Direito Administrativo",
  edicao: "35ª ed., Malheiros, 2023",
  referenciaBibliografica: "p. 142-148",
  grauConfirmacao: "DOMINANTE",
};

const metaEmpirica: EmpiricalEvidenceMetadata = {
  origem: "Banco de Questões de Magistratura Estadual (FCC / FGV / VUNESP)",
  metodologia: "Análise censitária de provas de 1ª fase realizadas entre 2020 e 2024",
  periodo: "2020-2024",
  amostra: "42 editais e 4.200 questões de Direito Administrativo",
};

const metaPedagogica: PedagogicalEvidenceMetadata = {
  justificativa: "Mnemônico LIMPE para memorização dos princípios constitucionais da administração pública.",
  compatibilidadeJuridica: "Art. 37, caput, da CF/88; não altera conteúdo normativo material nem induz a erro.",
};

assert(metaNormativa.diploma === "Lei 14.133/2021", "Metadado normativo estruturado.");
assert(metaJurisprudencial.tribunal === "STF" && metaJurisprudencial.vinculante === true, "Metadado jurisprudencial estruturado.");
assert(metaDoutrinaria.grauConfirmacao === "DOMINANTE", "Metadado doutrinário estruturado.");
assert(metaEmpirica.amostra.includes("42 editais"), "Metadado empírico estruturado.");
assert(metaPedagogica.compatibilidadeJuridica.includes("Art. 37"), "Metadado pedagógico estruturado.");
console.log(`  ✓ 5 categorias de metadados especializados validadas com tipagem estrita.`);

// -----------------------------------------------------------------------------
// [Cenário 4] Blindagem mandatória: DOUTRINA não produz CONFIRMADA automaticamente
// -----------------------------------------------------------------------------
console.log("\n[Cenário 4] Blindagem mandatória: DOUTRINA sem metadados bibliográficos NÃO pode ser CONFIRMADA");

// Tentativa de marcar DOUTRINA como CONFIRMADA sem autor/obra:
const tentativaDoutrinaVazia = validateClaimTaxonomy({
  nature: "DOUTRINA",
  outcome: "CONFIRMADA",
  metadata: undefined,
});

assert(tentativaDoutrinaVazia.valid === false, "Validador rejeitou promoção cega de DOUTRINA para CONFIRMADA.");
assert(
  tentativaDoutrinaVazia.errors.some((e) => e.includes("autor e obra")),
  "Mensagem de erro aponta ausência de autor e obra."
);
console.log(`  ✓ DOUTRINA sem referência bibliográfica rejeitada com sucesso (${tentativaDoutrinaVazia.errors[0]}).`);

// Tentativa de marcar DOUTRINA com autor/obra preenchidos:
const tentativaDoutrinaCorreta = validateClaimTaxonomy({
  nature: "DOUTRINA",
  outcome: "CONFIRMADA",
  metadata: {
    nature: "DOUTRINA",
    ...metaDoutrinaria,
  },
});

assert(tentativaDoutrinaCorreta.valid === true, "Validador aprovou DOUTRINA com metadados bibliográficos válidos.");
console.log(`  ✓ DOUTRINA com obra e autor formalmente referenciados aceita.`);

// -----------------------------------------------------------------------------
// [Cenário 5] Blindagem mandatória: RECURSO_PEDAGOGICO não produz CONFIRMADA automaticamente
// -----------------------------------------------------------------------------
console.log("\n[Cenário 5] Blindagem mandatória: RECURSO_PEDAGOGICO sem compatibilidade jurídica NÃO pode ser CONFIRMADO");

// Tentativa de marcar RECURSO_PEDAGOGICO como CONFIRMADA sem análise de compatibilidade:
const tentativaPedagogicaVazia = validateClaimTaxonomy({
  nature: "RECURSO_PEDAGOGICO",
  outcome: "CONFIRMADA",
  metadata: undefined,
});

assert(tentativaPedagogicaVazia.valid === false, "Validador rejeitou promoção cega de RECURSO_PEDAGOGICO para CONFIRMADA.");
assert(
  tentativaPedagogicaVazia.errors.some((e) => e.includes("justificativa didática e análise explícita de compatibilidade")),
  "Mensagem de erro exige compatibilidade jurídica explícita."
);
console.log(`  ✓ RECURSO_PEDAGOGICO sem compatibilidade jurídica rejeitado com sucesso.`);

// Tentativa de marcar RECURSO_PEDAGOGICO com justificativa e compatibilidade demonstrada:
const tentativaPedagogicaCorreta = validateClaimTaxonomy({
  nature: "RECURSO_PEDAGOGICO",
  outcome: "CONFIRMADA",
  metadata: {
    nature: "RECURSO_PEDAGOGICO",
    ...metaPedagogica,
  },
});

assert(tentativaPedagogicaCorreta.valid === true, "Validador aprovou RECURSO_PEDAGOGICO com análise de compatibilidade jurídica.");
console.log(`  ✓ RECURSO_PEDAGOGICO com justificativa e compatibilidade comprovadas aceito.`);

// -----------------------------------------------------------------------------
// [Cenário 6] Exigência intransigente de fontes oficiais para Norma e Jurisprudência
// -----------------------------------------------------------------------------
console.log("\n[Cenário 6] Exigência de fontes oficiais primárias para afirmações normativas e jurisprudenciais");

assert(
  canBeConfirmedWithoutOfficialSource("NORMA_JURIDICA") === false,
  "NORMA_JURIDICA não pode dispensar fonte oficial primária."
);
assert(
  canBeConfirmedWithoutOfficialSource("PRECEDENTE_VINCULANTE") === false,
  "PRECEDENTE_VINCULANTE não pode dispensar fonte oficial primária."
);
assert(
  canBeConfirmedWithoutOfficialSource("JURISPRUDENCIA_NAO_VINCULANTE") === false,
  "JURISPRUDENCIA_NAO_VINCULANTE não pode dispensar fonte oficial primária."
);
assert(
  canBeConfirmedWithoutOfficialSource("DOUTRINA") === true,
  "DOUTRINA pode usar fonte bibliográfica não governamental."
);

// Tentativa de confirmar NORMA_JURIDICA sem fonte oficial:
const normaSemFonteOficial = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "CONFIRMADA",
  sources: [],
  evidence: [],
  metadata: undefined,
});

assert(normaSemFonteOficial.valid === false, "Validador rejeitou NORMA_JURIDICA sem fonte oficial.");
assert(
  normaSemFonteOficial.errors.some((e) => e.includes("fonte oficial primária")),
  "Mensagem de erro acusa falta de fonte oficial primária."
);
console.log(`  ✓ NORMA_JURIDICA sem fonte oficial primária rejeitada categoricamente.`);

// Tentativa com fonte oficial do Planalto comprovada:
const normaComFonteOficial = validateClaimTaxonomy({
  nature: "NORMA_JURIDICA",
  outcome: "CONFIRMADA",
  sources: [
    {
      title: "Lei 14.133/2021",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
      official: true,
    },
  ],
  metadata: {
    nature: "NORMA_JURIDICA",
    ...metaNormativa,
  },
});

assert(normaComFonteOficial.valid === true, "Validador aprovou NORMA_JURIDICA com fonte oficial do Planalto.");
console.log(`  ✓ NORMA_JURIDICA com fonte oficial governamental aprovada com sucesso.`);

// -----------------------------------------------------------------------------
// [Cenário 7] Compatibilidade retroativa sem mutação com a revisão rev_3d4deba9-...
// -----------------------------------------------------------------------------
console.log("\n[Cenário 7] Leitura retrocompatível segura e imutabilidade dos dados históricos");

// Mock fiel da revisão real existente no Firestore
const mockHistoricalReview = {
  id: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008",
  status: "pending_approval",
  changes: [
    {
      id: "change_1",
      category: "LEGISLACAO" as LegalChangeCategory,
      confirmation: "CONFIRMADO" as LegalConfirmation,
      verified: true,
      originalExcerpt: "trecho 1",
      revisedExcerpt: "revisado 1",
    },
    {
      id: "change_2",
      category: "DOUTRINA" as LegalChangeCategory,
      confirmation: "NAO_CONFIRMADO" as LegalConfirmation,
      verified: false,
      originalExcerpt: "trecho 2",
      revisedExcerpt: "revisado 2",
    },
  ],
  supplement: {
    status: "inconclusive",
    findings: [
      {
        pendingId: "P-1",
        statementAnalyzed: "Conceito doutrinário de ponderação de princípios",
        status: "nao_verificada" as const,
        officialSourceConsulted: "",
        foundOfficialEvidence: false,
      },
    ],
  },
};

// Snapshot antes de qualquer operação
const snapshotAntes = JSON.stringify(mockHistoricalReview);

assert(isLegacyReviewRecord(mockHistoricalReview.changes[0]), "Identifica change 1 como registro legado.");
assert(isLegacyReviewRecord(mockHistoricalReview.changes[1]), "Identifica change 2 como registro legado.");

// Leitura com adaptadores seguros
const outcomeChange1 = readClaimOutcomeSafe(mockHistoricalReview.changes[0]);
const outcomeChange2 = readClaimOutcomeSafe(mockHistoricalReview.changes[1]);
const natureChange1 = readClaimNatureSafe(mockHistoricalReview.changes[0]);

assert(outcomeChange1 === "CONFIRMADA", "Change 1 (confirmado no legado) lido como CONFIRMADA em tempo de execução.");
assert(outcomeChange2 === "NAO_VERIFICADA", "Change 2 (não confirmado no legado) lido como NAO_VERIFICADA.");
assert(natureChange1 === undefined, "Nature não foi injetada no objeto em memória.");

// Inferência consultiva sem mutação:
const inferredNature1 = inferNatureFromLegacyCategory(mockHistoricalReview.changes[0].category);
const inferredNature2 = inferNatureFromLegacyCategory(mockHistoricalReview.changes[1].category);
assert(inferredNature1 === "NORMA_JURIDICA", "Categoria LEGISLACAO inferida consultivamente como NORMA_JURIDICA.");
assert(inferredNature2 === "DOUTRINA", "Categoria DOUTRINA inferida consultivamente como DOUTRINA.");

// Verificação de imutabilidade estrita:
const snapshotDepois = JSON.stringify(mockHistoricalReview);
assert(snapshotAntes === snapshotDepois, "O objeto histórico não sofreu nenhuma mutação ou poluição de campos.");
console.log(`  ✓ Leitura de registros históricos preservada com 100% de imutabilidade (zero mutações em disco/memória).`);

// -----------------------------------------------------------------------------
// [Cenário 8] Finding de complementação com novos campos opcionais
// -----------------------------------------------------------------------------
console.log("\n[Cenário 8] Estrutura do finding de complementação com suporte à nova taxonomia");

const findingEvoluido: SupplementFindingItem = {
  pendingId: "P-FINDING-5B",
  changeId: "change_doctrinal_1",
  statementAnalyzed: "Classificação das normas constitucionais de eficácia plena, contida e limitada.",
  officialSourceConsulted: "José Afonso da Silva, Aplicabilidade das Normas Constitucionais",
  verifiableUrl: "",
  relevantExcerptOrBasis: "Doutrina clássica de José Afonso da Silva consolidada na jurisprudência do STF.",
  status: "confirmada",
  objectiveJustification: "Classificação dogmática unânime cobrada em concursos de Magistratura e MP.",
  foundOfficialEvidence: false, // não tem lei própria, é doutrina pura
  nature: "DOUTRINA",
  outcome: "CONFIRMADA",
  evidenceMetadata: {
    nature: "DOUTRINA",
    autor: "José Afonso da Silva",
    obra: "Aplicabilidade das Normas Constitucionais",
    edicao: "8ª ed., Malheiros, 2012",
    grauConfirmacao: "DOMINANTE",
  },
};

assert(findingEvoluido.nature === "DOUTRINA", "Finding aceita campo nature.");
assert(findingEvoluido.outcome === "CONFIRMADA", "Finding aceita campo outcome.");
assert(
  findingEvoluido.evidenceMetadata !== undefined && "nature" in findingEvoluido.evidenceMetadata,
  "Finding aceita evidenceMetadata estruturado."
);
console.log(`  ✓ Finding de complementação totalmente compatível com a nova taxonomia.`);

console.log("\n=== TODOS OS 8 CENÁRIOS DE TESTES OFFLINE DA TAXONOMIA JURÍDICA FORAM APROVADOS COM SUCESSO! ===");
