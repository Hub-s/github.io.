import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  User, ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, 
  CreditCard, Activity, LogIn, AlertCircle 
} from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MemberProfile() {
  const params = useParams<{ id: string }>();
  const memberId = Number(params.id);

  const { data: member, isLoading } = trpc.members.getById.useQuery({ id: memberId });
  const { data: checkIns } = trpc.checkIns.getByMember.useQuery({ memberId });
  const { data: payments } = trpc.payments.getByMember.useQuery({ memberId });
  const { data: assessments } = trpc.assessments.getByMember.useQuery({ memberId });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inativo</Badge>;
      case 'defaulter':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Inadimplente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanLabel = (planType: string | null) => {
    switch (planType) {
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'semiannual': return 'Semestral';
      case 'annual': return 'Anual';
      default: return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Membro não encontrado</p>
        <Link href="/membros">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/membros">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(member.status)}
                <span className="text-sm text-muted-foreground">
                  Membro desde {format(new Date(member.createdAt), "MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Link href={`/membros/${member.id}/editar`}>
          <Button className="bg-primary hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins ({checkIns?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos ({payments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações ({assessments?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Mail} label="Email" value={member.email || "-"} />
                <InfoRow icon={Phone} label="Telefone" value={member.phone || "-"} />
                <InfoRow icon={User} label="CPF" value={member.cpf || "-"} />
                <InfoRow 
                  icon={Calendar} 
                  label="Nascimento" 
                  value={member.birthDate ? format(new Date(member.birthDate), "dd/MM/yyyy") : "-"} 
                />
                <InfoRow icon={MapPin} label="Endereço" value={member.address || "-"} />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Tipo" value={getPlanLabel(member.planType)} />
                <InfoRow label="Valor" value={member.planValue ? `R$ ${member.planValue}` : "-"} />
                <InfoRow 
                  label="Início" 
                  value={member.planStartDate ? format(new Date(member.planStartDate), "dd/MM/yyyy") : "-"} 
                />
                <InfoRow 
                  label="Fim" 
                  value={member.planEndDate ? format(new Date(member.planEndDate), "dd/MM/yyyy") : "-"} 
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Contato de Emergência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nome" value={member.emergencyContact || "-"} />
                <InfoRow label="Telefone" value={member.emergencyPhone || "-"} />
              </CardContent>
            </Card>

            {member.notes && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Histórico de Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns && checkIns.length > 0 ? (
                <div className="space-y-2">
                  {checkIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <span className="text-foreground">
                        {format(new Date(checkIn.checkInTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {checkIn.notes && (
                        <span className="text-sm text-muted-foreground">{checkIn.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum check-in registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Histórico de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <span className="text-foreground font-medium">R$ {payment.amount}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <Badge 
                        className={
                          payment.status === 'paid' 
                            ? "bg-green-500/20 text-green-500" 
                            : payment.status === 'overdue'
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }
                      >
                        {payment.status === 'paid' && 'Pago'}
                        {payment.status === 'pending' && 'Pendente'}
                        {payment.status === 'overdue' && 'Atrasado'}
                        {payment.status === 'cancelled' && 'Cancelado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum pagamento registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Histórico de Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments && assessments.length > 0 ? (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="p-4 rounded-lg bg-accent/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {format(new Date(assessment.assessmentDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {assessment.assessorName && (
                          <span className="text-sm text-muted-foreground">
                            Avaliador: {assessment.assessorName}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        {assessment.weight && <span>Peso: {assessment.weight} kg</span>}
                        {assessment.height && <span>Altura: {assessment.height} cm</span>}
                        {assessment.bmi && <span>IMC: {assessment.bmi}</span>}
                        {assessment.bodyFatPercentage && <span>Gordura: {assessment.bodyFatPercentage}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma avaliação registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon?: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
