/**
 * ATHENA V2.3.5-B — deterministic extraction of persisted official bytes (offline).
 * extractorVersion: v235b-extract-1
 * - Decodes raw bytes using HTTP charset / <meta charset> / fallback windows-1252 (no guessing by content).
 * - Normalizes with production normalizeOfficialHtml (strike/del removed = texto revogado tachado).
 * - Writes extracted/<documentId>.txt and extracted/extraction-manifest.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { normalizeOfficialHtml } from '../src/services/legalEvidenceRetrievalService';

export const EXTRACTOR_VERSION = 'v235b-extract-1';
const base = path.resolve('tmp/assertion-decomposition-holdout-v235b');

export function detectCharset(contentType: string, buf: Buffer): string {
  const m1 = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType || '');
  if (m1) return m1[1].toLowerCase();
  const head = buf.subarray(0, 4096).toString('latin1');
  const m2 = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head);
  if (m2) return m2[1].toLowerCase();
  return 'windows-1252';
}

export function decode(buf: Buffer, charset: string): string {
  const cs = charset === 'iso-8859-1' || charset === 'latin1' ? 'windows-1252' : charset;
  return new TextDecoder(cs).decode(buf);
}

/** Extra entity decoding (numeric) applied after production normalizer, deterministic. */
export function decodeNumericEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&ordm;/gi, 'º').replace(/&deg;/gi, '°').replace(/&ecirc;/gi, 'ê').replace(/&ocirc;/gi, 'ô')
    .replace(/&acirc;/gi, 'â').replace(/&agrave;/gi, 'à').replace(/&uuml;/gi, 'ü').replace(/&ndash;/gi, '–').replace(/&mdash;/gi, '—')
    .replace(/&ldquo;|&rdquo;/gi, '"').replace(/&lsquo;|&rsquo;/gi, "'").replace(/&Ecirc;/g, 'Ê').replace(/&Ocirc;/g, 'Ô').replace(/&Acirc;/g, 'Â');
}

function main() {
  const log = JSON.parse(fs.readFileSync(path.join(base, 'manifest/retrieval-log.json'), 'utf8'));
  const latest: Record<string, any> = {};
  for (const run of log.runs) for (const r of run.records) latest[r.documentId] = r;
  const manifest: any[] = [];
  for (const [docId, r] of Object.entries(latest)) {
    if (!r.rawSha256 || !r.rawPath) { manifest.push({ documentId: docId, status: 'NO_BYTES', error: r.error }); continue; }
    const buf = fs.readFileSync(path.resolve(r.rawPath));
    const rawSha = crypto.createHash('sha256').update(buf).digest('hex');
    const charset = detectCharset(r.contentType, buf);
    const decoded = decode(buf, charset);
    const norm = normalizeOfficialHtml(decoded);
    const text = decodeNumericEntities(norm.normalizedText).replace(/[ \t\u00A0]+/g, ' ');
    const textSha = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    fs.writeFileSync(path.join(base, 'extracted', `${docId}.txt`), text, 'utf8');
    manifest.push({ documentId: docId, httpStatus: r.statusCode, outcome: r.outcome, rawSha256: rawSha, rawHashMatchesRetrieval: rawSha === r.rawSha256, charset, extractorVersion: EXTRACTOR_VERSION, normalizedTextSha256: textSha, normalizedLength: text.length });
    console.log(`${docId.padEnd(12)} raw=${rawSha.slice(0, 12)} match=${rawSha === r.rawSha256} cs=${charset} norm=${textSha.slice(0, 12)} len=${text.length}`);
  }
  fs.writeFileSync(path.join(base, 'extracted', 'extraction-manifest.json'), JSON.stringify({ extractorVersion: EXTRACTOR_VERSION, documents: manifest }, null, 2));
}

if (process.argv[1]?.endsWith('extract-holdout-official-evidence-v235b.ts')) main();
