const getApiUrl = (endpoint: string): string => {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${endpoint}`;
};

export async function askATHENA(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
): Promise<string> {
  try {
    const response = await fetch(getApiUrl('/api/ask-athena'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, userName, file, mentorshipStyle, mentorshipPhase })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro de conexão HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.responseText;
  } catch (error: any) {
    console.error("Erro na comunicação com ATHENA:", error);
    throw error;
  }
}

export async function evaluateAnswer(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: 'subjetiva' | 'oral',
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: any }> {
  try {
    const response = await fetch(getApiUrl('/api/evaluate-answer'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionText, userAnswer, referenceResponse, phase, userName })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro de conexão HTTP para Avaliação: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Erro na comunicação com ATHENA para Avaliação:", error);
    throw error;
  }
}
