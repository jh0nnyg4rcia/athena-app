// work/athena-admin-gateway/ceo-approval-bridge/publication-contract.mjs
var keys = ["environment", "lessonId", "marker", "operationId", "baselineVersion", "baselineSha256", "planSha256", "contentSha256"].sort();

// work/athena-admin-gateway/catalog-generalization/questions-policy.mjs
import { createHash as createHash2 } from "node:crypto";

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/outputs/athena-mcp-hml-source-final/scripts/import-reviewed-questions.mjs
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
var fail = (message) => {
  throw new Error(message);
};
var object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var nonempty = (x) => typeof x === "string" && x.trim().length > 0;
var same = (a, b) => canonical(a) === canonical(b);
function canonical(x) {
  if (Array.isArray(x)) return `[${x.map(canonical).join(",")}]`;
  if (object(x)) return `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${canonical(x[k])}`).join(",")}}`;
  return JSON.stringify(x);
}
var sha256 = (x) => createHash("sha256").update(canonical(x), "utf8").digest("hex");
var contentSha256 = (x) => createHash("sha256").update(x, "utf8").digest("hex");
function parseStrict(text) {
  let i = 0;
  const ws = () => {
    while (/[ \t\r\n]/.test(text[i] || "") && i < text.length) i++;
  };
  function value(depth = 0) {
    if (depth > 80) fail("JSON excede a profundidade permitida");
    ws();
    const start = i;
    if (text[i] === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i++] === '"') return JSON.parse(text.slice(start, i));
      }
      fail("String JSON incompleta");
    }
    if (text[i] === "{" || text[i] === "[") {
      const dict = text[i++] === "{";
      const result3 = dict ? {} : [];
      const end = dict ? "}" : "]";
      ws();
      if (text[i] === end) {
        i++;
        return result3;
      }
      while (i < text.length) {
        if (dict) {
          ws();
          if (text[i] !== '"') fail("Chave JSON inv\xE1lida");
          const key = value(depth + 1);
          if (Object.hasOwn(result3, key)) fail(`Chave JSON duplicada: ${key}`);
          ws();
          if (text[i++] !== ":") fail("Separador JSON inv\xE1lido");
          Object.defineProperty(result3, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
        } else result3.push(value(depth + 1));
        ws();
        const delimiter = text[i++];
        if (delimiter === end) return result3;
        if (delimiter !== ",") fail("JSON incompleto ou separador inv\xE1lido");
      }
      fail("JSON incompleto");
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if (!match) fail("Valor JSON inv\xE1lido");
    i += match[0].length;
    const result2 = JSON.parse(match[0]);
    if (typeof result2 === "number" && !Number.isFinite(result2)) fail("N\xFAmero JSON n\xE3o finito");
    if (typeof result2 === "number" && Number.isInteger(result2) && !Number.isSafeInteger(result2)) fail("Inteiro JSON sem representa\xE7\xE3o segura");
    return result2;
  }
  if (typeof text !== "string" || Buffer.byteLength(text) > 1e7) fail("JSON ausente ou maior que 10 MB");
  const result = value();
  ws();
  if (i !== text.length) fail("Conte\xFAdo extra ap\xF3s JSON");
  return result;
}
function keys2(x, expected, label) {
  if (!object(x) || !same(Object.keys(x).sort(), [...expected].sort())) fail(`${label}: campos ausentes ou desconhecidos`);
}
function date(x) {
  if (typeof x !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) || !Number.isFinite(Date.parse(x)) || new Date(x).toISOString().replace(".000Z", "Z") !== x.replace(".000Z", "Z")) fail("Data ISO UTC inv\xE1lida");
}
function questions(list, label) {
  if (!Array.isArray(list) || !list.length) fail(`${label}: quest\xF5es ausentes`);
  const ids = /* @__PURE__ */ new Set();
  for (const q of list) {
    if (!object(q) || !nonempty(q.text) || !nonempty(q.explanation)) fail(`${label}: enunciado/justificativa inv\xE1lidos`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 || !q.options.every(nonempty)) fail(`${label}: alternativas inv\xE1lidas`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) fail(`${label}: gabarito fora do intervalo`);
    for (const key of ["id", "subject"]) if (Object.hasOwn(q, key) && !nonempty(q[key])) fail(`${label}: ${key} inv\xE1lido`);
    if (Object.hasOwn(q, "id")) {
      if (ids.has(q.id)) fail(`${label}: identificador duplicado`);
      ids.add(q.id);
    }
  }
}
function embedded(content) {
  if (typeof content !== "string") fail("Conte\xFAdo ausente");
  for (const tag of ["[BLOCK_5]", "[BLOCK_6]", "[ATHENA_CHALLENGE]"]) if (content.split(tag).length !== 2) fail(`Marcador ausente ou duplicado: ${tag}`);
  if ((content.match(/\[ATHENA_CHALLENGE\]/gi) || []).length !== 1) fail("Marcador de desafio amb\xEDguo");
  const b5 = content.indexOf("[BLOCK_5]");
  const b6 = content.indexOf("[BLOCK_6]");
  const marker = content.indexOf("[ATHENA_CHALLENGE]");
  const blocks = [...content.matchAll(/\[BLOCK_(\d+)\]/gi)];
  if (!same(blocks.map((m) => m[0]), Array.from({ length: 6 }, (_, i) => `[BLOCK_${i + 1}]`))) fail("Blocos ausentes, duplicados ou fora de ordem");
  if (!(b5 < marker && marker < b6) && !(b5 < b6 && b6 < marker)) fail("Desafio fora do bloco 5 ou rodap\xE9 legado");
  const layout = marker < b6 ? "canonical-block-5" : "legacy-after-block-6";
  const limit = marker < b6 ? b6 : content.length;
  let start = marker + "[ATHENA_CHALLENGE]".length;
  while (/\s/.test(content[start] || "") && start < content.length) start++;
  if (content[start] !== "{") fail("JSON do desafio ausente");
  let depth = 0, quoted = false, escaped = false;
  for (let end = start; end < limit; end++) {
    const c = content[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      if (layout === "legacy-after-block-6" && content.slice(end + 1).trim()) fail("Rodap\xE9 legado com conte\xFAdo ap\xF3s JSON desconhecido");
      return { start, end: end + 1, layout, challenge: parseStrict(content.slice(start, end + 1)) };
    }
  }
  fail("JSON do desafio incompleto no bloco 5");
}
function replaceQuestionLeaves(json, differences) {
  parseStrict(json);
  let i = 0;
  const spans = /* @__PURE__ */ new Map();
  const ws = () => {
    while (/\s/.test(json[i] || "") && i < json.length) i++;
  };
  const string = () => {
    const start = i++;
    while (i < json.length) {
      if (json[i] === "\\") i += 2;
      else if (json[i++] === '"') return JSON.parse(json.slice(start, i));
    }
  };
  function visit(path) {
    ws();
    const start = i;
    if (json[i] === "{") {
      i++;
      ws();
      while (json[i] !== "}") {
        const key = string();
        ws();
        i++;
        visit([...path, key]);
        ws();
        if (json[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (json[i] === "[") {
      i++;
      ws();
      let n = 0;
      while (json[i] !== "]") {
        visit([...path, n++]);
        ws();
        if (json[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (json[i] === '"') string();
    else {
      while (i < json.length && !/[\s,}\]]/.test(json[i])) i++;
    }
    spans.set(JSON.stringify(path), { start, end: i });
  }
  visit([]);
  const edits = differences.flatMap((d) => d.changes.map((c) => {
    const option = /^options\[(\d+)\]$/.exec(c.field);
    const path = ["questions", d.index, ...option ? ["options", Number(option[1])] : [c.field]];
    const span = spans.get(JSON.stringify(path));
    if (!span) fail("Campo aprovado n\xE3o localizado no JSON original");
    return { ...span, value: JSON.stringify(c.after) };
  })).sort((a, b) => b.start - a.start);
  for (const edit of edits) json = json.slice(0, edit.start) + edit.value + json.slice(edit.end);
  return json;
}
function reviewGuard(state, lesson) {
  const lessonId = lesson.id;
  keys2(state, ["checked", "index", "reviews"], "reviewState");
  if (state.checked !== true || !Array.isArray(state.reviews)) fail("Estado das revis\xF5es n\xE3o verificado");
  const ids = /* @__PURE__ */ new Set();
  for (const r of state.reviews) {
    if (!object(r) || !nonempty(r.id) || r.lessonId !== lessonId || ids.has(r.id)) fail("Revis\xE3o inv\xE1lida/duplicada");
    ids.add(r.id);
    if (!["approved", "rejected"].includes(r.status)) fail(`Revis\xE3o administrativa em andamento ou desconhecida: ${r.id}`);
  }
  const idx = state.index;
  if (idx === null) {
    if (state.reviews.length) fail("Revis\xF5es existentes sem \xEDndice confi\xE1vel");
    return;
  }
  if (!object(idx) || idx.lessonId !== lessonId || !Object.hasOwn(idx, "processingReviewId") || idx.processingReviewId !== null) fail("\xCDndice desconhecido ou processamento em andamento");
  if (!Object.hasOwn(idx, "latestReviewId") || !Object.hasOwn(idx, "latestStatus")) fail("\xCDndice incompleto");
  if (idx.processingStartedAt != null) fail("Lock residual de revis\xE3o");
  const catalogHash = sha256({ content: lesson.content, subject: lesson.subject, topic: lesson.topic ?? "", challenge: lesson.challenge ?? null, approvedAt: lesson.approvedAt ?? null, version: typeof lesson.version === "number" ? lesson.version : null });
  if (idx.approvedHash != null && idx.approvedHash !== catalogHash) fail("Hash aprovado do \xEDndice diverge do cat\xE1logo; requer resolu\xE7\xE3o administrativa");
  if (idx.latestReviewId === null) {
    if (idx.latestStatus !== null || state.reviews.length) fail("\xCDndice inconsistente");
  } else if (!state.reviews.some((r) => r.id === idx.latestReviewId && r.status === idx.latestStatus)) fail("\xDAltima revis\xE3o ausente/inconsistente");
}
function prepare(snapshot, input) {
  keys2(snapshot, ["schemaVersion", "capturedAt", "lesson", "reviewState"], "snapshot");
  if (snapshot.schemaVersion !== "athena-question-snapshot/v1") fail("Vers\xE3o de snapshot inv\xE1lida");
  date(snapshot.capturedAt);
  keys2(input, ["schemaVersion", "lessonId", "originalVersion", "originalContentSha256", "originalLessonSha256", "audit", "questions"], "transfer\xEAncia");
  if (input.schemaVersion !== "athena-reviewed-questions/v1") fail("Vers\xE3o de contrato inv\xE1lida");
  const slot = /^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(input.lessonId);
  if (!slot || +slot[1] > 100) fail("lessonId inv\xE1lido");
  const lesson = snapshot.lesson;
  if (!object(lesson) || lesson.id !== input.lessonId || lesson.day !== +slot[1] || lesson.part !== +slot[2] || lesson.status !== "approved") fail("Identidade/status da aula divergente");
  if (!Number.isInteger(input.originalVersion) || input.originalVersion < 1 || lesson.version !== input.originalVersion) fail("Vers\xE3o original divergente/ausente");
  for (const key of ["originalContentSha256", "originalLessonSha256"]) if (!/^[a-f0-9]{64}$/.test(input[key])) fail(`Hash inv\xE1lido: ${key}`);
  if (typeof lesson.content !== "string" || contentSha256(lesson.content) !== input.originalContentSha256 || sha256(lesson) !== input.originalLessonSha256) fail("Hash original divergente");
  keys2(input.audit, ["reference", "approvedBy", "approvedAt", "approvalReference", "sources"], "audit");
  for (const k of ["reference", "approvedBy", "approvalReference"]) if (!nonempty(input.audit[k])) fail(`Auditoria sem ${k}`);
  date(input.audit.approvedAt);
  if (!Array.isArray(input.audit.sources) || !input.audit.sources.length || !input.audit.sources.every((s) => {
    try {
      return typeof s === "string" && new URL(s).protocol === "https:";
    } catch {
      return false;
    }
  })) fail("Fontes da auditoria inv\xE1lidas");
  reviewGuard(snapshot.reviewState, lesson);
  if (!object(lesson.challenge)) fail("Desafio estruturado ausente");
  questions(lesson.challenge.questions, "origem");
  const span = embedded(lesson.content);
  if (!same(span.challenge, lesson.challenge)) fail("Desafio estruturado e conte\xFAdo divergentes");
  if (!Array.isArray(input.questions) || input.questions.length !== lesson.challenge.questions.length) fail("Quantidade de quest\xF5es divergente");
  const differences = [];
  const revisedQuestions = [];
  input.questions.forEach((entry, index) => {
    keys2(entry, ["index", "originalSha256", "original", "revised", "approvedChanges"], `quest\xE3o ${index}`);
    const original = lesson.challenge.questions[index];
    if (entry.index !== index || !same(entry.original, original) || entry.originalSha256 !== sha256(original)) fail(`Quest\xE3o ${index}: origem/ordem/hash divergente`);
    questions([entry.revised], `quest\xE3o ${index}`);
    const revised = entry.revised;
    if (!same(Object.keys(original).sort(), Object.keys(revised).sort())) fail(`Quest\xE3o ${index}: campos opcionais removidos/adicionados`);
    for (const key of Object.keys(original)) if (!["text", "options", "correctIndex", "explanation"].includes(key) && !same(original[key], revised[key])) fail(`Quest\xE3o ${index}: campo imut\xE1vel ${key}`);
    if (original.options.length !== revised.options.length) fail(`Quest\xE3o ${index}: quantidade de alternativas alterada`);
    if (!same(original.options, revised.options) && same([...original.options].sort(), [...revised.options].sort())) fail(`Quest\xE3o ${index}: alternativas reordenadas`);
    for (let other = 0; other < input.questions.length; other++) if (other !== index && same(revised, lesson.challenge.questions[other]) && !same(original, revised)) fail(`Quest\xE3o ${index}: quest\xF5es reordenadas`);
    const changes = [];
    for (const field of ["text", "correctIndex", "explanation"]) if (!same(original[field], revised[field])) changes.push({ field, before: original[field], after: revised[field] });
    original.options.forEach((before, n) => {
      if (before !== revised.options[n]) changes.push({ field: `options[${n}]`, before, after: revised.options[n] });
    });
    if (!Array.isArray(entry.approvedChanges)) fail("Lista de mudan\xE7as aprovadas ausente");
    entry.approvedChanges.forEach((c) => {
      keys2(c, ["field", "reason"], "mudan\xE7a aprovada");
      if (!nonempty(c.reason)) fail("Mudan\xE7a sem justificativa");
    });
    if (!same(entry.approvedChanges.map((c) => c.field).sort(), changes.map((c) => c.field).sort())) fail(`Quest\xE3o ${index}: altera\xE7\xF5es sem autoriza\xE7\xE3o ou autoriza\xE7\xF5es excedentes/duplicadas`);
    differences.push({ index, id: original.id ?? null, changed: changes.length > 0, changes: changes.map((c) => ({ ...c, reason: entry.approvedChanges.find((a) => a.field === c.field).reason })) });
    revisedQuestions.push(revised);
  });
  questions(revisedQuestions, "revisadas");
  const challenge = { ...lesson.challenge, questions: revisedQuestions };
  const content = same(challenge, lesson.challenge) ? lesson.content : lesson.content.slice(0, span.start) + replaceQuestionLeaves(lesson.content.slice(span.start, span.end), differences) + lesson.content.slice(span.end);
  const proposedLesson = { ...lesson, challenge, content };
  if (Buffer.byteLength(JSON.stringify(proposedLesson), "utf8") > 9e5) fail("Aula preparada excede limite conservador de 900.000 bytes");
  const changed = differences.some((d) => d.changed);
  return {
    ok: true,
    mode: "dry-run",
    remoteWriteEnabled: false,
    lessonId: lesson.id,
    conflicts: [],
    snapshotCapturedAt: snapshot.capturedAt,
    audit: input.audit,
    warning: "Snapshot local: exige nova leitura, aprova\xE7\xE3o do plano e autoriza\xE7\xE3o operacional antes de qualquer escrita futura.",
    planSha256: sha256({ snapshot, input }),
    originalLessonSha256: sha256(lesson),
    proposedLessonSha256: sha256(proposedLesson),
    fieldsToUpdate: changed ? ["challenge.questions", "content (somente JSON ATHENA_CHALLENGE)"] : [],
    differences,
    backupPlan: { requiredBeforeWrite: true, confirmed: false, key: `${lesson.id}/${snapshot.capturedAt.replace(/[:.]/g, "-")}/v${lesson.version}-${sha256(lesson)}`, document: structuredClone(lesson), reviewState: structuredClone(snapshot.reviewState), sha256: sha256(lesson) },
    proposedLesson: structuredClone(proposedLesson)
  };
}
function dryRun(snapshot, input) {
  try {
    return prepare(parseStrict(JSON.stringify(snapshot)), parseStrict(JSON.stringify(input)));
  } catch (e) {
    return { ok: false, mode: "dry-run", remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] };
  }
}
function main(args) {
  try {
    if (args.length !== 5 || args[0] !== "--dry-run" || args[1] !== "--snapshot" || args[3] !== "--input") fail("Uso: node scripts/import-reviewed-questions.mjs --dry-run --snapshot snapshot.json --input revisadas.json. Escrita desabilitada.");
    return dryRun(parseStrict(readFileSync(args[2], "utf8")), parseStrict(readFileSync(args[4], "utf8")));
  } catch (e) {
    return { ok: false, mode: "dry-run", remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] };
  }
}
if (process.argv[1] && "urn:athena:library-module" === pathToFileURL(process.argv[1]).href) {
  const report = main(process.argv.slice(2));
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exitCode = report.ok ? 0 : 1;
}

// work/athena-admin-gateway/catalog-integration/catalog-adapter.mjs
var TARGET = { projectId: "gen-lang-client-0822763072", databaseId: "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb", lessonId: "day_4_part_0", sectionIndex: 3 };
var check = (ok, code) => {
  if (!ok) throw Error(code);
};
function split(content) {
  check(typeof content === "string", "CONTENT_REQUIRED");
  const markers = [...content.matchAll(/\[BLOCK_(\d+)\]/g)];
  check(markers.length === 6 && markers.every((m, i) => Number(m[1]) === i + 1), "BLOCK_STRUCTURE");
  return { prefix: content.slice(0, markers[0].index), chunks: markers.map((m, i) => content.slice(m.index, markers[i + 1]?.index ?? content.length)) };
}
function validatePlan(plan, actor, now) {
  const { planSha256, ...body } = plan;
  const allowed = [TARGET, { projectId: "athena-mcp-hml-20261013", databaseId: "athena-mcp-hml", lessonId: TARGET.lessonId, sectionIndex: 3 }, { projectId: "demo-athena-editorial-integration", databaseId: "athena-local", lessonId: TARGET.lessonId, sectionIndex: 3 }];
  check(planSha256 === sha256(body) && allowed.some((t) => sha256(plan.target) === sha256(t)), "PLAN_TAMPERED");
  check(actor === plan.actor && now < plan.expiresAt, "APPROVAL_INVALID");
  check(plan.baselineSha256 === sha256(plan.before) && plan.baselineVersion === plan.before.version, "BASELINE_INVALID");
}
function transactionHooks({ plan, actor, now, refs, nowProvider = Date.now, validate = validatePlan }) {
  validate(plan, actor, now);
  let approval, backupExists, catalogBefore;
  return {
    async before(tx, existing) {
      const [catalog, approved, backup, receipt] = await Promise.all([tx.get(refs.catalog), tx.get(refs.approval), tx.get(refs.backup), tx.get(refs.receipt)]);
      approval = approved.data();
      backupExists = backup.exists();
      catalogBefore = catalog.data();
      validate(plan, actor, Math.max(now, nowProvider(), Date.now()));
      check(existing?.version === plan.baselineVersion && sha256(existing) === plan.baselineSha256 && sha256(catalog.data()) === plan.catalogSha256, "CONCURRENT_CHANGE");
      check((!plan.operationId || approval?.operationId === plan.operationId) && !receipt.exists() && !backupExists && approval?.state === "approved" && approval.actor === actor && approval.planSha256 === plan.planSha256 && approval.contentSha256 === sha256(plan.proposed) && approval.expiresAt > Math.max(now, Date.now()), "APPROVAL_INVALID");
    },
    after(tx, published) {
      const catalogAfter = { ...catalogBefore, id: published.id, day: published.day, part: published.part, subject: published.subject, status: "approved", approvedBy: published.approvedBy, approvedAt: published.approvedAt, review: (published.review || "").slice(0, 2e4), version: published.version };
      tx.set(refs.catalog, { version: published.version }, { merge: true });
      tx.set(refs.backup, { lesson: plan.before, catalog: plan.catalogBefore, baselineSha256: plan.baselineSha256, planSha256: plan.planSha256 });
      tx.set(refs.approval, { ...approval, state: "consumed", consumedAt: now });
      tx.set(refs.receipt, { ...plan.operationId ? { operationId: plan.operationId } : {}, lessonId: plan.target.lessonId, planSha256: plan.planSha256, beforeSha256: plan.baselineSha256, afterSha256: sha256(published), catalogAfterSha256: sha256(catalogAfter), resultingVersion: published.version });
      tx.set(refs.outbox, { ...plan.operationId ? { operationId: plan.operationId, operationMode: plan.operationMode ?? "synthetic-editorial-v1" } : {}, lessonId: plan.target.lessonId, version: published.version, approvedAt: published.approvedAt, state: "pending", planSha256: plan.planSha256 });
    }
  };
}

// work/athena-admin-gateway/catalog-generalization/questions-policy.mjs
var QUESTIONS_MARKER = "[ATHENA_CHALLENGE]";
var questionFields = Object.freeze(["text", "options", "correctIndex", "explanation"]);
var fail2 = (ok, code) => {
  if (!ok) throw Error("MCP_" + code);
};
var hash = (s) => createHash2("sha256").update(s, "utf8").digest("hex");
var plain = (x) => x && Object.getPrototypeOf(x) === Object.prototype;
function parseQuestionsJSON(text) {
  fail2(typeof text === "string" && Buffer.byteLength(text) < 2e5, "QUESTIONS_SIZE");
  let i = 0;
  const ws = () => {
    while (i < text.length && /[ \t\r\n]/.test(text[i])) i++;
  };
  function read(depth = 0) {
    fail2(depth <= 80, "QUESTIONS_JSON");
    ws();
    const start = i;
    if (text[i] === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i++] === '"') {
          try {
            const decoded = JSON.parse(text.slice(start, i));
            fail2(Buffer.from(decoded, "utf8").toString("utf8") === decoded, "QUESTIONS_JSON");
            return decoded;
          } catch {
            fail2(false, "QUESTIONS_JSON");
          }
        }
      }
      fail2(false, "QUESTIONS_JSON");
    }
    if (text[i] === "{" || text[i] === "[") {
      const object3 = text[i++] === "{", out2 = object3 ? {} : [], end = object3 ? "}" : "]";
      ws();
      if (text[i] === end) {
        i++;
        return out2;
      }
      while (i < text.length) {
        if (object3) {
          ws();
          fail2(text[i] === '"', "QUESTIONS_JSON");
          const key = read(depth + 1);
          fail2(!Object.hasOwn(out2, key), "QUESTIONS_DUPLICATE_KEY");
          fail2(!["__proto__", "constructor", "prototype"].includes(key), "QUESTIONS_JSON");
          ws();
          fail2(text[i++] === ":", "QUESTIONS_JSON");
          Object.defineProperty(out2, key, { value: read(depth + 1), enumerable: true, writable: true, configurable: true });
        } else out2.push(read(depth + 1));
        ws();
        const delimiter = text[i++];
        if (delimiter === end) return out2;
        fail2(delimiter === ",", "QUESTIONS_JSON");
      }
      fail2(false, "QUESTIONS_JSON");
    }
    const m = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    fail2(m, "QUESTIONS_JSON");
    i += m[0].length;
    const v = JSON.parse(m[0]);
    fail2(typeof v !== "number" || Number.isFinite(v) && (!Number.isInteger(v) || Number.isSafeInteger(v)), "QUESTIONS_JSON");
    return v;
  }
  const out = read();
  ws();
  fail2(i === text.length, "QUESTIONS_JSON");
  return out;
}
function validateQuestionSet(challenge) {
  fail2(plain(challenge) && Array.isArray(challenge.questions) && challenge.questions.length > 0, "QUESTIONS_SCHEMA");
  const ids = /* @__PURE__ */ new Set(), signatures = /* @__PURE__ */ new Set();
  for (const q of challenge.questions) {
    fail2(plain(q) && questionFields.every((k) => Object.hasOwn(q, k)), "QUESTIONS_SCHEMA");
    fail2(typeof q.text === "string" && q.text.trim() && typeof q.explanation === "string" && q.explanation.trim(), "QUESTIONS_SCHEMA");
    fail2(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5 && q.options.every((x) => typeof x === "string" && x.trim()) && new Set(q.options).size === q.options.length, "QUESTIONS_OPTIONS");
    fail2(Number.isSafeInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length, "QUESTIONS_ANSWER");
    if (Object.hasOwn(q, "id")) {
      fail2((typeof q.id === "string" && q.id.length > 0 || Number.isSafeInteger(q.id)) && !ids.has(q.id), "QUESTIONS_DUPLICATE_ID");
      ids.add(q.id);
    }
    const sig = sha256({ text: q.text, options: q.options });
    fail2(!signatures.has(sig), "QUESTIONS_DUPLICATE");
    signatures.add(sig);
  }
  return challenge;
}
function questionSpan(text) {
  fail2(typeof text === "string", "QUESTIONS_REPRESENTATION");
  const tags = [...text.matchAll(/\[ATHENA_CHALLENGE\]/gi)];
  fail2(tags.length <= 1, "QUESTIONS_REPRESENTATION");
  if (!tags.length) return null;
  let start = tags[0].index + tags[0][0].length;
  while (/[ \t\r\n]/.test(text[start] ?? "") && start < text.length) start++;
  fail2(text[start] === "{", "QUESTIONS_REPRESENTATION");
  let depth = 0, quoted = false, escaped = false;
  for (let n = start; n < text.length; n++) {
    const c = text[n];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) {
        const raw = text.slice(start, n + 1);
        return { start, end: n + 1, raw, challenge: validateQuestionSet(parseQuestionsJSON(raw)) };
      }
    }
  }
  fail2(false, "QUESTIONS_REPRESENTATION");
}
function inspectQuestions(lesson) {
  const embedded3 = questionSpan(lesson.content), field = lesson.challenge == null ? null : validateQuestionSet(lesson.challenge);
  fail2(field || embedded3, "QUESTIONS_ABSENT");
  const challenge = field ?? embedded3.challenge;
  const copies = [];
  if (field && embedded3) fail2(sha256(field) === sha256(embedded3.challenge), "QUESTIONS_REPRESENTATION");
  if (lesson.blocks !== void 0) {
    fail2(Array.isArray(lesson.blocks) && lesson.blocks.length === 6 && lesson.blocks.every((b) => typeof b === "string"), "QUESTIONS_REPRESENTATION");
    for (let index = 0; index < 6; index++) {
      const span = questionSpan(lesson.blocks[index]);
      if (span) {
        fail2(sha256(span.challenge) === sha256(challenge), "QUESTIONS_REPRESENTATION");
        copies.push({ index, ...span });
      }
    }
  }
  return { challenge, embedded: embedded3, copies, hasField: !!field, representations: { challengeField: !!field, embeddedContent: !!embedded3, embeddedBlocks: copies.map((c) => c.index), consistent: true } };
}
function questionDiff(before, after, authorizedChanges) {
  validateQuestionSet(before);
  validateQuestionSet(after);
  fail2(sha256({ ...before, questions: null }) === sha256({ ...after, questions: null }), "QUESTIONS_METADATA_CHANGED");
  fail2(before.questions.length === after.questions.length, "QUESTIONS_COUNT");
  const diff = [];
  for (let index = 0; index < before.questions.length; index++) {
    const a = before.questions[index], b = after.questions[index], extra = (q) => Object.fromEntries(Object.entries(q).filter(([k]) => !questionFields.includes(k)));
    fail2(sha256(extra(a)) === sha256(extra(b)), "QUESTIONS_IDENTITY_CHANGED");
    if (!Object.hasOwn(a, "id")) fail2(!before.questions.some((q, j) => j !== index && sha256({ text: q.text, options: q.options }) === sha256({ text: b.text, options: b.options })), "QUESTIONS_ORDER");
    const fields2 = questionFields.filter((k) => sha256(a[k]) !== sha256(b[k]));
    if (fields2.length) diff.push({ index, fields: fields2, answerChanged: a.correctIndex !== b.correctIndex || a.options[a.correctIndex] !== b.options[b.correctIndex], changes: fields2.map((field) => ({ field, before: a[field], after: b[field] })) });
  }
  fail2(diff.length > 0, "QUESTIONS_NO_CHANGES");
  fail2(Array.isArray(authorizedChanges) && authorizedChanges.length === diff.length, "QUESTIONS_APPROVAL_SCOPE");
  const normalized2 = authorizedChanges.map((c) => {
    fail2(plain(c) && Object.keys(c).sort().join(",") === "fields,index" && Number.isSafeInteger(c.index) && Array.isArray(c.fields) && c.fields.length > 0 && c.fields.every((f) => questionFields.includes(f)) && new Set(c.fields).size === c.fields.length, "QUESTIONS_APPROVAL_SCOPE");
    return { index: c.index, fields: [...c.fields].sort() };
  }).sort((a, b) => a.index - b.index);
  fail2(new Set(normalized2.map((c) => c.index)).size === normalized2.length && sha256(normalized2) === sha256(diff.map((c) => ({ index: c.index, fields: [...c.fields].sort() }))), "QUESTIONS_APPROVAL_SCOPE");
  return diff;
}
var replace = (text, span, json) => span ? text.slice(0, span.start) + json + text.slice(span.end) : text;
function buildQuestionsPlan(snapshot, json, { policy, actor, now, operationId, lessonId, questionsSha256, authorizedChanges }) {
  fail2(typeof json === "string" && hash(json) === questionsSha256, "QUESTIONS_HASH");
  const before = structuredClone(snapshot.lesson), layout = inspectQuestions(before), candidate = validateQuestionSet(parseQuestionsJSON(json)), diff = questionDiff(layout.challenge, candidate, authorizedChanges);
  split(before.content);
  const sectionIndex = layout.embedded ? Math.max(0, [...before.content.slice(0, layout.embedded.start).matchAll(/\[BLOCK_\d+\]/g)].length - 1) : 0, target = policy.resolve(snapshot, lessonId, `[BLOCK_${sectionIndex + 1}]`);
  fail2(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(operationId) && typeof actor === "string" && actor && Number.isSafeInteger(now), "QUESTIONS_PLAN_SCOPE");
  const proposed = structuredClone(before);
  if (layout.hasField) proposed.challenge = candidate;
  proposed.content = replace(before.content, layout.embedded, json);
  if (before.blocks !== void 0) proposed.blocks = before.blocks.map((b, i) => replace(b, layout.copies.find((c) => c.index === i), json));
  split(proposed.content);
  fail2(sha256(inspectQuestions(proposed).challenge) === sha256(candidate), "QUESTIONS_REPRESENTATION");
  fail2(Buffer.byteLength(JSON.stringify(proposed)) < 9e5, "QUESTIONS_SIZE");
  const body = { operationId, operationMode: "catalog-questions-v1", editType: "questions", environment: "real", target, marker: QUESTIONS_MARKER, actor, createdAt: now, expiresAt: now + 6e5, baselineVersion: before.version, baselineSha256: sha256(before), catalogSha256: sha256(snapshot.catalogEntry), before, catalogBefore: structuredClone(snapshot.catalogEntry), proposed, reviewedArtifact: { json, sha256: questionsSha256 }, authorizedChanges: diff.map((d) => ({ index: d.index, fields: d.fields })), questionDiff: diff, questionsBeforeSha256: sha256(layout.challenge), questionsAfterSha256: sha256(candidate), representations: layout.representations };
  fail2(Buffer.byteLength(JSON.stringify(body)) < 9e5, "QUESTIONS_SIZE");
  return { ...body, planSha256: sha256(body) };
}
function validateQuestionsPlan(p, actor, now, policy) {
  fail2(p?.operationMode === "catalog-questions-v1" && p.editType === "questions" && p.environment === "real" && p.marker === QUESTIONS_MARKER && actor === p.actor && now < p.expiresAt, "QUESTIONS_APPROVAL_INVALID");
  const rebuilt = buildQuestionsPlan({ lesson: p.before, catalogEntry: p.catalogBefore }, p.reviewedArtifact?.json, { policy, actor, now: p.createdAt, operationId: p.operationId, lessonId: p.target.lessonId, questionsSha256: p.reviewedArtifact?.sha256, authorizedChanges: p.authorizedChanges });
  fail2(sha256(rebuilt) === sha256(p), "QUESTIONS_PLAN_TAMPERED");
}
function preserveApprovedQuestionRepresentations(normalized2, p) {
  fail2(normalized2.content === p.proposed.content, "PUBLISHED_CONTENT_DIVERGENCE");
  const expected = inspectQuestions(p.proposed).challenge;
  if (normalized2.challenge !== void 0) fail2(sha256(normalized2.challenge) === sha256(expected), "PUBLISHED_QUESTIONS_DIVERGENCE");
  const exact = { ...normalized2 };
  if (Object.hasOwn(p.proposed, "challenge")) exact.challenge = p.proposed.challenge;
  else delete exact.challenge;
  if (Object.hasOwn(p.proposed, "blocks")) exact.blocks = p.proposed.blocks;
  else delete exact.blocks;
  fail2(sha256(inspectQuestions(exact).challenge) === p.questionsAfterSha256, "PUBLISHED_QUESTIONS_DIVERGENCE");
  return exact;
}

// work/athena-admin-gateway/catalog-generalization/preserve-unedited-blocks.mjs
function preserveUneditedBlocks(before, proposed, index) {
  if (before.blocks === void 0) return proposed;
  if (!Number.isInteger(index) || index < 0 || index > 5 || ![before.blocks, proposed.blocks].every((a) => Array.isArray(a) && a.length === 6 && a.every((b) => typeof b === "string"))) throw Error("MCP_BLOCKS_CHANGED");
  return { ...proposed, blocks: before.blocks.map((b, n) => n === index ? proposed.blocks[n] : b) };
}

// work/athena-admin-gateway/ceo-approval-bridge/constants.ts
var CALLER = "mcp-admin@athena-mcp-hml-20261013.iam.gserviceaccount.com";
var WRITER = "217533514119-compute@developer.gserviceaccount.com";
var BASELINE = "d57cac791bbe16941b1307c7c51a71e7df4f62214210767979d5745592ff6f54";

// work/athena-admin-gateway/ceo-approval-bridge/signature.ts
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
var fail3 = (v, c) => {
  if (!v) throw Error(c);
};
function approvalVerifier(publicKey, kid) {
  const key = createPublicKey(publicKey);
  return (token) => {
    fail3(typeof token === "string" && token.length < 15e5, "EVIDENCE_INVALID");
    const parts = token.split(".");
    fail3(parts.length === 3, "EVIDENCE_INVALID");
    const h = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    fail3(h.alg === "RS256" && h.kid === kid && h.typ === "athena-approval+jws", "EVIDENCE_INVALID");
    fail3(verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, Buffer.from(parts[2], "base64url")), "EVIDENCE_SIGNATURE");
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  };
}

// work/athena-admin-gateway/preview-integration/native-firestore-port.ts
import { Firestore as NativeFirestore } from "@google-cloud/firestore";

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/athena-admin-mcp-service/staging.mjs
import { Compute, GoogleAuth } from "google-auth-library";
import { Firestore } from "@google-cloud/firestore";

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/scripts/import-reviewed-questions.mjs
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync2 } from "node:fs";
import { pathToFileURL as pathToFileURL2 } from "node:url";
var fail4 = (message) => {
  throw new Error(message);
};
var object2 = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var nonempty2 = (x) => typeof x === "string" && x.trim().length > 0;
var same2 = (a, b) => canonical2(a) === canonical2(b);
function canonical2(x) {
  if (Array.isArray(x)) return `[${x.map(canonical2).join(",")}]`;
  if (object2(x)) return `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${canonical2(x[k])}`).join(",")}}`;
  return JSON.stringify(x);
}
var sha2562 = (x) => createHash3("sha256").update(canonical2(x), "utf8").digest("hex");
var contentSha2562 = (x) => createHash3("sha256").update(x, "utf8").digest("hex");
function parseStrict2(text) {
  let i = 0;
  const ws = () => {
    while (/[ \t\r\n]/.test(text[i] || "") && i < text.length) i++;
  };
  function value(depth = 0) {
    if (depth > 80) fail4("JSON excede a profundidade permitida");
    ws();
    const start = i;
    if (text[i] === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i++] === '"') return JSON.parse(text.slice(start, i));
      }
      fail4("String JSON incompleta");
    }
    if (text[i] === "{" || text[i] === "[") {
      const dict = text[i++] === "{";
      const result3 = dict ? {} : [];
      const end = dict ? "}" : "]";
      ws();
      if (text[i] === end) {
        i++;
        return result3;
      }
      while (i < text.length) {
        if (dict) {
          ws();
          if (text[i] !== '"') fail4("Chave JSON inv\xE1lida");
          const key = value(depth + 1);
          if (Object.hasOwn(result3, key)) fail4(`Chave JSON duplicada: ${key}`);
          ws();
          if (text[i++] !== ":") fail4("Separador JSON inv\xE1lido");
          Object.defineProperty(result3, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
        } else result3.push(value(depth + 1));
        ws();
        const delimiter = text[i++];
        if (delimiter === end) return result3;
        if (delimiter !== ",") fail4("JSON incompleto ou separador inv\xE1lido");
      }
      fail4("JSON incompleto");
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if (!match) fail4("Valor JSON inv\xE1lido");
    i += match[0].length;
    const result2 = JSON.parse(match[0]);
    if (typeof result2 === "number" && !Number.isFinite(result2)) fail4("N\xFAmero JSON n\xE3o finito");
    if (typeof result2 === "number" && Number.isInteger(result2) && !Number.isSafeInteger(result2)) fail4("Inteiro JSON sem representa\xE7\xE3o segura");
    return result2;
  }
  if (typeof text !== "string" || Buffer.byteLength(text) > 1e7) fail4("JSON ausente ou maior que 10 MB");
  const result = value();
  ws();
  if (i !== text.length) fail4("Conte\xFAdo extra ap\xF3s JSON");
  return result;
}
function keys3(x, expected, label) {
  if (!object2(x) || !same2(Object.keys(x).sort(), [...expected].sort())) fail4(`${label}: campos ausentes ou desconhecidos`);
}
function date2(x) {
  if (typeof x !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) || !Number.isFinite(Date.parse(x)) || new Date(x).toISOString().replace(".000Z", "Z") !== x.replace(".000Z", "Z")) fail4("Data ISO UTC inv\xE1lida");
}
function questions2(list, label) {
  if (!Array.isArray(list) || !list.length) fail4(`${label}: quest\xF5es ausentes`);
  const ids = /* @__PURE__ */ new Set();
  for (const q of list) {
    if (!object2(q) || !nonempty2(q.text) || !nonempty2(q.explanation)) fail4(`${label}: enunciado/justificativa inv\xE1lidos`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 || !q.options.every(nonempty2)) fail4(`${label}: alternativas inv\xE1lidas`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) fail4(`${label}: gabarito fora do intervalo`);
    for (const key of ["id", "subject"]) if (Object.hasOwn(q, key) && !nonempty2(q[key])) fail4(`${label}: ${key} inv\xE1lido`);
    if (Object.hasOwn(q, "id")) {
      if (ids.has(q.id)) fail4(`${label}: identificador duplicado`);
      ids.add(q.id);
    }
  }
}
function embedded2(content) {
  if (typeof content !== "string") fail4("Conte\xFAdo ausente");
  for (const tag of ["[BLOCK_5]", "[BLOCK_6]", "[ATHENA_CHALLENGE]"]) if (content.split(tag).length !== 2) fail4(`Marcador ausente ou duplicado: ${tag}`);
  if ((content.match(/\[ATHENA_CHALLENGE\]/gi) || []).length !== 1) fail4("Marcador de desafio amb\xEDguo");
  const b5 = content.indexOf("[BLOCK_5]");
  const b6 = content.indexOf("[BLOCK_6]");
  const marker = content.indexOf("[ATHENA_CHALLENGE]");
  const blocks = [...content.matchAll(/\[BLOCK_(\d+)\]/gi)];
  if (!same2(blocks.map((m) => m[0]), Array.from({ length: 6 }, (_, i) => `[BLOCK_${i + 1}]`))) fail4("Blocos ausentes, duplicados ou fora de ordem");
  if (!(b5 < marker && marker < b6) && !(b5 < b6 && b6 < marker)) fail4("Desafio fora do bloco 5 ou rodap\xE9 legado");
  const layout = marker < b6 ? "canonical-block-5" : "legacy-after-block-6";
  const limit = marker < b6 ? b6 : content.length;
  let start = marker + "[ATHENA_CHALLENGE]".length;
  while (/\s/.test(content[start] || "") && start < content.length) start++;
  if (content[start] !== "{") fail4("JSON do desafio ausente");
  let depth = 0, quoted = false, escaped = false;
  for (let end = start; end < limit; end++) {
    const c = content[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      if (layout === "legacy-after-block-6" && content.slice(end + 1).trim()) fail4("Rodap\xE9 legado com conte\xFAdo ap\xF3s JSON desconhecido");
      return { start, end: end + 1, layout, challenge: parseStrict2(content.slice(start, end + 1)) };
    }
  }
  fail4("JSON do desafio incompleto no bloco 5");
}
function replaceQuestionLeaves2(json, differences) {
  parseStrict2(json);
  let i = 0;
  const spans = /* @__PURE__ */ new Map();
  const ws = () => {
    while (/\s/.test(json[i] || "") && i < json.length) i++;
  };
  const string = () => {
    const start = i++;
    while (i < json.length) {
      if (json[i] === "\\") i += 2;
      else if (json[i++] === '"') return JSON.parse(json.slice(start, i));
    }
  };
  function visit(path) {
    ws();
    const start = i;
    if (json[i] === "{") {
      i++;
      ws();
      while (json[i] !== "}") {
        const key = string();
        ws();
        i++;
        visit([...path, key]);
        ws();
        if (json[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (json[i] === "[") {
      i++;
      ws();
      let n = 0;
      while (json[i] !== "]") {
        visit([...path, n++]);
        ws();
        if (json[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (json[i] === '"') string();
    else {
      while (i < json.length && !/[\s,}\]]/.test(json[i])) i++;
    }
    spans.set(JSON.stringify(path), { start, end: i });
  }
  visit([]);
  const edits = differences.flatMap((d) => d.changes.map((c) => {
    const option = /^options\[(\d+)\]$/.exec(c.field);
    const path = ["questions", d.index, ...option ? ["options", Number(option[1])] : [c.field]];
    const span = spans.get(JSON.stringify(path));
    if (!span) fail4("Campo aprovado n\xE3o localizado no JSON original");
    return { ...span, value: JSON.stringify(c.after) };
  })).sort((a, b) => b.start - a.start);
  for (const edit of edits) json = json.slice(0, edit.start) + edit.value + json.slice(edit.end);
  return json;
}
function reviewGuard2(state, lesson) {
  const lessonId = lesson.id;
  keys3(state, ["checked", "index", "reviews"], "reviewState");
  if (state.checked !== true || !Array.isArray(state.reviews)) fail4("Estado das revis\xF5es n\xE3o verificado");
  const ids = /* @__PURE__ */ new Set();
  for (const r of state.reviews) {
    if (!object2(r) || !nonempty2(r.id) || r.lessonId !== lessonId || ids.has(r.id)) fail4("Revis\xE3o inv\xE1lida/duplicada");
    ids.add(r.id);
    if (!["approved", "rejected"].includes(r.status)) fail4(`Revis\xE3o administrativa em andamento ou desconhecida: ${r.id}`);
  }
  const idx = state.index;
  if (idx === null) {
    if (state.reviews.length) fail4("Revis\xF5es existentes sem \xEDndice confi\xE1vel");
    return;
  }
  if (!object2(idx) || idx.lessonId !== lessonId || !Object.hasOwn(idx, "processingReviewId") || idx.processingReviewId !== null) fail4("\xCDndice desconhecido ou processamento em andamento");
  if (!Object.hasOwn(idx, "latestReviewId") || !Object.hasOwn(idx, "latestStatus")) fail4("\xCDndice incompleto");
  if (idx.processingStartedAt != null) fail4("Lock residual de revis\xE3o");
  const catalogHash = sha2562({ content: lesson.content, subject: lesson.subject, topic: lesson.topic ?? "", challenge: lesson.challenge ?? null, approvedAt: lesson.approvedAt ?? null, version: typeof lesson.version === "number" ? lesson.version : null });
  if (idx.approvedHash != null && idx.approvedHash !== catalogHash) fail4("Hash aprovado do \xEDndice diverge do cat\xE1logo; requer resolu\xE7\xE3o administrativa");
  if (idx.latestReviewId === null) {
    if (idx.latestStatus !== null || state.reviews.length) fail4("\xCDndice inconsistente");
  } else if (!state.reviews.some((r) => r.id === idx.latestReviewId && r.status === idx.latestStatus)) fail4("\xDAltima revis\xE3o ausente/inconsistente");
}
function prepare2(snapshot, input) {
  keys3(snapshot, ["schemaVersion", "capturedAt", "lesson", "reviewState"], "snapshot");
  if (snapshot.schemaVersion !== "athena-question-snapshot/v1") fail4("Vers\xE3o de snapshot inv\xE1lida");
  date2(snapshot.capturedAt);
  keys3(input, ["schemaVersion", "lessonId", "originalVersion", "originalContentSha256", "originalLessonSha256", "audit", "questions"], "transfer\xEAncia");
  if (input.schemaVersion !== "athena-reviewed-questions/v1") fail4("Vers\xE3o de contrato inv\xE1lida");
  const slot = /^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(input.lessonId);
  if (!slot || +slot[1] > 100) fail4("lessonId inv\xE1lido");
  const lesson = snapshot.lesson;
  if (!object2(lesson) || lesson.id !== input.lessonId || lesson.day !== +slot[1] || lesson.part !== +slot[2] || lesson.status !== "approved") fail4("Identidade/status da aula divergente");
  if (!Number.isInteger(input.originalVersion) || input.originalVersion < 1 || lesson.version !== input.originalVersion) fail4("Vers\xE3o original divergente/ausente");
  for (const key of ["originalContentSha256", "originalLessonSha256"]) if (!/^[a-f0-9]{64}$/.test(input[key])) fail4(`Hash inv\xE1lido: ${key}`);
  if (typeof lesson.content !== "string" || contentSha2562(lesson.content) !== input.originalContentSha256 || sha2562(lesson) !== input.originalLessonSha256) fail4("Hash original divergente");
  keys3(input.audit, ["reference", "approvedBy", "approvedAt", "approvalReference", "sources"], "audit");
  for (const k of ["reference", "approvedBy", "approvalReference"]) if (!nonempty2(input.audit[k])) fail4(`Auditoria sem ${k}`);
  date2(input.audit.approvedAt);
  if (!Array.isArray(input.audit.sources) || !input.audit.sources.length || !input.audit.sources.every((s) => {
    try {
      return typeof s === "string" && new URL(s).protocol === "https:";
    } catch {
      return false;
    }
  })) fail4("Fontes da auditoria inv\xE1lidas");
  reviewGuard2(snapshot.reviewState, lesson);
  if (!object2(lesson.challenge)) fail4("Desafio estruturado ausente");
  questions2(lesson.challenge.questions, "origem");
  const span = embedded2(lesson.content);
  if (!same2(span.challenge, lesson.challenge)) fail4("Desafio estruturado e conte\xFAdo divergentes");
  if (!Array.isArray(input.questions) || input.questions.length !== lesson.challenge.questions.length) fail4("Quantidade de quest\xF5es divergente");
  const differences = [];
  const revisedQuestions = [];
  input.questions.forEach((entry, index) => {
    keys3(entry, ["index", "originalSha256", "original", "revised", "approvedChanges"], `quest\xE3o ${index}`);
    const original = lesson.challenge.questions[index];
    if (entry.index !== index || !same2(entry.original, original) || entry.originalSha256 !== sha2562(original)) fail4(`Quest\xE3o ${index}: origem/ordem/hash divergente`);
    questions2([entry.revised], `quest\xE3o ${index}`);
    const revised = entry.revised;
    if (!same2(Object.keys(original).sort(), Object.keys(revised).sort())) fail4(`Quest\xE3o ${index}: campos opcionais removidos/adicionados`);
    for (const key of Object.keys(original)) if (!["text", "options", "correctIndex", "explanation"].includes(key) && !same2(original[key], revised[key])) fail4(`Quest\xE3o ${index}: campo imut\xE1vel ${key}`);
    if (original.options.length !== revised.options.length) fail4(`Quest\xE3o ${index}: quantidade de alternativas alterada`);
    if (!same2(original.options, revised.options) && same2([...original.options].sort(), [...revised.options].sort())) fail4(`Quest\xE3o ${index}: alternativas reordenadas`);
    for (let other = 0; other < input.questions.length; other++) if (other !== index && same2(revised, lesson.challenge.questions[other]) && !same2(original, revised)) fail4(`Quest\xE3o ${index}: quest\xF5es reordenadas`);
    const changes = [];
    for (const field of ["text", "correctIndex", "explanation"]) if (!same2(original[field], revised[field])) changes.push({ field, before: original[field], after: revised[field] });
    original.options.forEach((before, n) => {
      if (before !== revised.options[n]) changes.push({ field: `options[${n}]`, before, after: revised.options[n] });
    });
    if (!Array.isArray(entry.approvedChanges)) fail4("Lista de mudan\xE7as aprovadas ausente");
    entry.approvedChanges.forEach((c) => {
      keys3(c, ["field", "reason"], "mudan\xE7a aprovada");
      if (!nonempty2(c.reason)) fail4("Mudan\xE7a sem justificativa");
    });
    if (!same2(entry.approvedChanges.map((c) => c.field).sort(), changes.map((c) => c.field).sort())) fail4(`Quest\xE3o ${index}: altera\xE7\xF5es sem autoriza\xE7\xE3o ou autoriza\xE7\xF5es excedentes/duplicadas`);
    differences.push({ index, id: original.id ?? null, changed: changes.length > 0, changes: changes.map((c) => ({ ...c, reason: entry.approvedChanges.find((a) => a.field === c.field).reason })) });
    revisedQuestions.push(revised);
  });
  questions2(revisedQuestions, "revisadas");
  const challenge = { ...lesson.challenge, questions: revisedQuestions };
  const content = same2(challenge, lesson.challenge) ? lesson.content : lesson.content.slice(0, span.start) + replaceQuestionLeaves2(lesson.content.slice(span.start, span.end), differences) + lesson.content.slice(span.end);
  const proposedLesson = { ...lesson, challenge, content };
  if (Buffer.byteLength(JSON.stringify(proposedLesson), "utf8") > 9e5) fail4("Aula preparada excede limite conservador de 900.000 bytes");
  const changed = differences.some((d) => d.changed);
  return {
    ok: true,
    mode: "dry-run",
    remoteWriteEnabled: false,
    lessonId: lesson.id,
    conflicts: [],
    snapshotCapturedAt: snapshot.capturedAt,
    audit: input.audit,
    warning: "Snapshot local: exige nova leitura, aprova\xE7\xE3o do plano e autoriza\xE7\xE3o operacional antes de qualquer escrita futura.",
    planSha256: sha2562({ snapshot, input }),
    originalLessonSha256: sha2562(lesson),
    proposedLessonSha256: sha2562(proposedLesson),
    fieldsToUpdate: changed ? ["challenge.questions", "content (somente JSON ATHENA_CHALLENGE)"] : [],
    differences,
    backupPlan: { requiredBeforeWrite: true, confirmed: false, key: `${lesson.id}/${snapshot.capturedAt.replace(/[:.]/g, "-")}/v${lesson.version}-${sha2562(lesson)}`, document: structuredClone(lesson), reviewState: structuredClone(snapshot.reviewState), sha256: sha2562(lesson) },
    proposedLesson: structuredClone(proposedLesson)
  };
}
function dryRun2(snapshot, input) {
  try {
    return prepare2(parseStrict2(JSON.stringify(snapshot)), parseStrict2(JSON.stringify(input)));
  } catch (e) {
    return { ok: false, mode: "dry-run", remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] };
  }
}
function main2(args) {
  try {
    if (args.length !== 5 || args[0] !== "--dry-run" || args[1] !== "--snapshot" || args[3] !== "--input") fail4("Uso: node scripts/import-reviewed-questions.mjs --dry-run --snapshot snapshot.json --input revisadas.json. Escrita desabilitada.");
    return dryRun2(parseStrict2(readFileSync2(args[2], "utf8")), parseStrict2(readFileSync2(args[4], "utf8")));
  } catch (e) {
    return { ok: false, mode: "dry-run", remoteWriteEnabled: false, conflicts: [e.message], fieldsToUpdate: [] };
  }
}
if (process.argv[1] && "urn:athena:library-module" === pathToFileURL2(process.argv[1]).href) {
  const report = main2(process.argv.slice(2));
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exitCode = report.ok ? 0 : 1;
}

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/src/lib/legalReviewSources.ts
var FEDERAL_LEGISLATION = {
  family: "LEGISLACAO_FEDERAL",
  label: "Legisla\xE7\xE3o federal",
  hosts: ["planalto.gov.br", "camara.leg.br", "senado.leg.br"]
};
var ALWAYS_OFFICIAL = [
  FEDERAL_LEGISLATION,
  { family: "STF", label: "STF", hosts: ["stf.jus.br"] },
  { family: "STJ", label: "STJ", hosts: ["stj.jus.br"] },
  { family: "CNJ", label: "CNJ", hosts: ["cnj.jus.br"] },
  { family: "TSE", label: "TSE", hosts: ["tse.jus.br"] },
  { family: "TST", label: "TST", hosts: ["tst.jus.br"] },
  { family: "STM", label: "STM", hosts: ["stm.jus.br"] },
  { family: "DIARIO_OFICIAL", label: "Di\xE1rio Oficial", hosts: ["in.gov.br"] }
];
var STATE_COURT_SIGLAS = [
  "TJAC",
  "TJAL",
  "TJAM",
  "TJAP",
  "TJBA",
  "TJCE",
  "TJDFT",
  "TJES",
  "TJGO",
  "TJMA",
  "TJMG",
  "TJMS",
  "TJMT",
  "TJPA",
  "TJPB",
  "TJPE",
  "TJPI",
  "TJPR",
  "TJRJ",
  "TJRN",
  "TJRO",
  "TJRR",
  "TJRS",
  "TJSC",
  "TJSE",
  "TJSP",
  "TJTO"
];
function courtHost(sigla) {
  return {
    family: sigla,
    label: sigla,
    hosts: [`${sigla.toLowerCase()}.jus.br`]
  };
}
var CONDITIONAL_HOSTS = [
  { ...ALWAYS_OFFICIAL[3], pattern: /\bCNJ\b|Conselho Nacional de Justi[cç]a/i },
  { ...ALWAYS_OFFICIAL[4], pattern: /\bTSE\b|Tribunal Superior Eleitoral/i },
  { ...ALWAYS_OFFICIAL[5], pattern: /\bTST\b|Tribunal Superior do Trabalho/i },
  { ...ALWAYS_OFFICIAL[6], pattern: /\bSTM\b|Superior Tribunal Militar/i },
  { ...ALWAYS_OFFICIAL[7], pattern: /\bDOU\b|Di[aá]rio Oficial/i },
  ...STATE_COURT_SIGLAS.map((sigla) => ({
    ...courtHost(sigla),
    pattern: new RegExp(`\\b${sigla}\\b|Tribunal de Justi[c\xE7]a.{0,40}${sigla.slice(2)}`, "i")
  })),
  ...Array.from({ length: 6 }, (_, index) => {
    const n = index + 1;
    return {
      family: `TRF${n}`,
      label: `TRF${n}`,
      hosts: [`trf${n}.jus.br`],
      pattern: new RegExp(`\\bTRF-?${n}\\b`, "i")
    };
  }),
  ...Array.from({ length: 24 }, (_, index) => {
    const n = index + 1;
    return {
      family: `TRT${n}`,
      label: `TRT${n}`,
      hosts: [`trt${n}.jus.br`],
      pattern: new RegExp(`\\bTRT-?${n}\\b`, "i")
    };
  })
];
var NAMED_PATTERNS = [
  { family: "STF", pattern: /\bSTF\b|Supremo Tribunal Federal|repercuss[aã]o geral/i },
  { family: "STJ", pattern: /\bSTJ\b|Superior Tribunal de Justi[cç]a|recurso repetitivo|tema repetitivo/i },
  { family: "CNJ", pattern: /\bCNJ\b|Conselho Nacional de Justi[cç]a/i },
  { family: "TSE", pattern: /\bTSE\b|Tribunal Superior Eleitoral/i },
  { family: "TST", pattern: /\bTST\b|Tribunal Superior do Trabalho/i },
  { family: "STM", pattern: /\bSTM\b|Superior Tribunal Militar/i },
  { family: "DIARIO_OFICIAL", pattern: /\bDOU\b|Di[aá]rio Oficial da Uni[aã]o/i },
  ...STATE_COURT_SIGLAS.map((sigla) => ({
    family: sigla,
    pattern: new RegExp(`\\b${sigla}\\b`, "i")
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    family: `TRF${index + 1}`,
    pattern: new RegExp(`\\bTRF-?${index + 1}\\b`, "i")
  })),
  ...Array.from({ length: 24 }, (_, index) => ({
    family: `TRT${index + 1}`,
    pattern: new RegExp(`\\bTRT-?${index + 1}\\b`, "i")
  }))
];

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/src/lib/legalReviewValidate.ts
var DIAGNOSTIC_FAMILIES = /* @__PURE__ */ new Set([
  "LEGISLACAO_FEDERAL",
  "STF",
  "STJ",
  "CNJ",
  "TSE",
  "TST",
  "STM",
  "DIARIO_OFICIAL",
  "TJAC",
  "TJAL",
  "TJAM",
  "TJAP",
  "TJBA",
  "TJCE",
  "TJDFT",
  "TJES",
  "TJGO",
  "TJMA",
  "TJMG",
  "TJMS",
  "TJMT",
  "TJPA",
  "TJPB",
  "TJPE",
  "TJPI",
  "TJPR",
  "TJRJ",
  "TJRN",
  "TJRO",
  "TJRR",
  "TJRS",
  "TJSC",
  "TJSE",
  "TJSP",
  "TJTO",
  ...Array.from({ length: 6 }, (_, index) => `TRF${index + 1}`),
  ...Array.from({ length: 24 }, (_, index) => `TRT${index + 1}`)
]);

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/src/services/legalReviewRepository.ts
var PROCESSING_LEASE_MS = 2 * 60 * 1e3;
var PROCESSING_HEARTBEAT_MS = 20 * 1e3;

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/scripts/editorial-technical-rebase.mjs
var fields = ["0.text", "0.explanation", "3.explanation", "4.explanation", "5.text", "5.explanation", "7.options[1]", "7.explanation", "9.text"].sort();

// ../../2026-10-12/estou-iniciando-o-trabalho-com-o/work/cloudrun-admin-candidate/scripts/publish-reviewed-questions.mjs
var ATHENA_TARGET = Object.freeze({ projectId: "gen-lang-client-0822763072", databaseId: "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb" });

// work/athena-admin-gateway/preview-integration/native-firestore-port.ts
var registered = /* @__PURE__ */ new WeakMap();
var check2 = (v, c) => {
  if (!v) throw Error(c);
};
function assertEditorialDb(db) {
  check2(registered.has(db), "EDITORIAL_DB_DENIED");
}
var collections = /* @__PURE__ */ new Set(["homologated_lessons", "homologated_parts", "mcp_editorial_plans", "mcp_editorial_approvals", "mcp_editorial_backups", "mcp_editorial_receipts", "mcp_editorial_outbox", "mcp_editorial_operations", "editorial_cache_revisions"]);
function nativePort(native, lessonAllowed = (id) => id === "day_4_part_0") {
  const db = Object.freeze({}), refs = /* @__PURE__ */ new WeakSet();
  const wrap = (s) => ({ exists: () => s.exists, data: () => s.data() });
  registered.set(db, {
    target: { projectId: native.projectId, databaseId: native.databaseId, lessonId: "day_4_part_0", sectionIndex: 3 },
    async pending(mode) {
      let query = native.collection("mcp_editorial_outbox").where("state", "in", ["pending", "failed", "processing"]);
      if (!mode) query = query.limit(25);
      const s = await query.get();
      return s.docs.filter((d) => lessonAllowed(d.data().lessonId) && (!mode || d.data().operationMode === mode)).slice(0, 25).map((d) => d.id);
    },
    doc(collection, id) {
      check2(collections.has(collection) && typeof id === "string" && !id.includes("/"), "DOCUMENT_SCOPE");
      check2(["homologated_lessons", "homologated_parts", "editorial_cache_revisions"].includes(collection) ? lessonAllowed(id) : /^[a-f0-9]{64}$|^[a-f0-9-]{36}$/.test(id), "DOCUMENT_SCOPE");
      const r = native.collection(collection).doc(id);
      refs.add(r);
      return r;
    },
    async get(r) {
      check2(refs.has(r), "DOCUMENT_SCOPE");
      return wrap(await r.get());
    },
    transaction(fn, options) {
      return native.runTransaction((tx) => fn({ get: async (r) => {
        check2(refs.has(r), "DOCUMENT_SCOPE");
        return wrap(await tx.get(r));
      }, set: (r, value, opts) => {
        check2(refs.has(r), "DOCUMENT_SCOPE");
        return opts ? tx.set(r, value, opts) : tx.set(r, value);
      } }), options?.readOnly ? { readOnly: true } : { maxAttempts: 5 });
    }
  });
  return db;
}
function doc(db, collection, id) {
  assertEditorialDb(db);
  return registered.get(db).doc(collection, id);
}
function getDoc(ref) {
  check2(typeof ref.get === "function", "DOCUMENT_SCOPE");
  return ref.get().then((s) => ({ exists: () => s.exists, data: () => s.data() }));
}
function runTransaction(db, fn, options) {
  assertEditorialDb(db);
  return registered.get(db).transaction(fn, options);
}
function editorialTarget(db) {
  assertEditorialDb(db);
  return registered.get(db).target;
}
async function bindCeoPublicationPort({ native, verifyManagedIdentity, lessonAllowed }) {
  check2(native.projectId === "gen-lang-client-0822763072" && native.databaseId === "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb", "CEO_TARGET_REQUIRED");
  const identity = await verifyManagedIdentity();
  check2(identity?.managed === true && identity.email === "217533514119-compute@developer.gserviceaccount.com", "CEO_IDENTITY_REQUIRED");
  const db = nativePort(native, lessonAllowed);
  return { db, terminate: () => native.terminate() };
}

// work/athena-integration/src/lib/objectiveChallenge.ts
var LETTERS = ["A", "B", "C", "D", "E"];
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}
function optionText(opt) {
  if (typeof opt === "string") return opt.trim();
  const rec = asRecord(opt);
  if (!rec) return "";
  const raw = rec.text ?? rec.label ?? rec.option ?? rec.conteudo ?? rec.content;
  return typeof raw === "string" ? raw.trim() : "";
}
function toCorrectIndex(value, optionCount) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    if (n >= 0 && n < optionCount) return n;
    if (n >= 1 && n <= optionCount) return n - 1;
    return null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^[0-4]$/.test(trimmed)) {
    const n = Number(trimmed);
    return n < optionCount ? n : null;
  }
  if (/^[1-5]$/.test(trimmed)) {
    const n = Number(trimmed);
    if (n >= 1 && n <= optionCount && n >= optionCount) return n - 1;
  }
  const letter = trimmed.toUpperCase().replace(/[^A-E]/g, "");
  if (letter.length === 1) {
    const idx = LETTERS.indexOf(letter);
    if (idx >= 0 && idx < optionCount) return idx;
  }
  return null;
}
function questionList(raw) {
  if (Array.isArray(raw)) return raw;
  const rec = asRecord(raw);
  if (!rec) return [];
  const list = rec.questions ?? rec.questoes ?? rec.itens ?? rec.items;
  return Array.isArray(list) ? list : [];
}
function normalizeObjectiveChallenge(raw) {
  const questions3 = [];
  for (const item of questionList(raw)) {
    const rec = asRecord(item);
    if (!rec) continue;
    const text = String(rec.text ?? rec.enunciado ?? rec.question ?? "").trim();
    const options = (Array.isArray(rec.options) ? rec.options : Array.isArray(rec.alternativas) ? rec.alternativas : []).map(optionText).filter(Boolean).slice(0, 5);
    if (!text || options.length < 2) continue;
    const correctIndex = toCorrectIndex(
      rec.correctIndex ?? rec.correctAnswer ?? rec.gabarito ?? rec.answer ?? rec.resposta,
      options.length
    );
    if (correctIndex === null || correctIndex < 0) continue;
    questions3.push({
      text,
      options,
      correctIndex,
      explanation: String(rec.explanation ?? rec.explicacao ?? rec.comment ?? "").trim()
    });
  }
  if (!questions3.length) return void 0;
  return { questions: questions3 };
}
function extractBalancedJson(text, fromIndex = 0) {
  const start = text.indexOf("{", fromIndex);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return { json: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null;
}
function parseJsonLoose(json) {
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(json.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return void 0;
    }
  }
}
function extractChallengeFromText2(text) {
  const source = text || "";
  const match = /\[ATHENA_CHALLENGE\]/i.exec(source);
  if (!match) return { content: source };
  const balanced = extractBalancedJson(source, match.index + match[0].length);
  if (!balanced) return { content: source };
  const challenge = normalizeObjectiveChallenge(parseJsonLoose(balanced.json));
  const content = `${source.slice(0, match.index)}${source.slice(balanced.end)}`.replace(/\n{3,}/g, "\n\n");
  return { challenge, content };
}

// work/athena-integration/src/lib/ceoLessonEditing.ts
function readCeoMarkdown(content) {
  const tags = [...content.matchAll(/\[ATHENA_CHALLENGE\]/gi)];
  if (tags.length > 1) throw new Error("JSON de quest\xF5es duplicado.");
  let challenge;
  if (tags.length) {
    const tag = tags[0];
    const balanced = extractBalancedJson(content, tag.index + tag[0].length);
    if (!balanced || content.slice(tag.index + tag[0].length, content.indexOf("{", tag.index)).trim()) throw new Error("JSON de quest\xF5es inv\xE1lido.");
    try {
      challenge = JSON.parse(balanced.json);
    } catch {
      throw new Error("JSON de quest\xF5es inv\xE1lido.");
    }
    if (!challenge || !Array.isArray(challenge.questions) || !challenge.questions.length || challenge.questions.some(
      (q) => !q || typeof q.text !== "string" || !q.text.trim() || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 || q.options.some((o) => typeof o !== "string" || !o.trim()) || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length || typeof q.explanation !== "string"
    )) throw new Error("Formato das quest\xF5es incompat\xEDvel.");
  }
  const markers = [...content.matchAll(/\[BLOCK_(\d+)\]/g)];
  if (markers.length !== 6 || markers.some((m, i) => Number(m[1]) !== i + 1)) throw new Error("A aula deve conter os seis blocos \xFAnicos e ordenados.");
  const display = extractChallengeFromText2(content).content;
  const positions = [...display.matchAll(/\[BLOCK_(\d+)\]/g)];
  const blocks = positions.map((m, i) => display.slice(m.index + m[0].length, positions[i + 1]?.index ?? display.length).trim());
  return { content, challenge, blocks };
}
function exactPublishedLesson(lesson) {
  const parsed = readCeoMarkdown(lesson.content);
  if (lesson.challenge && !parsed.challenge) throw new Error("O Markdown n\xE3o cont\xE9m as quest\xF5es estruturadas.");
  if (lesson.challenge && JSON.stringify(lesson.challenge) !== JSON.stringify(parsed.challenge)) throw new Error("Quest\xF5es divergentes entre Markdown e challenge.");
  const result = { ...lesson, ...parsed.challenge ? { challenge: parsed.challenge } : {} };
  if (lesson.blocks !== void 0) {
    if (!Array.isArray(lesson.blocks) || lesson.blocks.length !== 6 || lesson.blocks.some((b) => typeof b !== "string")) throw new Error("Formato de blocks incompat\xEDvel.");
    const raw = [...lesson.content.matchAll(/\[BLOCK_(\d+)\]/g)].map((m, i, all) => lesson.content.slice(m.index + m[0].length, all[i + 1]?.index ?? lesson.content.length).trim());
    result.blocks = lesson.blocks.some((b) => /\[ATHENA_CHALLENGE\]/i.test(b)) ? raw : parsed.blocks;
  }
  if (JSON.stringify(result).length > 9e5 || new TextEncoder().encode(JSON.stringify(result)).length > 9e5) throw new Error("A aula excede o limite seguro de grava\xE7\xE3o; nenhum conte\xFAdo foi truncado.");
  return result;
}

// work/athena-admin-gateway/catalog-integration/persistCeoCatalogLesson.ts
async function persistCeoCatalogLesson(db, lesson, clean2, hooks) {
  const ref = doc(db, "homologated_lessons", lesson.id);
  return runTransaction(db, async (tx) => {
    const previous = await tx.get(ref);
    const existing = previous.data();
    if (hooks) await hooks.before(tx, existing);
    if (existing?.blocks !== void 0 && (!Array.isArray(existing.blocks) || existing.blocks.length !== 6 || existing.blocks.some((b) => typeof b !== "string"))) throw new Error("Formato publicado de blocks incompat\xEDvel.");
    let published = { ...lesson };
    if (existing?.blocks !== void 0 && published.blocks === void 0) published.blocks = existing.blocks;
    if (/\[ATHENA_CHALLENGE\]/i.test(published.content)) published = exactPublishedLesson(published);
    if (hooks?.afterNormalize) published = hooks.afterNormalize(existing, published);
    if (existing?.version !== void 0 && (!Number.isInteger(existing.version) || existing.version < 1)) throw new Error("Vers\xE3o publicada incompat\xEDvel.");
    published.version = (existing?.version || 0) + 1;
    published.approvedAt = Math.max(lesson.approvedAt, (existing?.approvedAt || 0) + 1);
    const payload = clean2({
      id: published.id,
      day: Math.round(published.day),
      part: Math.round(published.part),
      subject: published.subject,
      topic: published.topic,
      content: published.content,
      status: "approved",
      approvedBy: "jhonny.spider@gmail.com",
      approvedAt: published.approvedAt,
      version: published.version,
      modelUsed: published.modelUsed,
      review: published.review,
      challenge: published.challenge,
      blocks: published.blocks
    });
    if (JSON.stringify(payload).length > 9e5 || new TextEncoder().encode(JSON.stringify(payload)).length > 9e5) throw new Error("A aula excede o limite seguro; nenhum conte\xFAdo foi truncado.");
    tx.set(ref, payload, { merge: true });
    tx.set(doc(db, "homologated_parts", lesson.id), clean2({
      id: published.id,
      day: published.day,
      part: published.part,
      subject: published.subject,
      status: "approved",
      approvedBy: "jhonny.spider@gmail.com",
      approvedAt: published.approvedAt,
      review: (published.review || "").slice(0, 2e4)
    }), { merge: true });
    if (hooks) hooks.after(tx, { ...existing, ...payload });
    return published;
  });
}

// work/athena-admin-gateway/catalog-integration/editorial-flow.ts
var demand = (v, c) => {
  if (!v) throw Error(c);
};
async function consumeInvalidation(db, id, { now = Date.now, worker = crypto.randomUUID(), failEffect = false, lessonId = TARGET.lessonId } = {}) {
  assertEditorialDb(db);
  demand(/^[a-f0-9]{64}$/.test(id), "PLAN_ID");
  const ref = doc(db, "mcp_editorial_outbox", id), revision = doc(db, "editorial_cache_revisions", lessonId);
  const event = await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    demand(s.exists(), "OUTBOX_MISSING");
    const e = s.data();
    demand(e.lessonId === lessonId && Number.isSafeInteger(e.version) && e.version > 0, "OUTBOX_SCOPE");
    if (e.state === "done" || e.leaseUntil > now()) return null;
    tx.set(ref, { ...e, state: "processing", worker, leaseUntil: now() + 3e4, attempts: (e.attempts ?? 0) + 1 });
    return e;
  });
  if (!event) return { state: "skipped" };
  try {
    if (failEffect) throw Error("SIMULATED_CACHE_FAILURE");
    await runTransaction(db, async (tx) => {
      const [lease, old] = await Promise.all([tx.get(ref), tx.get(revision)]);
      demand(lease.data()?.worker === worker && lease.data()?.state === "processing", "LEASE_LOST");
      const previous = old.data()?.version ?? 0;
      if (previous < event.version) tx.set(revision, { lessonId, version: event.version, approvedAt: event.approvedAt, planSha256: id });
      tx.set(ref, { ...lease.data(), state: "done", leaseUntil: 0, completedAt: now() });
    });
    return { state: "done" };
  } catch {
    await runTransaction(db, async (tx) => {
      const s = await tx.get(ref);
      if (s.data()?.worker === worker && s.data()?.state === "processing") tx.set(ref, { ...s.data(), state: "failed", leaseUntil: 0, failureCode: "CACHE_INVALIDATION_FAILED", failedAt: now() });
    });
    return { state: "failed", code: "CACHE_INVALIDATION_FAILED" };
  }
}

