import { readFileSync } from "node:fs";
import type { HomologatedLesson } from "../src/types";
import {
  assembleHomologatedLesson,
  cloudMayReplaceLocal,
  mayAdoptRemoteLesson,
  maySyncDisplayedLesson,
} from "../src/lib/lessonLoad";

let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed += 1;
    console.error("FALHOU:", message);
  }
}

function lesson(id: string, content: string, approvedAt = 10): HomologatedLesson {
  const match = id.match(/^day_(\d+)_part_(\d+)$/);
  return {
    id,
    day: Number(match?.[1] || 0),
    part: Number(match?.[2] || 0),
    subject: "Direito Penal",
    topic: "Cache",
    content,
    status: "approved",
    approvedBy: "jhonny.spider@gmail.com",
    approvedAt,
    version: 1,
  };
}

type Store = Map<string, HomologatedLesson>;

function installFakeVault(store: Store) {
  const calls = {
    get: [] as string[],
    getKey: [] as string[],
    getAll: 0,
    put: [] as string[],
    delete: [] as string[],
    failKeys: new Set<string>(),
    failGetAll: false,
  };
  const fail = (key: string) => calls.failKeys.has(key);
  const failedRequest = () => {
    const req: { onsuccess: (() => void) | null; onerror: (() => void) | null } = {
      onsuccess: null,
      onerror: null,
    };
    queueMicrotask(() => req.onerror?.());
    return req;
  };
  const request = (result: unknown) => {
    const req: { result?: unknown; onsuccess: (() => void) | null; onerror: (() => void) | null } = {
      onsuccess: null,
      onerror: null,
    };
    queueMicrotask(() => {
      req.result = result;
      req.onsuccess?.();
    });
    return req;
  };
  const db = {
    objectStoreNames: { contains: (name: string) => name === "lessons" || name === "trilha_parts" || name === "compressed_reviews" },
    transaction(name: string) {
      const tx: {
        oncomplete: (() => void) | null;
        onerror: (() => void) | null;
        objectStore: () => {
          get: (key: string) => unknown;
          getKey: (key: string) => unknown;
          getAll: () => unknown;
          put: (value: HomologatedLesson) => unknown;
          delete: (key: string) => unknown;
        };
      } = {
        oncomplete: null,
        onerror: null,
        objectStore() {
          return {
            get(key: string) {
              if (name !== "lessons") return request(undefined);
              calls.get.push(key);
              if (fail(key)) return failedRequest();
              return request(store.get(key));
            },
            getKey(key: string) {
              if (name !== "lessons") return request(undefined);
              calls.getKey.push(key);
              if (fail(key)) return failedRequest();
              return request(store.has(key) ? key : undefined);
            },
            getAll() {
              calls.getAll += 1;
              if (name === "lessons" && calls.failGetAll) return failedRequest();
              return request(name === "lessons" ? [...store.values()] : []);
            },
            put(value: HomologatedLesson) {
              calls.put.push(value.id);
              store.set(value.id, value);
              return request(undefined);
            },
            delete(key: string) {
              calls.delete.push(key);
              store.delete(key);
              return request(undefined);
            },
          };
        },
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    },
  };
  const host = globalThis as unknown as {
    window?: unknown;
    indexedDB?: { open: () => unknown };
  };
  host.window = host;
  host.indexedDB = {
    open() {
      const openReq: { result?: unknown; onsuccess: (() => void) | null; onerror: (() => void) | null; onupgradeneeded: (() => void) | null } = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => {
        openReq.result = db;
        openReq.onsuccess?.();
      });
      return openReq;
    },
  };
  return calls;
}

