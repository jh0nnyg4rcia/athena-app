/**
 * ATHENA V2.3.3-E - Material Evidence Retrieval & Normalization Service
 * Módulo produtivo para recuperação e validação de LEGISLAÇÃO FEDERAL e ATOS NORMATIVOS CNJ.
 * 
 * ESCOPO RESTRITO:
 * - Hosts autorizados: planalto.gov.br, www.planalto.gov.br, atos.cnj.jus.br.
 * - STF, STJ e coringas (*.gov.br / *.jus.br) estão estritamente fora desta versão.
 * - HTTPS obrigatório, sem chamadas a modelos de IA.
 * 
 * NOTA DE SEGURANÇA (DNS TOCTOU / REBINDING):
 * Esta implementação valida o IP resolvido via dns.lookup() antes do fetch.
 * A allowlist institucional reduz significativamente a superfície de ataque,
 * mas a ausência de socket/IP pinning mantém risco teórico residual de
 * DNS rebinding/TOCTOU.
 */

import * as dns from 'node:dns/promises';
import * as crypto from 'node:crypto';
import type {
  MaterialEvidence,
  MaterialEvidenceVerificationResult,
  LegislationLocator,
  MaterialDocumentOrigin,
  MaterialRevalidationPolicy,
} from '../lib/legalReviewTypes';
import { canonicalSourceUrl } from '../lib/legalReviewValidate';

export const OFFICIAL_LEGISLATION_HOSTS = new Set<string>([
  'planalto.gov.br',
  'www.planalto.gov.br',
  'atos.cnj.jus.br',
]);

export const MAX_LEGISLATION_HTML_BYTES = 5 * 1024 * 1024; // 5 MB
export const RETRIEVAL_TIMEOUT_MS = 8000; // 8 segundos

export interface SecureRetrievalResult {
  sourceUrlRequested: string;
  sourceUrlFinal: string;
  retrievedAt: string;
  httpStatus: number;
  contentType: string;
  contentLength: number;
  rawBytes: Buffer;
  decodedText: string;
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedText: string;
  redirectChain: string[];
  etag?: string;
  lastModified?: string;
  origin: 'REMOTE_OFFICIAL_DOCUMENT';
}

export function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verificação rigorosa de endereços IP proibidos (Anti-SSRF).
 * Bloqueia loopback, link-local, redes privadas RFC 1918 e metadados de nuvem.
 */
export function isForbiddenIp(ipAddress: string): boolean {
  const trimmed = ipAddress.trim();
  if (trimmed.startsWith('127.') || trimmed === '::1' || trimmed.toLowerCase() === 'localhost') return true;
  if (trimmed.startsWith('169.254.')) return true; // Link-local e AWS/GCP/Azure Metadata (169.254.169.254)
  if (trimmed.startsWith('10.') || trimmed.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) return true;
  if (trimmed.toLowerCase().startsWith('fc00:') || trimmed.toLowerCase().startsWith('fe80:')) return true;
  return false;
}

/**
 * Validação prévia de URL, Hostname e DNS.
 */
export async function validateRetrievalUrlAndDns(targetUrl: URL): Promise<string> {
  if (targetUrl.protocol !== 'https:') {
    throw new Error(`PROTOCOLO_INSEGURO: ${targetUrl.protocol}. Apenas HTTPS é permitido.`);
  }

  if (targetUrl.username || targetUrl.password) {
    throw new Error('CREDENCIAIS_EMBUTIDAS_PROIBIDAS: URLs com usuário/senha embutidos são rejeitadas.');
  }

  if (targetUrl.port && targetUrl.port !== '443') {
    throw new Error(`PORTA_NAO_PADRAO_PROIBIDA: Porta ${targetUrl.port} não é permitida.`);
  }

  const hostname = targetUrl.hostname.toLowerCase().replace(/\.$/, '');
  if (!OFFICIAL_LEGISLATION_HOSTS.has(hostname)) {
    throw new Error(`HOST_NAO_AUTORIZADO: ${hostname}. Host fora da allowlist de legislação.`);
  }

  const lookup = await dns.lookup(hostname);
  if (isForbiddenIp(lookup.address)) {
    throw new Error(`SSRF_BLOQUEIO_IP_PROIBIDO: ${hostname} resolveu para IP proibido ${lookup.address}`);
  }

  return lookup.address;
}

