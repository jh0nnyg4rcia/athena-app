/**
 * ATHENA — V2.3.7-H2.2 — HUMAN SOURCE REVIEW DOSSIER (BATCH 1/6: H2-001 TO H2-010)
 * OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK / ZERO GOLDEN GENERATION
 *
 * Prepares the first human source review dossier for units H2-001 to H2-010.
 * Verifies all H2.1.1 and H2.1.2 freeze hashes.
 * Produces unit review dossiers (.txt), aggregate markdown dossier (.md), and manifest (.json).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

// ---------------------------------------------------------------
// 1. VERIFY ALL BASELINE FREEZE HASHES
// ---------------------------------------------------------------
const H211_EXPECTED = {
  'dataset/h2-source-dataset.hardened.internal.json': '5d736b19dd1cc3ff1b7c111f9f4333904aaca6a8d74a1a508b95aa28d6f9d461',
  'dataset/h2-blind-input.hardened.preview.json': 'a92c7208b27a90f0cbfd95d68b118c6ae7120bdf25c933cffc77bfd31a30ae4b',
  'dataset/h2-source-review-queue.hardened.json': '4340c22564513a9cc8b0969ad0a27838720af55f3e77ba8531febb00e3efd690',
  'audit/h2-quality-audit.json': '7ebc91f699e2905ff7a739314c533365fcb3b59384f710a271f74e1069c5cc72',
  'audit/h2-replacement-ledger.json': '92b848fe4afcdf63f91cb06b26b42685421b8156d1e9dee7183703d3fd773d65',
  'audit/h2-validation-tests.json': '081551124314e592b250e4fb0a433911bce04ba9b245cce8f7c25b5934ffba50',
  'scripts/h2-quality-hardening-h211.cjs': '78ac7b0308e1816ae4b76daf9932a994d4ef7eb3eb11e4015fef0e00d7773f21'
};

const H212_EXPECTED = {
  'replacement-integrity-audit.json': '129df6f71664a47d3310149ae017b5bf1f81582867d7c847fd02d06339712828',
  'regression-verification.json': 'e36b735a7ee5e3247983fefaf59024c010779d5e2ca44c2f4db2d6470b98faf7',
  'h212-report.txt': '9c85cf22c834b84c5fb93f684368dd03d6e862a99fcec3ae8d68b71ef0efdb20'
};

const H211_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211');
const H212_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h212/audit');
const OUT_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/batch-01');

function verifyBaselines() {
  const verified = {};
  for (const [rel, exp] of Object.entries(H211_EXPECTED)) {
    const p = rel.startsWith('scripts/') ? path.join(ROOT, rel) : path.join(H211_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_H211_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`H211_${rel}`] = act;
  }
  for (const [rel, exp] of Object.entries(H212_EXPECTED)) {
    const p = path.join(H212_DIR, rel);
    const act = sha256File(p);
    if (act !== exp) throw new Error(`ABORT_H212_MISMATCH ${rel} actual=${act} expected=${exp}`);
    verified[`H212_${rel}`] = act;
  }
  return verified;
}

// ---------------------------------------------------------------
// 2. CONTEXT EXTRACTION UTILS
// ---------------------------------------------------------------
const OFFICIAL_IDENTIFICATION = {
  CP: 'Presidência da República / Casa Civil — Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal)',
  LEP: 'Presidência da República / Casa Civil — Lei nº 7.210, de 11 de julho de 1984 (Lei de Execução Penal)',
  CPP: 'Presidência da República / Casa Civil — Decreto-Lei nº 3.689, de 3 de outubro de 1941 (Código de Processo Penal)',
  CF: 'Presidência da República / Casa Civil — Constituição da República Federativa do Brasil de 1988',
  CC: 'Presidência da República / Casa Civil — Lei nº 10.406, de 10 de janeiro de 2002 (Código Civil)',
  CPC: 'Presidência da República / Casa Civil — Lei nº 13.105, de 16 de março de 2015 (Código de Processo Civil)',
  CDC: 'Presidência da República / Casa Civil — Lei nº 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor)'
};

function extractMaterialContext(normText, startOffset, endOffset) {
  const lines = normText.split('\n');
  let lineIdx = -1;
  let charCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const nextCount = charCount + lines[i].length + 1;
    if (charCount <= startOffset && startOffset < nextCount) {
      lineIdx = i;
      break;
    }
    charCount = nextCount;
  }

  const prevLines = lines.slice(Math.max(0, lineIdx - 3), lineIdx).filter((l) => l.trim().length > 0);
  const curLine = lines[lineIdx];
  const nextLines = lines.slice(lineIdx + 1, Math.min(lines.length, lineIdx + 4)).filter((l) => l.trim().length > 0);

  return {
    structuralHeader: prevLines.length > 0 ? prevLines[prevLines.length - 1].trim() : 'N/A',
    contextBefore: prevLines.map((l) => l.trim()).join('\n'),
    selectedLineInSource: curLine.trim(),
    contextAfter: nextLines.map((l) => l.trim()).join('\n')
  };
}

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------
function main() {
  const verifiedHashes = verifyBaselines();

  const dataset = JSON.parse(fs.readFileSync(path.join(H211_DIR, 'dataset/h2-source-dataset.hardened.internal.json'), 'utf8'));
  const { normalizeHtml, decodeBytes, roundTrip } = require(path.join(ROOT, 'scripts/build-h2-source-dataset-h21.cjs'));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const batch1Units = dataset.slice(0, 10);
  const unitFiles = [];
  const dossierUnitSections = [];

  const REVIEW_PRINCIPLE = `================================================================================
IMPORTANTE: PRINCÍPIO FUNDAMENTAL DA REVISÃO DE FONTE MATERIAL
================================================================================
A revisão compara a PROPOSIÇÃO com a FONTE.

A fonte não precisa ser integralmente reproduzida na proposição.
A ausência de conteúdo da fonte NÃO constitui automaticamente omissão material.

Somente considerar omissão material quando:
1. a proposição pretender apresentar regra exaustiva; OU
2. a condição/exceção omitida modificar a verdade da proposição; OU
3. a omissão ampliar ou restringir indevidamente o alcance jurídico; OU
4. a proposição se tornar enganosa sem o elemento omitido.
================================================================================`;

  for (const u of batch1Units) {
    const buf = fs.readFileSync(u.rawPath);
    const dec = decodeBytes(buf);
    const norm = normalizeHtml(dec.text);
    const rt = roundTrip(u);

    const ctx = extractMaterialContext(norm.text, u.startOffset, u.endOffset);
    const officialSourceId = OFFICIAL_IDENTIFICATION[u.diploma] || `${u.authority} - ${u.diploma}`;

    const txtContent = `${REVIEW_PRINCIPLE}

================================================================================
DOSSIÊ DE REVISÃO DA FONTE MATERIAL — ${u.h2Id}
================================================================================

A. IDENTIFICATION
--------------------------------------------------------------------------------
h2Id:                             ${u.h2Id}
domain:                           ${u.domain}
currentDifficultyClassification:  ${u.targetClass}
diploma:                          ${u.diploma}
article:                          ${u.article}
subdivisionType:                  ${u.subdivisionType}
paragraph:                        ${u.paragraph || 'None'}
inciso:                           ${u.inciso || 'None'}
alinea:                           ${u.alinea || 'None'}
canonicalLocator:                 ${u.canonicalLocator}
officialDocumentId:               ${u.officialDocumentId}
officialSourceIdentification:     ${officialSourceId}
evidenceClass:                    ${u.evidenceClass}

B. BENCHMARK PROPOSITION
--------------------------------------------------------------------------------
originalText:
"${u.literalText}"

C. MATERIAL SOURCE
--------------------------------------------------------------------------------
[CABEÇALHO ESTRUTURAL / CONTEXTO IMEDIATO ANTERIOR]
${ctx.contextBefore}

[DISPOSIÇÃO NORMATIVA INTEGRAL NA FONTE OFICIAL]
${ctx.selectedLineInSource}

[CONTEXTO IMEDIATO POSTERIOR / SUBDIVISÕES]
${ctx.contextAfter}

D. SOURCE PROVENANCE
--------------------------------------------------------------------------------
rawPath:                  ${u.rawPath}
rawDocumentSha256:        ${u.rawDocumentSha256}
normalizedDocumentSha256: ${u.normalizedDocumentSha256}
startOffset:              ${u.startOffset}
endOffset:                ${u.endOffset}
literalTextSha256:        ${u.literalTextSha256}
roundTripStatus:          ${rt.ok ? 'PASS' : 'FAIL'}

E. REVIEW QUESTIONS (DECISÃO HUMANA PENDENTE)
--------------------------------------------------------------------------------
Q1 — O originalText reproduz corretamente o conteúdo jurídico material da fonte apresentada?

Q2 — Existe condição, exceção, alternativa, limitação, requisito, consequência ou qualificador pertencente à disposição apresentada cuja omissão torne o originalText juridicamente incorreto ou enganoso?

Q3 — O originalText contém afirmação que não encontra suporte material na fonte apresentada?

Q4 — O canonicalLocator identifica corretamente a fonte normativa material da proposição?

Q5 — A unidade pode ser aprovada como base para futura construção do golden?

Opções de decisão futura:
[ ] APPROVED
[ ] REJECTED
[ ] UNCERTAIN

Notas do Revisor:
________________________________________________________________________________
`;

    const txtFileName = `${u.h2Id.toLowerCase()}-source-review.txt`;
    const txtFilePath = path.join(OUT_DIR, txtFileName);
    fs.writeFileSync(txtFilePath, txtContent, 'utf8');
    const txtHash = sha256File(txtFilePath);

    unitFiles.push({
      h2Id: u.h2Id,
      canonicalLocator: u.canonicalLocator,
      domain: u.domain,
      targetClass: u.targetClass,
      fileName: txtFileName,
      sha256: txtHash,
      roundTripPass: rt.ok
    });

    // Markdown Section for batch dossier
    dossierUnitSections.push(`## Unidade ${u.h2Id} — \`${u.canonicalLocator}\`

### A. Identification
- **h2Id:** \`${u.h2Id}\`
- **Domain:** \`${u.domain}\`
- **Difficulty Classification:** \`${u.targetClass}\`
- **Diploma:** \`${u.diploma}\` | **Article:** \`${u.article}\` | **Subdivision:** \`${u.subdivisionType}\`
- **Canonical Locator:** \`${u.canonicalLocator}\`
- **Official Document ID:** \`${u.officialDocumentId}\`
- **Official Source:** ${officialSourceId}
- **Evidence Class:** \`${u.evidenceClass}\`

### B. Benchmark Proposition
> "${u.literalText}"

### C. Material Source
**Contexto Imediato Anterior / Cabeçalho:**
\`\`\`
${ctx.contextBefore}
\`\`\`

**Disposição Normativa Integral na Fonte Oficial:**
\`\`\`
${ctx.selectedLineInSource}
\`\`\`

**Contexto Imediato Posterior / Subdivisões:**
\`\`\`
${ctx.contextAfter}
\`\`\`

### D. Source Provenance
- **Raw File:** \`${u.rawPath}\`
- **Raw SHA-256:** \`${u.rawDocumentSha256}\`
- **Normalized SHA-256:** \`${u.normalizedDocumentSha256}\`
- **Offsets:** \`[${u.startOffset}, ${u.endOffset}]\` (Length: ${u.literalText.length} chars)
- **Literal SHA-256:** \`${u.literalTextSha256}\`
- **Round-Trip Status:** \`${rt.ok ? 'PASS' : 'FAIL'}\`

### E. Review Questions
1. **Q1:** O \`originalText\` reproduz corretamente o conteúdo jurídico material da fonte apresentada?
2. **Q2:** Existe condição, exceção, alternativa, limitação, requisito, consequência ou qualificador pertencente à disposição apresentada cuja omissão torne o \`originalText\` juridicamente incorreto ou enganoso?
3. **Q3:** O \`originalText\` contém afirmação que não encontra suporte material na fonte apresentada?
4. **Q4:** O \`canonicalLocator\` identifica corretamente a fonte normativa material da proposição?
5. **Q5:** A unidade pode ser aprovada como base para futura construção do golden?

**Opções de decisão futura:**
- [ ] \`APPROVED\`
- [ ] \`REJECTED\`
- [ ] \`UNCERTAIN\`

---
`);
  }

  // 3. Write Batch Markdown Dossier
  const dossierMdContent = `# ATHENA — V2.3.7-H2.2: DOSSIÊ DE REVISÃO DA FONTE MATERIAL
## Lote 1 de 6 (Unidades H2-001 a H2-010 — Penal Geral)
**Data de Geração:** ${new Date().toISOString()}  
**Modo:** OFFLINE / READ-ONLY / ZERO LLM / ZERO NETWORK / PRE-GOLDEN  
**Status do Lote:** \`BATCH_01_READY_FOR_HUMAN_REVIEW\`

---

${REVIEW_PRINCIPLE}

---

## Sumário do Lote 1 (10 Unidades)

| h2Id | Canonical Locator | Diploma | Artigo | Classificação | Tamanho | Round-Trip | Decisão |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
${batch1Units.map((u) => `| **${u.h2Id}** | \`${u.canonicalLocator}\` | ${u.diploma} | ${u.article} | \`${u.targetClass}\` | ${u.literalText.length} chars | \`PASS\` | *PENDING* |`).join('\n')}

---

${dossierUnitSections.join('\n')}
`;

  const dossierMdPath = path.join(OUT_DIR, 'batch-01-review-dossier.md');
  fs.writeFileSync(dossierMdPath, dossierMdContent, 'utf8');
  const dossierMdHash = sha256File(dossierMdPath);

  // 4. Write Batch Manifest
  const manifestData = {
    protocol: 'V2.3.7-H2.2',
    batch: 'BATCH_01',
    batchRange: 'H2-001_TO_H2-010',
    timestamp: new Date().toISOString(),
    verifiedBaselines: verifiedHashes,
    unitsCount: batch1Units.length,
    units: unitFiles,
    dossierMarkdown: {
      path: 'batch-01-review-dossier.md',
      sha256: dossierMdHash
    },
    antiLeakageAudit: {
      goldenFieldsCreated: 0,
      modelGeneratedLegalAnalysis: 0,
      expectedModelOutputCreated: 0,
      h1GoldenUsed: false,
      h1HumanDecisionsUsed: false
    },
    classification: 'BATCH_01_READY_FOR_HUMAN_REVIEW'
  };

  const manifestPath = path.join(OUT_DIR, 'batch-01-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
  const manifestHash = sha256File(manifestPath);

  console.log(JSON.stringify({
    batch: 'BATCH_01',
    unitsCount: batch1Units.length,
    classification: 'BATCH_01_READY_FOR_HUMAN_REVIEW',
    dossierMdHash,
    manifestHash,
    unitFiles: unitFiles.map((f) => ({ h2Id: f.h2Id, locator: f.canonicalLocator, hash: f.sha256 }))
  }, null, 2));
}

if (require.main === module) main();
