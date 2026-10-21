#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

const { validateBulletin, OFFICIAL_LOGO_PATH } = require('./validator.cjs');
const { computeCanonicalHash } = require('./approvals.cjs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEFAULT_INPUT_PATH = path.resolve(__dirname, 'content-sample.json');
const DEFAULT_OUT_DIR = path.resolve(__dirname, 'output');
const BRAIN_OUT_DIR = path.resolve('C:/Users/jhonn/.gemini/antigravity/brain/8e518388-1965-4e32-b042-a8c549df3852/carrossel_previews');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: DEFAULT_INPUT_PATH,
    output: DEFAULT_OUT_DIR,
    registry: undefined,
    verifyOnly: false,
    skipZip: false,
    onlySlide: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      options.input = path.resolve(process.cwd(), args[++i]);
    } else if (args[i] === '--output' || args[i] === '-o') {
      options.output = path.resolve(process.cwd(), args[++i]);
    } else if (args[i] === '--registry' || args[i] === '-r') {
      options.registry = path.resolve(process.cwd(), args[++i]);
    } else if (args[i] === '--verify-only') {
      options.verifyOnly = true;
    } else if (args[i] === '--skip-zip') {
      options.skipZip = true;
    } else if (args[i] === '--slide') {
      options.onlySlide = parseInt(args[++i], 10);
    }
  }

  return options;
}

