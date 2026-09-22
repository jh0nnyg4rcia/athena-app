import { ChatSession, Message } from '../types';
import { TRILHA_JURIDICA_DATA } from '../data/trilhaData';

export type TrilhaContext = {
  day?: number;
  part: number;
  total: number;
};

function parseDay(text?: string): number | undefined {
  if (!text) return undefined;
  const match =
    text.match(/Trilha\s+Dia\s+(\d+)/i) ||
    text.match(/DIA\s+(\d+)/) ||
    text.match(/Dia\s+(\d+)\s*(?:\[|:|da\s+Trilha|•)/i) ||
    text.match(/cronograma da Trilha Jurídica de 100 Dias[\s\S]{0,80}?DIA\s+(\d+)/i);
  if (!match) return undefined;
  const day = Number(match[1]);
  return Number.isFinite(day) && day > 0 ? day : undefined;
}

export function inferTrilhaContext(
  session?: Pick<ChatSession, 'trilhaDay' | 'trilhaMaterialIndex' | 'title'> | null,
  messages?: Message[],
  msg?: Pick<Message, 'trilhaDay' | 'trilhaMaterialIndex' | 'content'> | null
): TrilhaContext {
  let day = msg?.trilhaDay ?? session?.trilhaDay;
  if (day === undefined) day = parseDay(session?.title);
  if (day === undefined) day = parseDay(msg?.content);
  if (day === undefined) {
    for (const item of messages || []) {
      day = item.trilhaDay ?? parseDay(item.content);
      if (day !== undefined) break;
    }
  }

  const part =
    msg?.trilhaMaterialIndex ??
    [...(messages || [])].reverse().find((m) => m.role === 'model' && m.trilhaMaterialIndex !== undefined)?.trilhaMaterialIndex ??
    session?.trilhaMaterialIndex ??
    0;

  const total = day
    ? TRILHA_JURIDICA_DATA.find((d) => d.dia === day)?.materias?.length || 0
    : 0;

  return { day, part, total };
}

export function isTrilhaLesson(ctx: TrilhaContext, msg?: Pick<Message, 'trilhaDay' | 'trilhaMaterialIndex'> | null): boolean {
  return ctx.day !== undefined || msg?.trilhaDay !== undefined || msg?.trilhaMaterialIndex !== undefined || ctx.total > 0;
}