/**
 * Normalizador determinístico de HTML para diplomas normativos (Planalto e CNJ).
 * 
 * Regras:
 * 1. Remove scripts e styles com seus conteúdos;
 * 2. Remove texto revogado/tachado (<strike>, <s>, <del>) de forma conservadora;
 * 3. Normaliza quebras de linha embutidas no meio de parágrafos normativos para espaços;
 * 4. Converte tags de bloco (<p>, <br>, <div>, <tr>, <li>) em newlines canônicos;
 * 5. Decodifica entidades HTML e acentuação da língua portuguesa;
 * 6. Limpa espaços múltiplos e calcula os hashes imutáveis.
 */
export function normalizeOfficialHtml(rawHtml: string): {
  normalizedText: string;
  rawContentHash: string;
  normalizedContentHash: string;
} {
  const rawBytes = Buffer.from(rawHtml, 'utf8');
  const rawContentHash = sha256Hex(rawBytes);

  let clean = rawHtml;

  // 1. Remove script e style e seus conteúdos
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // 2. Remove texto expressamente revogado/tachado
  clean = clean.replace(/<strike\b[^>]*>[\s\S]*?<\/strike>/gi, ' ');
  clean = clean.replace(/<s\b[^>]*>[\s\S]*?<\/s>/gi, ' ');
  clean = clean.replace(/<del\b[^>]*>[\s\S]*?<\/del>/gi, ' ');

  // 3. Normaliza quebras de linha existentes no HTML em espaços (evita quebrar sentenças no meio de parágrafos)
  clean = clean.replace(/\r?\n/g, ' ');

  // 4. Converte marcadores de bloco em newlines
  clean = clean.replace(/<\/?(?:p|div|tr|h[1-6]|li)\b[^>]*>/gi, '\n');
  clean = clean.replace(/<br\s*\/?>/gi, '\n');

  // 5. Remove todas as demais tags HTML restantes
  clean = clean.replace(/<[^>]+>/g, ' ');

  // 6. Decodifica entidades HTML comuns na língua portuguesa e ordenamento jurídico
  clean = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#186;|&ordm;/gi, 'º')
    .replace(/&#170;|&orda;/gi, 'ª')
    .replace(/&sect;/gi, '§')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Aacute;/gi, 'Á')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&Iacute;/gi, 'Í')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&Atilde;/gi, 'Ã')
    .replace(/&Otilde;/gi, 'Õ')
    .replace(/&Ccedil;/gi, 'Ç');

  // 7. Normaliza espaços por linha e quebras
  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t\v\f\u00A0]+/g, ' ').trim())
    .filter((line) => line.length > 0);

  const normalizedText = lines.join('\n');
  const normalizedContentHash = sha256Hex(normalizedText);

  return {
    normalizedText,
    rawContentHash,
    normalizedContentHash,
  };
}

/**
 * Localizador determinístico de dispositivo normativo (Artigo, Parágrafo, Inciso, Alínea).
 */
export function extractLegislationLocator(
  normalizedText: string,
  locator: LegislationLocator
): {
  found: boolean;
  materialText?: string;
  locator?: LegislationLocator;
} {
  const lines = normalizedText.split('\n');

  // Regex para localizar o artigo (ex: "Art. 3º-A." ou "Art. 3º")
  const artEscaped = locator.article.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  const artRegex = new RegExp(`^${artEscaped}[\\.\\s\\-–]`, 'i');

  let articleStartIdx = -1;
  let articleEndIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (artRegex.test(lines[i])) {
      articleStartIdx = i;
      break;
    }
  }

  if (articleStartIdx === -1) {
    return { found: false };
  }

  // Encontra onde o artigo termina (próximo "Art. \d+" ou fim do documento)
  const nextArtRegex = /^Art\.\s*\d+/i;
  articleEndIdx = lines.length;
  for (let i = articleStartIdx + 1; i < lines.length; i++) {
    if (nextArtRegex.test(lines[i])) {
      articleEndIdx = i;
      break;
    }
  }

  const articleLines = lines.slice(articleStartIdx, articleEndIdx);

  // Se busca apenas o artigo
  if (!locator.paragraph && !locator.item && !locator.subItem) {
    const materialText = articleLines.join('\n');
    return {
      found: true,
      materialText,
      locator,
    };
  }

  // Se busca parágrafo
  if (locator.paragraph) {
    const parEscaped = locator.paragraph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parRegex = new RegExp(`^${parEscaped}[\\.\\s\\-–]`, 'i');
    for (const line of articleLines) {
      if (parRegex.test(line)) {
        return {
          found: true,
          materialText: line,
          locator,
        };
      }
    }
    return { found: false };
  }

  // Se busca inciso
  if (locator.item) {
    const itemEscaped = locator.item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const itemRegex = new RegExp(`^${itemEscaped}[\\.\\s\\-–]`, 'i');
    for (const line of articleLines) {
      if (itemRegex.test(line)) {
        return {
          found: true,
          materialText: line,
          locator,
        };
      }
    }
    return { found: false };
  }

  return { found: false };
}

