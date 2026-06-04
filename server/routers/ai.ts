import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  analyzeAttendanceData,
  analyzeFinancialData,
  analyzeFeedback,
  generateRecommendations,
  generateWorkoutPlan,
  generateExecutiveReport,
  detectChurnRisk,
  generateMarketingContent,
  processCustomerQuestion,
} from '../integrations/openai';

/**
 * Router tRPC para funcionalidades de IA
 * 
 * Fornece endpoints para análise inteligente de dados usando OpenAI
 */

export const aiRouter = router({
  /**
   * Analisar dados de frequência
   */
  analyzeAttendance: protectedProcedure
    .input(
      z.object({
        totalMembers: z.number(),
        activeMembers: z.number(),
        checkInsThisMonth: z.number(),
        averageCheckInsPerMember: z.number(),
        peakHours: z.string(),
        leastBusyHours: z.string(),
        memberRetention: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeAttendanceData(input);
        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        console.error('[AI] Erro ao analisar frequência:', error);
        return {
          success: false,
          error: 'Erro ao analisar dados de frequência',
        };
      }
    }),

  /**
   * Analisar dados financeiros
   */
  analyzeFinancial: protectedProcedure
    .input(
      z.object({
        totalRevenue: z.number(),
        monthlyRecurring: z.number(),
        oneTimeRevenue: z.number().optional(),
        expenses: z.number(),
        profit: z.number(),
        defaultRate: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeFinancialData(input);
        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        console.error('[AI] Erro ao analisar financeiro:', error);
        return {
          success: false,
          error: 'Erro ao analisar dados financeiros',
        };
      }
    }),

  /**
   * Analisar feedback de clientes
   */
  analyzeFeedbackList: protectedProcedure
    .input(
      z.object({
        feedback: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeFeedback(input.feedback);
        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        console.error('[AI] Erro ao analisar feedback:', error);
        return {
          success: false,
          error: 'Erro ao analisar feedback',
        };
      }
    }),

  /**
   * Gerar recomendações personalizadas
   */
  generateRecommendations: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        name: z.string(),
        age: z.number(),
        goal: z.string(),
        fitnessLevel: z.string(),
        frequency: z.string(),
        injuries: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const recommendations = await generateRecommendations(input);
        return {
          success: true,
          data: recommendations,
        };
      } catch (error) {
        console.error('[AI] Erro ao gerar recomendações:', error);
        return {
          success: false,
          error: 'Erro ao gerar recomendações',
        };
      }
    }),

  /**
   * Gerar plano de treino
   */
  generateWorkout: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        name: z.string(),
        goal: z.string(),
        experience: z.string(),
        frequency: z.number(),
        duration: z.number(),
        equipment: z.string().optional(),
        injuries: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const plan = await generateWorkoutPlan(input);
        return {
          success: true,
          data: plan,
        };
      } catch (error) {
        console.error('[AI] Erro ao gerar plano de treino:', error);
        return {
          success: false,
          error: 'Erro ao gerar plano de treino',
        };
      }
    }),

  /**
   * Gerar relatório executivo
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        type: z.enum(['financial', 'attendance', 'churn', 'marketing']),
        period: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const report = await generateExecutiveReport(input.data, input.type);
        return {
          success: true,
          data: report,
        };
      } catch (error) {
        console.error('[AI] Erro ao gerar relatório:', error);
        return {
          success: false,
          error: 'Erro ao gerar relatório',
        };
      }
    }),

  /**
   * Detectar risco de churn
   */
  detectChurn: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        name: z.string(),
        joinDate: z.string(),
        lastCheckIn: z.string(),
        checkInsLastMonth: z.number(),
        paymentStatus: z.string(),
        contractStatus: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const risk = await detectChurnRisk(input);
        return {
          success: true,
          data: risk,
        };
      } catch (error) {
        console.error('[AI] Erro ao detectar churn:', error);
        return {
          success: false,
          error: 'Erro ao detectar risco de churn',
        };
      }
    }),

  /**
   * Gerar conteúdo de marketing
   */
  generateMarketing: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        audience: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const content = await generateMarketingContent(input.topic, input.audience);
        return {
          success: true,
          data: content,
        };
      } catch (error) {
        console.error('[AI] Erro ao gerar conteúdo:', error);
        return {
          success: false,
          error: 'Erro ao gerar conteúdo de marketing',
        };
      }
    }),

  /**
   * Processar pergunta de atendimento
   */
  processQuestion: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await processCustomerQuestion(input.question, input.context);
        return {
          success: true,
          data: response,
        };
      } catch (error) {
        console.error('[AI] Erro ao processar pergunta:', error);
        return {
          success: false,
          error: 'Erro ao processar pergunta',
        };
      }
    }),

  /**
   * Listar capacidades de IA disponíveis
   */
  getCapabilities: protectedProcedure
    .input(z.void())
    .query(async () => {
    return {
      capabilities: [
        {
          id: 'analyze-attendance',
          name: 'Análise de Frequência',
          description: 'Analisa dados de frequência e fornece insights',
          category: 'analytics',
        },
        {
          id: 'analyze-financial',
          name: 'Análise Financeira',
          description: 'Analisa dados financeiros e recomendações',
          category: 'analytics',
        },
        {
          id: 'analyze-feedback',
          name: 'Análise de Feedback',
          description: 'Analisa feedback de clientes',
          category: 'analytics',
        },
        {
          id: 'generate-recommendations',
          name: 'Recomendações Personalizadas',
          description: 'Gera recomendações para membros',
          category: 'generation',
        },
        {
          id: 'generate-workout',
          name: 'Plano de Treino',
          description: 'Gera planos de treino personalizados',
          category: 'generation',
        },
        {
          id: 'generate-report',
          name: 'Relatório Executivo',
          description: 'Gera relatórios detalhados',
          category: 'generation',
        },
        {
          id: 'detect-churn',
          name: 'Detecção de Churn',
          description: 'Detecta risco de evasão de membros',
          category: 'analytics',
        },
        {
          id: 'generate-marketing',
          name: 'Conteúdo de Marketing',
          description: 'Gera conteúdo para redes sociais',
          category: 'generation',
        },
        {
          id: 'process-question',
          name: 'Atendimento ao Cliente',
          description: 'Processa perguntas de clientes',
          category: 'support',
        },
      ],
    };
  }),
});
