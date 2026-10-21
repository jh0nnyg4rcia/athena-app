/**
 * ATHENA V2.3.5-B — OFFICIAL EVIDENCE RETRIEVAL (forensic tooling, NOT production)
 *
 * - Exact-host allowlist (no wildcard *.gov.br / *.jus.br).
 * - SSRF: protocol https only, no credentials, port 443 only, DNS lookup (all addresses)
 *   checked against loopback/RFC1918/link-local/CGNAT/ULA/metadata; manual redirects,
 *   each hop re-validated; redirect chain recorded.
 * - Persists EXACT raw bytes, content-addressed by rawSha256.
 * - Counts every HTTP request (including redirect hops) in networkRequests.
 * - ZERO model calls: any request to a non-allowlisted host aborts.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dns from 'dns/promises';
import { isForbiddenIp } from '../src/services/legalEvidenceRetrievalService';

export const ALLOWED_HOSTS = new Set<string>([
  'www.planalto.gov.br',
  'portal.stf.jus.br',
  'scon.stj.jus.br',
  'processo.stj.jus.br',
  'atos.cnj.jus.br',
]);

const MODEL_HOST_PATTERN = /openai|anthropic|googleapis|generativelanguage|gemini|vertex/i;

export interface DocSpec {
  documentId: string;
  authority: string;
  documentType: string;
  canonicalUrl: string;
  requiredByHoldoutIds: string[];
  expectedLocators: string[];
  note?: string;
}

export const DOCUMENTS: DocSpec[] = [
  // ---------------- Planalto (legislação) ----------------
  { documentId: 'PLN-CP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', requiredByHoldoutIds: ['HOLDOUT-001','HOLDOUT-002','HOLDOUT-003','HOLDOUT-004','HOLDOUT-005','HOLDOUT-006','HOLDOUT-009','HOLDOUT-011','HOLDOUT-012','HOLDOUT-013','HOLDOUT-014','HOLDOUT-015','HOLDOUT-016','HOLDOUT-017','HOLDOUT-018'], expectedLocators: ['art. 1','art. 20 §1','art. 103','art. 83','art. 97 §1','art. 25','art. 327','art. 121','art. 121 §7 I / art. 121-A','art. 157 §2 II','art. 180 §5','art. 168-A','art. 171','art. 297 §2','art. 334-A'] },
  { documentId: 'PLN-CPP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', requiredByHoldoutIds: ['HOLDOUT-019','HOLDOUT-020','HOLDOUT-021','HOLDOUT-022','HOLDOUT-023','HOLDOUT-024','HOLDOUT-025','HOLDOUT-026','HOLDOUT-028','HOLDOUT-029','HOLDOUT-030'], expectedLocators: ['art. 157','art. 157 §1','art. 157 §2','art. 306 §2','art. 74 §1','art. 413 §1','art. 311','art. 468','art. 414 p.u.','art. 245','art. 593 I','art. 564 III c'] },
  { documentId: 'PLN-CF', authority: 'PLANALTO', documentType: 'CONSTITUTION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', requiredByHoldoutIds: ['HOLDOUT-019','HOLDOUT-022','HOLDOUT-031','HOLDOUT-032','HOLDOUT-033','HOLDOUT-034','HOLDOUT-035','HOLDOUT-036','HOLDOUT-037','HOLDOUT-038','HOLDOUT-039','HOLDOUT-042','HOLDOUT-043','HOLDOUT-045','HOLDOUT-060'], expectedLocators: ['art. 5 LVI','art. 5 XXXVIII d','art. 5 XI','art. 97','art. 66 §1','art. 102 I a','art. 5 XLVII','art. 5 LXXIII','art. 37 caput','art. 71 IX','art. 37 §5','art. 105 III'] },
  { documentId: 'PLN-CC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', requiredByHoldoutIds: ['HOLDOUT-047','HOLDOUT-048','HOLDOUT-049','HOLDOUT-050','HOLDOUT-051'], expectedLocators: ['art. 2','art. 50','art. 178 II','art. 1.848','art. 426'] },
  { documentId: 'PLN-CPC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm', requiredByHoldoutIds: ['HOLDOUT-032','HOLDOUT-052','HOLDOUT-054','HOLDOUT-055','HOLDOUT-056','HOLDOUT-057','HOLDOUT-058','HOLDOUT-059'], expectedLocators: ['art. 949 p.u.','art. 792','art. 3','art. 1.015','art. 219','art. 9','art. 10','art. 190','art. 502'] },
  { documentId: 'PLN-CPC-ALT', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2015/l13105.htm', requiredByHoldoutIds: ['HOLDOUT-054','HOLDOUT-056','HOLDOUT-057','HOLDOUT-058','HOLDOUT-059'], expectedLocators: [], note: 'URL exatamente como citada no golden congelado; verificar se existe.' },
  { documentId: 'PLN-L8137', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8137.htm', requiredByHoldoutIds: ['HOLDOUT-008'], expectedLocators: ['art. 1'] },
  { documentId: 'PLN-L9868', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9868.htm', requiredByHoldoutIds: ['HOLDOUT-036'], expectedLocators: ['art. 27'] },
  { documentId: 'PLN-L14133', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', requiredByHoldoutIds: ['HOLDOUT-040'], expectedLocators: ['art. 74 III','art. 74 §3'] },
  { documentId: 'PLN-L8112', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_CONSOLIDATED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm', requiredByHoldoutIds: ['HOLDOUT-041'], expectedLocators: ['art. 142 I'] },
  { documentId: 'PLN-L8443', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8443.htm', requiredByHoldoutIds: ['HOLDOUT-042'], expectedLocators: ['art. 45'] },
  { documentId: 'PLN-L9784', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9784.htm', requiredByHoldoutIds: ['HOLDOUT-044'], expectedLocators: ['art. 53'] },
  { documentId: 'PLN-CDC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm', requiredByHoldoutIds: ['HOLDOUT-048'], expectedLocators: ['art. 28 §5'], note: 'Não citado como URL no golden (locator apenas); necessário para binding.' },
  { documentId: 'PLN-LEP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l7210.htm', requiredByHoldoutIds: ['HOLDOUT-004'], expectedLocators: ['art. 66 III e'], note: 'Citado na citation de HOLDOUT-004 sem URL própria.' },
  // ---------------- STF ----------------
  { documentId: 'STF-SV24', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1273', requiredByHoldoutIds: ['HOLDOUT-008'], expectedLocators: ['SV 24'] },
  { documentId: 'STF-SV11', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1260', requiredByHoldoutIds: ['HOLDOUT-027'], expectedLocators: ['SV 11'] },
  { documentId: 'STF-SV10', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1259', requiredByHoldoutIds: ['HOLDOUT-032'], expectedLocators: ['SV 10'] },
  { documentId: 'STF-SV13', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1262', requiredByHoldoutIds: ['HOLDOUT-043'], expectedLocators: ['SV 13'] },
  { documentId: 'STF-S708', authority: 'STF', documentType: 'SUMULA_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=30&sumula=3555', requiredByHoldoutIds: ['HOLDOUT-030'], expectedLocators: ['Súmula 708'] },
  { documentId: 'STF-S473', authority: 'STF', documentType: 'SUMULA_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=30&sumula=3320', requiredByHoldoutIds: ['HOLDOUT-044'], expectedLocators: ['Súmula 473'] },
  { documentId: 'STF-T1087', authority: 'STF', documentType: 'REPERCUSSAO_GERAL_TEMA_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/repercussao/tema.asp?num=1087', requiredByHoldoutIds: ['HOLDOUT-017'], expectedLocators: ['Tema 1087 leading case + tese'] },
  { documentId: 'STF-T280', authority: 'STF', documentType: 'REPERCUSSAO_GERAL_TEMA_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/repercussao/tema.asp?num=280', requiredByHoldoutIds: ['HOLDOUT-037'], expectedLocators: ['Tema 280 tese'] },
  { documentId: 'STF-T897', authority: 'STF', documentType: 'REPERCUSSAO_GERAL_TEMA_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/repercussao/tema.asp?num=897', requiredByHoldoutIds: ['HOLDOUT-045'], expectedLocators: ['Tema 897 tese'] },
  // ---------------- STJ ----------------
  { documentId: 'STJ-S241', authority: 'STJ', documentType: 'SUMULA_SCON', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=241&&b=SUMU&p=true&t=&l=10&i=1', requiredByHoldoutIds: ['HOLDOUT-010'], expectedLocators: ['Súmula 241'], note: 'Golden cita apenas toc.jsp genérico.' },
  { documentId: 'STJ-S17', authority: 'STJ', documentType: 'SUMULA_SCON', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=17&&b=SUMU&p=true&t=&l=10&i=1', requiredByHoldoutIds: ['HOLDOUT-016'], expectedLocators: ['Súmula 17'], note: 'Golden cita apenas toc.jsp genérico.' },
  { documentId: 'STJ-SUMTOC', authority: 'STJ', documentType: 'SUMULA_INDEX', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/toc.jsp', requiredByHoldoutIds: ['HOLDOUT-010','HOLDOUT-016'], expectedLocators: [], note: 'URL exatamente como citada.' },
  { documentId: 'STJ-S375', authority: 'STJ', documentType: 'SUMULA_SCON', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=375&&b=SUMU&p=true&t=&l=10&i=1', requiredByHoldoutIds: ['HOLDOUT-052'], expectedLocators: ['Súmula 375'] },
  { documentId: 'STJ-S479', authority: 'STJ', documentType: 'SUMULA_SCON', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=479&&b=SUMU&p=true&t=&l=10&i=1', requiredByHoldoutIds: ['HOLDOUT-053'], expectedLocators: ['Súmula 479'] },
  { documentId: 'STJ-S7', authority: 'STJ', documentType: 'SUMULA_SCON', canonicalUrl: 'https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=7&&b=SUMU&p=true&t=&l=10&i=1', requiredByHoldoutIds: ['HOLDOUT-060'], expectedLocators: ['Súmula 7'] },
  { documentId: 'STJ-JTTOC', authority: 'STJ', documentType: 'JURISPRUDENCIA_EM_TESES_INDEX', canonicalUrl: 'https://scon.stj.jus.br/SCON/jt/toc.jsp', requiredByHoldoutIds: ['HOLDOUT-007'], expectedLocators: ['Edição 133 Tese 4'] },
  { documentId: 'STJ-T988', authority: 'STJ', documentType: 'TEMA_REPETITIVO_PAGE', canonicalUrl: 'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=988&cod_tema_final=988', requiredByHoldoutIds: ['HOLDOUT-055'], expectedLocators: ['Tema 988 tese'] },
  { documentId: 'STJ-T1143', authority: 'STJ', documentType: 'TEMA_REPETITIVO_PAGE', canonicalUrl: 'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1143&cod_tema_final=1143', requiredByHoldoutIds: ['HOLDOUT-017'], expectedLocators: ['Tema 1143 tese (hipótese: limite de 1.000 maços)'], note: 'Retrieval investigativo para HOLDOUT-017; não citado no golden.' },
  // ---------------- CNJ ----------------
  { documentId: 'CNJ-RES227', authority: 'CNJ', documentType: 'ATO_NORMATIVO_PAGE', canonicalUrl: 'https://atos.cnj.jus.br/atos/detalhar/2289', requiredByHoldoutIds: ['HOLDOUT-046'], expectedLocators: ['Res. 227/2016 art. 5'] },
];

function isForbiddenIpStrict(ip: string): boolean {
  if (isForbiddenIp(ip)) return true;
  const t = ip.trim().toLowerCase();
  if (t === '0.0.0.0' || t.startsWith('0.')) return true;
  if (/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(t)) return true; // CGNAT
  if (t.startsWith('fd') || t.startsWith('fc')) return true; // ULA
  if (t.startsWith('::ffff:')) return isForbiddenIpStrict(t.slice(7));
  if (t === '::' ) return true;
  return false;
}

async function validateHop(u: URL): Promise<string[]> {
  if (u.protocol !== 'https:') throw new Error(`PROTOCOL_BLOCKED:${u.protocol}`);
  if (u.username || u.password) throw new Error('CREDENTIALS_BLOCKED');
  if (u.port && u.port !== '443') throw new Error(`PORT_BLOCKED:${u.port}`);
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (MODEL_HOST_PATTERN.test(host)) throw new Error(`MODEL_HOST_ABORT:${host}`);
  if (!ALLOWED_HOSTS.has(host)) throw new Error(`HOST_NOT_ALLOWLISTED:${host}`);
  const addrs = await dns.lookup(host, { all: true });
  if (addrs.length === 0) throw new Error(`DNS_EMPTY:${host}`);
  for (const a of addrs) if (isForbiddenIpStrict(a.address)) throw new Error(`SSRF_FORBIDDEN_IP:${host}->${a.address}`);
  return addrs.map(a => a.address);
}

export interface RetrievalRecord {
  documentId: string;
  canonicalUrl: string;
  finalUrl?: string;
  statusCode?: number;
  contentType?: string;
  retrievedAt: string;
  byteLength?: number;
  rawSha256?: string;
  rawPath?: string;
  redirectChain: string[];
  resolvedIps: string[];
  requestsMade: number;
  cacheHit: boolean;
  outcome: 'RETRIEVED' | 'OFFICIAL_DOCUMENT_UNAVAILABLE';
  error?: string;
}

const MAX_BYTES = 20 * 1024 * 1024;

async function retrieve(doc: DocSpec, outDir: string, cacheIndex: Record<string, string>): Promise<RetrievalRecord> {
  const rec: RetrievalRecord = { documentId: doc.documentId, canonicalUrl: doc.canonicalUrl, retrievedAt: new Date().toISOString(), redirectChain: [], resolvedIps: [], requestsMade: 0, cacheHit: false, outcome: 'OFFICIAL_DOCUMENT_UNAVAILABLE' };
  // content-addressed cache within this phase: URL -> rawSha256
  const cached = cacheIndex[doc.canonicalUrl];
  if (cached && fs.existsSync(path.join(outDir, `${cached}.bin`))) {
    const buf = fs.readFileSync(path.join(outDir, `${cached}.bin`));
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    if (sha === cached) {
      const metaPath = path.join(outDir, `${cached}.meta.json`);
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
      return { ...rec, ...meta, documentId: doc.documentId, cacheHit: true, requestsMade: 0, outcome: 'RETRIEVED' };
    }
  }
  let current = new URL(doc.canonicalUrl);
  try {
    for (let hop = 0; hop <= 5; hop++) {
      const ips = await validateHop(current);
      rec.resolvedIps.push(...ips);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      rec.requestsMade++;
      const res = await fetch(current.toString(), {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AthenaForensicAudit/2.3.5-B', 'Accept': 'text/html,application/xhtml+xml,*/*' },
      });
      clearTimeout(timer);
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) throw new Error(`REDIRECT_WITHOUT_LOCATION:${res.status}`);
        const next = new URL(loc, current);
        rec.redirectChain.push(`${res.status} ${current.toString()} -> ${next.toString()}`);
        current = next;
        continue;
      }
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      if (buf.length > MAX_BYTES) throw new Error(`TOO_LARGE:${buf.length}`);
      rec.finalUrl = current.toString();
      rec.statusCode = res.status;
      rec.contentType = res.headers.get('content-type') || '';
      rec.byteLength = buf.length;
      const sha = crypto.createHash('sha256').update(buf).digest('hex');
      rec.rawSha256 = sha;
      const rawPath = path.join(outDir, `${sha}.bin`);
      fs.writeFileSync(rawPath, buf);
      rec.rawPath = path.relative(process.cwd(), rawPath).replace(/\\/g, '/');
      if (res.status === 200 && buf.length > 0) {
        rec.outcome = 'RETRIEVED';
        cacheIndex[doc.canonicalUrl] = sha;
      } else {
        rec.error = `HTTP_${res.status}`;
      }
      fs.writeFileSync(path.join(outDir, `${sha}.meta.json`), JSON.stringify({ canonicalUrl: rec.canonicalUrl, finalUrl: rec.finalUrl, statusCode: rec.statusCode, contentType: rec.contentType, retrievedAt: rec.retrievedAt, byteLength: rec.byteLength, rawSha256: sha, rawPath: rec.rawPath, redirectChain: rec.redirectChain }, null, 2));
      return rec;
    }
    throw new Error('TOO_MANY_REDIRECTS');
  } catch (e: any) {
    rec.error = e?.name === 'AbortError' ? 'TIMEOUT' : String(e?.message || e);
    return rec;
  }
}

