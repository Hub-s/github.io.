import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import GymHubLayout from "./components/GymHubLayout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberForm from "./pages/MemberForm";
import MemberProfile from "./pages/MemberProfile";
import CheckIn from "./pages/CheckIn";
import Financeiro from "./pages/Financeiro";
import Avaliacoes from "./pages/Avaliacoes";
import Relatorios from "./pages/Relatorios";
import NotificationSettings from "./pages/NotificationSettings";

function Router() {
  return (
    <GymHubLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/membros" component={Members} />
        <Route path="/cadastrar" component={MemberForm} />
        <Route path="/membros/:id" component={MemberProfile} />
        <Route path="/membros/:id/editar" component={MemberForm} />
        <Route path="/checkin" component={CheckIn} />
        <Route path="/financeiro" component={Financeiro} />
        <Route path="/avaliacoes" component={Avaliacoes} />
        <Route path="/relatorios" component={Relatorios} />
        <Route path="/notificacoes" component={NotificationSettings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </GymHubLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