// work/athena-admin-gateway/real-catalog-pilot/exact-reviewed-lesson.ts
function exactReviewedLesson(lesson) {
  const parsed = readCeoMarkdown(lesson.content);
  if (lesson.challenge && sha256(lesson.challenge) !== sha256(parsed.challenge ?? null)) throw Error("QUESTIONS_CHANGED");
  return exactPublishedLesson({ ...lesson, ...lesson.challenge ? { challenge: parsed.challenge } : {} });
}

// work/athena-admin-gateway/ceo-approval-bridge/bridge.ts
import { createHash as createHash4 } from "node:crypto";
var fail5 = (v, c) => {
  if (!v) throw Error(c);
};
var uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
var hex = /^[a-f0-9]{64}$/;
var clean = (v) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== void 0));
function checkPlan(p, owner, now, approvedMarkdown, demo) {
  validatePlan(p, owner, now);
  fail5(uuid.test(p.operationId) && p.operationMode === "reviewed-real-day4-block4-v1", "OPERATION_SCOPE");
  fail5(sha256(p.target) === sha256(demo ? { ...TARGET, projectId: "demo-athena-editorial-integration", databaseId: "athena-local" } : TARGET), "TARGET_SCOPE");
  fail5(p.baselineVersion === 2 && (demo || p.baselineSha256 === BASELINE), "BASELINE_SCOPE");
  fail5(p.reviewedArtifact?.sha256 === sha256Bytes(approvedMarkdown), "ARTIFACT_SCOPE");
  const a = split(p.before.content), b = split(p.proposed.content);
  fail5(b.chunks[3] === approvedMarkdown && b.prefix === a.prefix && b.chunks.every((x, i) => i === 3 || x === a.chunks[i]), "CONTENT_SCOPE");
  const expected = exactReviewedLesson({ ...p.before, content: b.prefix + b.chunks.join("") });
  fail5(sha256(expected) === sha256(p.proposed), "INTEGRITY");
}
var sha256Bytes = (s) => createHash4("sha256").update(s, "utf8").digest("hex");
function createCeoPublicationEntry({ db, verifyServiceIdentity, verifyEvidence, approvedMarkdown, now = Date.now, demo = false, validate = null, resolveTarget = null }) {
  if (!demo && !validate) fail5(sha256Bytes(approvedMarkdown) === "f02b20cead30d1ab45b335f753b5d43257530a6e04ea548c92e5dab5f49423ab", "ARTIFACT_HASH");
  const target = editorialTarget(db);
  fail5(validate ? target.projectId === (demo ? "demo-athena-editorial-integration" : TARGET.projectId) && target.databaseId === (demo ? "athena-local" : TARGET.databaseId) : sha256(target) === sha256(demo ? { ...TARGET, projectId: "demo-athena-editorial-integration", databaseId: "athena-local" } : TARGET), "WRITER_TARGET");
  const authorize = async (token) => {
    const p = await verifyServiceIdentity(token);
    fail5(p?.email === CALLER && p.email_verified === true && p.issuer === "https://accounts.google.com", "SERVICE_IDENTITY");
  };
  const refs = (id, lessonId = TARGET.lessonId) => ({ catalog: doc(db, "homologated_parts", lessonId), approval: doc(db, "mcp_editorial_approvals", id), backup: doc(db, "mcp_editorial_backups", id), receipt: doc(db, "mcp_editorial_receipts", id), outbox: doc(db, "mcp_editorial_outbox", id) });
  return {
    async authCheck(evidence, serviceToken) {
      await authorize(serviceToken);
      const e = verifyEvidence(evidence);
      fail5(e && Object.keys(e).sort().join(",") === "audience,expiresAt,issuedAt,issuer,nonce,purpose" && e.purpose === "athena-bridge-authentication-check" && e.issuer === "athena-mcp-hml-20261013" && e.audience === "athena-ceo-pilot-publication" && uuid.test(e.nonce) && Number.isSafeInteger(e.issuedAt) && Number.isSafeInteger(e.expiresAt) && e.issuedAt <= now() && now() < e.expiresAt && e.expiresAt - e.issuedAt <= 6e4, "AUTH_PROOF_INVALID");
      return { authenticated: true, signatureVerified: true, nonce: e.nonce, editorialOperations: 0 };
    },
    async publish(evidence, serviceToken) {
      await authorize(serviceToken);
      const e = verifyEvidence(evidence), p = e.plan, a = e.approval;
      fail5(e.issuer === "athena-mcp-hml-20261013" && e.audience === "athena-ceo-pilot-publication" && e.caller === CALLER && e.writer === WRITER && e.reservationId === p.operationId && e.expiresAt === p.expiresAt && e.issuedAt <= now() && now() < e.expiresAt, "EVIDENCE_SCOPE");
      if (validate) validate(p, a.actor, now());
      else checkPlan(p, a.actor, now(), approvedMarkdown, demo);
      fail5(a.state === "approved" && a.method === "authenticated-browser-explicit-post" && a.operationId === p.operationId && a.planSha256 === p.planSha256 && a.baselineVersion === p.baselineVersion && a.baselineSha256 === p.baselineSha256 && a.contentSha256 === sha256(p.proposed) && a.expiresAt === p.expiresAt, "APPROVAL_BINDING");
      if (resolveTarget) fail5(sha256(resolveTarget(p)) === sha256(p.target), "TARGET_SCOPE");
      const r = refs(p.planSha256, p.target.lessonId), hooks = transactionHooks({ plan: p, actor: a.actor, now: now(), nowProvider: now, refs: r, ...validate ? { validate } : {} });
      const wrapped = { ...validate ? { afterNormalize: (existing, normalized2) => {
        if (p.editType === "questions") return preserveApprovedQuestionRepresentations(normalized2, p);
        fail5(normalized2.content === p.proposed.content && sha256(normalized2.challenge ?? null) === sha256(p.proposed.challenge ?? null), "PUBLISHED_CONTENT_DIVERGENCE");
        const exact = preserveUneditedBlocks(existing, normalized2, p.target.sectionIndex);
        fail5(sha256(exact.blocks ?? null) === sha256(p.proposed.blocks ?? null), "PUBLISHED_BLOCKS_DIVERGENCE");
        return exact;
      } } : {}, before: async (tx, existing) => {
        if (validate) validate(p, a.actor, now());
        else checkPlan(p, a.actor, now(), approvedMarkdown, demo);
        await hooks.before({ ...tx, get: async (ref) => {
          if (ref.path === r.approval.path) {
            const old = await tx.get(ref);
            fail5(!old.exists(), "APPROVAL_REUSED");
            return { exists: () => true, data: () => a };
          }
          return tx.get(ref);
        } }, existing);
      }, after: (tx, published) => {
        hooks.after(tx, published);
        if (p.editType === "questions") tx.set(r.receipt, { editType: "questions", questionsBeforeSha256: p.questionsBeforeSha256, questionsAfterSha256: p.questionsAfterSha256, questionsJsonSha256: p.reviewedArtifact.sha256, questionChanges: p.authorizedChanges }, { merge: true });
      } };
      await persistCeoCatalogLesson(db, { ...p.proposed, approvedAt: now() }, clean, wrapped);
      const receipt = (await getDoc(r.receipt)).data();
      await consumeInvalidation(db, p.planSha256, { now, lessonId: p.target.lessonId });
      return receipt;
    },
    async receipt(id, operationId, serviceToken) {
      await authorize(serviceToken);
      fail5(hex.test(id) && uuid.test(operationId), "RECEIPT_SCOPE");
      const s = await getDoc(refs(id).receipt);
      if (!s.exists()) return null;
      fail5(s.data().operationId === operationId, "RECEIPT_SCOPE");
      await consumeInvalidation(db, id, { now, lessonId: s.data().lessonId });
      return s.data();
    }
  };
}

