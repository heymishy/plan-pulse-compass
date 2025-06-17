
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './context/AppContext';
import { Toaster } from '@/components/ui/toaster';
import Navigation from './components/Navigation';

// Pages
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Teams from './pages/Teams';
import Projects from './pages/Projects';
import Epics from './pages/Epics';
import Milestones from './pages/Milestones';
import Planning from './pages/Planning';
import Allocations from './pages/Allocations';
import Tracking from './pages/Tracking';
import Reports from './pages/Reports';
import Canvas from './pages/Canvas';
import Financials from './pages/Financials';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/people" element={<People />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/epics" element={<Epics />} />
                <Route path="/milestones" element={<Milestones />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/allocations" element={<Allocations />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/financials" element={<Financials />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
