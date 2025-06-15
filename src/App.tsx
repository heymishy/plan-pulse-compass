
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Navigation from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import Teams from "@/pages/Teams";
import People from "@/pages/People";
import Projects from "@/pages/Projects";
import Financials from "@/pages/Financials";
import Planning from "@/pages/Planning";
import Setup from "@/pages/Setup";
import Settings from "@/pages/Settings";
import Allocations from "@/pages/Allocations";
import Tracking from "@/pages/Tracking";
import Milestones from "@/pages/Milestones";
import Reports from "@/pages/Reports";
import Canvas from "@/pages/Canvas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/people" element={<People />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/allocations" element={<Allocations />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/milestones" element={<Milestones />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/canvas" element={<Canvas />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
