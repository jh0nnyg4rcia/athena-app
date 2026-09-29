import type { HomologatedLesson } from '../types';

export function lessonHasBody(lesson?: HomologatedLesson | null): boolean {
  return Boolean(lesson && (lesson.content || lesson.blocks?.length));
}

/**
 * A nuvem só preenche aula que o aparelho ainda não tem.
 * Texto já gravado no cofre local permanece, mesmo que a leitura da nuvem falhe.
 */
export function shouldAdoptCloudLesson(
  local: HomologatedLesson | null | undefined,
  cloud: HomologatedLesson | null | undefined
): boolean {
  if (!cloud || !lessonHasBody(cloud)) return false;
  if (cloud.status && cloud.status !== 'approved') return false;
  if (local && lessonHasBody(local)) return false;
  return true;
}
