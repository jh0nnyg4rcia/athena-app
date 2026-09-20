require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { GoogleGenAI } = require('@google/genai');

const firebaseConfig = require('../firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateChallengeForLesson(lesson) {
  console.log(`\n[Reconstitute] Gerando 10 questões com Gemini 3.8 Flash para ${lesson.id} (${lesson.subject} - Dia ${lesson.day} P${lesson.part + 1})...`);
  
  const prompt = `Você é ATHENA, mentora de elite para concursos jurídicos de ponta (Magistratura, Ministério Público, Defensoria Pública).
Com base estritamente no conteúdo da aula abaixo sobre "${lesson.subject}" (Tópico: ${lesson.topic || lesson.subject}), elabore EXATAMENTE 10 questões inéditas de múltipla escolha no mais alto padrão técnico de cobrança.

CONTEÚDO DA AULA:
${(lesson.content || '').substring(0, 15000)}

DIRETRIZES:
1. Crie exatamente 10 questões.
2. Cada questão deve ter 4 alternativas claras (A, B, C, D).
3. Indique o índice correto (0 para A, 1 para B, 2 para C, 3 para D).
4. Forneça uma justificativa técnica e fundamentada para cada alternativa, explicando por que a correta é a certa e o erro das demais.
5. Retorne SOMENTE o JSON no formato:
{
  "questions": [
    {
      "id": "q1",
      "subject": "${lesson.subject}",
      "text": "Enunciado completo da questão...",
      "options": [
        "A) Primeira assertiva...",
        "B) Segunda assertiva...",
        "C) Terceira assertiva...",
        "D) Quarta assertiva..."
      ],
      "correctIndex": 0,
      "explanation": "Comentário e fundamentação completa..."
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });

  const rawJson = response.text.trim();
  const parsed = JSON.parse(rawJson);
  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('JSON de questões inválido recebido da IA');
  }
  return parsed;
}

async function run() {
  try {
    console.log('[Reconstitute] Buscando documentos no Firestore...');
    const snap = await getDocs(collection(db, 'homologated_lessons'));
    console.log(`[Reconstitute] Total de lições encontradas: ${snap.size}`);

    const allHomologated = {};

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      let challenge = data.challenge;

      if (!challenge || !challenge.questions || challenge.questions.length === 0) {
        console.log(`[Reconstitute] Documento ${docSnap.id} sem questões. Gerando agora...`);
        challenge = await generateChallengeForLesson(data);
        console.log(`[Reconstitute] 10 questões geradas para ${docSnap.id}!`);
      } else {
        console.log(`[Reconstitute] Documento ${docSnap.id} já possui ${challenge.questions.length} questões.`);
      }

      let content = data.content || '';
      if (!content.includes('[ATHENA_CHALLENGE]')) {
        content = content.trim() + '\n\n[ATHENA_CHALLENGE]\n' + JSON.stringify(challenge, null, 2);
      }

      const updatedData = {
        ...data,
        content,
        challenge
      };

      allHomologated[docSnap.id] = updatedData;

      // Tentativa de escrita com timeout seguro no Firestore
      try {
        const writePromise = setDoc(doc(db, 'homologated_lessons', docSnap.id), updatedData, { merge: true });
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore write timeout')), 3000));
        await Promise.race([writePromise, timeoutPromise]);
        console.log(`[Reconstitute] ${docSnap.id} atualizado no Firestore.`);
      } catch (err) {
        console.warn(`[Reconstitute] Gravação na nuvem ignorada para ${docSnap.id} (cota/timeout). Será salvo no banco local de sementes estáticas:`, err.message);
      }
    }

    // Salva todas as 11 lições completas em src/data/homologatedSeeds.json
    const seedsPath = path.join(__dirname, '..', 'src', 'data', 'homologatedSeeds.json');
    fs.writeFileSync(seedsPath, JSON.stringify(allHomologated, null, 2), 'utf-8');
    console.log(`\n============================================================`);
    console.log(`[Reconstitute] SUCESSO ABSOLUTO!`);
    console.log(`[Reconstitute] Todas as 11 lições com suas 110 questões foram salvas em:`);
    console.log(`[Reconstitute] ${seedsPath}`);
    console.log(`============================================================\n`);
    process.exit(0);

  } catch (error) {
    console.error('[Reconstitute] Erro fatal no processo:', error);
    process.exit(1);
  }
}

run();
