import type { HomologatedLesson } from '../types';
import { extractChallengeFromText } from './objectiveChallenge';

/** Só para leitura autoritativa do servidor; nunca para snapshots do cache Firestore. */
export function mayRefreshPublishedQuestions(local?: HomologatedLesson | null, cloud?: HomologatedLesson | null): boolean {
  if (!local || !cloud || local.pendingCloud || cloud.pendingCloud || local.status !== 'approved' || cloud.status !== 'approved') return false;
  if (local.id !== cloud.id || local.day !== cloud.day || local.part !== cloud.part) return false;
  if (!Number.isFinite(local.approvedAt) || local.approvedAt <= 0 || local.approvedAt !== cloud.approvedAt || !Number.isInteger(local.version) || (local.version ?? 0) < 1 || local.version !== cloud.version) return false;
  if (extractChallengeFromText(local.content).content !== extractChallengeFromText(cloud.content).content) return false;
  const metadata = (lesson: HomologatedLesson) => Object.fromEntries(Object.entries(lesson).filter(([k]) => !['content', 'challenge', 'blocks', 'pendingCloud'].includes(k)).sort(([a], [b]) => a.localeCompare(b)));
  if (JSON.stringify(metadata(local)) !== JSON.stringify(metadata(cloud))) return false;
  return JSON.stringify(local.challenge) !== JSON.stringify(cloud.challenge) || local.content !== cloud.content;
}

export async function refreshPublishedQuestions(input: {
  shown: HomologatedLesson;
  readServer: () => Promise<HomologatedLesson | null>;
  current: () => HomologatedLesson;
  canReplace: (local: HomologatedLesson, cloud: HomologatedLesson) => boolean;
  writeLocal: (lesson: HomologatedLesson) => Promise<void>;
}): Promise<HomologatedLesson> {
  try {
    const cloud = await input.readServer();
    const current = input.current();
    if (!cloud || current.pendingCloud || !input.canReplace(current, cloud)) return current;
    await input.writeLocal(cloud);
    return cloud;
  } catch { return input.current(); }
}
