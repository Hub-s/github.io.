import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { notifications, notificationPreferences, InsertNotification, Notification, NotificationPreference } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Criar uma nova notificação
 */
export async function createNotification(data: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notifications).values(data);
    const notificationId = (result[0] as any)?.insertId || result[0];
    
    if (!notificationId) return null;
    
    const created = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId as number))
      .limit(1);
    
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Obter notificações do usuário
 */
export async function getUserNotifications(userId: number, limit = 20, offset = 0): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get user notifications:", error);
    throw error;
  }
}

/**
 * Obter notificações não lidas do usuário
 */
export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, "false")
        )
      )
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get unread notifications:", error);
    throw error;
  }
}

/**
 * Contar notificações não lidas
 */
export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, "false")
        )
      );
    
    return result.length;
  } catch (error) {
    console.error("[Database] Failed to count unread notifications:", error);
    throw error;
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: number): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(notifications)
      .set({ isRead: "true", readAt: new Date() })
      .where(eq(notifications.id, notificationId));
    
    const updated = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);
    
    return updated[0] || null;
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(notifications)
      .set({ isRead: "true", readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, "false")
        )
      );
  } catch (error) {
    console.error("[Database] Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("[Database] Failed to delete notification:", error);
    throw error;
  }
}

/**
 * Deletar todas as notificações de um usuário
 */
export async function deleteAllUserNotifications(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to delete all user notifications:", error);
    throw error;
  }
}

/**
 * Obter preferências de notificação do usuário
 */
export async function getNotificationPreferences(userId: number): Promise<NotificationPreference | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get notification preferences:", error);
    throw error;
  }
}

/**
 * Criar preferências de notificação padrão para novo usuário
 */
export async function createDefaultNotificationPreferences(userId: number): Promise<NotificationPreference | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notificationPreferences).values({
      userId,
      memberCreatedEmail: "true",
      memberCreatedInApp: "true",
      paymentReceivedEmail: "true",
      paymentReceivedInApp: "true",
      paymentOverdueEmail: "true",
      paymentOverdueInApp: "true",
      checkInEmail: "false",
      checkInInApp: "true",
      assessmentEmail: "false",
      assessmentInApp: "true",
      systemAlertEmail: "true",
      systemAlertInApp: "true",
    });

    const prefId = (result[0] as any)?.insertId || result[0];
    if (!prefId) return null;

    const created = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.id, prefId as number))
      .limit(1);
    
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create default notification preferences:", error);
    throw error;
  }
}

/**
 * Atualizar preferências de notificação
 */
export async function updateNotificationPreferences(
  userId: number,
  updates: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<NotificationPreference | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(notificationPreferences)
      .set(updates)
      .where(eq(notificationPreferences.userId, userId));
    
    return getNotificationPreferences(userId);
  } catch (error) {
    console.error("[Database] Failed to update notification preferences:", error);
    throw error;
  }
}

/**
 * Obter notificações por tipo
 */
export async function getNotificationsByType(
  userId: number,
  type: string,
  limit = 10
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, type as any)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get notifications by type:", error);
    throw error;
  }
}

/**
 * Obter notificações por prioridade
 */
export async function getNotificationsByPriority(
  userId: number,
  priority: string,
  limit = 10
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.priority, priority as any)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get notifications by priority:", error);
    throw error;
  }
}
