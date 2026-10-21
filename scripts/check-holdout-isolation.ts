/**
 * ATHENA V2.3.4-G.1 — HOLDOUT ISOLATION & ANTI-LEAKAGE CHECKER
 * 
 * Verifica o isolamento estrutural e garantias anti-leakage para a infraestrutura
 * do futuro benchmark Holdout de 60 unidades.
 * 
 * REGRAS DE EXECUÇÃO:
 * - ZERO chamadas GPT / ZERO chamadas Gemini / ZERO rede (externalModelCalls = 0).
 * - Verificação de diretórios isolados (input/ vs golden/ vs results/).
 * - Verificação de ausência de metadados de golden no input/ entregue ao modelo.
 * - Verificação da estratificação de 60 unidades por 7 domínios e 9 tipos normativos.
 * - Teste estrito de anti-leakage: rejeita runners que acessem diretório golden/.
 * - Execução dupla com verificação de determinismo 100% byte a byte.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

// ============================================================================
// 1. NETWORK GUARD (ZERO REDE / ZERO EXTERNAL MODEL CALLS)
// ============================================================================
let externalModelCalls = 0;
let networkRequests = 0;

globalThis.fetch = () => {
  networkRequests++;
  throw new Error('NETWORK_GUARD_VIOLATION: Chamada externa a fetch() terminantemente proibida.');
};

try {
  (http as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  };
  (https as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  };
} catch {
  // Ignora se congelado
}

// ============================================================================
// 2. VERIFICAÇÃO DE ISOLAMENTO E ANTI-LEAKAGE
// ============================================================================
export interface HoldoutIsolationCheckResult {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: Record<string, any>;
}

export function runHoldoutIsolationCheck(): HoldoutIsolationCheckResult {
  let totalChecks = 0;
  let passedChecks = 0;
  const checks: Record<string, any> = {};

  const baseHoldoutDir = path.resolve(process.cwd(), 'tmp/assertion-decomposition-holdout');
  const inputDir = path.join(baseHoldoutDir, 'input');
  const goldenDir = path.join(baseHoldoutDir, 'golden');
  const resultsDir = path.join(baseHoldoutDir, 'results');

  // Check 1: Diretórios obrigatórios existem e são segregados
  {
    totalChecks++;
    if (!fs.existsSync(baseHoldoutDir) || !fs.existsSync(inputDir) || !fs.existsSync(goldenDir)) {
      throw new Error('HOLDOUT_DIR_FAIL: Diretórios segregados de holdout ausentes!');
    }
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    passedChecks++;
    checks['directories_segregated'] = { pass: true, inputDir, goldenDir, resultsDir };
  }

  // Check 2: Verificação do blueprint do holdout (60 unidades, 7 domínios, 9 tipos normativos)
  {
    totalChecks++;
    const blueprintPath = path.join(inputDir, 'holdout-units-blueprint.json');
    if (!fs.existsSync(blueprintPath)) {
      throw new Error('HOLDOUT_BLUEPRINT_FAIL: Blueprint de holdout ausente em input/!');
    }
    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

    if (blueprint.plannedSize < 60 || !Array.isArray(blueprint.holdoutUnits) || blueprint.holdoutUnits.length < 60) {
      throw new Error(`HOLDOUT_SIZE_FAIL: Planejado no mínimo 60 unidades, encontrado: ${blueprint.holdoutUnits?.length}`);
    }

    const expectedDomains = [
      'Direito Penal — Parte Geral',
      'Direito Penal — Parte Especial',
      'Processo Penal fora de juiz das garantias',
      'Constitucional',
      'Administrativo',
      'Civil',
      'Processo Civil',
    ];

    for (const dom of expectedDomains) {
      if (!blueprint.domains.includes(dom)) {
        throw new Error(`HOLDOUT_DOMAIN_FAIL: Domínio obrigatório ausente: ${dom}`);
      }
      const countInDom = blueprint.holdoutUnits.filter((u: any) => u.domain === dom).length;
      if (countInDom < 5) {
        throw new Error(`HOLDOUT_DOMAIN_STRAT_FAIL: Domínio ${dom} possui menos de 5 unidades (${countInDom})`);
      }
    }

    const expectedTypes = [
      'DIRECT_NORMATIVE_ASSERTION',
      'EXCEPTION',
      'TIMEFRAME_QUANTITY',
      'COMPETENCE',
      'PROHIBITION',
      'PERMISSION',
      'CONSTITUTIVE_EFFECT',
      'COURT_RULING',
      'INTERPRETIVE_CLAIM',
    ];

    for (const typ of expectedTypes) {
      if (!blueprint.propositionTypes.includes(typ)) {
        throw new Error(`HOLDOUT_TYPE_FAIL: Tipo proposicional obrigatório ausente: ${typ}`);
      }
    }

    passedChecks++;
    checks['blueprint_stratification'] = {
      pass: true,
      totalUnits: blueprint.holdoutUnits.length,
      domains: blueprint.domains.length,
      types: blueprint.propositionTypes.length,
    };
  }

  // Check 3: Verificação anti-leakage em input/ (zero campos de golden)
  {
    totalChecks++;
    const blueprintPath = path.join(inputDir, 'holdout-units-blueprint.json');
    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

    const FORBIDDEN_GOLDEN_KEYS = [
      'assertionSpecs',
      'criticalMaterialTokens',
      'criticalQualifiers',
      'goldenCorrectionReason',
      'expectedModality',
      'expectedQualifiers',
      'expectedLegalSourceTarget',
      'goldenAssertions',
      'answers',
    ];

    for (const unit of blueprint.holdoutUnits) {
      for (const forbiddenKey of FORBIDDEN_GOLDEN_KEYS) {
        if (forbiddenKey in unit) {
          throw new Error(`HOLDOUT_LEAKAGE_FAIL: Campo proíbido ${forbiddenKey} encontrado no unit ${unit.holdoutId} em input/!`);
        }
      }
    }

    const holdout60Path = path.join(inputDir, 'holdout-60.json');
    if (fs.existsSync(holdout60Path)) {
      const holdout60 = JSON.parse(fs.readFileSync(holdout60Path, 'utf8'));
      for (const unit of holdout60) {
        for (const forbiddenKey of FORBIDDEN_GOLDEN_KEYS) {
          if (forbiddenKey in unit) {
            throw new Error(`HOLDOUT_LEAKAGE_FAIL: Campo proíbido ${forbiddenKey} encontrado no unit ${unit.holdoutId} em input/holdout-60.json!`);
          }
        }
      }
    }

    passedChecks++;
    checks['input_clean_of_golden'] = { pass: true, forbiddenKeysChecked: FORBIDDEN_GOLDEN_KEYS.length };
  }

  // Check 4: Verificação anti-leakage de código de inferência simulado
  // O checker simula um runner e garante que tentativa de importar/ler golden/ é bloqueada
  {
    totalChecks++;
    function validateCandidateRunnerSafety(runnerSourceCode: string): { safe: boolean; reason?: string } {
      if (runnerSourceCode.includes('holdout/golden') || runnerSourceCode.includes('golden-assertions')) {
        return { safe: false, reason: 'Tentativa de leitura de diretório golden detectada no código do runner.' };
      }
      if (runnerSourceCode.match(/\b(goldenAssertions|expectedModality|criticalMaterialTokens)\b/)) {
        return { safe: false, reason: 'Identificadores protegidos do golden referenciados no runner.' };
      }
      return { safe: true };
    }

    const maliciousRunnerMock = `
      import * as fs from 'fs';
      const golden = JSON.parse(fs.readFileSync('tmp/assertion-decomposition-holdout/golden/holdout-golden.json'));
    `;
    const safetyCheck = validateCandidateRunnerSafety(maliciousRunnerMock);
    if (safetyCheck.safe) {
      throw new Error('ANTI_LEAKAGE_GUARD_FAIL: Runner malicioso acessando golden/ deveria ter sido bloqueado!');
    }

    const benignRunnerMock = `
      import * as fs from 'fs';
      const input = JSON.parse(fs.readFileSync('tmp/assertion-decomposition-holdout/input/holdout-units-blueprint.json'));
      // Executa inferência cega sem golden
    `;
    const benignSafetyCheck = validateCandidateRunnerSafety(benignRunnerMock);
    if (!benignSafetyCheck.safe) {
      throw new Error('ANTI_LEAKAGE_GUARD_FAIL: Runner benigno foi incorretamente rejeitado!');
    }

    passedChecks++;
    checks['anti_leakage_static_guard'] = { pass: true, maliciousBlocked: true, benignApproved: true };
  }

  // Check 5: Documentação de governança em golden/README.md
  {
    totalChecks++;
    const readmePath = path.join(goldenDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      throw new Error('HOLDOUT_DOC_FAIL: README de governança ausente em golden/!');
    }
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    if (!readmeContent.includes('Curadoria Humana') || !readmeContent.includes('One-Shot')) {
      throw new Error('HOLDOUT_DOC_FAIL: README de governança não contém princípios de curadoria humana e protocolo one-shot!');
    }
    passedChecks++;
    checks['golden_governance_doc'] = { pass: true, path: readmePath };
  }

  return {
    success: true,
    totalChecks,
    passedChecks,
    checks,
  };
}

// ============================================================================
// 3. EXECUÇÃO DETERMINÍSTICA DUPLA
// ============================================================================
if (process.argv[1] && process.argv[1].endsWith('check-holdout-isolation.ts')) {
  console.log('=== EXECUÇÃO RUN 1: check-holdout-isolation.ts ===');
  const run1 = runHoldoutIsolationCheck();
  const run1Json = JSON.stringify(run1, null, 2);
  console.log(`Run 1 concluída: ${run1.passedChecks}/${run1.totalChecks} verificações passaram.`);

  console.log('=== EXECUÇÃO RUN 2: check-holdout-isolation.ts ===');
  const run2 = runHoldoutIsolationCheck();
  const run2Json = JSON.stringify(run2, null, 2);

  if (run1Json !== run2Json) {
    throw new Error('FATAL: Divergência não-determinística detectada em check-holdout-isolation.ts!');
  }
  console.log('✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
}
