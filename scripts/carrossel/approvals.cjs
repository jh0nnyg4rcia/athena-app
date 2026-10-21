const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_REGISTRY_PATH = path.resolve(__dirname, 'approvals/approval_registry.json');

/**
 * Ordena recursivamente as chaves de um objeto para garantir serialização canônica.
 */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const sortedKeys = Object.keys(value).sort();
  const result = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize(value[key]);
  }
  return result;
}

/**
 * Extrai apenas o payload jurídico-editorial substantivo para cálculo do hash.
 * Ignora campos de estado transitório (como estado_editorial ou timestamps de geração de arte).
 */
function extractSubstantivePayload(data) {
  if (!data || !data.meta || !data.slides) {
    throw new Error('Formato de dados inválido: ausência de meta ou slides.');
  }

  return {
    schema_version: data.meta.schema_version,
    editorial_id: data.meta.editorial_id,
    data_boletim: data.meta.data_boletim,
    disciplina: data.meta.disciplina,
    carreiras: data.meta.carreiras,
    tema: data.meta.tema,
    origem: data.meta.origem,
    fontes_oficiais_verificadas: data.meta.fontes_oficiais_verificadas,
    slides: data.slides
  };
}

/**
 * Calcula o hash SHA-256 canônico do conteúdo substantivo do boletim.
 */
function computeCanonicalHash(data) {
  const substantive = extractSubstantivePayload(data);
  const canonical = canonicalize(substantive);
  const jsonStr = JSON.stringify(canonical);
  return crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
}

/**
 * Carrega o registro de aprovações.
 */
function loadRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  if (!fs.existsSync(registryPath)) {
    return { version: '1.0.0', records: {} };
  }
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Falha ao ler o registro de aprovações em ${registryPath}: ${err.message}`);
  }
}

/**
 * Salva o registro de aprovações.
 */
function saveRegistry(registry, registryPath = DEFAULT_REGISTRY_PATH) {
  const dir = path.dirname(registryPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
}

/**
 * Registra a aprovação humana formal do administrador.
 */
function registerApproval({ content, approver, notes = '', registryPath = DEFAULT_REGISTRY_PATH }) {
  if (!approver || typeof approver !== 'string' || approver.trim().length < 3) {
    throw new Error('Identificação do aprovador humano é obrigatória (mínimo 3 caracteres).');
  }

  const hash = computeCanonicalHash(content);
  const editorialId = content.meta.editorial_id;

  const registry = loadRegistry(registryPath);

  const approvalRecord = {
    editorial_id: editorialId,
    data_boletim: content.meta.data_boletim,
    content_sha256: hash,
    aprovado_por: approver.trim(),
    data_aprovacao: new Date().toISOString(),
    confirmacao_explicita: true,
    schema_version: content.meta.schema_version,
    observacoes: notes.trim()
  };

  registry.records[editorialId] = approvalRecord;
  saveRegistry(registry, registryPath);

  return approvalRecord;
}

/**
 * Verifica a validade e a integridade da aprovação humana em relação ao conteúdo.
 */
function verifyApproval({ content, registryPath = DEFAULT_REGISTRY_PATH }) {
  if (!content || !content.meta || !content.meta.editorial_id) {
    return { valid: false, reason: 'Metadados editoriais ou editorial_id ausentes.' };
  }

  const editorialId = content.meta.editorial_id;
  const registry = loadRegistry(registryPath);
  const record = registry.records[editorialId];

  if (!record) {
    return {
      valid: false,
      reason: `Nenhum registro de aprovação humana encontrado para editorial_id: ${editorialId}.`
    };
  }

  if (record.confirmacao_explicita !== true) {
    return {
      valid: false,
      reason: `Aprovação humana para ${editorialId} não possui confirmação explícita atestada.`
    };
  }

  const currentHash = computeCanonicalHash(content);
  if (record.content_sha256 !== currentHash) {
    return {
      valid: false,
      reason: `Divergência de integridade: o hash do conteúdo atual (${currentHash}) não corresponde ao hash aprovado pelo administrador (${record.content_sha256}). O conteúdo foi alterado após a aprovação!`,
      expectedHash: record.content_sha256,
      currentHash
    };
  }

  return {
    valid: true,
    approval: record,
    contentHash: currentHash
  };
}

module.exports = {
  canonicalize,
  extractSubstantivePayload,
  computeCanonicalHash,
  loadRegistry,
  saveRegistry,
  registerApproval,
  verifyApproval,
  DEFAULT_REGISTRY_PATH
};
