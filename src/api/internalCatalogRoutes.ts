import express from "express";
import crypto from "crypto";

export interface InternalCatalogItem {
  id: string;
  day: number;
  part: number;
  subject: string;
  status: string;
  approvedAt?: string;
  reviewSummary?: string;
}

export interface InternalCatalogQuery {
  day?: number;
  subject?: string;
  limit?: number;
  offset?: number;
}

export interface InternalCatalogListResult {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  aulas: InternalCatalogItem[];
}

export interface InternalLessonQuery {
  lessonId: string;
  offset?: number;
  chunkSize?: number;
}

export interface InternalLessonDetail {
  id: string;
  day: number;
  part: number;
  partNumber: number;
  subject: string;
  version?: number;
  status: string;
  approvedAt?: string;
  content: string;
  totalLength: number;
  offset: number;
  chunkSize: number;
  hasMore: boolean;
  isComplete: boolean;
  nextOffset?: number;
}

export interface InternalCatalogService {
  listHomologatedParts(
    query: InternalCatalogQuery
  ): Promise<InternalCatalogListResult | InternalCatalogItem[]>;
  getHomologatedLesson?(query: InternalLessonQuery): Promise<InternalLessonDetail>;
}

const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb";
const PARTS_COLLECTION = "homologated_parts";
const LESSONS_COLLECTION = "homologated_lessons";

/**
 * Provedor Firestore oficial da API interna utilizando Firebase Admin SDK.
 * Consulta estritamente as coleções /homologated_parts e /homologated_lessons.
 * Zero acesso a users, auth_secrets, student_answers, essay_submissions ou legal_reviews.
 */
export class FirestoreInternalCatalogService implements InternalCatalogService {
  private firestoreInstance: any = null;

  private async getDb() {
    if (!this.firestoreInstance) {
      const appMod = await import("firebase-admin/app");
      const dbMod = await import("firebase-admin/firestore");
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp();
      const firestore = dbMod.getFirestore(app, DATABASE_ID);
      try {
        firestore.settings({ ignoreUndefinedProperties: true });
      } catch {
        // Ignora se já inicializado
      }
      this.firestoreInstance = firestore;
    }
    return this.firestoreInstance;
  }

