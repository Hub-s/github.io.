import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { createCheckoutSession } from "./stripe/checkout";
import { generateFinancialReportData, formatCurrency, getPaymentMethodLabel, getStatusLabel } from "./reports/financial";
import { aiRouter } from "./routers/ai";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Dashboard Router
  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    getRecentCheckIns: protectedProcedure.query(async () => {
      return db.getTodayCheckIns();
    }),
  }),

  // Members Router
  members: router({
    list: protectedProcedure.query(async () => {
      return db.getAllMembers();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMemberById(input.id);
      }),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return db.searchMembers(input.query);
      }),
    getByStatus: protectedProcedure
      .input(z.object({ status: z.enum(['active', 'inactive', 'defaulter']) }))
      .query(async ({ input }) => {
        return db.getMembersByStatus(input.status);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        cpf: z.string().optional().nullable(),
        birthDate: z.string().optional().nullable(),
        gender: z.enum(['male', 'female', 'other']).optional().nullable(),
        address: z.string().optional().nullable(),
        emergencyContact: z.string().optional().nullable(),
        emergencyPhone: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive', 'defaulter']).optional(),
        planType: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']).optional(),
        planValue: z.string().optional().nullable(),
        planStartDate: z.string().optional().nullable(),
        planEndDate: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const member = await db.createMember({
          ...input,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          planStartDate: input.planStartDate ? new Date(input.planStartDate) : null,
          planEndDate: input.planEndDate ? new Date(input.planEndDate) : null,
        });
        
        // Send notification to owner
        if (member) {
          await notifyOwner({
            title: "Novo Membro Cadastrado",
            content: `Um novo membro foi cadastrado: ${member.name}${member.email ? ` (${member.email})` : ''}`,
          });
        }
        
        return member;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        cpf: z.string().optional().nullable(),
        birthDate: z.string().optional().nullable(),
        gender: z.enum(['male', 'female', 'other']).optional().nullable(),
        address: z.string().optional().nullable(),
        emergencyContact: z.string().optional().nullable(),
        emergencyPhone: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive', 'defaulter']).optional(),
        planType: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']).optional(),
        planValue: z.string().optional().nullable(),
        planStartDate: z.string().optional().nullable(),
        planEndDate: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateMember(id, {
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          planStartDate: data.planStartDate ? new Date(data.planStartDate) : undefined,
          planEndDate: data.planEndDate ? new Date(data.planEndDate) : undefined,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteMember(input.id);
      }),
  }),

  // Check-ins Router
  checkIns: router({
    list: protectedProcedure.query(async () => {
      return db.getAllCheckIns();
    }),
    getByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return db.getCheckInsByMember(input.memberId);
      }),
    getToday: protectedProcedure.query(async () => {
      return db.getTodayCheckIns();
    }),
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        return db.createCheckIn(input);
      }),
  }),

  // Payments Router
  payments: router({
    list: protectedProcedure.query(async () => {
      return db.getAllPayments();
    }),
    getByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return db.getPaymentsByMember(input.memberId);
      }),
    getByStatus: protectedProcedure
      .input(z.object({ status: z.enum(['pending', 'paid', 'overdue', 'cancelled']) }))
      .query(async ({ input }) => {
        return db.getPaymentsByStatus(input.status);
      }),
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        amount: z.string(),
        dueDate: z.string().optional().nullable(),
        referenceMonth: z.string().optional().nullable(),
        paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'stripe']).optional(),
        status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
        description: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const payment = await db.createPayment({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        });
        
        // Send notification for paid payments
        if (payment && input.status === 'paid') {
          const member = await db.getMemberById(input.memberId);
          await notifyOwner({
            title: "Pagamento Recebido",
            content: `Pagamento de R$ ${input.amount} recebido de ${member?.name || 'Membro'}`,
          });
        }
        
        return payment;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        dueDate: z.string().optional().nullable(),
        referenceMonth: z.string().optional().nullable(),
        paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'stripe']).optional(),
        status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
        description: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updatePayment(id, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        });
      }),
  }),

  // Stripe Router
  stripe: router({
    createCheckout: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        planType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const member = await db.getMemberById(input.memberId);
        if (!member) {
          throw new Error('Membro não encontrado');
        }
        
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        const checkoutUrl = await createCheckoutSession({
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          planType: input.planType,
          origin,
        });
        
        return { url: checkoutUrl };
      }),
  }),

  // Reports Router
  reports: router({
    financialReport: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const data = await generateFinancialReportData(startDate, endDate);
        return data;
      }),
  }),

  // AI Router
  ai: aiRouter,

  // Notifications Router
  notifications: notificationsRouter,

  // Assessments Router
  assessments: router({
    list: protectedProcedure.query(async () => {
      return db.getAllAssessments();
    }),
    getByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return db.getAssessmentsByMember(input.memberId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAssessmentById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        weight: z.string().optional().nullable(),
        height: z.string().optional().nullable(),
        bodyFatPercentage: z.string().optional().nullable(),
        muscleMass: z.string().optional().nullable(),
        chest: z.string().optional().nullable(),
        waist: z.string().optional().nullable(),
        hips: z.string().optional().nullable(),
        rightArm: z.string().optional().nullable(),
        leftArm: z.string().optional().nullable(),
        rightThigh: z.string().optional().nullable(),
        leftThigh: z.string().optional().nullable(),
        rightCalf: z.string().optional().nullable(),
        leftCalf: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        assessorName: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        // Calculate BMI if weight and height are provided
        let bmi: string | null = null;
        if (input.weight && input.height) {
          const weightNum = parseFloat(input.weight);
          const heightNum = parseFloat(input.height) / 100; // Convert cm to m
          if (heightNum > 0) {
            bmi = (weightNum / (heightNum * heightNum)).toFixed(2);
          }
        }
        
        return db.createAssessment({
          ...input,
          bmi,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        weight: z.string().optional().nullable(),
        height: z.string().optional().nullable(),
        bodyFatPercentage: z.string().optional().nullable(),
        muscleMass: z.string().optional().nullable(),
        chest: z.string().optional().nullable(),
        waist: z.string().optional().nullable(),
        hips: z.string().optional().nullable(),
        rightArm: z.string().optional().nullable(),
        leftArm: z.string().optional().nullable(),
        rightThigh: z.string().optional().nullable(),
        leftThigh: z.string().optional().nullable(),
        rightCalf: z.string().optional().nullable(),
        leftCalf: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        assessorName: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Recalculate BMI if weight or height changed
        let bmi: string | undefined;
        if (data.weight && data.height) {
          const weightNum = parseFloat(data.weight);
          const heightNum = parseFloat(data.height) / 100;
          if (heightNum > 0) {
            bmi = (weightNum / (heightNum * heightNum)).toFixed(2);
          }
        }
        
        return db.updateAssessment(id, {
          ...data,
          bmi,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
