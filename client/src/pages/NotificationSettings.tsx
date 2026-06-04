import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/**
 * Página de Configurações de Notificações
 */
export default function NotificationSettings() {
  const utils = trpc.useUtils();

  // Query preferências
  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();

  // Mutation atualizar preferências
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate();
      toast.success('Preferências atualizadas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar preferências');
    },
  });

  const [formData, setFormData] = useState({
    memberCreatedEmail: preferences?.memberCreatedEmail === 'true',
    memberCreatedInApp: preferences?.memberCreatedInApp === 'true',
    paymentReceivedEmail: preferences?.paymentReceivedEmail === 'true',
    paymentReceivedInApp: preferences?.paymentReceivedInApp === 'true',
    paymentOverdueEmail: preferences?.paymentOverdueEmail === 'true',
    paymentOverdueInApp: preferences?.paymentOverdueInApp === 'true',
    checkInEmail: preferences?.checkInEmail === 'true',
    checkInInApp: preferences?.checkInInApp === 'true',
    assessmentEmail: preferences?.assessmentEmail === 'true',
    assessmentInApp: preferences?.assessmentInApp === 'true',
    systemAlertEmail: preferences?.systemAlertEmail === 'true',
    systemAlertInApp: preferences?.systemAlertInApp === 'true',
  });

  const handleToggle = (key: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      memberCreatedEmail: formData.memberCreatedEmail ? 'true' : 'false',
      memberCreatedInApp: formData.memberCreatedInApp ? 'true' : 'false',
      paymentReceivedEmail: formData.paymentReceivedEmail ? 'true' : 'false',
      paymentReceivedInApp: formData.paymentReceivedInApp ? 'true' : 'false',
      paymentOverdueEmail: formData.paymentOverdueEmail ? 'true' : 'false',
      paymentOverdueInApp: formData.paymentOverdueInApp ? 'true' : 'false',
      checkInEmail: formData.checkInEmail ? 'true' : 'false',
      checkInInApp: formData.checkInInApp ? 'true' : 'false',
      assessmentEmail: formData.assessmentEmail ? 'true' : 'false',
      assessmentInApp: formData.assessmentInApp ? 'true' : 'false',
      systemAlertEmail: formData.systemAlertEmail ? 'true' : 'false',
      systemAlertInApp: formData.systemAlertInApp ? 'true' : 'false',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Preferências de Notificações</h1>
        <p className="text-gray-600 mt-2">
          Personalize como você recebe notificações sobre eventos importantes
        </p>
      </div>

      {/* Notificações de Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Notificações de Membros
          </CardTitle>
          <CardDescription>
            Receba alertas sobre novos membros e atualizações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Novo Membro</div>
              <div className="text-sm text-gray-600">Receber notificação quando um novo membro se cadastra</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.memberCreatedEmail}
                  onCheckedChange={() => handleToggle('memberCreatedEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.memberCreatedInApp}
                  onCheckedChange={() => handleToggle('memberCreatedInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Notificações de Pagamentos
          </CardTitle>
          <CardDescription>
            Receba alertas sobre pagamentos recebidos e vencidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Pagamento Recebido</div>
              <div className="text-sm text-gray-600">Notificação quando um pagamento é recebido</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.paymentReceivedEmail}
                  onCheckedChange={() => handleToggle('paymentReceivedEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.paymentReceivedInApp}
                  onCheckedChange={() => handleToggle('paymentReceivedInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Pagamento Vencido</div>
              <div className="text-sm text-gray-600">Alerta quando um pagamento está vencido</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.paymentOverdueEmail}
                  onCheckedChange={() => handleToggle('paymentOverdueEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.paymentOverdueInApp}
                  onCheckedChange={() => handleToggle('paymentOverdueInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Check-in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Notificações de Check-in
          </CardTitle>
          <CardDescription>
            Receba alertas sobre check-ins de membros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Check-in Realizado</div>
              <div className="text-sm text-gray-600">Notificação quando um membro faz check-in</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.checkInEmail}
                  onCheckedChange={() => handleToggle('checkInEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.checkInInApp}
                  onCheckedChange={() => handleToggle('checkInInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Notificações de Avaliações
          </CardTitle>
          <CardDescription>
            Receba alertas sobre avaliações físicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Avaliação Criada</div>
              <div className="text-sm text-gray-600">Notificação quando uma avaliação é criada</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.assessmentEmail}
                  onCheckedChange={() => handleToggle('assessmentEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.assessmentInApp}
                  onCheckedChange={() => handleToggle('assessmentInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            Notificações do Sistema
          </CardTitle>
          <CardDescription>
            Receba alertas importantes do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label className="cursor-pointer">
              <div className="font-medium text-gray-900">Alertas do Sistema</div>
              <div className="text-sm text-gray-600">Notificações sobre manutenção e atualizações</div>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.systemAlertEmail}
                  onCheckedChange={() => handleToggle('systemAlertEmail')}
                />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.systemAlertInApp}
                  onCheckedChange={() => handleToggle('systemAlertInApp')}
                />
                <span className="text-sm text-gray-600">App</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Preferências
        </Button>
      </div>
    </div>
  );
}
