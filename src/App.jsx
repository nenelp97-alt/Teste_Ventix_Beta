import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/protectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Equipamentos from '@/pages/Equipamentos';
import Manutencoes from '@/pages/Manutencoes';
import HistoricoDash from '@/pages/HistoricoDash';
import CentrosDeCusto from '@/pages/CentrosDeCusto';
import InfraDashboard from '@/pages/InfraDashboard';
import ModuleSelector from '@/pages/ModuleSelector';

// Páginas do Módulo Gestão de Sucatas
import SucatasDashboard from '@/pages/SucatasDashboard';
import SucatasVendas from '@/pages/SucatasVendas';
import SucatasRelatorios from '@/pages/SucatasRelatorios';
import SucatasMetas from '@/pages/SucatasMetas';
import SucatasClientes from '@/pages/SucatasClientes';
import SucatasInsumos from '@/pages/SucatasInsumos'; // <--- Importação da nova página de Análise de Insumos

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Auth routes — public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route path="/" element={<ModuleSelector />} />
              <Route element={<AppLayout />}>
                {/* Módulo Ar-Condicionado */}
                <Route path="/ar-condicionado" element={<Dashboard />} />
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/manutencoes" element={<Manutencoes />} />
                <Route path="/historico" element={<HistoricoDash />} />
                <Route path="/centros-custo" element={<CentrosDeCusto />} />
                
                {/* Módulo Infraestrutura */}
                <Route path="/infraestrutura" element={<InfraDashboard />} />

                {/* Módulo Gestão de Sucatas (Rotas Separadas) */}
                <Route path="/sucatas" element={<SucatasDashboard />} />
                <Route path="/sucatas/vendas" element={<SucatasVendas />} />
                <Route path="/sucatas/relatorios" element={<SucatasRelatorios />} />
                <Route path="/sucatas/metas" element={<SucatasMetas />} />
                <Route path="/sucatas/clientes" element={<SucatasClientes />} />
                <Route path="/sucatas/analise-insumos" element={<SucatasInsumos />} /> {/* <--- Nova rota adicionada */}
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App