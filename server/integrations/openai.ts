import { invokeLLM } from '../_core/llm';

/**
 * Cliente para integração com OpenAI API
 * 
 * Responsável por fornecer funcionalidades de IA ao GymHub
 */

export interface AIAnalysisRequest {
  type: 'attendance' | 'financial' | 'feedback' | 'recommendation' | 'report';
  data: any;
  context?: string;
}

export interface AIAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * Analisar dados de frequência
 */
export async function analyzeAttendanceData(data: any): Promise<AIAnalysisResponse> {
  try {
    const prompt = `Analise estes dados de frequência de academia e forneça insights:

${JSON.stringify(data, null, 2)}

Forneça:
1. Análise geral da frequência
2. 3-5 insights principais
3. 3-5 recomendações de ação
4. Score de confiança (0-100)

Responda em JSON com estrutura: { analysis, insights[], recommendations[], confidence }`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista especializado em dados de academias e fitness.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'attendance_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              analysis: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
            },
            required: ['analysis', 'insights', 'recommendations', 'confidence'],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao analisar frequência:', error);
    throw error;
  }
}

/**
 * Analisar dados financeiros
 */
export async function analyzeFinancialData(data: any): Promise<AIAnalysisResponse> {
  try {
    const prompt = `Analise estes dados financeiros de academia e forneça insights:

${JSON.stringify(data, null, 2)}

Forneça:
1. Análise da saúde financeira
2. 3-5 insights principais
3. 3-5 recomendações de ação
4. Score de confiança (0-100)

Responda em JSON com estrutura: { analysis, insights[], recommendations[], confidence }`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista financeiro especializado em negócios de fitness.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'financial_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              analysis: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
            },
            required: ['analysis', 'insights', 'recommendations', 'confidence'],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao analisar financeiro:', error);
    throw error;
  }
}

/**
 * Analisar feedback de clientes
 */
export async function analyzeFeedback(feedbackList: string[]): Promise<AIAnalysisResponse> {
  try {
    const prompt = `Analise este feedback de clientes de academia:

${feedbackList.map((f, i) => `${i + 1}. "${f}"`).join('\n')}

Forneça:
1. Análise geral do sentimento
2. 3-5 insights principais
3. 3-5 recomendações de melhoria
4. Score de confiança (0-100)

Responda em JSON com estrutura: { analysis, insights[], recommendations[], confidence }`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de feedback e satisfação de clientes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'feedback_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              analysis: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
            },
            required: ['analysis', 'insights', 'recommendations', 'confidence'],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao analisar feedback:', error);
    throw error;
  }
}

/**
 * Gerar recomendações personalizadas
 */
export async function generateRecommendations(memberProfile: any): Promise<string[]> {
  try {
    const prompt = `Baseado neste perfil de membro, gere recomendações personalizadas:

${JSON.stringify(memberProfile, null, 2)}

Forneça 5 recomendações práticas e personalizadas em formato de array JSON.
Responda apenas com: ["recomendação 1", "recomendação 2", ...]`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um personal trainer e nutricionista especializado em fitness.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao gerar recomendações:', error);
    throw error;
  }
}

/**
 * Gerar plano de treino
 */
export async function generateWorkoutPlan(memberData: any): Promise<string> {
  try {
    const prompt = `Crie um plano de treino personalizado para este membro:

${JSON.stringify(memberData, null, 2)}

Inclua:
1. Aquecimento (5 min)
2. Exercícios principais (com séries e repetições)
3. Descanso entre séries
4. Resfriamento (5 min)
5. Dicas de nutrição

Formate de forma clara e prática.`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um personal trainer certificado especializado em programação de treino.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('[OpenAI] Erro ao gerar plano de treino:', error);
    throw error;
  }
}

/**
 * Gerar relatório executivo
 */
export async function generateExecutiveReport(data: any, reportType: string): Promise<string> {
  try {
    const prompt = `Gere um relatório executivo sobre ${reportType}:

${JSON.stringify(data, null, 2)}

Inclua:
1. Resumo executivo
2. Principais métricas
3. Análise de tendências
4. Recomendações estratégicas
5. Próximos passos

Formate de forma profissional.`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de negócios especializado em academias e fitness.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('[OpenAI] Erro ao gerar relatório:', error);
    throw error;
  }
}

/**
 * Detectar risco de churn (evasão)
 */
export async function detectChurnRisk(memberData: any): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  reasons: string[];
  interventions: string[];
}> {
  try {
    const prompt = `Analise o risco de evasão (churn) para este membro:

${JSON.stringify(memberData, null, 2)}

Forneça:
1. Nível de risco (low, medium, high)
2. Score de risco (0-100)
3. Razões do risco
4. Ações de intervenção recomendadas

Responda em JSON com estrutura: { riskLevel, riskScore, reasons[], interventions[] }`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em retenção de clientes em academias.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'churn_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
              riskScore: { type: 'number' },
              reasons: { type: 'array', items: { type: 'string' } },
              interventions: { type: 'array', items: { type: 'string' } },
            },
            required: ['riskLevel', 'riskScore', 'reasons', 'interventions'],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao detectar churn:', error);
    throw error;
  }
}

/**
 * Gerar conteúdo de marketing
 */
export async function generateMarketingContent(topic: string, audience: string): Promise<string[]> {
  try {
    const prompt = `Gere 3 posts para redes sociais (Instagram) sobre: ${topic}
Público alvo: ${audience}

Inclua:
- Texto atrativo
- Call-to-action
- Hashtags relevantes

Responda como array JSON de strings.`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing digital para academias.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[OpenAI] Erro ao gerar conteúdo de marketing:', error);
    throw error;
  }
}

/**
 * Processar pergunta de atendimento ao cliente
 */
export async function processCustomerQuestion(question: string, context?: string): Promise<string> {
  try {
    const messages: any[] = [
      {
        role: 'system',
        content: 'Você é um assistente de atendimento ao cliente de academia. Seja amigável, profissional e útil.',
      },
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Contexto da academia: ${context}`,
      });
    }

    messages.push({
      role: 'user',
      content: question,
    });

    const response = await invokeLLM({ messages });
    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('[OpenAI] Erro ao processar pergunta:', error);
    throw error;
  }
}
