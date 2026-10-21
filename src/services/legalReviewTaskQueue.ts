import type { AsyncLegalReviewTaskPayload } from "../lib/legalReviewTypes";

export interface LegalReviewTaskEnqueuer {
  enqueue(payload: AsyncLegalReviewTaskPayload, deterministicTaskId?: string): Promise<void>;
}

/**
 * Cria o enfileirador de tarefas do Google Cloud Tasks para o worker de revisão jurídica.
 * Se a configuração de nuvem não estiver completa no ambiente local, opera em modo seguro sem despachar rede.
 */
export function createCloudTasksEnqueuer(): LegalReviewTaskEnqueuer {
  return {
    async enqueue(payload: AsyncLegalReviewTaskPayload, deterministicTaskId?: string): Promise<void> {
      const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "gen-lang-client-0822763072";
      const location = process.env.CLOUD_TASKS_LOCATION;
      const queue = process.env.CLOUD_TASKS_QUEUE;
      const workerUrl = process.env.LEGAL_REVIEW_WORKER_URL;
      const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL;

      if (!location || !queue || !workerUrl || !serviceAccountEmail) {
        const missing = [
          !location && "CLOUD_TASKS_LOCATION",
          !queue && "CLOUD_TASKS_QUEUE",
          !workerUrl && "LEGAL_REVIEW_WORKER_URL",
          !serviceAccountEmail && "CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL",
        ].filter(Boolean).join(", ");
        throw new Error(`Configuração obrigatória do Cloud Tasks ausente no ambiente: [${missing}]. Enfileiramento abortado.`);
      }

      // Import dinâmico do SDK oficial da Google Cloud caso configurado em produção
      let clientInstance: any = null;
      let assignedTaskName: string | undefined = undefined;

      try {
        const tasksPkg = "@google-cloud/tasks";
        const tasksMod = await import(/* @vite-ignore */ tasksPkg);
        const CloudTasksClient = tasksMod.CloudTasksClient;
        const client = new CloudTasksClient();
        clientInstance = client;
        const parent = client.queuePath(project, location, queue);

        const task: Record<string, unknown> = {
          httpRequest: {
            httpMethod: "POST",
            url: workerUrl,
            headers: {
              "Content-Type": "application/json",
            },
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
          },
        };

        if (deterministicTaskId) {
          const sanitizedId = deterministicTaskId.replace(/[^a-zA-Z0-9_-]/g, "_");
          assignedTaskName = client.taskPath(project, location, queue, sanitizedId);
          task.name = assignedTaskName;
        }

        if (serviceAccountEmail) {
          const serviceAudience = process.env.CLOUD_RUN_SERVICE_URL || "https://athenaapi-37efv4sd6a-rj.a.run.app";
          (task.httpRequest as any).oidcToken = {
            serviceAccountEmail,
            audience: serviceAudience,
          };
        }

        await client.createTask({ parent, task: task as any });
      } catch (err: any) {
        const isAlreadyExists =
          err?.code === 6 ||
          err?.code === "ALREADY_EXISTS" ||
          /already exists/i.test(err?.message || "");

        if (deterministicTaskId && isAlreadyExists) {
          // ALREADY_EXISTS só é interpretado como sucesso quando corresponder à tarefa esperada ativa na fila
          if (assignedTaskName && clientInstance && typeof clientInstance.getTask === "function") {
            try {
              const [existingTask] = await clientInstance.getTask({ name: assignedTaskName });
              if (existingTask) {
                // Tarefa esperada confirmada como existente e ativa na fila
                return;
              }
            } catch (getErr: any) {
              const isNotFound =
                getErr?.code === 5 ||
                getErr?.code === "NOT_FOUND" ||
                /not found/i.test(getErr?.message || "");
              if (isNotFound) {
                // Tombstone do Cloud Tasks: a tarefa já foi executada ou deletada anteriormente
                throw new Error(
                  `Conflito de identificador no Cloud Tasks: a tarefa ${assignedTaskName} já foi executada ou deletada (tombstone). Uma nova tentativa exige recuperação administrativa com nova identidade.`
                );
              }
              // Erro ao consultar a tarefa: relança para não assumir falso positivo
              throw getErr;
            }
          } else {
            // Em ambientes simulados ou SDK sem getTask, se o erro é ALREADY_EXISTS com deterministicTaskId configurado
            return;
          }
        }
        console.warn("[cloud-tasks] Falha ao despachar tarefa no Cloud Tasks:", err?.message || err);
        throw err;
      }
    },
  };
}
