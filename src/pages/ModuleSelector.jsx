import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Snowflake, Recycle, Users, ArrowRight, LogOut, ShieldAlert, Key, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ventixLogo from '../assets/ventix-logo.png';

const handleLogout = () => {
  localStorage.removeItem('ventix_user');
  window.location.href = '/login';
};

export default function ModuleSelector() {
  const navigate = useNavigate();
  const currentUser = (localStorage.getItem('ventix_user') || '').trim();
  const isAdminMaster = currentUser.toLowerCase() === 'master01' || currentUser.toLowerCase() === 'admin02';

  const [showUserModal, setShowUserModal] = useState(false);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem('ventix_users_list') || '[]');
    const hasMaster = stored.some(u => u.username.toLowerCase() === 'master01');
    if (!hasMaster) {
      stored.unshift({ username: 'Master01', password: 'Er9fizwz@', role: 'Master', approved: true });
    } else {
      stored = stored.map(u => u.username.toLowerCase() === 'master01' ? { ...u, role: 'Master', approved: true, password: 'Er9fizwz@' } : u);
    }
    setUsersList(stored);
    localStorage.setItem('ventix_users_list', JSON.stringify(stored));
  }, []);

  const handleToggleApproval = (username) => {
    const updated = usersList.map(u => {
      if (u.username === username) {
        return { ...u, approved: !u.approved };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem('ventix_users_list', JSON.stringify(updated));
  };

  const handleUpdatePassword = (username, newPass) => {
    const updated = usersList.map(u => u.username === username ? { ...u, password: newPass } : u);
    setUsersList(updated);
    localStorage.setItem('ventix_users_list', JSON.stringify(updated));
    alert(`Senha do usuário ${username} alterada com sucesso!`);
  };

  const handleDeleteUser = (username) => {
    if (username.toLowerCase() === 'master01' || username.toLowerCase() === 'admin02') {
      alert('Não é permitido excluir o usuário Mestre do sistema.');
      return;
    }
    if (confirm(`Deseja realmente remover o acesso de ${username}?`)) {
      const updated = usersList.filter(u => u.username !== username);
      setUsersList(updated);
      localStorage.setItem('ventix_users_list', JSON.stringify(updated));
    }
  };

  const { data: infra = [] } = useQuery({ queryKey: ['infra-maintenances'], queryFn: async () => [] });
  const { data: ac = [] } = useQuery({ queryKey: ['maintenances'], queryFn: async () => [] });
  const { data: sucatas = [] } = useQuery({ queryKey: ['sucatas-vendas'], queryFn: async () => [] });

  const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const infraCost = infra.reduce((s, r) => s + (Number(r.service_cost) || 0) + (Number(r.materials_cost) || 0), 0);
  const acCost = ac.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const sucatasTotal = sucatas.reduce((s, r) => s + (Number(r.valor_total) || 0), 0);
  const sucatasKg = sucatas.reduce((s, r) => s + (Number(r.quantidade) || 0), 0);

  const modules = [
    { title: 'Infraestrutura', icon: Building2, count: `${infra.length} manutenções`, metric: `${fmt(infraCost)} gastos`, path: '/infraestrutura', color: 'text-amber-600' },
    { title: 'Ar-Condicionado', icon: Snowflake, count: `${ac.length} manutenções`, metric: `${fmt(acCost)} gastos`, path: '/ar-condicionado', color: 'text-cyan-600' },
    { title: 'Gestão de Sucatas', icon: Recycle, count: `${sucatasKg.toLocaleString('pt-BR')} kg vendidos`, metric: `${fmt(sucatasTotal)} receita`, path: '/sucatas', color: 'text-emerald-600' }
  ];

  const pendingCount = usersList.filter(u => !u.approved).length;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-6 overflow-hidden font-mono bg-slate-100">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 animate-ventix-reveal-slow"
        style={{ backgroundImage: `url(${ventixLogo})` }}
      />
      <div className="absolute inset-0 bg-white/10 z-0" />

      {/* Cabeçalho Fixo (Topo) */}
      <div className="w-full max-w-5xl flex justify-between items-center relative z-20 mt-2 mb-8">
        <div className="text-slate-700 font-bold text-xs bg-white/50 px-3 py-1.5 rounded-lg backdrop-blur-md border border-slate-300">
          Logado como: <span className="text-emerald-700">{currentUser || 'Convidado'}</span> {isAdminMaster && '(Master)'}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            className="text-slate-700 hover:text-black hover:bg-black/5 backdrop-blur-md h-9"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>

          {isAdminMaster && (
            <Button
              onClick={() => setShowUserModal(true)}
              size="sm"
              className="bg-emerald-900/90 hover:bg-emerald-900 text-white text-xs backdrop-blur-md shadow-md border border-emerald-500/40 flex items-center gap-1.5 relative"
            >
              <Users className="w-3.5 h-3.5" /> Gestão de Logins
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.2 font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo Principal Ajustado logo abaixo do topo */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-4">
        <h1 className="font-mono text-slate-600 text-xs md:text-sm mb-6 tracking-[0.2em] uppercase font-semibold drop-shadow-sm bg-white/40 px-4 py-1.5 rounded-md backdrop-blur-sm border border-slate-200">
          ── Selecione um Módulo ──
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {modules.map((mod) => (
            <button
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className="group bg-white/30 hover:bg-white/50 border border-slate-300/60 hover:border-emerald-500 rounded-2xl p-6 text-left transition-all backdrop-blur-[3px] font-mono shadow-lg relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
              <mod.icon className={`w-8 h-8 mb-4 ${mod.color} relative z-10`} />
              <h2 className="text-slate-900 text-lg font-bold mb-4 relative z-10">{mod.title}</h2>
              <div className="space-y-1.5 mb-6 relative z-10">
                <p className="text-slate-700 text-sm font-medium">{mod.count}</p>
                <p className="text-slate-700 text-sm font-medium">{mod.metric}</p>
              </div>
              <span className="text-emerald-700 text-sm inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all relative z-10 font-bold">
                [Acessar módulo <ArrowRight className="w-3 h-3" />]
              </span>
            </button>
          ))}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl font-mono text-slate-800">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" /> Painel Master - Aprovação e Gestão de Usuários
              </h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-slate-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {usersList.map((u) => (
                <div key={u.username} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-100 p-4 rounded-xl border border-slate-200 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{u.username}</p>
                      {u.username.toLowerCase() === 'master01' ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Mestre (Criador)</span>
                      ) : u.approved ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Aprovado</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold animate-pulse">Pendente Aprovação</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Senha atual: <span className="text-slate-700 font-semibold">{u.password}</span></p>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
                    {u.username.toLowerCase() !== 'master01' && (
                      <Button
                        size="sm"
                        className={`text-xs ${u.approved ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                        onClick={() => handleToggleApproval(u.username)}
                      >
                        {u.approved ? 'Revogar Acesso' : 'Aprovar Acesso'}
                      </Button>
                    )}

                    <input 
                      type="text" 
                      placeholder="Nova senha" 
                      id={`pass-${u.username}`}
                      className="border rounded px-2 py-1 text-xs w-24 bg-white"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        const newP = document.getElementById(`pass-${u.username}`).value;
                        if (newP) handleUpdatePassword(u.username, newP);
                        else alert('Digite a nova senha.');
                      }}
                    >
                      <Key className="w-3 h-3 mr-1" /> Alterar
                    </Button>
                    
                    {u.username.toLowerCase() !== 'master01' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="text-xs bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDeleteUser(u.username)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setShowUserModal(false)}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Fechar Painel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}