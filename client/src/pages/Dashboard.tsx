import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, LogIn, AlertTriangle, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: recentCheckIns, isLoading: checkInsLoading } = trpc.dashboard.getRecentCheckIns.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="TOTAL DE MEMBROS"
          value={statsLoading ? "-" : (stats?.totalMembers ?? 0).toString()}
          icon={Users}
          iconColor="text-primary"
          bgColor="bg-card"
        />
        <StatsCard
          title="MEMBROS ATIVOS"
          value={statsLoading ? "-" : (stats?.activeMembers ?? 0).toString()}
          icon={TrendingUp}
          iconColor="text-green-500"
          bgColor="bg-card"
          valueColor="text-green-500"
        />
        <StatsCard
          title="CHECK-INS HOJE"
          value={statsLoading ? "-" : (stats?.checkInsToday ?? 0).toString()}
          icon={LogIn}
          iconColor="text-primary"
          bgColor="bg-card"
        />
        <StatsCard
          title="INADIMPLENTES"
          value={statsLoading ? "-" : (stats?.defaulters ?? 0).toString()}
          icon={AlertTriangle}
          iconColor="text-destructive"
          bgColor="bg-card"
          valueColor="text-destructive"
        />
      </div>

      {/* Recent Check-ins */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Check-ins Recentes</CardTitle>
          <CardDescription>Acompanhe as entradas de hoje</CardDescription>
        </CardHeader>
        <CardContent>
          {checkInsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : recentCheckIns && recentCheckIns.length > 0 ? (
            <div className="space-y-3">
              {recentCheckIns.map((checkIn: { id: number; memberName: string | null; checkInTime: Date }) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {checkIn.memberName?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checkIn.memberName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(checkIn.checkInTime), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LogIn className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhum check-in hoje</p>
              <p className="text-sm text-muted-foreground">
                Os check-ins do dia aparecerão aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/cadastrar">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="h-4 w-4 mr-2" />
            CADASTRAR NOVO MEMBRO
          </Button>
        </Link>
        <Link href="/checkin">
          <Button variant="outline" className="border-border">
            <LogIn className="h-4 w-4 mr-2" />
            FAZER CHECK-IN
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  bgColor?: string;
  valueColor?: string;
}

function StatsCard({ title, value, icon: Icon, iconColor = "text-primary", bgColor = "bg-card", valueColor = "text-foreground" }: StatsCardProps) {
  return (
    <Card className={`${bgColor} border-border`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{title}</p>
          </div>
          <div className={`p-2 rounded-lg bg-accent/50`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
