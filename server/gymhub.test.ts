import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAllMembers: vi.fn().mockResolvedValue([
    { id: 1, name: "João Silva", email: "joao@test.com", status: "active" },
    { id: 2, name: "Maria Santos", email: "maria@test.com", status: "inactive" },
  ]),
  getMemberById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        name: "João Silva",
        email: "joao@test.com",
        phone: "11999999999",
        status: "active",
        planType: "monthly",
        createdAt: new Date(),
      });
    }
    return Promise.resolve(null);
  }),
  searchMembers: vi.fn().mockResolvedValue([
    { id: 1, name: "João Silva", email: "joao@test.com", status: "active" },
  ]),
  createMember: vi.fn().mockResolvedValue({ id: 3, name: "Novo Membro", email: "novo@test.com", status: "active" }),
  updateMember: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalMembers: 10,
    activeMembers: 8,
    checkInsToday: 5,
    defaulters: 2,
    monthlyRevenue: 1500.00,
  }),
  getRecentCheckIns: vi.fn().mockResolvedValue([
    { id: 1, memberName: "João Silva", checkInTime: new Date() },
  ]),
  getTodayCheckIns: vi.fn().mockResolvedValue([
    { id: 1, memberId: 1, memberName: "João Silva", checkInTime: new Date() },
  ]),
  createCheckIn: vi.fn().mockResolvedValue({ id: 1, memberId: 1, checkInTime: new Date() }),
  getAllPayments: vi.fn().mockResolvedValue([
    { id: 1, memberId: 1, memberName: "João Silva", amount: "99.00", status: "paid", paymentMethod: "pix" },
  ]),
  getPaymentsByStatus: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn().mockResolvedValue({ id: 1, memberId: 1, amount: "99.00", status: "paid" }),
  updatePayment: vi.fn().mockResolvedValue(undefined),
  getAllAssessments: vi.fn().mockResolvedValue([]),
  createAssessment: vi.fn().mockResolvedValue(1),
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock Stripe checkout
vi.mock("./stripe/checkout", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue("https://checkout.stripe.com/test"),
}));

// Mock reports
vi.mock("./reports/financial", () => ({
  generateFinancialReportData: vi.fn().mockResolvedValue({
    period: { start: "2025-01-01", end: "2025-01-31" },
    summary: {
      totalRevenue: 5000,
      totalPaid: 4000,
      totalPending: 800,
      totalOverdue: 200,
      totalTransactions: 50,
    },
    byPaymentMethod: [{ method: "pix", count: 30, total: 3000 }],
    byStatus: [{ status: "paid", count: 40, total: 4000 }],
    recentTransactions: [],
    defaulters: [],
  }),
  formatCurrency: vi.fn((v) => `R$ ${v.toFixed(2)}`),
  getPaymentMethodLabel: vi.fn((m) => m),
  getStatusLabel: vi.fn((s) => s),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "admin@gymhub.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://gymhub.test",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("GymHub Dashboard", () => {
  it("returns dashboard stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalMembers).toBe(10);
    expect(stats.activeMembers).toBe(8);
    expect(stats.checkInsToday).toBe(5);
    expect(stats.defaulters).toBe(2);
    expect(stats.monthlyRevenue).toBe(1500.00);
  });

  it("returns recent check-ins", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const checkIns = await caller.dashboard.getRecentCheckIns();

    expect(checkIns).toBeDefined();
    expect(Array.isArray(checkIns)).toBe(true);
    expect(checkIns.length).toBeGreaterThan(0);
    expect(checkIns[0]).toHaveProperty("memberName");
  });
});

describe("GymHub Members", () => {
  it("lists all members", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const members = await caller.members.list();

    expect(members).toBeDefined();
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBe(2);
    expect(members[0].name).toBe("João Silva");
  });

  it("gets member by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const member = await caller.members.getById({ id: 1 });

    expect(member).toBeDefined();
    expect(member?.name).toBe("João Silva");
    expect(member?.status).toBe("active");
  });

  it("returns null for non-existent member", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const member = await caller.members.getById({ id: 999 });

    expect(member).toBeNull();
  });

  it("searches members by query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.members.search({ query: "João" });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("creates a new member", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.create({
      name: "Novo Membro",
      email: "novo@test.com",
      phone: "11888888888",
      status: "active",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(3);
  });
});

describe("GymHub Check-ins", () => {
  it("gets today check-ins", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const checkIns = await caller.checkIns.getToday();

    expect(checkIns).toBeDefined();
    expect(Array.isArray(checkIns)).toBe(true);
  });

  it("creates a check-in", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.checkIns.create({ memberId: 1 });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});

describe("GymHub Payments", () => {
  it("lists all payments", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const payments = await caller.payments.list();

    expect(payments).toBeDefined();
    expect(Array.isArray(payments)).toBe(true);
  });

  it("creates a payment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payments.create({
      memberId: 1,
      amount: "99.00",
      paymentMethod: "pix",
      status: "paid",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});

describe("GymHub Stripe Integration", () => {
  it("creates a checkout session", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckout({
      memberId: 1,
      planType: "monthly",
    });

    expect(result).toBeDefined();
    expect(result.url).toContain("stripe.com");
  });
});

describe("GymHub Reports", () => {
  it("generates financial report", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const report = await caller.reports.financialReport({
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(report).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.summary.totalRevenue).toBe(5000);
    expect(report.summary.totalTransactions).toBe(50);
    expect(report.byPaymentMethod).toBeDefined();
    expect(report.byStatus).toBeDefined();
  });
});

describe("GymHub Auth", () => {
  it("returns current user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.name).toBe("Admin User");
    expect(user?.role).toBe("admin");
  });

  it("logs out user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
