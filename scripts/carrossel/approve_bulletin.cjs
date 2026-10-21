#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { registerApproval, computeCanonicalHash } = require('./approvals.cjs');
const { validateBulletin } = require('./validator.cjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    approver: null,
    notes: '',
    registry: undefined
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      options.input = args[++i];
    } else if (args[i] === '--approver' || args[i] === '-a') {
      options.approver = args[++i];
    } else if (args[i] === '--notes' || args[i] === '-n') {
      options.notes = args[++i];
    } else if (args[i] === '--registry' || args[i] === '-r') {
      options.registry = args[++i];
    }
  }

  return options;
}

function main() {
  const options = parseArgs();

  if (!options.input) {
    console.error('Uso: node approve_bulletin.cjs --input <caminho/boletim.json> --approver "<Nome do Administrador>" [--notes "<observações>"]');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), options.input);
  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let content;
  try {
    content = JSON.parse(raw);
  } catch (err) {
    console.error(`Erro: JSON inválido no arquivo ${filePath}: ${err.message}`);
    process.exit(1);
  }

  // Pré-validação do conteúdo (sem checar aprovação prévia, pois estamos criando a aprovação)
  const validation = validateBulletin(content, {
    skipApprovalCheck: true,
    allowDraft: true
  });

  if (!validation.valid) {
    console.error('\n[ERRO DE VALIDAÇÃO JURÍDICA]: O boletim possui inconsistências impeditivas:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const approver = options.approver || 'Administrador ATHENA (Auditoria Local)';

  // Atualiza estado no JSON para LEGAL_APPROVED se ainda não estiver
  content.meta.estado_editorial = 'LEGAL_APPROVED';
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');

  // Registra no banco de aprovações com hash canônico
  const record = registerApproval({
    content,
    approver,
    notes: options.notes || 'Auditoria jurídica e conformidade pedagógica confirmadas.',
    registryPath: options.registry
  });

  console.log('\n======================================================');
  console.log('✅ APROVAÇÃO JURÍDICA REGISTRADA COM SUCESSO');
  console.log('======================================================');
  console.log(`Editorial ID:    ${record.editorial_id}`);
  console.log(`Data Boletim:    ${record.data_boletim}`);
  console.log(`Aprovado por:    ${record.aprovado_por}`);
  console.log(`Timestamp:       ${record.data_aprovacao}`);
  console.log(`SHA-256 Canônico:${record.content_sha256}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  main();
}

module.exports = { main };
