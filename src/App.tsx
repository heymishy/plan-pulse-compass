
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Navigation from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import Setup from "@/pages/Setup";
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
              <Route path="/setup" element={<Setup />} />
              <Route path="/teams" element={<div className="p-6">Teams page coming soon...</div>} />
              <Route path="/projects" element={<div className="p-6">Projects page coming soon...</div>} />
              <Route path="/planning" element={<div className="p-6">Planning page coming soon...</div>} />
              <Route path="/allocations" element={<div className="p-6">Allocations page coming soon...</div>} />
              <Route path="/milestones" element={<div className="p-6">Milestones page coming soon...</div>} />
              <Route path="/reports" element={<div className="p-6">Reports page coming soon...</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
