import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { UserPlus, ArrowLeft, Save } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MemberForm() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    status: "active",
    planType: "monthly",
    planValue: "",
    planStartDate: "",
    planEndDate: "",
    notes: "",
  });

  const { data: member, isLoading: memberLoading } = trpc.members.getById.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing }
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.members.create.useMutation({
    onSuccess: () => {
      toast.success("Membro cadastrado com sucesso!");
      utils.members.list.invalidate();
      setLocation("/membros");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar membro: ${error.message}`);
    },
  });

  const updateMutation = trpc.members.update.useMutation({
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!");
      utils.members.list.invalidate();
      setLocation("/membros");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar membro: ${error.message}`);
    },
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || "",
        cpf: member.cpf || "",
        birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : "",
        gender: member.gender || "",
        address: member.address || "",
        emergencyContact: member.emergencyContact || "",
        emergencyPhone: member.emergencyPhone || "",
        status: member.status || "active",
        planType: member.planType || "monthly",
        planValue: member.planValue || "",
        planStartDate: member.planStartDate ? new Date(member.planStartDate).toISOString().split('T')[0] : "",
        planEndDate: member.planEndDate ? new Date(member.planEndDate).toISOString().split('T')[0] : "",
        notes: member.notes || "",
      });
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      cpf: formData.cpf || null,
      birthDate: formData.birthDate || null,
      gender: (formData.gender || null) as 'male' | 'female' | 'other' | null,
      address: formData.address || null,
      emergencyContact: formData.emergencyContact || null,
      emergencyPhone: formData.emergencyPhone || null,
      status: formData.status as 'active' | 'inactive' | 'defaulter',
      planType: formData.planType as 'monthly' | 'quarterly' | 'semiannual' | 'annual',
      planValue: formData.planValue || null,
      planStartDate: formData.planStartDate || null,
      planEndDate: formData.planEndDate || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEditing && memberLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/membros">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Editar Membro" : "Cadastrar Membro"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações do membro" : "Preencha os dados do novo membro"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
              <CardDescription>Dados básicos do membro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Digite o nome completo"
                  className="bg-background border-border"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Endereço completo"
                  className="bg-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Plan & Emergency */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Plano e Status</CardTitle>
                <CardDescription>Informações do plano de academia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="defaulter">Inadimplente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="planType">Tipo de Plano</Label>
                    <Select value={formData.planType} onValueChange={(value) => handleChange("planType", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semiannual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planValue">Valor (R$)</Label>
                    <Input
                      id="planValue"
                      type="number"
                      step="0.01"
                      value={formData.planValue}
                      onChange={(e) => handleChange("planValue", e.target.value)}
                      placeholder="0,00"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="planStartDate">Início do Plano</Label>
                    <Input
                      id="planStartDate"
                      type="date"
                      value={formData.planStartDate}
                      onChange={(e) => handleChange("planStartDate", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planEndDate">Fim do Plano</Label>
                    <Input
                      id="planEndDate"
                      type="date"
                      value={formData.planEndDate}
                      onChange={(e) => handleChange("planEndDate", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Contato de Emergência</CardTitle>
                <CardDescription>Informações para emergências</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nome do Contato</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleChange("emergencyContact", e.target.value)}
                    placeholder="Nome do contato de emergência"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="bg-background border-border"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Observações adicionais sobre o membro"
                  className="bg-background border-border min-h-[100px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/membros">
            <Button variant="outline" type="button" className="border-border">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              "Salvando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Atualizar" : "Cadastrar"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
