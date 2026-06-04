import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LogIn, Search, Check, Clock, User } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function CheckIn() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: todayCheckIns, isLoading: checkInsLoading, refetch: refetchCheckIns } = trpc.checkIns.getToday.useQuery();
  const { data: searchResults, isLoading: searchLoading } = trpc.members.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const utils = trpc.useUtils();
  
  const checkInMutation = trpc.checkIns.create.useMutation({
    onSuccess: (data) => {
      toast.success("Check-in realizado com sucesso!");
      refetchCheckIns();
      utils.dashboard.getStats.invalidate();
      utils.dashboard.getRecentCheckIns.invalidate();
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(`Erro ao realizar check-in: ${error.message}`);
    },
  });

  const handleCheckIn = (memberId: number, memberName: string) => {
    // Check if member already checked in today
    const alreadyCheckedIn = todayCheckIns?.some(c => c.memberId === memberId);
    if (alreadyCheckedIn) {
      toast.warning(`${memberName} já fez check-in hoje`);
      return;
    }
    checkInMutation.mutate({ memberId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-in</h1>
        <p className="text-muted-foreground">Registre a entrada dos membros na academia</p>
      </div>

      {/* Search Member */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Membro
          </CardTitle>
          <CardDescription>Digite o nome, email ou CPF do membro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membro para check-in..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length > 2 && (
            <div className="space-y-2">
              {searchLoading ? (
                <div className="text-center py-4 text-muted-foreground">Buscando...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((member) => {
                  const alreadyCheckedIn = todayCheckIns?.some(c => c.memberId === member.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email || member.phone || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.status === 'defaulter' && (
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                            Inadimplente
                          </Badge>
                        )}
                        {alreadyCheckedIn ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Check-in feito
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleCheckIn(member.id, member.name)}
                            disabled={checkInMutation.isPending}
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Check-in
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum membro encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Check-ins */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Check-ins de Hoje
          </CardTitle>
          <CardDescription>
            {todayCheckIns?.length ?? 0} check-ins realizados hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkInsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : todayCheckIns && todayCheckIns.length > 0 ? (
            <div className="space-y-2">
              {todayCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checkIn.memberName || "Membro"}</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in às {format(new Date(checkIn.checkInTime), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <Check className="h-3 w-3 mr-1" />
                    Presente
                  </Badge>
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
    </div>
  );
}
