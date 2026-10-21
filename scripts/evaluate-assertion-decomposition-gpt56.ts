/**
 * ATHENA V2.3.4-C — GPT-5.6 BLIND DECOMPOSITION EVALUATION
 * 
 * Avaliação CEGA e controlada da capacidade de decomposição formal do modelo GPT-5.6
 * sobre as 20 PropositionUnits do Benchmark Ouro de Decomposição.
 * 
 * DIRETRIZES FUNDAMENTAIS:
 * 1. EXATAMENTE 1 chamada paga à OpenAI (externalModelCalls === 1).
 * 2. ZERO OpenAI retry automático (maxRetries = 0).
 * 3. ZERO Web Search / ZERO Gemini / ZERO chamadas adicionais.
 * 4. ISOLAMENTO DO GOLDEN: O modelo não tem acesso ao golden benchmark.
 * 5. ORDEM COMPROVÁVEL:
 *    a) Montar prompt blind;
 *    b) Salvar e auditar prompt (zero golden leakage);
 *    c) Executar única chamada ao GPT-5.6;
 *    d) Salvar resposta raw e metadados;
 *    e) Calcular e registrar SHA-256 da resposta raw (congelamento);
 *    f) SOMENTE ENTÃO carregar o golden benchmark e executar o avaliador fail-closed.
 * 6. HARD GATES V2.3.4-B.1: Avaliação estrita sem score compensatório.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import firebaseConfig from '../firebase-applet-config.json';
import { LEGAL_REVIEW_MATERIAL_BINDING } from '../src/lib/legalReviewTypes.js';

// -----------------------------------------------------------------------------
// 1. NETWORK GUARD CONTROLADO (SOMENTE api.openai.com)
// -----------------------------------------------------------------------------
let externalModelCalls = 0;

const nativeFetch = globalThis.fetch;

globalThis.fetch = ((input: any, init?: any) => {
  const urlStr = typeof input === 'string' ? input : input?.url || '';
  if (!urlStr.includes('api.openai.com')) {
    throw new Error(`NETWORK_GUARD_VIOLATION: Chamada fetch externa não autorizada para: ${urlStr}`);
  }
  return nativeFetch(input, init);
}) as any;

try {
  (http as any).request = () => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  };
} catch {
  // Ignora se congelado
}

// -----------------------------------------------------------------------------
// 2. RESOLUÇÃO DE CREDENCIAIS (OPENAI_API_KEY)
// -----------------------------------------------------------------------------
function resolveOpenAiKey(): string {
  if (!process.env.OPENAI_API_KEY) {
    dotenv.config({ path: '.env.local' });
    dotenv.config();
  }
  if (!process.env.OPENAI_API_KEY) {
    try {
      const fetched = execSync(
        `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${firebaseConfig.projectId}`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim();
      if (fetched) {
        process.env.OPENAI_API_KEY = fetched;
      }
    } catch {
      // Secret não disponível via gcloud
    }
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY ausente. Não foi possível autenticar a execução.');
  }
  return apiKey;
}

// -----------------------------------------------------------------------------
// 3. SCHEMA ESTRUTURAL DE DECOMPOSIÇÃO (STRICT JSON SCHEMA)
// -----------------------------------------------------------------------------
const DECOMPOSITION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decompositions'],
  properties: {
    decompositions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['propositionId', 'atomicClaims', 'assertionSpecs'],
        properties: {
          propositionId: { type: 'string' },
          atomicClaims: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['claimId', 'sourceSpan', 'normalizedClaim', 'claimType', 'materiality'],
              properties: {
                claimId: { type: 'string' },
                sourceSpan: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['start', 'end', 'text'],
                  properties: {
                    start: { type: 'integer' },
                    end: { type: 'integer' },
                    text: { type: 'string' },
                  },
                },
                normalizedClaim: { type: 'string' },
                claimType: {
                  type: 'string',
                  enum: [
                    'DIRECT_NORMATIVE_ASSERTION',
                    'COURT_RULING',
                    'INTERPRETIVE_INFERENCE',
                    'DOCTRINAL_SYNTHESIS',
                    'NON_MATERIAL_PREAMBLE',
                  ],
                },
                materiality: {
                  type: 'string',
                  enum: ['MATERIAL', 'NON_MATERIAL'],
                },
              },
            },
          },
          assertionSpecs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'assertionId',
                'claimId',
                'sourceSpan',
                'kind',
                'subject',
                'predicate',
                'object',
                'polarity',
                'modality',
                'qualifiers',
                'legalSourceTarget',
                'requiredEvidenceKind',
              ],
              properties: {
                assertionId: { type: 'string' },
                claimId: { type: 'string' },
                sourceSpan: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['start', 'end', 'text'],
                  properties: {
                    start: { type: 'integer' },
                    end: { type: 'integer' },
                    text: { type: 'string' },
                  },
                },
                kind: {
                  type: 'string',
                  enum: [
                    'RULE_PROHIBITION',
                    'RULE_PERMISSION',
                    'RULE_OBLIGATION',
                    'COURT_RULING',
                    'ORGANIZATIONAL_DUTY',
                    'INTERPRETIVE_CLAIM',
                  ],
                },
                subject: { type: 'string' },
                predicate: { type: 'string' },
                object: { type: 'string' },
                polarity: {
                  type: 'string',
                  enum: ['POSITIVE', 'NEGATIVE'],
                },
                modality: {
                  type: 'string',
                  enum: ['MAY', 'MUST', 'MUST_NOT', 'DECLARES', 'RECOGNIZES', 'OTHER'],
                },
                qualifiers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['type', 'value', 'sourceSpan'],
                    properties: {
                      type: {
                        type: 'string',
                        enum: [
                          'SCOPE',
                          'FREQUENCY',
                          'LIMIT',
                          'PURPOSE',
                          'CONDITION',
                          'AUTHORITY',
                          'TEMPORAL',
                          'OTHER',
                        ],
                      },
                      value: { type: 'string' },
                      sourceSpan: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['start', 'end', 'text'],
                        properties: {
                          start: { type: 'integer' },
                          end: { type: 'integer' },
                          text: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                legalSourceTarget: { type: 'string' },
                requiredEvidenceKind: {
                  type: 'string',
                  enum: ['LEGISLATION', 'JUDICIAL_DECISION', 'ADMINISTRATIVE_ACT'],
                },
              },
            },
          },
        },
      },
    },
  },
};

// -----------------------------------------------------------------------------
// 4. EXTRAÇÃO DO TEXTO DE RESPOSTA DO OPENAI RESPONSES API
// -----------------------------------------------------------------------------
function extractOutputText(response: any): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }
  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        if (record.type === 'message' && record.role === 'assistant' && Array.isArray(record.content)) {
          for (const content of record.content) {
            if (content && typeof content === 'object') {
              const contentRecord = content as Record<string, unknown>;
              if (contentRecord.type === 'output_text' && typeof contentRecord.text === 'string') {
                return contentRecord.text;
              }
            }
          }
        }
      }
    }
  }
  return '';
}

// -----------------------------------------------------------------------------
// 5. FLUXO PRINCIPAL DO EXPERIMENTO
// -----------------------------------------------------------------------------
async function runBlindEvaluation() {
  console.log('================================================================');
  console.log('ATHENA V2.3.4-C: GPT-5.6 BLIND DECOMPOSITION EVALUATION');
  console.log('================================================================');

  // Confirmação de segurança: feature flag
  if (LEGAL_REVIEW_MATERIAL_BINDING !== false) {
    throw new Error('SECURITY_ERROR: LEGAL_REVIEW_MATERIAL_BINDING deve estar desligado (false).');
  }

  const evalDir = path.resolve(process.cwd(), 'tmp/assertion-decomposition-eval');
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  // PASSO 1: Carregar APENAS os inputs cegos isolados
  const blindInputsPath = path.join(evalDir, 'blind-inputs.json');
  if (!fs.existsSync(blindInputsPath)) {
    throw new Error(`Arquivo de blind inputs não encontrado: ${blindInputsPath}`);
  }
  const blindInputs: Array<{ propositionId: string; propositionType: string; originalText: string }> =
    JSON.parse(fs.readFileSync(blindInputsPath, 'utf8'));

  if (blindInputs.length !== 20) {
    throw new Error(`Esperado exatamente 20 PropositionUnits, obtido: ${blindInputs.length}`);
  }

  // PASSO 2: Montar Instruções e Prompt Cego
  const instructions = [
    'Você é um decompositor e analisador estrutural de textos jurídicos de alta precisão.',
    '',
    'INSTRUÇÃO FUNDAMENTAL:',
    'Você não está verificando se a proposição é juridicamente verdadeira.',
    'Você está decompondo fielmente o conteúdo da proposição fornecida.',
    'Não corrija o texto.',
    'Não acrescente doutrina.',
    'Não acrescente jurisprudência.',
    'Não complete informação implícita com conhecimento externo.',
    'Toda afirmação produzida deve ser estritamente rastreável ao originalText.',
    '',
    'REGRAS MANDATÓRIAS DE SOURCE SPAN:',
    '1. Os índices "start" e "end" referenciam EXCLUSIVAMENTE o texto de originalText daquela PropositionUnit (0-indexado).',
    '2. É mandatário que: originalText.slice(start, end) === sourceSpan.text.',
    '3. A partição das AtomicClaims deve cobrir 100% de originalText contiguamente, sem lacunas e sem sobreposições.',
    '4. Cabeçalhos e marcadores introdutórios (ex: "### **1. ", "* **Parágrafo Único:** ", "* I – ") devem ser classificados como NON_MATERIAL_PREAMBLE (materiality: NON_MATERIAL).',
    '5. O conteúdo substantivo deve ser dividido em claims materiais (materiality: MATERIAL) correspondentes a regras, comandos, princípios ou teses.',
    '6. Para cada claim material, produza uma ou mais AssertionSpecs conectadas pelo claimId.',
    '7. AssertionSpecs devem preservar a polaridade exata (POSITIVE ou NEGATIVE) e a modalidade exata (MAY para faculdade, MUST para obrigação/dever, MUST_NOT para vedação/proibição, DECLARES para declaração normativa ou acórdão, RECOGNIZES para reconhecimento).',
    '8. Qualificadores (qualifiers): Toda condição (CONDITION), prazo (TEMPORAL), âmbito (SCOPE), limite (LIMIT), finalidade (PURPOSE), frequência (FREQUENCY) ou autoridade (AUTHORITY) deve ser capturado com seu type, value exato e sourceSpan válido.',
    '9. legalSourceTarget: Identifique com precisão o dispositivo legal ou acórdão referido na própria proposição (ex: CPP_ART_1, CPP_ART_3B_I, CPP_ART_3B_PAR_2, STF_ADI_6298_ITEM1, etc.).',
    '10. Produza a decomposição completa para todas as 20 PropositionUnits fornecidas.',
  ].join('\n');

  const userInput = JSON.stringify({
    task: 'DECOMPOSE_PROPOSITIONS',
    instructions: 'Decomponha as 20 PropositionUnits abaixo em AtomicClaims e AssertionSpecs conforme o schema.',
    propositions: blindInputs,
  }, null, 2);

  const fullPromptText = `=== INSTRUCTIONS ===\n${instructions}\n\n=== USER INPUT ===\n${userInput}`;
  const promptHash = crypto.createHash('sha256').update(fullPromptText).digest('hex');

  const promptFile = path.join(evalDir, 'gpt56-blind-prompt.txt');
  const promptHashFile = path.join(evalDir, 'gpt56-blind-prompt.sha256');
  fs.writeFileSync(promptFile, fullPromptText, 'utf8');
  fs.writeFileSync(promptHashFile, promptHash, 'utf8');

  console.log(`✓ Prompt cego preparado e persistido.`);
  console.log(`  - Arquivo: tmp/assertion-decomposition-eval/gpt56-blind-prompt.txt`);
  console.log(`  - SHA-256 do Prompt: ${promptHash}`);

  // AUDITORIA CONTRA GOLDEN LEAKAGE
  const forbiddenLeaks = [
    'golden-assertions',
    'criticalMaterialTokens',
    'criticalQualifiers',
    'notes do benchmark',
    'SPEC_P005',
    'SPEC_P030',
    'P005-A',
    'P030-A',
  ];
  for (const leak of forbiddenLeaks) {
    if (fullPromptText.includes(leak)) {
      throw new Error(`SECURITY_ERROR: Prompt contém vazamento proibido do benchmark: "${leak}"`);
    }
  }
  console.log(`✓ Auditoria anti-leakage aprovada: zero dados do golden presentes no prompt.`);

  // PASSO 3: Executar a chamada ÚNICA ao modelo GPT-5.6
  const apiKey = resolveOpenAiKey();
  const requestedModel = 'gpt-5.6';
  const reasoningEffort = 'high';
  const timeoutMs = 420000;

  console.log(`\nIniciando chamada única ao modelo: ${requestedModel} (reasoning effort: ${reasoningEffort}, timeout: ${timeoutMs}ms)...`);
  const client = new OpenAI({ apiKey, maxRetries: 0 });

  const startTime = Date.now();
  let response: any;
  externalModelCalls++;

  try {
    response = await client.responses.create(
      {
        model: requestedModel,
        instructions,
        input: userInput,
        store: false as const,
        reasoning: { effort: reasoningEffort },
        max_output_tokens: 30000,
        text: {
          format: {
            type: 'json_schema' as const,
            name: 'assertion_decomposition_batch',
            strict: true,
            schema: DECOMPOSITION_JSON_SCHEMA,
          },
        },
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );
  } catch (callErr: any) {
    console.error('\n❌ ERRO NA CHAMADA AO MODELO:', callErr?.message || callErr);
    const failMeta = {
      timestamp: new Date().toISOString(),
      requestedModel,
      servedModel: 'NONE',
      reasoningEffort,
      externalModelCalls,
      error: callErr?.message || String(callErr),
      status: 'EXPERIMENT_INCONCLUSIVE',
    };
    fs.writeFileSync(path.join(evalDir, 'gpt56-blind-metadata.json'), JSON.stringify(failMeta, null, 2), 'utf8');
    console.log('Classificação experimental: E — EXPERIMENT_INCONCLUSIVE');
    process.exit(1);
  }

  const latencyMs = Date.now() - startTime;
  const servedModel = response.model || 'UNKNOWN';

  console.log(`✓ Resposta recebida com sucesso em ${latencyMs}ms.`);
  console.log(`  - Modelo solicitado: ${requestedModel}`);
  console.log(`  - Modelo servidor:   ${servedModel}`);

  if (servedModel !== requestedModel && !servedModel.includes('gpt-5.6')) {
    throw new Error(`MODEL_MISMATCH_ERROR: Servidor retornou ${servedModel}, esperado ${requestedModel}.`);
  }

  // PASSO 4: Persistir Raw Response e Metadados ANTES de carregar o golden
  const rawResponseFile = path.join(evalDir, 'gpt56-blind-raw-response.json');
  const metadataFile = path.join(evalDir, 'gpt56-blind-metadata.json');

  const rawResponseJsonStr = JSON.stringify(response, null, 2);
  fs.writeFileSync(rawResponseFile, rawResponseJsonStr, 'utf8');

  const rawResponseHash = crypto.createHash('sha256').update(rawResponseJsonStr).digest('hex');

  const usage = response.usage || {};
  const metadata = {
    timestamp: new Date().toISOString(),
    requestedModel,
    servedModel,
    reasoningEffort,
    externalModelCalls,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    latencyMs,
    responseId: response.id || 'N/A',
    rawResponseHash,
  };
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`✓ Resposta bruta e metadados persistidos.`);
  console.log(`  - Arquivo raw: tmp/assertion-decomposition-eval/gpt56-blind-raw-response.json`);
  console.log(`  - SHA-256 do Raw: ${rawResponseHash}`);
  console.log(`  - Tokens: Input=${metadata.inputTokens}, Output=${metadata.outputTokens}, Total=${metadata.totalTokens}`);

  // PASSO 5: Extrair e fazer parse do JSON produzido
  const rawOutputText = extractOutputText(response);
  if (!rawOutputText) {
    console.error('❌ Resposta não contém output_text legível.');
    process.exit(1);
  }

  let parsedData: { decompositions: Array<any> };
  try {
    parsedData = JSON.parse(rawOutputText);
  } catch (parseErr: any) {
    console.error('❌ Falha ao fazer parse do JSON do modelo:', parseErr.message);
    process.exit(1);
  }

  const decompositions = parsedData.decompositions;
  if (!Array.isArray(decompositions) || decompositions.length !== 20) {
    console.error(`❌ O modelo retornou ${decompositions?.length || 0} decomposições (esperado 20).`);
    process.exit(1);
  }

  // ===========================================================================
  // FASE 2: CARREGAMENTO DO GOLDEN E AVALIAÇÃO FAIL-CLOSED DETERMINÍSTICA
  // ===========================================================================
  console.log('\n================================================================');
  console.log('FASE 2: CARREGANDO GOLDEN BENCHMARK E EXECUTANDO AVALIADOR...');
  console.log('================================================================');

  const goldenPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-benchmark/golden-assertions.json');
  const goldenEntries: any[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

  // Import dinâmico do validador de benchmark da V2.3.4-B.1
  const { validateCandidateDecomposition } = await import('./check-assertion-decomposition-benchmark.js');

  const results: Record<string, any> = {};
  const errorDistribution: Record<string, number> = {
    SPAN_ERROR: 0,
    MATERIAL_TOKEN_OMISSION: 0,
    QUALIFIER_OMISSION: 0,
    POLARITY_ERROR: 0,
    MODALITY_ERROR: 0,
    CLAIM_OMISSION: 0,
    UNSUPPORTED_ADDITION: 0,
    LEGAL_SOURCE_TARGET_ERROR: 0,
    STRUCTURAL_ERROR: 0,
  };

  let passCount = 0;
  let failCount = 0;
  let hardPassCount = 0;
  let hardFailCount = 0;

  const HARD_IDS = ['PROP-005', 'PROP-020', 'PROP-022', 'PROP-026', 'PROP-030'];

  for (const golden of goldenEntries) {
    const cand = decompositions.find((d: any) => d.propositionId === golden.propositionId);
    if (!cand) {
      results[golden.propositionId] = {
        status: 'FAIL',
        failingGates: ['MISSING_DECOMPOSITION'],
        errorCategories: ['STRUCTURAL_ERROR'],
      };
      failCount++;
      if (HARD_IDS.includes(golden.propositionId)) hardFailCount++;
      continue;
    }

    const valResult = validateCandidateDecomposition(cand, golden);
    const isHard = HARD_IDS.includes(golden.propositionId);

    const failingGates: string[] = [];
    const errorCats: string[] = [];

    if (valResult.metrics.sourceSpanCoverage < 1.0) {
      failingGates.push(`sourceSpanCoverage=${valResult.metrics.sourceSpanCoverage.toFixed(2)}`);
      errorCats.push('SPAN_ERROR');
    }
    if (valResult.metrics.criticalMaterialTokenRecall < 1.0) {
      failingGates.push(`criticalMaterialTokenRecall=${valResult.metrics.criticalMaterialTokenRecall.toFixed(2)}`);
      errorCats.push('MATERIAL_TOKEN_OMISSION');
    }
    if (valResult.metrics.criticalQualifierRecall < 1.0) {
      failingGates.push(`criticalQualifierRecall=${valResult.metrics.criticalQualifierRecall.toFixed(2)}`);
      errorCats.push('QUALIFIER_OMISSION');
    }
    if (valResult.metrics.polarityAccuracy < 1.0) {
      failingGates.push(`polarityAccuracy=${valResult.metrics.polarityAccuracy.toFixed(2)}`);
      errorCats.push('POLARITY_ERROR');
    }
    if (valResult.metrics.criticalModalityAccuracy < 1.0) {
      failingGates.push(`criticalModalityAccuracy=${valResult.metrics.criticalModalityAccuracy.toFixed(2)}`);
      errorCats.push('MODALITY_ERROR');
    }
    if (valResult.metrics.atomicClaimRecall < 1.0) {
      failingGates.push(`atomicClaimRecall=${valResult.metrics.atomicClaimRecall.toFixed(2)}`);
      errorCats.push('CLAIM_OMISSION');
    }
    if (valResult.metrics.unsupportedAdditionRate > 0) {
      failingGates.push(`unsupportedAdditionRate=${valResult.metrics.unsupportedAdditionRate.toFixed(2)}`);
      errorCats.push('UNSUPPORTED_ADDITION');
    }
    if (valResult.metrics.legalSourceTargetAccuracy < 1.0) {
      failingGates.push(`legalSourceTargetAccuracy=${valResult.metrics.legalSourceTargetAccuracy.toFixed(2)}`);
      errorCats.push('LEGAL_SOURCE_TARGET_ERROR');
    }
    if (valResult.errors.length > 0 && failingGates.length === 0) {
      failingGates.push('STRUCTURAL_VIOLATION');
      errorCats.push('STRUCTURAL_ERROR');
    }

    const uniqueErrorCats = [...new Set(errorCats)];
    for (const ec of uniqueErrorCats) {
      errorDistribution[ec] = (errorDistribution[ec] || 0) + 1;
    }

    if (valResult.valid) {
      passCount++;
      if (isHard) hardPassCount++;
      results[golden.propositionId] = {
        status: 'PASS',
        isHard,
        metrics: valResult.metrics,
      };
      console.log(`[PASS] ${golden.propositionId}${isHard ? ' (HARD)' : ''}`);
    } else {
      failCount++;
      if (isHard) hardFailCount++;
      results[golden.propositionId] = {
        status: 'FAIL',
        isHard,
        failingGates,
        errorCategories: uniqueErrorCats,
        errors: valResult.errors,
        metrics: valResult.metrics,
      };
      console.log(`[FAIL] ${golden.propositionId}${isHard ? ' (HARD)' : ''}: ${failingGates.join(', ')}`);
    }
  }

  // Determinação da Classificação Experimental
  let experimentClassification: 'A' | 'B' | 'C' | 'D' | 'E';
  if (passCount === 20 && hardPassCount === 5) {
    experimentClassification = 'A';
  } else if (passCount === 19 && hardPassCount === 5) {
    experimentClassification = 'B';
  } else if ((passCount === 17 || passCount === 18) || (hardFailCount > 0 && passCount > 16)) {
    experimentClassification = 'C';
  } else {
    experimentClassification = 'D';
  }

  const evaluationReport = {
    metadata,
    summary: {
      total: 20,
      passCount,
      failCount,
      hardTotal: 5,
      hardPassCount,
      hardFailCount,
      classification: experimentClassification,
    },
    errorDistribution,
    results,
  };

  const resultsFile = path.join(evalDir, 'gpt56-evaluation-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(evaluationReport, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('RESUMO CONSOLIDADO DA AVALIAÇÃO CEGA:');
  console.log('================================================================');
  console.log(`Total Aprovado:  ${passCount}/20 (${((passCount / 20) * 100).toFixed(1)}%)`);
  console.log(`Total Reprovado: ${failCount}/20`);
  console.log(`Casos HARD:      ${hardPassCount}/5 aprovados, ${hardFailCount}/5 reprovados`);
  console.log(`Classificação:   ${experimentClassification}`);
  console.log(`Distribuição de Erros:`, errorDistribution);
  console.log(`Relatório salvo em: tmp/assertion-decomposition-eval/gpt56-evaluation-results.json`);

  return evaluationReport;
}

runBlindEvaluation().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
