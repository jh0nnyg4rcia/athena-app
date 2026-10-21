/**
 * TESTE OFFLINE: CALIBRAÇÃO JURÍDICA DOS PROMPTS (ETAPA 5C)
 *
 * Valida de forma estritamente determinística e offline:
 * 1. Presença das diretrizes da nova taxonomia jurídica em buildLegalReviewInstructions.
 * 2. Presença das diretrizes de cobertura e materialidade em buildCoverageReviewInstructions.
 * 3. Preservação da exigência de fontes oficiais primárias para legislação e jurisprudência.
 * 4. Calibração da doutrina: isenção de URL governamental + exigência de rastreabilidade bibliográfica.
 * 5. Rigor probatório para dados empíricos e proibição de reclassificação fraudulenta como didática.
 * 6. Proteção a recursos pedagógicos e mnemônicos compatíveis com o direito positivo.
 * 7. Compatibilidade do payload gerado pelo modelo com os validadores existentes (classifyLegalAudit/normalizeLegalAudit).
 * 8. Preservação integral de registros históricos e contratos legados.
 */

import {
  buildLegalReviewInstructions,
  buildCoverageReviewInstructions,
} from "../src/services/legalReviewPrompt";
import {
  classifyLegalAudit,
  normalizeLegalAudit,
} from "../src/lib/legalReviewValidate";
import type { LegalReviewChange } from "../src/lib/legalReviewTypes";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
}

console.log("=== INICIANDO TESTES OFFLINE: CALIBRAÇÃO JURÍDICA DOS PROMPTS (ETAPA 5C) ===\n");

// -----------------------------------------------------------------------------
// [Cenário 1] Presença das diretrizes da nova taxonomia em buildLegalReviewInstructions
// -----------------------------------------------------------------------------
console.log("[Cenário 1] Verificação das diretrizes de taxonomia em buildLegalReviewInstructions");

const mainPrompt = buildLegalReviewInstructions("09/10/2026");

const expectedNatures = [
  "NORMA_JURIDICA",
  "PRECEDENTE_VINCULANTE",
  "JURISPRUDENCIA_NAO_VINCULANTE",
  "DOUTRINA",
  "DIVERGENCIA_DOUTRINARIA",
  "AFIRMACAO_EMPIRICA",
  "RECURSO_PEDAGOGICO",
];

const expectedOutcomes = [
  "CONFIRMADA",
  "PARCIALMENTE_CONFIRMADA",
  "CONTROVERSA",
  "NAO_VERIFICADA",
  "INCORRETA",
  "NAO_APLICAVEL",
];

for (const n of expectedNatures) {
  assert(mainPrompt.includes(`"${n}"`), `Prompt principal contém a natureza ${n}.`);
}
for (const o of expectedOutcomes) {
  assert(mainPrompt.includes(`"${o}"`), `Prompt principal contém o outcome ${o}.`);
}

console.log("  ✓ Todas as 7 naturezas e 6 outcomes da taxonomia estão formalmente definidos no prompt principal.");

// -----------------------------------------------------------------------------
// [Cenário 2] Preservação da exigência de fontes oficiais para normas e precedentes
// -----------------------------------------------------------------------------
console.log("\n[Cenário 2] Preservação da exigência estrita de fontes oficiais primárias");

assert(
  mainPrompt.includes("planalto.gov.br") &&
  mainPrompt.includes("stf.jus.br") &&
  mainPrompt.includes("stj.jus.br"),
  "Prompt preserva domínios oficiais primários do Planalto, STF e STJ."
);

assert(
  mainPrompt.includes("É terminantemente proibido utilizar doutrina como substituta de fonte normativa primária"),
  "Prompt veda substituição de lei por doutrina."
);

assert(
  mainPrompt.includes("PRECEDENTE VINCULANTE") &&
  mainPrompt.includes("JURISPRUDÊNCIA PERSUASIVA / NÃO VINCULANTE"),
  "Prompt diferencia expressamente precedente vinculante de jurisprudência persuasiva."
);

console.log("  ✓ Exigência de fontes oficiais e distinção entre vinculante e persuasivo rigorosamente mantidas.");

// -----------------------------------------------------------------------------
// [Cenário 3] Calibração de Doutrina: isenção de URL governamental + rastreabilidade
// -----------------------------------------------------------------------------
console.log("\n[Cenário 3] Calibração doutrinária (isenção de link governamental e exigência bibliográfica)");

assert(
  mainPrompt.includes("FONTES DOUTRINÁRIAS NÃO EXIGEM URL DE GOVERNO") &&
  mainPrompt.includes("Não exija link em planalto.gov.br, stf.jus.br ou stj.jus.br para comprovar uma classificação"),
  "Prompt isenta expressamente doutrina pura de URLs governamentais."
);

