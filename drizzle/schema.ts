import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Members table - gym members information
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: date("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  address: text("address"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  photoUrl: text("photoUrl"),
  status: mysqlEnum("status", ["active", "inactive", "defaulter"]).default("active").notNull(),
  planType: mysqlEnum("planType", ["monthly", "quarterly", "semiannual", "annual"]).default("monthly"),
  planValue: decimal("planValue", { precision: 10, scale: 2 }),
  planStartDate: date("planStartDate"),
  planEndDate: date("planEndDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * Check-ins table - member attendance records
 */
export const checkIns = mysqlTable("checkIns", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  checkInTime: timestamp("checkInTime").defaultNow().notNull(),
  checkOutTime: timestamp("checkOutTime"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Payments table - financial transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  dueDate: date("dueDate"),
  referenceMonth: varchar("referenceMonth", { length: 7 }), // Format: YYYY-MM
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "credit_card", "debit_card", "pix", "bank_transfer", "stripe"]).default("cash"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Physical assessments table - member body measurements
 */
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }), // kg
  height: decimal("height", { precision: 5, scale: 2 }), // cm
  bodyFatPercentage: decimal("bodyFatPercentage", { precision: 5, scale: 2 }),
  muscleMass: decimal("muscleMass", { precision: 5, scale: 2 }), // kg
  chest: decimal("chest", { precision: 5, scale: 2 }), // cm
  waist: decimal("waist", { precision: 5, scale: 2 }), // cm
  hips: decimal("hips", { precision: 5, scale: 2 }), // cm
  rightArm: decimal("rightArm", { precision: 5, scale: 2 }), // cm
  leftArm: decimal("leftArm", { precision: 5, scale: 2 }), // cm
  rightThigh: decimal("rightThigh", { precision: 5, scale: 2 }), // cm
  leftThigh: decimal("leftThigh", { precision: 5, scale: 2 }), // cm
  rightCalf: decimal("rightCalf", { precision: 5, scale: 2 }), // cm
  leftCalf: decimal("leftCalf", { precision: 5, scale: 2 }), // cm
  bmi: decimal("bmi", { precision: 5, scale: 2 }), // calculated
  notes: text("notes"),
  assessorName: varchar("assessorName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

/**
 * Notifications table - user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "member_created",
    "member_updated",
    "member_deleted",
    "payment_received",
    "payment_overdue",
    "payment_pending",
    "check_in",
    "assessment_created",
    "assessment_updated",
    "system_alert",
    "custom"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  isRead: mysqlEnum("isRead", ["true", "false"]).default("false").notNull(),
  actionUrl: text("actionUrl"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences table - user notification settings
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  memberCreatedEmail: mysqlEnum("memberCreatedEmail", ["true", "false"]).default("true").notNull(),
  memberCreatedInApp: mysqlEnum("memberCreatedInApp", ["true", "false"]).default("true").notNull(),
  paymentReceivedEmail: mysqlEnum("paymentReceivedEmail", ["true", "false"]).default("true").notNull(),
  paymentReceivedInApp: mysqlEnum("paymentReceivedInApp", ["true", "false"]).default("true").notNull(),
  paymentOverdueEmail: mysqlEnum("paymentOverdueEmail", ["true", "false"]).default("true").notNull(),
  paymentOverdueInApp: mysqlEnum("paymentOverdueInApp", ["true", "false"]).default("true").notNull(),
  checkInEmail: mysqlEnum("checkInEmail", ["true", "false"]).default("false").notNull(),
  checkInInApp: mysqlEnum("checkInInApp", ["true", "false"]).default("true").notNull(),
  assessmentEmail: mysqlEnum("assessmentEmail", ["true", "false"]).default("false").notNull(),
  assessmentInApp: mysqlEnum("assessmentInApp", ["true", "false"]).default("true").notNull(),
  systemAlertEmail: mysqlEnum("systemAlertEmail", ["true", "false"]).default("true").notNull(),
  systemAlertInApp: mysqlEnum("systemAlertInApp", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
