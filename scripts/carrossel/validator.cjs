const fs = require('fs');
const path = require('path');
const { verifyApproval, computeCanonicalHash } = require('./approvals.cjs');

const OFFICIAL_LOGO_PATH = path.resolve(__dirname, 'assets/athena-logo-oficial.png');
const EXPECTED_LOGO_SIZE = 1827846; // Tamanho do PNG oficial catalogado

const VALID_DISCIPLINES = [
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito Tributário',
  'Direito Empresarial',
  'Direito Ambiental',
  'Direitos Humanos',
  'Direito Financeiro',
  'Direito Eleitoral',
  'Direito da Criança e do Adolescente',
  'Direito Coletivo / Difuso'
];

const VALID_EDITORIAL_STATES = [
  'DRAFT',
  'LEGAL_REVIEW',
  'LEGAL_APPROVED',
  'ART_GENERATED',
  'VISUAL_APPROVED',
  'READY_FOR_MANUAL_PUBLICATION'
];

/**
 * Valida a existência e integridade física da logomarca oficial ATHENA.
 */
function validateLogoAsset(logoPath = OFFICIAL_LOGO_PATH) {
  if (!fs.existsSync(logoPath)) {
    return {
      valid: false,
      error: `Logomarca oficial ausente em: ${logoPath}. Regra FAIL-CLOSED violada.`
    };
  }

  const stat = fs.statSync(logoPath);
  if (stat.size < 50000) {
    return {
      valid: false,
      error: `Arquivo da logomarca corrompido ou anormalmente pequeno (${stat.size} bytes).`
    };
  }

  // Verifica magic bytes de PNG (0x89 50 4E 47 0D 0A 1A 0A)
  const buf = Buffer.alloc(8);
  const fd = fs.openSync(logoPath, 'r');
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);

  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    return {
      valid: false,
      error: 'O arquivo de logomarca indicado não é um PNG válido.'
    };
  }

  return { valid: true, path: logoPath, size: stat.size };
}

/**
 * Executa todas as verificações pré-renderização do boletim.
 */