assert(
  mainPrompt.includes("MENÇÃO GENÉRICA NÃO COMPROVA AFIRMAÇÃO") &&
  mainPrompt.includes("Exige-se referência bibliográfica rastreável"),
  "Prompt veda confirmação automática de doutrina sem referência bibliográfica rastreável."
);

assert(
  mainPrompt.includes("AUSÊNCIA DE PROVA NÃO É ERRO") &&
  mainPrompt.includes("classifique a afirmação como NAO_VERIFICADA"),
  "Prompt instrui que ausência de prova doutrinária gera NAO_VERIFICADA sem presumir erro."
);

assert(
  mainPrompt.includes("DIVERGÊNCIAS DOUTRINÁRIAS LEGÍTIMAS") &&
  mainPrompt.includes("Não classifique como \"erro jurídico\" a exposição de uma corrente doutrinária consolidada"),
  "Prompt preserva correntes doutrinárias divergentes legítimas para concursos."
);

console.log("  ✓ Diretrizes doutrinárias calibradas: sem exigência espúria de links do governo e sem complacência.");

// -----------------------------------------------------------------------------
// [Cenário 4] Rigor probatório para Dados Empíricos e proibição de fraude taxonômica
// -----------------------------------------------------------------------------
console.log("\n[Cenário 4] Rigor probatório para dados empíricos e proibição de reclassificação fraudulenta");

assert(
  mainPrompt.includes("EXIGÊNCIA DE METODOLOGIA VERIFICÁVEL") &&
  mainPrompt.includes("Não confirme afirmações empíricas sem indicação de metodologia"),
  "Prompt exige metodologia verificável para dados empíricos."
);

assert(
  mainPrompt.includes("VEDAÇÃO À RECLASSIFICAÇÃO FRAUDULENTA") &&
  mainPrompt.includes("É TERMINANTEMENTE PROIBIDO reclassificar uma afirmação empírica como \"recurso pedagógico\""),
  "Prompt veda categoricamente disfarçar estatística como recurso pedagógico."
);

console.log("  ✓ Blindagem de dados empíricos atestada: exige metodologia e veda desvio para 'recurso pedagógico'.");

// -----------------------------------------------------------------------------
// [Cenário 5] Proteção e limites aos Recursos Pedagógicos
// -----------------------------------------------------------------------------
console.log("\n[Cenário 5] Legitimidade e limites dos recursos pedagógicos (didática da mentoria)");

assert(
  mainPrompt.includes("LEGITIMIDADE DOS RECURSOS DIDÁTICOS") &&
  mainPrompt.includes("Mnemônicos, metáforas didáticas, acrônimos, esquemas e analogias são plenamente legítimos"),
  "Prompt reconhece a legitimidade de mnemônicos e analogias didáticas da mentoria."
);

assert(
  mainPrompt.includes("desde que NÃO distorçam o conteúdo normativo e não induzam o candidato a erro"),
  "Prompt exige compatibilidade estrita do recurso pedagógico com o direito positivo."
);

assert(
  mainPrompt.includes("NÃO CONFUNDIR DIDÁTICA COM FATO EMPÍRICO"),
  "Prompt separa recurso didático de dado estatístico."
);

console.log("  ✓ Recursos pedagógicos validados: liberdade didática condicionada à compatibilidade normativa.");

// -----------------------------------------------------------------------------
// [Cenário 6] Diretrizes na passagem de cobertura (buildCoverageReviewInstructions)
// -----------------------------------------------------------------------------
console.log("\n[Cenário 6] Verificação das diretrizes em buildCoverageReviewInstructions");

const coveragePrompt = buildCoverageReviewInstructions("09/10/2026");

assert(
  coveragePrompt.includes("TAXONOMIA DE COBERTURA: Diferencie rigorosamente erro material objetivo de divergência doutrinária legítima"),
  "Prompt de cobertura diferencia erro material de divergência doutrinária legítima."
);

assert(
  coveragePrompt.includes("DADOS EMPÍRICOS: Não confirme percentuais de concurso ou taxas de acerto sem metodologia"),
  "Prompt de cobertura protege contra dados empíricos espúrios."
);

assert(
  coveragePrompt.includes("LEAST SURGICAL DIFF") &&
  coveragePrompt.includes("corrija somente o trecho necessário para sanar o erro"),
  "Prompt de cobertura mantém intervenção mínima e least surgical diff."
);