// work/athena-admin-gateway/ceo-approval-bridge/transport.ts
import { Compute as Compute2, GoogleAuth as GoogleAuth2 } from "google-auth-library";

// work/athena-admin-gateway/real-catalog-pilot/runtime.ts
import { Compute as Compute3, GoogleAuth as GoogleAuth3 } from "google-auth-library";
import { Firestore as NativeFirestore2 } from "@google-cloud/firestore";

// work/athena-admin-gateway/real-catalog-pilot/adapter.ts
var PROFILE = Object.freeze({ ...TARGET, marker: "[BLOCK_4]", baselineVersion: 2, baselineSha256: "d57cac791bbe16941b1307c7c51a71e7df4f62214210767979d5745592ff6f54", discoveryOnly: true, enabled: false });

// work/athena-admin-gateway/catalog-generalization/install.ts
import { createHash as createHash6, createPublicKey as createPublicKey2 } from "node:crypto";

// work/athena-admin-gateway/ceo-approval-bridge/routes.ts
import { OAuth2Client } from "google-auth-library";
function googleServiceVerifier(audience) {
  if (audience !== "https://athenaapi-37efv4sd6a-rj.a.run.app") throw Error("SERVICE_AUDIENCE");
  const client = new OAuth2Client();
  return async (token) => {
    const ticket = await client.verifyIdToken({ idToken: token, audience }), p = ticket.getPayload();
    if (!p || !["accounts.google.com", "https://accounts.google.com"].includes(p.iss) || p.email !== CALLER || p.email_verified !== true) throw Error("SERVICE_IDENTITY");
    return { email: p.email, email_verified: true, issuer: "https://accounts.google.com" };
  };
}
function mountCeoPilotBridge(app, entry, { enabled = false, publishEnabled = false } = {}) {
  const paths = ["/api/internal/mcp-day4/publish", "/api/internal/mcp-day4/receipt", "/api/internal/mcp-day4/auth-check"];
  for (const path of paths) app.post(path, async (req, res) => {
    if (!enabled) return res.status(403).json({ error: "PILOT_DISABLED" });
    const token = String(req.headers.authorization ?? "").match(/^Bearer ([^\s]+)$/)?.[1];
    if (!token) return res.status(401).json({ error: "SERVICE_AUTH_REQUIRED" });
    try {
      const b = req.body;
      if (path.endsWith("/auth-check")) {
        if (!b || Object.keys(b).join(",") !== "evidence" || typeof b.evidence !== "string") throw Error("INPUT_SCOPE");
        return res.json(await entry.authCheck(b.evidence, token));
      }
      if (path.endsWith("/publish")) {
        if (!publishEnabled) return res.status(403).json({ error: "PUBLICATION_DISABLED" });
      }
      if (path.endsWith("/publish")) {
        if (!b || Object.keys(b).join(",") !== "evidence" || typeof b.evidence !== "string") throw Error("INPUT_SCOPE");
        return res.json(await entry.publish(b.evidence, token));
      }
      if (!b || Object.keys(b).sort().join(",") !== "operationId,planSha256") throw Error("INPUT_SCOPE");
      return res.json({ receipt: await entry.receipt(b.planSha256, b.operationId, token) });
    } catch {
      res.status(403).json({ error: "PILOT_REQUEST_REJECTED" });
    }
  });
}

