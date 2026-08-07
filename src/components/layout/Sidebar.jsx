import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AirVent, Wrench, Menu, X, LogOut, History, Building2, LayoutGrid, Receipt, Recycle, Users, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/apiClient';
import { cn } from '@/lib/utils';

const acNavItems = [
  { label: 'Dashboard A/C', path: '/ar-condicionado', icon: LayoutDashboard },
  { label: 'Equipamentos', path: '/equipamentos', icon: AirVent },
  { label: 'Manutenções', path: '/manutencoes', icon: Wrench },
  { label: 'Ticket Médio', path: '/historico', icon: History },
];

const infraNavItems = [
  { label: 'Dashboard Infra', path: '/infraestrutura', icon: LayoutDashboard },
  { label: 'Registro de Gastos', path: '/registro-gastos', icon: Receipt }
];

const sucatasNavItems = [
  { label: 'Dashboard Sucatas', path: '/sucatas', icon: LayoutDashboard },
  { label: 'Registro de Vendas', path: '/sucatas/vendas', icon: Receipt },
  { label: 'Clientes / Fornecedores', path: '/sucatas/clientes', icon: Users },
  { label: 'Análise de Insumos', path: '/sucatas/analise-insumos', icon: BarChart2 },
];

export default function Sidebar({ open, onToggle, module = 'ac' }) {
  const location = useLocation();
  
  const navItems = module === 'infra' 
    ? infraNavItems 
    : module === 'sucatas' 
      ? sucatasNavItems 
      : acNavItems;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />
      )}

      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-md border border-border"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-100 z-40 flex flex-col transition-transform duration-300 border-r border-slate-800",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
              module === 'infra' ? "bg-blue-600" : module === 'sucatas' ? "bg-emerald-600" : "bg-blue-600"
            )}>
              {module === 'infra' ? (
                <Building2 className="w-5 h-5" />
              ) : module === 'sucatas' ? (
                <Recycle className="w-5 h-5" />
              ) : (
                <AirVent className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-base text-white leading-tight">
                {module === 'sucatas' ? 'Gestão de Sucatas' : 'Gestão de manutenções'}
              </h1>
              <p className="text-xs text-slate-400">
                {module === 'infra' ? 'Infraestrutura' : module === 'sucatas' ? 'Comercialização' : 'Gestão de A/C'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? module === 'sucatas' 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <LayoutGrid className="w-4 h-4" />
            Módulos
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}