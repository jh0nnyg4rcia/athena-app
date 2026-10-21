/**
 * ATHENA V2.3.5-C.2 — HUMAN REVIEW DOSSIER GENERATOR
 * 
 * 100% OFFLINE / ZERO LLM / ZERO NETWORK.
 * Gera o dossiê em Markdown para revisão humana independente das 27 unidades críticas.
 */

import * as fs from 'fs';
import * as path from 'path';

export function generateHumanReviewDossier(): string {
  const v235cDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const goldenPath = path.join(v235cDir, 'golden/holdout-60-golden-v235c.json');
  const evidencePath = path.join(v235cDir, 'evidence/evidence-manifest-v235c.json');
  const signoffPath = path.join(v235cDir, 'audit/pre-h1-human-signoff.json');
  const outputPath = path.join(v235cDir, 'audit/pre-h1-human-review-dossier.md');

  const goldenUnits: any[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
  const evidenceManifest: Record<string, any> = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const signoff = JSON.parse(fs.readFileSync(signoffPath, 'utf8'));

  const criticalIds = signoff.units.map((u: any) => u.holdoutId);
  const targetUnits = goldenUnits
    .filter(u => criticalIds.includes(u.holdoutId))
    .sort((a, b) => a.holdoutId.localeCompare(b.holdoutId));

  if (targetUnits.length !== 27) {
    throw new Error(`ESPERADO_27_UNIDADES: Encontrado ${targetUnits.length}`);
  }

  const lines: string[] = [];

  lines.push('# ATHENA — V2.3.5-C.2 — DOSSIÊ DE REVISÃO JURÍDICA HUMANA (PRE-H1)');
  lines.push('');
  lines.push('> [!IMPORTANT]');
  lines.push('> **INSTRUÇÃO PARA O REVISOR HUMANO:**');
  lines.push('> Este dossiê contém exatamente as **27 unidades críticas** do benchmark Holdout-60 V2.3.5-C que exigem auditoria e sign-off formal por jurista humano antes da execução da inferência Candidate H1.');
  lines.push('> Nenhum campo de decisão foi pré-preenchido. Nenhuma aprovação automática de IA foi admitida.');
  lines.push('> Para cada unidade, leia a evidência oficial reproduzida, confira a exatidão das proposições e da decomposição deôntica, e assinale manualmente sua decisão.');
  lines.push('');
  lines.push('## Sumário das 27 Unidades Críticas');
  lines.push('');
  lines.push('| ID | Domínio | Dificuldade | Tipo Proposicional | Critérios de Inclusão |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');

  for (const u of targetUnits) {
    const sMeta = signoff.units.find((su: any) => su.holdoutId === u.holdoutId);
    const criteriaStr = sMeta?.criteriaMet?.join(', ') || 'CRITICAL';
    lines.push(`| **${u.holdoutId}** | ${u.domain} | \`${u.difficulty}\` | \`${u.propositionType}\` | ${criteriaStr} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const u of targetUnits) {
    const ev = evidenceManifest[u.holdoutId];
    const sMeta = signoff.units.find((su: any) => su.holdoutId === u.holdoutId);
    const isHard = u.difficulty === 'HARD';
    const isJur = u.officialSources.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA');
    const isRepl = sMeta?.criteriaMet?.includes('PRE_H1_REPLACEMENT');
    const isCorr = sMeta?.criteriaMet?.includes('PRE_H1_CORRECTION');

    lines.push('--------------------------------------------------');
    lines.push(`## ${u.holdoutId}`);
    lines.push('--------------------------------------------------');
    lines.push('');
    lines.push(`- **DOMAIN:** ${u.domain}`);
    lines.push(`- **DIFFICULTY:** \`${u.difficulty}\``);
    lines.push(`- **PROPOSITION TYPE:** \`${u.propositionType}\``);
    lines.push(`- **REMEDIATION STATUS:** \`${u.remediationStatus}\``);
    lines.push('');
    lines.push('### CRITÉRIOS DE INCLUSÃO');
    lines.push(`- [${isHard ? 'X' : ' '}] HARD`);
    lines.push(`- [${isJur ? 'X' : ' '}] JURISPRUDENCE`);
    lines.push(`- [${isRepl ? 'X' : ' '}] PRE_H1_REPLACEMENT`);
    lines.push(`- [${isCorr ? 'X' : ' '}] PRE_H1_CORRECTION`);
    lines.push('');

    // Destaque visual para casos especiais (Seção 9)
    if (u.holdoutId === 'HOLDOUT-012') {
      lines.push('> [!NOTE]');
      lines.push('> **CASO ESPECIAL: HOLDOUT-012 (ATUALIZAÇÃO LEGISLATIVA — LEI Nº 14.994/2024)**');
      lines.push('> Dispositivo normativo regente: **Código Penal, art. 121-A, § 2º, I** (redação dada pela Lei nº 14.994/2024).');
      lines.push('> O antigo art. 121, § 7º foi expressamente revogado pela Lei nº 14.994/2024. A causa de aumento pelo feminicídio durante gestação/pós-parto passou a constar no art. 121-A, § 2º, I.');
      lines.push('> Confirmar a ausência de resíduo do art. 121, § 7º revogado.');
      lines.push('');
    } else if (u.holdoutId === 'HOLDOUT-017') {
      lines.push('> [!NOTE]');
      lines.push('> **CASO ESPECIAL: HOLDOUT-017 (SUBSTITUIÇÃO PRE-H1 — ESTELIONATO ELETRÔNICO)**');
      lines.push('> Dispositivo normativo regente: **Código Penal, art. 171, § 2º-A e § 2º-B** (fraude eletrônica e aumento por servidor mantido fora do país).');
      lines.push('> Esta unidade substituiu integralmente o leading case contraditado de V2.3.5-A. Prova 100% legislativa direta e verificável.');
      lines.push('> Confirmar a exatidão das penas (reclusão de 4 a 8 anos e multa) e da fração de aumento (1/3 a 2/3).');
      lines.push('');
    } else if (u.holdoutId === 'HOLDOUT-052') {
      lines.push('> [!NOTE]');
      lines.push('> **CASO ESPECIAL: HOLDOUT-052 (SANEAMENTO DEÔNTICO — PRISÃO DE DEPOSITÁRIO INFIEL)**');
      lines.push('> Precedente regente: **STF Súmula Vinculante 25**.');
      lines.push('> Saneamento deôntico aplicado:');
      lines.push('> - `normativeFunction: CONSTITUTIVE_EFFECT`');
      lines.push('> - `modality: DECLARES`');
      lines.push('> - `polarity: NEGATIVE`');
      lines.push('> Confirmar que a anomalia `MUST_NOT` (PROHIBITION em efeito declaratório/constitutivo de nulidade) foi extirpada.');
      lines.push('');
    }

    lines.push('### TEXTO ORIGINAL');
    lines.push('```text');
    lines.push(u.originalText);
    lines.push('```');
    lines.push('');

    lines.push('### FONTE(S) OFICIAL(IS)');
    for (let i = 0; i < u.officialSources.length; i++) {
      const src = u.officialSources[i];
      const evSrc = ev?.officialSources?.[i] || {};
      lines.push(`#### Fonte ${i + 1}`);
      lines.push(`- **Authority:** ${src.authority}`);
      lines.push(`- **Source Type:** ${src.sourceType}`);
      lines.push(`- **Citation:** ${src.citation}`);
      lines.push(`- **Locator:** \`${src.locator}\``);
      lines.push(`- **Official URL:** [${src.officialUrl}](${src.officialUrl})`);
      lines.push(`- **Evidence ID:** \`${evSrc.evidenceId || 'N/A'}\``);
      lines.push(`- **Document ID:** \`${evSrc.documentId || 'N/A'}\``);
      lines.push(`- **Content SHA-256:** \`${evSrc.materialTextSha256 || 'N/A'}\``);
      lines.push('');
      lines.push('**TRECHO MATERIAL DA FONTE:**');
      lines.push('```text');
      lines.push(evSrc.materialText || src.rawTextExcerpt || 'TRECHO NÃO ENCONTRADO');
      lines.push('```');
      lines.push('');

      if (src.sourceType === 'JURISPRUDÊNCIA') {
        const svNumMatch = src.locator?.match(/SV:(\d+)/) || src.citation?.match(/Súmula Vinculante\s*(\d+)/i);
        const svNum = svNumMatch ? svNumMatch[1] : 'N/A';
        lines.push('#### IDENTIDADE DO PRECEDENTE:');
        lines.push(`- **Tribunal:** ${src.authority}`);
        lines.push('- **Tipo:** Súmula Vinculante');
        lines.push(`- **Número:** ${svNum}`);
        lines.push('');
        lines.push('#### TESE/VERBETE OFICIAL:');
        lines.push('```text');
        lines.push(evSrc.materialText || src.rawTextExcerpt);
        lines.push('```');
        lines.push('');
        lines.push('#### DECOMPOSIÇÃO DA TESE:');
        lines.push('Os seguintes claims e assertion specs decorrem diretamente do verbete oficial acima:');
        for (const spec of u.assertionSpecs) {
          lines.push(`- **${spec.assertionId}** (\`${spec.kind}\` | \`${spec.normativeFunction}\` | \`${spec.modality}\`): *"${spec.sourceSpan?.text}"*`);
        }
        lines.push('');
      } else if (src.sourceType === 'LEGISLAÇÃO') {
        lines.push('#### DISPOSITIVO LEGAL ESPECÍFICO:');
        lines.push(`- **Diploma:** ${src.citation}`);
        lines.push(`- **Locator Estruturado:** \`${src.locator}\``);
        lines.push('**Texto Oficial Material Utilizado:**');
        lines.push('```text');
        lines.push(evSrc.materialText || src.rawTextExcerpt);
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('### DECOMPOSIÇÃO GOLDEN');
    lines.push('');
    lines.push('#### Atomic Claims:');
    for (const c of u.atomicClaims) {
      lines.push(`- **Claim ID:** \`${c.claimId}\``);
      lines.push(`  - **Source Span [${c.sourceSpan.start}:${c.sourceSpan.end}]:** *"${c.sourceSpan.text}"*`);
      lines.push(`  - **Normalized Claim:** ${c.normalizedClaim}`);
      lines.push(`  - **Claim Type:** \`${c.claimType}\` | **Materiality:** \`${c.materiality}\``);
    }
    lines.push('');

    lines.push('#### Assertion Specs:');
    for (const s of u.assertionSpecs) {
      lines.push(`- **Assertion ID:** \`${s.assertionId}\` (vinculada a \`${s.claimId}\`)`);
      lines.push(`  - **Source Span [${s.sourceSpan.start}:${s.sourceSpan.end}]:** *"${s.sourceSpan.text}"*`);
      lines.push(`  - **Kind:** \`${s.kind}\``);
      lines.push(`  - **Normative Function:** \`${s.normativeFunction}\``);
      lines.push(`  - **Subject:** ${s.subject}`);
      lines.push(`  - **Predicate:** ${s.predicate}`);
      lines.push(`  - **Object:** ${s.object}`);
      lines.push(`  - **Polarity:** \`${s.polarity}\``);
      lines.push(`  - **Modality:** \`${s.modality}\``);
      lines.push(`  - **Legal Source Target:** \`${s.legalSourceTarget}\``);
      lines.push(`  - **Required Evidence Kind:** \`${s.requiredEvidenceKind}\``);
      if (s.qualifiers && s.qualifiers.length > 0) {
        lines.push('  - **Qualifiers:**');
        for (const q of s.qualifiers) {
          lines.push(`    - \`[${q.type}]\` *"${q.sourceText}"* (valor: \`${q.value}\`)`);
        }
      }
    }
    lines.push('');

    lines.push('#### Qualificadores Globais da Unidade:');
    if (u.criticalQualifiers && u.criticalQualifiers.length > 0) {
      for (const q of u.criticalQualifiers) {
        lines.push(`- \`[${q.type}]\` *"${q.sourceText}"* (valor: \`${q.value}\`, span: [${q.sourceSpan?.start}:${q.sourceSpan?.end}])`);
      }
    } else {
      lines.push('*Nenhum qualificador restritivo declarado.*');
    }
    lines.push('');

    lines.push('#### Tokens Materiais Críticos:');
    if (u.criticalMaterialTokens && u.criticalMaterialTokens.length > 0) {
      lines.push(u.criticalMaterialTokens.map((t: string) => `\`${t}\``).join(', '));
    } else {
      lines.push('*Nenhum token material crítico isolado.*');
    }
    lines.push('');

    // Seção 7: Campos para decisão humana (NÃO AUTOAPROVADOS)
    lines.push('### REVISÃO HUMANA');
    lines.push('');
    lines.push('[ ] Fonte oficial lida');
    lines.push('[ ] Texto original juridicamente correto');
    lines.push('[ ] AtomicClaims corretos');
    lines.push('[ ] AssertionSpecs corretos');
    lines.push('[ ] Qualificadores corretos');
    lines.push('[ ] Modalidade correta');
    lines.push('[ ] Polaridade correta');
    lines.push('[ ] NormativeFunction correta');
    lines.push('[ ] LegalSourceTarget correto');
    lines.push('[ ] Sem adição material não suportada');
    lines.push('[ ] Sem omissão material');
    lines.push('');
    lines.push('**DECISÃO:**');
    lines.push('[ ] APPROVED');
    lines.push('[ ] REJECTED');
    lines.push('[ ] UNCERTAIN');
    lines.push('');
    lines.push('**OBSERVAÇÕES:**');
    lines.push('______________________________________________________________________');
    lines.push('______________________________________________________________________');
    lines.push('');
  }

  const dossierContent = lines.join('\n');
  fs.writeFileSync(outputPath, dossierContent, 'utf8');
  return outputPath;
}

const p = generateHumanReviewDossier();
console.log(`Dossiê gerado com sucesso em: ${p}`);

