/**
 * ATHENA V2.3.5-C — DETERMINISTIC OFFLINE OFFICIAL EVIDENCE EXTRACTOR
 * 
 * 100% OFFLINE / ZERO NETWORK / ZERO LLM.
 * 
 * Extrai texto normalizado dos 27 documentos oficiais recuperados em V2.3.5-C.
 * Produz ${docId}.txt e extraction-manifest.json com SHA-256 de texto normalizado.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export const EXTRACTOR_VERSION = 'v235c-extract-1';

function computeSha256(buf: Buffer | string): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function decodeHtml(buf: Buffer, charset: string): string {
  if (charset.toLowerCase().includes('1252') || charset.toLowerCase().includes('iso-8859-1')) {
    const decoder = new TextDecoder('windows-1252');
    return decoder.decode(buf);
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buf);
}

function normalizeHtmlToText(rawHtml: string): string {
  let s = rawHtml;
  // Remove script, style, comments
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');

  // Converter quebras e parágrafos em nova linha
  s = s.replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, '\n');
  s = s.replace(/<br\s*[\/]?>/gi, '\n');

  // Strip all tags
  s = s.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  s = s.replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&sect;/g, '§')
       .replace(/&deg;/g, '°')
       .replace(/&ordm;/g, 'º')
       .replace(/&ordf;/g, 'ª')
       .replace(/&#147;/g, '"')
       .replace(/&#148;/g, '"')
       .replace(/&#150;/g, '-')
       .replace(/&#151;/g, '—')
       .replace(/&#8203;/g, '')
       .replace(/&#9679;/g, '●');

  // Normalizar quebras de linha e espaços
  const lines = s.split(/\r?\n/).map(l => l.replace(/[\t\f\v ]+/g, ' ').trim()).filter(Boolean);
  return lines.join('\n');
}

export function runExtractionV235C() {
  const baseDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const officialDocsDir = path.join(baseDir, 'official-documents');
  const extractedDir = path.join(baseDir, 'extracted');
  const manifestDir = path.join(baseDir, 'manifest');
  fs.mkdirSync(extractedDir, { recursive: true });

  const retrievalLog = JSON.parse(fs.readFileSync(path.join(manifestDir, 'retrieval-log.json'), 'utf8'));
  const extractionManifest: any = {
    extractorVersion: EXTRACTOR_VERSION,
    extractedAt: new Date().toISOString(),
    documents: []
  };

  console.log(`Iniciando extração offline V2.3.5-C para ${retrievalLog.records.length} documentos...`);
  for (const rec of retrievalLog.records) {
    if (rec.outcome !== 'RETRIEVED' || !rec.rawSha256) {
      console.warn(`[SKIP] ${rec.documentId}: outcome = ${rec.outcome}`);
      extractionManifest.documents.push({
        documentId: rec.documentId,
        outcome: rec.outcome,
        httpStatus: rec.statusCode,
        error: rec.error || 'DOCUMENT_NOT_RETRIEVED'
      });
      continue;
    }

    const binPath = path.join(officialDocsDir, `${rec.rawSha256}.bin`);
    if (!fs.existsSync(binPath)) {
      throw new Error(`BIN_MISSING: Arquivo binário ${binPath} não encontrado.`);
    }

    const binBuf = fs.readFileSync(binPath);
    const actualRawHash = computeSha256(binBuf);
    if (actualRawHash !== rec.rawSha256) {
      throw new Error(`CORRUPTED_BIN: ${rec.documentId} hash ${actualRawHash} !== ${rec.rawSha256}`);
    }

    const isPlanalto = rec.canonicalUrl.includes('planalto.gov.br');
    const charset = isPlanalto ? 'windows-1252' : 'utf-8';
    const rawHtml = decodeHtml(binBuf, charset);
    const normalizedText = normalizeHtmlToText(rawHtml);
    const normHash = computeSha256(Buffer.from(normalizedText, 'utf8'));

    const txtPath = path.join(extractedDir, `${rec.documentId}.txt`);
    fs.writeFileSync(txtPath, normalizedText, 'utf8');

    extractionManifest.documents.push({
      documentId: rec.documentId,
      canonicalUrl: rec.canonicalUrl,
      httpStatus: rec.statusCode,
      outcome: 'EXTRACTED',
      rawSha256: rec.rawSha256,
      charset,
      extractorVersion: EXTRACTOR_VERSION,
      normalizedTextSha256: normHash,
      normalizedLength: normalizedText.length,
      txtPath: path.relative(process.cwd(), txtPath).replace(/\\/g, '/')
    });

    console.log(`[EXTRACTED] ${rec.documentId} -> ${normalizedText.length} chars, normSha: ${normHash.slice(0, 12)}`);
  }

  const manifestPath = path.join(extractedDir, 'extraction-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(extractionManifest, null, 2), 'utf8');
  console.log(`\nExtração concluída com sucesso. Manifesto salvo em ${manifestPath}`);
}

runExtractionV235C();