// work/athena-admin-gateway/catalog-generalization/preparation-diagnostics.mjs
import { AsyncLocalStorage } from "node:async_hooks";
var context = new AsyncLocalStorage();
var codes = /* @__PURE__ */ new Set(["MCP_CONTRACT", "MCP_ARTIFACT_HASH", "MCP_PREVIEW_NOT_AUTHORIZED", "MCP_CONCURRENT_CHANGE", "MCP_CATALOG_SCOPE", "MCP_CATALOG_ORIGIN", "MCP_CATALOG_ENVIRONMENT", "MCP_ARTIFACT_SCOPE", "MCP_QUESTIONS_CHANGED", "MCP_MARKDOWN_CHANGED", "MCP_METADATA_CHANGED", "MCP_BLOCKS_CHANGED", "MCP_NO_CHANGES", "MCP_OPERATION_EXISTS", "MCP_AUTH_REQUIRED", "MCP_ADMIN_REQUIRED"]);
for (const suffix of ["QUESTIONS_DISABLED", "QUESTIONS_CONTRACT", "QUESTIONS_SIZE", "QUESTIONS_JSON", "QUESTIONS_DUPLICATE_KEY", "QUESTIONS_SCHEMA", "QUESTIONS_OPTIONS", "QUESTIONS_ANSWER", "QUESTIONS_DUPLICATE_ID", "QUESTIONS_DUPLICATE", "QUESTIONS_REPRESENTATION", "QUESTIONS_ABSENT", "QUESTIONS_METADATA_CHANGED", "QUESTIONS_COUNT", "QUESTIONS_IDENTITY_CHANGED", "QUESTIONS_ORDER", "QUESTIONS_NO_CHANGES", "QUESTIONS_APPROVAL_SCOPE", "QUESTIONS_HASH", "QUESTIONS_PLAN_SCOPE", "QUESTIONS_APPROVAL_INVALID", "QUESTIONS_PLAN_TAMPERED"]) codes.add("MCP_" + suffix);

