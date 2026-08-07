import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    const cleanUser = username.trim();

    if (!cleanUser || !password) {
      alert('Preencha todos os campos.');
      return;
    }

    if (cleanUser.toLowerCase() === 'master01' || cleanUser.toLowerCase() === 'admin02') {
      alert('Este nome de usuário é reservado.');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('ventix_users_list') || '[]');
    
    if (existingUsers.some(u => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      alert('Este nome de usuário já existe ou já possui uma solicitação pendente.');
      return;
    }

    // Adiciona o usuário com status pendente de aprovação
    existingUsers.push({
      username: cleanUser,
      password: password,
      role: 'User',
      approved: false // <--- Aguardando liberação do Master01
    });

    localStorage.setItem('ventix_users_list', JSON.stringify(existingUsers));
    alert('Cadastro realizado com sucesso! Sua conta aguarda aprovação do Administrador Master para liberar o acesso.');
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden font-mono bg-slate-950">
      <div className="relative z-10 w-full max-w-md bg-slate-900/60 border border-white/20 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white tracking-wider mb-2">Solicitar Acesso</h1>
          <p className="text-slate-300 text-xs uppercase tracking-widest">
            Ventix - Sistema Integrado
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-slate-200 text-xs uppercase tracking-wider block mb-2 font-semibold">Novo Usuário</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
              <Input 
                type="text" 
                placeholder="Seu usuário" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-950/40 border-white/20 text-white placeholder:text-slate-400 pl-10 h-11 focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-200 text-xs uppercase tracking-wider block mb-2 font-semibold">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950/40 border-white/20 text-white placeholder:text-slate-400 pl-10 h-11 focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
          >
            Enviar Solicitação <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Voltar para o Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}