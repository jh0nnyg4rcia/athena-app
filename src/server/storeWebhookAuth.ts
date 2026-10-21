import type { Request } from 'express';

/**
 * Fail-closed webhook authentication.
 * ITEM 11: implement Google Pub/Sub OIDC push verification and Apple JWS (ASSN V2).
 * Until configured, every webhook is rejected with 401 and must not touch Firestore.
 */

export type WebhookPlatform = 'google_play' | 'app_store';

export function playRtdnAuthConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  // Audience should be the full HTTPS URL of the Play RTDN endpoint.
  return Boolean(env.ATHENA_PLAY_RTDN_AUDIENCE && env.ATHENA_PLAY_RTDN_SERVICE_ACCOUNT);
}

export function appStoreWebhookAuthConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  // Apple root certs / bundle checks — set when ASSN V2 verification is wired.
  return Boolean(env.ATHENA_APPLE_BUNDLE_ID && env.ATHENA_APPLE_WEBHOOK_ENABLED === 'true');
}

export async function assertPlayRtdnAuthorized(req: Request, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (!playRtdnAuthConfigured(env)) {
    throw Error('WEBHOOK_AUTH_UNAVAILABLE');
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw Error('WEBHOOK_AUTH_REQUIRED');

  // ITEM 11: verify OIDC against Google certs:
  //  - iss https://accounts.google.com
  //  - aud === ATHENA_PLAY_RTDN_AUDIENCE
  //  - email === ATHENA_PLAY_RTDN_SERVICE_ACCOUNT (Pub/Sub push SA)
  //  - email_verified true
  // Until implemented, fail closed even if env vars are present.
  throw Error('WEBHOOK_AUTH_UNAVAILABLE');
}

export async function assertAppStoreWebhookAuthorized(req: Request, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (!appStoreWebhookAuthConfigured(env)) {
    throw Error('WEBHOOK_AUTH_UNAVAILABLE');
  }
  const signedPayload = req.body?.signedPayload;
  if (typeof signedPayload !== 'string' || !signedPayload.includes('.')) {
    throw Error('WEBHOOK_AUTH_REQUIRED');
  }
  // ITEM 11: verify JWS (x5c chain to Apple Root CA) and notificationUUID freshness.
  throw Error('WEBHOOK_AUTH_UNAVAILABLE');
}
