import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Identifica qual módulo carregar com base na URL atual
  const getModule = () => {
    if (location.pathname.startsWith('/infraestrutura')) return 'infra';
    if (location.pathname.startsWith('/sucatas')) return 'sucatas';
    return 'ac';
  };

  const currentModule = getModule();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        module={currentModule} 
      />
      <main className="flex-1 lg:ml-64 min-h-screen bg-slate-50">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}