// work/athena-admin-gateway/catalog-generalization/policy.mjs
import { createHash as createHash5 } from "node:crypto";

// work/athena-front-b-approval-diagnostics/scripts/editorial-catalog-scope.mjs
function editorialSlot2(id) {
  const m = typeof id === "string" && /^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(id);
  if (!m || +m[1] > 100) throw Error("EDITORIAL_SCOPE");
  return { day: +m[1], part: +m[2] };
}
var normalized = (s) => typeof s === "string" ? s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toUpperCase() : "";
var aliases = { "CONSTITUICAO FEDERAL": "DIREITO CONSTITUCIONAL", "PROCESSO CIVIL": "DIREITO PROCESSUAL CIVIL", "PROCESSO PENAL": "DIREITO PROCESSUAL PENAL", "LINDB": "LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO", "LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO (LINDB)": "LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO" };
var subject = (s) => aliases[normalized(s)] ?? normalized(s);
function validateEditorialCatalog3(state, document) {
  const slot = editorialSlot2(document.lessonId), l = state?.lesson, c = state?.catalogEntry, fail7 = (code) => {
    throw Error(code);
  };
  if (!l || l.id !== document.lessonId || l.day !== slot.day || l.part !== slot.part || l.status !== "approved" || !Number.isSafeInteger(l.version) || l.version < 1) fail7("EDITORIAL_PUBLISHED_METADATA");
  if (!c || c.id !== l.id || c.day !== slot.day || c.part !== slot.part || c.status !== "approved") fail7("EDITORIAL_CATALOG_MEMBERSHIP");
  if (!subject(document.subject) || subject(document.subject) !== subject(l.subject) || subject(l.subject) !== subject(c.subject)) fail7("EDITORIAL_SUBJECT_DIVERGENCE");
  if (c.version !== void 0 && c.version !== l.version) fail7("EDITORIAL_CATALOG_VERSION");
  return slot;
}