  async listHomologatedParts(query: InternalCatalogQuery): Promise<InternalCatalogListResult> {
    const db = await this.getDb();
    const partsRef = db.collection(PARTS_COLLECTION);

    // Se query.day estiver definido, realiza query nativa filtrada no Firestore
    let queryRef: any = partsRef;
    if (typeof query.day === "number") {
      queryRef = queryRef.where("day", "==", query.day);
    }

    // Busca os documentos sem corte cego de 100 documentos que causava omissão de partes
    const snapshot = await queryRef.get();

    const filtered: InternalCatalogItem[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const id = typeof data.id === "string" ? data.id : doc.id;
      const day = Number(data.day) || 0;
      const part = Number(data.part) || 0;
      const subject = typeof data.subject === "string" ? data.subject : "Trilha Jurídica";
      const status = typeof data.status === "string" ? data.status : "";

      // Requisito: Somente aulas efetivamente aprovadas são retornadas.
      // Rejeição estrita de qualquer status diferente de 'approved'.
      if (status !== "approved") {
        continue;
      }

      // Filtro por day redundante de segurança
      if (typeof query.day === "number" && day !== query.day) {
        continue;
      }

      // Filtro por subject (case-insensitive substring) se especificado
      if (query.subject && !subject.toLowerCase().includes(query.subject.toLowerCase())) {
        continue;
      }

      // Formatação segura de timestamp de aprovação
      let approvedAtStr: string | undefined = undefined;
      if (typeof data.approvedAt === "number" && data.approvedAt > 0) {
        try {
          approvedAtStr = new Date(data.approvedAt).toISOString();
        } catch {
          approvedAtStr = undefined;
        }
      }

      // Formatação estritamente resumida de revisão sem vazar dados ou textos extensos
      let reviewSummary: string | undefined = undefined;
      if (typeof data.review === "string" && data.review.trim()) {
        const clean = data.review.replace(/\s+/g, " ").trim();
        reviewSummary = clean.length > 250 ? `${clean.slice(0, 247)}...` : clean;
      }

      filtered.push({
        id,
        day,
        part,
        subject,
        status,
        approvedAt: approvedAtStr,
        reviewSummary,
      });
    }

    // Ordenação determinística OBRIGATÓRIA antes de qualquer slice ou paginação
    filtered.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.part - b.part;
    });

    const offset = Math.max(0, query.offset || 0);
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const sliced = filtered.slice(offset, offset + limit);

    return {
      total: filtered.length,
      offset,
      limit,
      hasMore: offset + sliced.length < filtered.length,
      aulas: sliced,
    };
  }

  async getHomologatedLesson(query: InternalLessonQuery): Promise<InternalLessonDetail> {
    const db = await this.getDb();
    const lessonRef = db.collection(LESSONS_COLLECTION).doc(query.lessonId);
    const snap = await lessonRef.get();

    if (!snap.exists) {
      const err = new Error(`Aula homologada '${query.lessonId}' não encontrada no catálogo oficial.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const data = snap.data() || {};
    const status = typeof data.status === "string" ? data.status : "";

    // Exigência estrita: status === 'approved'
    if (status !== "approved") {
      const err = new Error(`A aula solicitada '${query.lessonId}' não possui status homologado/aprovado.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Validação de correspondência entre ID, dia e parte
    const match = /^day_(\d{1,3})_part_(\d{1,2})$/.exec(query.lessonId);
    if (!match) {
      const err = new Error(`Identificador canônico de aula inválido: '${query.lessonId}'.`);
      (err as any).statusCode = 400;
      throw err;
    }

    const expectedDay = parseInt(match[1], 10);
    const expectedPart = parseInt(match[2], 10);
    const docDay = Number(data.day);
    const docPart = Number(data.part);

    if (docDay !== expectedDay || docPart !== expectedPart) {
      const err = new Error(
        `Inconsistência de integridade: os metadados da aula (Dia ${docDay}, Parte ${docPart}) não correspondem ao identificador '${query.lessonId}'.`
      );
      (err as any).statusCode = 422;
      throw err;
    }

    // Exigência estrita: conteúdo textual válido e não vazio
    const content = typeof data.content === "string" ? data.content : "";
    if (!content.trim()) {
      const err = new Error(`A aula homologada '${query.lessonId}' não possui conteúdo textual válido publicado.`);
      (err as any).statusCode = 422;
      throw err;
    }

    let approvedAtStr: string | undefined = undefined;
    if (typeof data.approvedAt === "number" && data.approvedAt > 0) {
      try {
        approvedAtStr = new Date(data.approvedAt).toISOString();
      } catch {
        approvedAtStr = undefined;
      }
    }

    const totalLength = content.length;
    const offset = Math.max(0, query.offset || 0);
    const chunkSize =
      typeof query.chunkSize === "number" && query.chunkSize > 0
        ? Math.min(query.chunkSize, 50000)
        : totalLength;

    const chunkContent = content.slice(offset, offset + chunkSize);
    const hasMore = offset + chunkContent.length < totalLength;
    const isComplete = !hasMore && offset === 0;

    return {
      id: query.lessonId,
      day: docDay,
      part: docPart,
      partNumber: docPart + 1, // Clareza pedagógica (part 0 = Parte 1)
      subject: typeof data.subject === "string" ? data.subject : "Trilha Jurídica",
      version: typeof data.version === "number" ? data.version : 1,
      status: "approved",
      approvedAt: approvedAtStr,
      content: chunkContent,
      totalLength,
      offset,
      chunkSize: chunkContent.length,
      hasMore,
      isComplete,
      nextOffset: hasMore ? offset + chunkContent.length : undefined,
    };
  }
}

/**
 * Middleware de autenticação estrito entre serviços (Service-to-Service).
 * Aceita autenticação por segredo compartilhado (X-Internal-Secret ou Authorization: Bearer <SECRET>)
 * com validação timing-safe (crypto.timingSafeEqual).
 * Bloqueia fail-closed se ATHENA_INTERNAL_SERVICE_SECRET não estiver configurado.
 * Rejeita explicitamente tokens de alunos/Firebase.
 */
export function createInternalAuthMiddleware(configuredSecret?: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const secret = (configuredSecret || process.env.ATHENA_INTERNAL_SERVICE_SECRET || "").trim();

    if (!secret) {
      res.status(503).json({
        error: "Serviço interno indisponível: ATHENA_INTERNAL_SERVICE_SECRET não configurado.",
      });
      return;
    }

    // Verifica header dedicado X-Internal-Secret ou fallback para Authorization: Bearer
    const directHeader = req.headers["x-internal-secret"];
    let tokenProvided = typeof directHeader === "string" ? directHeader.trim() : "";

    if (!tokenProvided) {
      const authHeader = String(req.headers.authorization || "").trim();
      if (authHeader.startsWith("Bearer ")) {
        tokenProvided = authHeader.slice(7).trim();
      }
    }

    if (!tokenProvided) {
      res.status(401).json({
        error: "Autenticação obrigatória entre serviços. Forneça o cabeçalho 'X-Internal-Secret' ou 'Authorization: Bearer <SECRET>'.",
      });
      return;
    }

    // Se o token fornecido for um JWT do Firebase (identificado por múltiplos pontos e tamanho), rejeita sumariamente
    if (tokenProvided.split(".").length === 3 && tokenProvided.length > 200) {
      res.status(403).json({
        error: "Tokens de usuário/aluno do Firebase não são aceitos para acesso à API interna de serviços.",
      });
      return;
    }

    const expectedBuffer = Buffer.from(secret);
    const providedBuffer = Buffer.from(tokenProvided);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      res.status(403).json({
        error: "Acesso negado: Segredo de serviço interno inválido.",
      });
      return;
    }

    next();
  };
}

