import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const fail = message => { throw new Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const same = (a, b) => canonical(a) === canonical(b);
export function canonical(x) {
  if (Array.isArray(x)) return `[${x.map(canonical).join(',')}]`;
  if (object(x)) return `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}`;
  return JSON.stringify(x);
}
export const sha256 = x => createHash('sha256').update(canonical(x), 'utf8').digest('hex');
export const contentSha256 = x => createHash('sha256').update(x, 'utf8').digest('hex');

// Parse estrito: JSON.parse sozinho aceitaria chaves duplicadas silenciosamente.
export function parseStrict(text) {
  let i = 0;
  const ws = () => { while (/[ \t\r\n]/.test(text[i] || '') && i < text.length) i++; };
  function value(depth = 0) {
    if (depth > 80) fail('JSON excede a profundidade permitida');
    ws();
    const start = i;
    if (text[i] === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i++] === '"') return JSON.parse(text.slice(start, i));
      }
      fail('String JSON incompleta');
    }
    if (text[i] === '{' || text[i] === '[') {
      const dict = text[i++] === '{';
      const result = dict ? {} : [];
      const end = dict ? '}' : ']';
      ws();
      if (text[i] === end) { i++; return result; }
      while (i < text.length) {
        if (dict) {
          ws();
          if (text[i] !== '"') fail('Chave JSON inválida');
          const key = value(depth + 1);
          if (Object.hasOwn(result, key)) fail(`Chave JSON duplicada: ${key}`);
          ws();
          if (text[i++] !== ':') fail('Separador JSON inválido');
          Object.defineProperty(result, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
        } else result.push(value(depth + 1));
        ws();
        const delimiter = text[i++];
        if (delimiter === end) return result;
        if (delimiter !== ',') fail('JSON incompleto ou separador inválido');
      }
      fail('JSON incompleto');
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if (!match) fail('Valor JSON inválido');
    i += match[0].length;
    const result = JSON.parse(match[0]);
    if (typeof result === 'number' && !Number.isFinite(result)) fail('Número JSON não finito');
    if (typeof result === 'number' && Number.isInteger(result) && !Number.isSafeInteger(result)) fail('Inteiro JSON sem representação segura');
    return result;
  }
  if (typeof text !== 'string' || Buffer.byteLength(text) > 10_000_000) fail('JSON ausente ou maior que 10 MB');
  const result = value();
  ws();
  if (i !== text.length) fail('Conteúdo extra após JSON');
  return result;
}

function keys(x, expected, label) {
  if (!object(x) || !same(Object.keys(x).sort(), [...expected].sort())) fail(`${label}: campos ausentes ou desconhecidos`);
}
function date(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) || !Number.isFinite(Date.parse(x)) || new Date(x).toISOString().replace('.000Z', 'Z') !== x.replace('.000Z', 'Z')) fail('Data ISO UTC inválida');
}
function questions(list, label) {
  if (!Array.isArray(list) || !list.length) fail(`${label}: questões ausentes`);
  const ids = new Set();
  for (const q of list) {
    if (!object(q) || !nonempty(q.text) || !nonempty(q.explanation)) fail(`${label}: enunciado/justificativa inválidos`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 || !q.options.every(nonempty)) fail(`${label}: alternativas inválidas`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) fail(`${label}: gabarito fora do intervalo`);
    for (const key of ['id', 'subject']) if (Object.hasOwn(q, key) && !nonempty(q[key])) fail(`${label}: ${key} inválido`);
    if (Object.hasOwn(q, 'id')) {
      if (ids.has(q.id)) fail(`${label}: identificador duplicado`);
      ids.add(q.id);
    }
  }
}