// work/athena-admin-gateway/catalog-generalization/policy.mjs
var fail6 = (ok, code) => {
  if (!ok) throw Error("MCP_" + code);
};
var bytesHash = (s) => createHash5("sha256").update(s, "utf8").digest("hex");
var idPattern = /^day_([1-9]\d?|100)_part_(0|[1-9]\d?)$/;
var markerPattern = /^\[BLOCK_([1-6])\]$/;
var uuid2 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function createCatalogPolicy({ target = TARGET, allowLessons = null, demo = false } = {}) {
  const origin = demo ? { projectId: "demo-athena-editorial-integration", databaseId: "athena-local" } : { projectId: TARGET.projectId, databaseId: TARGET.databaseId };
  fail6(target.projectId === origin.projectId && target.databaseId === origin.databaseId, "CATALOG_ORIGIN");
  if (allowLessons !== null) fail6(Array.isArray(allowLessons) && allowLessons.length > 0 && allowLessons.every((id) => idPattern.test(id)) && new Set(allowLessons).size === allowLessons.length, "CATALOG_POLICY");
  if (allowLessons) allowLessons = Object.freeze([...allowLessons]);
  const resolve = (snapshot, lessonId, marker) => {
    fail6(idPattern.test(lessonId) && markerPattern.test(marker) && (!allowLessons || allowLessons.includes(lessonId)), "CATALOG_SCOPE");
    validateEditorialCatalog3(snapshot, { lessonId, subject: snapshot?.lesson?.subject });
    fail6(demo ? snapshot.lesson.synthetic === true : snapshot.lesson.synthetic !== true, "CATALOG_ENVIRONMENT");
    const sectionIndex = Number(marker.match(markerPattern)[1]) - 1;
    split(snapshot.lesson.content);
    return Object.freeze({ ...origin, lessonId, sectionIndex });
  };
  return { origin, resolve, allowLessons, demo };
}
function preservedQuestions(before, proposed, replacement, section) {
  const challenge = (s) => s.indexOf("[ATHENA_CHALLENGE]");
  if (challenge(section) >= 0) fail6(replacement.slice(challenge(replacement)) === section.slice(challenge(section)), "QUESTIONS_CHANGED");
  else fail6(challenge(replacement) < 0, "QUESTIONS_CHANGED");
  fail6(sha256(before.challenge ?? null) === sha256(proposed.challenge ?? null), "QUESTIONS_CHANGED");
}
function buildCatalogPlan(snapshot, replacement, { policy, normalize, actor, now, operationId, lessonId, marker, markdownSha256 }) {
  const target = policy.resolve(snapshot, lessonId, marker), before = structuredClone(snapshot.lesson), parts = split(before.content), i = target.sectionIndex;
  fail6(uuid2.test(operationId) && typeof actor === "string" && actor && Number.isSafeInteger(now), "PLAN_SCOPE");
  fail6(bytesHash(replacement) === markdownSha256 && replacement.startsWith(marker) && [...replacement.matchAll(/\[BLOCK_\d+\]/g)].length === 1, "ARTIFACT_SCOPE");
  fail6([...replacement.matchAll(/\[\/?BLOCK_(\d+)\]/g)].every((m) => Number(m[1]) === i + 1), "ARTIFACT_SCOPE");
  const chunks = [...parts.chunks];
  chunks[i] = replacement;
  const proposed = preserveUneditedBlocks(before, normalize({ ...before, content: parts.prefix + chunks.join("") }), i);
  preservedQuestions(before, proposed, replacement, parts.chunks[i]);
  const after = split(proposed.content);
  fail6(after.prefix === parts.prefix && after.chunks.every((s, n) => s === chunks[n]), "MARKDOWN_CHANGED");
  fail6(sha256(proposed) === sha256({ ...before, content: proposed.content, ...before.blocks !== void 0 ? { blocks: proposed.blocks } : {} }), "METADATA_CHANGED");
  if (before.blocks !== void 0) fail6(Array.isArray(before.blocks) && before.blocks.length === 6 && before.blocks.every((b, n) => n === i || b === proposed.blocks?.[n]), "BLOCKS_CHANGED");
  fail6(before.content !== proposed.content, "NO_CHANGES");
  const body = { operationId, operationMode: "catalog-block-v1", environment: "real", target, marker, actor, createdAt: now, expiresAt: now + 6e5, baselineVersion: before.version, baselineSha256: sha256(before), catalogSha256: sha256(snapshot.catalogEntry), before, catalogBefore: structuredClone(snapshot.catalogEntry), proposed, reviewedArtifact: { sha256: markdownSha256 } };
  return { ...body, planSha256: sha256(body) };
}
function validateCatalogPlan(p, actor, now, policy, normalize) {
  fail6(p && p.operationMode === "catalog-block-v1" && p.environment === "real" && actor === p.actor && now < p.expiresAt, "APPROVAL_INVALID");
  const rebuilt = buildCatalogPlan({ lesson: p.before, catalogEntry: p.catalogBefore }, split(p.proposed.content).chunks[p.target.sectionIndex], { policy, normalize, actor, now: p.createdAt, operationId: p.operationId, lessonId: p.target.lessonId, marker: p.marker, markdownSha256: p.reviewedArtifact.sha256 });
  fail6(sha256(rebuilt) === sha256(p), "PLAN_TAMPERED");
}

