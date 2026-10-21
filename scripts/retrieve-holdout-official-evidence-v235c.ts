/**
 * ATHENA V2.3.5-C — OFFICIAL EVIDENCE RETRIEVAL PIPELINE
 * 
 * Recuperação offline/controlada de documentos jurídicos oficiais.
 * 
 * Regras estritas:
 * - ZERO OpenAI / ZERO Gemini / ZERO Anthropic / ZERO inferência LLM (externalModelCalls = 0).
 * - Rede SOMENTE para documentos oficiais de hosts na allowlist estrita.
 * - SSRF Guard estrito: bloqueio de IP privado, loopback, link-local, metadata, CGNAT, ULA.
 * - Armazenamento content-addressed: ${sha256}.bin e ${sha256}.meta.json em tmp/assertion-decomposition-holdout-v235c/official-documents/
 * - Registro exaustivo em tmp/assertion-decomposition-holdout-v235c/manifest/retrieval-log.json e document-inventory.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dns from 'dns/promises';

export const ALLOWED_HOSTS = new Set([
  'www.planalto.gov.br',
  'portal.stf.jus.br',
  'atos.cnj.jus.br',
]);

export interface DocSpec {
  documentId: string;
  authority: string;
  documentType: string;
  canonicalUrl: string;
  requiredByHoldoutIds: string[];
  expectedLocators: string[];
  note?: string;
}

export const DOCUMENTS_V235C: DocSpec[] = [
  // ---------------- Planalto (Legislação Federal) ----------------
  { documentId: 'PLN-CP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', requiredByHoldoutIds: ['HOLDOUT-001','HOLDOUT-002','HOLDOUT-003','HOLDOUT-004','HOLDOUT-005','HOLDOUT-006','HOLDOUT-009','HOLDOUT-010','HOLDOUT-011','HOLDOUT-012','HOLDOUT-013','HOLDOUT-014','HOLDOUT-015','HOLDOUT-016','HOLDOUT-017','HOLDOUT-018'], expectedLocators: ['art. 1','art. 20 §1','art. 25','art. 44','art. 83','art. 97 §1','art. 103','art. 121','art. 121-A §2 I','art. 157 §2 II','art. 168-A','art. 171 §2-A','art. 180 §5','art. 297 §2','art. 317 §1'] },
  { documentId: 'PLN-CPP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', requiredByHoldoutIds: ['HOLDOUT-019','HOLDOUT-020','HOLDOUT-021','HOLDOUT-022','HOLDOUT-023','HOLDOUT-024','HOLDOUT-025','HOLDOUT-026','HOLDOUT-028','HOLDOUT-029'], expectedLocators: ['art. 74 §1','art. 157','art. 157 §1','art. 245','art. 306 §2','art. 311','art. 413 §1','art. 414 p.u.','art. 468','art. 593 I'] },
  { documentId: 'PLN-CF', authority: 'PLANALTO', documentType: 'CONSTITUTION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', requiredByHoldoutIds: ['HOLDOUT-019','HOLDOUT-022','HOLDOUT-031','HOLDOUT-032','HOLDOUT-033','HOLDOUT-034','HOLDOUT-035','HOLDOUT-037','HOLDOUT-038','HOLDOUT-039','HOLDOUT-042','HOLDOUT-043','HOLDOUT-045','HOLDOUT-052','HOLDOUT-060'], expectedLocators: ['art. 5 XI','art. 5 XLVII','art. 5 LVI','art. 5 LV','art. 5 LXVII','art. 5 LXXIII','art. 5 XXXVIII d','art. 7 IV','art. 14 §7','art. 37 caput','art. 66 §1','art. 71 IX','art. 97','art. 102 I a'] },
  { documentId: 'PLN-CC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', requiredByHoldoutIds: ['HOLDOUT-047','HOLDOUT-048','HOLDOUT-049','HOLDOUT-050','HOLDOUT-051','HOLDOUT-052'], expectedLocators: ['art. 2','art. 50','art. 178 II','art. 426','art. 652','art. 1848'] },
  { documentId: 'PLN-CPC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm', requiredByHoldoutIds: ['HOLDOUT-032','HOLDOUT-054','HOLDOUT-055','HOLDOUT-056','HOLDOUT-057','HOLDOUT-058','HOLDOUT-059'], expectedLocators: ['art. 3','art. 9','art. 10','art. 190','art. 219','art. 300','art. 502','art. 949 p.u.'] },
  { documentId: 'PLN-L8137', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8137.htm', requiredByHoldoutIds: ['HOLDOUT-008'], expectedLocators: ['art. 1'] },
  { documentId: 'PLN-L9868', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9868.htm', requiredByHoldoutIds: ['HOLDOUT-036'], expectedLocators: ['art. 27'] },
  { documentId: 'PLN-L14133', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', requiredByHoldoutIds: ['HOLDOUT-040'], expectedLocators: ['art. 74 III'] },
  { documentId: 'PLN-L8112', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_CONSOLIDATED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm', requiredByHoldoutIds: ['HOLDOUT-041'], expectedLocators: ['art. 142 I'] },
  { documentId: 'PLN-L8443', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8443.htm', requiredByHoldoutIds: ['HOLDOUT-042'], expectedLocators: ['art. 45'] },
  { documentId: 'PLN-L9784', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9784.htm', requiredByHoldoutIds: [], expectedLocators: ['art. 53'] },
  { documentId: 'PLN-CDC', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML_COMPILED', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm', requiredByHoldoutIds: ['HOLDOUT-048'], expectedLocators: ['art. 28 §5'] },
  { documentId: 'PLN-LEP', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l7210.htm', requiredByHoldoutIds: ['HOLDOUT-004'], expectedLocators: ['art. 66'] },
  { documentId: 'PLN-L8072', authority: 'PLANALTO', documentType: 'LEGISLATION_HTML', canonicalUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8072.htm', requiredByHoldoutIds: ['HOLDOUT-007'], expectedLocators: ['art. 2'] },

  // ---------------- CNJ (Ato Administrativo Normativo) ----------------
  { documentId: 'CNJ-RES227', authority: 'CNJ', documentType: 'ATO_NORMATIVO_PAGE', canonicalUrl: 'https://atos.cnj.jus.br/atos/detalhar/2289', requiredByHoldoutIds: ['HOLDOUT-046'], expectedLocators: ['Res. 227/2016 art. 5 I'] },

  // ---------------- STF (Súmulas Vinculantes) ----------------
  { documentId: 'STF-SV4', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1195', requiredByHoldoutIds: ['HOLDOUT-060'], expectedLocators: ['SV 4'] },
  { documentId: 'STF-SV5', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1199', requiredByHoldoutIds: ['HOLDOUT-044'], expectedLocators: ['SV 5'] },
  { documentId: 'STF-SV10', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1216', requiredByHoldoutIds: ['HOLDOUT-032'], expectedLocators: ['SV 10'] },
  { documentId: 'STF-SV11', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220', requiredByHoldoutIds: ['HOLDOUT-027'], expectedLocators: ['SV 11'] },
  { documentId: 'STF-SV13', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1227', requiredByHoldoutIds: ['HOLDOUT-043'], expectedLocators: ['SV 13'] },
  { documentId: 'STF-SV14', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1230', requiredByHoldoutIds: ['HOLDOUT-030'], expectedLocators: ['SV 14'] },
  { documentId: 'STF-SV18', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1245', requiredByHoldoutIds: ['HOLDOUT-037'], expectedLocators: ['SV 18'] },
  { documentId: 'STF-SV21', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1255', requiredByHoldoutIds: ['HOLDOUT-045'], expectedLocators: ['SV 21'] },
  { documentId: 'STF-SV24', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1265', requiredByHoldoutIds: ['HOLDOUT-008'], expectedLocators: ['SV 24'] },
  { documentId: 'STF-SV25', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1268', requiredByHoldoutIds: ['HOLDOUT-052'], expectedLocators: ['SV 25'] },
  { documentId: 'STF-SV26', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1271', requiredByHoldoutIds: ['HOLDOUT-007'], expectedLocators: ['SV 26'] },
  { documentId: 'STF-SV27', authority: 'STF', documentType: 'SUMULA_VINCULANTE_PAGE', canonicalUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1274', requiredByHoldoutIds: ['HOLDOUT-053'], expectedLocators: ['SV 27'] },
];

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('169.254.')) return true;
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true;
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:') || ip.startsWith('fe80:')) return true;
  return false;
}

async function validateHop(targetUrl: URL): Promise<string[]> {
  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    throw new Error(`SSRF_BLOCKED: Protocolo ${targetUrl.protocol} não permitido.`);
  }
  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    throw new Error(`SSRF_BLOCKED: Host ${targetUrl.hostname} não está na allowlist estrita.`);
  }
  const addrs = await dns.lookup(targetUrl.hostname, { all: true });
  if (!addrs || addrs.length === 0) {
    throw new Error(`DNS_RESOLUTION_FAILED: Host ${targetUrl.hostname} não resolveu.`);
  }
  const resolvedIps = addrs.map(a => a.address);
  for (const ip of resolvedIps) {
    if (isPrivateIp(ip)) {
      throw new Error(`SSRF_BLOCKED: Host ${targetUrl.hostname} resolve para IP privado/reservado ${ip}.`);
    }
  }
  return resolvedIps;
}

export interface RetrievalRecord {
  documentId: string;
  canonicalUrl: string;
  retrievedAt: string;
  redirectChain: string[];
  resolvedIps: string[];
  requestsMade: number;
  cacheHit: boolean;
  outcome: 'RETRIEVED' | 'OFFICIAL_DOCUMENT_UNAVAILABLE';
  finalUrl?: string;
  statusCode?: number;
  contentType?: string;
  byteLength?: number;
  rawSha256?: string;
  rawPath?: string;
  error?: string;
}

const MAX_BYTES = 20 * 1024 * 1024;

async function retrieve(doc: DocSpec, outDir: string, cacheIndex: Record<string, string>): Promise<RetrievalRecord> {
  const rec: RetrievalRecord = {
    documentId: doc.documentId,
    canonicalUrl: doc.canonicalUrl,
    retrievedAt: new Date().toISOString(),
    redirectChain: [],
    resolvedIps: [],
    requestsMade: 0,
    cacheHit: false,
    outcome: 'OFFICIAL_DOCUMENT_UNAVAILABLE'
  };

  // Cache check within this phase: URL -> rawSha256
  const cached = cacheIndex[doc.canonicalUrl];
  if (cached && fs.existsSync(path.join(outDir, `${cached}.bin`))) {
    const buf = fs.readFileSync(path.join(outDir, `${cached}.bin`));
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    if (sha === cached) {
      const metaPath = path.join(outDir, `${cached}.meta.json`);
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
      return {
        ...rec,
        ...meta,
        documentId: doc.documentId,
        cacheHit: true,
        requestsMade: 0,
        outcome: 'RETRIEVED'
      };
    }
  }

  // Also check existing verified official bytes from v235b if available
  const v235bMetaPath = path.resolve('tmp/assertion-decomposition-holdout-v235b/manifest/retrieval-log.json');
  if (fs.existsSync(v235bMetaPath)) {
    try {
      const v235bLog = JSON.parse(fs.readFileSync(v235bMetaPath, 'utf8'));
      const oldRec = v235bLog.runs?.[0]?.records?.find((r: any) => r.canonicalUrl === doc.canonicalUrl && r.outcome === 'RETRIEVED');
      if (oldRec && oldRec.rawPath && fs.existsSync(path.resolve(oldRec.rawPath))) {
        const oldBuf = fs.readFileSync(path.resolve(oldRec.rawPath));
        const oldSha = crypto.createHash('sha256').update(oldBuf).digest('hex');
        if (oldSha === oldRec.rawSha256) {
          const rawPath = path.join(outDir, `${oldSha}.bin`);
          fs.writeFileSync(rawPath, oldBuf);
          fs.writeFileSync(path.join(outDir, `${oldSha}.meta.json`), JSON.stringify({
            canonicalUrl: oldRec.canonicalUrl,
            finalUrl: oldRec.finalUrl,
            statusCode: oldRec.statusCode,
            contentType: oldRec.contentType,
            retrievedAt: oldRec.retrievedAt,
            byteLength: oldRec.byteLength,
            rawSha256: oldSha,
            rawPath: path.relative(process.cwd(), rawPath).replace(/\\/g, '/'),
            redirectChain: oldRec.redirectChain,
            provenance: 'PREEXISTING_VERIFIED_OFFICIAL_BYTES'
          }, null, 2));
          cacheIndex[doc.canonicalUrl] = oldSha;
          return {
            ...rec,
            documentId: doc.documentId,
            finalUrl: oldRec.finalUrl,
            statusCode: oldRec.statusCode,
            contentType: oldRec.contentType,
            byteLength: oldRec.byteLength,
            rawSha256: oldSha,
            rawPath: path.relative(process.cwd(), rawPath).replace(/\\/g, '/'),
            cacheHit: true,
            requestsMade: 0,
            outcome: 'RETRIEVED'
          };
        }
      }
    } catch {
      // Fall through to network retrieval
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
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AthenaForensicAudit/2.3.5-C',
          'Accept': 'text/html,application/xhtml+xml,*/*'
        },
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
      fs.writeFileSync(path.join(outDir, `${sha}.meta.json`), JSON.stringify({
        canonicalUrl: rec.canonicalUrl,
        finalUrl: rec.finalUrl,
        statusCode: rec.statusCode,
        contentType: rec.contentType,
        retrievedAt: rec.retrievedAt,
        byteLength: rec.byteLength,
        rawSha256: sha,
        rawPath: rec.rawPath,
        redirectChain: rec.redirectChain,
        provenance: 'REMOTE_OFFICIAL_DOCUMENT_RETRIEVED'
      }, null, 2));
      return rec;
    }
    throw new Error('TOO_MANY_REDIRECTS');
  } catch (e: any) {
    rec.error = e?.name === 'AbortError' ? 'TIMEOUT' : String(e?.message || e);
    return rec;
  }
}

