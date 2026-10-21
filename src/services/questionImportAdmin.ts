import { randomUUID } from 'node:crypto';
import { isCeoEmail } from '../lib/contentProvider';
import { ATHENA_TARGET, createOfflinePublisher, previewPublication } from '../../scripts/publish-reviewed-questions.mjs';
import { canonical } from '../../scripts/import-reviewed-questions.mjs';

interface VerifiedIdentity { uid: string; email: string; emailVerified: boolean }
interface ServerRecords {
  createPreview(id: string, value: unknown): Promise<void>;
  readPreview(id: string): Promise<any>;
  createApproval(id: string, value: unknown): Promise<void>;
  readApproval(id: string): Promise<any>;
}
/** Verificação sem gravação de perfil: usa somente um Admin app ATHENA já inicializado. */
export async function verifyExistingAthenaAdminToken(token: string): Promise<VerifiedIdentity> {
  const { getApps } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const app = getApps().find(app => app.options.projectId === ATHENA_TARGET.projectId);
  if (!app) throw new Error('Backend administrativo ATHENA não inicializado; nenhuma conexão criada automaticamente');
  const auth = getAuth(app);
  const first = await auth.verifyIdToken(token);
  if (!first.email_verified || !isCeoEmail(first.email)) throw new Error('Identidade do CEO não validada');
  const verified = await auth.verifyIdToken(token, true);
  if (!verified.email_verified || !isCeoEmail(verified.email)) throw new Error('Identidade do CEO não validada');
  return { uid: verified.uid, email: verified.email!, emailVerified: true };
}
/** Preparação backend. Não registra rotas e não habilita conexão de produção. */
export function createQuestionImportAdmin(options: {
  adapter: any;
  records: ServerRecords;
  verifyToken?: (token: string) => Promise<VerifiedIdentity>;
  now?: () => number;
}) {
  if (!['mock', 'emulator'].includes(options.adapter?.mode)) throw new Error('Produção bloqueada');
  const now = options.now ?? Date.now;
  const verifyToken = options.verifyToken ?? verifyExistingAthenaAdminToken;
  async function identity(bearer: string) {
    if (typeof bearer !== 'string' || !bearer.startsWith('Bearer ') || !bearer.slice(7).trim()) throw new Error('Token obrigatório');
    const user = await verifyToken(bearer.slice(7).trim());
    if (!user?.uid || !user.emailVerified || !isCeoEmail(user.email)) throw new Error('Identidade do CEO não validada');
    return user;
  }
  return {
    async preview(bearer: string, input: unknown) {
      const user = await identity(bearer);
      const plan = await previewPublication(options.adapter, input, new Date(now()).toISOString());
      const previewId = randomUUID();
      await options.records.createPreview(previewId, { plan, actorUid: user.uid, createdAt: new Date(now()).toISOString(), expiresAt: new Date(now() + 15 * 60_000).toISOString() });
      return { previewId, plan };
    },
    async approve(bearer: string, previewId: string, expectedPlanSha256: string) {
      const user = await identity(bearer);
      const preview = await options.records.readPreview(previewId);
      if (!preview || preview.actorUid !== user.uid || preview.plan.planSha256 !== expectedPlanSha256 || !Number.isFinite(Date.parse(preview.expiresAt)) || Date.parse(preview.expiresAt) <= now()) throw new Error('Prévia expirada, divergente ou de outra identidade');
      const authorizationId = randomUUID();
      const authorization = {
        action: 'publish-reviewed-questions', authorizationId, actorUid: user.uid,
        actorEmail: user.email, previewId, lessonId: preview.plan.lessonId,
        target: preview.plan.target, planSha256: expectedPlanSha256,
        approvedAt: new Date(now()).toISOString(), expiresAt: new Date(now() + 5 * 60_000).toISOString()
      };
      await options.records.createApproval(authorizationId, authorization);
      return { authorizationId, planSha256: expectedPlanSha256, expiresAt: authorization.expiresAt };
    },
    async publish(bearer: string, authorizationId: string) {
      const user = await identity(bearer);
      const authorization = await options.records.readApproval(authorizationId);
      if (!authorization || authorization.actorUid !== user.uid || !isCeoEmail(authorization.actorEmail)) throw new Error('Autorização do servidor ausente/identidade divergente');
      const preview = await options.records.readPreview(authorization.previewId);
      if (!preview || preview.actorUid !== user.uid || preview.plan.planSha256 !== authorization.planSha256) throw new Error('Prévia do servidor divergente');
      const approved = canonical(authorization);
      const publisher = createOfflinePublisher(options.adapter, { now, verifyAuthorization: candidate => candidate.actorUid === user.uid && canonical(candidate) === approved });
      return publisher.publish(preview.plan, authorization);
    }
  };
}