// work/athena-admin-gateway/catalog-generalization/runtime.ts
var requireValue = (v, c) => {
  if (!v) throw Error("MCP_" + c);
};
function createGeneralizedReceiver({ policy, questionsEnabled = () => false, ...deps }) {
  return createCeoPublicationEntry({ ...deps, approvedMarkdown: null, validate: (p, a, t) => {
    if (p?.editType === "questions") {
      requireValue(questionsEnabled(), "QUESTIONS_DISABLED");
      validateQuestionsPlan(p, a, t, policy);
    } else validateCatalogPlan(p, a, t, policy, exactReviewedLesson);
  }, resolveTarget: (p) => policy.resolve({ lesson: p.before, catalogEntry: p.catalogBefore }, p.target.lessonId, p.editType === "questions" ? `[BLOCK_${p.target.sectionIndex + 1}]` : p.marker) });
}

// work/athena-admin-gateway/catalog-generalization/install.ts
var check3 = (v, c) => {
  if (!v) throw Error(c);
};
async function installGeneralizedCeo(app, { native, env, publicKey, kid, verifyManagedIdentity }) {
  check3(env.ATHENA_CATALOG_GENERALIZED === "true" && env.DISCOVERY_ONLY === "true" && env.K_SERVICE === "athenaapi" && (env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT) === "gen-lang-client-0822763072", "MCP_CATALOG_RECEIVER");
  check3(kid === "athena-day4-v1" && createHash6("sha256").update(createPublicKey2(publicKey).export({ type: "spki", format: "der" })).digest("hex") === env.ATHENA_APPROVAL_PUBLIC_KEY_SHA256, "MCP_KEY_PIN");
  const policy = createCatalogPolicy({ allowLessons: env.ATHENA_CATALOG_ALLOW_ALL === "true" ? null : JSON.parse(env.ATHENA_CATALOG_LESSONS ?? "[]") });
  const port = await bindCeoPublicationPort({ native, verifyManagedIdentity, lessonAllowed: (id) => idPattern.test(id) && (!policy.allowLessons || policy.allowLessons.includes(id)) });
  const entry = createGeneralizedReceiver({ questionsEnabled: () => env.ATHENA_CATALOG_QUESTIONS_ENABLED === "true", policy, db: port.db, verifyServiceIdentity: googleServiceVerifier("https://athenaapi-37efv4sd6a-rj.a.run.app"), verifyEvidence: approvalVerifier(publicKey, kid) });
  mountCeoPilotBridge(app, entry, { enabled: true, publishEnabled: env.ATHENA_CATALOG_WRITES_ENABLED === "true" });
  return { enabled: true, stop: port.terminate };
}

