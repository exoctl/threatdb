import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import Records from "./pages/Records";
import YaraRules from "./pages/YaraRules";
import YaraRuleDetails from "./pages/YaraRuleDetails";
import Plugins from "./pages/Plugins";
import Status from "./pages/Status";
import ThreatTaxonomy from "./pages/ThreatTaxonomy";
import Settings from "./pages/Settings";
import FileDetails from "./pages/FileDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/records" element={<Records />} />
            <Route path="/file/:sha256" element={<FileDetails />} />
            <Route path="/yara" element={<YaraRules />} />
            <Route path="/taxonomy" element={<ThreatTaxonomy />} />
            <Route path="/yara/:identifier" element={<YaraRuleDetails />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
