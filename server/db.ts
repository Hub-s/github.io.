import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, members, checkIns, payments, assessments, InsertMember, InsertCheckIn, InsertPayment, InsertAssessment, Member, CheckIn, Payment, Assessment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== MEMBER QUERIES ====================

export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).orderBy(desc(members.createdAt));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function createMember(data: InsertMember): Promise<Member | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(members).values(data);
  const insertId = result[0].insertId;
  return getMemberById(insertId);
}

export async function updateMember(id: number, data: Partial<InsertMember>): Promise<Member | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(members).set(data).where(eq(members.id, id));
  return getMemberById(id);
}

export async function deleteMember(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(members).where(eq(members.id, id));
  return true;
}

export async function searchMembers(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members)
    .where(sql`${members.name} LIKE ${`%${query}%`} OR ${members.email} LIKE ${`%${query}%`} OR ${members.cpf} LIKE ${`%${query}%`}`)
    .orderBy(desc(members.createdAt));
}

export async function getMembersByStatus(status: 'active' | 'inactive' | 'defaulter') {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).where(eq(members.status, status)).orderBy(desc(members.createdAt));
}

// ==================== CHECK-IN QUERIES ====================

export async function getAllCheckIns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns).orderBy(desc(checkIns.checkInTime));
}

export async function getCheckInsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns).where(eq(checkIns.memberId, memberId)).orderBy(desc(checkIns.checkInTime));
}

export async function getTodayCheckIns() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return db.select({
    id: checkIns.id,
    memberId: checkIns.memberId,
    checkInTime: checkIns.checkInTime,
    memberName: members.name,
  })
    .from(checkIns)
    .leftJoin(members, eq(checkIns.memberId, members.id))
    .where(and(
      gte(checkIns.checkInTime, today),
      lte(checkIns.checkInTime, tomorrow)
    ))
    .orderBy(desc(checkIns.checkInTime));
}

export async function createCheckIn(data: InsertCheckIn): Promise<CheckIn | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(checkIns).values(data);
  const insertId = result[0].insertId;
  const checkIn = await db.select().from(checkIns).where(eq(checkIns.id, insertId)).limit(1);
  return checkIn[0];
}

// ==================== PAYMENT QUERIES ====================

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: payments.id,
    memberId: payments.memberId,
    amount: payments.amount,
    paymentDate: payments.paymentDate,
    dueDate: payments.dueDate,
    referenceMonth: payments.referenceMonth,
    paymentMethod: payments.paymentMethod,
    status: payments.status,
    description: payments.description,
    memberName: members.name,
  })
    .from(payments)
    .leftJoin(members, eq(payments.memberId, members.id))
    .orderBy(desc(payments.paymentDate));
}

export async function getPaymentsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.memberId, memberId)).orderBy(desc(payments.paymentDate));
}

export async function getPaymentsByStatus(status: 'pending' | 'paid' | 'overdue' | 'cancelled') {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: payments.id,
    memberId: payments.memberId,
    amount: payments.amount,
    paymentDate: payments.paymentDate,
    dueDate: payments.dueDate,
    referenceMonth: payments.referenceMonth,
    paymentMethod: payments.paymentMethod,
    status: payments.status,
    description: payments.description,
    memberName: members.name,
  })
    .from(payments)
    .leftJoin(members, eq(payments.memberId, members.id))
    .where(eq(payments.status, status))
    .orderBy(desc(payments.paymentDate));
}

export async function createPayment(data: InsertPayment): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(payments).values(data);
  const insertId = result[0].insertId;
  const payment = await db.select().from(payments).where(eq(payments.id, insertId)).limit(1);
  return payment[0];
}

export async function updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(payments).set(data).where(eq(payments.id, id));
  const payment = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return payment[0];
}

// ==================== ASSESSMENT QUERIES ====================

export async function getAllAssessments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: assessments.id,
    memberId: assessments.memberId,
    assessmentDate: assessments.assessmentDate,
    weight: assessments.weight,
    height: assessments.height,
    bodyFatPercentage: assessments.bodyFatPercentage,
    bmi: assessments.bmi,
    assessorName: assessments.assessorName,
    memberName: members.name,
  })
    .from(assessments)
    .leftJoin(members, eq(assessments.memberId, members.id))
    .orderBy(desc(assessments.assessmentDate));
}

export async function getAssessmentsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessments).where(eq(assessments.memberId, memberId)).orderBy(desc(assessments.assessmentDate));
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result[0];
}

export async function createAssessment(data: InsertAssessment): Promise<Assessment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(assessments).values(data);
  const insertId = result[0].insertId;
  return getAssessmentById(insertId);
}

export async function updateAssessment(id: number, data: Partial<InsertAssessment>): Promise<Assessment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(assessments).set(data).where(eq(assessments.id, id));
  return getAssessmentById(id);
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalMembers: 0, activeMembers: 0, checkInsToday: 0, defaulters: 0, monthlyRevenue: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalMembersResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(members);
  const [activeMembersResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(members).where(eq(members.status, 'active'));
  const [defaultersResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(members).where(eq(members.status, 'defaulter'));
  const [checkInsTodayResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(checkIns).where(and(
    gte(checkIns.checkInTime, today),
    lte(checkIns.checkInTime, tomorrow)
  ));

  // Monthly revenue
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [monthlyRevenueResult] = await db.select({ 
    total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` 
  }).from(payments).where(and(
    eq(payments.status, 'paid'),
    gte(payments.paymentDate, firstDayOfMonth),
    lte(payments.paymentDate, lastDayOfMonth)
  ));

  return {
    totalMembers: Number(totalMembersResult?.count ?? 0),
    activeMembers: Number(activeMembersResult?.count ?? 0),
    checkInsToday: Number(checkInsTodayResult?.count ?? 0),
    defaulters: Number(defaultersResult?.count ?? 0),
    monthlyRevenue: parseFloat(monthlyRevenueResult?.total ?? '0'),
  };
}