/**
 * Registra os endpoints internos de catálogo na aplicação Express:
 * - GET /api/internal/mcp-catalog: Listagem de aulas com metadados
 * - GET /api/internal/mcp-catalog/lesson/:lessonId: Consulta de conteúdo integral homologado
 */
export function registerInternalCatalogRoutes(
  app: express.Express,
  options?: {
    service?: InternalCatalogService;
    internalSecret?: string;
  }
): void {
  const service = options?.service || new FirestoreInternalCatalogService();
  const authMiddleware = createInternalAuthMiddleware(options?.internalSecret);

  // 1. Endpoint de listagem de catálogo
  app.get("/api/internal/mcp-catalog", authMiddleware, async (req, res) => {
    try {
      // Validação de parâmetros
      let day: number | undefined = undefined;
      if (req.query.day !== undefined) {
        const parsedDay = Number(req.query.day);
        if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 100) {
          res.status(400).json({ error: "O parâmetro 'day' deve ser um número inteiro entre 1 e 100." });
          return;
        }
        day = parsedDay;
      }

      let subject: string | undefined = undefined;
      if (typeof req.query.subject === "string" && req.query.subject.trim()) {
        const cleanSub = req.query.subject.trim();
        if (cleanSub.length > 150) {
          res.status(400).json({ error: "O parâmetro 'subject' não pode ultrapassar 150 caracteres." });
          return;
        }
        subject = cleanSub;
      }

      let limit = 20;
      if (req.query.limit !== undefined) {
        const parsedLimit = Number(req.query.limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          res.status(400).json({ error: "O parâmetro 'limit' deve ser um número inteiro entre 1 e 50." });
          return;
        }
        limit = parsedLimit;
      }

      let offset = 0;
      if (req.query.offset !== undefined) {
        const parsedOffset = Number(req.query.offset);
        if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
          res.status(400).json({ error: "O parâmetro 'offset' deve ser um número inteiro maior ou igual a 0." });
          return;
        }
        offset = parsedOffset;
      }

      // Consulta de catálogo
      const rawResult = await service.listHomologatedParts({
        day,
        subject,
        limit,
        offset,
      });

      // Suporte retrocompatível a serviços/mocks que retornam array direto
      const listResult: InternalCatalogListResult = Array.isArray(rawResult)
        ? {
            total: rawResult.length,
            offset,
            limit,
            hasMore: rawResult.length === limit,
            aulas: rawResult,
          }
        : rawResult;

      // Resposta com estrita projeção e sem dados de alunos ou metadados de autoria
      res.json({
        total: listResult.total,
        offset: listResult.offset,
        limit: listResult.limit,
        hasMore: listResult.hasMore,
        aulas: listResult.aulas,
      });
    } catch (error: any) {
      console.error("[Internal API Error] Falha ao consultar catálogo:", error);
      res.status(500).json({
        error: "Erro interno ao processar consulta de catálogo.",
      });
    }
  });

  // 2. Endpoint de consulta integral de aula homologada
  app.get("/api/internal/mcp-catalog/lesson/:lessonId", authMiddleware, async (req, res) => {
    try {
      const lessonId = String(req.params.lessonId || "").trim();

      // Validação estrita do identificador canônico
      if (!/^day_\d{1,3}_part_\d{1,2}$/.test(lessonId)) {
        res.status(400).json({
          error: "Identificador de aula inválido. Formato esperado: 'day_X_part_Y' (ex: 'day_1_part_0', 'day_1_part_1').",
        });
        return;
      }

      let offset = 0;
      if (req.query.offset !== undefined) {
        const parsedOffset = Number(req.query.offset);
        if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
          res.status(400).json({ error: "O parâmetro 'offset' deve ser um número inteiro maior ou igual a 0." });
          return;
        }
        offset = parsedOffset;
      }

      let chunkSize: number | undefined = undefined;
      if (req.query.chunkSize !== undefined) {
        const parsedChunk = Number(req.query.chunkSize);
        if (!Number.isInteger(parsedChunk) || parsedChunk < 1000 || parsedChunk > 50000) {
          res.status(400).json({ error: "O parâmetro 'chunkSize' deve ser um número inteiro entre 1.000 e 50.000." });
          return;
        }
        chunkSize = parsedChunk;
      }

      if (typeof service.getHomologatedLesson !== "function") {
        res.status(501).json({ error: "Operação de consulta de aula não implementada no serviço configurado." });
        return;
      }

      const lessonDetail = await service.getHomologatedLesson({
        lessonId,
        offset,
        chunkSize,
      });

      res.json(lessonDetail);
    } catch (error: any) {
      const status = typeof error?.statusCode === "number" ? error.statusCode : 500;
      if (status >= 400 && status < 500) {
        res.status(status).json({ error: error.message });
        return;
      }
      console.error("[Internal API Error] Falha ao consultar aula homologada:", error);
      res.status(500).json({
        error: "Erro interno ao processar consulta de aula homologada.",
      });
    }
  });
}