export function embedded(content) {
  if (typeof content !== 'string') fail('Conteúdo ausente');
  for (const tag of ['[BLOCK_5]', '[BLOCK_6]', '[ATHENA_CHALLENGE]']) if (content.split(tag).length !== 2) fail(`Marcador ausente ou duplicado: ${tag}`);
  // Também rejeita variantes de caixa: os marcadores canônicos são exatos.
  if ((content.match(/\[ATHENA_CHALLENGE\]/gi) || []).length !== 1) fail('Marcador de desafio ambíguo');
  const b5 = content.indexOf('[BLOCK_5]');
  const b6 = content.indexOf('[BLOCK_6]');
  const marker = content.indexOf('[ATHENA_CHALLENGE]');
  const blocks = [...content.matchAll(/\[BLOCK_(\d+)\]/gi)];
  if (!same(blocks.map(m => m[0]), Array.from({ length: 6 }, (_, i) => `[BLOCK_${i + 1}]`))) fail('Blocos ausentes, duplicados ou fora de ordem');
  if (!(b5 < marker && marker < b6) && !(b5 < b6 && b6 < marker)) fail('Desafio fora do bloco 5 ou rodapé legado');
  const layout = marker < b6 ? 'canonical-block-5' : 'legacy-after-block-6';
  const limit = marker < b6 ? b6 : content.length;
  let start = marker + '[ATHENA_CHALLENGE]'.length;
  while (/\s/.test(content[start] || '') && start < content.length) start++;
  if (content[start] !== '{') fail('JSON do desafio ausente');
  let depth = 0, quoted = false, escaped = false;
  for (let end = start; end < limit; end++) {
    const c = content[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      if (layout === 'legacy-after-block-6' && content.slice(end + 1).trim()) fail('Rodapé legado com conteúdo após JSON desconhecido');
      return { start, end: end + 1, layout, challenge: parseStrict(content.slice(start, end + 1)) };
    }
  }
  fail('JSON do desafio incompleto no bloco 5');
}

// Localiza folhas no JSON validado: mantém espaços, escapes e campos intactos.
function replaceQuestionLeaves(json, differences) {
  parseStrict(json);
  let i = 0;
  const spans = new Map();
  const ws = () => { while (/\s/.test(json[i] || '') && i < json.length) i++; };
  const string = () => { const start = i++; while (i < json.length) { if (json[i] === '\\') i += 2; else if (json[i++] === '"') return JSON.parse(json.slice(start, i)); } };
  function visit(path) {
    ws(); const start = i;
    if (json[i] === '{') {
      i++; ws();
      while (json[i] !== '}') { const key = string(); ws(); i++; visit([...path, key]); ws(); if (json[i] !== ',') break; i++; ws(); }
      i++;
    } else if (json[i] === '[') {
      i++; ws(); let n = 0;
      while (json[i] !== ']') { visit([...path, n++]); ws(); if (json[i] !== ',') break; i++; ws(); }
      i++;
    } else if (json[i] === '"') string();
    else { while (i < json.length && !/[\s,}\]]/.test(json[i])) i++; }
    spans.set(JSON.stringify(path), { start, end: i });
  }
  visit([]);
  const edits = differences.flatMap(d => d.changes.map(c => {
    const option = /^options\[(\d+)\]$/.exec(c.field);
    const path = ['questions', d.index, ...(option ? ['options', Number(option[1])] : [c.field])];
    const span = spans.get(JSON.stringify(path));
    if (!span) fail('Campo aprovado não localizado no JSON original');
    return { ...span, value: JSON.stringify(c.after) };
  })).sort((a, b) => b.start - a.start);
  for (const edit of edits) json = json.slice(0, edit.start) + edit.value + json.slice(edit.end);
  return json;
}

export function reviewGuard(state, lesson) {
  const lessonId = lesson.id;
  keys(state, ['checked', 'index', 'reviews'], 'reviewState');
  if (state.checked !== true || !Array.isArray(state.reviews)) fail('Estado das revisões não verificado');
  const ids = new Set();
  for (const r of state.reviews) {
    if (!object(r) || !nonempty(r.id) || r.lessonId !== lessonId || ids.has(r.id)) fail('Revisão inválida/duplicada');
    ids.add(r.id);
    if (!['approved', 'rejected'].includes(r.status)) fail(`Revisão administrativa em andamento ou desconhecida: ${r.id}`);
  }
  const idx = state.index;
  if (idx === null) {
    if (state.reviews.length) fail('Revisões existentes sem índice confiável');
    return;
  }
  if (!object(idx) || idx.lessonId !== lessonId || !Object.hasOwn(idx, 'processingReviewId') || idx.processingReviewId !== null) fail('Índice desconhecido ou processamento em andamento');
  if (!Object.hasOwn(idx, 'latestReviewId') || !Object.hasOwn(idx, 'latestStatus')) fail('Índice incompleto');
  if (idx.processingStartedAt != null) fail('Lock residual de revisão');
  // Projeção compatível com hashCatalogSnapshot, sem carregar o revisor.
  const catalogHash = sha256({ content: lesson.content, subject: lesson.subject, topic: lesson.topic ?? '', challenge: lesson.challenge ?? null, approvedAt: lesson.approvedAt ?? null, version: typeof lesson.version === 'number' ? lesson.version : null });
  if (idx.approvedHash != null && idx.approvedHash !== catalogHash) fail('Hash aprovado do índice diverge do catálogo; requer resolução administrativa');
  if (idx.latestReviewId === null) {
    if (idx.latestStatus !== null || state.reviews.length) fail('Índice inconsistente');
  } else if (!state.reviews.some(r => r.id === idx.latestReviewId && r.status === idx.latestStatus)) fail('Última revisão ausente/inconsistente');
}

