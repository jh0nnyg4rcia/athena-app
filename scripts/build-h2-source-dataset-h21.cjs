/**
 * ATHENA — V2.3.7-H2.1 — H2-60 OFFICIAL-SOURCE DATASET BUILDER
 * DETERMINISTIC EXTRACTION ONLY / ZERO LLM / ZERO NETWORK
 *
 * Pipeline:
 *   raw official bytes (27 local docs)
 *   -> deterministic decode + HTML-to-text normalization (offset-preserving, strike-tracking)
 *   -> structural line segmentation (Art. / § / Parágrafo único / SV enunciado)
 *   -> literal span extraction (substring of normalized document; offsets computed by code)
 *   -> exclusions + current-law confidence
 *   -> H1 contamination check (frozen check-h2-contamination.cjs)
 *   -> deterministic stratified selection (H21-SEL-v1)
 *   -> internal dataset / blind preview / review queue / audits
 *
 * No text is paraphrased, completed or rewritten. No golden fields are produced.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------
// 0. FROZEN INFRASTRUCTURE CHECK
// ---------------------------------------------------------------
const FROZEN = {
  'scripts/run-source-resolver-h2.cjs': '0f8737e435248ff033f1e0a11224e8d22d0d761d2ed8a460405dad85ca90297b',
  'scripts/evaluate-source-resolver-h2.cjs': 'af63d0a19b9af72a2c26b308cf47bb5b0793b9cc76686cc702bfc48faf951ce1',
  'scripts/check-h2-contamination.cjs': '35cd672dd903991ca0441ea68dd3b2a7aedadc74e32e48f9d8a6883afc88c551'
};
const H1_BASELINE = {
  golden: { p: 'tmp/assertion-decomposition-holdout-v235d2/golden/holdout-60-golden-v235d2.json', h: '55a08da3b30c0e0bbb078fb01383394133a7e15c3e5b40ff60a36247cfc4bede' },
  parsed: { p: 'tmp/assertion-decomposition-holdout-v236h1/parsed/h1-response.parsed.json', h: 'fef2e91af7b5c48ecfe58dae3edb35346a623f75e2eee4917acae567e86ca2b6' },
  raw: { p: 'tmp/assertion-decomposition-holdout-v236h1/raw/h1-response.raw.json', h: '57058aab1e18ee4eed78164cc273dccd4cb7bd169f5de1677a3d68ca8dbef6ce' },
  h14Frozen: { p: 'tmp/assertion-decomposition-holdout-v236h14/resolver/resolver-output.frozen.json', h: '2ab42f9b289ffbb2ed174f76c9309dd811c2106d8caff0256ed8548694e1b512' }
};
const EVIDENCE_MANIFEST = 'tmp/assertion-decomposition-holdout-v235d2/evidence/evidence-manifest-v235d2.json';

function verifyFrozen() {
  const out = {};
  for (const [p, h] of Object.entries(FROZEN)) {
    const a = sha256(fs.readFileSync(p));
    if (a !== h) throw new Error(`ABORT_FROZEN_INFRA_MISMATCH ${p} ${a}`);
    out[p] = a;
  }
  for (const [k, v] of Object.entries(H1_BASELINE)) {
    const a = sha256(fs.readFileSync(v.p));
    if (a !== v.h) throw new Error(`ABORT_H1_BASELINE_MISMATCH ${k} ${a}`);
    out[v.p] = a;
  }
  return out;
}

// ---------------------------------------------------------------
// 1. CORPUS REGISTRY (identity derived from canonical URL filename only)
// ---------------------------------------------------------------
const CORPUS_DIR = 'tmp/assertion-decomposition-holdout-v235c/official-documents';

// domainRule(articleNumber) -> domain | null
const DOC_RULES = {
  'del2848compilado.htm': { diploma: 'CP', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CODE', domain: (n) => (n <= 120 ? 'PENAL_GERAL' : 'PENAL_ESPECIAL') },
  'del3689compilado.htm': { diploma: 'CPP', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CODE', domain: () => 'PROCESSO_PENAL' },
  'l7210.htm': { diploma: 'LEP', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'PENAL_GERAL' },
  'l8072.htm': { diploma: 'LEI_8072', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'PENAL_ESPECIAL' },
  'l8137.htm': { diploma: 'LEI_8137', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'PENAL_ESPECIAL' },
  'constituicao.htm': { diploma: 'CF', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CONSTITUTION', domain: (n) => (n >= 37 && n <= 41 ? 'ADMINISTRATIVO' : 'CONSTITUCIONAL'), stopMarker: /ATO DAS DISPOSI[ÇC][ÕO]ES CONSTITUCIONAIS TRANSIT[ÓO]RIAS/ },
  'l9868.htm': { diploma: 'LEI_9868', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'CONSTITUCIONAL' },
  'l8112cons.htm': { diploma: 'LEI_8112', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'ADMINISTRATIVO' },
  'l9784.htm': { diploma: 'LEI_9784', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'ADMINISTRATIVO' },
  'l14133.htm': { diploma: 'LEI_14133', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'ADMINISTRATIVO' },
  'l8443.htm': { diploma: 'LEI_8443', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'LAW', domain: () => 'ADMINISTRATIVO' },
  'l10406compilada.htm': { diploma: 'CC', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CODE', domain: () => 'CIVIL' },
  'l8078compilado.htm': { diploma: 'CDC', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CODE', domain: () => 'CIVIL' },
  'l13105.htm': { diploma: 'CPC', authority: 'PRESIDENCIA_DA_REPUBLICA/PLANALTO', kind: 'CODE', domain: () => 'PROCESSO_CIVIL' }
};

function loadCorpus() {
  const docs = [];
  for (const mf of fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.meta.json')).sort()) {
    const meta = JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, mf), 'utf8'));
    const binPath = path.join(CORPUS_DIR, `${meta.rawSha256}.bin`);
    const buf = fs.readFileSync(binPath);
    const actual = sha256(buf);
    if (actual !== meta.rawSha256) throw new Error(`ABORT_CORPUS_HASH_MISMATCH ${binPath}`);
    const urlName = meta.canonicalUrl.split('/').pop();
    let rule = DOC_RULES[urlName] || null;
    let kind = rule ? rule.kind : null;
    if (!rule && /portal\.stf\.jus\.br\/jurisprudencia\/sumariosumulas/.test(meta.canonicalUrl)) {
      rule = { diploma: 'STF_SV', authority: 'STF', kind: 'BINDING_PRECEDENT', domain: () => 'CONSTITUCIONAL' };
      kind = 'BINDING_PRECEDENT';
    }
    const evidenceClass = (meta.provenance === 'REMOTE_OFFICIAL_DOCUMENT_RETRIEVED' || meta.provenance === 'TOOL_GROUNDED')
      ? 'TOOL_GROUNDED'
      : (meta.provenance === 'PREEXISTING_VERIFIED_OFFICIAL_BYTES' || meta.provenance === 'LOCAL_DETERMINISTIC')
      ? 'LOCAL_DETERMINISTIC'
      : 'REJECTED';
    docs.push({
      officialDocumentId: `DOC-${meta.rawSha256.slice(0, 12)}`,
      canonicalUrl: meta.canonicalUrl,
      rawSha256: meta.rawSha256,
      rawPath: binPath.replace(/\\/g, '/'),
      byteLength: buf.length,
      provenance: meta.provenance,
      evidenceClass,
      rule,
      kind,
      buf
    });
  }
  return docs;
}

// ---------------------------------------------------------------
// 2. DETERMINISTIC DECODE + NORMALIZATION (offset-preserving)
// ---------------------------------------------------------------
function decodeBytes(buf) {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(buf), encoding: 'utf-8' };
  } catch (e) {
    return { text: new TextDecoder('windows-1252').decode(buf), encoding: 'windows-1252' };
  }
}

const ENT = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', sect: '§', deg: '°',
  laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', middot: '·',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  agrave: 'à', Agrave: 'À', acirc: 'â', ecirc: 'ê', ocirc: 'ô', Acirc: 'Â', Ecirc: 'Ê', Ocirc: 'Ô',
  atilde: 'ã', otilde: 'õ', Atilde: 'Ã', Otilde: 'Õ', ccedil: 'ç', Ccedil: 'Ç', uuml: 'ü', Uuml: 'Ü', sup1: '¹', sup2: '²', sup3: '³'
};
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return Object.prototype.hasOwnProperty.call(ENT, e) ? ENT[e] : m;
  });
}

const BLOCK_TAGS = new Set(['p', 'br', 'div', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'blockquote', 'dd', 'dt', 'dl', 'center', 'title', 'ul', 'ol', 'section', 'article', 'header', 'footer', 'hr']);
const STRIKE_TAGS = new Set(['strike', 's', 'del']);

function normalizeHtml(html) {
  const out = [];
  const struck = [];
  let depth = 0;
  const push = (ch) => { out.push(ch); struck.push(depth > 0 ? 1 : 0); };
  const last = () => (out.length ? out[out.length - 1] : '\n');
  const nl = () => { if (last() === ' ') { out.pop(); struck.pop(); } if (last() !== '\n') push('\n'); };
  const sp = () => { const l = last(); if (l !== ' ' && l !== '\n') push(' '); };
  const re = /<!--[\s\S]*?-->|<script[\s\S]*?<\/script\s*>|<style[\s\S]*?<\/style\s*>|<[^>]*>|[^<]+/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tok = m[0];
    if (tok.startsWith('<!--') || /^<script/i.test(tok) || /^<style/i.test(tok)) continue;
    if (tok[0] === '<') {
      const nm = /^<\s*(\/?)\s*([a-zA-Z0-9]+)/.exec(tok);
      if (!nm) continue;
      const closing = nm[1] === '/';
      const name = nm[2].toLowerCase();
      if (STRIKE_TAGS.has(name)) depth = Math.max(0, depth + (closing ? -1 : 1));
      if (BLOCK_TAGS.has(name)) nl();
      else if (name === 'td' || name === 'th') sp();
      continue;
    }
    const text = decodeEntities(tok);
    for (const ch of text) {
      if (/\s/.test(ch) || ch === '\u00a0') sp();
      else push(ch);
    }
  }
  while (out.length && (last() === ' ' || last() === '\n')) { out.pop(); struck.pop(); }
  // Expand struck flags per UTF-16 code unit so offsets align with JS string indices.
  const text = out.join('');
  const flags = new Uint8Array(text.length);
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    for (let k = 0; k < out[i].length; k++) flags[idx++] = struck[i];
  }
  return { text, struckFlags: flags };
}

function normalizeDocument(doc) {
  const dec = decodeBytes(doc.buf);
  const norm = normalizeHtml(dec.text);
  return { encoding: dec.encoding, normalizedText: norm.text, struckFlags: norm.struckFlags, normalizedSha256: sha256(norm.text) };
}

// ---------------------------------------------------------------
// 3. STRUCTURAL SEGMENTATION + LITERAL EXTRACTION
// ---------------------------------------------------------------
const ART_RE = /^Art\.?\s*(\d{1,4})(?:\.(\d{3}))?\s*[ºo°˚]?(?:-([A-Z]))?\s*[\.\-–—:]?\s*/;
const PAR_RE = /^§\s*(\d{1,3})\s*[ºo°˚]?(?:-([A-Z]))?\s*[\.\-–—]?\s*/;
const PARUN_RE = /^Par[áa]grafo\s+[úu]nico\s*[\.\-–—:]?\s*/i;
const ANNOT_RE = /\((?:\s*)(Reda[çc][ãa]o\s+dad|Inclu[íi]d|Vide|Revogad|Vetad|Acrescid|Renumerad|Alterad|Regulament|Express[ãa]o|Prorroga|Promulga|Produ[çc][ãa]o de efeito|Vig[êe]ncia|Suspens|Declarad|Revoga)/i;
const HISTORICAL_RE = /revogad|vetad|\(revoga/i;
const UNRESOLVED_RE = /\(\s*Vide\s+(ADI|ADC|ADPF|ADIN|RE\b|Decis)|suspens[ãa]o\s+de\s+efic|declarad[oa]\s+inconstitucional|\(\s*Suspens/i;

function splitLines(text) {
  const lines = [];
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === '\n') {
      lines.push({ start, end: i });
      start = i + 1;
    }
  }
  return lines;
}

function artKey(num, thousands, suffix) {
  const n = thousands ? `${num}${thousands}` : num;
  return { key: `${n}${suffix || ''}`, number: parseInt(n, 10), suffix: suffix || '' };
}

function literalBounds(text, contentStart, lineEnd) {
  // literal span = content after structural prefix, up to (excluding) the first legislative annotation.
  const raw = text.slice(contentStart, lineEnd);
  const a = ANNOT_RE.exec(raw);
  let end = a ? contentStart + a.index : lineEnd;
  while (end > contentStart && /\s/.test(text[end - 1])) end--;
  return end;
}

function extractFromStatute(doc, norm) {
  const { normalizedText: T, struckFlags: S } = norm;
  const lines = splitLines(T);
  const units = [];
  let art = null;
  for (let li = 0; li < lines.length; li++) {
    let { start, end } = lines[li];
    while (start < end && T[start] === ' ') start++;
    const line = T.slice(start, end);
    if (doc.rule.stopMarker && doc.rule.stopMarker.test(line)) break;
    let m;
    let subdivisionType = null;
    let paragraph = null;
    let contentStart = null;
    if ((m = ART_RE.exec(line))) {
      art = artKey(m[1], m[2], m[3]);
      art.struck = S[start] === 1;
      subdivisionType = 'ARTICLE_CAPUT';
      contentStart = start + m[0].length;
    } else if (art && (m = PAR_RE.exec(line))) {
      subdivisionType = 'PARAGRAPH';
      paragraph = `${m[1]}${m[2] || ''}`;
      contentStart = start + m[0].length;
    } else if (art && (m = PARUN_RE.exec(line))) {
      subdivisionType = 'PARAGRAPH';
      paragraph = 'UNICO';
      contentStart = start + m[0].length;
    } else {
      continue;
    }
    let lineEnd = end;
    let literalEnd = literalBounds(T, contentStart, lineEnd);
    let extendedWithPena = false;
    // Contiguous extension: "...:" immediately followed by a "Pena -" line (penal sanction of the same provision).
    if (T.slice(contentStart, literalEnd).trim().endsWith(':') && li + 1 < lines.length) {
      let ns = lines[li + 1].start;
      while (ns < lines[li + 1].end && T[ns] === ' ') ns++;
      if (/^Pena\s*[-–—]/.test(T.slice(ns, lines[li + 1].end))) {
        lineEnd = lines[li + 1].end;
        literalEnd = literalBounds(T, ns, lineEnd);
        extendedWithPena = true;
      }
    }
    const fullLine = T.slice(start, lineEnd);
    const literalText = T.slice(contentStart, literalEnd);
    let struckInSpan = false;
    for (let i = start; i < literalEnd; i++) if (S[i]) { struckInSpan = true; break; }
    const locator = `${doc.rule.diploma}_ART_${art.key}${paragraph ? (paragraph === 'UNICO' ? '_PAR_UNICO' : `_PAR_${paragraph}`) : ''}`;
    units.push({
      officialDocumentId: doc.officialDocumentId,
      diploma: doc.rule.diploma,
      authority: doc.rule.authority,
      rawDocumentSha256: doc.rawSha256,
      article: art.key,
      articleNumber: art.number,
      paragraph,
      inciso: null,
      alinea: null,
      item: null,
      subdivisionType,
      structuralParent: paragraph ? `${doc.rule.diploma}_ART_${art.key}` : doc.rule.diploma,
      canonicalLocator: locator,
      domain: doc.rule.domain(art.number),
      startOffset: contentStart,
      endOffset: literalEnd,
      literalText,
      extendedWithPena,
      markers: {
        struckInSpan,
        articleHeaderStruck: !!art.struck,
        historicalMarker: HISTORICAL_RE.test(fullLine),
        unresolvedMarker: UNRESOLVED_RE.test(fullLine)
      }
    });
  }
  return units;
}

function extractFromStfPage(doc, norm) {
  // Literal enunciado extraction: the text following the first "Súmula Vinculante <n>" heading, up to the line end.
  const T = norm.normalizedText;
  const lines = splitLines(T);
  for (let li = 0; li < lines.length; li++) {
    const { start, end } = lines[li];
    const line = T.slice(start, end);
    const m = /^\s*S[úu]mula\s+Vinculante\s+(\d{1,3})\s*$/i.exec(line);
    if (!m) continue;
    // next non-empty line is the enunciado
    for (let lj = li + 1; lj < Math.min(lines.length, li + 4); lj++) {
      let s = lines[lj].start;
      const e = lines[lj].end;
      while (s < e && T[s] === ' ') s++;
      if (e - s < 20) continue;
      let le = e;
      while (le > s && /\s/.test(T[le - 1])) le--;
      return [{
        officialDocumentId: doc.officialDocumentId,
        diploma: 'STF_SV',
        authority: 'STF',
        rawDocumentSha256: doc.rawSha256,
        article: null, articleNumber: parseInt(m[1], 10), paragraph: null, inciso: null, alinea: null, item: null,
        subdivisionType: 'BINDING_PRECEDENT_ENUNCIADO',
        structuralParent: 'STF_SUMULAS_VINCULANTES',
        canonicalLocator: `STF_SV_${m[1]}`,
        domain: doc.rule.domain(),
        startOffset: s,
        endOffset: le,
        literalText: T.slice(s, le),
        extendedWithPena: false,
        markers: { struckInSpan: false, articleHeaderStruck: false, historicalMarker: /cancelad|revogad/i.test(T.slice(s, le)), unresolvedMarker: false }
      }];
    }
  }
  return [];
}

// ---------------------------------------------------------------
// 4. EXCLUSIONS, CURRENT-LAW CONFIDENCE, COMPLEXITY FEATURES
// ---------------------------------------------------------------
const DEP_PAR_RE = /\bcaput\b|par[áa]grafo\s+anterior|artigo\s+anterior|neste\s+artigo|deste\s+artigo|no\s+inciso|nos\s+incisos|na\s+hip[óo]tese\s+(do|dos|da|das|prevista|referida)|no\s+par[áa]grafo|referid[oa]s?\s+no/i;
const DEP_CAPUT_RE = /artigo\s+anterior|\bno\s+caput\b|par[áa]grafo\s+anterior/i;

function exclusionReason(u) {
  const t = u.literalText.trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (u.diploma === 'CPP' && u.articleNumber === 3 && /^[A-F]$/.test(u.article.replace(/^\d+/, ''))) return 'JUDGE_OF_GUARANTEES_CPP_3A_3F';
  if (/juiz(es)?\s+das\s+garantias/i.test(t)) return 'JUDGE_OF_GUARANTEES_TEXT';
  if (!u.domain) return 'NO_DOMAIN_RULE';
  if (words.length < 8) return 'TOO_SHORT_OR_EDITORIAL';
  if (/^\(?\s*(revogad|vetad)/i.test(t)) return 'REVOKED_OR_VETOED_PLACEHOLDER';
  if (t.endsWith(':') || t.endsWith(';') || t.endsWith(',')) return 'DEPENDENT_ENUMERATION_FRAGMENT';
  if (!/[\.\)]$/.test(t)) return 'NO_TERMINAL_PUNCTUATION';
  if (u.subdivisionType === 'PARAGRAPH' && DEP_PAR_RE.test(t)) return 'DEPENDS_ON_OMITTED_TEXT';
  if (u.subdivisionType === 'ARTICLE_CAPUT' && DEP_CAPUT_RE.test(t)) return 'DEPENDS_ON_OMITTED_TEXT';
  return null;
}

function currentTextConfidence(u, dupCount) {
  if (u.markers.struckInSpan || u.markers.articleHeaderStruck || u.markers.historicalMarker) return 'POSSIBLY_HISTORICAL';
  if (u.markers.unresolvedMarker || dupCount > 1) return 'UNRESOLVED';
  return 'STRUCTURALLY_CURRENT';
}

function complexityFeatures(t) {
  const c = (re) => (t.match(re) || []).length;
  const numberOfConditions = c(/\b(se|caso|desde\s+que|quando|enquanto|sempre\s+que|salvo\s+se)\b/gi);
  const numberOfExceptions = c(/\b(salvo|exceto|ressalvad[oa]s?|sem\s+preju[íi]zo|todavia|n[ãa]o\s+se\s+aplica)/gi);
  const numberOfSubdivisions = c(/§|\bincisos?\b|\bal[íi]neas?\b|\bpar[áa]grafos?\b/gi);
  const numberOfCrossReferences = c(/\bart(?:igo)?s?\.?\s*\d+|\bLei\s+n|\bdeste\s+C[óo]digo|\bdesta\s+Lei|\bConstitui[çc][ãa]o/gi);
  const numberOfAlternativeClauses = c(/\s(ou|nem)\s/gi);
  const textLength = t.length;
  const containsConditionalMarker = numberOfConditions > 0;
  const containsExceptionMarker = numberOfExceptions > 0;
  const structuralComplexityScore = numberOfConditions + 2 * numberOfExceptions + numberOfSubdivisions + numberOfCrossReferences + numberOfAlternativeClauses + (textLength > 300 ? 1 : 0);
  return { numberOfConditions, numberOfExceptions, numberOfSubdivisions, numberOfCrossReferences, numberOfAlternativeClauses, textLength, containsConditionalMarker, containsExceptionMarker, structuralComplexityScore };
}

// ---------------------------------------------------------------
// 5. H1 CONTAMINATION (frozen checker + explicit audit fields)
// ---------------------------------------------------------------
const normTxt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

function buildH1Context() {
  const { checkUnitContamination } = require(path.join(ROOT, 'scripts/check-h2-contamination.cjs'));
  const { parseCanonicalTarget, compareCanonicalTargets } = require(path.join(ROOT, 'scripts/run-source-resolver-h2.cjs'));
  const golden = JSON.parse(fs.readFileSync(H1_BASELINE.golden.p, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(EVIDENCE_MANIFEST, 'utf8'));
  const h1Texts = golden.map((u) => ({ id: u.holdoutId, t: normTxt(u.originalText) }));
  const h1Spans = [];
  for (const u of golden) for (const s of (u.officialSources || [])) if (s.rawTextExcerpt) h1Spans.push({ id: u.holdoutId, t: normTxt(s.rawTextExcerpt) });
  for (const [id, v] of Object.entries(manifest)) for (const s of (v.officialSources || [])) if (s.materialText) h1Spans.push({ id, t: normTxt(s.materialText) });
  const h1Targets = [];
  for (const u of golden) for (const s of u.assertionSpecs) h1Targets.push({ id: u.holdoutId, p: parseCanonicalTarget(s.legalSourceTarget) });
  return { checkUnitContamination, parseCanonicalTarget, compareCanonicalTargets, golden, manifest, h1Texts, h1Spans, h1Targets };
}

function contaminationAudit(u, ctx) {
  const lt = normTxt(u.literalText);
  const res = ctx.checkUnitContamination({ sourceText: u.literalText, legalSourceTarget: u.canonicalLocator }, ctx.golden, ctx.manifest);
  let exact = false;
  let maxOverlap = 0;
  const cw = lt.split(' ').filter((w) => w.length >= 4);
  for (const h of ctx.h1Texts) {
    if (h.t === lt || (lt.length >= 30 && h.t.includes(lt)) || (h.t.length >= 30 && lt.includes(h.t))) exact = true;
    if (cw.length) {
      const hs = new Set(h.t.split(' ').filter((w) => w.length >= 4));
      const ov = cw.filter((w) => hs.has(w)).length / cw.length;
      if (ov > maxOverlap) maxOverlap = ov;
    }
  }
  let sameSpan = false;
  for (const s of ctx.h1Spans) {
    if ((lt.length >= 30 && s.t.includes(lt)) || (s.t.length >= 30 && lt.includes(s.t))) { sameSpan = true; break; }
  }
  const cp = ctx.parseCanonicalTarget(u.canonicalLocator);
  let sameLocator = false;
  let sameArticle = false;
  for (const h of ctx.h1Targets) {
    const c = ctx.compareCanonicalTargets(cp, h.p);
    if (c.isMatch && c.status === 'CANONICALIZATION_ONLY') sameLocator = true;
    if (c.isMatch) sameArticle = true;
  }
  const sameMaterialRule = res.signals.some((s) => /SAME_MATERIAL_RULE/.test(s.reason));
  let status = res.status;
  // Stricter layer: any exact/span/locator/high-overlap hit is CONTAMINATED regardless of checker output.
  if (exact || sameSpan || sameLocator || sameMaterialRule || maxOverlap >= 0.7) status = 'CONTAMINATED';
  else if (sameArticle && status === 'SAFE_NEW') status = 'RELATED_BUT_DISTINCT';
  return {
    contaminationStatus: status,
    checkerStatus: res.status,
    checkerSignals: res.signals.map((s) => s.reason),
    exactTextOverlapWithH1: exact,
    normalizedOverlapWithH1: Math.round(maxOverlap * 1000) / 1000,
    sameLocatorAsH1: sameLocator,
    sameArticleAsH1: sameArticle,
    sameSourceSpanAsH1: sameSpan,
    sameMaterialRuleDetected: sameMaterialRule
  };
}

// ---------------------------------------------------------------
// 6. DETERMINISTIC SELECTION — H21-SEL-v1
// ---------------------------------------------------------------
const SELECTION_ALGORITHM_VERSION = 'H21-SEL-v1';
const SELECTION_ALGORITHM_SPEC = [
  '1. Eligible = STRUCTURALLY_CURRENT && not excluded && contaminationStatus in {SAFE_NEW, RELATED_BUT_DISTINCT}.',
  '2. Exact duplicates by literalTextSha256 removed (keep smallest candidateId).',
  '3. Group eligible candidates by (officialDocumentId, article); one representative per group: SAFE_NEW > RELATED_BUT_DISTINCT, then ARTICLE_CAPUT > PARAGRAPH, then smallest literalTextSha256.',
  '4. Per domain, quota allocated round-robin across documents sorted by diploma code, skipping documents without remaining groups.',
  '5. Per document with allocation k: groups sorted by (articleNumber, article key); split into k contiguous positional bins of near-equal size; from each bin choose the representative with SAFE_NEW first, then smallest literalTextSha256.',
  '6. Near-duplicate guard: token-Jaccard >= 0.80 between any two selected units => later unit replaced by next-smallest-sha candidate in its bin.',
  '7. h2Id assigned by fixed domain order, then diploma, then article order.'
].join(' ');
const DOMAIN_ORDER = ['PENAL_GERAL', 'PENAL_ESPECIAL', 'PROCESSO_PENAL', 'CONSTITUCIONAL', 'ADMINISTRATIVO', 'CIVIL', 'PROCESSO_CIVIL'];
const QUOTAS = { PENAL_GERAL: 10, PENAL_ESPECIAL: 8, PROCESSO_PENAL: 12, CONSTITUCIONAL: 8, ADMINISTRATIVO: 8, CIVIL: 7, PROCESSO_CIVIL: 7 };

const tokens = (s) => new Set(normTxt(s).split(' ').filter((w) => w.length >= 3));
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const repRank = (c) => [c.contaminationStatus === 'SAFE_NEW' ? 0 : 1, c.subdivisionType === 'ARTICLE_CAPUT' ? 0 : 1];

function selectDataset(eligible) {
  const groups = new Map();
  for (const c of eligible) {
    const k = `${c.domain}|${c.officialDocumentId}|${c.article ?? c.canonicalLocator}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const reps = [];
  for (const arr of groups.values()) {
    arr.sort((a, b) => {
      const ra = repRank(a), rb = repRank(b);
      return ra[0] - rb[0] || ra[1] - rb[1] || cmpStr(a.literalTextSha256, b.literalTextSha256);
    });
    reps.push({ rep: arr[0], alternates: arr.slice(1) });
  }
  const selected = [];
  const selectionTrace = {};
  for (const domain of DOMAIN_ORDER) {
    const dReps = reps.filter((r) => r.rep.domain === domain);
    const byDoc = new Map();
    for (const r of dReps) {
      const d = r.rep.diploma;
      if (!byDoc.has(d)) byDoc.set(d, []);
      byDoc.get(d).push(r);
    }
    const docKeys = [...byDoc.keys()].sort();
    for (const d of docKeys) byDoc.get(d).sort((a, b) => a.rep.articleNumber - b.rep.articleNumber || cmpStr(String(a.rep.article), String(b.rep.article)));
    const alloc = Object.fromEntries(docKeys.map((d) => [d, 0]));
    let remaining = QUOTAS[domain];
    let progress = true;
    while (remaining > 0 && progress) {
      progress = false;
      for (const d of docKeys) {
        if (remaining === 0) break;
        if (alloc[d] < byDoc.get(d).length) { alloc[d]++; remaining--; progress = true; }
      }
    }
    selectionTrace[domain] = { allocation: alloc, unfilled: remaining, poolGroups: Object.fromEntries(docKeys.map((d) => [d, byDoc.get(d).length])) };
    for (const d of docKeys) {
      const list = byDoc.get(d);
      const k = alloc[d];
      for (let b = 0; b < k; b++) {
        const lo = Math.floor((b * list.length) / k);
        const hi = Math.floor(((b + 1) * list.length) / k);
        const bin = list.slice(lo, hi).map((r) => r.rep).sort((x, y) => (x.contaminationStatus === 'SAFE_NEW' ? 0 : 1) - (y.contaminationStatus === 'SAFE_NEW' ? 0 : 1) || cmpStr(x.literalTextSha256, y.literalTextSha256));
        let chosen = null;
        for (const cand of bin) {
          const tk = tokens(cand.literalText);
          if (selected.every((s) => jaccard(tk, tokens(s.literalText)) < 0.8)) { chosen = cand; break; }
        }
        if (chosen) selected.push(chosen);
        else selectionTrace[domain].unfilled++;
      }
    }
  }
  return { selected, selectionTrace, groupCount: groups.size };
}

// ---------------------------------------------------------------
// 7. ROUND-TRIP VERIFICATION (independent re-read of raw bytes)
// ---------------------------------------------------------------
function roundTrip(unit) {
  const buf = fs.readFileSync(unit.rawPath);
  if (sha256(buf) !== unit.rawDocumentSha256) return { ok: false, reason: 'RAW_SHA_MISMATCH' };
  const dec = decodeBytes(buf);
  if (dec.encoding !== unit.decodeEncoding) return { ok: false, reason: 'ENCODING_MISMATCH' };
  const norm = normalizeHtml(dec.text);
  if (sha256(norm.text) !== unit.normalizedDocumentSha256) return { ok: false, reason: 'NORMALIZED_SHA_MISMATCH' };
  const sub = norm.text.substring(unit.startOffset, unit.endOffset);
  if (sub !== unit.literalText) return { ok: false, reason: 'SUBSTRING_MISMATCH' };
  if (sha256(sub) !== unit.literalTextSha256) return { ok: false, reason: 'LITERAL_SHA_MISMATCH' };
  return { ok: true };
}

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------
function main() {
  const OUT = 'tmp/assertion-decomposition-holdout-v237h21';
  const infraHashes = verifyFrozen();
  const docs = loadCorpus();
  const ctx = buildH1Context();

  const corpusManifest = [];
  let raw = [];
  for (const doc of docs) {
    const norm = normalizeDocument(doc);
    let units = [];
    if (doc.evidenceClass === 'REJECTED' || !doc.rule) units = [];
    else if (doc.kind === 'BINDING_PRECEDENT') units = extractFromStfPage(doc, norm);
    else units = extractFromStatute(doc, norm);
    for (const u of units) {
      u.rawPath = doc.rawPath;
      u.decodeEncoding = norm.encoding;
      u.normalizedDocumentSha256 = norm.normalizedSha256;
      u.offsetRepresentation = 'NORMALIZED_TEXT_H21_V1';
      u.evidenceClass = doc.evidenceClass;
      u.literalTextSha256 = sha256(u.literalText);
    }
    corpusManifest.push({
      officialDocumentId: doc.officialDocumentId,
      canonicalUrl: doc.canonicalUrl,
      authority: doc.rule ? doc.rule.authority : 'UNMAPPED',
      diploma: doc.rule ? doc.rule.diploma : null,
      documentKind: doc.kind,
      rawSha256: doc.rawSha256,
      byteLength: doc.byteLength,
      provenance: doc.provenance,
      evidenceClass: doc.evidenceClass,
      decodeEncoding: norm.encoding,
      normalizedSha256: norm.normalizedSha256,
      normalizedLength: norm.normalizedText.length,
      struckCharCount: norm.struckFlags.reduce((a, b) => a + b, 0),
      extractedUnits: units.length,
      precedentIdentityDerivedFromContent: doc.kind === 'BINDING_PRECEDENT' && units[0] ? units[0].canonicalLocator : null,
      mappingStatus: doc.rule ? 'MAPPED' : 'UNMAPPED_EXCLUDED'
    });
    raw = raw.concat(units);
  }

  // Duplicate-locator detection (among non-historical units) for current-law safety.
  const locCount = new Map();
  for (const u of raw) {
    const hist = u.markers.struckInSpan || u.markers.articleHeaderStruck || u.markers.historicalMarker;
    if (!hist) locCount.set(u.canonicalLocator, (locCount.get(u.canonicalLocator) || 0) + 1);
  }

  raw.forEach((u, i) => { u.candidateId = `H21C-${String(i + 1).padStart(5, '0')}`; });
  for (const u of raw) {
    u.exclusionReason = exclusionReason(u);
    u.currentTextConfidence = currentTextConfidence(u, locCount.get(u.canonicalLocator) || 0);
    u.structuralComplexity = complexityFeatures(u.literalText);
    u.contamination = (!u.exclusionReason && u.currentTextConfidence === 'STRUCTURALLY_CURRENT') ? contaminationAudit(u, ctx) : null;
    u.contaminationStatus = u.contamination ? u.contamination.contaminationStatus : 'NOT_EVALUATED';
  }

  // Exact duplicate removal by literal hash (eligible set only).
  const seen = new Map();
  let duplicatesRemoved = 0;
  const eligible = [];
  for (const u of raw) {
    if (u.exclusionReason || u.currentTextConfidence !== 'STRUCTURALLY_CURRENT') continue;
    if (!['SAFE_NEW', 'RELATED_BUT_DISTINCT'].includes(u.contaminationStatus)) continue;
    if (seen.has(u.literalTextSha256)) { duplicatesRemoved++; u.duplicateOf = seen.get(u.literalTextSha256); continue; }
    seen.set(u.literalTextSha256, u.candidateId);
    eligible.push(u);
  }

  const { selected, selectionTrace, groupCount } = selectDataset(eligible);

  // Counts per domain
  const counts = {};
  const bump = (d, k) => { counts[d] = counts[d] || { rawExtracted: 0, excluded: 0, quarantinedHistorical: 0, quarantinedUnresolved: 0, contaminated: 0, relatedButDistinct: 0, safeNew: 0, duplicatesRemoved: 0, eligibleAfterDedup: 0, finalSelected: 0 }; counts[d][k]++; };
  const exclusionBreakdown = {};
  for (const u of raw) {
    const d = u.domain || 'UNASSIGNED';
    bump(d, 'rawExtracted');
    if (u.exclusionReason) { bump(d, 'excluded'); exclusionBreakdown[u.exclusionReason] = (exclusionBreakdown[u.exclusionReason] || 0) + 1; continue; }
    if (u.currentTextConfidence === 'POSSIBLY_HISTORICAL') { bump(d, 'quarantinedHistorical'); continue; }
    if (u.currentTextConfidence === 'UNRESOLVED') { bump(d, 'quarantinedUnresolved'); continue; }
    if (u.contaminationStatus === 'CONTAMINATED') bump(d, 'contaminated');
    else if (u.contaminationStatus === 'RELATED_BUT_DISTINCT') bump(d, 'relatedButDistinct');
    else if (u.contaminationStatus === 'SAFE_NEW') bump(d, 'safeNew');
    if (u.duplicateOf) bump(d, 'duplicatesRemoved');
  }
  for (const u of eligible) bump(u.domain, 'eligibleAfterDedup');

  // Assign h2Ids
  selected.sort((a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain) || cmpStr(a.diploma, b.diploma) || a.articleNumber - b.articleNumber || cmpStr(a.canonicalLocator, b.canonicalLocator));
  selected.forEach((u, i) => { u.h2Id = `H2-${String(i + 1).padStart(3, '0')}`; bump(u.domain, 'finalSelected'); counts[u.domain].eligibleAfterDedup--; });
  for (const d of Object.keys(counts)) counts[d].eligibleAfterDedup = eligible.filter((u) => u.domain === d).length;

  const internal = selected.map((u) => ({
    h2Id: u.h2Id,
    candidateId: u.candidateId,
    domain: u.domain,
    officialDocumentId: u.officialDocumentId,
    authority: u.authority,
    diploma: u.diploma,
    canonicalLocator: u.canonicalLocator,
    structuralParent: u.structuralParent,
    subdivisionType: u.subdivisionType,
    article: u.article,
    paragraph: u.paragraph,
    inciso: u.inciso,
    alinea: u.alinea,
    item: u.item,
    rawDocumentSha256: u.rawDocumentSha256,
    rawPath: u.rawPath,
    decodeEncoding: u.decodeEncoding,
    offsetRepresentation: u.offsetRepresentation,
    normalizedDocumentSha256: u.normalizedDocumentSha256,
    startOffset: u.startOffset,
    endOffset: u.endOffset,
    literalText: u.literalText,
    literalTextSha256: u.literalTextSha256,
    extendedWithPena: u.extendedWithPena,
    evidenceClass: u.evidenceClass,
    currentTextConfidence: u.currentTextConfidence,
    structuralComplexityCandidate: u.structuralComplexity,
    antiOverfitting: u.contamination
  }));

  // Validation tests
  const rt = internal.map((u) => ({ h2Id: u.h2Id, ...roundTrip(u) }));
  const blind = internal.map((u) => ({ h2Id: u.h2Id, originalText: u.literalText }));
  const forbiddenKeys = ['domain', 'difficulty', 'source', 'authority', 'diploma', 'article', 'paragraph', 'inciso', 'precedent', 'golden', 'expected', 'evidence', 'locator', 'hash', 'sha', 'h1'];
  const blindKeyViolations = [];
  for (const b of blind) for (const k of Object.keys(b)) if (!['h2Id', 'originalText'].includes(k)) blindKeyViolations.push(`${b.h2Id}:${k}`);
  const blindValueLeaks = [];
  const hexRe = /\b[0-9a-f]{40,64}\b/i;
  for (const b of blind) {
    if (hexRe.test(b.originalText)) blindValueLeaks.push(`${b.h2Id}:HEX_HASH_IN_TEXT`);
    if (/\b(CP|CPP|CF|CC|CPC|CDC|LEP|LEI|STF_SV)_ART_|STF_SV_\d/.test(b.originalText)) blindValueLeaks.push(`${b.h2Id}:CANONICAL_LOCATOR_IN_TEXT`);
  }
  const goldenFieldNames = ['atomicClaims', 'assertionSpecs', 'normativeFunction', 'modality', 'polarity', 'qualifiers', 'legalSourceTarget'];
  const blindStr = JSON.stringify(blind);
  const internalStr = JSON.stringify(internal);
  const goldenFieldHits = goldenFieldNames.filter((g) => blindStr.includes(`"${g}"`) || internalStr.includes(`"${g}"`));
  const domainAlloc = Object.fromEntries(DOMAIN_ORDER.map((d) => [d, internal.filter((u) => u.domain === d).length]));
  const uniqueText = new Set(internal.map((u) => u.literalTextSha256)).size;
  const uniqueLoc = new Set(internal.map((u) => u.canonicalLocator)).size;
  let nearDupPairs = 0;
  for (let i = 0; i < internal.length; i++) for (let j = i + 1; j < internal.length; j++) if (jaccard(tokens(internal[i].literalText), tokens(internal[j].literalText)) >= 0.8) nearDupPairs++;
  const sameArticleInDataset = internal.length - new Set(internal.map((u) => `${u.diploma}|${u.article ?? u.canonicalLocator}`)).size;

  const tests = {
    sourceRoundTrip: { passed: rt.filter((r) => r.ok).length, total: internal.length, failures: rt.filter((r) => !r.ok) },
    uniqueLiteralText: { unique: uniqueText, total: internal.length },
    uniqueCanonicalLocator: { unique: uniqueLoc, total: internal.length },
    nearDuplicatePairs: nearDupPairs,
    multipleUnitsFromSameArticle: sameArticleInDataset,
    nonContaminated: { passed: internal.filter((u) => u.antiOverfitting && u.antiOverfitting.contaminationStatus !== 'CONTAMINATED').length, total: internal.length },
    structurallyCurrent: { passed: internal.filter((u) => u.currentTextConfidence === 'STRUCTURALLY_CURRENT').length, total: internal.length },
    domainAllocation: { actual: domainAlloc, expected: QUOTAS, valid: DOMAIN_ORDER.every((d) => domainAlloc[d] === QUOTAS[d]) },
    judgeOfGuaranteesUnits: internal.filter((u) => /juiz(es)?\s+das\s+garantias/i.test(u.literalText) || (u.diploma === 'CPP' && /^3[A-F]$/.test(String(u.article)))).length,
    blindPreviewKeyViolations: blindKeyViolations,
    blindPreviewValueLeaks: blindValueLeaks,
    goldenFieldsPresent: goldenFieldHits,
    modelGeneratedText: 0,
    externalCalls: 0
  };
  const allPass =
    tests.sourceRoundTrip.passed === 60 && tests.sourceRoundTrip.total === 60 &&
    uniqueText === 60 && uniqueLoc === 60 && nearDupPairs === 0 &&
    tests.nonContaminated.passed === 60 && tests.structurallyCurrent.passed === 60 &&
    tests.domainAllocation.valid && tests.judgeOfGuaranteesUnits === 0 &&
    blindKeyViolations.length === 0 && blindValueLeaks.length === 0 && goldenFieldHits.length === 0;

  const reviewQueue = internal.map((u) => ({
    h2Id: u.h2Id,
    originalText: u.literalText,
    canonicalLocator: u.canonicalLocator,
    officialSource: { officialDocumentId: u.officialDocumentId, authority: u.authority, diploma: u.diploma, rawDocumentSha256: u.rawDocumentSha256, startOffset: u.startOffset, endOffset: u.endOffset, offsetRepresentation: u.offsetRepresentation },
    structuralComplexityFeatures: u.structuralComplexityCandidate,
    contaminationSummary: {
      status: u.antiOverfitting.contaminationStatus,
      normalizedOverlapWithH1: u.antiOverfitting.normalizedOverlapWithH1,
      sameArticleAsH1: u.antiOverfitting.sameArticleAsH1,
      checkerSignals: u.antiOverfitting.checkerSignals
    },
    currentTextConfidence: u.currentTextConfidence,
    reviewStatus: 'PENDING_REVIEW'
  }));

  // Write outputs
  for (const d of ['pool', 'dataset', 'audit']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const W = (rel, obj) => { const p = path.join(OUT, rel); fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); return sha256(fs.readFileSync(p)); };
  const poolSlim = raw.map((u) => ({
    candidateId: u.candidateId, domain: u.domain, officialDocumentId: u.officialDocumentId, diploma: u.diploma, canonicalLocator: u.canonicalLocator,
    subdivisionType: u.subdivisionType, startOffset: u.startOffset, endOffset: u.endOffset, literalTextSha256: u.literalTextSha256, literalText: u.literalText,
    exclusionReason: u.exclusionReason, currentTextConfidence: u.currentTextConfidence, markers: u.markers, contaminationStatus: u.contaminationStatus,
    contamination: u.contamination, duplicateOf: u.duplicateOf || null, structuralComplexityScore: u.structuralComplexity.structuralComplexityScore
  }));
  const hashes = {};
  hashes['pool/h2-corpus-manifest.json'] = W('pool/h2-corpus-manifest.json', corpusManifest);
  hashes['pool/h2-candidate-pool.json'] = W('pool/h2-candidate-pool.json', poolSlim);
  hashes['dataset/h2-source-dataset.internal.json'] = W('dataset/h2-source-dataset.internal.json', internal);
  hashes['dataset/h2-blind-input.preview.json'] = W('dataset/h2-blind-input.preview.json', blind);
  hashes['dataset/h2-source-review-queue.json'] = W('dataset/h2-source-review-queue.json', reviewQueue);
  hashes['audit/h2-validation-tests.json'] = W('audit/h2-validation-tests.json', { allPass, tests });
  const summary = {
    phase: 'V2.3.7-H2.1',
    selectionAlgorithmVersion: SELECTION_ALGORITHM_VERSION,
    selectionAlgorithmSpec: SELECTION_ALGORITHM_SPEC,
    offsetRepresentation: 'NORMALIZED_TEXT_H21_V1 (decode utf-8 fatal else windows-1252; HTML tags stripped; entities decoded; block tags -> \\n; whitespace runs -> single space; comments/script/style dropped)',
    infraHashes,
    totals: {
      rawExtracted: raw.length,
      excluded: raw.filter((u) => u.exclusionReason).length,
      quarantinedHistorical: raw.filter((u) => !u.exclusionReason && u.currentTextConfidence === 'POSSIBLY_HISTORICAL').length,
      quarantinedUnresolved: raw.filter((u) => !u.exclusionReason && u.currentTextConfidence === 'UNRESOLVED').length,
      contaminated: raw.filter((u) => u.contaminationStatus === 'CONTAMINATED').length,
      relatedButDistinct: raw.filter((u) => u.contaminationStatus === 'RELATED_BUT_DISTINCT').length,
      safeNew: raw.filter((u) => u.contaminationStatus === 'SAFE_NEW').length,
      duplicatesRemoved,
      eligibleAfterDedup: eligible.length,
      articleGroups: groupCount,
      finalSelected: internal.length
    },
    exclusionBreakdown,
    countsByDomain: counts,
    selectionTrace,
    complexityDistribution: internal.map((u) => ({ h2Id: u.h2Id, score: u.structuralComplexityCandidate.structuralComplexityScore })),
    allValidationTestsPass: allPass
  };
  hashes['audit/h2-build-summary.json'] = W('audit/h2-build-summary.json', summary);
  hashes['audit/h2-anti-overfitting-audit.json'] = W('audit/h2-anti-overfitting-audit.json', internal.map((u) => ({ h2Id: u.h2Id, canonicalLocator: u.canonicalLocator, ...u.antiOverfitting })));
  const scriptHash = sha256(fs.readFileSync(__filename));
  W('audit/h2-hash-freeze.json', { artifactHashes: hashes, builderScript: { path: 'scripts/build-h2-source-dataset-h21.cjs', sha256: scriptHash }, frozenInfra: infraHashes });

  console.log(JSON.stringify({ totals: summary.totals, countsByDomain: counts, allPass, hashes, builderSha256: scriptHash }, null, 2));
}

if (require.main === module) main();
module.exports = { normalizeHtml, decodeBytes, roundTrip };
