import type { HomologatedLesson } from "../types";
import { lessonHasBody } from "./officialCacheRestore";

/** Consulta concluída com registro, consulta concluída sem registro, ou consulta ainda não feita. */
export type LessonLoadStatus = "found" | "not_found" | "not_loaded";
export type LessonLoadSource = "memory" | "indexeddb" | "legacy" | "firestore";

export function storedLessonUsable(lesson?: HomologatedLesson | null): lesson is HomologatedLesson {
  return Boolean(lesson && lesson.status === "approved" && lessonHasBody(lesson));
}

/**
 * A nuvem só preenche um id cuja ausência local já foi confirmada.
 * "not_loaded" e "found" bloqueiam a gravação.
 */
export function mayAdoptRemoteLesson(status: LessonLoadStatus, localHasBody: boolean): boolean {
  if (status !== "not_found") return false;
  return !localHasBody;
}

/** Epoch positivo. Zero, ausente e não finito não autorizam troca. */
function isComparableApprovedAt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * A nuvem só substitui a aula realmente lida quando os dois carimbos
 * são números finitos, maiores que zero, e o remoto é estritamente mais novo.
 */
export function cloudMayReplaceLocal(
  local: HomologatedLesson | null | undefined,
  cloud: HomologatedLesson | null | undefined
): boolean {
  if (!storedLessonUsable(local) || !storedLessonUsable(cloud)) return false;
  if (!isComparableApprovedAt(local.approvedAt) || !isComparableApprovedAt(cloud.approvedAt)) return false;
  return cloud.approvedAt > local.approvedAt;
}

/**
 * Catálogo remoto só entra no cofre com leitura concluída.
 * Ausência confirmada preenche o id. Aula local só cede com carimbo estritamente mais novo.
 * "not_loaded" não grava e não vira ausência.
 */
export function mayPersistCatalogLesson(
  status: LessonLoadStatus,
  local: HomologatedLesson | null | undefined,
  cloud: HomologatedLesson | null | undefined
): boolean {
  if (!cloud) return false;
  if (status !== "found" && status !== "not_found") return false;
  if (status === "found" || storedLessonUsable(local) || lessonHasBody(local)) {
    return cloudMayReplaceLocal(local, cloud);
  }
  if (cloud.status && cloud.status !== "approved") return false;
  return storedLessonUsable(cloud);
}

/** Só a aula encontrada no cofre pode ser comparada com a nuvem. Seed e not_loaded não. */
export function maySyncDisplayedLesson(loaded: {
  syncLocal?: boolean;
  source?: LessonLoadSource | null;
}): boolean {
  return Boolean(loaded.syncLocal && (loaded.source === "memory" || loaded.source === "indexeddb"));
}

export function lessonCacheDebugEnabled(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("athena_cache_debug") === "1";
  } catch {
    return false;
  }
}

/** Não inclui o Markdown. Só origem, id e duração. */
export function reportLessonLoad(source: LessonLoadSource, id: string, ms: number): void {
  if (!lessonCacheDebugEnabled()) return;
  console.info("[athena-cache]", { source, id, ms: Math.max(0, Math.round(ms)) });
}

export async function assembleHomologatedLesson(input: {
  readVault: () => Promise<{
    status: LessonLoadStatus;
    lesson?: HomologatedLesson | null;
    source?: "memory" | "indexeddb";
    ms?: number;
  }>;
  readLegacy: () => HomologatedLesson | null;
  readCloud: () => Promise<HomologatedLesson | null>;
  writeLocal: (lesson: HomologatedLesson) => Promise<void> | void;
}): Promise<{
  lesson: HomologatedLesson | null;
  source: LessonLoadSource | null;
  ms: number;
  persisted: boolean;
  /** Verdadeiro só quando a aula devolvida é o registro lido no cofre. */
  syncLocal: boolean;
}> {
  const vault = await input.readVault();
  const ms = vault.ms || 0;
  if (vault.status === "not_loaded") {
    const legacy = input.readLegacy();
    if (storedLessonUsable(legacy)) {
      return { lesson: legacy, source: "legacy", ms, persisted: false, syncLocal: false };
    }
    const cloud = await input.readCloud();
    if (storedLessonUsable(cloud)) {
      return { lesson: cloud, source: "firestore", ms, persisted: false, syncLocal: false };
    }
    return { lesson: null, source: null, ms, persisted: false, syncLocal: false };
  }
  if (vault.status === "found" && storedLessonUsable(vault.lesson)) {
    return { lesson: vault.lesson, source: vault.source || "indexeddb", ms, persisted: false, syncLocal: true };
  }
  const legacy = input.readLegacy();
  if (storedLessonUsable(legacy)) {
    return { lesson: legacy, source: "legacy", ms, persisted: false, syncLocal: false };
  }
  const localHasBody = Boolean(
    (vault.lesson && lessonHasBody(vault.lesson)) || (legacy && lessonHasBody(legacy))
  );
  if (!mayAdoptRemoteLesson(vault.status, localHasBody)) {
    return { lesson: null, source: null, ms, persisted: false, syncLocal: false };
  }
  const cloud = await input.readCloud();
  if (!storedLessonUsable(cloud)) return { lesson: null, source: null, ms, persisted: false, syncLocal: false };
  await input.writeLocal(cloud);
  return { lesson: cloud, source: "firestore", ms, persisted: true, syncLocal: false };
}