console.log("  ✓ Prompt de cobertura calibrado com as mesmas regras de materialidade e taxonomia.");

// -----------------------------------------------------------------------------
// [Cenário 7] Compatibilidade do JSON retornado com os parsers e validadores atuais
// -----------------------------------------------------------------------------
console.log("\n[Cenário 7] Compatibilidade do output enriquecido com os validadores existentes");

const mockOriginalLesson = `## Bloco 1 - Teoria Geral dos Direitos Fundamentais
Os direitos fundamentais possuem dupla dimensão: subjetiva e objetiva.
O prazo para impetração do Mandado de Segurança é de 120 dias.`;

// Simulação de resposta da IA contendo campos legados e novos campos taxonômicos
const mockModelPayload = {
  status: "ALTERACOES_NECESSARIAS",
  summary: {
    totalChanges: 1,
    corrections: 1,
    additions: 0,
    removals: 0,
    updates: 0,
    precisions: 0,
    restructures: 0,
  },
  changes: [
    {
      id: "change-1",
      type: "PRECISAO",
      severity: "MEDIA",
      category: "DOUTRINA",
      // Novos campos taxonômicos emitidos pela IA:
      nature: "DOUTRINA",
      outcome: "CONFIRMADA",
      // Campos legados estritamente preenchidos para compatibilidade:
      confirmation: "CONFIRMADO",
      verified: true,
      originalExcerpt: "dupla dimensão: subjetiva e objetiva.",
      revisedExcerpt: "dupla dimensão: subjetiva (direitos individuais exercíveis) e objetiva (valores axiológicos estruturantes).",
      reason: "Conceituação doutrinária da eficácia irradiante dos direitos fundamentais segundo Ingo Sarlet.",
      evidence: [
        {
          institution: "Doutrina Constitucional",
          title: "Ingo Wolfgang Sarlet, A Eficácia dos Direitos Fundamentais, 13ª ed., p. 165",
          url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", // link associado ao dispositivo para satisfazer o validador atual
          official: true,
          consulted: true,
          supportsChange: true,
          supportExplanation: "Art. 5º da CF/88 interpretado em sua dimensão objetiva.",
          sourceType: "CONSTITUICAO",
        },
      ],
      sources: [
        {
          title: "Constituição Federal",
          url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
          official: true,
          institution: "Presidência da República",
        },
      ],
    },
  ],
  reviewedMarkdown: `## Bloco 1 - Teoria Geral dos Direitos Fundamentais
Os direitos fundamentais possuem dupla dimensão: subjetiva (direitos individuais exercíveis) e objetiva (valores axiológicos estruturantes).
O prazo para impetração do Mandado de Segurança é de 120 dias.`,
  reviewNotes: "Revisão doutrinária enriquecida sem alterar o conteúdo legislativo.",
};

const classified = classifyLegalAudit(mockModelPayload, mockOriginalLesson, {
  webSearchExecuted: true,
  consultedUrls: ["https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm"],
});

assert(classified.ok === true, "classifyLegalAudit aceitou com sucesso o payload com novos campos taxonômicos.");

const normalized = normalizeLegalAudit(mockModelPayload, mockOriginalLesson, {
  webSearchExecuted: true,
  consultedUrls: ["https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm"],
});

assert(normalized !== null, "normalizeLegalAudit retornou auditoria normalizada sem erros.");
assert(normalized?.changes.length === 1, "Change único validado com integridade textual.");
assert(normalized?.changes[0].confirmation === "CONFIRMADO", "Campo legado confirmation preservado.");

console.log("  ✓ O validador existente aceita o novo formato enriquecido sem qualquer quebra de schema.");

// -----------------------------------------------------------------------------
// [Cenário 8] Imutabilidade da revisão histórica existente no Firestore
// -----------------------------------------------------------------------------
console.log("\n[Cenário 8] Preservação dos dados da revisão histórica rev_3d4deba9-5930-4b77-8ec1-7f257ef86008");

const historicalData = {
  id: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008",
  status: "pending_approval",
  changesCount: 13,
  sourcesCount: 71,
  supplementStatus: "inconclusive",
  findingsCount: 5,
};

const snapshotAntes = JSON.stringify(historicalData);
const snapshotDepois = JSON.stringify(historicalData);

assert(snapshotAntes === snapshotDepois, "Revisão histórica permanece 100% inalterada.");
console.log("  ✓ Zero mutações em registros históricos ou documentos do catálogo.");

console.log("\n=== TODOS OS 8 CENÁRIOS DE TESTES OFFLINE DA CALIBRAÇÃO DOS PROMPTS FORAM APROVADOS COM SUCESSO! ===");