/**
 * Cliente seguro de recuperação HTTP server-side de documentos oficiais de legislação.
 */
export async function fetchOfficialLegislation(urlStr: string): Promise<SecureRetrievalResult> {
  const sourceUrlRequested = urlStr;
  const redirectChain: string[] = [];
  let currentUrl = new URL(urlStr);
  let redirectsCount = 0;

  while (redirectsCount <= 3) {
    // 1. Validação estrita de Host e DNS
    await validateRetrievalUrlAndDns(currentUrl);

    // 2. Timeout e requisição
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), RETRIEVAL_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(currentUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AthenaAudit/2.3.3',
          'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
    } finally {
      clearTimeout(timeoutTimer);
    }

    // 3. Redirecionamentos manuais com verificação estrita
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`REDIRECT_SEM_LOCATION: HTTP ${response.status}`);

      redirectsCount++;
      if (redirectsCount > 3) throw new Error('LIMITE_DE_REDIRECTS_EXCEDIDO: Mais de 3 redirecionamentos.');

      const nextUrl = new URL(location, currentUrl);
      redirectChain.push(`${response.status} -> ${nextUrl.toString()}`);

      try {
        await validateRetrievalUrlAndDns(nextUrl);
      } catch (err) {
        throw new Error(`RETRIEVAL_BLOCKED_REDIRECT: ${err instanceof Error ? err.message : String(err)}`);
      }

      currentUrl = nextUrl;
      continue;
    }

    // 4. Verificação de Content-Type
    const contentTypeRaw = response.headers.get('content-type') || 'application/octet-stream';
    const contentType = contentTypeRaw.split(';')[0].trim().toLowerCase();
    if (contentType !== 'text/html' && contentType !== 'text/plain') {
      throw new Error(`UNSUPPORTED_CONTENT_TYPE: ${contentTypeRaw}. Permitido apenas text/html e text/plain.`);
    }

    // 5. Download dos bytes com verificação de tamanho
    const arrayBuffer = await response.arrayBuffer();
    const rawBytes = Buffer.from(arrayBuffer);
    if (rawBytes.length > MAX_LEGISLATION_HTML_BYTES) {
      throw new Error(`PAYLOAD_SIZE_EXCEEDED: ${rawBytes.length} bytes excede o limite de ${MAX_LEGISLATION_HTML_BYTES} bytes.`);
    }

    const rawContentHash = sha256Hex(rawBytes);

    // 6. Decodificação de charset (Planalto padrão windows-1252; CNJ padrão utf-8)
    let charset = currentUrl.hostname.includes('planalto.gov.br') ? 'windows-1252' : 'utf-8';
    const match = contentTypeRaw.match(/charset=([^;]+)/i);
    if (match) {
      charset = match[1].trim().toLowerCase();
    }

    const decoderName = (charset.includes('1252') || charset.includes('latin') || charset.includes('iso-8859'))
      ? 'windows-1252'
      : 'utf-8';

    let decodedText: string;
    try {
      decodedText = new TextDecoder(decoderName).decode(rawBytes);
    } catch {
      decodedText = new TextDecoder('utf-8').decode(rawBytes);
    }

    const norm = normalizeOfficialHtml(decodedText);

    return {
      sourceUrlRequested,
      sourceUrlFinal: currentUrl.toString(),
      retrievedAt: new Date().toISOString(),
      httpStatus: response.status,
      contentType: contentTypeRaw,
      contentLength: rawBytes.length,
      rawBytes,
      decodedText,
      rawContentHash,
      normalizedContentHash: norm.normalizedContentHash,
      normalizedText: norm.normalizedText,
      redirectChain,
      etag: response.headers.get('etag') || undefined,
      lastModified: response.headers.get('last-modified') || undefined,
      origin: 'REMOTE_OFFICIAL_DOCUMENT',
    };
  }

  throw new Error('FALHA_RETRIEVAL: Esgotado fluxo de execução');
}

/**
 * Verificador determinístico de MaterialEvidence contra documento oficial.
 * Fail-closed absoluto: qualquer inconsistência resulta em INVALID com reasonCode específico.
 */
