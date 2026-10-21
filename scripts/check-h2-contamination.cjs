/**
 * ATHENA — H2 CONTAMINATION CHECKER
 * MODO: DETERMINÍSTICO / ZERO EMBEDDINGS / ZERO LLM
 *
 * Compara qualquer unidade candidata H2 contra todas as 60 unidades do H1.
 * Critérios:
 * 1. exact text overlap (substring de 30+ caracteres ou texto idêntico)
 * 2. normalized text overlap (cobertura de palavras normalizadas > 50%)
 * 3. same source span (span material de texto idêntico)
 * 4. same article/subsection (mesmo artigo ou subdivisão canônica)
 * 5. same precedent holding (mesmo número de súmula vinculante ou súmula)
 * 6. same material rule (mesmo sujeito + predicado + objeto)
 * 7. same qualifier combination (mesmos qualificadores)
 *
 * Classificação:
 * - CONTAMINATED: se houver overlap textual direto, mesma regra material ou mesmo dispositivo/precedente com mesma regra.
 * - RELATED_BUT_DISTINCT: mesmo diploma (ex: Código Penal), mas artigo e conteúdo completamente distintos.
 * - SAFE_NEW: diploma/artigo/norma completamente novo e ausente no H1.
 */

const fs = require('fs');
const path = require('path');
const { parseCanonicalTarget, compareCanonicalTargets } = require('./run-source-resolver-h2.cjs');

function normalizeStr(s) {
  if (s === null || s === undefined) return '';
  if (typeof s === 'object') {
    s = s.sourceText || s.value || s.text || JSON.stringify(s);
  }
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkUnitContamination(candidateUnit, h1Units, h1Manifest) {
  const candText = normalizeStr(candidateUnit.sourceText || candidateUnit.text || candidateUnit.claim || '');
  const candTarget = parseCanonicalTarget(candidateUnit.legalSourceTarget || candidateUnit.target);

  const list = Array.isArray(h1Units) ? h1Units : ((h1Units && (h1Units.units || h1Units.decompositions)) || []);
  const contaminationSignals = [];

  for (const h1 of list) {
    const h1Id = h1.holdoutId || h1.unitId;
    const h1Text = normalizeStr(h1.originalText || h1.sourceText || '');
    const h1Sources = (h1.officialSources || (h1Manifest && h1Manifest[h1Id] ? h1Manifest[h1Id].officialSources : [])) || [];

    // 1. Exact text overlap (substring contínua de 30+ caracteres ou texto idêntico)
    if (candText && h1Text) {
      if (candText === h1Text) {
        contaminationSignals.push({ level: 'CONTAMINATED', reason: `EXACT_TEXT_MATCH_WITH_${h1Id}` });
      } else if (candText.length >= 30 && h1Text.includes(candText)) {
        contaminationSignals.push({ level: 'CONTAMINATED', reason: `TEXT_SUBSTRING_OF_${h1Id}` });
      } else if (h1Text.length >= 30 && candText.includes(h1Text)) {
        contaminationSignals.push({ level: 'CONTAMINATED', reason: `TEXT_CONTAINS_${h1Id}` });
      }

      // 2. Normalized word overlap
      const cWords = candText.split(/\s+/).filter(w => w.length >= 4);
      const hWords = new Set(h1Text.split(/\s+/).filter(w => w.length >= 4));
      if (cWords.length > 0 && hWords.size > 0) {
        const overlap = cWords.filter(w => hWords.has(w)).length / cWords.length;
        if (overlap >= 0.70) {
          contaminationSignals.push({ level: 'CONTAMINATED', reason: `HIGH_NORMALIZED_TEXT_OVERLAP_WITH_${h1Id}_(${Math.round(overlap * 100)}%)` });
        }
      }
    }

    // 3. Same source span
    for (const src of h1Sources) {
      const srcSpan = normalizeStr(src.materialText || src.rawTextExcerpt || '');
      if (srcSpan && candText && srcSpan.includes(candText) && candText.length >= 30) {
        contaminationSignals.push({ level: 'CONTAMINATED', reason: `EXACT_SOURCE_SPAN_REUSED_FROM_${h1Id}` });
      }
    }

    // 4. Same target / article / precedent
    for (const spec of (h1.assertionSpecs || [])) {
      const h1Target = parseCanonicalTarget(spec.legalSourceTarget);
      if (candTarget && h1Target) {
        const comp = compareCanonicalTargets(candTarget, h1Target);
        if (comp.isMatch) {
          if (comp.status === 'CANONICALIZATION_ONLY') {
            contaminationSignals.push({ level: 'CONTAMINATED', reason: `SAME_EXACT_PROVISION_AS_${h1Id}_(${candTarget.canonicalKey})` });
          } else if (comp.status === 'GRANULARITY_DIFFERENCE') {
            contaminationSignals.push({ level: 'RELATED_BUT_DISTINCT', reason: `SAME_ARTICLE_DIFFERENT_SUBDIVISION_AS_${h1Id}` });
          }
        }
      }

      // 5. Same material rule (sujeito + predicado + objeto)
      if (candidateUnit.subject && spec.subject && candidateUnit.predicate && spec.predicate) {
        const sMatch = normalizeStr(candidateUnit.subject) === normalizeStr(spec.subject);
        const pMatch = normalizeStr(candidateUnit.predicate) === normalizeStr(spec.predicate);
        if (sMatch && pMatch) {
          contaminationSignals.push({ level: 'CONTAMINATED', reason: `SAME_MATERIAL_RULE_CLAIM_WITH_${h1Id}` });
        }
      }
    }
  }

  const hasContaminated = contaminationSignals.some(s => s.level === 'CONTAMINATED');
  const hasRelated = contaminationSignals.some(s => s.level === 'RELATED_BUT_DISTINCT');

  if (hasContaminated) {
    return {
      status: 'CONTAMINATED',
      signals: contaminationSignals.filter(s => s.level === 'CONTAMINATED')
    };
  }
  if (hasRelated) {
    return {
      status: 'RELATED_BUT_DISTINCT',
      signals: contaminationSignals.filter(s => s.level === 'RELATED_BUT_DISTINCT')
    };
  }
  return {
    status: 'SAFE_NEW',
    signals: []
  };
}

module.exports = { checkUnitContamination };
