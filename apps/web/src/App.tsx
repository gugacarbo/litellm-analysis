import { TooltipProvider } from './components/tooltip';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/sidebar';
import { DashboardPage } from './pages/dashboard';
import { ErrorsPage } from './pages/errors';
import { LogsPage } from './pages/logs';
import { ModelDetailPage } from './pages/model-detail';
import { ModelStatsPage } from './pages/model-stats';

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/errors" element={<ErrorsPage />} />
              <Route path="/model/:modelName" element={<ModelDetailPage />} />
              <Route path="/model-stats" element={<ModelStatsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
