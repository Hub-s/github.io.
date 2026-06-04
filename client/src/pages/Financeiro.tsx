import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, TrendingUp, AlertTriangle, CreditCard, Plus, 
  Download, Calendar, Clock, CheckCircle, XCircle, ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Financeiro() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStripeDialogOpen, setIsStripeDialogOpen] = useState(false);
  const [stripeMember, setStripeMember] = useState("");
  const [stripePlan, setStripePlan] = useState("monthly");
  const [selectedMember, setSelectedMember] = useState("");
  const [paymentData, setPaymentData] = useState({
    amount: "",
    dueDate: "",
    referenceMonth: "",
    paymentMethod: "pix",
    status: "paid",
    description: "",
  });

  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { data: allPayments, isLoading, refetch } = trpc.payments.list.useQuery();
  const { data: pendingPayments } = trpc.payments.getByStatus.useQuery({ status: 'pending' });
  const { data: overduePayments } = trpc.payments.getByStatus.useQuery({ status: 'overdue' });
  const { data: members } = trpc.members.list.useQuery();

  const utils = trpc.useUtils();

  const stripeCheckoutMutation = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecionando para o checkout...");
      window.open(data.url, '_blank');
      setIsStripeDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar checkout: ${error.message}`);
    },
  });

  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      refetch();
      utils.dashboard.getStats.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  const updatePaymentMutation = trpc.payments.update.useMutation({
    onSuccess: () => {
      toast.success("Pagamento atualizado!");
      refetch();
      utils.dashboard.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedMember("");
    setPaymentData({
      amount: "",
      dueDate: "",
      referenceMonth: "",
      paymentMethod: "pix",
      status: "paid",
      description: "",
    });
  };

  const handleCreatePayment = () => {
    if (!selectedMember || !paymentData.amount) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createPaymentMutation.mutate({
      memberId: Number(selectedMember),
      amount: paymentData.amount,
      dueDate: paymentData.dueDate || null,
      referenceMonth: paymentData.referenceMonth || null,
      paymentMethod: paymentData.paymentMethod as any,
      status: paymentData.status as any,
      description: paymentData.description || null,
    });
  };

  const handleMarkAsPaid = (paymentId: number) => {
    updatePaymentMutation.mutate({
      id: paymentId,
      status: 'paid',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Atrasado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'bank_transfer': return 'Transferência';
      case 'stripe': return 'Stripe';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle de pagamentos e receitas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => setIsStripeDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamento Stripe
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Pagamento</DialogTitle>
                <DialogDescription>
                  Registre um novo pagamento de mensalidade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Membro *</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      placeholder="0,00"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mês de Referência</Label>
                    <Input
                      type="month"
                      value={paymentData.referenceMonth}
                      onChange={(e) => setPaymentData({ ...paymentData, referenceMonth: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={paymentData.paymentMethod} 
                      onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="bank_transfer">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={paymentData.status} 
                      onValueChange={(value) => setPaymentData({ ...paymentData, status: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={paymentData.dueDate}
                    onChange={(e) => setPaymentData({ ...paymentData, dueDate: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                    placeholder="Descrição do pagamento"
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleCreatePayment}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-green-500">
                  R$ {stats?.monthlyRevenue?.toFixed(2) ?? "0,00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                  Receita do Mês
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
                <p className="text-2xl font-bold text-yellow-500">
                  {pendingPayments?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                  Pagamentos Pendentes
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {overduePayments?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                  Pagamentos Atrasados
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PaymentsList 
            payments={allPayments} 
            isLoading={isLoading} 
            getStatusBadge={getStatusBadge}
            getPaymentMethodLabel={getPaymentMethodLabel}
            onMarkAsPaid={handleMarkAsPaid}
          />
        </TabsContent>

        <TabsContent value="pending">
          <PaymentsList 
            payments={pendingPayments} 
            isLoading={isLoading} 
            getStatusBadge={getStatusBadge}
            getPaymentMethodLabel={getPaymentMethodLabel}
            onMarkAsPaid={handleMarkAsPaid}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <PaymentsList 
            payments={overduePayments} 
            isLoading={isLoading} 
            getStatusBadge={getStatusBadge}
            getPaymentMethodLabel={getPaymentMethodLabel}
            onMarkAsPaid={handleMarkAsPaid}
          />
        </TabsContent>
      </Tabs>

      {/* Stripe Checkout Dialog */}
      <Dialog open={isStripeDialogOpen} onOpenChange={setIsStripeDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Pagamento via Stripe</DialogTitle>
            <DialogDescription>
              Selecione o membro e o plano para gerar o link de pagamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Membro *</Label>
              <Select value={stripeMember} onValueChange={setStripeMember}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={stripePlan} onValueChange={setStripePlan}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal - R$ 99,00</SelectItem>
                  <SelectItem value="quarterly">Trimestral - R$ 267,00 (R$ 89/mês)</SelectItem>
                  <SelectItem value="semiannual">Semestral - R$ 474,00 (R$ 79/mês)</SelectItem>
                  <SelectItem value="annual">Anual - R$ 828,00 (R$ 69/mês)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStripeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (!stripeMember) {
                  toast.error("Selecione um membro");
                  return;
                }
                stripeCheckoutMutation.mutate({
                  memberId: Number(stripeMember),
                  planType: stripePlan,
                });
              }}
              disabled={stripeCheckoutMutation.isPending}
            >
              {stripeCheckoutMutation.isPending ? "Gerando..." : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Gerar Link de Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PaymentsListProps {
  payments: any[] | undefined;
  isLoading: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  getPaymentMethodLabel: (method: string) => string;
  onMarkAsPaid: (id: number) => void;
}

function PaymentsList({ payments, isLoading, getStatusBadge, getPaymentMethodLabel, onMarkAsPaid }: PaymentsListProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Pagamentos
        </CardTitle>
        <CardDescription>
          {payments?.length ?? 0} pagamentos encontrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membro</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Referência</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Método</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Data</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{payment.memberName || "-"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">R$ {payment.amount}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {payment.referenceMonth || "-"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {(payment.status === 'pending' || payment.status === 'overdue') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-400"
                            onClick={() => onMarkAsPaid(payment.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pago
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum pagamento encontrado</p>
            <p className="text-sm text-muted-foreground">
              Registre o primeiro pagamento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