async function main() {
  const base = path.resolve('tmp/assertion-decomposition-holdout-v235b');
  for (const d of ['official-documents', 'extracted', 'evidence', 'audit', 'candidate-golden', 'manifest']) fs.mkdirSync(path.join(base, d), { recursive: true });
  const outDir = path.join(base, 'official-documents');
  const cachePath = path.join(outDir, 'cache-index.json');
  const cacheIndex: Record<string, string> = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

  const only = process.argv.slice(2);
  const records: RetrievalRecord[] = [];
  for (const doc of DOCUMENTS) {
    if (only.length && !only.includes(doc.documentId)) continue;
    const r = await retrieve(doc, outDir, cacheIndex);
    records.push(r);
    console.log(`${r.documentId.padEnd(12)} ${r.outcome.padEnd(30)} status=${r.statusCode ?? '-'} bytes=${r.byteLength ?? '-'} req=${r.requestsMade} cache=${r.cacheHit} ${r.error ?? ''} ${r.redirectChain.length ? '| redirects=' + r.redirectChain.length : ''}`);
  }
  fs.writeFileSync(cachePath, JSON.stringify(cacheIndex, null, 2));

  const logPath = path.join(base, 'manifest', 'retrieval-log.json');
  const prev = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : { runs: [] };
  prev.runs.push({ runAt: new Date().toISOString(), externalModelCalls: 0, networkRequests: records.reduce((s, r) => s + r.requestsMade, 0), records });
  fs.writeFileSync(logPath, JSON.stringify(prev, null, 2));
  fs.writeFileSync(path.join(base, 'manifest', 'document-inventory.json'), JSON.stringify({ allowedHosts: [...ALLOWED_HOSTS], documents: DOCUMENTS }, null, 2));
  console.log(`networkRequests(this run)=${records.reduce((s, r) => s + r.requestsMade, 0)} externalModelCalls=0`);
}

main();
