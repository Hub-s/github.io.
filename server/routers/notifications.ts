import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import * as dbNotifications from '../db-notifications';

/**
 * Router tRPC para notificações
 */
export const notificationsRouter = router({
  /**
   * Listar notificações do usuário
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return dbNotifications.getUserNotifications(ctx.user.id, input.limit, input.offset);
    }),

  /**
   * Obter notificações não lidas
   */
  unread: protectedProcedure.query(async ({ ctx }) => {
    return dbNotifications.getUnreadNotifications(ctx.user.id);
  }),

  /**
   * Contar notificações não lidas
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await dbNotifications.countUnreadNotifications(ctx.user.id);
    return { count };
  }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return dbNotifications.markNotificationAsRead(input.id);
    }),

  /**
   * Marcar todas as notificações como lidas
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await dbNotifications.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Deletar notificação
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await dbNotifications.deleteNotification(input.id);
      return { success: true };
    }),

  /**
   * Deletar todas as notificações
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await dbNotifications.deleteAllUserNotifications(ctx.user.id);
    return { success: true };
  }),

  /**
   * Obter preferências de notificação
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    let preferences = await dbNotifications.getNotificationPreferences(ctx.user.id);
    
    // Se não existir, criar preferências padrão
    if (!preferences) {
      preferences = await dbNotifications.createDefaultNotificationPreferences(ctx.user.id);
    }
    
    return preferences;
  }),

  /**
   * Atualizar preferências de notificação
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        memberCreatedEmail: z.enum(['true', 'false']).optional(),
        memberCreatedInApp: z.enum(['true', 'false']).optional(),
        paymentReceivedEmail: z.enum(['true', 'false']).optional(),
        paymentReceivedInApp: z.enum(['true', 'false']).optional(),
        paymentOverdueEmail: z.enum(['true', 'false']).optional(),
        paymentOverdueInApp: z.enum(['true', 'false']).optional(),
        checkInEmail: z.enum(['true', 'false']).optional(),
        checkInInApp: z.enum(['true', 'false']).optional(),
        assessmentEmail: z.enum(['true', 'false']).optional(),
        assessmentInApp: z.enum(['true', 'false']).optional(),
        systemAlertEmail: z.enum(['true', 'false']).optional(),
        systemAlertInApp: z.enum(['true', 'false']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return dbNotifications.updateNotificationPreferences(ctx.user.id, input);
    }),

  /**
   * Obter notificações por tipo
   */
  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'member_created',
          'member_updated',
          'member_deleted',
          'payment_received',
          'payment_overdue',
          'payment_pending',
          'check_in',
          'assessment_created',
          'assessment_updated',
          'system_alert',
          'custom',
        ]),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      return dbNotifications.getNotificationsByType(ctx.user.id, input.type, input.limit);
    }),

  /**
   * Obter notificações por prioridade
   */
  getByPriority: protectedProcedure
    .input(
      z.object({
        priority: z.enum(['low', 'normal', 'high', 'critical']),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      return dbNotifications.getNotificationsByPriority(ctx.user.id, input.priority, input.limit);
    }),

  /**
   * Listar tipos de notificações disponíveis
   */
  getTypes: protectedProcedure.query(() => {
    return {
      types: [
        { id: 'member_created', label: 'Novo Membro', icon: 'Users' },
        { id: 'member_updated', label: 'Membro Atualizado', icon: 'UserCheck' },
        { id: 'member_deleted', label: 'Membro Removido', icon: 'UserX' },
        { id: 'payment_received', label: 'Pagamento Recebido', icon: 'CheckCircle' },
        { id: 'payment_overdue', label: 'Pagamento Vencido', icon: 'AlertCircle' },
        { id: 'payment_pending', label: 'Pagamento Pendente', icon: 'Clock' },
        { id: 'check_in', label: 'Check-in Realizado', icon: 'LogIn' },
        { id: 'assessment_created', label: 'Avaliação Criada', icon: 'Clipboard' },
        { id: 'assessment_updated', label: 'Avaliação Atualizada', icon: 'ClipboardCheck' },
        { id: 'system_alert', label: 'Alerta do Sistema', icon: 'AlertTriangle' },
        { id: 'custom', label: 'Notificação Customizada', icon: 'Bell' },
      ],
    };
  }),

  /**
   * Listar prioridades disponíveis
   */
  getPriorities: protectedProcedure.query(() => {
    return {
      priorities: [
        { id: 'low', label: 'Baixa', color: 'blue' },
        { id: 'normal', label: 'Normal', color: 'gray' },
        { id: 'high', label: 'Alta', color: 'orange' },
        { id: 'critical', label: 'Crítica', color: 'red' },
      ],
    };
  }),
});