function prepare(snapshot, input) {
  keys(snapshot, ['schemaVersion', 'capturedAt', 'lesson', 'reviewState'], 'snapshot');
  if (snapshot.schemaVersion !== 'athena-question-snapshot/v1') fail('Versão de snapshot inválida');
  date(snapshot.capturedAt);
  keys(input, ['schemaVersion', 'lessonId', 'originalVersion', 'originalContentSha256', 'originalLessonSha256', 'audit', 'questions'], 'transferência');
  if (input.schemaVersion !== 'athena-reviewed-questions/v1') fail('Versão de contrato inválida');
  const slot = /^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(input.lessonId);
  if (!slot || +slot[1] > 100) fail('lessonId inválido');
  const lesson = snapshot.lesson;
  if (!object(lesson) || lesson.id !== input.lessonId || lesson.day !== +slot[1] || lesson.part !== +slot[2] || lesson.status !== 'approved') fail('Identidade/status da aula divergente');
  if (!Number.isInteger(input.originalVersion) || input.originalVersion < 1 || lesson.version !== input.originalVersion) fail('Versão original divergente/ausente');
  for (const key of ['originalContentSha256', 'originalLessonSha256']) if (!/^[a-f0-9]{64}$/.test(input[key])) fail(`Hash inválido: ${key}`);
  if (typeof lesson.content !== 'string' || contentSha256(lesson.content) !== input.originalContentSha256 || sha256(lesson) !== input.originalLessonSha256) fail('Hash original divergente');
  keys(input.audit, ['reference', 'approvedBy', 'approvedAt', 'approvalReference', 'sources'], 'audit');
  for (const k of ['reference', 'approvedBy', 'approvalReference']) if (!nonempty(input.audit[k])) fail(`Auditoria sem ${k}`);
  date(input.audit.approvedAt);
  if (!Array.isArray(input.audit.sources) || !input.audit.sources.length || !input.audit.sources.every(s => { try { return typeof s === 'string' && new URL(s).protocol === 'https:'; } catch { return false; } })) fail('Fontes da auditoria inválidas');
  reviewGuard(snapshot.reviewState, lesson);
  if (!object(lesson.challenge)) fail('Desafio estruturado ausente');
  questions(lesson.challenge.questions, 'origem');
  const span = embedded(lesson.content);
  if (!same(span.challenge, lesson.challenge)) fail('Desafio estruturado e conteúdo divergentes');
  if (!Array.isArray(input.questions) || input.questions.length !== lesson.challenge.questions.length) fail('Quantidade de questões divergente');
  const differences = [];
  const revisedQuestions = [];
  input.questions.forEach((entry, index) => {
    keys(entry, ['index', 'originalSha256', 'original', 'revised', 'approvedChanges'], `questão ${index}`);
    const original = lesson.challenge.questions[index];
    if (entry.index !== index || !same(entry.original, original) || entry.originalSha256 !== sha256(original)) fail(`Questão ${index}: origem/ordem/hash divergente`);
    questions([entry.revised], `questão ${index}`);
    const revised = entry.revised;
    if (!same(Object.keys(original).sort(), Object.keys(revised).sort())) fail(`Questão ${index}: campos opcionais removidos/adicionados`);
    for (const key of Object.keys(original)) if (!['text', 'options', 'correctIndex', 'explanation'].includes(key) && !same(original[key], revised[key])) fail(`Questão ${index}: campo imutável ${key}`);
    if (original.options.length !== revised.options.length) fail(`Questão ${index}: quantidade de alternativas alterada`);
    if (!same(original.options, revised.options) && same([...original.options].sort(), [...revised.options].sort())) fail(`Questão ${index}: alternativas reordenadas`);
    for (let other = 0; other < input.questions.length; other++) if (other !== index && same(revised, lesson.challenge.questions[other]) && !same(original, revised)) fail(`Questão ${index}: questões reordenadas`);
    const changes = [];
    for (const field of ['text', 'correctIndex', 'explanation']) if (!same(original[field], revised[field])) changes.push({ field, before: original[field], after: revised[field] });
    original.options.forEach((before, n) => { if (before !== revised.options[n]) changes.push({ field: `options[${n}]`, before, after: revised.options[n] }); });
    if (!Array.isArray(entry.approvedChanges)) fail('Lista de mudanças aprovadas ausente');
    entry.approvedChanges.forEach(c => { keys(c, ['field', 'reason'], 'mudança aprovada'); if (!nonempty(c.reason)) fail('Mudança sem justificativa'); });
    if (!same(entry.approvedChanges.map(c => c.field).sort(), changes.map(c => c.field).sort())) fail(`Questão ${index}: alterações sem autorização ou autorizações excedentes/duplicadas`);
    differences.push({ index, id: original.id ?? null, changed: changes.length > 0, changes: changes.map(c => ({ ...c, reason: entry.approvedChanges.find(a => a.field === c.field).reason })) });
    revisedQuestions.push(revised);
  });
  questions(revisedQuestions, 'revisadas');
  const challenge = { ...lesson.challenge, questions: revisedQuestions };
  const content = same(challenge, lesson.challenge) ? lesson.content : lesson.content.slice(0, span.start) + replaceQuestionLeaves(lesson.content.slice(span.start, span.end), differences) + lesson.content.slice(span.end);
  const proposedLesson = { ...lesson, challenge, content };
  if (Buffer.byteLength(JSON.stringify(proposedLesson), 'utf8') > 900_000) fail('Aula preparada excede limite conservador de 900.000 bytes');
  const changed = differences.some(d => d.changed);
  return {
    ok: true, mode: 'dry-run', remoteWriteEnabled: false, lessonId: lesson.id,
    conflicts: [], snapshotCapturedAt: snapshot.capturedAt, audit: input.audit,
    warning: 'Snapshot local: exige nova leitura, aprovação do plano e autorização operacional antes de qualquer escrita futura.',
    planSha256: sha256({ snapshot, input }),
    originalLessonSha256: sha256(lesson), proposedLessonSha256: sha256(proposedLesson),
    fieldsToUpdate: changed ? ['challenge.questions', 'content (somente JSON ATHENA_CHALLENGE)'] : [],
    differences,
    backupPlan: { requiredBeforeWrite: true, confirmed: false, key: `${lesson.id}/${snapshot.capturedAt.replace(/[:.]/g, '-')}/v${lesson.version}-${sha256(lesson)}`, document: structuredClone(lesson), reviewState: structuredClone(snapshot.reviewState), sha256: sha256(lesson) },
    proposedLesson: structuredClone(proposedLesson)
  };
}

export function dryRun(snapshot, input) {
  try {
    // Cópias JSON isolam a proposta e garantem ausência de mutação/aliases com entradas.
    return prepare(parseStrict(JSON.stringify(snapshot)), parseStrict(JSON.stringify(input)));
  } catch (e) {
    return { ok: false, mode: 'dry-run', remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] };
  }
}
export function main(args) {
  try {
    if (args.length !== 5 || args[0] !== '--dry-run' || args[1] !== '--snapshot' || args[3] !== '--input') fail('Uso: node scripts/import-reviewed-questions.mjs --dry-run --snapshot snapshot.json --input revisadas.json. Escrita desabilitada.');
    return dryRun(parseStrict(readFileSync(args[2], 'utf8')), parseStrict(readFileSync(args[4], 'utf8')));
  } catch (e) { return { ok: false, mode: 'dry-run', remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] }; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = main(process.argv.slice(2));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.ok ? 0 : 1;
}
