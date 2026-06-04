import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  FileText, Download, TrendingUp, TrendingDown, 
  DollarSign, AlertTriangle, Users, CreditCard 
} from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Relatorios() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: report, isLoading, refetch } = trpc.reports.financialReport.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method: string) => {
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
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado',
      cancelled: 'Cancelado',
      unknown: 'Não informado',
    };
    return labels[status] || status;
  };

  const generatePDF = () => {
    if (!report) {
      toast.error("Nenhum relatório para exportar");
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro - GymHub</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .period { font-size: 14px; color: #666; margin-bottom: 20px; }
    .summary { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; }
    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 150px; }
    .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-card p { margin: 0; font-size: 24px; font-weight: bold; }
    .green { color: #22c55e; }
    .yellow { color: #eab308; }
    .red { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏋️ GymHub - Relatório Financeiro</h1>
    <p class="period">Período: ${format(new Date(report.period.start), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(report.period.end), "dd/MM/yyyy", { locale: ptBR })}</p>
  </div>

  <h2>Resumo Financeiro</h2>
  <div class="summary">
    <div class="summary-card">
      <h3>Receita Total</h3>
      <p class="green">${formatCurrency(report.summary.totalRevenue)}</p>
    </div>
    <div class="summary-card">
      <h3>Recebido</h3>
      <p class="green">${formatCurrency(report.summary.totalPaid)}</p>
    </div>
    <div class="summary-card">
      <h3>Pendente</h3>
      <p class="yellow">${formatCurrency(report.summary.totalPending)}</p>
    </div>
    <div class="summary-card">
      <h3>Atrasado</h3>
      <p class="red">${formatCurrency(report.summary.totalOverdue)}</p>
    </div>
    <div class="summary-card">
      <h3>Transações</h3>
      <p>${report.summary.totalTransactions}</p>
    </div>
  </div>

  <h2>Por Forma de Pagamento</h2>
  <table>
    <thead>
      <tr>
        <th>Método</th>
        <th>Quantidade</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${report.byPaymentMethod.map(item => `
        <tr>
          <td>${getPaymentMethodLabel(item.method)}</td>
          <td>${item.count}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Por Status</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Quantidade</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${report.byStatus.map(item => `
        <tr>
          <td>${getStatusLabel(item.status)}</td>
          <td>${item.count}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${report.defaulters.length > 0 ? `
  <h2>Inadimplentes</h2>
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>Telefone</th>
        <th>Valor em Atraso</th>
      </tr>
    </thead>
    <tbody>
      ${report.defaulters.map(d => `
        <tr>
          <td>${d.name}</td>
          <td>${d.email || '-'}</td>
          <td>${d.phone || '-'}</td>
          <td class="red">${formatCurrency(d.overdueAmount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>Últimas Transações</h2>
  <table>
    <thead>
      <tr>
        <th>Membro</th>
        <th>Valor</th>
        <th>Status</th>
        <th>Método</th>
        <th>Data</th>
      </tr>
    </thead>
    <tbody>
      ${report.recentTransactions.map(t => `
        <tr>
          <td>${t.memberName}</td>
          <td>${formatCurrency(parseFloat(t.amount))}</td>
          <td>${getStatusLabel(t.status)}</td>
          <td>${getPaymentMethodLabel(t.paymentMethod)}</td>
          <td>${format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
    <p>GymHub - Sistema de Gestão para Academias</p>
  </div>
</body>
</html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success("Relatório gerado! Use Ctrl+P para salvar como PDF");
    } else {
      toast.error("Não foi possível abrir a janela de impressão");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise financeira detalhada</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={generatePDF}
          disabled={!report || isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Date Filter */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Período do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => refetch()}>
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Carregando relatório...</div>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCurrency(report.summary.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                      Receita Total
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCurrency(report.summary.totalPaid)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                      Recebido
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">
                      {formatCurrency(report.summary.totalPending)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                      Pendente
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <CreditCard className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-500">
                      {formatCurrency(report.summary.totalOverdue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                      Em Atraso
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts/Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Payment Method */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.byPaymentMethod.length > 0 ? (
                  <div className="space-y-3">
                    {report.byPaymentMethod.map((item) => (
                      <div key={item.method} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-foreground">{getPaymentMethodLabel(item.method)}</p>
                          <p className="text-sm text-muted-foreground">{item.count} transações</p>
                        </div>
                        <p className="font-bold text-foreground">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* By Status */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.byStatus.length > 0 ? (
                  <div className="space-y-3">
                    {report.byStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-foreground">{getStatusLabel(item.status)}</p>
                          <p className="text-sm text-muted-foreground">{item.count} transações</p>
                        </div>
                        <p className={`font-bold ${
                          item.status === 'paid' ? 'text-green-500' :
                          item.status === 'pending' ? 'text-yellow-500' :
                          item.status === 'overdue' ? 'text-red-500' : 'text-foreground'
                        }`}>
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Defaulters */}
          {report.defaulters.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Inadimplentes
                </CardTitle>
                <CardDescription>
                  {report.defaulters.length} membros com pagamentos em atraso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor em Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.defaulters.map((d) => (
                        <tr key={d.id} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{d.email || '-'}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{d.phone || '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-500">{formatCurrency(d.overdueAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Últimas Transações
              </CardTitle>
              <CardDescription>
                {report.recentTransactions.length} transações mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membro</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Método</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.recentTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium text-foreground">{t.memberName}</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(parseFloat(t.amount))}</td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              t.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                              t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              t.status === 'overdue' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {getStatusLabel(t.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                            {getPaymentMethodLabel(t.paymentMethod)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação no período</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">Selecione um período</p>
              <p className="text-sm text-muted-foreground">
                Defina as datas para gerar o relatório financeiro
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
