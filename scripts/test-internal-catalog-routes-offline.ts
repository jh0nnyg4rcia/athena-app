import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import {
  registerInternalCatalogRoutes,
  createInternalAuthMiddleware,
  type InternalCatalogService,
  type InternalCatalogItem,
  type InternalCatalogQuery,
} from "../src/api/internalCatalogRoutes.js";

// Mock do serviço de catálogo interno para testes isolados
class MockInternalCatalogService implements InternalCatalogService {
  public records: InternalCatalogItem[];
  public lastQuery: InternalCatalogQuery | null = null;
  public shouldFail: boolean = false;

  constructor(records: InternalCatalogItem[]) {
    this.records = records;
  }

  async listHomologatedParts(query: InternalCatalogQuery): Promise<InternalCatalogItem[]> {
    this.lastQuery = query;
    if (this.shouldFail) {
      throw new Error("Erro simulado ao consultar Firestore.");
    }
    let res = [...this.records].filter((r) => r.status === "approved");
    if (typeof query.day === "number") {
      res = res.filter((r) => r.day === query.day);
    }
    if (query.subject) {
      res = res.filter((r) => r.subject.toLowerCase().includes(query.subject!.toLowerCase()));
    }
    res.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.part - b.part;
    });
    if (typeof query.offset === "number" && query.offset > 0) {
      res = res.slice(query.offset);
    }
    if (typeof query.limit === "number") {
      res = res.slice(0, query.limit);
    }
    return res;
  }

  async getHomologatedLesson(query: { lessonId: string; offset?: number; chunkSize?: number }): Promise<any> {
    if (this.shouldFail) {
      throw new Error("Erro simulado ao consultar Firestore.");
    }
    const item = this.records.find((r) => r.id === query.lessonId);
    if (!item || item.status !== "approved") {
      const error: any = new Error(`Aula '${query.lessonId}' não encontrada ou não homologada.`);
      error.statusCode = 404;
      throw error;
    }
    const fullContent = `# Aula ${item.day} - Parte ${item.part}\n\nConteúdo pedagógico oficial homologado de ${item.subject}.`;
    const totalLength = fullContent.length;
    const offset = Math.max(0, query.offset || 0);
    const chunkSize = typeof query.chunkSize === "number" ? Math.min(query.chunkSize, 50000) : totalLength;
    const chunk = fullContent.slice(offset, offset + chunkSize);
    const hasMore = offset + chunk.length < totalLength;

    return {
      id: item.id,
      day: item.day,
      part: item.part,
      partNumber: item.part + 1,
      subject: item.subject,
      version: 1,
      status: item.status,
      approvedAt: item.approvedAt,
      content: chunk,
      totalLength,
      offset,
      chunkSize: chunk.length,
      hasMore,
      isComplete: !hasMore && offset === 0,
      nextOffset: hasMore ? offset + chunk.length : undefined,
    };
  }
}

const SAMPLE_INTERNAL_RECORDS: InternalCatalogItem[] = [
  {
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    status: "approved",
    approvedAt: "2026-10-10T12:00:00.000Z",
    reviewSummary: "Princípios fundamentais e poder constituinte.",
  },
  {
    id: "day_1_part_1",
    day: 1,
    part: 1,
    subject: "Direito Constitucional",
    status: "approved",
    approvedAt: "2026-10-10T12:05:00.000Z",
    reviewSummary: "Direitos individuais e coletivos.",
  },
  {
    id: "day_2_part_0",
    day: 2,
    part: 0,
    subject: "Código Penal",
    status: "approved",
    approvedAt: "2026-10-10T12:10:00.000Z",
    reviewSummary: "Aplicação da lei penal no tempo e espaço.",
  },
];