function validateBulletin(content, options = {}) {
  const errors = [];
  const warnings = [];

  // 1. Validação estrutural básica
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['O conteúdo deve ser um objeto JSON válido.'], warnings };
  }

  if (!content.meta || typeof content.meta !== 'object') {
    errors.push('Metadados (meta) ausentes ou inválidos.');
    return { valid: false, errors, warnings };
  }

  const meta = content.meta;

  // 2. Versão do schema
  if (meta.schema_version !== '1.0.0') {
    errors.push(`Versão do schema incompatível: esperada "1.0.0", recebida "${meta.schema_version}".`);
  }

  // 3. Identificador editorial
  if (!meta.editorial_id || typeof meta.editorial_id !== 'string') {
    errors.push('Campo meta.editorial_id é obrigatório.');
  }

  // 4. Data do boletim
  if (!meta.data_boletim || !/^\d{4}-\d{2}-\d{2}$/.test(meta.data_boletim)) {
    errors.push(`Data do boletim inválida ou fora do padrão AAAA-MM-DD: "${meta.data_boletim}".`);
  }

  // 5. Disciplina jurídica
  if (!VALID_DISCIPLINES.includes(meta.disciplina)) {
    errors.push(`Disciplina jurídica inválida: "${meta.disciplina}". Deve ser uma das disciplinas de elite catalogadas.`);
  }

  // 6. Tema
  if (!meta.tema || typeof meta.tema !== 'string' || meta.tema.trim().length < 5) {
    errors.push('Campo meta.tema deve possuir no mínimo 5 caracteres.');
  }

  // 7. Estado editorial
  if (!VALID_EDITORIAL_STATES.includes(meta.estado_editorial)) {
    errors.push(`Estado editorial inválido: "${meta.estado_editorial}".`);
  } else if (!options.allowDraft) {
    if (meta.estado_editorial === 'DRAFT' || meta.estado_editorial === 'LEGAL_REVIEW') {
      errors.push(`Conteúdo em estado "${meta.estado_editorial}" não está autorizado para renderização de artes finais. Exige-se "LEGAL_APPROVED".`);
    }
  }

  // 8. Fontes verificadas
  if (!Array.isArray(meta.fontes_oficiais_verificadas) || meta.fontes_oficiais_verificadas.length === 0) {
    errors.push('É obrigatório informar ao menos uma fonte oficial verificada (meta.fontes_oficiais_verificadas).');
  }

  // 9. Pontos pendentes
  if (Array.isArray(meta.pontos_pendentes) && meta.pontos_pendentes.length > 0) {
    errors.push(`Existem ${meta.pontos_pendentes.length} pendência(s) jurídica(s) não resolvida(s): ${meta.pontos_pendentes.join('; ')}.`);
  }

  // 10. Validação dos Slides (Exatamente 7)
  if (!Array.isArray(content.slides)) {
    errors.push('Array content.slides ausente.');
    return { valid: false, errors, warnings };
  }

  if (content.slides.length !== 7) {
    errors.push(`Quantidade incorreta de slides: esperado exatamente 7, recebido ${content.slides.length}.`);
  }

  const expectedTypes = [
    'capa',
    'lei_seca',
    'jurisprudencia',
    'excecao_pegadinha',
    'questao',
    'gabarito',
    'revisao'
  ];

  let questaoSlide = null;
  let gabaritoSlide = null;

  content.slides.forEach((slide, idx) => {
    const expectedNum = idx + 1;
    if (slide.numero !== expectedNum) {
      errors.push(`Slide no índice ${idx} possui numeração incorreta (${slide.numero}). Esperado: ${expectedNum}.`);
    }

    const expectedType = expectedTypes[idx];
    if (expectedType && slide.tipo !== expectedType) {
      errors.push(`Slide ${expectedNum} possui tipo incompatível ("${slide.tipo}"). Esperado: "${expectedType}".`);
    }

    if (!slide.titulo || typeof slide.titulo !== 'string' || slide.titulo.trim().length < 3) {
      errors.push(`Slide ${expectedNum} está com título vazio ou excessivamente curto.`);
    }

    // Regras específicas de cada slide
    if (slide.tipo === 'capa') {
      if (!slide.pergunta_provocativa || slide.pergunta_provocativa.trim().length < 5) {
        errors.push('Slide 1 (Capa) exige campo pergunta_provocativa preenchido.');
      }
      if (!slide.titulo_principal || slide.titulo_principal.trim().length < 5) {
        errors.push('Slide 1 (Capa) exige campo titulo_principal preenchido.');
      }
      if (!slide.destaque_titulo) {
        warnings.push('Slide 1 (Capa): destaque_titulo não informado. Nenhuma palavra receberá realce dourado no título.');
      }
    }

    if (slide.tipo === 'lei_seca') {
      if (!slide.citacao || slide.citacao.trim().length < 10) {
        errors.push('Slide 2 (Lei Seca) exige citação normativa válida.');
      } else if (slide.citacao.length > 380) {
        warnings.push(`Slide 2: citação normativa muito longa (${slide.citacao.length} chars). Risco de redução de legibilidade.`);
      }
      if (!slide.explicacao) {
        errors.push('Slide 2 (Lei Seca) exige explicação objetiva.');
      }
      if (!slide.regra_chave) {
        errors.push('Slide 2 (Lei Seca) exige regra_chave de destaque.');
      }
    }

    if (slide.tipo === 'jurisprudencia') {
      if (!slide.tese || slide.tese.trim().length < 10) {
        errors.push('Slide 3 (Jurisprudência) exige enunciado da tese jurídica.');
      } else if (slide.tese.length > 340) {
        warnings.push(`Slide 3: tese jurisprudencial muito longa (${slide.tese.length} chars).`);
      }
      if (!slide.consequencia_pratica) {
        errors.push('Slide 3 (Jurisprudência) exige consequencia_pratica forense.');
      }
    }

    if (slide.tipo === 'excecao_pegadinha') {
      if (!slide.excecao) {
        errors.push('Slide 4 (Exceção/Pegadinha) exige campo excecao preenchido.');
      }
      if (!slide.distincao) {
        errors.push('Slide 4 (Exceção/Pegadinha) exige campo distincao preenchido.');
      }
    }

    if (slide.tipo === 'questao') {
      questaoSlide = slide;
      if (!slide.enunciado || slide.enunciado.trim().length < 10) {
        errors.push('Slide 5 (Questão) exige enunciado objetivo claro.');
      } else if (slide.enunciado.length > 400) {
        warnings.push(`Slide 5: enunciado longo (${slide.enunciado.length} chars).`);
      }

      // Origem da questão
      if (slide.origem_questao && !['autoral', 'oficial'].includes(slide.origem_questao)) {
        errors.push(`Slide 5: origem_questao deve ser "autoral" ou "oficial", recebido "${slide.origem_questao}".`);
      }

      if (!Array.isArray(slide.alternativas) || slide.alternativas.length !== 4) {
        errors.push(`Slide 5 (Questão) exige exatamente 4 alternativas (A, B, C, D). Recebido: ${slide.alternativas ? slide.alternativas.length : 0}.`);
      } else {
        const letters = slide.alternativas.map(a => a.letra);
        if (!letters.includes('A') || !letters.includes('B') || !letters.includes('C') || !letters.includes('D')) {
          errors.push('Slide 5: as alternativas devem cobrir exatamente as letras A, B, C e D.');
        }
        slide.alternativas.forEach(a => {
          if (!a.texto || a.texto.trim().length < 3) {
            errors.push(`Slide 5: alternativa ${a.letra} com texto vazio ou inválido.`);
          }
        });
      }

      // Não revelar gabarito no slide 5
      const lowerEnunciado = (slide.enunciado + ' ' + (slide.aviso_gabarito || '')).toLowerCase();
      if (lowerEnunciado.includes('gabarito é') || lowerEnunciado.includes('correta é a') || lowerEnunciado.includes('resposta:')) {
        errors.push('Slide 5 (Questão) contém revelação indevida do gabarito antes do slide 6!');
      }
    }

    if (slide.tipo === 'gabarito') {
      gabaritoSlide = slide;
      if (!slide.alternativa_correta || !['A', 'B', 'C', 'D'].includes(slide.alternativa_correta)) {
        errors.push(`Slide 6 (Gabarito) exige campo alternativa_correta com valor 'A', 'B', 'C' ou 'D'. Recebido: "${slide.alternativa_correta}".`);
      }
      if (!slide.fundamentacao || slide.fundamentacao.trim().length < 10) {
        errors.push('Slide 6 (Gabarito) exige fundamentação jurídica substancial.');
      }

      // REGRA OBRIGATÓRIA: Não chamar de "Gabarito oficial" se a questão for autoral do ATHENA
      const tagLower = (slide.tag || '').toLowerCase();
      const tituloLower = (slide.titulo || '').toLowerCase();
      const isAutoral = questaoSlide && questaoSlide.origem_questao === 'autoral';
      if (isAutoral && (tagLower.includes('gabarito oficial') || tituloLower.includes('gabarito oficial'))) {
        errors.push('Violação de transparência: questão autoral do ATHENA não pode utilizar a expressão "Gabarito oficial". Use "Gabarito Comentado ATHENA".');
      }
    }

    if (slide.tipo === 'revisao') {
      if (!Array.isArray(slide.pontos_chave) || slide.pontos_chave.length !== 3) {
        errors.push(`Slide 7 (Revisão) exige exatamente 3 pontos-chave de síntese. Recebido: ${slide.pontos_chave ? slide.pontos_chave.length : 0}.`);
      }
      if (!slide.cta) {
        errors.push('Slide 7 (Revisão) exige chamada para salvar (cta).');
      }
    }
  });

  // Consistência entre Questão e Gabarito
  if (questaoSlide && gabaritoSlide && gabaritoSlide.alternativa_correta) {
    const optMatch = questaoSlide.alternativas && questaoSlide.alternativas.find(a => a.letra === gabaritoSlide.alternativa_correta);
    if (!optMatch) {
      errors.push(`Incompatibilidade crítica: o gabarito indicado (${gabaritoSlide.alternativa_correta}) não existe nas alternativas da questão.`);
    }
  }

  // 11. Validação da Logomarca Oficial (Fail-Closed)
  const logoCheck = validateLogoAsset(options.logoPath || OFFICIAL_LOGO_PATH);
  if (!logoCheck.valid) {
    errors.push(logoCheck.error);
  }

  // 12. Validação da Aprovação Humana (se exigido ou se em LEGAL_APPROVED)
  if (!options.skipApprovalCheck) {
    const approvalCheck = verifyApproval({
      content,
      registryPath: options.registryPath
    });
    if (!approvalCheck.valid) {
      errors.push(`Falha na verificação de aprovação humana: ${approvalCheck.reason}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    computedHash: computeCanonicalHash(content)
  };
}

module.exports = {
  validateBulletin,
  validateLogoAsset,
  VALID_DISCIPLINES,
  VALID_EDITORIAL_STATES,
  OFFICIAL_LOGO_PATH,
  EXPECTED_LOGO_SIZE
};
