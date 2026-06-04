import { getDb } from '../db';
import { payments, members } from '../../drizzle/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export interface FinancialReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalTransactions: number;
  };
  byPaymentMethod: {
    method: string;
    count: number;
    total: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    total: number;
  }[];
  recentTransactions: {
    id: number;
    memberName: string;
    amount: string;
    status: string;
    paymentMethod: string;
    date: Date;
  }[];
  defaulters: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    overdueAmount: number;
  }[];
}

export async function generateFinancialReportData(
  startDate: Date,
  endDate: Date
): Promise<FinancialReportData> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Get all payments in period
  const periodPayments = await db
    .select({
      id: payments.id,
      memberId: payments.memberId,
      amount: payments.amount,
      status: payments.status,
      paymentMethod: payments.paymentMethod,
      paymentDate: payments.paymentDate,
      memberName: members.name,
    })
    .from(payments)
    .leftJoin(members, eq(payments.memberId, members.id))
    .where(
      and(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate)
      )
    )
    .orderBy(desc(payments.paymentDate));

  // Calculate summary
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const byPaymentMethodMap = new Map<string, { count: number; total: number }>();
  const byStatusMap = new Map<string, { count: number; total: number }>();

  for (const payment of periodPayments) {
    const amount = parseFloat(payment.amount || '0');
    totalRevenue += amount;

    if (payment.status === 'paid') totalPaid += amount;
    if (payment.status === 'pending') totalPending += amount;
    if (payment.status === 'overdue') totalOverdue += amount;

    // By payment method
    const method = payment.paymentMethod || 'unknown';
    const methodData = byPaymentMethodMap.get(method) || { count: 0, total: 0 };
    methodData.count++;
    methodData.total += amount;
    byPaymentMethodMap.set(method, methodData);

    // By status
    const status = payment.status || 'unknown';
    const statusData = byStatusMap.get(status) || { count: 0, total: 0 };
    statusData.count++;
    statusData.total += amount;
    byStatusMap.set(status, statusData);
  }

  // Get defaulters
  const defaulterMembers = await db
    .select({
      id: members.id,
      name: members.name,
      email: members.email,
      phone: members.phone,
    })
    .from(members)
    .where(eq(members.status, 'defaulter'));

  // Calculate overdue amount for each defaulter
  const defaultersWithAmount = await Promise.all(
    defaulterMembers.map(async (member) => {
      const overduePayments = await db
        .select({ amount: payments.amount })
        .from(payments)
        .where(
          and(
            eq(payments.memberId, member.id),
            eq(payments.status, 'overdue')
          )
        );

      const overdueAmount = overduePayments.reduce(
        (sum, p) => sum + parseFloat(p.amount || '0'),
        0
      );

      return {
        id: member.id,
        name: member.name || 'Sem nome',
        email: member.email,
        phone: member.phone,
        overdueAmount,
      };
    })
  );

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary: {
      totalRevenue,
      totalPaid,
      totalPending,
      totalOverdue,
      totalTransactions: periodPayments.length,
    },
    byPaymentMethod: Array.from(byPaymentMethodMap.entries()).map(([method, data]) => ({
      method,
      ...data,
    })),
    byStatus: Array.from(byStatusMap.entries()).map(([status, data]) => ({
      status,
      ...data,
    })),
    recentTransactions: periodPayments.slice(0, 20).map((p) => ({
      id: p.id,
      memberName: p.memberName || 'Desconhecido',
      amount: p.amount || '0',
      status: p.status || 'unknown',
      paymentMethod: p.paymentMethod || 'unknown',
      date: p.paymentDate,
    })),
    defaulters: defaultersWithAmount.filter((d) => d.overdueAmount > 0),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    bank_transfer: 'Transferência',
    stripe: 'Stripe',
    unknown: 'Não informado',
  };
  return labels[method] || method;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Pago',
    pending: 'Pendente',
    overdue: 'Atrasado',
    cancelled: 'Cancelado',
    unknown: 'Não informado',
  };
  return labels[status] || status;
}