// work/athena-admin-gateway/ceo-approval-bridge/install.ts
import { createPublicKey as createPublicKey3, createHash as createHash8 } from "node:crypto";

// work/athena-admin-gateway/ceo-approval-bridge/auth-only-receiver.ts
import { createHash as createHash7 } from "node:crypto";
var need = (v) => {
  if (!v) throw Error("AUTH_PROOF_INVALID");
};
var canonical3 = (x) => Array.isArray(x) ? "[" + x.map(canonical3).join(",") + "]" : x && typeof x === "object" ? "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + canonical3(x[k])).join(",") + "}" : JSON.stringify(x);
var referenceHash = (p) => createHash7("sha256").update(canonical3({ purpose: p.purpose, operationId: p.operationId, lessonId: p.lessonId, section: p.section, baselineVersion: p.baselineVersion, baselineSha256: p.baselineSha256, markdownSha256: p.markdownSha256 })).digest("hex");
function createAuthOnlyReceiver({ verifyServiceIdentity, verifyEvidence, now = Date.now }) {
  return { async authCheck(evidence, token) {
    const identity = await verifyServiceIdentity(token);
    need(identity?.email === CALLER && identity.email_verified === true && identity.issuer === "https://accounts.google.com");
    const e = verifyEvidence(evidence);
    need(e && Object.keys(e).sort().join(",") === ["issuer", "audience", "purpose", "nonce", "operationId", "issuedAt", "expiresAt", "lessonId", "section", "baselineVersion", "baselineSha256", "markdownSha256", "planSha256"].sort().join(","));
    need(e.issuer === "athena-mcp-hml-20261013" && e.audience === "athena-ceo-pilot-publication" && e.purpose === "athena-bridge-authentication-check");
    need(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(e.operationId) && e.nonce === e.operationId);
    need(e.lessonId === "day_4_part_0" && e.section === "[BLOCK_4]" && e.baselineVersion === 2 && e.baselineSha256 === BASELINE && e.markdownSha256 === "f02b20cead30d1ab45b335f753b5d43257530a6e04ea548c92e5dab5f49423ab" && e.planSha256 === referenceHash(e));
    need(Number.isSafeInteger(e.issuedAt) && Number.isSafeInteger(e.expiresAt) && e.issuedAt <= now() && now() < e.expiresAt && e.expiresAt - e.issuedAt <= 6e4);
    return { authenticated: true, signatureVerified: true, nonce: e.nonce, referenceMetadataValidated: true, editorialOperations: 0 };
  }, async receipt() {
    throw Error("AUTH_ONLY");
  }, async publish() {
    throw Error("AUTH_ONLY");
  } };
}
async function installAuthOnlyReceiver(app, { env = process.env, publicKey, verifyManagedIdentity }) {
  if (env.ATHENA_MCP_AUTH_ONLY !== "true") throw Error("AUTH_ONLY_REQUIRED");
  if (env.ATHENA_MCP_PUBLISH_ENABLED !== "false" || env.ATHENA_MCP_APPROVAL_ENABLED !== "false") throw Error("WRITE_FLAGS_MUST_BE_FALSE");
  if (env.K_SERVICE !== "athenaapi") throw Error("RECEIVER_SERVICE");
  const i = await verifyManagedIdentity();
  if (i.email !== "217533514119-compute@developer.gserviceaccount.com" || !i.managed) throw Error("RECEIVER_IDENTITY");
  const { createPublicKey: createPublicKey4 } = await import("node:crypto");
  if (createHash7("sha256").update(createPublicKey4(publicKey).export({ type: "spki", format: "der" })).digest("hex") !== env.ATHENA_APPROVAL_PUBLIC_KEY_SHA256) throw Error("KEY_PIN");
  const entry = createAuthOnlyReceiver({ verifyServiceIdentity: googleServiceVerifier("https://athenaapi-37efv4sd6a-rj.a.run.app"), verifyEvidence: approvalVerifier(publicKey, "athena-day4-v1") });
  mountCeoPilotBridge(app, entry, { enabled: true, publishEnabled: false });
}

// work/athena-admin-gateway/ceo-approval-bridge/install.ts
async function installCeoApprovalBridge(app, { native, env = process.env, publicKey, kid, approvedMarkdown, verifyManagedIdentity }) {
  if (env.ATHENA_CATALOG_GENERALIZED === "true") return installGeneralizedCeo(app, { native, env, publicKey, kid, verifyManagedIdentity });
  if (env.ATHENA_MCP_AUTH_ONLY === "true") return installAuthOnlyReceiver(app, { env, publicKey, verifyManagedIdentity });
  if (env.ATHENA_MCP_REAL_PILOT_ENABLED !== "true") return { enabled: false };
  if (env.ATHENA_MCP_AUTH_ONLY !== "false" || env.ATHENA_MCP_PUBLICATION_MODE !== "day4-block4-reviewed-v1" || env.ATHENA_MCP_PUBLISH_ENABLED !== "true" || env.ATHENA_MCP_APPROVAL_ENABLED !== "true" || env.DISCOVERY_ONLY !== "true") throw Error("RESTRICTED_PUBLICATION_PROFILE");
  if ((env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT) !== "gen-lang-client-0822763072" || env.K_SERVICE !== "athenaapi") throw Error("CEO_RUNTIME_SCOPE");
  if (!publicKey || kid !== "athena-day4-v1" || !approvedMarkdown) throw Error("APPROVAL_TRUST_NOT_CONFIGURED");
  if (createHash8("sha256").update(createPublicKey3(publicKey).export({ type: "spki", format: "der" })).digest("hex") !== env.ATHENA_APPROVAL_PUBLIC_KEY_SHA256) throw Error("APPROVAL_KEY_PIN");
  const port = await bindCeoPublicationPort({ native, verifyManagedIdentity });
  const verifyServiceIdentity = googleServiceVerifier("https://athenaapi-37efv4sd6a-rj.a.run.app"), verifyEvidence = approvalVerifier(publicKey, kid);
  const entry = createCeoPublicationEntry({ db: port.db, verifyServiceIdentity, verifyEvidence, approvedMarkdown });
  entry.authCheck = createAuthOnlyReceiver({ verifyServiceIdentity, verifyEvidence }).authCheck;
  mountCeoPilotBridge(app, entry, { enabled: true, publishEnabled: env.ATHENA_MCP_PUBLISH_ENABLED === "true" });
  return { enabled: true, identity: WRITER, stop: port.terminate };
}
export {
  installCeoApprovalBridge
};
