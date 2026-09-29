import type { HomologatedLesson } from '../types';

export function lessonHasBody(lesson?: HomologatedLesson | null): boolean {
  return Boolean(lesson && (lesson.content || lesson.blocks?.length));
}

/**
 * A nuvem só preenche aula que o aparelho ainda não tem.
 * Texto já gravado no cofre local permanece, mesmo que a leitura da nuvem falhe.
 */
export function catalogSaveFailureMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error || '');
  if (/resource-exhausted|quota exceeded|quota limit|cota diária/i.test(msg)) {
    return 'A cota diária de gravação do catálogo acabou. O texto continua nesta tela. Não desinstale o app. Toque em Aprovar e Salvar de novo quando a cota renovar.';
  }
  if (/tempo esgotado/i.test(msg)) {
    return 'A gravação do catálogo não respondeu. O texto continua nesta tela. Toque em Aprovar e Salvar de novo. Não desinstale o app antes disso.';
  }
  const detail = msg.replace(/\s+/g, ' ').trim().slice(0, 180);
  return detail
    ? `O catálogo oficial recusou a gravação (${detail}). O texto continua nesta tela.`
    : 'O catálogo oficial recusou a gravação. O texto continua nesta tela. Toque em Aprovar e Salvar de novo.';
}

export function shouldAdoptCloudLesson(
  local: HomologatedLesson | null | undefined,
  cloud: HomologatedLesson | null | undefined
): boolean {
  if (!cloud || !lessonHasBody(cloud)) return false;
  if (cloud.status && cloud.status !== 'approved') return false;
  if (local && lessonHasBody(local)) return false;
  return true;
}