function buildSlideHtml(slideData, meta, logoDataUri, questaoSlide = null) {
  const isCover = slideData.numero === 1;
  const isRevision = slideData.numero === 7;

  let bodyContent = '';

  if (isCover) {
    const highlightTarget = slideData.destaque_titulo || '';
    const formattedTitle = highlightTarget && slideData.titulo_principal.includes(highlightTarget)
      ? slideData.titulo_principal.replace(highlightTarget, `<span>${highlightTarget}</span>`)
      : slideData.titulo_principal;

    bodyContent = `
      <div class="cover-layout">
        <div class="cover-brand-block">
          <div class="cover-logo-wrapper">
            <img src="${logoDataUri}" alt="ATHENA" class="cover-logo-img">
          </div>
          <div class="cover-brand-title">ATHENA</div>
          <div class="cover-brand-sub">Mentoria Jurídica com IA</div>
        </div>

        <div class="cover-content-block">
          <div class="cover-discipline-pill">${meta.disciplina} • ${meta.carreiras}</div>
          <p class="cover-hook-question">${slideData.pergunta_provocativa}</p>
          <h1 class="cover-main-headline">${formattedTitle}</h1>
        </div>

        <div class="cover-footer-block">
          <div class="swipe-indicator">
            <span>${slideData.cta_deslize || 'Deslize para aprender'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
          <div class="slide-counter">1 / 7</div>
        </div>
      </div>
    `;
  } else if (slideData.tipo === 'lei_seca') {
    bodyContent = `
      <div class="standard-layout">
        <div class="header-standard">
          <div class="brand-group-compact">
            <img src="${logoDataUri}" alt="ATHENA" class="logo-compact">
            <div class="brand-text-compact">
              <span class="brand-title-compact">ATHENA</span>
              <span class="brand-sub-compact">Mentoria Jurídica</span>
            </div>
          </div>
          <div class="header-meta">
            <span class="discipline-badge">${meta.disciplina}</span>
            <span class="slide-counter">${slideData.numero} / 7</span>
          </div>
        </div>

        <div class="slide-body">
          <div class="section-tag">${slideData.tag || 'Dispositivo Normativo'}</div>
          <h2 class="slide-headline">${slideData.titulo}</h2>

          <div class="slide-card-juridico">
            <div class="citation-box">"${slideData.citacao}"</div>
          </div>

          <p class="slide-text-regular">${slideData.explicacao}</p>

          <div class="rule-box-highlight">
            <div class="highlight-icon">⚖️</div>
            <p><strong>Regra de Ouro:</strong> ${slideData.regra_chave}</p>
          </div>
        </div>

        <div class="footer-standard">
          <span class="footer-tagline">ATHENA • <strong>Metodologia 80/20 de Fixação</strong></span>
          <span class="footer-meta-right">projetoathena.app.br</span>
        </div>
      </div>
    `;
  } else if (slideData.tipo === 'jurisprudencia') {
    bodyContent = `
      <div class="standard-layout">
        <div class="header-standard">
          <div class="brand-group-compact">
            <img src="${logoDataUri}" alt="ATHENA" class="logo-compact">
            <div class="brand-text-compact">
              <span class="brand-title-compact">ATHENA</span>
              <span class="brand-sub-compact">Mentoria Jurídica</span>
            </div>
          </div>
          <div class="header-meta">
            <span class="discipline-badge">${meta.disciplina}</span>
            <span class="slide-counter">${slideData.numero} / 7</span>
          </div>
        </div>

        <div class="slide-body">
          <div class="section-tag">${slideData.tag || 'Precedente Vinculante'}</div>
          <h2 class="slide-headline">${slideData.titulo}</h2>

          <div class="slide-card-juridico" style="border-left: 5px solid var(--gold-primary);">
            <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.12em; color: var(--gold-light); text-transform: uppercase; margin-bottom: 8px;">Tese Jurídica Vinculante (${slideData.tribunal || 'STF/STJ'}):</div>
            <p style="font-size: 22px; line-height: 1.5; color: #F1F5F9; font-style: italic;">"${slideData.tese}"</p>
          </div>

          <div class="rule-box-highlight" style="background: rgba(15, 23, 42, 0.85); border-color: rgba(255, 255, 255, 0.12);">
            <div class="highlight-icon">🎯</div>
            <p><strong>Aplicação Prática Forense:</strong> ${slideData.consequencia_pratica}</p>
          </div>
        </div>

        <div class="footer-standard">
          <span class="footer-tagline">ATHENA • <strong>Jurisprudência em Teses Vinculantes</strong></span>
          <span class="footer-meta-right">projetoathena.app.br</span>
        </div>
      </div>
    `;
  } else if (slideData.tipo === 'excecao_pegadinha') {
    bodyContent = `
      <div class="standard-layout">
        <div class="header-standard">
          <div class="brand-group-compact">
            <img src="${logoDataUri}" alt="ATHENA" class="logo-compact">
            <div class="brand-text-compact">
              <span class="brand-title-compact">ATHENA</span>
              <span class="brand-sub-compact">Mentoria Jurídica</span>
            </div>
          </div>
          <div class="header-meta">
            <span class="discipline-badge" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); color: #FCA5A5;">⚠️ Alerta de Concurso</span>
            <span class="slide-counter">${slideData.numero} / 7</span>
          </div>
        </div>

        <div class="slide-body">
          <div class="section-tag" style="color: #F87171;">${slideData.tag || 'Exceção & Distinguishing'}</div>
          <h2 class="slide-headline">${slideData.titulo}</h2>

          <div class="slide-card-juridico">
            <p class="slide-text-regular">${slideData.excecao}</p>
            <div style="margin-top: 14px; padding: 14px 18px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); border: 1px dashed rgba(239, 68, 68, 0.35); font-size: 19px; line-height: 1.5; color: #FECACA;">
              ${slideData.distincao}
            </div>
          </div>

          <div class="rule-box-highlight">
            <div class="highlight-icon">🛡️</div>
            <p><strong>Critério da Prova:</strong> ${slideData.regra_chave}</p>
          </div>
        </div>

        <div class="footer-standard">
          <span class="footer-tagline">ATHENA • <strong>Filtro Anti-Pegadinhas de Bancas</strong></span>
          <span class="footer-meta-right">projetoathena.app.br</span>
        </div>
      </div>
    `;
  } else if (slideData.tipo === 'questao') {
    const optsHtml = slideData.alternativas.map(a => `
      <div class="quiz-option-box">
        <div class="quiz-letter">${a.letra}</div>
        <div class="quiz-text">${a.texto}</div>
      </div>
    `).join('');

    const tagText = slideData.tag || (slideData.origem_questao === 'autoral' ? 'Desafio Inédito de Fixação' : 'Questão de Concurso Oficial');

    bodyContent = `
      <div class="standard-layout">
        <div class="header-standard">
          <div class="brand-group-compact">
            <img src="${logoDataUri}" alt="ATHENA" class="logo-compact">
            <div class="brand-text-compact">
              <span class="brand-title-compact">ATHENA</span>
              <span class="brand-sub-compact">Mentoria Jurídica</span>
            </div>
          </div>
          <div class="header-meta">
            <span class="discipline-badge">${meta.disciplina}</span>
            <span class="slide-counter">${slideData.numero} / 7</span>
          </div>
        </div>

        <div class="slide-body">
          <div class="section-tag">${tagText}</div>
          <h3 style="font-size: 23px; font-weight: 700; color: #F1F5F9; line-height: 1.45; margin-bottom: 20px;">
            ${slideData.enunciado}
          </h3>

          <div class="quiz-options-grid">
            ${optsHtml}
          </div>

          <p style="text-align: center; font-size: 17px; font-weight: 600; color: var(--gold-light); margin-top: 18px;">
            ${slideData.aviso_gabarito || 'Pense na resposta e deslize para conferir o gabarito comentado →'}
          </p>
        </div>

        <div class="footer-standard">
          <span class="footer-tagline">ATHENA • <strong>Simulados de Alta Performance</strong></span>
          <span class="footer-meta-right">projetoathena.app.br</span>
        </div>
      </div>
    `;
  } else if (slideData.tipo === 'gabarito') {
    const errosHtml = (slideData.analise_erros || []).map(e => `
      <div class="error-item">
        <span class="error-cross">✕</span>
        <span>${e}</span>
      </div>
    `).join('');

    // Distinção obrigatória: se a questão for autoral, NÃO chamar de "Gabarito Oficial"!
    const isAutoral = questaoSlide && questaoSlide.origem_questao === 'autoral';
    const tagText = slideData.tag || (isAutoral ? 'Gabarito Comentado ATHENA' : 'Gabarito Oficial da Banca');

    bodyContent = `
      <div class="standard-layout">
        <div class="header-standard">
          <div class="brand-group-compact">
            <img src="${logoDataUri}" alt="ATHENA" class="logo-compact">
            <div class="brand-text-compact">
              <span class="brand-title-compact">ATHENA</span>
              <span class="brand-sub-compact">Mentoria Jurídica</span>
            </div>
          </div>
          <div class="header-meta">
            <span class="discipline-badge">${meta.disciplina}</span>
            <span class="slide-counter">${slideData.numero} / 7</span>
          </div>
        </div>

        <div class="slide-body">
          <div class="section-tag">${tagText}</div>
          <div class="gabarito-badge-large">
            <span>🎉</span> ${slideData.titulo}
          </div>

          <div class="slide-card-juridico" style="border-left: 5px solid #10B981; margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.12em; color: #34D399; text-transform: uppercase; margin-bottom: 6px;">Por que é a correta:</div>
            <p style="font-size: 21px; line-height: 1.5; color: #F8FAFC;">${slideData.fundamentacao}</p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px 22px;">
            <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px;">Análise dos Distratores:</div>
            ${errosHtml}
          </div>
        </div>

        <div class="footer-standard">
          <span class="footer-tagline">ATHENA • <strong>Correção Fundamentada Item a Item</strong></span>
          <span class="footer-meta-right">projetoathena.app.br</span>
        </div>
      </div>
    `;
  } else if (isRevision) {
    const pontosHtml = slideData.pontos_chave.map((p, i) => `
      <div class="revision-item">
        <div class="revision-num">0${i + 1}</div>
        <div class="revision-text">${p}</div>
      </div>
    `).join('');

    bodyContent = `
      <div class="cover-layout" style="justify-content: space-between;">
        <div class="cover-brand-block" style="margin-top: 0;">
          <div class="cover-logo-wrapper" style="margin-bottom: 12px;">
            <img src="${logoDataUri}" alt="ATHENA" class="cover-logo-img" style="width: 140px; height: 140px;">
          </div>
          <div class="cover-brand-title" style="font-size: 28px; letter-spacing: 0.2em;">ATHENA</div>
          <div class="cover-brand-sub" style="font-size: 11px;">Mentoria Jurídica com IA</div>
        </div>

        <div style="width: 100%; max-width: 900px; text-align: left; margin: 10px 0;">
          <div class="section-tag" style="justify-content: center; width: 100%; margin-bottom: 14px;">${slideData.tag || 'Síntese Estratégica'}</div>
          <h2 style="font-family: var(--font-serif); font-size: 36px; font-weight: 700; color: #FFFFFF; text-align: center; margin-bottom: 24px;">
            ${slideData.titulo}
          </h2>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${pontosHtml}
          </div>
        </div>

        <div style="width: 100%; text-align: center;">
          <div style="background: rgba(212, 175, 55, 0.14); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 12px; padding: 14px 20px; display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 20px;">💾</span>
            <span style="font-size: 16px; font-weight: 700; color: var(--gold-light);">${slideData.cta || 'Salve este carrossel para revisar antes da prova.'}</span>
          </div>

          <div class="cover-footer-block" style="padding-top: 14px;">
            <span class="footer-tagline">${slideData.rodape_institucional || 'ATHENA • Mentoria Jurídica de Elite com Inteligência Artificial'}</span>
            <div class="slide-counter">7 / 7</div>
          </div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    :root {
      --bg-deep: #09090B;
      --bg-navy: #0B1120;
      --bg-card: rgba(15, 23, 42, 0.82);
      --bg-card-border: rgba(212, 175, 55, 0.24);
      --gold-primary: #D4AF37;
      --gold-light: #E8C57D;
      --text-ivory: #F5F1E8;
      --text-muted: #A8A8B3;
      --text-highlight: #FFFFFF;
      --font-serif: 'Playfair Display', Georgia, serif;
      --font-title: 'Cinzel', 'Playfair Display', serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      width: 1080px; height: 1080px; overflow: hidden;
      background-color: var(--bg-deep); font-family: var(--font-sans); color: var(--text-ivory);
    }
    .slide-canvas {
      width: 1080px; height: 1080px; position: relative;
      background: radial-gradient(circle at 50% 18%, rgba(212, 175, 55, 0.08) 0%, rgba(11, 17, 32, 0.95) 55%, var(--bg-deep) 100%);
      padding: 72px; display: flex; flex-direction: column; justify-content: space-between;
    }
    .slide-frame {
      position: absolute; top: 32px; left: 32px; right: 32px; bottom: 32px;
      border: 1px solid rgba(212, 175, 55, 0.2); pointer-events: none; z-index: 1;
    }
    .slide-frame::before {
      content: ''; position: absolute; top: -1px; left: -1px; width: 16px; height: 16px;
      border-color: var(--gold-primary); border-style: solid; border-width: 2px 0 0 2px;
    }
    .slide-frame::after {
      content: ''; position: absolute; bottom: -1px; right: -1px; width: 16px; height: 16px;
      border-color: var(--gold-primary); border-style: solid; border-width: 0 2px 2px 0;
    }
    .standard-layout {
      height: 100%; display: flex; flex-direction: column; justify-content: space-between; z-index: 2;
    }
    .header-standard {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.22);
    }
    .brand-group-compact { display: flex; align-items: center; gap: 16px; }
    .logo-compact {
      width: 66px; height: 66px; border-radius: 50%; border: 1.5px solid var(--gold-primary);
      box-shadow: 0 0 16px rgba(212, 175, 55, 0.3); object-fit: cover;
    }
    .brand-text-compact { display: flex; flex-direction: column; }
    .brand-title-compact { font-family: var(--font-title); font-size: 21px; font-weight: 800; letter-spacing: 0.16em; color: #FFFFFF; }
    .brand-sub-compact { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; color: var(--gold-light); text-transform: uppercase; }
    .header-meta { display: flex; align-items: center; gap: 14px; }
    .discipline-badge {
      font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--gold-light); background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35);
      padding: 6px 14px; border-radius: 100px;
    }
    .slide-counter {
      font-family: var(--font-mono); font-size: 15px; font-weight: 700; color: var(--gold-primary);
      background: rgba(0, 0, 0, 0.45); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .slide-body { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 24px 0; }
    .section-tag {
      display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 16px;
    }
    .section-tag::before { content: ''; display: inline-block; width: 18px; height: 2px; background: var(--gold-primary); }
    .slide-headline { font-family: var(--font-serif); font-size: 40px; font-weight: 700; line-height: 1.22; color: #FFFFFF; margin-bottom: 22px; }
    .slide-card-juridico {
      background: var(--bg-card); border: 1px solid var(--bg-card-border); border-radius: 16px;
      padding: 28px; backdrop-filter: blur(12px); box-shadow: 0 18px 45px rgba(0, 0, 0, 0.6); margin-bottom: 20px;
    }
    .citation-box {
      border-left: 4px solid var(--gold-primary); padding-left: 18px; font-style: italic; color: #F1F5F9; font-size: 22px; line-height: 1.5;
    }
    .slide-text-regular { font-size: 21px; line-height: 1.55; color: #CBD5E1; margin-bottom: 16px; }
    .slide-text-regular strong { color: var(--gold-light); font-weight: 700; }
    .rule-box-highlight {
      background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 14px;
      padding: 18px 22px; display: flex; align-items: flex-start; gap: 14px;
    }
    .highlight-icon { font-size: 24px; flex-shrink: 0; }
    .rule-box-highlight p { font-size: 19px; line-height: 1.5; color: #F8FAFC; }
    .footer-standard {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 18px; border-top: 1px solid rgba(212, 175, 55, 0.2); font-size: 13px; color: var(--text-muted);
    }
    .footer-tagline strong { color: var(--gold-light); }
    .cover-layout { height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; }
    .cover-brand-block { display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
    .cover-logo-wrapper { position: relative; margin-bottom: 18px; }
    .cover-logo-wrapper::before {
      content: ''; position: absolute; inset: -14px; border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, transparent 70%); z-index: -1;
    }
    .cover-logo-img {
      width: 205px; height: 205px; border-radius: 50%; border: 2.5px solid var(--gold-primary);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.35); object-fit: cover;
    }
    .cover-brand-title { font-family: var(--font-title); font-size: 38px; font-weight: 800; letter-spacing: 0.22em; color: #FFFFFF; margin-bottom: 6px; }
    .cover-brand-sub { font-size: 13px; font-weight: 700; letter-spacing: 0.26em; color: var(--gold-light); text-transform: uppercase; }
    .cover-content-block { max-width: 860px; margin: 8px 0; }
    .cover-discipline-pill {
      display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--gold-light); background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35);
      padding: 8px 22px; border-radius: 100px; margin-bottom: 20px;
    }
    .cover-hook-question { font-size: 26px; font-weight: 600; color: #CBD5E1; margin-bottom: 16px; line-height: 1.4; }
    .cover-main-headline { font-family: var(--font-serif); font-size: 46px; font-weight: 800; line-height: 1.18; color: #FFFFFF; }
    .cover-main-headline span { color: var(--gold-primary); }
    .cover-footer-block {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      padding-top: 20px; border-top: 1px solid rgba(212, 175, 55, 0.2);
    }
    .swipe-indicator { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-light); }
    .swipe-indicator svg { width: 18px; height: 18px; stroke: var(--gold-primary); }
    .quiz-options-grid { display: flex; flex-direction: column; gap: 12px; margin: 10px 0; }
    .quiz-option-box {
      display: flex; align-items: center; gap: 16px; background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 18px; text-align: left;
    }
    .quiz-letter {
      width: 36px; height: 36px; border-radius: 8px; background: rgba(212, 175, 55, 0.15);
      border: 1px solid var(--gold-primary); color: var(--gold-light); font-weight: 800; font-size: 16px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .quiz-text { font-size: 18px; color: #F1F5F9; line-height: 1.4; }
    .gabarito-badge-large {
      display: inline-flex; align-items: center; gap: 12px; background: rgba(16, 185, 129, 0.15);
      border: 1.5px solid #10B981; color: #34D399; font-weight: 800; font-size: 26px;
      padding: 12px 24px; border-radius: 14px; margin-bottom: 20px;
    }
    .error-item { display: flex; align-items: flex-start; gap: 10px; font-size: 18px; color: #CBD5E1; margin-bottom: 10px; line-height: 1.4; }
    .error-cross { color: #F87171; font-weight: 800; flex-shrink: 0; }
    .revision-item {
      display: flex; align-items: center; gap: 18px; background: rgba(15, 23, 42, 0.78);
      border: 1px solid var(--bg-card-border); border-radius: 14px; padding: 16px 20px; text-align: left;
    }
    .revision-num {
      font-family: var(--font-title); font-size: 24px; font-weight: 800; color: var(--gold-primary);
      width: 44px; height: 44px; border-radius: 50%; background: rgba(212, 175, 55, 0.12);
      border: 1px solid var(--gold-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .revision-text { font-size: 19px; line-height: 1.45; color: #F1F5F9; font-weight: 500; }
  </style>
</head>
<body>
  <div class="slide-canvas">
    <div class="slide-frame"></div>
    ${bodyContent}
  </div>
</body>
</html>`;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`Timeout waiting for CDP: ${method}`));
        }
      }, 15000);
      this.callbacks.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function renderCarousel(contentFile, options = {}) {
  const filePath = path.resolve(process.cwd(), contentFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo de boletim não encontrado: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let content;
  try {
    content = JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON inválido no arquivo de entrada: ${err.message}`);
  }

  console.log('=== ATHENA — SISTEMA MESTRE DE CARROSSÉIS INSTAGRAM ===');
  console.log(`[Input] Carregando: ${filePath}`);

  // 1. Pré-Validação Rigorosa (Fail-Closed)
  console.log('[Validação] Executando auditoria pré-renderização...');
  const validation = validateBulletin(content, {
    registryPath: options.registry,
    skipApprovalCheck: options.skipApprovalCheck || false
  });

  if (!validation.valid) {
    console.error('\n❌ [FALHA DE AUDITORIA PRÉ-RENDERIZAÇÃO]:');
    validation.errors.forEach(e => console.error(`   - ${e}`));
    throw new Error('Geração abortada devido a pendências ou falhas de validação editorial.');
  }

  if (validation.warnings.length > 0) {
    console.warn('\n⚠️ [ALERTAS EDITORIAIS]:');
    validation.warnings.forEach(w => console.warn(`   - ${w}`));
  }

  console.log('✅ [Validação] Auditoria pré-voo aprovada com sucesso!');
  console.log(`   Editorial ID: ${content.meta.editorial_id}`);
  console.log(`   Hash:         ${validation.computedHash}`);

  if (options.verifyOnly) {
    console.log('\n[Modo] Execução com --verify-only. Imagens não serão renderizadas.');
    return { validation, generatedFiles: [] };
  }

  // 2. Carrega Logomarca Oficial
  const logoPath = OFFICIAL_LOGO_PATH;
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const dateStr = content.meta.data_boletim || '2026-10-14';
  const outDir = options.output || DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(BRAIN_OUT_DIR, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-carousel-'));
  const port = 9982 + Math.floor(Math.random() * 50);

  console.log(`[Renderer] Iniciando Chrome Headless na porta ${port}...`);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/list`, res => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      if (targets && targets.length > 0) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');

  // Configura viewport estrito para 1080x1080 com escala 1:1
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  const generatedFiles = [];
  const questaoSlide = content.slides.find(s => s.tipo === 'questao');

  try {
    for (const slide of content.slides) {
      if (options.onlySlide && slide.numero !== options.onlySlide) continue;

      const slideNumStr = String(slide.numero).padStart(2, '0');
      const filename = `ATHENA_${dateStr}_SLIDE_${slideNumStr}.png`;
      const outPath = path.join(outDir, filename);
      const brainPath = path.join(BRAIN_OUT_DIR, filename);

      console.log(`[Renderer] Processando Slide ${slide.numero}/7: ${filename}...`);

      const slideHtml = buildSlideHtml(slide, content.meta, logoDataUri, questaoSlide);
      const tempHtmlPath = path.join(tmpDir, `slide_${slide.numero}.html`);
      fs.writeFileSync(tempHtmlPath, slideHtml, 'utf-8');

      const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
      await cdp.send('Page.navigate', { url: fileUrl });
      await new Promise(r => setTimeout(r, 700)); // Aguarda carregamento de fontes

      const res = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: 1080, height: 1080, scale: 1 }
      });

      const imgBuffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(outPath, imgBuffer);
      fs.writeFileSync(brainPath, imgBuffer);

      // Pós-validação: verifica dimensões via PNG header (bytes 16..24)
      const width = imgBuffer.readUInt32BE(16);
      const height = imgBuffer.readUInt32BE(20);

      if (width !== 1080 || height !== 1080) {
        throw new Error(`Falha na dimensão do slide ${slide.numero}: gerado com ${width}x${height}, esperado 1080x1080.`);
      }

      const sizeKb = Math.round(imgBuffer.length / 1024);
      console.log(`[Renderer] Salvo com sucesso: ${filename} (${width}x${height} px, ${sizeKb} KB)`);
      generatedFiles.push({ filename, outPath, brainPath, width, height, sizeKb, slideNum: slide.numero });
    }

    let zipInfo = null;

    // Se todos os 7 slides foram gerados e não houve restrição de zip
    if (generatedFiles.length === 7 && !options.skipZip) {
      const zipName = `ATHENA_${dateStr}_CARROSSEL.zip`;
      const zipPath = path.join(outDir, zipName);
      const brainZipPath = path.join(BRAIN_OUT_DIR, zipName);

      console.log(`\n[Zip] Consolidando os 7 slides em ${zipName}...`);
      const fileNames = generatedFiles.map(f => f.filename).join(' ');
      execSync(`tar -a -c -f "${zipPath}" -C "${outDir}" ${fileNames}`);

      fs.copyFileSync(zipPath, brainZipPath);
      const zipSizeKb = Math.round(fs.statSync(zipPath).size / 1024);
      console.log(`[Zip] Arquivo ZIP criado com sucesso: ${zipName} (${zipSizeKb} KB)`);
      zipInfo = { zipName, zipPath, zipSizeKb };
    }

    // Produz relatório de validação da execução
    const reportName = `ATHENA_${dateStr}_VALIDATION_REPORT.json`;
    const reportPath = path.join(outDir, reportName);
    const reportData = {
      editorial_id: content.meta.editorial_id,
      data_boletim: content.meta.data_boletim,
      disciplina: content.meta.disciplina,
      tema: content.meta.tema,
      content_sha256: validation.computedHash,
      timestamp_execucao: new Date().toISOString(),
      status: 'ART_GENERATED',
      slides_gerados: generatedFiles.map(g => ({
        slide_num: g.slideNum,
        arquivo: g.filename,
        dimensoes: `${g.width}x${g.height}`,
        tamanho_kb: g.sizeKb
      })),
      zip: zipInfo,
      warnings: validation.warnings
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
    console.log(`\n[Relatório] Relatório editorial gravado em: ${reportPath}`);

    return {
      validation,
      generatedFiles,
      zipInfo,
      reportPath
    };

  } finally {
    cdp.close();
    chrome.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

// Execução padrão via CLI
if (require.main === module) {
  const options = parseCliArgs();

  renderCarousel(options.input, options).then((res) => {
    console.log('\n======================================================');
    console.log(`✅ Concluído com Sucesso!`);
    if (res.generatedFiles.length > 0) {
      console.log(`Total de slides: ${res.generatedFiles.length} (1080x1080 PNG)`);
      console.log(`Pasta de saída:  ${options.output}`);
    }
    console.log('======================================================');
  }).catch((err) => {
    console.error('\n❌ [ERRO DE EXECUÇÃO]:', err.message);
    process.exit(1);
  });
}

module.exports = { renderCarousel, buildSlideHtml };