async function main() {
  const local = lesson("day_1_part_0", "Aula local do dia 1.");
  const other = lesson("day_80_part_4", "Aula local do dia 80.");
  const store: Store = new Map([
    [local.id, local],
    [other.id, other],
  ]);
  const calls = installFakeVault(store);
  const vault = await import("../src/services/lessonVault");

  assert(vault.lessonLoadState(local.id) === "not_loaded", "id ainda não consultado permanece not_loaded");
  assert(vault.getRememberedLesson(local.id) === undefined, "ausência no Map não é ausência no IndexedDB");

  const presence = await vault.confirmVaultLesson(local.id);
  assert(presence === "found", "getKey confirma o id sem trazer o conjunto");
  assert(calls.getAll === 0, "confirmar um id não usa getAll");
  assert(calls.get.length === 0, "confirmar um id não lê o Markdown");
  assert(mayAdoptRemoteLesson(presence, false) === false, "id presente no IndexedDB não autoriza sobrescrever com a nuvem");
  assert(store.get(other.id)?.content === other.content, "confirmar o dia 1 não altera o dia 80");

  const read = await vault.readVaultLesson(local.id);
  assert(read.status === "found" && read.source === "indexeddb", "leitura pontual recupera só o dia pedido");
  assert(read.status === "found" && read.lesson.content === local.content, "o Markdown local é o que volta");
  assert(calls.get.length === 1 && calls.get[0] === local.id, "o get pede somente day_1_part_0");
  assert(calls.getAll === 0, "abrir uma aula não dispara getAll");
  assert(calls.put.length === 0 && calls.delete.length === 0, "leitura pontual não grava nem apaga");
  assert(store.get(other.id)?.content === other.content, "o outro dia permanece intacto");

  calls.get.length = 0;
  const again = await vault.readVaultLesson(local.id);
  assert(again.status === "found" && again.source === "memory", "segunda leitura do mesmo id usa a memória");
  assert(calls.get.length === 0, "memória carregada não relê o IndexedDB");

  const missing = await vault.readVaultLesson("day_44_part_2");
  assert(missing.status === "not_found", "id ausente no IndexedDB fica not_found");
  assert(calls.get.includes("day_44_part_2"), "a ausência é consultada por id");
  assert(calls.getAll === 0 && store.get(other.id)?.content === other.content, "consultar um id ausente não mexe nos outros");
  assert(mayAdoptRemoteLesson("not_found", false) === true, "só a ausência confirmada permite a nuvem");
  assert(mayAdoptRemoteLesson("not_loaded", false) === false, "not_loaded não autoriza a nuvem a gravar");
  assert(mayAdoptRemoteLesson("found", false) === false, "found sem corpo na memória continua protegido");

  let cloudCalls = 0;
  let writes = 0;
  const opened = await Promise.race([
    assembleHomologatedLesson({
      readVault: async () => read,
      readLegacy: () => null,
      readCloud: () => {
        cloudCalls += 1;
        return new Promise(() => undefined);
      },
      writeLocal: () => {
        writes += 1;
      },
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("a aula local esperou o Firestore")), 200)),
  ]);
  assert(opened.lesson?.id === local.id && opened.source === "indexeddb", "aula local abre pela origem indexeddb");
  assert(cloudCalls === 0 && writes === 0, "aula local não espera nem grava o Firestore");

  const remote = lesson("day_44_part_2", "Aula vinda da nuvem.", 20);
  const filled = await assembleHomologatedLesson({
    readVault: async () => ({ status: "not_found", ms: 1 }),
    readLegacy: () => null,
    readCloud: async () => remote,
    writeLocal: () => {
      writes += 1;
    },
  });
  assert(filled.source === "firestore" && filled.persisted && filled.lesson?.content === remote.content, "id inexistente localmente ainda usa o Firestore");

  writes = 0;
  const blocked = await assembleHomologatedLesson({
    readVault: async () => ({ status: "not_loaded", ms: 1 }),
    readLegacy: () => null,
    readCloud: async () => remote,
    writeLocal: () => {
      writes += 1;
    },
  });
  assert(blocked.source === "firestore" && blocked.persisted === false && writes === 0, "falha de leitura não grava a nuvem por cima do cofre");

  const localAt = (approvedAt: number) => lesson("day_2_part_0", "Texto local.", approvedAt);
  const cloudAt = (approvedAt: number) => lesson("day_2_part_0", "Texto da nuvem.", approvedAt);
  const withStamp = (base: HomologatedLesson, approvedAt: unknown) => ({ ...base, approvedAt: approvedAt as number });
  assert(cloudMayReplaceLocal(localAt(100), cloudAt(200)) === true, "local 100 e nuvem 200 substitui");
  assert(cloudMayReplaceLocal(localAt(200), cloudAt(100)) === false, "local 200 e nuvem 100 não substitui");
  assert(cloudMayReplaceLocal(localAt(100), cloudAt(100)) === false, "timestamps iguais não substituem");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), undefined), cloudAt(200)) === false, "approvedAt local ausente não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(null, cloudAt(200)) === false, "aula local nula não é substituída");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), null), cloudAt(200)) === false, "approvedAt local nulo não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), Number.NaN), cloudAt(200)) === false, "approvedAt local NaN não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), undefined)) === false, "approvedAt remoto ausente não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), null) === false, "nuvem nula não substitui a aula local");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), null)) === false, "approvedAt remoto nulo não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), Number.NaN)) === false, "approvedAt remoto NaN não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), undefined), withStamp(cloudAt(200), undefined)) === false, "dois carimbos ausentes não substituem");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), Number.NaN), withStamp(cloudAt(200), Number.NaN)) === false, "dois carimbos NaN não substituem");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), Number.POSITIVE_INFINITY), cloudAt(200)) === false, "approvedAt local não finito não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), Number.POSITIVE_INFINITY)) === false, "approvedAt remoto não finito não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), Number.NEGATIVE_INFINITY), cloudAt(200)) === false, "approvedAt local -Infinity não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), Number.NEGATIVE_INFINITY)) === false, "approvedAt remoto -Infinity não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), "100"), cloudAt(200)) === false, "approvedAt local em string não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), "300")) === false, "approvedAt remoto em string não autoriza sobrescrita");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), 0), cloudAt(200)) === false, "A local approvedAt 0 e remoto positivo não substitui");
  assert(cloudMayReplaceLocal(localAt(100), withStamp(cloudAt(200), 0)) === false, "B remoto approvedAt 0 não substitui");
  assert(cloudMayReplaceLocal(withStamp(localAt(100), 0), withStamp(cloudAt(200), 0)) === false, "C ambos 0 não substituem");
  assert(mayAdoptRemoteLesson("not_found", true) === false, "legado com corpo bloqueia a adoção remota");

  calls.failKeys.add(other.id);
  const unreadable = await vault.readVaultLesson(other.id);
  assert(unreadable.status === "not_loaded", "erro do IndexedDB permanece not_loaded");
  assert(vault.lessonLoadState(other.id) === "not_loaded", "erro do IndexedDB não vira not_found");
  assert(mayAdoptRemoteLesson(unreadable.status, false) === false, "erro do IndexedDB não autoriza adoção remota");
  assert(store.get(other.id)?.content === other.content, "erro de leitura não altera o outro dia");
  assert(calls.put.length === 0 && calls.delete.length === 0, "erro de leitura não grava nem apaga");
  calls.failKeys.delete(other.id);

  calls.failKeys.add("day_90_part_0");
  const unconfirmed = await vault.confirmVaultLesson("day_90_part_0");
  assert(unconfirmed === "not_loaded", "getKey com erro não conclui ausência");
  assert(vault.lessonLoadState("day_90_part_0") === "not_loaded", "confirm com erro não grava not_found");
  assert(mayAdoptRemoteLesson(unconfirmed, false) === false, "restore não adopta id cujo IndexedDB falhou");
  calls.failKeys.delete("day_90_part_0");

  const day1Before = store.get(local.id)?.content;
  const day80Before = store.get(other.id)?.content;
  vault.forgetLesson(local.id);
  calls.failKeys.add(local.id);
  const failedDay1 = await vault.readVaultLesson(local.id);
  assert(failedDay1.status === "not_loaded", "H leitura com erro permanece not_loaded");
  assert(vault.lessonLoadState(local.id) === "not_loaded", "H not_loaded não é gravado como not_found");
  assert(mayAdoptRemoteLesson(failedDay1.status, false) === false, "H not_loaded não autoriza adoção remota");
  const seed = lesson(local.id, "Semente antiga.", 1);
  const newerCloud = lesson(local.id, "Nuvem mais nova que a semente.", 300);
  let seedWrites = 0;
  let cloudReads = 0;
  const duringOutage = await assembleHomologatedLesson({
    readVault: async () => failedDay1,
    readLegacy: () => seed,
    readCloud: async () => {
      cloudReads += 1;
      return newerCloud;
    },
    writeLocal: () => {
      seedWrites += 1;
    },
  });
  assert(seedWrites === 0, "D erro do IndexedDB com semente e nuvem mais nova não grava");
  assert(duringOutage.persisted === false && seedWrites === 0, "E conteúdo remoto não persiste sobre ID desconhecido");
  assert(maySyncDisplayedLesson(duringOutage) === false, "E refresh não compara a semente com a nuvem");
  assert(duringOutage.lesson?.content === seed.content, "a semente só pode ser exibida");
  assert(store.get(local.id)?.content === day1Before, "G a falha não altera o registro do dia 1");
  assert(store.get(other.id)?.content === day80Before, "G a falha não altera o registro do dia 80");
  assert(calls.put.length === 0 && calls.delete.length === 0, "G nenhuma escrita ou exclusão ocorreu");
  calls.failKeys.delete(local.id);
  const recovered = await vault.readVaultLesson(local.id);
  assert(recovered.status === "found" && recovered.source === "indexeddb", "F a leitura seguinte encontra a aula real");
  assert(recovered.status === "found" && recovered.lesson.content === day1Before, "F o Markdown recuperado é o do cofre");
  const compared = await assembleHomologatedLesson({
    readVault: async () => recovered,
    readLegacy: () => seed,
    readCloud: async () => newerCloud,
    writeLocal: () => {
      seedWrites += 1;
    },
  });
  assert(maySyncDisplayedLesson(compared) === true, "F só a aula encontrada pode ser comparada");
  const between = lesson(local.id, "Nuvem entre a semente e a aula real.", 5);
  assert(cloudMayReplaceLocal(seed, between) === true, "controle: o carimbo 5 venceria a semente");
  assert(
    recovered.status === "found" && cloudMayReplaceLocal(recovered.lesson, between) === false,
    "F a comparação usa a aula real e recusa a nuvem que só venceria a semente"
  );
  assert(seedWrites === 0 && cloudReads === 0, "D/E a exibição da semente não consulta nem grava a nuvem");

  const vaultSource = readFileSync("src/services/lessonVault.ts", "utf8");
  const loadSource = readFileSync("src/lib/lessonLoad.ts", "utf8");
  const server = readFileSync("src/services/curatedLessonService.ts", "utf8");
  assert(vaultSource.includes("const DB_VERSION = 2"), "a versão do IndexedDB permanece 2");
  assert(!vaultSource.includes("deleteDatabase") && !loadSource.includes("deleteDatabase") && !server.includes("deleteDatabase"), "não há deleteDatabase");
  assert(!vaultSource.includes(".clear(") && !loadSource.includes(".clear(") && !server.includes(".clear("), "não há clear de object store");
  const precedence = loadSource.slice(
    loadSource.indexOf("export function cloudMayReplaceLocal"),
    loadSource.indexOf("export function lessonCacheDebugEnabled")
  );
  assert(!precedence.includes("|| 0") && !precedence.includes("||0"), "a precedência do carimbo não usa fallback zero");

  const storageItems = new Map<string, string>();
  const legacyStorage = {
    get length() {
      return storageItems.size;
    },
    key(index: number) {
      return Array.from(storageItems.keys())[index] ?? null;
    },
    getItem(key: string) {
      return storageItems.has(key) ? storageItems.get(key)! : null;
    },
    setItem(key: string, value: string) {
      storageItems.set(key, value);
    },
    removeItem(key: string) {
      storageItems.delete(key);
    },
    clear() {
      storageItems.clear();
    },
  };
  (globalThis as unknown as { localStorage: typeof legacyStorage }).localStorage = legacyStorage;
  const legacyOf = (id: string, content: string, approvedAt?: number) => {
    const row = lesson(id, content, approvedAt ?? 1);
    if (approvedAt === undefined) delete (row as { approvedAt?: number }).approvedAt;
    legacyStorage.setItem(`athena_homologated_${id}`, JSON.stringify(row));
    return row;
  };

  const early = lesson("day_70_part_0", "legado antes da leitura", 999);
  assert(vault.vaultLessonsHydrated() === false, "antes do getAll o cofre não está hidratado");
  assert(vault.rememberLegacyLessonIfSafe(early) === false, "legado não entra na memória antes da leitura do IndexedDB");
  assert(vault.getRememberedLesson(early.id)?.content !== early.content, "a memória não aceita legado com o cofre desconhecido");

  const idA = "day_70_part_0";
  const idB = "day_71_part_0";
  const idC = "day_72_part_0";
  const idD = "day_73_part_0";
  const idE = "day_74_part_0";
  const idF = "day_75_part_0";
  store.set(idA, lesson(idA, "IDB mais novo A", 200));
  legacyOf(idA, "legado mais antigo A", 100);
  store.set(idB, lesson(idB, "IDB mais antigo B", 100));
  legacyOf(idB, "legado mais novo B", 200);
  store.set(idC, lesson(idC, "IDB com carimbo C", 150));
  legacyOf(idC, "legado sem carimbo C");
  store.set(idD, lesson(idD, "IDB sem carimbo D", 1));
  delete (store.get(idD) as { approvedAt?: number }).approvedAt;
  legacyOf(idD, "legado com carimbo D", 500);
  store.set(idE, lesson(idE, "IDB sem carimbo E", 1));
  delete (store.get(idE) as { approvedAt?: number }).approvedAt;
  legacyOf(idE, "legado sem carimbo E");
  store.set(idF, lesson(idF, "IDB empate F", 400));
  legacyOf(idF, "legado empate F", 400);

  const putsBefore = calls.put.length;
  await vault.loadVaultIntoMemory();
  const migratedPuts = calls.put.slice(putsBefore);
  assert(store.get(idA)?.content === "IDB mais novo A", "A IndexedDB mais novo prevalece sobre o legado antigo");
  assert(vault.getRememberedLesson(idA)?.content === "IDB mais novo A", "A a memória permanece com o IndexedDB");
  assert(!migratedPuts.includes(idA), "A legado antigo não executa put");
  assert(legacyStorage.getItem(`athena_homologated_${idA}`)?.includes("legado mais antigo A") === true, "A a chave legada permanece");
  assert(store.get(idB)?.content === "legado mais novo B", "B legado mais novo substitui porque o carimbo prova");
  assert(migratedPuts.includes(idB), "B o put ocorre só com prova de carimbo maior");
  assert(legacyStorage.getItem(`athena_homologated_${idB}`)?.includes("legado mais novo B") === true, "B a chave legada permanece");
  assert(store.get(idC)?.content === "IDB com carimbo C", "C legado sem approvedAt não substitui");
  assert(!migratedPuts.includes(idC), "C não há put sem carimbo no legado");
  assert(store.get(idD)?.content === "IDB sem carimbo D", "D IndexedDB sem approvedAt não é substituído");
  assert(!migratedPuts.includes(idD), "D carimbo só no legado não autoriza put");
  assert(store.get(idE)?.content === "IDB sem carimbo E", "E ambos sem approvedAt preservam o IndexedDB");
  assert(!migratedPuts.includes(idE), "E ausência dos dois carimbos não autoriza put");
  assert(store.get(idF)?.content === "IDB empate F", "F timestamps iguais preservam o IndexedDB");
  assert(!migratedPuts.includes(idF), "F empate não autoriza put");
  assert(store.get(local.id)?.content === day1Before, "a migração não altera o dia 1");
  assert(store.get(other.id)?.content === day80Before, "a migração não altera o dia 80");

  const putsSecond = calls.put.length;
  await vault.loadVaultIntoMemory();
  const secondPuts = calls.put.slice(putsSecond);
  assert(store.get(idA)?.content === "IDB mais novo A", "H segundo boot não troca o IndexedDB mais novo");
  assert(store.get(idB)?.content === "legado mais novo B", "H segundo boot não regride a substituição já provada");
  assert(!secondPuts.includes(idA) && !secondPuts.includes(idB), "H o segundo boot não regrava essas aulas");
  assert(legacyStorage.getItem(`athena_homologated_${idA}`) !== null, "H a chave antiga continua no primeiro id");
  assert(legacyStorage.getItem(`athena_homologated_${idB}`) !== null, "H a chave antiga continua no segundo id");

  const idG = "day_76_part_0";
  store.set(idG, lesson(idG, "IDB protegido G", 100));
  legacyOf(idG, "legado durante a falha G", 900);
  calls.failGetAll = true;
  const putsFailed = calls.put.length;
  const failedHydration = await vault.loadVaultIntoMemory();
  calls.failGetAll = false;
  assert(failedHydration.lessons === 0, "G falha de leitura não conclui a hidratação");
  assert(vault.vaultLessonsHydrated() === false, "G falha de leitura não marca o cofre como lido");
  assert(store.get(idG)?.content === "IDB protegido G", "G falha de leitura não grava o legado");
  assert(!calls.put.slice(putsFailed).includes(idG), "G não há put durante a falha");
  assert(vault.getRememberedLesson(idG)?.content !== "legado durante a falha G", "G o legado não entra na memória");
  assert(legacyStorage.getItem(`athena_homologated_${idG}`)?.includes("legado durante a falha G") === true, "G a chave legada permanece");
  assert(vault.rememberLegacyLessonIfSafe(lesson(idA, "invasao depois da falha", 9999)) === false, "G depois da falha o legado continua bloqueado");
  assert(vault.getRememberedLesson(idA)?.content === "IDB mais novo A", "G a aula já carregada não é trocada depois da falha");

  const start = server.indexOf("export async function getHomologatedLesson");
  const end = server.indexOf("function normalizeLesson");
  const body = server.slice(start, end);
  assert(!body.includes("hydrateLessonVault"), "getHomologatedLesson não espera a hidratação global");
  assert(body.includes("readVaultLesson"), "getHomologatedLesson lê o IndexedDB por id");
  assert(body.includes("maySyncDisplayedLesson"), "I o refresh só roda quando a aula do cofre foi lida");
  assert(!body.includes("rememberLesson"), "a semente não é memorizada como se o cofre tivesse sido lido");
  const migration = vaultSource.slice(
    vaultSource.indexOf("function persistLegacyLessonIfSafe"),
    vaultSource.indexOf("export async function loadVaultIntoMemory")
  );
  assert(migration.includes("cloudMayReplaceLocal"), "a migração só grava legado com prova de carimbo");
  assert(!migration.includes("removeItem"), "a migração não apaga as chaves antigas");
  const hydrateHook = server.slice(0, server.indexOf("export function getLessonDocId"));
  assert(hydrateHook.includes("rememberLegacyLessonIfSafe"), "a hidratação global não memoriza legado sem a prova");
  assert(!hydrateHook.includes("rememberLesson("), "a hidratação global não chama rememberLesson direto");
  const localRead = server.slice(
    server.indexOf("export function getLocalHomologatedLesson"),
    server.indexOf("export function setLocalHomologatedLesson")
  );
  assert(localRead.includes("rememberLegacyLessonIfSafe"), "a leitura síncrona do legado usa a mesma prova");
  assert(!localRead.includes("rememberLesson("), "a leitura síncrona não memoriza legado sem a prova");
  const fetchAll = server.slice(server.indexOf("export async function fetchAllHomologatedLessons"));
  assert(fetchAll.includes("persistCatalogLesson"), "fetchAll grava o catálogo pelo mesmo critério do cofre");
  assert(!fetchAll.includes("setLocalHomologatedLesson"), "fetchAll não grava a nuvem sem passar pela comparação");

  const seedVault = (id: string, content: string, approvedAt?: number) => {
    const row = lesson(id, content, approvedAt ?? 1);
    if (approvedAt === undefined) delete (row as { approvedAt?: number }).approvedAt;
    store.set(id, row);
    vault.rememberLesson(row);
    return row;
  };
  const cloudCopy = (id: string, content: string, approvedAt?: number) => {
    const row = lesson(id, content, approvedAt ?? 1);
    if (approvedAt === undefined) delete (row as { approvedAt?: number }).approvedAt;
    return row;
  };

  const newerLocal = "day_81_part_0";
  seedVault(newerLocal, "fetchAll local mais novo", 300);
  legacyStorage.setItem(`athena_homologated_${newerLocal}`, JSON.stringify(lesson(newerLocal, "chave antiga", 1)));
  const putsCatalog = calls.put.length;
  assert(
    (await vault.persistCatalogLesson(cloudCopy(newerLocal, "fetchAll remoto mais antigo", 100))) === false,
    "fetchAll local mais novo não aceita o remoto"
  );
  assert(store.get(newerLocal)?.content === "fetchAll local mais novo", "fetchAll preserva o local mais novo");
  assert(!calls.put.slice(putsCatalog).includes(newerLocal), "fetchAll local mais novo não faz put");
  assert(legacyStorage.getItem(`athena_homologated_${newerLocal}`) !== null, "fetchAll não apaga a chave antiga");

  const olderLocal = "day_82_part_0";
  seedVault(olderLocal, "fetchAll local mais antigo", 100);
  assert(
    (await vault.persistCatalogLesson(cloudCopy(olderLocal, "fetchAll remoto mais novo", 200))) === true,
    "fetchAll remoto mais novo substitui com carimbo maior"
  );
  assert(store.get(olderLocal)?.content === "fetchAll remoto mais novo", "fetchAll grava o remoto mais novo");

  const tied = "day_83_part_0";
  seedVault(tied, "fetchAll empate local", 150);
  assert(
    (await vault.persistCatalogLesson(cloudCopy(tied, "fetchAll empate remoto", 150))) === false,
    "fetchAll timestamps iguais preservam o local"
  );
  assert(store.get(tied)?.content === "fetchAll empate local", "fetchAll empate não troca o conteúdo");

  const localBare = "day_84_part_0";
  seedVault(localBare, "fetchAll local sem carimbo");
  assert(
    (await vault.persistCatalogLesson(cloudCopy(localBare, "fetchAll remoto contra local sem carimbo", 500))) === false,
    "fetchAll local sem timestamp preserva o local"
  );
  assert(store.get(localBare)?.content === "fetchAll local sem carimbo", "fetchAll local sem carimbo permanece");

  const remoteBare = "day_85_part_0";
  seedVault(remoteBare, "fetchAll remoto sem carimbo local", 500);
  assert(
    (await vault.persistCatalogLesson(cloudCopy(remoteBare, "fetchAll remoto sem carimbo"))) === false,
    "fetchAll remoto sem timestamp preserva o local"
  );
  assert(store.get(remoteBare)?.content === "fetchAll remoto sem carimbo local", "fetchAll remoto sem carimbo não grava");

  const zeroStamp = "day_86_part_0";
  seedVault(zeroStamp, "fetchAll carimbo zero", 0);
  assert(
    (await vault.persistCatalogLesson(cloudCopy(zeroStamp, "fetchAll remoto contra zero", 50))) === false,
    "fetchAll timestamp 0 no local preserva a aula"
  );
  const remoteZero = "day_86_part_1";
  seedVault(remoteZero, "fetchAll local contra remoto zero", 40);
  assert(
    (await vault.persistCatalogLesson(cloudCopy(remoteZero, "fetchAll remoto zero", 0))) === false,
    "fetchAll timestamp 0 no remoto preserva a aula"
  );
  assert(store.get(zeroStamp)?.content === "fetchAll carimbo zero", "fetchAll carimbo zero local permanece no cofre");
  assert(store.get(remoteZero)?.content === "fetchAll local contra remoto zero", "fetchAll carimbo zero remoto não grava");

  const missingId = "day_87_part_0";
  assert(store.has(missingId) === false, "o id de adoção ainda não existe");
  assert(
    (await vault.persistCatalogLesson(cloudCopy(missingId, "fetchAll id ausente", 20))) === true,
    "fetchAll adota id comprovadamente inexistente"
  );
  assert(store.get(missingId)?.content === "fetchAll id ausente", "fetchAll grava só o id que não existia");

  const catalogOutage = "day_88_part_0";
  store.set(catalogOutage, lesson(catalogOutage, "fetchAll protegido na falha", 100));
  vault.forgetLesson(catalogOutage);
  calls.failKeys.add(catalogOutage);
  const putsOutage = calls.put.length;
  assert(
    (await vault.persistCatalogLesson(cloudCopy(catalogOutage, "fetchAll durante falha", 900))) === false,
    "fetchAll falha de IndexedDB não persiste o remoto"
  );
  assert(vault.lessonLoadState(catalogOutage) === "not_loaded", "fetchAll falha de IndexedDB não vira not_found");
  assert(store.get(catalogOutage)?.content === "fetchAll protegido na falha", "fetchAll falha de IndexedDB preserva o conteúdo");
  assert(!calls.put.slice(putsOutage).includes(catalogOutage), "fetchAll falha de IndexedDB não faz put");
  calls.failKeys.delete(catalogOutage);
  assert(store.get(local.id)?.content === day1Before, "fetchAll não altera o dia 1");
  assert(store.get(other.id)?.content === day80Before, "fetchAll não altera o dia 80");

  if (failed > 0) {
    console.error(`Cache de aulas: ${failed} verificação(ões) falharam.`);
    process.exit(1);
  }
  console.log("Cache de aulas: verificações locais passaram.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
