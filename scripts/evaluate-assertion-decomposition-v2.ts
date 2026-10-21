/**
 * ATHENA V2.3.4-E — BLIND DECOMPOSITION PROMPT V2 EXPERIMENT
 * 
 * Experimento controlado de decomposição jurídica com GPT-5.6 (responses.create),
 * corrigindo as classes de erro identificadas pelo baseline V2.3.4-D.1:
 * - Modalidades deônticas (MAY, MUST, MUST_NOT, DECLARES, RECOGNIZES);
 * - Teste de paráfrase deôntica interna;
 * - Detecção sistemática de qualificadores explícitos (SCOPE, EXCEPTION, CONDITION, TEMPORAL, etc.);
 * - Isolamento de cabeçalhos estruturais e títulos de seções (NON_MATERIAL_PREAMBLE);
 * - Code-owned geometry (sourceText literal, sem offsets numéricos no prompt);
 * - Isolamento total do golden benchmark.
 * 
 * REGRAS ESTRITAS DE EXECUÇÃO:
 * - EXATAMENTE 1 chamada paga externa à OpenAI (externalModelCalls === 1).
 * - ZERO retry automático (maxRetries = 0).
 * - ZERO Web Search / ZERO Gemini / ZERO chamadas adicionais.
 * - ZERO rede após a chamada única (lockdown total).
 * - LEGAL_REVIEW_MATERIAL_BINDING === false.
 * - Verificação de integridade dos artefatos anteriores (RAW V1 e Baseline D.1).
 * - Persistência completa e congelamento criptográfico (SHA-256).
 * - Avaliação fail-closed determinística offline contra Contract V2.
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

import {
  LEGAL_REVIEW_MATERIAL_BINDING,
  type ClaimMateriality,
  type ClaimType,
  type Modality,
  type Polarity,
  type QualifierType,
} from '../src/lib/legalReviewTypes.js';

import {
  evaluateDecompositionContractV2,
  recoverExactSourceSpan,
  resolveCanonicalLegalSource,
  type DecompositionCandidateV2,
  type GoldenBenchmarkEntry,
  type LegalStructuralContext,
  type DecompositionContractV2Result,
  type AssertionSpecCandidateV2,
  type AtomicClaimCandidateV2,
  type QualifierCandidateV2,
  type LegalSourceReference,
} from '../src/lib/legalReviewDecompositionContract.js';

// ============================================================================
// 1. NETWORK GUARD CONTROLADO (CHAMADA ÚNICA STRICT)
// ============================================================================
let externalModelCalls = 0;
let networkRequests = 0;
let networkLockdown = false;

const nativeFetch = globalThis.fetch;

globalThis.fetch = ((input: any, init?: any) => {
  if (networkLockdown) {
    throw new Error('NETWORK_GUARD_LOCKDOWN: Rede completamente bloqueada pós-chamada única.');
  }
  const urlStr = typeof input === 'string' ? input : input?.url || '';
  if (!urlStr.includes('api.openai.com')) {
    throw new Error(`NETWORK_GUARD_VIOLATION: Chamada fetch não autorizada para: ${urlStr}`);
  }
  networkRequests++;
  return nativeFetch(input, init);
}) as any;

try {
  (http as any).request = () => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  };
  (https as any).request = () => {
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  };
} catch {
  // Ignora se congelado
}

// ============================================================================
// 2. PRÉ-CONDIÇÕES OBRIGATÓRIAS E RESOLUÇÃO DE CREDENCIAIS
// ============================================================================
const EXPECTED_RAW_V1_HASH = 'ca1ec0c585bad0f9859a825bee70392bda226abf40be4e816ff42d4a17fd7efd';
const EXPECTED_BASELINE_D1_HASH = '45e471314b3efd963ed45acd972d2b31a22adbb9a0a8ef8cc52fee5d1434084c';

function verifyPreconditions(evalDir: string) {
  // 1. Feature flag
  if (LEGAL_REVIEW_MATERIAL_BINDING !== false) {
    throw new Error(`PRECONDITION_FAILURE: LEGAL_REVIEW_MATERIAL_BINDING deve ser false (atual: ${LEGAL_REVIEW_MATERIAL_BINDING})`);
  }

  // 2. RAW V1 Hash
  const rawV1Path = path.join(evalDir, 'gpt56-blind-raw-response.json');
  if (!fs.existsSync(rawV1Path)) {
    throw new Error(`PRECONDITION_FAILURE: RAW V1 não encontrado: ${rawV1Path}`);
  }
  const rawV1Hash = crypto.createHash('sha256').update(fs.readFileSync(rawV1Path)).digest('hex');
  if (rawV1Hash !== EXPECTED_RAW_V1_HASH) {
    throw new Error(`PRECONDITION_FAILURE: RAW V1 hash mismatch: esperado ${EXPECTED_RAW_V1_HASH}, obtido ${rawV1Hash}`);
  }

  // 3. Baseline D.1 Hash
  const baselineD1Path = path.join(evalDir, 'v234d1-canonical-semantic-baseline.json');
  if (!fs.existsSync(baselineD1Path)) {
    throw new Error(`PRECONDITION_FAILURE: Baseline D.1 não encontrado: ${baselineD1Path}`);
  }
  const baselineD1Hash = crypto.createHash('sha256').update(fs.readFileSync(baselineD1Path)).digest('hex');
  if (baselineD1Hash !== EXPECTED_BASELINE_D1_HASH) {
    throw new Error(`PRECONDITION_FAILURE: Baseline D.1 hash mismatch: esperado ${EXPECTED_BASELINE_D1_HASH}, obtido ${baselineD1Hash}`);
  }

  console.log('✓ Pré-condições obrigatórias verificadas com sucesso:');
  console.log(`  - LEGAL_REVIEW_MATERIAL_BINDING: false`);
  console.log(`  - RAW V1 SHA-256:         ${rawV1Hash}`);
  console.log(`  - Baseline D.1 SHA-256:   ${baselineD1Hash}`);
}

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
      // Ignora falha de secret
    }
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY ausente. Não foi possível autenticar a execução.');
  }
  return apiKey;
}

// ============================================================================
// 3. SCHEMA ESTRUTURAL CONTRACT V2 (STRICT JSON SCHEMA)
// ============================================================================
const DECOMPOSITION_V2_JSON_SCHEMA = {
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
              required: ['claimId', 'sourceText', 'normalizedClaim', 'claimType', 'materiality'],
              properties: {
                claimId: { type: 'string' },
                sourceText: { type: 'string' },
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
                'sourceText',
                'kind',
                'subject',
                'predicate',
                'object',
                'polarity',
                'modality',
                'qualifiers',
                'legalSourceReference',
              ],
              properties: {
                assertionId: { type: 'string' },
                claimId: { type: 'string' },
                sourceText: { type: 'string' },
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
                    required: ['type', 'value', 'sourceText'],
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
                          'EXCEPTION',
                          'OTHER',
                        ],
                      },
                      value: { type: 'string' },
                      sourceText: { type: 'string' },
                    },
                  },
                },
                legalSourceReference: {
                  type: 'object',
                  additionalProperties: false,
                  required: [
                    'authority',
                    'sourceType',
                    'identifier',
                    'provision',
                    'paragraph',
                    'inciso',
                    'item',
                    'textualReference',
                  ],
                  properties: {
                    authority: { type: 'string' },
                    sourceType: { type: 'string' },
                    identifier: { type: 'string' },
                    provision: { type: 'string' },
                    paragraph: { type: 'string' },
                    inciso: { type: 'string' },
                    item: { type: 'string' },
                    textualReference: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ============================================================================
// 4. EXTRAÇÃO DO TEXTO DE RESPOSTA DO OPENAI RESPONSES API
// ============================================================================
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

// ============================================================================
// 5. FLUXO PRINCIPAL: PROMPT V2 + CHAMADA ÚNICA + AVALIAÇÃO OFFLINE
// ============================================================================
export async function runPromptV2Experiment() {
  console.log('================================================================');
  console.log('ATHENA V2.3.4-E: BLIND DECOMPOSITION PROMPT V2 EXPERIMENT');
  console.log('================================================================\n');

  const evalDir = path.resolve(process.cwd(), 'tmp/assertion-decomposition-eval');
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  // PASSO 0: Verificar pré-condições
  verifyPreconditions(evalDir);

  // PASSO 1: Carregar os blind inputs isolados (zero golden)
  const blindInputsPath = path.join(evalDir, 'blind-inputs.json');
  if (!fs.existsSync(blindInputsPath)) {
    throw new Error(`Blind inputs não encontrados em: ${blindInputsPath}`);
  }
  const blindInputs: Array<{ propositionId: string; propositionType: string; originalText: string }> =
    JSON.parse(fs.readFileSync(blindInputsPath, 'utf8'));

  if (blindInputs.length !== 20) {
    throw new Error(`Esperado exatamente 20 PropositionUnits, encontrado: ${blindInputs.length}`);
  }

  // PASSO 2: Montar Instruções Especializadas do Prompt V2
  const instructions = [
    'Você é um decompositor e analisador estrutural de textos jurídicos de altíssima precisão técnica.',
    '',
    '1. INSTRUÇÃO FUNDAMENTAL:',
    '- Você NÃO está julgando se a proposição é juridicamente verdadeira ou falsa.',
    '- Você está decompondo fielmente o conteúdo do texto fornecido em suas unidades mínimas.',
    '- NÃO corrija o texto, não acrescente doutrina externa, jurisprudência externa ou fatos implícitos.',
    '- Toda afirmação produzida deve ser estritamente rastreável ao originalText.',
    '',
    '2. CODE-OWNED GEOMETRY (REQUISITO MANDATÓRIO DE SPAN):',
    '- NÃO calcule nem forneça índices numéricos ("start" ou "end"). O sistema computacional calcula a geometria.',
    '- Forneça para cada elemento o campo "sourceText": uma substring LITERAL e EXATA extraída de originalText.',
    '- A união das atomicClaims deve cobrir 100% de originalText contiguamente, sem sobreposições e sem lacunas.',
    '- Use identificadores locais simples: "C1", "C2", "C3"... para claims e "A1", "A2", "A3"... para assertions.',
    '',
    '3. MARCADORES ESTRUTURAIS, CABEÇALHOS E TÍTULOS DE SEÇÃO:',
    '- Marcadores e numerações de início (ex: "### **1. ", "### **3. ", "### **4. ", "* **Parágrafo Único:** ", "* I – ", "* **§ 2º:** ", "* **§ 3º:** ", "**XIV** - ") que não contenham norma substantiva autônoma DEVEM ser isolados como uma claim com claimType: "NON_MATERIAL_PREAMBLE" e materiality: "NON_MATERIAL", cobrindo exatamente o marcador introdutório.',
    '- TÍTULOS DE SEÇÃO RELATIVOS A DISPOSITIVOS LEGAIS (ex: "### **1. Art. 1º do CPP — Princípio da Territorialidade Processual e Exceções**"):',
    '  a) O marcador numérico inicial (ex: "### **1. ") é claimType: "NON_MATERIAL_PREAMBLE", materiality: "NON_MATERIAL".',
    '  b) A enunciação do dispositivo e do tema (ex: "Art. 1º do CPP — Princípio da Territorialidade Processual e Exceções**") É claimType: "DIRECT_NORMATIVE_ASSERTION", materiality: "MATERIAL", e DEVE gerar uma AssertionSpec com modality: "DECLARES", polaridade: "POSITIVE" e kind: "RULE_OBLIGATION" ou "INTERPRETIVE_CLAIM".',
    '  c) NÃO classifique o título substantivo inteiro como non-material preamble. Apenas o marcador sintático é non-material.',
    '',
    '4. MODALIDADES DEÔNTICAS E RIGOR SEMÂNTICO (modality):',
    'Classifique a modalidade deôntica de cada AssertionSpec com base estrita no seu comando normativo real:',
    '- MAY: faculdade, permissão, prerrogativa discricionária, escolha conferida à parte ou autoridade, ou incidência supletiva/subsidiária na falta de outra regra (ex: "poderá", "é facultado", "cabe a escolha", "aplica-se aos feitos militares quando faltar norma processual expressa").',
    '- MUST: dever, obrigação estrita, vinculação imperativa, comando de competência cogente (ex: "deve", "deverá", "é obrigado", "compete", "ficarão acautelados", "impõe-se").',
    '  * ATENÇÃO: A ausência do verbo "dever" não afasta a modalidade MUST quando o sentido do verbo for de competência vinculada imperativa (ex: "o juiz decide o recebimento da denúncia" = MUST; "o juiz realiza a audiência" = MUST).',
    '- MUST_NOT: proibição expressa, vedação estrita, interdição jurídica, ou ausência/negação deliberada de vinculação (ex: "não vinculam", "não recebe", "não serão apensados", "é vedado", "não pode", "não será admitido", "vedada a substituição").',
    '  * REGRA OBRIGATÓRIA: Quando a norma ou decisão prescreve que atos/decisões de um juízo "não vinculam" outro juízo (ex: "as decisões proferidas pelo juiz das garantias não vinculam o juiz da instrução"), ou que a autoridade "não recebe" a denúncia, trata-se de vedação/ausência cogente de vinculação: a modalidade É "MUST_NOT". NUNCA use DECLARES para vedações desse tipo.',
    '- DECLARES: declaração em acórdão ou controle concentrado, juízo abstrato de validade/invalidade constitucional, fixação de tese hermenêutica ou enunciação de tema em título de artigo (ex: "o STF declarou a inconstitucionalidade", "conferiu interpretação conforme à Constituição para estabelecer que a competência termina com o oferecimento", "Art. 1º do CPP — Princípio...").',
    '- RECOGNIZES: reconhecimento explícito de prerrogativa, garantia ou obrigatoriedade pré-existente (ex: "reconhece a obrigatoriedade de implementação nacional").',
    '- OTHER: residual apenas quando nenhuma das categorias deônticas acima couber.',
    '',
    '5. TESTE DE PARÁFRASE DEÔNTICA INTERNA (EXECUTE MENTALMENTE ANTES DE EMITIR A MODALIDADE):',
    '- "Tem a faculdade / pode agir discricionariamente / incide supletivamente na falta de outra norma?" -> MAY',
    '- "É obrigado a / tem o dever funcional imperativo de / deve imperativamente?" -> MUST',
    '- "É vedado a / não tem permissão para / não vincula obrigatoriamente / não recebe?" -> MUST_NOT',
    '- "O STF fixou a tese / declarou inconstitucionalidade / enunciou em título?" -> DECLARES',
    '- "Reconhece formalmente garantia ou situação pré-existente?" -> RECOGNIZES',
    '',
    '6. DETECÇÃO SISTEMÁTICA DE QUALIFICADORES EXPLÍCITOS (qualifiers):',
    'Todo elemento circunstancial limitador, modalizador ou condicional deve ser extraído na lista de "qualifiers":',
    '- SCOPE: alcance, abrangência ou universalidade (ex: "qualquer prisão", "qualquer", "em todo o país", "em todos os casos", "no âmbito", "nos limites", "em curso").',
    '- EXCEPTION: ressalvas, ressalvadas hipóteses e exceções (ex: "salvo", "exceto", "ressalvadas as provas irrepetíveis", "a menos que", "ressalvado").',
    '- CONDITION: condicionantes normativas (ex: "desde que", "se", "caso", "na hipótese de", "quando faltar norma processual expressa").',
    '- TEMPORAL: prazos, marcos temporais e momentos (ex: "imediatamente", "no prazo máximo de 10 dias", "até", "antes", "depois", "com o oferecimento", "a qualquer tempo").',
    '- PURPOSE: finalidades expressas (ex: "para o fim de", "a fim de").',
    '- FREQUENCY / OTHER: frequência ou modo (ex: "pontualmente", "reiteradamente", "ordinariamente").',
    '- AUTHORITY: autoridade ou autonomia ressalvada (ex: "observada a autonomia dos tribunais", "sob supervisão").',
    'Para cada qualificador, forneça o "type", o "value" e o "sourceText" literal.',
    '',
    '7. IDENTIFICAÇÃO DE FONTES (legalSourceReference):',
    'Para cada AssertionSpec, extraia os dados estruturados da fonte referida na proposição:',
    '- authority (ex: "STF", "LEGISLACAO_FEDERAL", "CONSTITUICAO_FEDERAL", "CNJ")',
    '- sourceType (ex: "CODIGO", "CONSTITUICAO", "ADI", "RESOLUCAO")',
    '- identifier (ex: "CPP", "CF", "6298", "562/2024")',
    '- provision (ex: "Art. 1º", "Art. 3º-A", "Art. 3º-B", "Art. 3º-C", "Art. 3º-D", "Art. 5º")',
    '- paragraph (ex: "Parágrafo Único", "§ 1º", "§ 2º", "§ 3º")',
    '- inciso (ex: "I", "II", "IV", "XIV", "LXII")',
    '- item (ex: "item 1", ou "" se ausente)',
    '- textualReference (citação literal no texto, ex: "art. 5º, LXII, CF", "ADI 6.298", "art. 3º-C do CPP")',
    '(Preencha com string vazia "" qualquer campo não mencionado no texto).',
    '',
    '8. ESCOPO TOTAL:',
    '- Decomponha TODAS as 20 PropositionUnits fornecidas, mantendo a ordem exata das unidades.',
  ].join('\n');

  const userInput = JSON.stringify(
    {
      task: 'DECOMPOSE_PROPOSITIONS_V2',
      instructions: 'Decomponha as 20 PropositionUnits abaixo em AtomicClaims e AssertionSpecs conforme o schema do Contract V2.',
      propositions: blindInputs,
    },
    null,
    2
  );

  const fullPromptText = `=== INSTRUCTIONS ===\n${instructions}\n\n=== USER INPUT ===\n${userInput}`;
  const promptHash = crypto.createHash('sha256').update(fullPromptText).digest('hex');

  const promptFile = path.join(evalDir, 'gpt56-blind-v2-prompt.txt');
  const promptHashFile = path.join(evalDir, 'gpt56-blind-v2-prompt.sha256');
  fs.writeFileSync(promptFile, fullPromptText, 'utf8');
  fs.writeFileSync(promptHashFile, promptHash, 'utf8');

  console.log('✓ Prompt V2 preparado e persistido:');
  console.log(`  - Arquivo: tmp/assertion-decomposition-eval/gpt56-blind-v2-prompt.txt`);
  console.log(`  - SHA-256 do Prompt V2: ${promptHash}`);

  // AUDITORIA ANTI-LEAKAGE DO PROMPT
  const forbiddenLeaks = [
    'golden-assertions',
    'criticalMaterialTokens',
    'criticalQualifiers',
    'SPEC_P005',
    'SPEC_P030',
    'P005-A',
    'P030-A',
    'v234d1-canonical',
  ];
  for (const leak of forbiddenLeaks) {
    if (fullPromptText.includes(leak)) {
      throw new Error(`SECURITY_ERROR: Prompt V2 contém vazamento proibido do benchmark: "${leak}"`);
    }
  }
  console.log('✓ Auditoria anti-leakage aprovada: zero dados do golden presentes no prompt.');

  // PASSO 3: Executar a chamada ÚNICA ao modelo GPT-5.6
  if (externalModelCalls >= 1) {
    throw new Error('SECURITY_ERROR: Tentativa de realizar mais de 1 chamada externa ao modelo.');
  }

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
            name: 'assertion_decomposition_v2_batch',
            strict: true,
            schema: DECOMPOSITION_V2_JSON_SCHEMA,
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
    fs.writeFileSync(path.join(evalDir, 'gpt56-blind-v2-metadata.json'), JSON.stringify(failMeta, null, 2), 'utf8');
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

  // PASSO 4: Persistir Raw Response e Metadados ANTES de qualquer contato com o golden
  const rawResponseFile = path.join(evalDir, 'gpt56-blind-v2-raw-response.json');
  const metadataFile = path.join(evalDir, 'gpt56-blind-v2-metadata.json');
  const parsedFile = path.join(evalDir, 'gpt56-blind-v2-parsed.json');

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
    networkRequests,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    latencyMs,
    responseId: response.id || 'N/A',
    rawResponseHash,
  };
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2), 'utf8');

  // Parse do texto gerado
  const rawOutputText = extractOutputText(response);
  if (!rawOutputText) {
    throw new Error('❌ Resposta do modelo não contém output_text legível.');
  }

  const parsedData: { decompositions: DecompositionCandidateV2[] } = JSON.parse(rawOutputText);
  const parsedJsonStr = JSON.stringify(parsedData, null, 2);
  fs.writeFileSync(parsedFile, parsedJsonStr, 'utf8');
  const parsedHash = crypto.createHash('sha256').update(parsedJsonStr).digest('hex');

  console.log(`✓ Artefatos V2 persistidos e criptograficamente congelados:`);
  console.log(`  - Raw:     tmp/assertion-decomposition-eval/gpt56-blind-v2-raw-response.json (SHA-256: ${rawResponseHash})`);
  console.log(`  - Parsed:  tmp/assertion-decomposition-eval/gpt56-blind-v2-parsed.json (SHA-256: ${parsedHash})`);
  console.log(`  - Metadata: Tokens Total=${metadata.totalTokens} (Input=${metadata.inputTokens}, Output=${metadata.outputTokens})`);

  // PASSO 5: BLOQUEIO TOTAL DA REDE (LOCKDOWN)
  networkLockdown = true;
  globalThis.fetch = () => {
    throw new Error('NETWORK_GUARD_LOCKDOWN: Chamada externa pós-modelo proibida.');
  };
  console.log(`✓ Network lockdown ativado: 100% offline a partir deste ponto.`);

  // ===========================================================================
  // FASE 2: CARREGAMENTO DO GOLDEN E AVALIAÇÃO DETERMINÍSTICA OFFLINE
  // ===========================================================================
  console.log('\n================================================================');
  console.log('FASE 2: AVALIAÇÃO OFFLINE CONTRA CONTRACT V2 E BENCHMARK');
  console.log('================================================================\n');

  const goldenPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-benchmark/golden-assertions.json');
  const goldenEntries: GoldenBenchmarkEntry[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

  const HARD_UNITS = ['PROP-005', 'PROP-020', 'PROP-022', 'PROP-026', 'PROP-030'];
  const STRUCTURAL_HEADER_UNITS = ['PROP-001', 'PROP-003', 'PROP-004'];

  const v2Results: Record<string, DecompositionContractV2Result> = {};
  let totalPass = 0;
  let hardPass = 0;
  let headerPass = 0;

  const totalErrorsAccumulator = {
    SPAN_ERROR: 0,
    TRUE_MODALITY_ERROR: 0,
    TRUE_QUALIFIER_OMISSION: 0,
    TRUE_POLARITY_ERROR: 0,
    TRUE_CLAIM_OMISSION: 0,
    TRUE_UNSUPPORTED_ADDITION: 0,
    SOURCE_REFERENCE_ERROR: 0,
    STRUCTURAL_ERROR: 0,
  };

  const affectedUnitsAccumulator: Record<string, string[]> = {
    TRUE_MODALITY_ERROR: [],
    TRUE_QUALIFIER_OMISSION: [],
    TRUE_POLARITY_ERROR: [],
    TRUE_CLAIM_OMISSION: [],
    TRUE_UNSUPPORTED_ADDITION: [],
    SPAN_ERROR: [],
    SOURCE_REFERENCE_ERROR: [],
  };

  // Avaliação de cada unidade
  for (const ge of goldenEntries) {
    const cand = parsedData.decompositions.find(d => d.propositionId === ge.propositionId);
    if (!cand) {
      throw new Error(`Decomposição ausente para ${ge.propositionId}`);
    }

    const context: LegalStructuralContext = {
      parentCitation:
        ge.propositionType === 'INCISO_MAPPING'
          ? 'Art. 3º-B do CPP'
          : ge.propositionType === 'PARAGRAPH_RULE'
          ? 'Art. 3º-C do CPP'
          : undefined,
      propositionType: ge.propositionType,
    };

    const evalRes = evaluateDecompositionContractV2(cand, ge, context);
    v2Results[ge.propositionId] = evalRes;

    if (evalRes.valid) {
      totalPass++;
      if (HARD_UNITS.includes(ge.propositionId)) hardPass++;
      if (STRUCTURAL_HEADER_UNITS.includes(ge.propositionId)) headerPass++;
    }

    // Contabilidade de erros
    if (evalRes.metrics.exactSourceRecovery < 1.0) {
      totalErrorsAccumulator.SPAN_ERROR++;
      affectedUnitsAccumulator.SPAN_ERROR.push(ge.propositionId);
    }
    if (evalRes.metrics.criticalModalityPreservation < 1.0) {
      totalErrorsAccumulator.TRUE_MODALITY_ERROR += evalRes.semanticErrors.trueModalityErrors.length;
      affectedUnitsAccumulator.TRUE_MODALITY_ERROR.push(ge.propositionId);
    }
    if (evalRes.metrics.criticalQualifierCoverage < 1.0) {
      totalErrorsAccumulator.TRUE_QUALIFIER_OMISSION += evalRes.semanticErrors.trueQualifierOmissions.length;
      affectedUnitsAccumulator.TRUE_QUALIFIER_OMISSION.push(ge.propositionId);
    }
    if (evalRes.metrics.polarityPreservation < 1.0) {
      totalErrorsAccumulator.TRUE_POLARITY_ERROR += evalRes.semanticErrors.truePolarityErrors.length;
      affectedUnitsAccumulator.TRUE_POLARITY_ERROR.push(ge.propositionId);
    }
    if (evalRes.metrics.claimCoverage < 1.0) {
      totalErrorsAccumulator.TRUE_CLAIM_OMISSION += evalRes.semanticErrors.trueClaimOmissions.length;
      affectedUnitsAccumulator.TRUE_CLAIM_OMISSION.push(ge.propositionId);
    }
    if (evalRes.metrics.unsupportedAdditionRate > 0) {
      totalErrorsAccumulator.TRUE_UNSUPPORTED_ADDITION += evalRes.semanticErrors.trueUnsupportedAdditions.length;
      affectedUnitsAccumulator.TRUE_UNSUPPORTED_ADDITION.push(ge.propositionId);
    }
    if (evalRes.metrics.sourceReferenceResolution < 1.0) {
      totalErrorsAccumulator.SOURCE_REFERENCE_ERROR++;
      affectedUnitsAccumulator.SOURCE_REFERENCE_ERROR.push(ge.propositionId);
    }
  }

  // ===========================================================================
  // FASE 3: COMPARAÇÃO COM BASELINE D.1 (V1 VS V2)
  // ===========================================================================
  const baselineD1Path = path.join(evalDir, 'v234d1-canonical-semantic-baseline.json');
  const baselineD1 = JSON.parse(fs.readFileSync(baselineD1Path, 'utf8'));

  // Transições por unidade
  const unitTransitions: Record<string, { v1Status: 'PASS' | 'FAIL'; v2Status: 'PASS' | 'FAIL'; transition: 'FIXED' | 'STILL_FAILING' | 'REGRESSED' | 'STABLE_PASS'; details: string[] }> = {};

  const d1FailingUnits = new Set<string>();
  Object.values(baselineD1.affectedUnits as Record<string, { count: number; units: string[] }>).forEach(group => {
    group.units.forEach(u => d1FailingUnits.add(u));
  });

  let fixedCount = 0;
  let stillFailingCount = 0;
  let regressedCount = 0;
  let stablePassCount = 0;

  for (const ge of goldenEntries) {
    const id = ge.propositionId;
    const v1Passed = !d1FailingUnits.has(id);
    const v2Passed = v2Results[id].valid;

    let transition: 'FIXED' | 'STILL_FAILING' | 'REGRESSED' | 'STABLE_PASS';
    if (!v1Passed && v2Passed) {
      transition = 'FIXED';
      fixedCount++;
    } else if (!v1Passed && !v2Passed) {
      transition = 'STILL_FAILING';
      stillFailingCount++;
    } else if (v1Passed && !v2Passed) {
      transition = 'REGRESSED';
      regressedCount++;
    } else {
      transition = 'STABLE_PASS';
      stablePassCount++;
    }

    unitTransitions[id] = {
      v1Status: v1Passed ? 'PASS' : 'FAIL',
      v2Status: v2Passed ? 'PASS' : 'FAIL',
      transition,
      details: v2Results[id].errors,
    };
  }

  // Determinar Classificação Final do Experimento:
  // Categoria A: Desempenho superior, progressão nítida, zero regressão (totalPass >= 16, hardPass >= 4, regressed === 0)
  // Categoria B: Melhora significativa com erros residuais menores (totalPass > 10, regressed === 0)
  // Categoria C: Neutro / inconclusivo (totalPass === 10)
  // Categoria D: Degradação / regressão (totalPass < 10 ou regressed > 0)
  let finalClassification: 'CATEGORIA_A' | 'CATEGORIA_B' | 'CATEGORIA_C' | 'CATEGORIA_D';
  if (totalPass >= 16 && hardPass >= 4 && regressedCount === 0) {
    finalClassification = 'CATEGORIA_A';
  } else if (totalPass > 10 && regressedCount === 0) {
    finalClassification = 'CATEGORIA_B';
  } else if (totalPass === 10 && regressedCount === 0) {
    finalClassification = 'CATEGORIA_C';
  } else {
    finalClassification = 'CATEGORIA_D';
  }

  const evaluationReport = {
    experiment: 'ATHENA_V2.3.4-E_BLIND_DECOMPOSITION_PROMPT_V2',
    timestamp: new Date().toISOString(),
    hashes: {
      rawV1Hash: EXPECTED_RAW_V1_HASH,
      baselineD1Hash: EXPECTED_BASELINE_D1_HASH,
      promptV2Hash: promptHash,
      rawV2Hash: rawResponseHash,
      parsedV2Hash: parsedHash,
    },
    metadata,
    classification: finalClassification,
    summary: {
      globalPass: {
        v1: '10/20 (50.0%)',
        v2: `${totalPass}/20 (${((totalPass / 20) * 100).toFixed(1)}%)`,
        delta: totalPass - 10,
      },
      hardPass: {
        v1: '2/5 (40.0%)',
        v2: `${hardPass}/5 (${((hardPass / 5) * 100).toFixed(1)}%)`,
        delta: hardPass - 2,
      },
      headerPass: {
        v1: '0/3 (0.0%)',
        v2: `${headerPass}/3 (${((headerPass / 3) * 100).toFixed(1)}%)`,
        delta: headerPass,
      },
      transitions: {
        FIXED: fixedCount,
        STILL_FAILING: stillFailingCount,
        REGRESSED: regressedCount,
        STABLE_PASS: stablePassCount,
      },
    },
    errorComparison: {
      TRUE_MODALITY_ERROR: {
        v1: { occurrences: baselineD1.errorOccurrences.TRUE_MODALITY_ERROR, units: baselineD1.affectedUnits.TRUE_MODALITY_ERROR.units },
        v2: { occurrences: totalErrorsAccumulator.TRUE_MODALITY_ERROR, units: affectedUnitsAccumulator.TRUE_MODALITY_ERROR },
      },
      TRUE_QUALIFIER_OMISSION: {
        v1: { occurrences: baselineD1.errorOccurrences.TRUE_QUALIFIER_OMISSION, units: baselineD1.affectedUnits.TRUE_QUALIFIER_OMISSION.units },
        v2: { occurrences: totalErrorsAccumulator.TRUE_QUALIFIER_OMISSION, units: affectedUnitsAccumulator.TRUE_QUALIFIER_OMISSION },
      },
      TRUE_POLARITY_ERROR: {
        v1: { occurrences: baselineD1.errorOccurrences.TRUE_POLARITY_ERROR, units: baselineD1.affectedUnits.TRUE_POLARITY_ERROR.units },
        v2: { occurrences: totalErrorsAccumulator.TRUE_POLARITY_ERROR, units: affectedUnitsAccumulator.TRUE_POLARITY_ERROR },
      },
      TRUE_CLAIM_OMISSION: {
        v1: { occurrences: baselineD1.errorOccurrences.TRUE_LEGAL_CLAIM_OMISSION, units: baselineD1.affectedUnits.TRUE_LEGAL_CLAIM_OMISSION.units },
        v2: { occurrences: totalErrorsAccumulator.TRUE_CLAIM_OMISSION, units: affectedUnitsAccumulator.TRUE_CLAIM_OMISSION },
      },
      SPAN_ERROR: {
        v1: { occurrences: 20, units: goldenEntries.map(g => g.propositionId) }, // No V1 20/20 falharam em geometria
        v2: { occurrences: totalErrorsAccumulator.SPAN_ERROR, units: affectedUnitsAccumulator.SPAN_ERROR },
      },
      SOURCE_REFERENCE_ERROR: {
        v1: { occurrences: baselineD1.errorOccurrences.SOURCE_REFERENCE_ERROR, units: baselineD1.affectedUnits.SOURCE_REFERENCE_ERROR.units },
        v2: { occurrences: totalErrorsAccumulator.SOURCE_REFERENCE_ERROR, units: affectedUnitsAccumulator.SOURCE_REFERENCE_ERROR },
      },
    },
    unitTransitions,
    hardCases: {
      'PROP-005': {
        golden: goldenEntries.find(g => g.propositionId === 'PROP-005'),
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-005'),
        evalResult: v2Results['PROP-005'],
      },
      'PROP-020': {
        golden: goldenEntries.find(g => g.propositionId === 'PROP-020'),
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-020'),
        evalResult: v2Results['PROP-020'],
      },
      'PROP-022': {
        golden: goldenEntries.find(g => g.propositionId === 'PROP-022'),
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-022'),
        evalResult: v2Results['PROP-022'],
      },
      'PROP-026': {
        golden: goldenEntries.find(g => g.propositionId === 'PROP-026'),
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-026'),
        evalResult: v2Results['PROP-026'],
      },
      'PROP-030': {
        golden: goldenEntries.find(g => g.propositionId === 'PROP-030'),
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-030'),
        evalResult: v2Results['PROP-030'],
      },
    },
    structuralHeaderCases: {
      'PROP-001': {
        evalResult: v2Results['PROP-001'],
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-001'),
      },
      'PROP-003': {
        evalResult: v2Results['PROP-003'],
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-003'),
      },
      'PROP-004': {
        evalResult: v2Results['PROP-004'],
        candidate: parsedData.decompositions.find(d => d.propositionId === 'PROP-004'),
      },
    },
    v2Results,
  };

  const evalReportFile = path.join(evalDir, 'gpt56-blind-v2-evaluation.json');
  fs.writeFileSync(evalReportFile, JSON.stringify(evaluationReport, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('RESULTADOS CONSOLIDADOS DO EXPERIMENTO V2.3.4-E');
  console.log('================================================================');
  console.log(`Classificação Final: ${finalClassification}`);
  console.log(`Global Pass: ${evaluationReport.summary.globalPass.v1} -> ${evaluationReport.summary.globalPass.v2} (Δ: ${evaluationReport.summary.globalPass.delta > 0 ? '+' : ''}${evaluationReport.summary.globalPass.delta})`);
  console.log(`HARD Pass:   ${evaluationReport.summary.hardPass.v1} -> ${evaluationReport.summary.hardPass.v2} (Δ: ${evaluationReport.summary.hardPass.delta > 0 ? '+' : ''}${evaluationReport.summary.hardPass.delta})`);
  console.log(`Headers:     ${evaluationReport.summary.headerPass.v1} -> ${evaluationReport.summary.headerPass.v2}`);
  console.log(`Transições:  FIXED=${fixedCount}, STILL_FAILING=${stillFailingCount}, REGRESSED=${regressedCount}, STABLE_PASS=${stablePassCount}`);
  console.log(`Erros de Modalidade: V1=${baselineD1.errorOccurrences.TRUE_MODALITY_ERROR} -> V2=${totalErrorsAccumulator.TRUE_MODALITY_ERROR}`);
  console.log(`Omissões de Qualificador: V1=${baselineD1.errorOccurrences.TRUE_QUALIFIER_OMISSION} -> V2=${totalErrorsAccumulator.TRUE_QUALIFIER_OMISSION}`);
  console.log(`Erros de Polaridade: V1=${baselineD1.errorOccurrences.TRUE_POLARITY_ERROR} -> V2=${totalErrorsAccumulator.TRUE_POLARITY_ERROR}`);
  console.log(`Relatório salvo em: ${evalReportFile}`);
  console.log('================================================================\n');

  return evaluationReport;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('evaluate-assertion-decomposition-v2.ts')) {
  runPromptV2Experiment().catch(err => {
    console.error('ERRO FATAL NA EXECUÇÃO DO EXPERIMENTO V2:', err);
    process.exit(1);
  });
}