export async function runRetrievalV235C() {
  const baseDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const outDir = path.join(baseDir, 'official-documents');
  const manifestDir = path.join(baseDir, 'manifest');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(manifestDir, { recursive: true });

  const inventoryPath = path.join(manifestDir, 'document-inventory.json');
  fs.writeFileSync(inventoryPath, JSON.stringify({
    phase: 'V2.3.5-C',
    allowedHosts: Array.from(ALLOWED_HOSTS),
    documents: DOCUMENTS_V235C
  }, null, 2));

  const cacheIndex: Record<string, string> = {};
  const records: RetrievalRecord[] = [];
  let totalNetworkRequests = 0;

  console.log(`Iniciando retrieval V2.3.5-C para ${DOCUMENTS_V235C.length} documentos oficiais...`);
  for (const doc of DOCUMENTS_V235C) {
    console.log(`[RETRIEVE] ${doc.documentId} <- ${doc.canonicalUrl}`);
    const rec = await retrieve(doc, outDir, cacheIndex);
    totalNetworkRequests += rec.requestsMade;
    records.push(rec);
    console.log(`  -> ${rec.outcome} (status: ${rec.statusCode || 'ERR'}, bytes: ${rec.byteLength || 0}, sha: ${rec.rawSha256?.slice(0, 12) || 'N/A'}, netReqs: ${rec.requestsMade})`);
  }

  const logPayload = {
    phase: 'V2.3.5-C',
    executedAt: new Date().toISOString(),
    externalModelCalls: 0,
    networkRequests: totalNetworkRequests,
    totalDocuments: records.length,
    retrievedCount: records.filter(r => r.outcome === 'RETRIEVED').length,
    failedCount: records.filter(r => r.outcome !== 'RETRIEVED').length,
    records
  };

  const logPath = path.join(manifestDir, 'retrieval-log.json');
  fs.writeFileSync(logPath, JSON.stringify(logPayload, null, 2));
  console.log(`\nRetrieval V2.3.5-C finalizado. Log gravado em ${logPath}`);
  console.log(`Total de requisições de rede executadas: ${totalNetworkRequests}`);
  console.log(`Total de documentos com sucesso: ${logPayload.retrievedCount}/${records.length}`);
}

runRetrievalV235C().catch(err => {
  console.error('ERRO FATAL NO RETRIEVAL V2.3.5-C:', err);
  process.exit(1);
});