export function verifyMaterialEvidence(
  evidence: MaterialEvidence,
  doc: {
    rawBytes: Buffer | Uint8Array;
    normalizedText: string;
    sourceUrl: string;
    sourceId: string;
    origin: MaterialDocumentOrigin;
  }
): MaterialEvidenceVerificationResult {
  // 1. Origem válida
  if (doc.origin !== 'REMOTE_OFFICIAL_DOCUMENT' && doc.origin !== 'LOCAL_REAL_DOCUMENT') {
    return {
      valid: false,
      reasonCode: 'ORIGIN_NOT_ALLOWED',
      details: `Origem '${doc.origin}' não é permitida em ambiente produtivo.`,
    };
  }

  if (evidence.provenance.origin !== doc.origin) {
    return {
      valid: false,
      reasonCode: 'ORIGIN_NOT_ALLOWED',
      details: `Origem declarada '${evidence.provenance.origin}' não corresponde à origem do documento '${doc.origin}'.`,
    };
  }

  // 2. Vínculo de ID e URL de origem
  if (evidence.sourceId !== doc.sourceId) {
    return {
      valid: false,
      reasonCode: 'SOURCE_ID_MISMATCH',
      details: `sourceId incompatível: esperado ${doc.sourceId}, recebido ${evidence.sourceId}`,
    };
  }

  const canonEvUrl = canonicalSourceUrl(evidence.sourceUrl);
  const canonDocUrl = canonicalSourceUrl(doc.sourceUrl);
  if (!canonEvUrl || !canonDocUrl || canonEvUrl !== canonDocUrl) {
    return {
      valid: false,
      reasonCode: 'SOURCE_URL_MISMATCH',
      details: `sourceUrl incompatível: esperado ${doc.sourceUrl}, recebido ${evidence.sourceUrl}`,
    };
  }

  // 3. Verificação do Hash Bruto (rawContentHash)
  const computedRawHash = sha256Hex(Buffer.isBuffer(doc.rawBytes) ? doc.rawBytes : Buffer.from(doc.rawBytes));
  if (evidence.rawContentHash !== computedRawHash) {
    return {
      valid: false,
      reasonCode: 'RAW_HASH_MISMATCH',
      details: `rawContentHash divergente: ${evidence.rawContentHash} !== ${computedRawHash}`,
    };
  }

  // 4. Verificação do Hash Normalizado (normalizedContentHash)
  const computedNormHash = sha256Hex(doc.normalizedText);
  if (evidence.normalizedContentHash !== computedNormHash) {
    return {
      valid: false,
      reasonCode: 'NORMALIZED_HASH_MISMATCH',
      details: `normalizedContentHash divergente: ${evidence.normalizedContentHash} !== ${computedNormHash}`,
    };
  }

  // 5. Presença literal do materialText no texto normalizado
  if (!doc.normalizedText.includes(evidence.materialText)) {
    return {
      valid: false,
      reasonCode: 'MATERIAL_TEXT_MISMATCH',
      details: 'materialText não existe literalmente dentro do conteúdo textual do documento.',
    };
  }

  // 6. Resolução determinística do Locator
  const extracted = extractLegislationLocator(doc.normalizedText, evidence.locator);
  if (!extracted.found || extracted.materialText !== evidence.materialText) {
    return {
      valid: false,
      reasonCode: 'LOCATOR_NOT_FOUND',
      details: `Locator normativo falhou ao extrair o materialText exato. Encontrado=${extracted.found}`,
    };
  }

  return {
    valid: true,
    reasonCode: 'VALID',
  };
}

/**
 * Cache Mínimo em Memória para Material Evidence.
 * Chave baseada em canonicalSourceUrl com preservação de hashes e metadata de revalidação.
 */
export interface CachedOfficialDocument {
  canonicalUrl: string;
  retrievedAt: string;
  rawContentHash: string;
  normalizedContentHash: string;
  rawBytes: Buffer;
  normalizedText: string;
  contentType: string;
  etag?: string;
  lastModified?: string;
  revalidationPolicy: MaterialRevalidationPolicy;
  expiresAt: number;
}

const memoryDocumentCache = new Map<string, CachedOfficialDocument>();

export function getCachedOfficialDocument(urlStr: string): CachedOfficialDocument | null {
  const canon = canonicalSourceUrl(urlStr);
  if (!canon) return null;
  const cached = memoryDocumentCache.get(canon);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    memoryDocumentCache.delete(canon);
    return null;
  }

  return cached;
}

export function setCachedOfficialDocument(
  urlStr: string,
  doc: Omit<CachedOfficialDocument, 'canonicalUrl' | 'expiresAt'>,
  ttlMs = 24 * 60 * 60 * 1000 // Padrão 24 horas para legislação compilada
): void {
  const canon = canonicalSourceUrl(urlStr);
  if (!canon) return;
  memoryDocumentCache.set(canon, {
    ...doc,
    canonicalUrl: canon,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCachedOfficialDocuments(): void {
  memoryDocumentCache.clear();
}
