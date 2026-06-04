import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Activity, Plus, User, Scale, Ruler, Percent, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Avaliacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [assessmentData, setAssessmentData] = useState({
    weight: "",
    height: "",
    bodyFatPercentage: "",
    muscleMass: "",
    chest: "",
    waist: "",
    hips: "",
    rightArm: "",
    leftArm: "",
    rightThigh: "",
    leftThigh: "",
    rightCalf: "",
    leftCalf: "",
    notes: "",
    assessorName: "",
  });

  const { data: assessments, isLoading, refetch } = trpc.assessments.list.useQuery();
  const { data: members } = trpc.members.list.useQuery();

  const createAssessmentMutation = trpc.assessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação registrada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar avaliação: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedMember("");
    setAssessmentData({
      weight: "",
      height: "",
      bodyFatPercentage: "",
      muscleMass: "",
      chest: "",
      waist: "",
      hips: "",
      rightArm: "",
      leftArm: "",
      rightThigh: "",
      leftThigh: "",
      rightCalf: "",
      leftCalf: "",
      notes: "",
      assessorName: "",
    });
  };

  const handleCreateAssessment = () => {
    if (!selectedMember) {
      toast.error("Selecione um membro");
      return;
    }

    createAssessmentMutation.mutate({
      memberId: Number(selectedMember),
      weight: assessmentData.weight || null,
      height: assessmentData.height || null,
      bodyFatPercentage: assessmentData.bodyFatPercentage || null,
      muscleMass: assessmentData.muscleMass || null,
      chest: assessmentData.chest || null,
      waist: assessmentData.waist || null,
      hips: assessmentData.hips || null,
      rightArm: assessmentData.rightArm || null,
      leftArm: assessmentData.leftArm || null,
      rightThigh: assessmentData.rightThigh || null,
      leftThigh: assessmentData.leftThigh || null,
      rightCalf: assessmentData.rightCalf || null,
      leftCalf: assessmentData.leftCalf || null,
      notes: assessmentData.notes || null,
      assessorName: assessmentData.assessorName || null,
    });
  };

  const calculateBMI = () => {
    if (assessmentData.weight && assessmentData.height) {
      const weight = parseFloat(assessmentData.weight);
      const height = parseFloat(assessmentData.height) / 100;
      if (height > 0) {
        return (weight / (height * height)).toFixed(2);
      }
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-yellow-500" };
    if (bmi < 25) return { label: "Peso normal", color: "text-green-500" };
    if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-500" };
    return { label: "Obesidade", color: "text-red-500" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Avaliações Físicas</h1>
          <p className="text-muted-foreground">Acompanhe a evolução dos membros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Nova Avaliação Física</DialogTitle>
              <DialogDescription>
                Registre as medidas corporais do membro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label>Avaliador</Label>
                  <Input
                    value={assessmentData.assessorName}
                    onChange={(e) => setAssessmentData({ ...assessmentData, assessorName: e.target.value })}
                    placeholder="Nome do avaliador"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Basic Measurements */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Medidas Básicas</h4>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.weight}
                      onChange={(e) => setAssessmentData({ ...assessmentData, weight: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.height}
                      onChange={(e) => setAssessmentData({ ...assessmentData, height: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gordura (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.bodyFatPercentage}
                      onChange={(e) => setAssessmentData({ ...assessmentData, bodyFatPercentage: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Massa Muscular (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.muscleMass}
                      onChange={(e) => setAssessmentData({ ...assessmentData, muscleMass: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* IMC Preview */}
              {calculateBMI() && (
                <div className="p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">IMC Calculado:</span>
                    <span className="font-medium text-foreground">{calculateBMI()}</span>
                    <span className={`text-sm ${getBMICategory(parseFloat(calculateBMI()!)).color}`}>
                      ({getBMICategory(parseFloat(calculateBMI()!)).label})
                    </span>
                  </div>
                </div>
              )}

              {/* Body Measurements */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Circunferências (cm)</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Peitoral</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.chest}
                      onChange={(e) => setAssessmentData({ ...assessmentData, chest: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cintura</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.waist}
                      onChange={(e) => setAssessmentData({ ...assessmentData, waist: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quadril</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.hips}
                      onChange={(e) => setAssessmentData({ ...assessmentData, hips: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Limbs */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Membros (cm)</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Braço Direito</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.rightArm}
                      onChange={(e) => setAssessmentData({ ...assessmentData, rightArm: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Braço Esquerdo</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.leftArm}
                      onChange={(e) => setAssessmentData({ ...assessmentData, leftArm: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coxa Direita</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.rightThigh}
                      onChange={(e) => setAssessmentData({ ...assessmentData, rightThigh: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coxa Esquerda</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.leftThigh}
                      onChange={(e) => setAssessmentData({ ...assessmentData, leftThigh: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Panturrilha Direita</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.rightCalf}
                      onChange={(e) => setAssessmentData({ ...assessmentData, rightCalf: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Panturrilha Esquerda</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.leftCalf}
                      onChange={(e) => setAssessmentData({ ...assessmentData, leftCalf: e.target.value })}
                      placeholder="0.0"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={assessmentData.notes}
                  onChange={(e) => setAssessmentData({ ...assessmentData, notes: e.target.value })}
                  placeholder="Observações sobre a avaliação"
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
                onClick={handleCreateAssessment}
                disabled={createAssessmentMutation.isPending}
              >
                {createAssessmentMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assessments List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Avaliações Registradas
          </CardTitle>
          <CardDescription>
            {assessments?.length ?? 0} avaliações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : assessments && assessments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membro</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Peso</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Altura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">IMC</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Gordura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden xl:table-cell">Avaliador</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{assessment.memberName || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(assessment.assessmentDate), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-foreground hidden md:table-cell">
                        {assessment.weight ? `${assessment.weight} kg` : "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground hidden md:table-cell">
                        {assessment.height ? `${assessment.height} cm` : "-"}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {assessment.bmi ? (
                          <span className={getBMICategory(parseFloat(assessment.bmi)).color}>
                            {assessment.bmi}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground hidden lg:table-cell">
                        {assessment.bodyFatPercentage ? `${assessment.bodyFatPercentage}%` : "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden xl:table-cell">
                        {assessment.assessorName || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhuma avaliação registrada</p>
              <p className="text-sm text-muted-foreground">
                Registre a primeira avaliação física
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
