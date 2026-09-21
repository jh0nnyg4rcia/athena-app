/**
 * Deve ser o primeiro import de `server.ts` (ESM avalia imports antes do corpo do módulo).
 * Carrega .env.local e .env sem prefixo VITE_, para a chave Gemini nunca ir ao bundle.
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