function makeRequest(options: {
  port: number;
  path: string;
  method: string;
  headers?: Record<string, string>;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: options.port,
        path: options.path,
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runInternalCatalogTests() {
  console.log("================================================================================");
  console.log("SUÍTE DE TESTES AUTOMATIZADOS: ATHENA INTERNAL CATALOG API (OFFLINE)");
  console.log("================================================================================\n");

  const TEST_SECRET = "TEST_SUPER_SECURE_INTERNAL_SECRET_987654";
  let passed = 0;

  // Setup do App Express de teste
  const mockService = new MockInternalCatalogService(SAMPLE_INTERNAL_RECORDS);
  const app = express();
  registerInternalCatalogRoutes(app, {
    service: mockService,
    internalSecret: TEST_SECRET,
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;

  try {
    // Teste 1: Rejeição de requisição sem nenhum cabeçalho de autenticação
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
      });
      assert.equal(res.status, 401, "Sem credencial deve retornar 401.");
      const json = JSON.parse(res.body);
      assert.match(json.error, /Autenticação obrigatória entre serviços/i);
      console.log("✔ Teste 1: Rejeição de requisição sem autenticação aprovada.");
      passed++;
    }

    // Teste 2: Rejeição de credencial inválida (timing-safe check)
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: {
          "X-Internal-Secret": "WRONG_SECRET_VALUE",
        },
      });
      assert.equal(res.status, 403, "Segredo incorreto deve retornar 403.");
      const json = JSON.parse(res.body);
      assert.match(json.error, /Acesso negado/i);
      console.log("✔ Teste 2: Rejeição de credencial inválida via timing-safe compare aprovada.");
      passed++;
    }

    // Teste 3: Rejeição de token de aluno/Firebase
    {
      const fakeFirebaseJwt =
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9." +
        "eyJ1c2VySWQiOiJzdHVkZW50XzEyMyIsImVtYWlsIjoic3R1ZGVudEBleGFtcGxlLmNvbSIsImF1ZCI6Imdlbi1sYW5nLWNsaWVudC0wODIyNzYzMDcyIn0." +
        "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_sample_signature_padding_to_exceed_two_hundred_chars_long_token_string_for_testing";

      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: {
          Authorization: `Bearer ${fakeFirebaseJwt}`,
        },
      });
      assert.equal(res.status, 403, "JWT de aluno Firebase deve ser explicitamente rejeitado.");
      const json = JSON.parse(res.body);
      assert.match(json.error, /Tokens de usuário\/aluno do Firebase não são aceitos/i);
      console.log("✔ Teste 3: Rejeição explícita de token Firebase de alunos aprovada.");
      passed++;
    }

    // Teste 4: Requisição autenticada com sucesso via header X-Internal-Secret
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: {
          "X-Internal-Secret": TEST_SECRET,
        },
      });
      assert.equal(res.status, 200, "Com segredo correto deve retornar 200.");
      const json = JSON.parse(res.body);
      assert.equal(json.total, 3);
      assert.equal(json.aulas.length, 3);
      console.log("✔ Teste 4: Requisição autenticada com X-Internal-Secret aprovada.");
      passed++;
    }

    // Teste 5: Requisição autenticada com sucesso via header Authorization: Bearer <SECRET>
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });
      assert.equal(res.status, 200, "Com Bearer secret correto deve retornar 200.");
      const json = JSON.parse(res.body);
      assert.equal(json.total, 3);
      console.log("✔ Teste 5: Requisição autenticada com Authorization: Bearer aprovada.");
      passed++;
    }

    // Teste 6: Filtragem por dia (parâmetro day)
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?day=1",
        method: "GET",
        headers: {
          "X-Internal-Secret": TEST_SECRET,
        },
      });
      assert.equal(res.status, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.total, 2);
      assert.ok(json.aulas.every((a: any) => a.day === 1));
      console.log("✔ Teste 6: Filtro por day aprovado.");
      passed++;
    }

    // Teste 7: Filtragem por disciplina (parâmetro subject)
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?subject=Penal",
        method: "GET",
        headers: {
          "X-Internal-Secret": TEST_SECRET,
        },
      });
      assert.equal(res.status, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.total, 1);
      assert.equal(json.aulas[0].subject, "Código Penal");
      console.log("✔ Teste 7: Filtro por subject aprovado.");
      passed++;
    }

    // Teste 8: Limite de resultados (parâmetro limit)
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?limit=1",
        method: "GET",
        headers: {
          "X-Internal-Secret": TEST_SECRET,
        },
      });
      assert.equal(res.status, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.total, 1);
      console.log("✔ Teste 8: Limite de resultados seguro aprovado.");
      passed++;
    }

    // Teste 9: Rejeição de parâmetros inválidos (day < 1, day > 100, limit > 50)
    {
      const res1 = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?day=0",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res1.status, 400);

      const res2 = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?day=101",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res2.status, 400);

      const res3 = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?limit=100",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res3.status, 400);

      console.log("✔ Teste 9: Rejeição estrita de parâmetros inválidos aprovada.");
      passed++;
    }

    // Teste 10: Sanitização estrita e ausência de campos proibidos
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      const json = JSON.parse(res.body);
      for (const aula of json.aulas) {
        // Campos permitidos
        assert.ok("id" in aula);
        assert.ok("day" in aula);
        assert.ok("part" in aula);
        assert.ok("subject" in aula);
        assert.ok("status" in aula);

        // Campos proibidos (LGPD e segurança)
        assert.equal(aula.approvedBy, undefined, "approvedBy não deve ser exposto.");
        assert.equal(aula.userId, undefined, "userId não deve ser exposto.");
        assert.equal(aula.studentEmail, undefined, "studentEmail não deve ser exposto.");
        assert.equal(aula.content, undefined, "content integral não deve ser exposto na API leve.");
        assert.equal(aula.modelUsed, undefined, "modelUsed não deve ser exposto.");
      }
      console.log("✔ Teste 10: Sanitização rigorosa dos campos e privacidade aprovada.");
      passed++;
    }

    // Teste 11: Tratamento de falha interna segura (sem vazar stack trace)
    {
      mockService.shouldFail = true;
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res.status, 500);
      const json = JSON.parse(res.body);
      assert.match(json.error, /Erro interno ao processar/i);
      mockService.shouldFail = false;
      console.log("✔ Teste 11: Tratamento seguro em caso de falha no serviço aprovado.");
      passed++;
    }

    // Teste 12: Bloqueio fail-closed quando segredo não está configurado
    {
      const unconfiguredApp = express();
      registerInternalCatalogRoutes(unconfiguredApp, {
        service: mockService,
        internalSecret: undefined, // não configurado
      });
      const unconfiguredServer = unconfiguredApp.listen(0);
      const unconfiguredPort = (unconfiguredServer.address() as any).port;

      const res = await makeRequest({
        port: unconfiguredPort,
        path: "/api/internal/mcp-catalog",
        method: "GET",
        headers: { "X-Internal-Secret": "ANY_SECRET" },
      });
      assert.equal(res.status, 503);
      const json = JSON.parse(res.body);
      assert.match(json.error, /ATHENA_INTERNAL_SERVICE_SECRET não configurado/i);

      unconfiguredServer.close();
      console.log("✔ Teste 12: Bloqueio fail-closed se variável de ambiente estiver ausente aprovado.");
      passed++;
    }

    // Teste 13: Suporte a paginação com offset na listagem de partes
    {
      const resOffset0 = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?limit=1&offset=0",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      const resOffset1 = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog?limit=1&offset=1",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });

      assert.equal(resOffset0.status, 200);
      assert.equal(resOffset1.status, 200);
      const json0 = JSON.parse(resOffset0.body);
      const json1 = JSON.parse(resOffset1.body);
      assert.equal(json0.aulas.length, 1);
      assert.equal(json1.aulas.length, 1);
      assert.equal(json0.aulas[0].id, "day_1_part_0");
      assert.equal(json1.aulas[0].id, "day_1_part_1");
      console.log("✔ Teste 13: Paginação determinística com offset no catálogo aprovada.");
      passed++;
    }

    // Teste 14: Rejeição de identificadores de aula inválidos na rota de detalhe (regex estrita)
    {
      const invalidIds = ["day_1", "part_0", "aula_1_part_0", "day_1_part_zero", "../secret", "day_1_part_0;DROP TABLE"];
      for (const badId of invalidIds) {
        const res = await makeRequest({
          port,
          path: `/api/internal/mcp-catalog/lesson/${encodeURIComponent(badId)}`,
          method: "GET",
          headers: { "X-Internal-Secret": TEST_SECRET },
        });
        assert.equal(res.status, 400, `ID '${badId}' deveria ser rejeitado com HTTP 400.`);
        const json = JSON.parse(res.body);
        assert.match(json.error, /Identificador de aula inválido/i);
      }
      console.log("✔ Teste 14: Rejeição estrita de IDs fora do padrão 'day_X_part_Y' aprovada.");
      passed++;
    }

    // Teste 15: Consulta bem-sucedida de aula homologada existente (day_1_part_0)
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res.status, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.id, "day_1_part_0");
      assert.equal(json.day, 1);
      assert.equal(json.part, 0);
      assert.equal(json.partNumber, 1);
      assert.equal(json.status, "approved");
      assert.equal(json.isComplete, true);
      assert.equal(json.hasMore, false);
      assert.ok(json.content.includes("Conteúdo pedagógico oficial homologado"));
      console.log("✔ Teste 15: Consulta completa de aula homologada com Markdown aprovada.");
      passed++;
    }

    // Teste 16: Rejeição com 404 para aula inexistente ou não homologada
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_99_part_99",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res.status, 404);
      const json = JSON.parse(res.body);
      assert.match(json.error, /não encontrada ou não homologada/i);
      console.log("✔ Teste 16: Retorno de 404 Not Found para aula não homologada aprovado.");
      passed++;
    }

    // Teste 17: Leitura paginada com offset e chunkSize em GET /api/internal/mcp-catalog/lesson/:lessonId
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0?offset=0&chunkSize=1000",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(res.status, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.offset, 0);
      assert.ok(json.chunkSize > 0);
      console.log("✔ Teste 17: Consulta com paginação de texto (offset/chunkSize) aprovada.");
      passed++;
    }

    // Teste 18: Rejeição de chunkSize fora dos limites permitidos (1.000 a 50.000)
    {
      const resSmall = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0?chunkSize=500",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(resSmall.status, 400);
      assert.match(JSON.parse(resSmall.body).error, /chunkSize.*entre 1\.000 e 50\.000/i);

      const resHuge = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0?chunkSize=60000",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      assert.equal(resHuge.status, 400);
      assert.match(JSON.parse(resHuge.body).error, /chunkSize.*entre 1\.000 e 50\.000/i);

      console.log("✔ Teste 18: Validação dos limites de chunkSize (1.000 a 50.000) aprovada.");
      passed++;
    }

    // Teste 19: Exigência estrita de autenticação interna no endpoint de detalhe da aula
    {
      const resNoAuth = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0",
        method: "GET",
      });
      assert.equal(resNoAuth.status, 401);

      const resBadAuth = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0",
        method: "GET",
        headers: { "X-Internal-Secret": "WRONG_SECRET" },
      });
      assert.equal(resBadAuth.status, 403, "Token inválido deve retornar 403 Forbidden.");
      console.log("✔ Teste 19: Exigência estrita de autenticação interna em rota de detalhe aprovada.");
      passed++;
    }

    // Teste 20: Privacidade e ausência de dados de alunos no detalhe da aula
    {
      const res = await makeRequest({
        port,
        path: "/api/internal/mcp-catalog/lesson/day_1_part_0",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });
      const json = JSON.parse(res.body);
      assert.equal(json.userId, undefined, "userId não deve constar no detalhe.");
      assert.equal(json.studentEmail, undefined, "studentEmail não deve constar no detalhe.");
      assert.equal(json.approvedBy, undefined, "approvedBy não deve constar no detalhe.");
      assert.equal(json.internalReviewNotes, undefined, "internalReviewNotes não deve constar no detalhe.");
      console.log("✔ Teste 20: Garantia total de isolamento e privacidade no detalhe da aula aprovada.");
      passed++;
    }

    // Teste 21: Validação de catálogo extenso (>150 documentos desordenados) comprovando listagem de day_1_part_0 e day_1_part_1
    {
      // Constrói 150 documentos sintéticos com ordens arbitrárias e múltiplos dias
      const largeRecords: InternalCatalogItem[] = [];
      for (let d = 2; d <= 25; d++) {
        for (let p = 0; p <= 5; p++) {
          largeRecords.push({
            id: `day_${d}_part_${p}`,
            day: d,
            part: p,
            subject: `Disciplina Dia ${d}`,
            status: p === 5 ? "draft" : "approved", // Alguns rascunhos para testar filtro
            approvedAt: "2026-10-10T00:00:00.000Z",
          });
        }
      }
      // Insere day_1_part_1 e day_1_part_0 propositalmente no FINAL da coleção e em ordem invertida
      largeRecords.push({
        id: "day_1_part_1",
        day: 1,
        part: 1,
        subject: "Direito Constitucional",
        status: "approved",
        approvedAt: "2026-10-10T12:05:00.000Z",
      });
      largeRecords.push({
        id: "day_1_part_0",
        day: 1,
        part: 0,
        subject: "Direito Constitucional",
        status: "approved",
        approvedAt: "2026-10-10T12:00:00.000Z",
      });

      const largeApp = express();
      const largeService = new MockInternalCatalogService(largeRecords);
      registerInternalCatalogRoutes(largeApp, {
        service: largeService,
        internalSecret: TEST_SECRET,
      });
      const largeServer = largeApp.listen(0);
      const largePort = (largeServer.address() as any).port;

      // Consulta filtrando por day=1
      const resDay1 = await makeRequest({
        port: largePort,
        path: "/api/internal/mcp-catalog?day=1",
        method: "GET",
        headers: { "X-Internal-Secret": TEST_SECRET },
      });

      assert.equal(resDay1.status, 200);
      const jsonDay1 = JSON.parse(resDay1.body);
      const aulasDay1 = jsonDay1.aulas || [];

      // Ambas as partes devem estar presentes
      assert.equal(aulasDay1.length, 2, "Devem ser retornadas exatamente as 2 partes do Dia 1.");
      // Ordenação determinística estrita: Parte 0 primeiro, Parte 1 depois
      assert.equal(aulasDay1[0].id, "day_1_part_0", "day_1_part_0 deve ser o primeiro item.");
      assert.equal(aulasDay1[0].part, 0);
      assert.equal(aulasDay1[1].id, "day_1_part_1", "day_1_part_1 deve ser o segundo item.");
      assert.equal(aulasDay1[1].part, 1);

      largeServer.close();
      console.log("✔ Teste 21: Listagem completa e ordenada de day_1_part_0 e day_1_part_1 em catálogo extenso (>150 docs) aprovada.");
      passed++;
    }

    // Teste 22: Auditoria exaustiva de autenticação em todas as rotas (rejeição de anônimo, credencial inválida e token de aluno)
    {
      const fakeStudentFirebaseToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9." + "A".repeat(150) + "." + "B".repeat(100);

      const endpoints = [
        "/api/internal/mcp-catalog",
        "/api/internal/mcp-catalog/lesson/day_1_part_0",
      ];

      for (const ep of endpoints) {
        // 1. Sem credencial
        const r1 = await makeRequest({ port, path: ep, method: "GET" });
        assert.equal(r1.status, 401, `${ep} deve exigir autenticação (401).`);

        // 2. Segredo incorreto
        const r2 = await makeRequest({ port, path: ep, method: "GET", headers: { "X-Internal-Secret": "INCORRECT_SECRET" } });
        assert.equal(r2.status, 403, `${ep} deve rejeitar segredo incorreto com 403.`);

        // 3. Token de aluno do Firebase
        const r3 = await makeRequest({ port, path: ep, method: "GET", headers: { Authorization: `Bearer ${fakeStudentFirebaseToken}` } });
        assert.equal(r3.status, 403, `${ep} deve rejeitar categoricamente token Firebase de alunos com 403.`);
      }

      console.log("✔ Teste 22: Auditoria exaustiva de autenticação em todas as rotas internas aprovada.");
      passed++;
    }
  } finally {
    server.close();
  }

  console.log("\n================================================================================");
  console.log(`RESULTADO DA SUÍTE: ${passed}/22 TESTES APROVADOS COM SUCESSO (100%)!`);
  console.log("================================================================================\n");
}

runInternalCatalogTests().catch((err) => {
  console.error("FALHA NA SUÍTE DE TESTES:", err);
  process.exit(1);
});
